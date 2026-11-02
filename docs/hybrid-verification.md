# 하이브리드 모드 동적 자리 탐색 (v7.0~)

`globalTierConfig.mode === "hybrid"`일 때 활성. 기존 ELO/자동매칭과 분리된 패러다임:

- **patrick truth**: 사용자 manual_tier + manual_order
- **검증 트리거**: 사용자 편집 행위 (작품 추가/메타 변경/티어 변경/순위 변경) → 검증 큐 INSERT
- **자동 탐색 시퀀스**: 의심작 인접 후보 점진 매칭 → 변곡점(승패 변동) 발견 → K=2 추가 검증 → 자리 결정
- **수문장 식별**: 시퀀스 내 첫 변곡점 작품 + 5개 누적 시퀀스 통계 → 제안 모달 (1단계 위/아래 변경 버튼)
- **시스템/사용자 path 분리**: finalize의 manual_order/tier UPDATE는 트리거 X (무한 루프 방지)
- **매칭 탭 분기**: hybrid → HybridVerificationView (검증 시퀀스 UI), 그 외 → 기존 ELO 매칭

신규 헬퍼 함수:
- DB/판정: `detectViolation`, `enqueueVerification`, `getCandidatesForVerification`, `backfillManualOrder`, `getNextVerificationTarget`
- 시퀀스: `findInflectionPoint`, `evaluateSequenceProgress`, `computeNewPosition`, `finalizeVerificationSession`, `logVerificationMatch`, `getGatekeeperCandidates`

검증 예산 (v7.59.10~ **상수가 아니라 `suspicionConfig` 설정값**):
- `gallopMax` (5~8, 기본 7) — 갤로핑 경계탐색 probe 상한. 설정 '한 작품 점검 길이'.
- `VERIFICATION_BINARY_MAX = 4` (고정) — 경계 발견 후 이진 정제 예산.
- 파생: `verificationMaxResponses()` = gallopMax + 4 (기본 11) · `verificationCandidatePool()` = **2^(gallopMax−1)** (기본 64).
  ⚠️ probe 인덱스는 0,1,3,7,15,31,63… (`next = lo + jump`, jump는 *다음* 라운드용으로 2배) → g회에 2^(g−1)−1까지만 닿는다. `2^g−1`이 아니다.
- `gatekeeperThreshold` (2~5, 기본 3) — 수문장 제안 임계. `decay` (0.5~0.95, 기본 0.85, 읽는 쪽 하한 가드).
- 진행 중 세션은 `session.limits` 스냅샷으로 끝까지 간다 (런타임 변경은 다음 세션부터). 없으면 `limitsOf()`가 현재 설정으로 폴백.
- 구 상수 `VERIFICATION_MAX_RESPONSES` · `VERIFICATION_CANDIDATE_POOL`은 **제거됨**(파생 함수가 유일한 진실원천).

기타 상수: `VERIFICATION_K_AFTER_INFLECTION = 2` (코어 루프 미사용 — 진단/하위호환 잔존), `VERIFICATION_PRIORITY` (gatekeeper=5, tier_change=4, order_change=3, new=2, meta_edit=1)

CRUD 트리거 hook 위치 (App.jsx, hybrid 모드만):
- `addNovel` (manual_tier 설정 시): `new` / `underrated`
- `saveEdit`: manual_tier 변경 시 방향 판정으로 `tier_change`, 그 외 메타 변경 시 `meta_edit`
- `batchSetTier`: 작품별 prev 캡처 후 방향 판정으로 `tier_change`
- 인라인 티어 칩(순위 탭): `tier_change`
- `swapRating(▲/▼)`: `order_change`

Stage 5 모드별 동작:
- TasteAnalysisScreen: 매칭/심화 그룹 비활성 (`!isHybridMode && isGroupExpanded(...)`), 통계/장르/좌표계/스펙트럼만 표시
- AwardsScreen: hybrid에서 `compareNovels` (manual_tier+order) 정렬, 점수에서 ELO rating 항 비활성, 표시도 "{tier} #{order}"
