# 웹소설 티어 랭킹 앱 (Novel Tier Ranking)

Expo React Native (SDK 54) 기반 웹소설 티어 랭킹 앱.
ELO 매칭 시스템으로 작품 간 대전을 통해 자동으로 티어를 산출한다.

## 아키텍처

- **단일 파일 구조**: `App.jsx` (~78,300줄, v7.58.4 기준) 하나에 모든 로직이 들어있음
- **SQLite** (expo-sqlite, WAL 모드) — 33+ 테이블 (v7.0: tier_verification_queue, tier_validation_log, tier_repositioning_session 추가)
- **다중 슬롯**: 최대 10개 독립 데이터셋, 슬롯별 별도 DB 파일

## v7.0 하이브리드 모드 동적 자리 탐색 시스템 (Stage 1~5 완료)

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

신규 상수: `VERIFICATION_GALLOP_MAX = 7` + `VERIFICATION_BINARY_MAX = 4` → `VERIFICATION_MAX_RESPONSES = 11` (v7.20.11~ 갤로핑 경계탐색 + 이진 정제 분리 예산), `VERIFICATION_K_AFTER_INFLECTION = 2` (코어 루프 미사용 — 진단/하위호환 잔존), `VERIFICATION_PRIORITY` (gatekeeper=5, tier_change=4, order_change=3, new=2, meta_edit=1)

CRUD 트리거 hook 위치 (App.jsx, hybrid 모드만):
- `addNovel` (manual_tier 설정 시): `new` / `underrated`
- `saveEdit`: manual_tier 변경 시 방향 판정으로 `tier_change`, 그 외 메타 변경 시 `meta_edit`
- `batchSetTier`: 작품별 prev 캡처 후 방향 판정으로 `tier_change`
- 인라인 티어 칩(순위 탭): `tier_change`
- `swapRating(▲/▼)`: `order_change`

Stage 5 모드별 동작:
- TasteAnalysisScreen: 매칭/심화 그룹 비활성 (`!isHybridMode && isGroupExpanded(...)`), 통계/장르/좌표계/스펙트럼만 표시
- AwardsScreen: hybrid에서 `compareNovels` (manual_tier+order) 정렬, 점수에서 ELO rating 항 비활성, 표시도 "{tier} #{order}"

## 빌드/실행

```bash
npx expo start          # 개발 서버
eas build -p android --profile preview  # APK 빌드
```

## App.jsx 섹션 맵

> 줄 번호는 근사값. 정확한 위치는 섹션 마커 `═══`이나 함수명으로 검색할 것.
> **전체를 읽지 말고, 아래 맵을 참고하여 offset/limit으로 필요 섹션만 읽을 것.**
> ⚠️ 이 맵은 파일이 ~41,400줄이던 시점 작성 — 현재 ~78,300줄이라 **후반부(매칭 엔진·hybrid 검증·AI 태깅·웹 추천·설정 JSX)는 맵에 없다**. 그 영역은 `docs/hollow-fix-roadmap.md` 작업 카드의 줄번호나 함수명 Grep으로 찾을 것.

| 줄 범위 (약) | 섹션 | 검색 키워드 |
|---|---|---|
| 1-2440 | 헤더 문서 (v7.0 + v6.2 + ... 버전 히스토리, 불변규칙, 버그 수정 기록) | `╔══`, `불변조건` |
| 2441-2470 | import 선언 | `import React` |
| 2470-2560 | 글로벌 변수/ErrorBoundary/슬롯 시스템 | `ErrorBoundary`, `slotSystem` |
| 2560-2780 | 슬롯 CRUD, DB 슬롯 전환, flush | `슬롯 생성`, `슬롯 전환` |
| 2780-2880 | DB 초기화 (openDb, initDb), backfillManualOrder | `데이터베이스 초기화`, `openDb`, `backfillManualOrder` |
| 2880-3150 | 성능 모니터링 시스템 | `Performance Monitor`, `perfMonitor` |
| 3150-3450 | safeDbOperation + 매칭 큐 시스템 | `safeDbOperation`, `matchQueue` |
| 3450-3920 | DB 유틸리티 (exec, all, first, execBatch, 마이그레이션) | `ensureColumn`, `migration` |
| 3920-4520 | 취향 분석 시스템 (analyzePreferences, preference_patterns) | `analyzePreferences`, `preference_patterns` |
| 4520-4670 | 티어 시스템 상수 (TIER_ORDER, DEFAULT_TIER_SYSTEM_CONFIG, TIER_PRESETS) | `TIER_ORDER`, `TIER_PRESETS` |
| 4670-4810 | 티어 헬퍼 함수 (getTierColor, tierFromRating, **detectViolation**, **enqueueVerification**, **getCandidatesForVerification**) | `detectViolation`, `enqueueVerification` |
| 4810-5030 | 순수 유틸리티 (uuid, safeParseJSON, parsePlatforms 등) | `uuid()`, `safeParseJSON` |
| 4950-5090 | 장르/태그 파싱, 통계 헬퍼 | `getWinRate`, `wilsonConfidence` |
| 5090-5360 | 색상 상수(C), 플랫폼/상태 옵션, 대형 장르 상수 | `const C =`, `PLATFORM_OPTIONS` |
| 5360-5870 | 태그 상수 (MAJOR_GENRES, SUB_GENRES, ALL_GENERAL_TAGS) | `MAJOR_GENRES`, `SUB_GENRES` |
| 5870-6910 | 태그 관련 유틸리티 (WORK_IDENTIFIERS, TAG_ALIASES 등) | `WORK_IDENTIFIERS`, `TAG_ALIASES` |
| 6910-7510 | 스펙트럼/좌표계, ELO 계산 | `SPECTRUM_GROUPS`, `expected()`, `applyElo` |
| 7510-8460 | 백업/복원 시스템 (JSON v9) | `exportAllData`, `importBackup` |
| 8460-9500 | UI 기본 컴포넌트 (Chip, PrimaryButton, TierTag, GenreBadge 등) | `const Chip = memo`, `TierTag` |
| 9500-12200 | NovelCard + TagSelectModal | `const NovelCard = memo` |
| 12200-12890 | SearchTagModal, TagEditModal | `SearchTagModal`, `TagEditModal` |
| 12890-13700 | TagRelationModal, CoordinateGridView | `TagRelationModal`, `CoordinateGridView` |
| 13700-15160 | TagManagerModal | `TagManagerModal` |
| 15160-15220 | PlatformChips | `PlatformChips` |
| 15220-16960 | AwardsScreen | `AwardsScreen` |
| 16960-17080 | 차트 컴포넌트 (BarChart, RadarChart, PieChart, Heatmap) | `BarChart`, `RadarChartSimple` |
| 17080-20300 | TasteAnalysisScreen | `TasteAnalysisScreen` |
| 20300-41400 | App() 메인 컴포넌트 (useState ~200개, useEffect, 매칭 엔진, CRUD, 모든 탭 JSX) | `export default function App` |
| 41400-41427 | App() export | `export default` |

## 절대 준수 규칙 (App.jsx 11-42줄)

매칭 시스템 5대 불변조건 — **위반 시 크래시/데이터 오염 발생**:

1. **자동매칭 중 Alert.alert() 호출 금지** — `isAutoMatchingRef.current === true`일 때 Alert 금지
2. **매칭 큐 내부에서 React state 직접 참조 금지** — 스냅샷만 사용 (stale closure 방지)
3. **큐 외부 write 타이머는 flush 전 queue drain 대기** — `waitForMatchQueueDrain()` 호출 필수
4. **SQLITE_BUSY 시 resetDbConnection 금지** — 경합은 jitter 재시도만, 연결 오류와 분리
5. **자동매칭 루프는 모든 비동기 경로에 catch/finally 강제** — 누락 시 unhandled rejection 크래시

## 진행 중인 작업 목록

- **사용자가 "다음 작업 진행해줘"(또는 유사 문구)라고 하면** → `docs/hollow-fix-roadmap.md`를 열고
  그 문서의 **세션 프로토콜**을 그대로 따를 것: 순서표의 첫 ⬜ 작업 선택 → 전제 사전 검증(설계 맹신 금지,
  줄번호는 코드 문자열 Grep으로 재확인) → 구현 → 사후 검증(esbuild 구문 체크 + 완료 기준) → 기록(버전 히스토리·
  순서표 상태·감사 체크박스) → 커밋/푸시. 전제가 깨져 있으면 구현하지 말고 설계부터 수정한다.
- `docs/hollow-fix-roadmap.md` — 감사 47건의 **실행 로드맵** (2차 재검증 반영, Phase별 작업 카드).
- `docs/hollow-feature-audit.md` — **'있으나 마나 한 기능' 감사 47건** (v7.58.4 시점, 증거 원본).
  죽은 코드가 아니라 '코드는 도는데 실질 가치가 없거나·반쪽이거나·하드코딩된' 항목들.
  ⚠️ 1차 감사는 기각 0건이라 판정을 그대로 신뢰하면 안 된다. 2차 재검증 결과와 항목별 판정 변경은
  로드맵의 '재검증 요약'에 있다 — 그래도 고치기 전에 해당 줄을 직접 열어 확인할 것.

## 개발 지침

- 새 기능 추가 시 해당 섹션의 기존 패턴을 먼저 읽고 동일 패턴으로 작성
- DB 작업은 반드시 `safeDbOperation` 래퍼 사용
- 현재 단일 파일 구조 — 새 파일 생성 불필요, App.jsx 내에서 작업
- memo() 컴포넌트는 props 변경에만 리렌더링됨을 고려하여 설계
- App.jsx 수정 시 반드시 헤더 버전 히스토리 (1~290줄) 업데이트: 버전 번호 증가, 날짜 갱신, 변경 내역 추가

## Git 워크플로

- 개발은 작업 브랜치에서, **주요 업데이트(기능 추가/버그 수정 묶음/버전 올림) 완료 시마다 `main`에 병합**한다 (빌드는 `main`에서 수행 — `package.json` build 스크립트가 `git checkout main` 사용).
- **병합은 PR(Pull Request)로 한다** (2026-08-02 사용자 지정). 작업 브랜치에 커밋 → PR 생성(base `main`) → GitHub에서 병합.
  로컬 `git merge` 후 `main`에 직접 push하지 않는다 — PR이 없으면 GitHub에 보라색 `Merged` 배지도, 리뷰·논의 이력도 남지 않는다.
  (v7.59.5/v7.59.6은 이 지정 전이라 직접 병합으로 들어갔다.)
- 병합 후에도 작업 브랜치에서 계속 개발.
