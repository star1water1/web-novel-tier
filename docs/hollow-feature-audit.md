# 있으나 마나 한 기능 감사 (hollow-feature audit)

> 생성 2026-08-02 · 대상 `App.jsx` (v7.58.4 시점) · 총 **47건** (✅CONFIRMED 22 / 🟨PARTIAL 25 / ❌REFUTED 0)
>
> **2차 재검증 2026-08-02**: 잔여 45건 전건을 독립 재대조 — 유지 27 / 수정(서술·개선안 교정) 15 / **기각 3** (`ANA-6` `DAT-7` `HC-5`).
> 실행은 **`docs/hollow-fix-roadmap.md`** (작업 순서표 + 카드별 설계 + 세션 프로토콜)를 따를 것.
> ⚠️ 이 문서의 줄번호는 v7.58.4 확정 직전 캡처라 **현재 코드 대비 전역 +34~+66 밀려 있다** — 로드맵 카드의 줄번호가 현재값이다.


## 이 문서는 무엇인가

"죽은 코드(호출 0)"가 아니라 **코드는 도는데 사용자에게 실질 가치가 없거나, 반쪽이거나,
당연히 커스터마이즈 가능해야 하는데 하드코딩된** 기능을 모은 작업 목록이다.
6개 도메인을 각각 독립 조사한 뒤, **"반박이 기본자세"인 검증자**가 같은 코드를 다시 열어
각 주장을 CONFIRMED / PARTIAL / REFUTED로 재판정했다.

### ⚠️ 손대기 전에 반드시 읽을 것

1. **기각(REFUTED)이 0건이다.** 검증자에게 "확신이 없으면 REFUTED로 기울여라"라고 지시했는데도
   하나도 안 나왔다 — 검증이 충분히 적대적이지 않았을 가능성을 배제하지 못한다.
   **판정을 그대로 믿지 말고, 고치기 전에 해당 줄을 직접 열어 확인할 것.**
2. **🟨 PARTIAL = "주장은 맞지만 영향이 과장됨"**. 심각도는 검증자가 하향 조정한 값이다.
3. 줄 번호는 **v7.58.4 시점** 기준. 이후 편집으로 밀렸을 수 있으니 줄 번호보다
   **인용된 코드 문자열로 grep**할 것.
4. `🔍` 배지 = 사람이 해당 줄을 직접 열어 사실 확인을 마침. 배지가 없으면 **에이전트 주장 + 에이전트 검증**만 거쳤다.
5. 일부는 버그가 아니라 **제품 결정**이다(예: 슬롯 병합 부재, 클라우드 OAuth 발급). 고칠지 말지 판단이 필요하다.
6. 이 목록은 **완전하지 않다.** 6개 도메인만 봤고 각 도메인당 7~8건으로 상한을 뒀다.

### 표기
✅ 검증자 재확인 · 🟨 주장 성립·영향 과장 · 🔍 사람이 직접 확인 · 🔴 높음 / 🟡 중간 / ⚪ 낮음


## 처리 현황 (체크리스트)

| | ID | 심각도 | 제목 |
|---|---|---|---|
| [x] | `AI-1` | 🔴 높음 | ✅ 🔍 커스텀 장르를 하나라도 추가하면 AI에게 보내는 장르 어휘가 '그 커스텀 몇 개'로 붕괴한다 |
| [x] | `AI-3` | 🔴 높음 | ✅ 🔍 '어휘 범위(내 태그만/표준까지/새 태그 허용)' 3분기가 프롬프트에 반영되지 않고, 내 태그는 상위 40개만 전달된다 **✅ v7.59.2 수정(전량 전송 + 폐기 고지)** |
| [x] | `HC-1` | 🔴 높음 | ✅ 커스텀 대/부장르를 1개라도 추가하면 AI 태깅 프롬프트에서 기본 장르 100여 개가 통째로 사라진다 |
| [x] | `REC-4` | 🔴 높음 | ✅ 🔍 콘텐츠 필터(완결만/최소 회차/19금 제외)가 메타 없는 후보를 무조건 통과시켜, 필터를 켜도 조건 위반작이 추천된다 |
| [x] | `AI-2` | 🟡→🔴 | 🟨 🔍 부장르 106개 중 46개(재벌·연예계·의사·용사·육아·메카…)는 slice(0,60)에 잘려 AI에 영원히 전달되지 않는다 — **2차: 긴급 승격.** AI-1 수정(union이 팩토리 우선)으로 커스텀 부장르가 이제 무조건 잘림 → 로드맵 T02 **✅ v7.59.1 수정** |
| [x] | `AI-4` | 🟡 중간 | ✅ 🔍 AI에게 reason(근거)을 받아 놓고 태그 추천 경로에서는 통째로 버린다 **✅ v7.59.3 수정(소비부 6곳 + 신규 행 ↳ / 기존 칩 ⓘ 롱프레스)** |
| [ ] | `AI-5` | 🟡 중간 | 🟨 🔍 유형그룹 AI 자동 분류가 '라벨 문자열'만 보고 판단한다 — 사용자가 이미 그 노드에 넣어 둔 태그를 전혀 안 보낸다 |
| [ ] | `AI-7` | 🟡 중간 | ✅ AI 스캔 결과가 '병합'·'관계 정리' 버튼 한 번에 통째로 사라진다 — 다시 돌리면 다시 과금 |
| [ ] | `ANA-1` | 🟡 중간 | ✅ 수상 확률·자동 추천이 티어 가중 200점에 독점돼 티어 배지의 재표현일 뿐이고, 같은 티어 안에서는 사용자의 manual_order를 완결/재독/태그 보너스가 눌러버린다 |
| [ ] | `ANA-2` | 🟡 중간 | 🟨 취향 분석 최상단 '핵심 취향' 문장이 평점·티어를 전혀 안 쓰고 보유 개수 1위만 읊는다 |
| [ ] | `ANA-3` | 🟡 중간 | ✅ '취향 스펙트럼'의 선호 배지가 평점과 무관한 태그 분포 평균이고, 작품 2개면 표시된다 |
| [ ] | `ANA-4` | 🟡 중간 | 🟨 스펙트럼 6축의 태그 목록이 하드코딩이고 편집 UI가 없으며, 태그 이름을 바꾸면 축이 조용히 비어버린다 |
| [ ] | `ANA-5` | 🟡 중간 | ✅ 🔍 웹 추천의 '취향순' 정렬이 ELO 승률에만 의존해, hybrid/manual 모드에서는 모든 후보 점수가 0이 되어 정렬이 무동작이다 |
| [ ] | `ANA-8` | 🟡 중간 | ✅ '선호 길이' 판정이 100화/400화 하드코딩 버킷 + 최소 표본 0이라, 작품 1개짜리 버킷이 헤드라인 문장을 결정한다 |
| [ ] | `DAT-1` | 🟡 중간 | 🟨 🔍 클라우드 동기화 전체가 빈 상수 하나로 봉인돼 있어 최종 사용자는 절대 켤 수 없다 |
| [x] | `DAT-2` | 🟡 중간 | ✅ push 충돌 감지가 '내가 아는 rev'를 보지 않아, 다른 기기의 변경을 조용히 통째로 덮어쓴다 **✅ v7.59.4 수정(발산 가드 2조건 + 1회 선택 + 무음 경로 배지)** |
| [x] | `DAT-3` | 🟡 중간 | ✅ 자동 동기화로 올라간 스냅샷에는 표지가 아예 없는데, UI는 '표지·갤러리도 함께 백업된다'고 단언한다 **✅ v7.59.5 고지 수정(문구 분기 + 표지 수지 배지 + 완료 Alert 포함/제외). 자동 push 표지 자산화는 T31** |
| [x] | `DAT-4` | 🟡 중간 | 🟨 수동 JSON 백업은 로컬 표지 파일과 갤러리 사진 실체를 담지 않는데 요약은 '갤러리 N장'이라고 표시한다 **✅ v7.59.5 수정(요약 ⚠️ 미포함 고지 + 복원 갤러리 X/Y장 + 백업 화면 안내)** |
| [ ] | `DAT-5` | 🟡 중간 | ✅ 일괄 갱신 실패 리포트가 숫자뿐 — 어떤 작품이 왜 실패했는지 알 수 없고 재시도 경로도 없다 |
| [ ] | `HC-2` | 🟡 중간 | 🟨 스펙트럼 6종은 태그 목록까지 완전 하드코딩 — 형제 기능인 '좌표계'는 사용자가 추가·편집·삭제까지 되는데도 |
| [x] | `HYB-1` | 🟡 중간 | 🟨 검증 큐가 소진보다 빠르게 재생성되어 '완료' 화면에 사실상 도달 불가 **✅ v7.59.7 수정(유입 게이트 pending<10 + swapRating idB 즉시등록 제거)** |
| [x] | `HYB-2` | 🟡 중간 | 🟨 '이 작품 건너뛰기'가 재큐잉을 못 막아, 같은 작품이 다음 세션 직후 다시 올라온다 **✅ v7.59.7 수정(건너뛰기/중단에 baseline 갱신 + 의심도 점검선 아래로)** |
| [ ] | `HYB-3` | 🟡 중간 | 🟨 수문장 'AI 제안' 모달이 방향을 제안하지 않고, 거절 수단도 없어 배지가 영구히 남는다 |
| [ ] | `HYB-5` | 🟡 중간 | ✅ 세션당 최대 11회 비교·후보 풀 64·수문장 임계 3이 전부 상수 — 설정 UI에는 '빈도'만 있고 '길이'가 없다 |
| [x] | `HYB-6` | 🟡 중간 | ✅ 사용자 화면의 '순위 #'가 내부 manual_order 원값이라 3위가 '#300'으로 보이고, 이력의 목적지 번호는 실제와 다르다 **✅ v7.59.8 수정(표시 순위를 티어 내 정렬 위치로 — globalTierPositionMap, 이력은 현재 자리 표기)** |
| [ ] | `REC-1` | 🟡 중간 | 🟨 🔍 넷상 추천 '정렬' 칩 4개가 화면 순서에 전혀 반영되지 않는다 — loadWebReco가 항상 taste_score DESC로 덮어씀 |
| [ ] | `REC-2` | 🟡 중간 | ✅ 🔍 '인기순'/'숨은작' 정렬은 노벨피아 작품에만 popularity가 존재해 사실상 '노벨피아 골라내기'로 동작 |
| [ ] | `REC-3` | 🟡 중간 | 🟨 밴 키워드가 '취향 키워드 풀'에는 적용되지 않아, 기본 설정에서 검색어 3개 중 2개가 밴을 우회한다 |
| [ ] | `REC-5` | 🟡 중간 | 🟨 'AI 키워드 생성' 토글: 매번 LLM을 호출하지만 생성된 2개가 실제 검색어로 뽑힐 확률은 1% 안팎 |
| [ ] | `REC-6` | 🟡 중간 | 🟨 '취향 ↔ 탐험' 슬라이더가 취향 점수엔 관여하지 않고 하드코딩된 8개 카테고리 버킷만 재조정하며, 배정이 UI 설명과 반대다 |
| [ ] | `REC-8` | 🟡 중간 | ✅ 취향 승률 백분율이 표본 5건에서도 그대로 노출되고, 코드가 내세운 sample_size>=3 게이트는 win_rate가 NULL이라 아무 의미가 없다 |
| [ ] | `AI-6` | ⚪ 낮음 | ✅ AI 유의어 후보는 신뢰도가 항상 85%, 표본이 항상 0으로 표시된다 |
| [ ] | `AI-8` | ⚪ 낮음 | 🟨 AI 유의어 후보에 '이미 같은 유의어 그룹인 쌍' 필터가 빠져 있고, 좌우가 뒤집힌 중복 카드가 생긴다 |
| ⊘ | `ANA-6` | ⚪ 낮음 | 🟨 태그 '농도(intensity)' 가중치가 기본값 3 탓에 사실상 전원 1.0 — **2차 기각**: 설정 시 실동작(0.33~1.67)·되먹임 경로 실존(requireIntensityTuning). 로드맵 부록 참조 |
| [ ] | `ANA-7` | ⚪ 낮음 | 🟨 '상위 티어 집중도'가 표본 2~3에서 '상위 100% (N=2)'를 순위로 내보내고, 계산해 둔 윌슨 신뢰구간은 화면에 안 쓴다 |
| [ ] | `DAT-6` | ⚪ 낮음 | 🟨 멀티링크 정본화가 근거(권위 링크·재출간 판정)를 계산해 놓고 버려서, 회차·완결일이 왜 그 값이 됐는지 볼 수 없다 |
| ⊘ | `DAT-7` | ⚪ 낮음 | 🟨 슬롯이 10개인데 슬롯 간 작품 이동·병합 수단이 없고, 유일한 반입 경로는 전량 삭제 후 교체다 — **2차 기각**: hollow가 아니라 미구현 기능 요구 → 로드맵 T32 🅓로 재분류. **v7.59.5에서 최소 조치(전량 교체임을 도움말·최종 확인·백업 화면에 명시)만 반영** |
| [x] | `DAT-8` | ⚪ 낮음 | 🟨 하이브리드 검증 이력·대기 큐가 백업에서 조용히 잘려나가고, 잘렸다는 사실이 어디에도 표시되지 않는다 **✅ v7.59.6 수정(RS blocker 필터 제거 + 수문장 우선 정렬로 통계 무회귀, payload.TRC 절단 수치 고지 — 요약·복원 Alert 양쪽)** |
| [ ] | `HC-3` | ⚪ 낮음 | 🟨 하이브리드 모드의 핵심 UX인 '검증 질문 최대 11회'와 '수문장 기준 3'이 설정 불가 — 같은 화면의 자동매칭/의심도는 임계값을 전부 노출 |
| [ ] | `HC-4` | ⚪ 낮음 | 🟨 의심도 설정 8개 필드 중 decay·cap만 스테퍼가 없어, 프리셋을 누를 때 몰래 바뀌고 되돌릴 방법이 없다 |
| ⊘ | `HC-5` | ⚪ 낮음 | 🟨 티어 임계값·자동승인 승수까지 편집시키면서, 그 임계값에 도달하는 속도(K/RD)와 시작 점수 1500은 상수 — **2차 기각**: 결합 계수라 노출이 유해(레이팅 이력 비교성 붕괴). 범위 경고만 로드맵 T33 선택 항목 |
| [ ] | `HC-6` | ⚪ 낮음 | ✅ 작품 약칭 21개(WORK_IDENTIFIERS)는 1회성 마이그레이션에서만 쓰여, 신규 사용자에겐 영구히 무효 |
| [ ] | `HC-7` | ⚪ 낮음 | ✅ 플랫폼은 무제한 추가 가능하다고 안내하면서, 일괄 지정 UI는 앞 8개만 노출한다 |
| [ ] | `HYB-4` | ⚪ 낮음 | 🟨 수문장 모달의 '한 단계 아래' 강등이 실제로는 하위 티어 최하위로 처박는다 |
| [x] | `HYB-7` | ⚪ 낮음 | ✅ 티어를 지우면 절대 검증될 수 없는 큐 항목이 등록되어, '대기' 숫자만 올랐다가 '완료'로 자동 소멸한다 **✅ v7.59.7 수정(티어클리어 enqueue→의심도 가산, no_candidates 큐는 cancelled)** |
| [x] | `HYB-8` | ⚪ 낮음 | ✅ 사용자가 직접 찍은 🔍 의심 표시(priority 3)가 자동 티어 변경(4)보다 우선순위가 낮다 **✅ v7.59.7 수정(큐 ORDER 1순위에 user_flagged_suspect — 3곳)** |
| [ ] | `REC-7` | ⚪ 낮음 | 🟨 넷상 추천작이 자정에 통째로 삭제되며 보존 기간을 바꿀 설정이 없다 (WEB_RECO_TTL_DAYS 상수는 참조조차 안 됨) |

## 이미 처리됨

| 버전 | 항목 | 내용 |
|---|---|---|
| v7.58.4 | `AI-1` `HC-1` | 커스텀 장르를 하나만 추가해도 AI 장르 어휘가 붕괴하던 문제. 단건·배치 두 경로를 '활성 모드 팩토리 + 사용자 추가분 합집합'으로 교체. 웹툰 슬롯이 소설 장르로 폴백하던 것도 함께 해결 |

## 우선순위 제안


투자 대비 효과 순. 따를 의무는 없다.

1. **`REC-4` 콘텐츠 필터가 메타 없는 후보를 통과** — 사용자가 "걸렀다"고 믿는데 안 걸러진다. *속이는* 종류라 최우선.
2. **`AI-3` 어휘 범위 3분기 실질화 + 버려진 개수 고지** — '내 태그만'과 '표준까지'가 같은 프롬프트다. 고른 설정이 무의미하다.
3. **`AI-4` reason 표시** — 이미 과금 중인 토큰을 화면에 띄우기만 하면 된다. 추가 비용 0.
4. **`HYB-1` 검증 큐 발산** — 하이브리드의 핵심 루프가 끝을 볼 수 없는 구조다. 설계 판단 필요.
5. **`DAT-2` push 충돌 / `DAT-3` 백업 고지 불일치** — 데이터 손실 위험. 빈도는 낮지만 결과가 무겁다.
6. **`DAT-1` 클라우드 동기화 봉인** — 코드 문제가 아니라 OAuth 클라이언트 ID 발급이라는 제품 결정.


---

## 하이브리드 모드 (v7.0 동적 자리 탐색)


### `HYB-1` 검증 큐가 소진보다 빠르게 재생성되어 '완료' 화면에 사실상 도달 불가

🟨 PARTIAL · 🟡 중간 · 사실상 미동작


**증거**

> App.jsx:37892 `await detectAutomaticSuspects(suspicionNovel.id);` — finalize마다 무조건 호출. 그 안(37955~37964)은 `... LIMIT 5` 로 최대 5건을 `enqueueVerification(r.id, "auto_detected", direction, "system_inference")`(37982) 등록. 즉 세션 1건 소진(37860 `state='resolved'`) ↔ 최대 5건 신규. 여기에 사용자 CRUD도 겹침: swapRating은 ▲/▼ 한 번에 두 작품을 등록한다 — 55996 `enqueueVerification(idA, "order_change", ...)` + 55999 `enqueueVerification(idB, inverseSuspicion, ...)`. 추가로 finalize 자신이 37885 `enqueueVerification(suspicionNovel.id, "continue", ...)`로 같은 작품을 되등록. 반면 '완료' 빈 화면은 62907 `verificationStats.pending === 0` 일 때만 뜬다(62910 "모든 검증이 완료되었습니다").


**왜 있으나 마나인가** — 검증 1건을 끝내는 데 최대 11번 비교(37594 VERIFICATION_MAX_RESPONSES=11)를 요구하면서 그 대가로 최대 5건을 새로 만든다. 순위를 손으로 정리하는 사용자(하이브리드의 주 사용층)는 ▲를 20번 누르면 그것만으로 pending이 20건 넘게 쌓인다. 큐는 구조적으로 발산한다.


**사용자가 보는 손해** — 매칭 탭 '대기' 숫자가 아무리 답해도 줄지 않고 늘어난다. 62910의 '모든 검증이 완료되었습니다' 축하 화면은 라이브러리가 아주 작지 않은 한 사용자가 볼 수 없다. 끝이 없으니 사용자는 어느 시점에 그만둬야 하는지 판단할 근거가 없고, 결국 탭 자체를 안 들어가게 된다.


**개선안** — ① detectAutomaticSuspects의 자동 등록을 '큐가 비었을 때만' 또는 'pending 총량 < N일 때만' 실행하도록 게이트(현재 pending COUNT를 먼저 조회해 상한 적용). ② swapRating은 이동 주체(idA)만 등록하고 idB는 생략하거나, 연속 ▲▼를 하나의 세션으로 코얼레스. ③ 매칭 탭에 '오늘 점검 목표 N건 달성' 같은 유한한 종료 지점을 만들어 사용자가 끝을 볼 수 있게 할 것.


<details><summary>검증자 재확인 노트</summary>

인용 줄번호는 모두 실재 확인: 37892 detectAutomaticSuspects(suspicionNovel.id) 무조건 호출, 37955~37964 LIMIT 5 + 37982 enqueueVerification(auto_detected), 37860 state='resolved', 55996/55999 swapRating 양쪽 enqueue, 62907/62910 pending===0 조건. 재생성 메커니즘 자체는 CONFIRMED. 그러나 '구조적 발산'은 REFUTED: (a) enqueueVerification 37453~37463이 novel_id별 pending 1건 UPSERT라 큐 길이는 라이브러리 작품 수를 절대 넘지 못한다(발산 불가, 상한 존재). (b) 37960 `q.id IS NULL`로 이미 pending인 작품은 재등록 대상에서 제외. (c) 37974~37976 v7.28.6 baseline 가드(total > baseline) + 37854~37857 finalize의 baseline=count 갱신으로 방금 처리한 작품의 쏠림 재검출이 차단됨. (d) 37835~37844 decay(기본 0.85)가 매 finalize마다 전 작품 suspicion_score를 곱해 trigBySusp 경로도 자연 감쇠. (e) 37885 'continue' 재등록은 무조건이 아니라 action==='moved' && stopReason==='max' && findInflectionPoint===-1 3중 조건부라 '같은 작품 되등록'은 과장. 실제 손해는 '큐가 잘 안 비고 잔여가 계속 트리클로 남는다' 수준이지 무한 증식이 아님 → severity 하향.

</details>


### `HYB-2` '이 작품 건너뛰기'가 재큐잉을 못 막아, 같은 작품이 다음 세션 직후 다시 올라온다

🟨 PARTIAL · 🟡 중간 · 사실상 미동작


**증거**

> 건너뛰기 경로(62883~62885)는 큐 row만 `state='skipped'`로 바꾸고 `UPDATE novels SET user_flagged_suspect=0` 만 실행한다. verification_baseline도 suspicion_score도 손대지 않는다. 반면 정상 finalize는 37854~37857에서 `UPDATE novels SET verification_baseline = verification_count`, 37847~37850에서 `user_flagged_suspect=0, suspicion_score=0`을 함께 수행한다. detectAutomaticSuspects의 재검출 조건(37959)은 `(verification_count >= 3 AND verification_count > COALESCE(verification_baseline,0)) OR COALESCE(suspicion_score,0) >= ?` 이고, 37976 `total > baseline`, 37977 `susp >= checkLine`이다.


**왜 있으나 마나인가** — 건너뛰기가 해제하는 것은 🔍 플래그뿐이라, 애초에 그 작품을 큐에 올린 실제 조건(count>baseline 쏠림, suspicion_score≥점검선)이 그대로 남는다. 다른 작품 검증이 하나만 끝나도 그 finalize 끝의 detectAutomaticSuspects가 같은 작품을 즉시 다시 등록한다. 버튼은 '이번 한 번 미루기'조차 되지 못한다.


**사용자가 보는 손해** — 사용자가 '이 작품은 지금 자리가 맞다'고 건너뛰어도 몇 분 뒤 같은 작품이 또 나온다. 시스템이 사용자의 판단을 기억하지 않는다는 인상을 주고, 큐 발산(위 항목)을 가속한다.


**개선안** — 건너뛰기/시퀀스 중단 경로에도 finalize와 동일하게 `verification_baseline = verification_count` 갱신과 `suspicion_score=0`(또는 checkLine 미만으로 감쇠)을 적용하고, 선택적으로 skipped_until 타임스탬프를 둬 일정 기간 재큐잉 제외.


<details><summary>검증자 재확인 노트</summary>

62883~62885 확인: state='skipped' + user_flagged_suspect=0만 실행, verification_baseline/suspicion_score 미갱신. 대조군 37847~37850(flag/susp 리셋), 37854~37857(baseline=count)도 확인. 재큐잉 조건 37959/37976/37977도 인용대로다. 다만 '항상 즉시 되돌아온다'는 과장: 재등록은 detectAutomaticSuspects 조건(count>=3 && skew>=0.6 && count>baseline, 또는 susp>=checkLine)을 만족하고 ORDER BY 상위 5위 안에 들 때만 발생한다. tier_change/order_change/new/user_flag로 들어온 항목은 트리거가 1회성 편집이라 건너뛰면 실제로 다시 안 올라온다. 진짜 문제 케이스는 세션 도중 몇 판 답하고 건너뛴 경우 — 54099 logVerificationMatch가 응답마다 verification_count를 올리므로 count>baseline이 참이 되고 쏠림이 크면 다음 finalize에서 재등록이 사실상 확정된다. 이 좁은 경로에 한해 CONFIRMED, 전체 주장은 PARTIAL.

</details>


### `HYB-3` 수문장 'AI 제안' 모달이 방향을 제안하지 않고, 거절 수단도 없어 배지가 영구히 남는다

🟨 PARTIAL · 🟡 중간 · 가치 없음


**증거**

> 모달 안내문(62946~62947) "이 작품들은 여러 비교에서 경계로 작용했습니다. AI는 한 단계 위/아래 이동을 제안합니다." 그리고 62970~63042는 ⬆️(higher)와 ⬇️(lower) 버튼을 **둘 다** 무조건 렌더한다 — 어느 쪽을 권하는지 표시가 없다. 집계 쿼리(38175~38181)는 `SELECT blocker_id, COUNT(*) ... GROUP BY blocker_id`만 하고, 방향을 결정할 수 있는 `tier_repositioning_session.suspicion_type`(37805에 저장됨)은 전혀 읽지 않는다. 후보를 목록에서 빼는 유일한 경로는 62989/63026의 `UPDATE tier_repositioning_session SET blocker_id=NULL WHERE blocker_id=?`인데, 이는 ⬆️/⬇️ 티어 변경을 실제로 수락했을 때만 실행된다. '무시/유지' 버튼은 없다.


**왜 있으나 마나인가** — 'AI 제안'이라는 이름을 달고 있지만 실제로 제안하는 내용은 '이 작품 자리를 바꿔보세요' 뿐이고, 위인지 아래인지는 사용자가 정한다. 사용자는 순위 탭 인라인 티어 칩(65164)으로 똑같은 조작을 이미 할 수 있으므로 기능이 더해주는 정보가 0이다. 게다가 제안에 동의하지 않으면 배지를 없앨 방법이 없다.


**사용자가 보는 손해** — 매칭 탭에 노란 '🤖 AI 제안 N' 배지가 계속 떠 있는데, 열어보면 판단 근거는 '변곡점 등장 횟수'(62960) 하나뿐이고 결정은 사용자 몫이다. 동의하지 않는 사용자는 티어를 바꾸기 전까지 이 배지를 영구히 달고 살아야 한다(=알림 피로).


**개선안** — ① 해당 blocker가 등장한 세션들의 suspicion_type을 집계해 '위로 오르려던 작품 N개를 막음 → 이 작품이 저평가일 가능성' 식으로 방향을 하나로 결정해 버튼 1개만 강조. ② '이 제안 무시' 버튼을 추가해 blocker_id를 NULL 처리(또는 dismissed 마킹)하고 배지에서 제거.


<details><summary>검증자 재확인 노트</summary>

62936~63052 전체를 읽어 확인: 62946~62947 안내문, 62970/63007에서 higher/lower 버튼이 조건 없이 둘 다 렌더(어느 쪽 권장인지 표시 없음), 38175~38181 집계 쿼리가 blocker_id COUNT만 하고 37805에 저장되는 suspicion_type을 읽지 않음, 후보 제거는 62989/63026의 blocker_id=NULL(수락 시에만)뿐이고 '무시/유지' 버튼 부재 — 여기까지 전부 CONFIRMED. 그러나 'no_value / 정보가 0'은 REFUTED: 62960이 표시하는 block_count(변곡점 등장 횟수)는 tier_repositioning_session 집계로만 나오는 값이라 순위 탭 인라인 칩(65160 부근)으로는 얻을 수 없는 정보다. 또 배지는 앱 전역 알림이 아니라 hybrid 매칭 탭 현황 섹션의 칩 하나(62670 부근)라 '알림 피로'도 과장. 방향 미제안 + 거절 불가는 실제 결함이므로 severity medium 유지.

</details>


### `HYB-5` 세션당 최대 11회 비교·후보 풀 64·수문장 임계 3이 전부 상수 — 설정 UI에는 '빈도'만 있고 '길이'가 없다

✅ CONFIRMED · 🟡 중간 · 하드코딩


**증거**

> 37592~37594 `const VERIFICATION_GALLOP_MAX = 7; const VERIFICATION_BINARY_MAX = 4; const VERIFICATION_MAX_RESPONSES = VERIFICATION_GALLOP_MAX + VERIFICATION_BINARY_MAX;`, 37602 `const GATEKEEPER_BLOCK_THRESHOLD = 3;`, 37605 `const VERIFICATION_CANDIDATE_POOL = 64;`, 37599 `const VERIFICATION_REREAD_PROMOTE_MIN = 3;`. 이 이름들은 코드에서만 참조되고(54032, 54142, 62746 등) 설정 화면에는 없다. 유일한 하이브리드 설정 섹션인 '🔍 의심도 민감도'(68832~68856)의 스테퍼는 moveBase/moveWindow/matchBase/upsetBase/upsetPerGap/checkLine 6개뿐이며, DEFAULT_SUSPICION_CONFIG의 `decay: 0.85`(38008)조차 스테퍼가 없다(프리셋으로만 간접 변경).


**왜 있으나 마나인가** — 설정은 '얼마나 자주 점검할지'만 조절할 수 있고 '한 번 점검이 얼마나 오래 걸릴지'는 못 건드린다. 사용자가 체감하는 피로의 대부분은 후자(한 작품당 최대 11번 비교)인데 그게 잠겨 있어 민감도 설정이 반쪽짜리가 된다.


**사용자가 보는 손해** — '점검이 너무 길다'고 느끼는 사용자에게 남은 선택지는 매번 '시퀀스 중단'을 누르는 것뿐이다(그마저 위 항목대로 재큐잉된다). 반대로 정밀도를 원하는 사용자는 풀을 넓힐 수 없다. 자기보정 감쇠(decay)도 직접 조절 못 해 큐 발산을 사용자가 완화할 수단이 없다.


**개선안** — '의심도 민감도' 섹션에 '한 작품당 최대 비교 횟수'(GALLOP/BINARY 합산, 예: 5/8/11 프리셋)와 'AI 제안 임계(수문장 누적 횟수)' 스테퍼를 추가하고, decay 스테퍼도 노출. 상수는 globalSuspicionConfig처럼 module-global로 승격해 런타임 반영.


<details><summary>검증자 재확인 노트</summary>

37592~37594(GALLOP 7 + BINARY 4 = 11), 37599(REREAD_PROMOTE_MIN 3), 37602(GATEKEEPER_BLOCK_THRESHOLD 3), 37605(CANDIDATE_POOL 64) 전부 인용대로 존재. 참조처는 37660/37698/37701/37707/37708(로직), 54032/54142/54177/62994/63030(호출), 62746/62750/72453(표시)뿐이고 `grep appSettings.(verif|gatekeeper|pool)` 결과 0 — 설정 경로가 실제로 없음. 68810~68857 하이브리드 설정 섹션도 인용대로 moveBase/moveWindow/matchBase/upsetBase/upsetPerGap/checkLine 6개 스테퍼뿐이고 decay(38008=0.85)는 프리셋(38013~38015)으로만 바뀐다. 유일한 감점 요소: 실제 세션은 37670(infIdx===0 → rejected), 37687, 37705(hi-lo<=1 → decisive)로 조기 종료가 흔해 11회는 상한이지 평시 길이가 아니다 — 그래도 '길이 조절 수단 부재'라는 주장 자체는 그대로 성립.

</details>


### `HYB-6` 사용자 화면의 '순위 #'가 내부 manual_order 원값이라 3위가 '#300'으로 보이고, 이력의 목적지 번호는 실제와 다르다

✅ CONFIRMED · 🟡 중간 · 품질 미흡


**증거**

> rebalanceTierOrder(38128~38132)는 `manual_order = (i + 1) * 100`으로 100 단위 값을 부여한다. 그런데 사용자 화면은 이 값을 그대로 '순위'로 출력한다: 62841 `순위 #{cand.manual_order || 0}`(검증 매칭 카드), 62960 `... · 순위 #{g.manual_order || 0}`(수문장 모달), 65288 `{opp.author} · 순위 #{opp.manual_order || 0}`, 32354/32061/32762 `${getTierLabel(...)} #${novel.manual_order || 0}`(어워드). 게다가 자동 조정 이력(62712)은 `→ ${getTierLabel(h.result_tier)} #${h.result_order ?? "?"}`로 **rebalance 이전** 값을 출력하는데, computeNewPosition은 37756 `Math.floor((passedOrder + blockerOrder) / 2)`(예: 150) 또는 37759 `passedOrder - 50`(예: 50) 같은 중간값을 낸다.


**왜 있으나 마나인가** — 표시되는 숫자가 사용자가 이해할 수 있는 어떤 단위도 아니다. 티어 3번째 작품이 '#300', 방금 이동한 작품 이력은 '#150'인데 화면에는 '#200'으로 나타난다. 숫자를 보여주는 목적(자리 파악)을 달성하지 못한다.


**사용자가 보는 손해** — 검증 매칭 화면에서 상대 작품의 '순위 #700'을 보고 그게 7번째인지 700번째인지 알 수 없어, 비교 판단에 쓸 맥락이 되지 못한다. 자동 조정 이력의 '→ S #150'은 순위 탭에 존재하지 않는 번호라 시스템이 뭘 했는지 검증할 수 없다.


**개선안** — 표시용 순위는 항상 `Math.round(manual_order / 100)` 또는 티어 내 인덱스+1로 변환하는 헬퍼(getDisplayRank)를 만들어 62841/62960/65288/32354/62712에 일괄 적용. 이력은 finalize 후 rebalance된 최종 manual_order를 세션 row에 다시 기록하거나 표시 시점에 현재 값을 조회.


<details><summary>검증자 재확인 노트</summary>

38128~38132 rebalanceTierOrder가 manual_order=(i+1)*100을 부여하는 것 확인 → 3번째 작품은 300. 이 값을 그대로 '순위 #'로 출력하는 지점 전부 확인: 62841(검증 매칭 후보 카드), 62960(수문장 모달), 65288(배치 상대 카드), 32061/32354/32762(어워드 '{tier} #{manual_order}'). 이력 stale 번호도 확인: 37799~37818 세션 INSERT가 result_order=newPos.order(37756 중간값 or 37759 ±50)를 저장하고, rebalanceTierOrder는 37866 execBatch 이후 37872에서야 돌기 때문에 62712와 53816의 `#{h.result_order}`는 rebalance 후 DB에 존재하지 않는 번호다. 두 주장 모두 코드로 성립.

</details>


### `HYB-4` 수문장 모달의 '한 단계 아래' 강등이 실제로는 하위 티어 최하위로 처박는다

🟨 PARTIAL · ⚪ 낮음 · 품질 미흡


**증거**

> 강등 핸들러 63020~63022: `SELECT MAX(manual_order) AS m FROM novels WHERE manual_tier=?`(lower) → `newOrder = (Number(maxRow?.m)||0) + 100` → `UPDATE novels SET manual_tier=?, manual_order=? ...`. 즉 하위 티어의 기존 최댓값보다 100 큰 값 = 그 티어 맨 아래. 확인 다이얼로그 문구는 63010 `${g.title}을(를) ${getTierLabel(lower)} 티어로 변경할까요?`이고 모달 안내는 62947 "한 단계 위/아래 이동을 제안합니다"이다. 또한 이 경로는 rebalanceTierOrder(38119)나 computeNewPosition이 산출한 경계 정보를 전혀 쓰지 않는다.


**왜 있으나 마나인가** — 이 작품이 수문장으로 뽑힌 이유는 '경계 근처에서 여러 번 막았다'인데, 정작 조치는 경계 정보를 버리고 하위 티어 꼴찌로 보낸다. '한 단계' 이동이라는 카피와 실제 이동 폭이 다르다.


**사용자가 보는 손해** — S 티어 하위의 작품을 '한 칸 아래'라고 생각하고 ⬇️를 눌렀는데, A 티어의 20개 작품 전부보다 아래로 내려간다. 검증 세션 수십 번으로 쌓은 순위가 클릭 한 번에 무너지고, 되돌리려면 ▲를 20번 눌러야 한다(그때마다 큐도 2건씩 쌓임).


**개선안** — 강등은 하위 티어 **최상단**(MIN(manual_order)-100), 승급은 상위 티어 최하단(현행 유지)으로 비대칭 처리하거나, 아예 해당 작품의 최근 세션 blocker/passed 정보로 computeNewPosition과 동일한 삽입 위치를 계산해 적용하고, 확인 다이얼로그에 '이동 후 예상 위치'를 미리 보여줄 것.


<details><summary>검증자 재확인 노트</summary>

63020~63022 확인: MAX(manual_order)+100 → 하위 티어 맨 아래가 맞고, 62947 '한 단계 위/아래' 카피와 실제 이동 폭이 다른 것도 사실이다. 하지만 결함 프레이밍은 크게 약해진다: 38143~38165 setNovelTierAtomic이 동일하게 새 티어 MAX+100을 부여하고, 이를 인라인 티어 칩(65147 setNovelTierAtomic)·saveEdit·batchSetTier가 모두 쓴다 — 즉 티어 변경 = 새 티어 맨 아래는 앱 전역 규약이지 수문장 모달 고유의 버그가 아니다. '되돌리려면 ▲를 20번'은 REFUTED: 63024 pushUndo가 prevManualOrder를 싣고 51235~51247 performUndo case 'tier_change'가 manual_tier+manual_order를 그대로 복원하며 51250~51254에서 pending 큐도 cancel한다. 다른 작품 순위는 건드리지 않으므로 '쌓은 순위가 무너진다'도 과장. → severity 하향.

</details>


### `HYB-7` 티어를 지우면 절대 검증될 수 없는 큐 항목이 등록되어, '대기' 숫자만 올랐다가 '완료'로 자동 소멸한다

✅ CONFIRMED · ⚪ 낮음 · 사실상 미동작


**증거**

> saveEdit의 티어 클리어 경로 53262~53264: `} else if (_v7TierCleared) { await enqueueVerification(n.id, "tier_change", "overrated", "saveEdit"); }`. 그런데 getCandidatesForVerification은 37512~37515에서 `const mt = novel.manual_tier || ""; ... if (!mt) return [];` — manual_tier가 없으면 무조건 빈 배열이다. startVerificationSession은 54033~54045에서 후보 0이면 사용자에게 아무것도 보여주지 않고 `result_action='no_candidates'` 세션을 INSERT한 뒤 `UPDATE tier_verification_queue SET state='resolved'`로 마감한다. 대조적으로 flagSuspect(51781~51792)는 같은 상황을 미리 검사해 Alert로 안내하고 큐 등록을 생략한다.


**왜 있으나 마나인가** — 등록되는 순간 결과가 확정(항상 no_candidates)인 큐 항목이다. 사용자에게 질문 한 번 안 하고 사라지며, 그 사이 pending 카운터를 올리고 trigger_fire_log(37445)와 tier_repositioning_session row까지 만든다. 53776의 '완료' 카운터도 이 자동 마감분을 그대로 더해 실제 사용자가 답한 검증 수보다 부풀린다.


**사용자가 보는 손해** — 작품 티어를 지우면 매칭 탭 '대기'가 1 올라간다. 들어가서 '검증 시작'을 누르면 아무 비교도 안 나오고 '완료'만 1 늘어난다. 사용자는 자기가 하지 않은 검증이 완료된 것으로 집계된 화면을 본다.


**개선안** — 53262~53264의 티어 클리어 enqueue를 제거하거나(자리 검증 대상이 아니므로), 최소한 flagSuspect(51781)와 동일하게 enqueue 전에 getCandidatesForVerification로 후보 유무를 확인해 0이면 등록하지 않는다. no_candidates 자동 마감은 'resolved'가 아닌 별도 state로 집계해 '완료' 카운터를 오염시키지 않게 한다.


<details><summary>검증자 재확인 노트</summary>

53262~53264 확인: _v7TierCleared 경로에서 enqueueVerification(n.id,'tier_change','overrated','saveEdit'). 37509~37515 getCandidatesForVerification은 manual_tier가 비면 무조건 [] 반환(37515). 54033~54045 확인: 후보 0이면 result_action='no_candidates' 세션 INSERT + 큐 state='resolved'로 사용자 질문 없이 자동 마감, 54044/54066으로 다음 큐 자동 재시도. 53775~53777 loadVerificationStats가 resolved COUNT를 그대로 '완료'(62669)에 표시하므로 자동 마감분이 완료 수치에 섞이는 것도 사실. 대조군 51781~51792 flagSuspect가 같은 상황을 Alert로 막고 enqueue를 생략하는 것도 확인 — 앱 내 선례가 있는 명백한 비일관. 다만 실손해는 pending 카운터 일시 +1, 완료 카운터 팬텀 +1, trigger_fire_log/session row 1건으로 데이터 파손이 없고 티어 클리어 자체가 빈발 행위가 아니라 severity 하향.

</details>


### `HYB-8` 사용자가 직접 찍은 🔍 의심 표시(priority 3)가 자동 티어 변경(4)보다 우선순위가 낮다

✅ CONFIRMED · ⚪ 낮음 · 품질 미흡


**증거**

> 37320~37330 `const VERIFICATION_PRIORITY = { gatekeeper: 5, tier_change: 4, order_change: 3, new: 2, continue: 2, conflict: 1, user_flag: 0, auto_detected: 0, meta_edit: 1 };` — user_flag의 base는 0이다. computeVerificationPriority(37336~37353)가 더하는 flagWeight는 37338 `(novel && Number(novel.user_flagged_suspect)) ? 3 : 0`. flagSuspect는 51780에서 플래그를 먼저 1로 세팅한 뒤 51795에서 enqueue하므로 최종 priority = 0 + 3 = 3. 반면 아무 이력 없는 작품의 단순 티어 편집은 53260 경로로 base 4를 그대로 받는다. 큐 fetch(37620)와 '다음 점검' 미리보기(53783)는 모두 `ORDER BY q.priority DESC, q.created_at ASC`다.


**왜 있으나 마나인가** — 사용자가 카드에서 🔍를 눌러 '이건 자리가 이상하다'고 명시적으로 지목한 신호가, 시스템이 편집 부수효과로 자동 생성한 tier_change보다 뒤로 밀린다. 51796의 안내문 "점검 대기에 추가되었습니다"는 그 항목이 언제 처리될지 아무 약속도 하지 않는다. 게다가 base(0~4) 차이는 blockWeight+conflictWeight+skewWeight+suspWeight 최대 13(37340~37352)에 묻혀, VERIFICATION_PRIORITY 상수의 서열 자체가 실질적으로 무의미해진다.


**사용자가 보는 손해** — 사용자가 A 작품에 🔍를 찍고 매칭 탭에 들어가면, 조금 전 티어를 만진 B 작품이 먼저 나온다. '내가 지목한 게 왜 안 나오지'가 되고, 큐가 발산 중이면 지목한 작품 차례는 영영 안 올 수도 있다.


**개선안** — user_flag의 base를 최소 5(현 최고 gatekeeper와 동급) 이상으로 올리거나, ORDER BY에 `user_flagged_suspect DESC`를 1순위 키로 추가해 사용자 명시 지목이 항상 먼저 처리되게 한다. 아울러 base 상수 서열이 의미를 갖도록 누적 가중치 총합에 상한(예: 4)을 두는 정규화 검토.


<details><summary>검증자 재확인 노트</summary>

37320~37330 VERIFICATION_PRIORITY 확인(user_flag: 0, tier_change: 4). 37336~37353 computeVerificationPriority의 flagWeight=+3(37338) 확인. 51778~51796 flagSuspect가 51780에서 user_flagged_suspect=1을 먼저 쓰고 51795에서 enqueue하므로 최종 base+flag=3이 맞다. 53260 saveEdit tier_change는 base 4. fetch/미리보기 정렬이 둘 다 `ORDER BY q.priority DESC, q.created_at ASC`인 것도 37620, 53783에서 확인 — 동점이면 오래된 행 우선이라 방금 찍은 🔍가 더 밀린다. 다만 손해 규모는 제한적: 두 항목 모두 blockWeight/conflictWeight/skewWeight/suspWeight(37339~37352)를 동일하게 받으므로 차이는 사실상 1점이고, flagged 작품에 suspicion_score>=2만 있어도(suspWeight+1) 역전된다. '지목한 작품 차례가 영영 안 온다'는 큐 상한(주장1 참조)상 과장 → severity 하향.

</details>


---

## AI 태그·장르 관리


### `AI-1` 커스텀 장르를 하나라도 추가하면 AI에게 보내는 장르 어휘가 '그 커스텀 몇 개'로 붕괴한다

✅ CONFIRMED · 🔴 높음 · 미완성 · 🔍 직접확인 · **✔ v7.58.4에서 수정됨**


**증거**

> App.jsx 47253-47254 (그리고 배치 경로 48851-48852): `const majorVocab = (Array.isArray(userMajorGenres) && userMajorGenres.length ? userMajorGenres : FACTORY_MAJOR_GENRES);` / `const subVocab = (Array.isArray(userSubGenres) && userSubGenres.length ? userSubGenres : FACTORY_SUB_GENRES);`. 그런데 App.jsx 15055-15060 `deriveUserMajorGenres`는 `(registry.majorGenres||[]).filter(t => !_base.some(f => isSameTag(f,t)))` — 즉 **팩토리를 뺀 '사용자 추가분만'** 반환한다(15064-15069 부장르도 동일). 결과적으로 사용자가 대장르 '아카데미판타지' 하나만 추가해도 프롬프트(16203-16204)는 `대장르는 다음 중에서만 고르세요: 아카데미판타지`가 된다. 코드 다른 곳은 전부 합집합을 쓴다 — 예: 25449 `[...SUB_GENRES, ...userSubGenres, ...]`, 27223 `tags: [...SUB_GENRES, ...userSubGenres]`. 덤으로 웹툰 슬롯(19647-19651 MODE_PROFILES.webtoon)에서 커스텀이 없으면 폴백이 활성 모드 목록(MAJOR_GENRES, 19672-19673)이 아니라 **소설용 FACTORY_MAJOR_GENRES**로 하드코딩돼 웹툰 슬롯에 '무협/선협/대체역사'가 후보로 나간다.


**왜 있으나 마나인가** — AI 태그 추천의 핵심 가치가 '내 어휘로 분류해 준다'인데, 어휘를 손댄 사용자일수록(=이 기능을 가장 쓰는 사용자) 장르 후보가 1~2개로 줄어든다. 게다가 AI가 그래도 '판타지'를 뱉으면 majorMap에 없어서(47295, 47312) 대장르로 안 잡히고 일반 태그 경로로 새며, '내 태그만' 모드면 그대로 폐기된다.


**사용자가 보는 손해** — 장르 커스터마이즈를 한 순간부터 AI가 대장르/부장르를 사실상 못 달아준다. 화면에는 '대장르(0)'로 비어 보이거나 커스텀 장르 하나만 체크돼 나오고, 사용자는 원인을 알 수 없다. 웹툰 슬롯에서는 웹툰에 없는 소설 장르가 추천된다.


**개선안** — 47253-47254와 48851-48852를 `deduplicateTags([...MAJOR_GENRES, ...(userMajorGenres||[])])` / `deduplicateTags([...SUB_GENRES, ...(userSubGenres||[])])`(활성 모드 팩토리 + 사용자 추가분 합집합)로 바꾼다. 25449·27223의 기존 패턴과 동일하게 맞추면 웹툰 모드 폴백 문제도 같이 사라진다.


<details><summary>검증자 재확인 노트</summary>

App.jsx 47253-47254(단건)·48851-48852(배치) 실물 확인: `const majorVocab = (Array.isArray(userMajorGenres) && userMajorGenres.length ? userMajorGenres : FACTORY_MAJOR_GENRES);` — 삼항이 배타적이라 합집합이 아니다. userMajorGenres의 정체는 40932-40933 `useMemo(() => deriveUserMajorGenres(tagRegistry))`이고, 15055-15062 deriveUserMajorGenres는 `const _base = getModeProfile(globalSlotMode).majorGenres;` 후 `(registry.majorGenres||[]).filter(t => !_base.some(f => isSameTag(f,t)))` — 팩토리를 뺀 '추가분만' 반환이 맞다. 즉 커스텀 대장르 1개 = majorVocab 1개, 프롬프트 16203-16204 `대장르는 다음 중에서만 고르세요: ${c.majorOptions.join(', ')}`가 1개로 축소된다. 대안 경로(설정 UI 등)로 회피 가능한지 grep했으나 AI 태깅 경로에서 MAJOR_GENRES(=registry 전체 활성 목록)를 쓰는 분기는 없고(47253 유일), 앱의 다른 곳은 25448-25449·27220·27223처럼 전부 합집합이라 이 경로만 예외다. 웹툰 폴백도 확인: 19648-19650 MODE_PROFILES.webtoon은 FACTORY_MAJOR_GENRES_WEBTOON(14962-14968)을 쓰지만 47253의 폴백 상수는 소설용 FACTORY_MAJOR_GENRES(13882-13891: 무협·선협·대체역사 포함)로 하드코딩돼 있다. 반박 실패 — 인용 줄번호·동작 모두 일치.

</details>


### `AI-3` '어휘 범위(내 태그만/표준까지/새 태그 허용)' 3분기가 프롬프트에 반영되지 않고, 내 태그는 상위 40개만 전달된다

✅ CONFIRMED · 🔴 높음 · 품질 미흡 · 🔍 직접확인


**증거**

> buildTaggingPrompt(App.jsx 16188-16211)에서 모드를 구분하는 유일한 곳은 16206-16207의 `if (c.allowNew) … else s += ' 알려진 일반적인 태그 위주로만 제안하세요.'` 뿐이고, allowNew는 `mode === "new"`일 때만 true(47261). 즉 '내 태그만'과 '표준까지'는 **완전히 동일한 프롬프트**를 보낸다. 사용자 어휘는 16197 `자주 쓰는 태그: ${c.profile.topTags.join(', ')}`로만 들어가는데 topTags는 47250 `.slice(0, 40)`. 반면 사후 필터(47317)는 `usedKeys`(전체 사용 태그 집합, 47252)로 판정하고, '내 태그만' 모드에서 usedKeys에 없는 제안은 47319/47321 분기에 걸리지 않아 **아무 표시 없이 버려진다**. UI는 77518-77528에서 3분기를 동등한 선택지로 보여 준다.


**왜 있으나 마나인가** — AI는 내 태그가 뭔지 40개밖에 모르는 채로 답하고, 앱은 500개 기준으로 걸러낸다. '내 태그만' 모드는 AI를 내 어휘에 맞추는 게 아니라, 일반론 답변을 사후에 대량 폐기하는 필터에 불과하다.


**사용자가 보는 손해** — 태그가 많은 사용자일수록 '내 태그만'에서 결과가 텅 비고(47327 '추천할 게 마땅치 않아요') 토큰만 소모된다. 몇 개가 왜 버려졌는지도 안 알려 준다.


**개선안** — 모드별로 프롬프트를 갈라라. mine이면 후보 어휘(사용 태그 전체 또는 빈도 상위 200~300개)를 '이 목록 안에서만 고르세요'로 명시해 보내고, std면 표준 어휘를 명시한다. 사후에 버린 제안 개수/이름을 화면 하단에 '내 어휘 밖이라 제외됨 N개(→ 새 태그 허용으로 보기)'로 노출한다.


<details><summary>검증자 재확인 노트</summary>

buildTaggingPrompt(16188-16211) 전문을 읽었다. ctx에 mode 필드 자체가 없고(47283-47288), 프롬프트에서 모드에 반응하는 유일한 지점은 16206-16207 `if (c.allowNew) … else s += ' 알려진 일반적인 태그 위주로만 제안하세요.'`이며 allowNew는 47261 `const allowNew = mode === "new";`. 즉 mine/std는 바이트 단위로 같은 프롬프트다. 사용자 어휘 주입은 16197 `자주 쓰는 태그: ${c.profile.topTags.join(', ')}` 한 줄뿐이고 topTags는 47250 `.slice(0, 40)`, 반면 판정용 usedKeys는 47252 `new Set(disp.keys())` 전량. 47311-47324 else-if 체인에 최종 else가 없어 mine 모드에서 usedKeys/stdMap 어디에도 없는 제안은 배열에 안 담기고 조용히 사라진다(총합 0일 때만 47327 Alert). UI 77518-77528은 세 모드를 동등한 3분기 칩으로 노출하고 기본값은 40348 `useState("mine")`. 다른 경로로 조정 가능한 설정 없음(aiTagVocabMode grep 3곳뿐).

</details>


### `AI-2` 부장르 106개 중 46개(재벌·연예계·의사·용사·육아·메카…)는 slice(0,60)에 잘려 AI에 영원히 전달되지 않는다

🟨 PARTIAL · 🟡 중간 · 하드코딩 · 🔍 직접확인


**증거**

> App.jsx 47287 `majorOptions: majorVocab.slice(0, 40), subOptions: subVocab.slice(0, 60)` (배치 경로도 동일: 48898). FACTORY_SUB_GENRES(13894-13916)는 실제로 106개다. 인덱스 60부터가 '재벌, 연예계, 아이돌, 스포츠, 요리, 의사, 마법사, 검사, 궁수, 힐러, … 육아, 메카, 특촬, 패러디, 괴이, 괴담' 등 직업/신분·특수소재 블록 전체 — 46개가 항상 잘린다. 잘린 항목은 subMap(47256)에도 없으므로 AI가 자력으로 '재벌'을 말해도 부장르로 인식되지 않고 일반 태그 경로(47317-47323)로 흘러간다. 상한을 조절할 UI/설정은 없다.


**왜 있으나 마나인가** — '부장르는 다음 중에서만 고르세요'라고 못 박아 놓고(16204) 정작 목록의 43%를 안 보낸다. 잘린 장르는 AI 추천으로는 절대 붙지 않으며, 잘리는 기준이 '배열에 쓰인 순서'라 의미와 무관하다.


**사용자가 보는 손해** — 재벌물·연예계물·아이돌물·의사물·육아물 등을 등록해도 AI가 부장르를 못 달아준다. 사용자는 'AI가 이 작품을 모르나 보다'로 오해하고(47327 안내 문구가 그렇게 유도한다) 수동으로 다시 단다.


**개선안** — 장르 목록은 태그 목록과 달리 수백 개도 아니므로 슬라이스를 없애거나(전체 106+커스텀 전송, 토큰 수백 수준) 최소한 '작품에서 실제로 쓰인 빈도 상위'로 정렬한 뒤 자르고, 잘린 개수를 프롬프트/화면에 알린다. 상한을 남긴다면 설정에 노출한다.


<details><summary>검증자 재확인 노트</summary>

1차 사실은 확인: 47287 `majorOptions: majorVocab.slice(0, 40), subOptions: subVocab.slice(0, 60)`, 배치도 48898 동일. FACTORY_SUB_GENRES(13894-13916)를 파싱해 세어보니 정확히 106개이고 index 60부터가 '재벌, 연예계, 아이돌 … 괴이, 괴담, 기믹, 암타'(46개)로 주장과 일치. 상한 조절 UI도 없다(grep 결과 slice(0,60)은 47287·48898 두 곳뿐, 설정 상태 없음). 그러나 핵심 파생 주장은 **반박된다**: subMap은 47256 `new Map(subVocab.map(...))`으로 **자르지 않은 전체 subVocab**에서 만들어진다. 따라서 AI가 자력으로 '재벌'을 뱉으면 47313 `if (subMap.has(k)) { pushSub(name); continue; }`가 그대로 부장르로 재배치한다 — '일반 태그 경로로 새어 폐기'된다는 서술은 코드와 다르다. 손해는 '프롬프트 후보에서 빠져 AI가 먼저 제안할 확률이 낮아진다'로 축소되므로 영향 과장.

</details>


### `AI-4` AI에게 reason(근거)을 받아 놓고 태그 추천 경로에서는 통째로 버린다

✅ CONFIRMED · 🟡 중간 · 품질 미흡 · 🔍 직접확인


**증거**

> Claude 스키마 16245 `reason: { type: "string", description: "짧은 근거" }`, Gemini 스키마 16300/16303도 reason을 요구한다. 그런데 결과 가공(47315-47322, 배치 48881-48885)이 만드는 객체는 `{ tag, intensity, confidence, sentSuggest, sent, needsRegister, similarTo, checked }` — reason이 없다. 상태 주석(40344)은 `tags:[{tag,intensity,confidence,reason,checked}]`라고 써 있으나 실제로 안 채워진다. UI(77551-77584)도 reason을 렌더하지 않고 확신도는 'low일 때 물음표 한 글자'(77558)로만 표현된다. 같은 앱의 다른 AI 경로는 근거를 보여 준다 — 좌표 배치 75406 `${s.reason}`, 상반 후보 76791 `AI: {c.reason}`.


**왜 있으나 마나인가** — 근거 토큰은 매 호출마다 생성·과금되는데 화면에 도달하지 않는다. 사용자는 '먼치킨'이 왜 붙었는지 판단할 재료 없이 체크박스만 본다.


**사용자가 보는 손해** — 신규 태그는 기본 체크 해제라 '검토 후 켜라'고 하는데(77569, 77590) 검토할 정보가 태그 이름뿐이다. 결국 감으로 켜거나 전부 무시하게 되고, 출력 토큰 비용은 계속 나간다.


**개선안** — 47318-47322/48883-48885에 `reason: it.reason ? String(it.reason) : ""`를 실어 77558·77576 아래 한 줄로 표시한다(좌표 제안 75406과 동일 패턴). 표시할 생각이 없다면 16245/16300 스키마에서 reason을 빼서 토큰을 아껴야 한다.


<details><summary>검증자 재확인 노트</summary>

Claude 스키마 16245 `reason: { type: "string", description: "짧은 근거" }`, Gemini 16300 및 propertyOrdering 16303에도 reason 존재 확인. 반환 정규화 callClaudeForTagging(16266-16270)은 tags 배열을 그대로 넘기지만, 소비부 47316-47322 / 48884-48886이 만드는 객체는 `{tag, intensity, confidence, (sentSuggest, sent, needsRegister, similarTo), checked}`로 reason을 담지 않는다. 상태 주석 40344는 `tags:[{tag,intensity,confidence,reason,checked}]`라고 적혀 있어 의도와 구현이 어긋난 것도 사실. UI 77551-77584 전체를 읽었고 reason 렌더는 없으며 확신도는 77558 `{low ? " ?" : ""}` 한 글자뿐, 신규 태그는 47320-47322에서 checked:false로 나가고 안내는 77590 '신규는 기본 꺼짐 — 검토 후 켜세요'. 대조군도 확인: 좌표 배치 75406 `${s.reason}`, 상반 후보 76791 `AI: {c.reason}`는 실제로 근거를 렌더한다. 사실관계 전부 일치하나 실손해는 '짧은 근거 문자열 출력 토큰 + 판단 근거 부재'로 데이터 손상급은 아니라 severity만 하향.

</details>


### `AI-5` 유형그룹 AI 자동 분류가 '라벨 문자열'만 보고 판단한다 — 사용자가 이미 그 노드에 넣어 둔 태그를 전혀 안 보낸다

🟨 PARTIAL · 🟡 중간 · 품질 미흡 · 🔍 직접확인


**증거**

> buildTypeGroupPromptText(App.jsx 15955-15963)가 프롬프트에 싣는 것은 `(categoryLabels||[]).slice(0,200).map(c => '- ' + c)` 뿐이다. 호출부 49343-49345는 `pathOf(n)`으로 '유형 ▸ 세부유형' 이름만 뽑는다. 정작 각 노드의 기존 배정 태그는 존재하고 코드도 접근한다 — 49377 `if ((nodes[id].tags || []).some(t => isSameTag(t, tag))) continue;`. 같은 파일의 다른 AI 프롬프트는 사용자 결정을 싣는다: buildSynonymPromptText 15708-15711(기존 그룹·상반·거절 이력), buildPlacementPromptText 15069(이미 배치한 태그 앵커 40개). 유형그룹만 맥락이 0이다. 게다가 라벨 상한 200(15956)은 호출부가 넘긴 전체 labels(49345)와 무관하게 잘려, 노드가 200개를 넘으면 잘린 노드는 어떤 태그도 배정받지 못한다(어떤 200개가 남는지는 `Object.values(nodes)` 순서에 좌우돼 사실상 임의).


**왜 있으나 마나인가** — '분위기 ▸ 다크'라는 라벨만으로는 그 사용자가 그 칸에 무엇을 넣는 사람인지 알 수 없다. 앵커 없이 일반론으로 배치하니, 사용자의 기존 분류 기준과 어긋난 제안이 대량으로 나온다(제안은 전부 checked:true로 켜져 나온다 — 49380).


**사용자가 보는 손해** — 1500개까지 청크로 나눠 십수 번 과금 호출을 돌리고도(49353, 49359) 결과는 사용자 기준과 따로 노는 배치라 하나하나 체크 해제해야 한다. 노드가 200개를 넘는 사용자는 일부 유형이 영원히 비어 있는데 이유를 알 수 없다.


**개선안** — 라벨과 함께 노드별 기존 태그 예시(각 3~5개)를 프롬프트에 실어 '이 분류에 이런 게 들어 있다'를 보여 준다(placement의 anchors 15069 패턴). 라벨 200 상한은 잘라야 한다면 태그 보유 수 기준으로 정렬해 자르고 잘렸음을 사용자에게 알린다. 제안 기본값도 checked:false 또는 근거 표시 후 켜기로 바꾼다.


<details><summary>검증자 재확인 노트</summary>

핵심은 확인: buildTypeGroupPromptText(15955-15963)가 싣는 것은 `(categoryLabels || []).slice(0, 200).map(c => `- ${c}`)`와 태그 목록뿐이고, 호출부 49344-49346이 `pathOf(n)`으로 '유형 ▸ 세부유형' 이름만 만든다. 각 노드의 기존 태그는 존재하고(49376 `if ((nodes[id].tags || []).some(t => isSameTag(t, tag))) continue;`) 접근도 하는데 프롬프트에는 안 간다. 대조군도 실재: buildSynonymPromptText 15708-15711(기존 그룹 30·상반 30·거절 50·상반거절 50 주입), buildPlacementPromptText 16069 앵커 40개 주입(주장이 쓴 '15069'는 오기, 실제 16069). 제안 기본 checked:true도 49379에서 확인. 다만 '노드 200개 초과 시 일부 유형이 영원히 빈다'는 영향은 과장이다 — 기본 시드 seedTypeGroupsFrom(14567-14580)은 GENERAL_TAGS 카테고리당 노드 1개(수십 개 수준)라 200 상한은 수동으로 200개 넘게 만든 극소수에서만 걸린다. 앵커 미주입은 CONFIRMED, 상한 피해는 REFUTED에 가까워 종합 PARTIAL.

</details>


### `AI-7` AI 스캔 결과가 '병합'·'관계 정리' 버튼 한 번에 통째로 사라진다 — 다시 돌리면 다시 과금

✅ CONFIRMED · 🟡 중간 · 미완성


**증거**

> computeTagHealth의 반환은 App.jsx 46973 `return { clusters, danglingRelated, orphanMappings };` — synonymCandidates/oppositeCandidates가 없다. 그런데 mergeTagCluster는 46999에서 `setTagHealthData(computeTagHealth())`로 상태를 통째 교체하고, cleanupTagRelationsHealth도 49605에서 `setTagHealthData(computeTagHealth())`를 호출한다. openTagHealth(46976-46986)만 synonymCandidates를 따로 채워 넣는다(46980). runAiSynonymScan은 결과를 `setTagHealthData(prev => ({ ...(prev||{}), synonymCandidates: [...], oppositeCandidates: [...] }))`(49565-49573)로 얹어 두는데, 같은 모달 안의 표기 병합 버튼(76710·상단 클러스터 병합)을 누르는 순간 이 목록이 날아간다.


**왜 있으나 마나인가** — AI 점검은 태그 1000개를 120개씩 쪼개 최대 9~10회 호출하고 진행률까지 보여 주는 무거운 작업인데(49548-49563), 그 산출물이 같은 화면의 다른 버튼 한 번으로 휘발된다. 저장되지도 않아 모달을 닫아도 사라진다.


**사용자가 보는 손해** — '표기 병합 → 관계 정리 → 유의어 후보 검토'라는 자연스러운 순서로 쓰면 AI 결과가 사라져 다시 스캔해야 하고, 그만큼 API 비용과 대기 시간을 또 낸다.


**개선안** — 46999·49605를 `setTagHealthData(prev => ({ ...computeTagHealth(), synonymCandidates: prev?.synonymCandidates ?? [], oppositeCandidates: prev?.oppositeCandidates ?? [] }))`로 바꾸고(또는 computeTagHealth가 prev를 받아 보존), AI 후보를 app_meta에 저장해 모달을 닫아도 유지되게 한다.


<details><summary>검증자 재확인 노트</summary>

computeTagHealth 반환은 46970 `return { clusters, danglingRelated, orphanMappings };` — synonymCandidates/oppositeCandidates 없음(46932-46970 전체 확인). openTagHealth만 46976-46980에서 `health.synonymCandidates = computeSynonymCandidates(...)`로 덧붙인다. mergeTagCluster는 46998 `setTagHealthData(computeTagHealth());`로 객체를 통째 교체(머지 아님)하고, cleanupTagRelationsHealth도 49604 `setTimeout(() => { setTagHealthData(computeTagHealth()); })` 동일. 반면 runAiSynonymScan은 49564-49573 `setTagHealthData(prev => ({ ...(prev||{}), synonymCandidates: [...], oppositeCandidates: [...] }))`로 얹기만 한다. 두 파괴 버튼이 같은 모달의 유의어 후보 섹션 **위**에 있는 것도 확인(관계 정리 버튼 76710-76715, 그 아래 76719부터 유의어 후보 섹션). 즉 위에서 아래로 처리하는 자연스러운 조작 순서가 곧 결과 소실 경로다. 스캔 비용도 실재(49546-49559 청크 루프 + 재조정 패스). 다른 가드 없음.

</details>


### `AI-6` AI 유의어 후보는 신뢰도가 항상 85%, 표본이 항상 0으로 표시된다

✅ CONFIRMED · ⚪ 낮음 · 품질 미흡


**증거**

> App.jsx 49528 `aiCands.push({ a: uniq[0], b: uniq[i], score: 0.85, minFreq: 0, reasons: [...], suggest: 'group', ai: true });` — score/minFreq가 리터럴이다. 표시부 76757 `{c.reasons.join(' · ')} · 표본 {c.minFreq} · 신뢰도 {Math.round(c.score * 100)}%`는 로컬 형태 기반 후보(15536에서 실제 morph 점수·실제 최소 빈도를 채움)와 같은 줄을 쓴다. 결과적으로 AI 후보는 예외 없이 '표본 0 · 신뢰도 85%'다. 또한 AI가 4개짜리 그룹을 주면 49521-49529가 uniq[0] 기준 쌍으로 쪼개 3장의 카드로 뿌리고, 3장 모두 같은 reason·같은 85%가 붙는다.


**왜 있으나 마나인가** — 숫자가 정보를 전혀 담지 않는데 로컬 후보의 진짜 통계와 나란히 놓여 있어, 사용자는 '85%는 AI가 계산한 확신도'로 오해한다. 실제로 Claude/Gemini 스키마에는 유의어용 confidence 필드 자체가 없다(15819-15852).


**사용자가 보는 손해** — 어떤 AI 후보가 더 믿을 만한지 화면에서 구분할 수 없고, '표본 0'은 근거가 없다는 뜻으로 읽혀 오히려 신뢰를 깎는다. 정렬·우선순위 판단도 불가능하다.


**개선안** — AI 후보에는 통계 줄 대신 'AI 제안'과 reason만 표시하고(76757을 `c.ai` 분기), 숫자를 유지하려면 스키마에 confidence를 추가해 실제 값을 받아라. 최소한 minFreq는 tagFreq에서 실제 값을 채워 넣을 수 있다(49476-49481에 freq 맵이 이미 있다).


<details><summary>검증자 재확인 노트</summary>

49527 실물: `aiCands.push({ a: uniq[0], b: uniq[i], score: 0.85, minFreq: 0, reasons: ["AI" + (g.reason ? ": " + g.reason : "")], suggest: "group", ai: true });` — score/minFreq 리터럴 맞다. 표시부 76756-76757 `{c.reasons.join(' · ')} · 표본 {c.minFreq} · 신뢰도 {Math.round(c.score * 100)}%`가 로컬 후보와 같은 줄을 공유하고, 로컬은 15536에서 `minFreq: Math.min(tagFreq.get(ka)||0, tagFreq.get(kb)||0)`와 실제 morph.score를 채운다(15542-15547). 유의어 스키마(15819-15851)에 confidence 필드가 없다는 점도 확인 — AI가 준 값이 아니다. 4개 그룹이 uniq[0] 기준 3쌍으로 쪼개지는 것도 49518-49528 루프에서 사실. 다만 목록 정렬은 49570-49572 `[...fresh, ...existing]`로 score를 쓰지 않아 '정렬 왜곡' 피해는 없고, reasons에는 AI의 실제 이유가 들어가 근거가 완전 공백은 아니다. 오해 유발 표시 수준이라 severity 하향.

</details>


### `AI-8` AI 유의어 후보에 '이미 같은 유의어 그룹인 쌍' 필터가 빠져 있고, 좌우가 뒤집힌 중복 카드가 생긴다

🟨 PARTIAL · ⚪ 낮음 · 미완성


**증거**

> AI 결과 가공 49517-49529의 게이트는 isSameTag / seenSynPair / dismissedSynPairs / isOppositePair 네 가지뿐 — 로컬 경로 addCand(15526-15527)에 있는 `const gA = groupOf(ka), gB = groupOf(kb); if (gA && gB && gA === gB) return;`(이미 같은 그룹이면 컷)이 없다. 사용자가 이미 묶은 그룹은 프롬프트에도 30개만 실린다(15708 `sg.slice(0, 30)`). 또 기존 후보와의 중복 제거 키가 49567에서 `${normalizeTagKey(c.a)}|${normalizeTagKey(c.b)}`(순서 의존)인데, 바로 세 줄 아래 상반 후보는 순서 무관 키 `synPairKey(c.a, c.b)`(49570)를 쓴다. 로컬 후보는 정렬된 순서로 a/b를 저장하고(15541-15549) AI 후보는 AI가 준 순서를 그대로 쓰므로(49528), 같은 쌍이 뒤집힌 채 두 장으로 남는다. 수락 시 제거도 정확 일치 비교라 뒤집힌 쪽이 안 지워진다(47055 `filter(c => !(c.a === tagA && c.b === tagB))`).


**왜 있으나 마나인가** — 스캔할 때마다 '이미 묶어 둔 쌍'이 다시 후보로 올라오고, 묶기를 눌러도 47028에서 no-op으로 끝난다. 즉 사용자가 한 결정이 다음 스캔에 반영되지 않는다(거절 이력만 반영된다).


**사용자가 보는 손해** — 그룹이 30개를 넘어가면 스캔할 때마다 이미 처리한 쌍이 섞여 나와, 진짜 새 후보를 찾으려면 매번 같은 목록을 다시 훑어야 한다. 뒤집힌 중복 카드까지 겹쳐 후보 수가 부풀려진다.


**개선안** — 49517-49529에 로컬과 동일한 same-group 가드(`tagRelations.tagToGroup` 조회 후 동일 그룹이면 continue)를 추가하고, 49567의 중복 키를 49570처럼 `synPairKey`로 통일한다. 47055의 제거 조건도 synPairKey 비교로 바꾼다.


<details><summary>검증자 재확인 노트</summary>

코드 사실은 전부 확인: ingest 게이트(49518-49526)는 isSameTag / seenSynPair / dismissedSynPairs / isOppositePair 넷뿐이고, 로컬 addCand(15525-15527)에 있는 `const gA = groupOf(ka), gB = groupOf(kb); if (gA && gB && gA === gB) return;`가 없다. 병합 시 중복 키도 49566이 순서 의존 `${normalizeTagKey(c.a)}|${normalizeTagKey(c.b)}`인데 세 줄 뒤 상반은 49569 `synPairKey(c.a, c.b)`(순서 무관)로 비대칭이며, 로컬은 15529 `ka <= kb ? ... : ...`로 정렬 저장, AI는 49527에서 AI가 준 순서 그대로라 뒤집힌 중복이 성립한다. 수락 제거도 47055 `filter(c => !(c.a === tagA && c.b === tagB))` 정확 일치라 뒤집힌 쪽은 남는다. 클릭 시 no-op도 47028 `if (gA && gA === gB) return prev;`로 확인. 다만 영향은 과장: 프롬프트가 기존 그룹을 실제로 주입하고(15708 `sg.slice(0,30)` + 15715 '기존 묶음/상반/거절 … 취향과 결정을 존중하세요') 클릭한 쌍은 47055에서 목록에서 사라지므로, 재등장은 그룹 30개 초과 사용자에서 AI가 지침을 어길 때 한정된 확률적 잡음이다.

</details>


---

## 하드코딩 vs 커스터마이즈


### `HC-1` 커스텀 대/부장르를 1개라도 추가하면 AI 태깅 프롬프트에서 기본 장르 100여 개가 통째로 사라진다

✅ CONFIRMED · 🔴 높음 · 미완성 · **✔ v7.58.4에서 수정됨**


**증거**

> App.jsx 47253-47254: `const majorVocab = (Array.isArray(userMajorGenres) && userMajorGenres.length ? userMajorGenres : FACTORY_MAJOR_GENRES); const subVocab = (Array.isArray(userSubGenres) && userSubGenres.length ? userSubGenres : FACTORY_SUB_GENRES);` — 그런데 15064-15069 `deriveUserSubGenres`는 `registry.subGenres`에서 팩토리 항목을 **제외한 커스텀만** 반환한다(`return (registry.subGenres||[]).filter(t => !_base.some(f => isSameTag(f,t)))`, 40932-40933에서 useMemo로 파생). 즉 커스텀 부장르 1개('먹방')를 추가하면 subVocab = ["먹방"] 단일 배열이 되고, 16204 `if (Array.isArray(c.subOptions) && c.subOptions.length) s += '부장르는 다음 중에서만 고르세요: ' + c.subOptions.join(", ")` 로 프롬프트에 그대로 박힌다. 배치 경로(48898)도 동일한 ctx를 쓴다. 추가로 47287 `subOptions: subVocab.slice(0, 60)` — FACTORY_SUB_GENRES(13894~13915)는 실측 109개라 커스텀이 없어도 '재벌/연예계/아이돌/스포츠/요리/의사/검사/육아/메카/괴담…' 등 60번째 이후 49개는 AI에게 절대 제시되지 않는다.


**왜 있으나 마나인가** — '커스텀 장르 추가' 기능과 'AI 태그 추천' 기능이 각각은 동작하지만, 둘을 같이 쓰는 순간 AI가 고를 수 있는 장르 어휘가 사용자가 방금 만든 몇 개로 붕괴한다. 반대로 커스텀이 없으면 앱 자신의 부장르 절반이 영원히 후보에서 빠진다. 어느 쪽이든 '내 어휘에 맞춰 추천'이라는 기능의 전제가 성립하지 않는다.


**사용자가 보는 손해** — 커스텀 장르를 하나 만든 사용자는 이후 모든 AI 태깅에서 대장르/부장르 제안이 사실상 그 커스텀 항목으로만 나오거나 아예 비게 된다. 커스텀을 안 만든 사용자도 '재벌/연예계/아이돌/육아/메카' 같은 부장르는 AI가 절대 달아주지 않아 수동으로 매번 채워야 한다.


**개선안** — 47253-47254를 `deduplicateTags([...(SUB_GENRES||FACTORY_SUB_GENRES), ...userSubGenres])`처럼 **팩토리+커스텀 합집합**(그리고 레지스트리에서 숨긴 항목 제외)으로 바꾼다. slice(0,60)/slice(0,40)의 상한은 (a) 라이브러리 사용 빈도순 정렬 후 자르거나 (b) 청킹(AI_SCAN_CHUNK_SIZE 패턴)으로 전량 전송하고, 상한 자체를 설정값으로 노출한다.


<details><summary>검증자 재확인 노트</summary>

47253-47254 인용 코드 그대로 존재 확인(`userSubGenres.length ? userSubGenres : FACTORY_SUB_GENRES`). 15064-15070 deriveUserSubGenres는 `getModeProfile(globalSlotMode).subGenres`(팩토리)를 뺀 '커스텀만' 반환하고, 40933에서 useMemo로 파생됨을 확인. 즉 커스텀 1개면 subVocab=길이1. 여기서 끝이 아니라 47256 subMap도 subVocab만으로 만들어져 47297 pushSub이 subMap에 없는 이름을 전부 버리므로, AI가 팩토리 부장르를 답해도 결과에서 탈락한다(프롬프트+필터 이중 붕괴). 48851-48852/48898 배치 경로 동일. 다른 경로로 우회 가능한지 확인: 유일한 관련 설정 aiTagVocabMode(40348, 77521)는 47260·47318-47322에서 '일반 태그' stdMap 분기에만 쓰이고 major/sub 어휘에는 전혀 관여하지 않음 → 설정 UI로 복구 불가. slice(0,60) 절단도 실재(47287/48898). 다만 실측 개수 정정: FACTORY_SUB_GENRES(13894-13920)는 109개가 아니라 106개이고 60 초과로 잘리는 것은 46개(예: 재벌·연예계·아이돌·육아·메카·괴담 등 후반부). 수치 외 주장은 전부 사실.

</details>


### `HC-2` 스펙트럼 6종은 태그 목록까지 완전 하드코딩 — 형제 기능인 '좌표계'는 사용자가 추가·편집·삭제까지 되는데도

🟨 PARTIAL · 🟡 중간 · 하드코딩


**증거**

> App.jsx 14907-14950 `FACTORY_TAG_SPECTRUM_GROUPS` — 6개 그룹의 tags가 문자열 배열로 고정(예: protagonist_power: ["약한주인공","성장형","천재","먼치킨","만능캐"]). 레지스트리 필드는 존재하지만(15032-15033 `TAG_SPECTRUM_GROUPS = registry.spectrumGroups ? ... : {...FACTORY_TAG_SPECTRUM_GROUPS}`) **쓰는 쪽이 전부 팩토리 고정값**이다: 42630 `spectrumGroups: curReg?.spectrumGroups || {...FACTORY_TAG_SPECTRUM_GROUPS}`, 42731 / 49950 / 49968 / 58105 모두 `{...FACTORY_TAG_SPECTRUM_GROUPS}`. 사용자 값을 저장하는 UI는 파일 전체에 없다. 반면 좌표계는 15094-15186 `DEFAULT_COORDINATE_SYSTEMS` + 15208 `getTagCoordinateSystems()` / 15232 `saveTagCoordinateSystems()` + CoordinateGridView로 축 라벨·태그 좌표를 자유 편집/전체 삭제까지 지원한다(15210-15214 주석: '사용자가 전체 삭제 — 빈 상태 유지'). 소비부는 39234-39344(취향분석 스펙트럼 통계)와 50711-50713(태그 영향도 표시).


**왜 있으나 마나인가** — 같은 개념(태그를 축 위에 배치)인데 좌표계는 풀 편집 UI, 스펙트럼은 30개 남짓 고정 문자열이다. 39252 `spectrum.tags.includes(t.tag)`로 정확 일치만 보므로 내가 추가한 '고구마/사이다' 같은 커스텀 태그는 아무리 많이 달아도 스펙트럼 분석에 1건도 잡히지 않는다.


**사용자가 보는 손해** — '먼치킨/피폐/순애' 같은 앱 기본 어휘를 쓰지 않는 사용자(웹툰 모드 포함 — 14958 주석이 '모드 무관 공유, 스왑 안 함'이라 명시)에게 취향분석의 스펙트럼 섹션은 영구히 빈 화면이거나 표본 2~3개짜리 결과만 나온다. 태그를 아무리 정성껏 커스터마이즈해도 이 분석은 개선되지 않는다.


**개선안** — tag_registry의 spectrumGroups를 실제로 쓰는 편집 UI(좌표계 편집기 재사용 또는 TagManagerModal 내 '스펙트럼 관리')를 추가하고, 42630 외 4곳의 `{...FACTORY_TAG_SPECTRUM_GROUPS}` 강제 덮어쓰기를 `curReg?.spectrumGroups ?? FACTORY`로 통일한다. 최소한 39252의 매칭을 normalizeTag/isSameTag 기반 + 좌표계 태그 상속으로 넓혀야 한다.


<details><summary>검증자 재확인 노트</summary>

핵심 사실은 확인: FACTORY_TAG_SPECTRUM_GROUPS 14907-14949 존재, 15032-15033에 registry.spectrumGroups 분기가 있으나 쓰는 쪽 42630(`curReg?.spectrumGroups || {...FACTORY}`)·42731·49950·49968·58105가 전부 팩토리 스프레드이고, `spectrumGroups`/`스펙트럼` 전수 grep 결과 사용자 값을 저장하는 UI가 한 곳도 없음(소비부는 39234-39344, 50711-50713뿐). 반면 좌표계는 15208 getTagCoordinateSystems/15232 saveTagCoordinateSystems + 46804·50152·50666·69554·75488·75515에서 실제 저장 → 비대칭 주장 성립. 그러나 피해 서술 두 가지가 틀렸다. (1) 39251-39252는 `spectrum.tags.includes(t.tag) || spectrum.tags.includes(normalizeTag(t.tag))`로 별칭 정규화 매칭까지 하므로 '정확 일치만 본다'는 부정확하고, 사용자는 태그 병합/별칭(76658 '병합할 대표 표기를 탭하면 모든 작품에서 통일')으로 자기 어휘를 스펙트럼 태그로 흘려보낼 수 있다. (2) '웹툰 모드는 영구히 빈 화면'은 반박됨 — 14971-14972 `FACTORY_GENERAL_TAGS_WEBTOON = { ...FACTORY_GENERAL_TAGS, ... }`가 스펙트럼 참조 태그를 상위집합으로 보존하고, 14964-14969 FACTORY_SUB_GENRES_WEBTOON에도 '먼치킨','피폐','사이다'가 들어 있다(14956-14957 주석이 명시적 방어). 하드코딩은 사실, 영향은 과장.

</details>


### `HC-3` 하이브리드 모드의 핵심 UX인 '검증 질문 최대 11회'와 '수문장 기준 3'이 설정 불가 — 같은 화면의 자동매칭/의심도는 임계값을 전부 노출

🟨 PARTIAL · ⚪ 낮음 · 하드코딩


**증거**

> App.jsx 37592-37594: `const VERIFICATION_GALLOP_MAX = 7; const VERIFICATION_BINARY_MAX = 4; const VERIFICATION_MAX_RESPONSES = VERIFICATION_GALLOP_MAX + VERIFICATION_BINARY_MAX;` 와 37602 `const GATEKEEPER_BLOCK_THRESHOLD = 3;`. 이 값들은 UI에 그대로 노출된다 — 62746 `Section title={`🤖 점검 중 … (${verificationSession.responses.length + 1}/${VERIFICATION_MAX_RESPONSES})`}`, 62750 진행바 `(responses.length / VERIFICATION_MAX_RESPONSES) * 100`. 종료 판정도 37660/37698/37707/37708에서 이 상수만 본다. 대조군: 40519-40530 autoMatchSettings는 ratingGap 250·predictionRate 75·h2hStreak 3 등 7개 임계값 + mode/speed를 사용자가 편집(54474 `Number(criteria.ratingGap.threshold) || 250`), 68747-68765는 자동승인 '최소 승수/최대 패수'까지 TextInput으로 노출, 68847-68852는 의심도 6개 항목 스테퍼 + 프리셋 3종.


**왜 있으나 마나인가** — 사용자가 실제로 지불하는 비용(한 작품 자리 잡는 데 답해야 하는 비교 횟수)만 유일하게 조절 불가다. 곁가지 임계값 13개는 스테퍼·입력창까지 주면서 정작 '11번 물어봄'은 코드 상수다.


**사용자가 보는 손해** — 하이브리드 사용자는 작품 하나 검증할 때마다 최대 11번의 비교를 강제로 답해야 하고, 대충 빨리 끝내고 싶어도(3~4회) 정밀하게 하고 싶어도(20회) 방법이 없다. 수문장 후보도 누적 3회 차단이라는 고정 기준이라, 라이브러리가 작으면 제안이 거의 안 뜨고 크면 계속 뜬다.


**개선안** — appSettings.verificationConfig(gallopMax/binaryMax/gatekeeperThreshold)를 신설해 '🔍 의심도 민감도' 섹션(68832)에 스테퍼로 추가하고, 37660/37698/37707/37708/62746/62750과 getGatekeeperCandidates 기본 인자(38170)가 그 값을 읽게 한다. 최소한 '빠름(5)/보통(11)/정밀(15)' 프리셋만이라도 노출.


<details><summary>검증자 재확인 노트</summary>

상수는 인용대로 존재: 37592-37594(GALLOP 7 + BINARY 4 = 11), 37602 GATEKEEPER_BLOCK_THRESHOLD=3, UI 노출 62746/62750, 종료 판정 37660/37698/37701/37707/37708. 설정 UI 부재도 확인(`검증 설정`/`질문 수`/`verificationConfig`/`maxResponses` grep 0건, 68810-68856 하이브리드 설정 섹션은 의심도 6개 스테퍼만). 대조군도 사실(40518-40531 autoMatchSettings 7개 임계값, 68748-68774 자동승인 3개 TextInput). 하지만 '11번을 강제로 답해야 하고 빨리 끝낼 방법이 없다'는 반박된다 — 62849-62894에 '시퀀스 중단'과 '이 작품 건너뛰기' 버튼이 있어 언제든 종료 가능하고(응답은 폐기), 37708 `if (hi - lo <= 1) return {stop:true, reason:'decisive'}`와 37674-37678(infIdx===0 → 즉시 'rejected')로 대부분 세션은 11회 전에 수렴 종료한다. 갤로핑 offset 1,3,7,15…(37700-37704) 구조상 소규모 라이브러리는 4~6회면 끝난다. 11은 강제 질문 수가 아니라 안전 상한. 수문장 3도 37599-37601 주석에 5→3 하향 튜닝 이력이 남아 있어 '거의 안 뜬다'는 근거 없음. 설정 부재 사실만 인정, 영향 대폭 하향.

</details>


### `HC-4` 의심도 설정 8개 필드 중 decay·cap만 스테퍼가 없어, 프리셋을 누를 때 몰래 바뀌고 되돌릴 방법이 없다

🟨 PARTIAL · ⚪ 낮음 · 미완성


**증거**

> App.jsx 37998-38009 DEFAULT_SUSPICION_CONFIG는 cap·moveBase·moveWindow·matchBase·upsetBase·upsetPerGap·checkLine·decay 8개 필드. 38013-38015 프리셋은 decay를 서로 다르게 준다(conservative 0.8 / balanced 0.85 / sensitive 0.92). 그런데 설정 UI 68847-68852의 stepper는 moveBase·moveWindow·matchBase·upsetBase·upsetPerGap·checkLine **6개뿐**이고 cap·decay는 없다. decay는 실제로 검증 완료마다 전 작품 의심도에 곱해진다(37839 `const _decay = (globalSuspicionConfig.decay != null ? globalSuspicionConfig.decay : 0.85)`), cap은 누적 상한으로 모든 증분 쿼리에 들어간다(38020 `MIN(?, ...)` params[0]=globalSuspicionConfig.cap). 프리셋 활성 표시는 68830 `presetEq = (p) => Object.keys(p).every(k => Number(sc[k]) === Number(p[k]))`.


**왜 있으나 마나인가** — 프리셋 버튼 하나가 화면에 보이지 않는 감쇠 계수까지 바꾸는데, 그 뒤 스테퍼를 하나라도 만지면 presetEq가 깨져 프리셋 하이라이트가 사라진다. 사용자는 자기 decay가 0.8인지 0.92인지 알 수도, 단독으로 고칠 수도 없고, 되돌리려면 68853 '기본값 복원'으로 6개 커스텀 값까지 전부 날려야 한다.


**사용자가 보는 손해** — '민감'을 눌렀다가 세부 값만 조금 낮춘 사용자는 decay=0.92(거의 감쇠 없음)가 그대로 남아 의심도가 계속 누적된다. 설정 화면에 표시된 6개 값만 보면 왜 자동 점검이 계속 뜨는지 설명이 안 되고, 진단할 수단도 없다.


**개선안** — stepper 목록에 decay(0.05 step, 0.5~1.0, '검증 1회당 전체 의심도 감쇠')와 cap(1 step, 5~50)을 추가하거나, 최소한 프리셋 설명에 현재 decay/cap 값을 함께 표시한다.


<details><summary>검증자 재확인 노트</summary>

cap 주장은 반박됨 — 38004 DEFAULT cap:20, 38013 conservative cap:20, 38015 sensitive cap:20으로 세 프리셋과 기본값이 전부 동일해 프리셋으로 cap이 바뀌는 일은 절대 없다(38020 suspicionBumpQuery의 params[0]도 항상 20). decay 주장만 사실: 38008 decay 0.85 / 38013 0.8 / 38015 0.92로 프리셋마다 다르고, 68844-68849 stepper 6개(moveBase·moveWindow·matchBase·upsetBase·upsetPerGap·checkLine)에 decay가 없으며, 37839-37844에서 검증 완료마다 전 작품에 곱해진다. 68830 presetEq가 8개 키 전부를 비교하므로 스테퍼를 하나 만지면 하이라이트가 꺼지는 것도 사실이고, 68813 setSC가 기존 sc에 patch 병합이라 decay는 그대로 남는 것도 사실. 다만 실제 손해 폭은 0.8~0.92 범위(회당 8~20% 감쇠 차)로 '의심도가 계속 누적'까지는 아니고, 68850-68853 '기본값 복원'으로 0.85 회귀는 가능하다. 절반만 사실이므로 하향.

</details>


### `HC-5` 티어 임계값·자동승인 승수까지 편집시키면서, 그 임계값에 도달하는 속도(K/RD)와 시작 점수 1500은 상수

🟨 PARTIAL · ⚪ 낮음 · 하드코딩


**증거**

> App.jsx 19345-19351: `const expected = (ra, rb) => 1/(1+Math.pow(10,(rb-ra)/400));` `const kFactor = (mc, rd) => { const base = 24; const mcAdj = Math.min(1.25, Math.max(0.75, 1.25 - mc/80)); const rdAdj = Math.min(1.25, Math.max(0.75, (rd||350)/350)); return base*(mcAdj*0.6 + rdAdj*0.4); }` — base 24, /400, /80, 0.6/0.4 모두 리터럴. 19365-19366 `newA.rd = Math.max(60, (A.rd||350)*0.98)`, 19386 `INFORMATIVE_PAIR_SIGMA = 200`, 19389 `MATCH_SETTLED_RD = 150`도 마찬가지. 반면 68537-68552는 티어 threshold를 TextInput으로 자유 편집, 68589-68615는 gated 토글, 68694는 티어 추가, 12374-12470 프리셋 7종 + 12473 커스텀 프리셋 5개까지 지원한다. 게다가 `defaultRating: 1500`(12351)은 config 필드인데 편집 UI가 없고 프리셋 7개 전부 1500으로 고정이며, 신규 작품은 48120 `..., globalTierConfig.defaultRating || 1500, 350, ...`로 이 값과 RD 350을 그대로 받는다.


**왜 있으나 마나인가** — 임계값(도착선)은 마음대로 옮기게 하면서 이동 속도와 출발점은 못 바꾼다. 특히 사용자가 threshold를 점수형(예: 90/80/70)으로 바꾸면 모든 작품이 1500에서 출발해 즉시 최상위 티어가 되는데, defaultRating을 90으로 맞출 방법이 없다.


**사용자가 보는 손해** — 작품 수가 적은 사용자는 K=24·RD 0.98 감쇠 때문에 티어가 굳는 데 수십 판이 필요하고, 반대로 빠르게 반영되길 원해도 손댈 곳이 없다. 티어 에디터에서 threshold를 자유 편집한 사용자는 defaultRating 1500과 스케일이 어긋나 전 작품이 한 티어에 뭉치는 상태를 직접 고칠 수 없다.


**개선안** — tierSystemConfig에 eloConfig{kBase, ratingScale, rdFloor, rdDecay, defaultRating}를 추가하고 '🏆 티어 시스템' 섹션에 최소 kBase·defaultRating 두 개는 입력창으로 노출(자동승인 승수 입력창 68751-68765와 동일 패턴). 최소한 threshold 편집 시 defaultRating이 최하위~최상위 범위 밖이면 경고를 띄운다.


<details><summary>검증자 재확인 노트</summary>

인용 코드는 전부 실재: 19345-19351 kFactor(base 24, /400, /80, 0.6/0.4), 19365-19366 rd*0.98 floor 60, 19386 INFORMATIVE_PAIR_SIGMA=200, 19389 MATCH_SETTLED_RD=150. defaultRating도 12351·12388·12406·12420·12439·12451·12467 전 프리셋 1500이고, 전수 grep 결과 12630/23956/38223/45377/48120/52043 등 읽기만 있을 뿐 편집 TextInput이 없음 → '편집 UI 없음'은 사실. 대조군(68520-68556 threshold TextInput, 68694 티어 추가)도 사실. 그러나 피해 서술은 약하다. (1) 'threshold를 90/80/70으로 바꾸면 전 작품이 최상위' 시나리오는 UI가 기존 값 1950/1850…을 그대로 보여주고 68556-68557 onEndEditing이 내림차순 정규화까지 하므로 사용자가 스스로 스케일을 깨야 성립하는 가정이며, 그런 사용 패턴을 뒷받침하는 코드 근거는 없다. (2) K/RD는 ELO 표준 내부 계수로, 19346-19350 자체가 match_count·RD 기반 동적 조절이라 '작품 수가 적으면 굳는 데 수십 판'이라는 주장과 반대 방향(초기 mcAdj 1.25배, RD 350에서 rdAdj 1.25배로 초반 K가 최대)이다. 하드코딩 사실만 인정하고 손해 주장은 기각.

</details>


### `HC-6` 작품 약칭 21개(WORK_IDENTIFIERS)는 1회성 마이그레이션에서만 쓰여, 신규 사용자에겐 영구히 무효

✅ CONFIRMED · ⚪ 낮음 · 사실상 미동작


**증거**

> App.jsx 15191-15197 `const WORK_IDENTIFIERS = ["하늑","전독시","죽사헌",… "시하"]` (21개). 유일한 소비부는 19323 `function isWorkIdentifier(tag){ return WORK_IDENTIFIERS.includes(tag); }` 이고, 그 호출부는 11605 한 곳뿐이다 — 11563 `migrateTagSystem()` 안의 `if (version < 2)` 블록(11589-11619)에서 기존 tag_data를 훑어 aliases로 옮긴 뒤 11565의 `tag_system_version`을 2로 올리고 끝난다. 이후 사용자가 새로 입력하는 태그는 어디서도 이 검사를 통과하지 않는다.


**왜 있으나 마나인가** — 신규 슬롯은 빈 DB 상태에서 마이그레이션이 실행되고 version=2로 마킹되므로, 이 21개 목록은 그 사용자에게 단 한 번도 효과를 내지 못한다. 목록에 항목을 추가하는 UI도 없어서 내가 쓰는 약칭('나혼렙'은 있지만 '데못죽'은 없음)은 영원히 태그로 남는다.


**사용자가 보는 손해** — 태그 입력창에 작품 약칭을 적으면 그대로 일반 태그로 저장돼 태그 통계·취향분석·유의어 점검을 오염시킨다. 앱은 '작품 식별자는 태그가 아니라 별명(aliases)'이라는 규칙을 갖고 있으면서도 사실상 강제하지 않는다.


**개선안** — isWorkIdentifier를 태그 입력/AI 태깅 수용 경로(addNovel·saveEdit·태그 추가)에서도 호출해 aliases로 넘기고, 목록을 tag_registry(workIdentifiers)로 옮겨 태그 관리 화면에서 추가/삭제할 수 있게 한다.


<details><summary>검증자 재확인 노트</summary>

전수 확인 완료. 15191-15197에 21개 배열 실재, 소비부는 19323-19325 isWorkIdentifier 하나뿐이고 그 호출부는 11605 단 한 곳(11588 `if (version < 2)` 블록 내부). 11565에서 tag_system_version을 읽고 11624에서 2로 마킹한 뒤로는 재실행되지 않으며, 42049·42683 두 호출부 모두 initDb 직후(신규 슬롯 포함 빈 DB 상태)에 실행되므로 새 슬롯은 0→2로 마킹만 되고 목록이 단 한 번도 작동하지 않는다는 주장 그대로다. 목록을 늘리는 UI도 없음(`작품 식별자` grep 결과 11561·11592·11606·14759·15189·19321 전부 주석/정의뿐, 태그 입력 경로에 이 검사 없음). 다만 실피해는 태그 통계 오염 수준이라 severity low 유지가 적절.

</details>


### `HC-7` 플랫폼은 무제한 추가 가능하다고 안내하면서, 일괄 지정 UI는 앞 8개만 노출한다

✅ CONFIRMED · ⚪ 낮음 · 미완성


**증거**

> App.jsx 71007-71050 '📱 플랫폼 관리' 섹션 안내문: "추가한 플랫폼은 작품 등록/편집, 필터, 통계에 자동 반영됩니다." 이고 71032-71049에서 개수 제한 없이 addPlatform 가능. 실제로 대부분의 소비부는 전량을 쓴다(59762, 61290, 61511, 64237, 66537, 71063 모두 `PLATFORM_OPTIONS.map`). 그런데 62054만 `{(PLATFORM_OPTIONS || []).slice(0, 8).map(p => (` 로 잘라 렌더한다 — FACTORY_PLATFORM_OPTIONS(19602)가 이미 6개라 커스텀 2개를 넘기면 그 뒤는 이 화면에서 사라진다. 잘린다는 표시도 없이 안내문은 62067 "탭 한 플랫폼으로 모두 교체됩니다"만 나온다.


**왜 있으나 마나인가** — 동일 데이터에 대해 어떤 화면은 전량, 한 화면만 상한 8. 상한을 넘긴 사용자에게는 '내가 만든 플랫폼이 왜 여기만 없지'라는 무언의 버그로 보인다.


**사용자가 보는 손해** — 커스텀 연재처를 3개 이상 추가한 사용자는 예정작 일괄 편집에서 그 플랫폼으로 일괄 지정할 수 없어, 작품을 하나씩 열어 수동 지정해야 한다.


**개선안** — 62054의 slice(0, 8)를 제거하고 flexWrap 목록(이미 62053에 `flexWrap: "wrap"` 적용됨)에 전량을 렌더하거나, 가로 스크롤로 감싼다. 상한이 꼭 필요하면 '더 보기'를 붙인다.


<details><summary>검증자 재확인 노트</summary>

62054 `{(PLATFORM_OPTIONS || []).slice(0, 8).map(p => (` 실재하고, 같은 데이터의 다른 소비부 59762·61290·61511·64237·66537·71011·71063은 모두 전량 map. 19602 FACTORY_PLATFORM_OPTIONS는 6개(문피아·리디·카카페·노벨피아·시리즈·조아라)라 커스텀 3개째부터 잘림. 71007-71009 안내문('작품 등록/편집, 필터, 통계에 자동 반영됩니다')과 71031-71050 무제한 addPlatform도 확인, 62066 안내문도 절단 사실을 알리지 않음. 완화 요소는 71024-71029 removePlatform으로 기본 플랫폼을 숨길 수 있어 총 8개 이하로 맞추면 회피 가능하다는 점 정도 — 그것도 사용자가 원인을 알아야 가능한 우회라 결함은 유효. 영향 범위가 예정작 일괄 편집 한 화면이라 low 유지.

</details>


---

## 추천 기능


### `REC-4` 콘텐츠 필터(완결만/최소 회차/19금 제외)가 메타 없는 후보를 무조건 통과시켜, 필터를 켜도 조건 위반작이 추천된다

✅ CONFIRMED · 🔴 높음 · 미완성 · 🔍 직접확인


**증거**

> 45268 `const targets = cands.filter((c) => !c.meta && (c.url || c.link)).slice(0, WEB_RECO_ENRICH_CAP);` (WEB_RECO_ENRICH_CAP = 10, 17759). 보강 후 필터는 45281~45285로, `if (web.workStatus === "completed" && m && m.workStatus && m.workStatus !== "completed") return false;` 처럼 전부 `m &&` 가드가 걸려 있다 — 즉 meta가 없으면 무조건 통과다(주석도 45280 '메타가 끝내 없으면 종전대로 통과'). 후보 수는 키워드 3개 × mergeSearchResults limit 40(18010)에서 최대 120건이 들어오는데 보강은 10건뿐이다.


**왜 있으나 마나인가** — 리디·네이버시리즈·카카오 후보는 검색 단계에서 meta가 아예 없으므로(18085/18184/17903), 이들 수십 건은 '완결만'/'19금 제외'/'최소 회차' 어떤 필터도 적용받지 않고 최종 slice(0, wantN)까지 그대로 살아남는다. 필터가 실제로 걸리는 건 노벨피아·문피아 + 보강 성공한 최대 10건뿐이다.


**사용자가 보는 손해** — '완결만'으로 설정해도 연재중 작품이, '19금 포함' 토글을 꺼도 성인물이 추천 카드에 그대로 뜬다. 사용자는 필터가 고장났다고 느끼고, 필터를 켜면 매 fetch마다 최대 12초 추가 지연(45276)만 떠안는다.


**개선안** — 필터가 켜진 상태에서 메타를 못 얻은 후보는 통과가 아니라 '후순위'로 강등하고(정렬 키에 unknown 페널티 부여), 최종 wantN을 채울 때 메타 확정 후보를 우선 채우도록 바꿔라. 또는 보강 대상을 '최종 선정 후보 wantN×2건'으로 좁혀 상한 10건 안에서 실제로 선정될 후보만 확인하도록 순서를 뒤집어라.


<details><summary>검증자 재확인 노트</summary>

45266 wantContentFilter, 45268 `cands.filter((c)=>!c.meta && (c.url||c.link)).slice(0, WEB_RECO_ENRICH_CAP)`, 17759 `WEB_RECO_ENRICH_CAP = 10`, 45276 12초 데드라인, 45280~45286 필터가 전부 `m &&` 가드(주석 45279 '메타가 끝내 없으면 종전대로 통과')까지 인용 그대로 실재. 후보 규모도 확인: 45213 numKw=3(17758 WEB_RECO_MAX_KEYWORDS=3), searchNovels→mergeSearchResults 기본 `limit = opts.limit || 40`(18017), perPlatform 12 → 키워드당 최대 40건, 3키워드 최대 120건 유입인데 보강은 10건. 리디/네이버시리즈/카카오는 검색 단계 meta 부재(18085/18184/17903) 확정. 다른 분기의 방어 없음 — 45224의 platSet 필터는 플랫폼만 거른다.
부분 정정 두 가지: (1) 기본 설정(37255 includeAdult:true, 37256 minEpisodes:0, 37254 workStatus:'all')에서는 wantContentFilter=false라 보강도 지연도 없다 — 손해는 필터를 켠 사용자 한정. (2) 최소 회차 항목은 60177에서 '(회차 정보 있는 작품에만)'이라고 UI가 한계를 고지한다. 반면 60171~60174 연재 상태와 60200 19금 토글에는 아무 고지가 없어 '19금 제외/완결만'이 조용히 새는 것은 그대로 결함.

</details>


### `REC-1` 넷상 추천 '정렬' 칩 4개가 화면 순서에 전혀 반영되지 않는다 — loadWebReco가 항상 taste_score DESC로 덮어씀

🟨 PARTIAL · 🟡 중간 · 사실상 미동작 · 🔍 직접확인


**증거**

> fetchWebRecommendations는 45299~45303에서 `const sortMode = web.sort || "random"` 로 cands를 정렬한 뒤 45304 `const chosen = cands.slice(0, wantN)` 로 N개만 고른다. 그러나 저장 후 45320에서 호출하는 loadWebReco는 45003 `SELECT * FROM web_reco WHERE status='pending' ORDER BY pinned DESC, fetched_at DESC, taste_score DESC;` 로 다시 정렬한다. 한 배치의 모든 행은 45318에서 같은 `nowMs`를 fetched_at으로 넣으므로 fetched_at은 전부 동타이 → 실제 표시 순서는 언제나 taste_score DESC 하나뿐이다. UI(60614~60622)는 이 배열을 그대로 map한다.


**왜 있으나 마나인가** — 설정에서 '무작위/취향순/인기순/숨은작'을 아무거나 골라도 카드가 화면에 뿌려지는 순서는 동일하다. 정렬 모드는 '어떤 5개를 담을지'만 바꿀 뿐, 사용자가 정렬 칩을 눌러 기대하는 '순서'는 바뀌지 않는다. 게다가 대부분 후보의 taste_score가 0이라(45291~45298, meta.genres/category가 preference_patterns 키와 맞아야 점수 발생) 동점 다수 → 실제 순서는 SQLite 임의 순서다.


**사용자가 보는 손해** — 사용자가 '인기순'으로 바꾼 뒤 목록을 봐도 순서가 그대로라 설정이 먹히지 않는다고 느끼고, 정렬을 계속 바꿔가며 '🎲 가져오기'를 반복하게 된다(20초 쿨다운 + 5개 플랫폼 스크레이핑 반복).


**개선안** — 45003 쿼리의 ORDER BY를 `pinned DESC, fetched_at DESC, rowid` 로 바꿔 삽입 순서(= 정렬 결과 순서)를 보존하거나, web_reco에 `rank INTEGER` 컬럼을 추가해 45305~45319 INSERT 루프에서 정렬 순위를 함께 저장하고 그 컬럼으로 ORDER BY 하라.


<details><summary>검증자 재확인 노트</summary>

인용 코드는 전부 실재 확인. 45003 `ORDER BY pinned DESC, fetched_at DESC, taste_score DESC`, 45201 `const nowMs = Date.now()` → 45317에서 배치 전 행이 동일 nowMs를 fetched_at으로 사용, 45299~45303 정렬 후 45304 slice, 45320 loadWebReco 재정렬. UI는 60598~60614에서 밴 필터만 걸고 재정렬 없이 map(setWebRecoList는 45004/45404 두 곳뿐, 다른 정렬 경로 없음). 여기까지는 CONFIRMED.
그러나 영향이 과장됨: (a) 정렬 칩은 '어떤 후보가 저장되는지'를 실제로 바꾼다 — random은 45303 셔플, popular/hidden은 45301/45302 정렬 후 45304에서 상위 N만 INSERT되므로 사용자가 받는 '작품 집합'은 칩에 따라 달라진다. '설정이 먹히지 않는다'는 서술은 틀렸다. (b) 'taste' 칩은 저장 순서와 표시 순서가 일치해 결함이 없다. (c) 주장 스스로 근거로 든 '대부분 taste_score=0 동점' 상황에서는 세 정렬 키가 모두 동타이라 SQLite가 사실상 스캔(=삽입) 순서로 돌려주므로 오히려 칩 순서가 보존되는 쪽이다 — 자기모순. 실제 손해는 wantN(기본 5) 카드 내부의 배열 순서 한정.

</details>


### `REC-2` '인기순'/'숨은작' 정렬은 노벨피아 작품에만 popularity가 존재해 사실상 '노벨피아 골라내기'로 동작

✅ CONFIRMED · 🟡 중간 · 품질 미흡 · 🔍 직접확인


**증거**

> popularity를 만드는 코드는 App.jsx 전체에서 18372 `popularity: Math.max(Number(it.count_view) || 0, Number(it.count_book) || 0)` (novelpiaItemToMeta) 한 곳뿐이다. 검색 파서 중 후보에 `meta`를 붙이는 것은 노벨피아(18391 `meta,`)와 문피아(18238/18317, popularity 필드 없음)뿐이고, 리디(18085~18091)·네이버시리즈(18179~18187)·카카오(17903)는 meta 자체가 없다. 정렬은 45301 `((b.meta && b.meta.popularity) || 0)`, 45302 `(a.meta && a.meta.popularity) != null ? ... : 1e9` 로 계산된다.


**왜 있으나 마나인가** — popular 정렬에서 리디/네이버/카카오/문피아 후보는 전부 0으로 취급돼 노벨피아 작품이 무조건 앞으로 오고, hidden(숨은작) 정렬에서는 이들이 1e9로 맨 뒤에 밀린다. 즉 두 정렬 모두 '인기/비인기'가 아니라 '노벨피아냐 아니냐'를 정렬한 것이다. 설정에서 노벨피아를 대상 플랫폼에서 끄면 두 정렬은 완전 무동작(전부 동점)이 된다.


**사용자가 보는 손해** — '숨은작'을 골라 무명작을 찾으려던 사용자가 실제로는 노벨피아 저조회수작만 받게 되고, 리디/네이버의 진짜 숨은 작품은 구조적으로 배제된다.


**개선안** — 정렬 옵션에 popularity 가용성 게이트를 붙여라 — popularity가 있는 후보가 전체의 일정 비율 미만이면 인기순/숨은작 칩을 비활성화하고 '노벨피아만 지원' 배지를 노출하거나, 리디/네이버 파서에서 리뷰수·별점수 같은 대체 인기 지표를 채워라. 최소한 45301/45302에서 popularity 미보유 후보는 정렬 대상에서 빼고 원래 순서를 유지하도록 안정 정렬로 바꿔야 한다.


<details><summary>검증자 재확인 노트</summary>

grep 결과 meta에 popularity를 채우는 곳은 18372 `popularity: Math.max(Number(it.count_view)||0, Number(it.count_book)||0)` (novelpiaItemToMeta) 뿐. 검색 파서 확인: 리디 18085, 네이버시리즈 18184, 카카오 17903에는 meta 필드 자체가 없고, 문피아 18238/18317의 meta에는 popularity 키가 없다. 노벨피아만 18384~18394에서 meta를 붙인다. 정렬은 45301/45302에서 `(b.meta&&b.meta.popularity)||0` / 없으면 1e9. 60187의 대상 플랫폼 칩에서 노벨피아를 끄면 두 정렬 모두 전 후보 동점 → 무동작. 반박 시도했으나 우회 경로 없음.
단 한 가지 정정: 45273의 메타 보강은 `popularity: mm.popularity || 0`을 명시 대입하므로, 콘텐츠 필터가 켜진 경우 보강된 최대 10건은 1e9가 아니라 0이 되어 hidden 정렬 '맨 앞'으로 온다(주장의 '1e9로 맨 뒤' 서술은 기본값 경로에서만 정확). fetchNovelMeta는 노벨피아 URL 외에는 popularity를 반환하지 않으므로 이 값은 항상 0.

</details>


### `REC-3` 밴 키워드가 '취향 키워드 풀'에는 적용되지 않아, 기본 설정에서 검색어 3개 중 2개가 밴을 우회한다

🟨 PARTIAL · 🟡 중간 · 미완성


**증거**

> buildExploreKeywordPool의 add는 45064~45068에서 `if (!kw || kw.length < 2 || kw.length > 14 || banned.has(kw)) return;` 로 밴을 거른다. 그러나 buildTasteKeywordPool의 add는 45091 `const add = (kw, w) => { kw = String(kw || "").trim(); if (kw && kw.length >= 2 && kw.length <= 14) out.set(kw, Math.max(out.get(kw) || 0, w)); };` — banned 변수 자체가 이 함수에 선언되어 있지 않다. pickRecoKeywords는 45183 `const nTaste = Math.round(numKw * ratio);` 로 기본 ratio 0.7·numKw 3에서 2개를 취향 풀에서 뽑는다. UI 설명문(60207)은 '밴은 검색 선정과 결과 모두에서 제외돼요'라고 명시한다.


**왜 있으나 마나인가** — 사용자가 'BL'을 밴해도 preference_patterns에 tag:BL 승률 행이 있으면 취향 풀에서 그대로 뽑혀 검색어로 쓰인다. 그 검색 결과는 뒤늦게 45260 matchesBannedKeyword에서 전부 걸러지므로, 그 검색 슬롯은 결과 0건으로 통째로 낭비된다.


**사용자가 보는 손해** — 밴을 걸수록 한 번의 '가져오기'에서 쓰이는 3개 검색어 중 최대 2개가 헛돌아 추천 개수가 설정한 5작보다 적게 나오고, '조건에 맞는 새 작품을 못 찾았어요' 에러(45286)를 자주 보게 된다. UI가 약속한 '검색 선정에서 제외'도 거짓이다.


**개선안** — 45091의 add에 explore 쪽과 동일한 `banned.has(kw)` 가드를 넣고, banned 집합을 buildTasteKeywordPool 상단에서 `reco.bannedKeywords`로 만들어라(두 풀이 catCache를 공유하듯 banned 집합도 pickRecoKeywords에서 만들어 넘기는 편이 낫다).


<details><summary>검증자 재확인 노트</summary>

메커니즘은 실재 확인. buildExploreKeywordPool은 45062 `const banned = new Set(...)` + 45066 `banned.has(kw)` + 45079 harvest에도 밴 적용. 반면 buildTasteKeywordPool(45086~45115)에는 banned 선언이 아예 없고 45091 add에도 밴 검사 없음, 45102~45113 폴백(고티어 태그) 경로도 무필터. pickRecoKeywords(45150~45175)에도 사후 밴 필터 없음. grep 'banned' 전수 확인 결과 밴 적용 지점은 45062/45066/45079/45260/60600 뿐 — 다른 우회 방지 가드 없음. UI 문구 60208 '밴은 검색 선정과 결과 모두에서 제외돼요', 60886 '검색 키워드 선정에서 빠지고'는 실제와 불일치 → 이 부분 CONFIRMED.
영향은 과장: 45093은 `WHERE sample_size >= 3 AND win_rate >= 0.55`인데, win_rate는 13174(`sample_size >= 5`)에서만 채워지므로 취향 풀에 들어가려면 '표본 5+ & 승률 55%+'여야 한다. 즉 사용자가 싫어서 밴한 키워드는 애초에 승률이 낮아 풀에 없을 확률이 높고, 누수는 '높게 평가하지만 추천은 원치 않는' 키워드(예: 19금·BL)로 한정된다. '밴을 걸수록 3개 중 2개가 헛돈다'는 성립하지 않는다(2개는 밴 여부와 무관하게 취향 풀에서 뽑히는 정상 슬롯).

</details>


### `REC-5` 'AI 키워드 생성' 토글: 매번 LLM을 호출하지만 생성된 2개가 실제 검색어로 뽑힐 확률은 1% 안팎

🟨 PARTIAL · 🟡 중간 · 사실상 미동작


**증거**

> 45157 `if (web.useAiKeywords) { const ai = await generateAiKeywords(2); for (const k of ai) explore = [...explore, { kw: k, weight: 1.5 }]; }` — 개수는 호출부에 2로 하드코딩, 가중치도 1.5 고정. 반면 explore 풀은 45071 SUB_GENRES(FACTORY_SUB_GENRES 106개, 13894~13916) weight 1.0 + 45072 MAJOR_GENRES(33개, 13882~13891) 0.8 + 서재 태그 1.1 + 45078 `SELECT ... FROM web_reco_keywords ORDER BY hit_count ASC LIMIT 400` 까지 합쳐 수백 개다. 뽑는 횟수는 45184~45186의 draw뿐이고 기본값(numKw=3, ratio=0.7)에서 explore 몫은 단 1회다.


**왜 있으나 마나인가** — 총 가중치 300~500 중 AI 몫은 3.0 → 한 번의 explore 추첨에서 AI 키워드가 선택될 확률은 대략 1%. 그런데 비용은 매 fetch마다 발생한다(45124~45141, timeoutMs 15000). 100번 '가져오기'를 해야 한 번 쓰일까 말까 한 기능에 매번 API 호출과 최대 15초 대기를 지불한다.


**사용자가 보는 손해** — 토글을 켜도 추천 결과가 사실상 달라지지 않는데 API 비용과 가져오기 지연만 늘어난다. 사용자는 '트렌디 키워드 추가'라는 힌트(60199)를 믿고 켜지만 체감 차이가 없다.


**개선안** — AI 키워드는 explore 풀에 섞지 말고 별도 슬롯으로 보장하라 — numKw 중 1개를 AI 전용 슬롯으로 예약하거나(picks에 직접 push), 최소한 weight를 풀 총합 대비 비율(예: 총합의 20%)로 동적 산정하고 생성 개수도 설정 UI로 노출하라.


<details><summary>검증자 재확인 노트</summary>

수치 근거는 실재. 45157 `const ai = await generateAiKeywords(2); ... { kw: k, weight: 1.5 }`(개수·가중치 하드코딩, 설정 UI는 60201의 on/off 토글뿐), 45118~45146 timeoutMs 15000. 풀 규모도 확인: 13882 FACTORY_MAJOR_GENRES ≈34개(×0.8), 13894 FACTORY_SUB_GENRES ≈106개(×1.0, 45070 expandSearchSeeds로 더 늘어남), 45075 커스텀 1.6, 45078 harvest LIMIT 400 → 총 가중 수백. 추첨은 45170~45172뿐이고 기본(numKw=3, ratio 0.7)에서 nTaste=round(2.1)=2 → explore 추첨 1회. 1회 추첨에서 AI 몫 3.0/수백 ≈ 1% 계산은 타당.
다만 결정적 누락: 45144에서 생성된 AI 키워드를 `web_reco_keywords`에 source='ai', hit_count=1로 INSERT한다. 45078은 `ORDER BY hit_count ASC LIMIT 400`이므로 hit_count=1인 AI 키워드는 이후 모든 fetch에서 항상 400 안에 들어와 weight≈1.2/(1+ln2)≈0.71로 계속 후보가 된다. 즉 '한 번 쓰이고 버려지는 1%'가 아니라 누적 적립되는 구조라, 반복 사용 시 explore 풀 내 AI 지분은 계속 커진다. '100번 가져오기를 해야 한 번 쓰일까 말까'는 과장. 비용도 매 fetch 1회 호출은 맞으나 15초는 타임아웃 상한이지 상시 지연이 아니고, 45119 전체 try/catch + 45123/45132 키 미설정 시 즉시 []로 반환된다.

</details>


### `REC-6` '취향 ↔ 탐험' 슬라이더가 취향 점수엔 관여하지 않고 하드코딩된 8개 카테고리 버킷만 재조정하며, 배정이 UI 설명과 반대다

🟨 PARTIAL · 🟡 중간 · 미완성


**증거**

> 44811~44819: `const CAT_AXIS = { taste_high_tier: "t", taste_match_paused: "t", reread_recommend: "t", almost_done: "t", planned_unread: "t", low_data: "e", other: "e", high_tier_less_read: "e" };` 이후 `c.weight *= axis === "t" ? (0.5 + tasteRatio) : (0.5 + (1 - tasteRatio));`. 슬라이더 값 tasteRatio는 44364에서만 읽히고, 이 곱셈 외에는 어디에도 쓰이지 않는다. 반면 computeTasteScore의 결과(taste.score)는 44647·44667·44680·44695·44710·44751·44762·44772에서 카테고리와 무관하게 항상 base weight에 더해진다. UI 설명은 60100 `탐험↑: 안 읽은·데이터 적은 작품 위주`.


**왜 있으나 마나인가** — 슬라이더를 '탐험 100'으로 밀면 '📋 아직 읽지 않은 예정작'(planned_unread)이 t축이라 가중치가 0.5배로 깎인다 — 설명문이 약속한 '안 읽은 작품 위주'와 정확히 반대다. 반대로 e축인 high_tier_less_read는 사용자가 직접 상위 티어로 매긴 작품(=가장 취향에 맞는 작품)인데 '탐험'으로 분류돼 있다. 또한 취향 계산의 본체인 taste.score는 슬라이더와 무관하게 모든 버킷에 그대로 더해지므로, '취향 비중 0'으로 둬도 취향 점수 높은 작품이 각 버킷 안에서 계속 우선된다.


**사용자가 보는 손해** — 새 작품을 발굴하려고 슬라이더를 탐험 쪽으로 밀면 오히려 아직 안 읽은 예정작이 덜 나오고, 이미 상위 티어로 평가한 익숙한 작품이 더 나온다. 슬라이더 조작의 결과가 라벨과 반대라 사용자는 방향을 학습할 수 없다.


**개선안** — CAT_AXIS를 카테고리 하드코딩이 아니라 '이미 읽은 정도/취향 점수'로 계산하라 — planned_unread·low_data처럼 미읽음 신호가 있는 것은 e축, taste_* 계열만 t축으로 재배정하고, 추가로 tasteRatio를 taste.score 가산항의 계수(`base + taste.score * tasteRatio * 2`)로도 반영해 슬라이더가 실제 취향 점수 비중을 바꾸게 하라.


<details><summary>검증자 재확인 노트</summary>

코드는 인용 그대로 실재. 44811~44814 CAT_AXIS(planned_unread:'t', high_tier_less_read:'e'), 44817 `c.weight *= axis === "t" ? (0.5 + tasteRatio) : (0.5 + (1 - tasteRatio))`. grep 'tasteRatio' 전수 결과 44364(정의)와 44817(사용) 단 2곳 — 취향 점수 계산에는 전혀 개입하지 않음이 확정. computeTasteScore 결과가 44651/44684/44697/44715/44733/44749/44763/44776에서 카테고리와 무관하게 base weight에 가산되는 것도 확인. 따라서 '슬라이더는 버킷 배율만 바꾸고 취향 점수는 못 끈다'는 절반 구현 지적은 CONFIRMED.
'설명과 정확히 반대'는 과장이라 감점: 60100 문구 '탐험↑: 안 읽은·데이터 적은 작품 위주'에서 '데이터 적은'은 low_data(e축), '덜 읽은'은 high_tier_less_read(e축)로 라벨과 부합한다. 어긋나는 건 planned_unread 하나이고, 이는 '사용자가 직접 담아둔 위시리스트=취향'이라는 해석도 성립해 명백한 버그라 단정할 수 없다. 또 44817 배율 범위는 0.5~1.5로 44800/44803의 다양성 감점(×0.5/×0.6)과 같은 급이라 '조작해도 효과 없음'은 아니다.

</details>


### `REC-8` 취향 승률 백분율이 표본 5건에서도 그대로 노출되고, 코드가 내세운 sample_size>=3 게이트는 win_rate가 NULL이라 아무 의미가 없다

✅ CONFIRMED · 🟡 중간 · 품질 미흡


**증거**

> win_rate를 채우는 유일한 경로는 13174 `SELECT id, sample_size, win_count FROM preference_patterns WHERE sample_size >= 5 ...` → 13191~13210 UPDATE다. 즉 sample_size 3~4 행의 win_rate는 영원히 NULL이다. 그런데 추천은 44420 `WHERE sample_size >= 3` 으로 읽고 44536~44540에서 `factors.push(\`${g} 장르 선호도 ${pct}%\`)`, `chips.push({ label: g, value: \`${pct}%\` ...})` 로 백분율을 그대로 보여준다. 완화 장치인 _confGate(44493~44501)는 `return Math.max(0.5, Math.min(1, w));` 로 하한이 0.5라 소표본도 절반만 감쇠된다. 넷상 추천의 taste_score도 45291 `WHERE sample_size>=3` + `(wr - 0.5) * 100` 을 쓴다.


**왜 있으나 마나인가** — 5전 4승이면 '판타지 장르 선호도 80%'라는 확정적인 수치가 카드에 뜬다. 반대로 3~4표본 행은 win_rate가 NULL이라 `(null - 0.5) * 100` → 0 기여, `null >= 0.55` → false로 조용히 무시되므로 '>=3' 임계는 실제로는 '>=5'다. 코드 주석(44497)은 '3~4는 floor(0.5)로 반감만 됨'이라고 적혀 있으나 실제로는 0 기여로, 문서와 동작이 다르다.


**사용자가 보는 손해** — 매칭 몇 판만 한 초기 사용자에게 '이 장르 선호도 80%', '취향 적합도 62' 같은 숫자가 확정치처럼 제시된다. 그 근거로 추천된 작품이 취향과 어긋나면 추천 전체에 대한 신뢰가 무너진다.


**개선안** — 표본 수를 UI에 항상 병기하라(chips의 value를 `80% (5전)`). 그리고 임계를 하나로 통일해 refreshPatternStats의 5와 추천부의 3 중 하나로 맞추고, 표본 10 미만은 백분율 대신 '약함/보통/강함' 같은 정성 라벨로 표시하라.


<details><summary>검증자 재확인 노트</summary>

전 경로를 직접 추적해 확인했고 반박 근거를 찾지 못했다. win_rate를 쓰는 경로는 두 곳뿐: 13123~13129 batchUpdatePatternStats의 INSERT/UPSERT는 sample_size·win_count만 갱신하고 win_rate를 전혀 건드리지 않으며, 13174 `WHERE sample_size >= 5 AND category NOT IN(...)` → 13208~13219 UPDATE만이 win_rate를 채운다. 따라서 sample 3~4 행의 win_rate는 영구 NULL이 맞다. 소비 측은 44417~44421 `WHERE sample_size >= 3`, 44535 `gs.sampleSize >= 3`, 44537 `Math.max(0,(gs.winRate-0.5)*100)` → NULL이면 0, 44543 `gs.winRate >= 0.55` → NULL이면 false. 즉 '>=3' 임계는 실질 '>=5'. 44497~44498 주석('sample 3~4는 floor(0.5)로 반감만 됨')과 실제(0 기여)가 어긋나는 것도 확인. _confGate는 44505 `return Math.max(0.5, ...)`로 하한 0.5 맞음. 45291도 `sample_size>=3` + `(wr-0.5)*100`.
표시 경로도 실물 확인: 44545 `factors.push(\`${g} 장르 선호도 ${pct}%\`)` → 44640 buildTasteReason이 '🧠 취향 분석:'으로 reason에 합성 → 60310에서 그대로 렌더, 60329~60333에 '🧠 취향 적합도 {score}/100' 게이지. 표본 수는 어디에도 병기되지 않는다(5전 4승 → '80%').
주장이 놓친 가중 요소까지 확인: 44422~44423에서 win_rate가 NULL인 행만 있어도 hasPatterns=true가 서고 genreScores가 채워지므로, 44531 조건이 참이 되어 44550~44556 폴백(고티어 일치 25점)이 차단된다 — 소표본 사용자는 폴백조차 못 받고 0점을 받는다. 지적한 문제보다 오히려 나쁘다.

</details>


### `REC-7` 넷상 추천작이 자정에 통째로 삭제되며 보존 기간을 바꿀 설정이 없다 (WEB_RECO_TTL_DAYS 상수는 참조조차 안 됨)

🟨 PARTIAL · ⚪ 낮음 · 하드코딩


**증거**

> 17755 `const WEB_RECO_TTL_DAYS = 1;` 는 App.jsx 전체에서 선언 외 참조가 0회다(grep 결과 17755 단 한 줄). 실제 정리는 45010~45013 `const d = new Date(); d.setHours(0, 0, 0, 0); const todayStart = d.getTime(); await exec("DELETE FROM web_reco WHERE pinned=0 AND status='pending' AND fetched_at < ?;", [todayStart]);` 로 '오늘 0시' 하드코딩이며, 이 함수는 추천 탭에 들어올 때마다(45415~45420 useEffect) 실행된다. 설정 UI(60145~60210)에 보존 기간 항목은 없다.


**왜 있으나 마나인가** — TTL이 '1일'이 아니라 '다음 자정까지'라 밤 23시에 가져온 추천은 몇 분 뒤 탭을 다시 열면 사라진다. 상수 이름은 조정 가능한 TTL처럼 보이지만 로직은 상수를 전혀 쓰지 않아, 값을 고쳐도 동작이 안 바뀐다.


**사용자가 보는 손해** — 자기 전에 받아둔 추천작 5개를 아침에 다시 보려 하면 이미 지워져 있다. ⭐보관을 일일이 눌러둔 것만 남으며, 20초 쿨다운(17757)을 감수하고 다시 스크레이핑해야 한다.


**개선안** — cleanupExpiredWebReco의 기준을 `Date.now() - WEB_RECO_TTL_DAYS * 86400000` 같은 실제 경과시간으로 바꾸고, TTL 일수를 reco.web 설정(1~7일)으로 노출하라. 최소한 '가져온 지 24시간' 기준으로 바꿔야 밤에 받은 추천이 살아남는다.


<details><summary>검증자 재확인 노트</summary>

사실관계는 맞다. 17755 `const WEB_RECO_TTL_DAYS = 1;`는 grep 전수 결과 선언 1회뿐 참조 0회. 실제 정리는 45011~45014의 `d.setHours(0,0,0,0)` 기준 하드코딩이고 45411~45431 useEffect가 추천 탭 진입마다 실행. 60149~60210 넷상 추천 설정 UI를 전부 읽었으나 보존 기간 항목 없음(작 수/비중/정렬/연재상태/최소회차/플랫폼/19금/AI/자동/키워드관리뿐).
그러나 severity 하향 사유 셋: (1) 60604에 '안 담으면 다음날 정리돼요(⭐ 보관 제외)'라고 UI가 동작을 정확히 고지한다 — 사용자가 속는 구조가 아니다. (2) '밤 23시에 가져온 추천이 몇 분 뒤 사라진다'는 틀렸다. todayStart는 당일 0시이므로 23시 배치는 fetched_at > todayStart라 자정 전까지는 절대 삭제되지 않는다. (3) 45306에서 어차피 매 fetch마다 미보관 pending을 전량 DELETE하므로 배치는 본래 1회성이며, 45402 pinWebReco로 보존 수단이 제공된다. WEB_RECO_TTL_DAYS 미참조 자체는 죽은 상수(별도 조사 범위인 죽은 코드에 가까움).

</details>


---

## 데이터 관리 (백업·슬롯·클라우드·일괄)


### `DAT-1` 클라우드 동기화 전체가 빈 상수 하나로 봉인돼 있어 최종 사용자는 절대 켤 수 없다

🟨 PARTIAL · 🟡 중간 · 사실상 미동작 · 🔍 직접확인


**증거**

> App.jsx:9128 `const GOOGLE_OAUTH_CLIENT_ID = "";` / 9139 `function cloudIsConfigured() { return !!GOOGLE_OAUTH_CLIENT_ID; }` / 56837·56923·57005 모든 진입점이 `if (!cloudIsConfigured()) return {ok:false, error:"GOOGLE_OAUTH_CLIENT_ID 미설정"}` / UI 69718-69721은 `⚠️ 설정 필요 — 구글 OAuth 클라이언트 ID(GOOGLE_OAUTH_CLIENT_ID)와 동의 화면을 먼저 구성해야 사용할 수 있어요. (docs/cloud-sync-plan.md 참고)`. 앱 어디에도 클라이언트 ID를 입력하는 입력창이 없다(grep 결과 GOOGLE_OAUTH_CLIENT_ID를 쓰는 곳은 상수 정의·검사·AuthRequest 뿐).


**왜 있으나 마나인가** — OAuth 로그인·Drive REST·매니페스트·증분 자산 업로드·원격 슬롯 피커까지 1,000줄 가까이 구현돼 있고 설정 화면에 카드까지 그려지지만, 배포된 APK에서는 상수가 ""라 항상 첫 분기에서 끊긴다. 유일한 해결법이 '소스 코드를 고쳐 재빌드'인데 안내 문구는 앱 사용자에게 저장소 문서 경로(docs/cloud-sync-plan.md)를 읽으라고 한다.


**사용자가 보는 손해** — 설정 탭에 '☁️ 클라우드 백업 · 기기 간 동기화(베타)' 항목이 보여서 기기 간 동기화가 되는 앱이라고 믿게 되지만, 실제로는 어떤 조작으로도 활성화할 수 없다. 기기를 바꾸면 결국 수동 JSON 백업만 남는다.


**개선안** — ① 설정 UI에 클라이언트 ID 입력 필드(ai_config와 동일하게 cloud_auth.json 저장)를 추가해 사용자가 자기 OAuth 클라이언트로 붙일 수 있게 하거나, ② 빌드 시점 env(app.json extra)로 주입하고 미설정 빌드에서는 카드 자체를 렌더하지 않기. 최소한 안내 문구에서 개발자 문서 경로를 지우고 '이 빌드에서는 지원하지 않음'으로 바꿔야 한다.


<details><summary>검증자 재확인 노트</summary>

코드 사실은 전부 확인. 9128 `const GOOGLE_OAUTH_CLIENT_ID = "";`, 9139 `cloudIsConfigured(){return !!GOOGLE_OAUTH_CLIENT_ID}`, 게이트는 9183/56837/56923/57005에 존재하고 grep 결과 이 상수를 쓰는 곳은 정의·검사·AuthRequest(9187/9200/9239)뿐 — 앱 내 입력 UI 없음. 다만 '동기화되는 앱이라고 믿게 된다'는 영향 주장은 실제 UI를 읽고 반박: 69718-69721의 미설정 분기는 경고 문구만 렌더하고, 로그인/백업/복원/자동토글 버튼(69726-69766)은 else 분기 안이라 아예 그려지지 않는다. 사용자가 오조작·오신뢰할 표면이 없고, 소유자가 상수 한 줄만 채우면 되는 구조라 '사용자 손해' 강도는 과장. severity 하향.

</details>


### `DAT-2` push 충돌 감지가 '내가 아는 rev'를 보지 않아, 다른 기기의 변경을 조용히 통째로 덮어쓴다

✅ CONFIRMED · 🟡 중간 · 미완성


**증거**

> App.jsx:56854 `const baseRev = (remote && Number(remote.rev)) || 0;` — 원격 매니페스트 값만 읽고 로컬에 저장된 `cloud_rev`(56906에서 쓰고 57011에서 읽음)와는 비교하지 않는다. 56890-56895의 충돌 가드는 `const rr2 = await cloudReadRemoteManifest(...); if (confirmRev !== baseRev) { ... conflict }` 로 '이번 push가 도는 몇 초 사이에 원격이 또 바뀌었는지'만 본다.


**왜 있으나 마나인가** — 충돌 감지처럼 보이지만 실제 발산(divergence) 케이스를 잡지 못한다. 기기 A(localRev=5)가 원격 rev=6(기기 B가 올린 것)을 아직 안 받은 상태에서 push하면 baseRev=6, confirmRev=6이라 충돌 아님으로 통과해 rev=7로 A의 데이터를 올린다. B의 변경은 스냅샷째로 사라지고, 옛 스냅샷은 56904에서 삭제까지 된다.


**사용자가 보는 손해** — 자동 동기화(69761 토글)를 켜 두면 앱을 백그라운드로 보낼 때마다 cloudOnAppBackground(57024)가 push를 돌린다. 포그라운드 복귀 프롬프트(57015)에서 '나중에'를 한 번만 눌러도, 다음에 앱을 닫는 순간 다른 기기에서 한 작업이 통째로 소멸한다. 실패 알림도 없다(silent:true).


**개선안** — push 진입 시 `local cloud_rev < remote.rev`면 즉시 conflict로 중단하고 '원격이 앞섬 — 먼저 가져오기' 를 사용자에게 알릴 것. 최소한 자동 push 경로에서는 로컬이 원격 rev를 반영한 상태일 때만 업로드하도록 조건을 걸어야 한다.


<details><summary>검증자 재확인 노트</summary>

56854 `const baseRev = (remote && Number(remote.rev)) || 0;`는 원격만 읽고, 로컬 `cloud_rev`(56906 쓰기, 57011 읽기)와 비교하는 코드가 push 경로 어디에도 없음(56837-56910 전 구간 확인). 56890-56895 가드는 `rr2` 재조회 후 `confirmRev !== baseRev`만 보므로 A(localRev=5) vs 원격 rev=6 발산 케이스는 baseRev=confirmRev=6으로 통과 → rev=7로 덮어쓰고 56904에서 옛 스냅샷 삭제까지 확인. 57024 `cloudPushRef.current({silent:true, embedCovers:false})`가 백그라운드마다 도는 것도 확인. 유일한 방어는 57015의 사용자 프롬프트(취소 가능)와 69769의 베타 경고 문구뿐인데, 그 문구가 권하는 '번갈아 사용'조차 이 버그로 깨진다는 점에서 가드로 인정 못 함. 다만 9128 게이트 때문에 배포 빌드에서는 잠재 결함이라 severity 하향.

</details>


### `DAT-3` 자동 동기화로 올라간 스냅샷에는 표지가 아예 없는데, UI는 '표지·갤러리도 함께 백업된다'고 단언한다

✅ CONFIRMED · 🟡 중간 · 미완성


**증거**

> App.jsx:57024 `cloudPushRef.current({ silent: true, embedCovers: false })` → 56858 `exportJSON({..., embedLocalCovers: embedCovers})` → 57323 `if (opts && opts.embedLocalCovers) { ... payload.LCV = lcv }` 이므로 자동 push 스냅샷에는 LCV가 없다. 자산 업로드도 56826 `SELECT file_path FROM gallery_images` 로 갤러리 파일만 수집한다(56823 주석: '표지는 스냅샷에 base64로 동봉하므로 자산 업로드는 갤러리 파일만'). 그런데 안내 문구 69724는 조건 없이 `표지·갤러리 이미지도 함께 백업돼요.`


**왜 있으나 마나인가** — 표지 보존 경로가 수동 push에만 존재한다. 백그라운드 자동 push가 마지막 rev를 차지하면 그 스냅샷이 최신 정본이 되고, 복원 측 56940 `lcv = JSON.parse(json)?.LCV || null` 은 null이 되어 표지 복원 루프(56966-56982)가 통째로 건너뛰어진다. 게다가 57327-57328의 `LCV_PER_CAP = 500KB` / `LCV_TOTAL_CAP = 8MB` 초과분 고지(`r.coverDropped`)는 수동 버튼(69744)에서만 뜨고 자동 경로에는 알림이 없다.


**사용자가 보는 손해** — 자동 동기화만 믿고 쓰던 사용자가 새 기기에서 복원하면 표지가 전부 비어 보인다(cover_image에는 옛 기기 file:// 경로만 남음). 라이브러리가 커서 8MB 캡을 넘겨 표지가 잘려나간 경우에도 아무 경고를 못 받는다.


**개선안** — 자동 push도 표지를 포함하되(용량이 문제라면) 표지를 LCV base64 대신 갤러리와 같은 증분 자산으로 업로드해 rev 간 재업로드를 없앨 것. 그리고 69724 문구를 실제 동작(자동 백업은 표지 제외 / 캡 초과분 제외)에 맞게 고치고, coverDropped를 자동 경로에서도 상태 배지로 남길 것.


<details><summary>검증자 재확인 노트</summary>

57024 자동 push는 embedCovers:false, 56858은 `exportJSON({..., embedLocalCovers: embedCovers})`, 57322 `if (opts && opts.embedLocalCovers)` 안에서만 payload.LCV 생성 — 확인. 56826 cloudCollectAssets는 `SELECT file_path FROM gallery_images`만 수집(56823 주석 그대로)이라 표지 파일은 자산 업로드에도 없음. 복원 56940 `lcv = JSON.parse(json)?.LCV || null` → 56965 `if (lcv && ...)` 루프 스킵도 확인. 문구 69724는 조건 없이 '표지·갤러리 이미지도 함께 백업돼요'. 57327-57328 LCV_PER_CAP=500KB/LCV_TOTAL_CAP=8MB와 coverDropped 고지가 수동 버튼(69744 Alert)에만 있는 것도 확인. 완화 요소: 수동 push와 57018 `localRev>remoteRev` 자동 push는 embedCovers 기본 true라 표지 포함 스냅샷이 존재할 수 있음(마지막 rev가 백그라운드 push일 때만 유실). 9128 게이트로 현재는 잠재 결함 → severity 하향.

</details>


### `DAT-4` 수동 JSON 백업은 로컬 표지 파일과 갤러리 사진 실체를 담지 않는데 요약은 '갤러리 N장'이라고 표시한다

🟨 PARTIAL · 🟡 중간 · 미완성


**증거**

> App.jsx:56769-56780 `getExportableImageUrl` 은 http(s)만 반환하고 `// 로컬 파일도 백업 불가 (Expo Snack에서 FileSystem 미지원)` 주석과 함께 file:// 를 null 처리한다. 갤러리는 57185 `// 🎨 v3.8.0: 갤러리 이미지 백업 (GI = Gallery Images, 메타데이터만)` — 57187 `SELECT id, novel_id, file_path, caption, created_at` 로 경로만 저장. 그런데 요약 문자열은 57368 `const galleryInfo = payload.GI ? \`, 갤러리 ${payload.GI.length}장\` : "";` 로 장수를 표기하고, 경고는 57372의 이미지 명대사 캡 하나뿐이다. 복원 측 58324-58331은 파일이 없으면 `if (fInfo.exists) validGI.push(...)` 로 조용히 버리고, 완료 Alert(58471)에도 갤러리 항목이 없다.


**왜 있으나 마나인가** — 클라우드 경로는 표지 base64(LCV)와 갤러리 자산 업로드를 갖췄는데, 정작 사용자가 매일 쓰는 '내보내기/가져오기'는 이미지가 빠진 반쪽 백업이다. 게다가 그 사실이 요약 어디에도 없어서 사용자는 사진까지 담긴 백업이라고 오해한다.


**사용자가 보는 손해** — 기기를 바꾸거나 앱을 재설치한 뒤 백업을 복원하면 직접 저장한 표지와 갤러리 사진이 전부 사라지는데, 내보낼 때도 복원할 때도 경고가 없어 '백업했으니 괜찮다'고 믿고 원본을 지운 사용자는 복구할 방법이 없다.


**개선안** — exportJSON 요약에 `⚠️ 직접 저장한 표지 N개·갤러리 N장은 이 파일에 포함되지 않아요(기기 안 파일). 기기를 바꾸면 사라져요.` 를 명시하고, 복원 완료 Alert에 `갤러리 X/Y장 복원(파일 없음 Z장)` 을 넣을 것. 가능하면 수동 백업에도 embedLocalCovers 옵션(용량 경고 동반)을 노출.


<details><summary>검증자 재확인 노트</summary>

56769-56779 getExportableImageUrl이 http(s)만 통과시키고 file://은 null 반환(주석 포함) 확인. 57185-57192 GI는 `SELECT id, novel_id, file_path, caption, created_at`로 경로만 저장, 57368 `galleryInfo = payload.GI ? \`, 갤러리 ${payload.GI.length}장\`` 확인. 복원 58324-58331은 `if (fInfo.exists) validGI.push(...)`로 조용히 드롭, 58471 완료 Alert에 갤러리 항목 없음 — 여기까지는 주장대로다. 그러나 '아무 고지가 없다'는 부분은 반박: 백업 화면 71446-71447이 '작품과 대진 기록을 JSON으로 내보내거나 가져올 수 있습니다. URL 표지 이미지는 자동으로 포함됩니다.'라고 명시해 URL 표지만 포함됨을 알린다. 또 58326의 경로 정규화(_ddGI + "gallery/") 덕에 같은 기기 복원은 정상 동작한다. 오해 소지는 '갤러리 N장' 표기에 국한 → severity 하향.

</details>


### `DAT-5` 일괄 갱신 실패 리포트가 숫자뿐 — 어떤 작품이 왜 실패했는지 알 수 없고 재시도 경로도 없다

✅ CONFIRMED · 🟡 중간 · 품질 미흡


**증거**

> App.jsx:48392 `} catch (e) { failed++; setBulkUpdateFailed(failed); }` — 예외 e의 메시지·작품 제목·링크를 전혀 보관하지 않는다. 결과 화면은 77263 `완료 · 변경 {bulkUpdateResults.length}개{bulkUpdateFailed ? ` · 실패 ${bulkUpdateFailed}개` : ""}` 와 77265 `변경된 작품이 없어요.` 가 전부이고, 실패 목록 렌더링은 존재하지 않는다(77268-77275는 성공 항목만 map).


**왜 있으나 마나인가** — 수백 개 작품을 네트워크로 훑는 장시간 작업인데 산출물이 '실패 12개'라는 정수 하나다. 네트워크 오류인지, 링크가 죽었는지, 파서가 플랫폼 변경으로 깨졌는지 구분할 수 없고, 실패분만 다시 돌리는 수단도 없어 사용자는 전체를 처음부터 다시 돌리는 것 외에 할 수 있는 게 없다.


**사용자가 보는 손해** — 실패한 작품을 찾으려면 수백 개를 눈으로 대조해야 한다. 사실상 그 12개는 영구히 방치되고, 회차·완결 정보가 조용히 낡은 채로 남는다.


**개선안** — catch에서 `{ title, url, reason: e?.message }` 를 배열에 모아 done 단계에 '실패 목록' 섹션으로 렌더하고, '실패한 것만 다시 시도' 버튼(해당 works 배열로 runBulkAutoUpdate 재호출)을 붙일 것.


<details><summary>검증자 재확인 노트</summary>

48392 `} catch (e) { failed++; setBulkUpdateFailed(failed); }` — 예외 e·제목·링크 미보관 확인(48508의 회차점검 루프도 동일). 상태는 40300 `bulkUpdateFailed`가 정수 하나뿐이고 실패 목록 state 자체가 없음(40294-40301 전수 확인). done UI 77259-77277은 `완료 · 변경 N개 · 실패 N개` + 성공 항목 map만 있고 실패 렌더는 없음. 48398-48408의 후속 Alert도 완결/연중 전환·회차 급감 차단만 다룸. 대체 경로도 없음: 작품별 '마지막 갱신 성공 시각' 컬럼이 스키마에 없어(grep last_scraped/last_updated 히트 없음) 실패분을 사후 식별할 수단이 없다. 다만 실패는 부분집합이고 성공분은 정상 반영되므로 기능 자체가 hollow는 아님 → severity 하향.

</details>


### `DAT-6` 멀티링크 정본화가 근거(권위 링크·재출간 판정)를 계산해 놓고 버려서, 회차·완결일이 왜 그 값이 됐는지 볼 수 없다

🟨 PARTIAL · ⚪ 낮음 · 품질 미흡


**증거**

> App.jsx:19040 `const res = { ..., episodeSource: null, republishUrls: [] };` / 19049 `res.republishUrls = ls.filter(isRepub).map(l => l.url);` / 19084 `res.episodeSource = auth.url;` — 그러나 저장소 전체 grep에서 이 두 필드를 읽는 코드는 없다(등장 위치는 19040·19049·19074·19084 + 헤더 주석 997뿐). 값을 소비하는 48195-48258 applyScrapedUpdateToWork는 `changes` 라벨을 48217 `회차 ${_curEpOv}→${rec.totalEpisodes}` 처럼 수치만 남긴다.


**왜 있으나 마나인가** — reconcileWork는 '어느 링크를 권위로 삼았는지', '어떤 링크를 재출간으로 보고 완결일 계산에서 제외했는지'를 정확히 알고 있는데 그 정보를 호출부가 통째로 무시한다. 사용자에게는 근거 없는 숫자 변경만 남는다.


**사용자가 보는 손해** — 카카오/네이버/문피아 링크를 여러 개 걸어둔 작품에서 완결일이 갑자기 2년 전으로 바뀌거나 회차가 480→512로 바뀌어도, 어떤 링크 때문인지 알 수 없어 잘못된 정본을 고칠 판단 근거가 없다. 잘못된 링크를 지워야 할지 update_link를 수동 지정해야 할지 결정할 수 없다.


**개선안** — applyScrapedUpdateToWork의 changes에 `회차 480→512 (출처: 카카오페이지)` 처럼 rec.episodeSource 플랫폼명을 덧붙이고, 편집 모달 링크 목록에 '권위 링크' 배지 + republishUrls에 '재출간(완결일 제외)' 배지를 표시할 것. 필요하면 episodeSource를 컬럼으로 영속.


<details><summary>검증자 재확인 노트</summary>

REFUTED에 가까운 부분이 크다. republishUrls는 19074 `const repubSet = new Set(res.republishUrls)`에서 내부 소비될 뿐 아니라, 사용자 UI에도 노출된다 — 73734 `const isRepubLink = (l) => l.uniformTs === true && earliestSy > 0 && (Number(l.startYear)||0) > earliestSy;`(주석에 'reconcileWork.isRepub와 동일'), 73751-73755에서 링크마다 '📦 일괄등록' 배지를 그린다. 편집 모달 멀티링크 목록은 링크별 플랫폼·startYear·'🔄 자동업뎃 (자동)/✓' 표시(73763-73773)까지 보여주므로 '어떤 링크를 재출간으로 봤는지 알 수 없다'는 주장은 성립하지 않는다. 남는 실질 갭은 episodeSource뿐: 19084 `res.episodeSource = auth.url`은 grep상 소비처가 없고, UI가 보여주는 자동업뎃 링크는 19127 chooseUpdateLink(가장 이른 startYear 기준)라 reconcileWork의 권위 랭크(19077 `rank = (gaidenCount!=null?0:2)+(repub?1:0)` → 회차 최다)와 다를 수 있어 회차 출처만 불투명하다. 48217 `회차 ${_curEpOv}→${rec.totalEpisodes}` 라벨에 출처가 없는 것도 확인. 범위 축소 + severity 대폭 하향.

</details>


### `DAT-7` 슬롯이 10개인데 슬롯 간 작품 이동·병합 수단이 없고, 유일한 반입 경로는 전량 삭제 후 교체다

🟨 PARTIAL · ⚪ 낮음 · 가치 없음


**증거**

> App.jsx:9018 `const MAX_SLOTS = 10;` / 9543 duplicateSlot(VACUUM INTO로 통째 복제)과 9699 recoverSlotDb만 존재하며 mergeSlot·moveToSlot류 함수는 없다(grep: `슬롯 병합|슬롯 이동|mergeSlot|moveToSlot` 히트 없음). 다른 데이터셋을 들여오는 유일한 경로 importJSON은 57594-57617 `doClearAll`에서 `DELETE FROM novels; DELETE FROM matches; ... DELETE FROM reco_hidden_works;` 를 실행하고, 확인 문구도 57648 `⚠️ 기존 데이터는 모두 삭제됩니다!` 다.


**왜 있으나 마나인가** — '최대 10개 독립 데이터셋'이라는 기능이 실제로는 '한 번 갈라지면 영원히 갈라진 채'다. 웹소설/웹툰 슬롯을 나눠 쓰다가 합치거나, 실험용 슬롯에서 정리한 작품 20개만 본 슬롯으로 옮기는 자연스러운 조작이 전혀 불가능하다. 복제는 '전부 복사'뿐이라 대안이 되지 못한다.


**사용자가 보는 손해** — 슬롯을 나눠서 쓰기 시작하면 되돌릴 수 없다. 두 슬롯에 걸쳐 작품을 관리해 온 사용자는 한쪽을 손으로 다시 입력하는 것 외에 합칠 방법이 없고, 백업 가져오기를 쓰면 받는 쪽 데이터가 전부 지워진다.


**개선안** — importJSON에 '병합(추가)' 모드를 추가해 doClearAll을 건너뛰고 title+author 기준 중복 스킵으로 INSERT하거나, 슬롯 카드에 '선택 작품 다른 슬롯으로 복사' 를 넣을 것. 최소한 확인 다이얼로그에 '합치기는 지원하지 않음'을 명시해 사용자가 시도 전에 알게 해야 한다.


<details><summary>검증자 재확인 노트</summary>

사실관계는 확인: 9018 `const MAX_SLOTS = 10;`, 9543 duplicateSlot(VACUUM INTO 전체 복제), 9699 recoverSlotDb만 존재하고 merge/move 계열 함수는 grep으로 없음. importJSON은 57594-57617 doClearAll에서 novels/matches/choice_logs/.../reco_hidden_works를 DELETE하고 57648에 '⚠️ 기존 데이터는 모두 삭제됩니다!' 확인. 그러나 이건 hollow feature가 아니라 '미구현 기능' 주장이다 — 슬롯은 선언한 값(독립 데이터셋 10개, 슬롯별 DB, 복제, 웹툰/웹소설 모드 분리, 57053의 클라우드 슬롯 중복 연결 방지)을 실제로 제공하고 있고, 삭제형 import는 57648에서 명시 경고 후 진행하며 10702 IMPORT_SNAP_TABLES 스냅샷 + 실패 시 롤백까지 갖췄다. '지금 이 코드 때문에 손해'라기보다 없는 기능에 대한 요구 → severity 대폭 하향.

</details>


### `DAT-8` 하이브리드 검증 이력·대기 큐가 백업에서 조용히 잘려나가고, 잘렸다는 사실이 어디에도 표시되지 않는다

🟨 PARTIAL · ⚪ 낮음 · 미완성


**증거**

> App.jsx:57201-57205 `FROM tier_repositioning_session WHERE state='completed' AND blocker_id IS NOT NULL ORDER BY created_at DESC LIMIT 500` / 57226-57228 `FROM tier_validation_log ORDER BY created_at DESC LIMIT 1000` / 57239-57241 `FROM tier_verification_queue WHERE state='pending' ... LIMIT 200`. 내보내기 요약(57373)은 `${novels.length}작품, ${matches.length}매치${plannedInfo}${coverInfo}${galleryInfo}${analysisInfo}${tagMetaInfo}${tagRegistryInfo}${patternInfo}` 로 VL/VQ/RS를 언급하지 않고, 복원 완료 Alert(58471)에도 항목이 없다. 복원은 57606-57608에서 `DELETE FROM tier_verification_queue/tier_validation_log/tier_repositioning_session` 로 먼저 전부 비운다.


**왜 있으나 마나인가** — '검증 이력까지 보존'을 표방하지만 상한과 필터를 넘는 부분은 통보 없이 소멸한다. 특히 tier_repositioning_session은 `blocker_id IS NOT NULL` 조건까지 붙어, 수문장이 지목되지 않고 끝난 세션 기록은 백업 대상에서 아예 빠진다. 복원은 기존 테이블을 통째로 비우고 잘린 부분만 다시 넣으므로 손실이 확정된다.


**사용자가 보는 손해** — 하이브리드 모드를 오래 써서 검증 매치가 1,000건을 넘긴 사용자가 백업/복원 한 번에 초과 이력과 수문장 누적 통계(5회 기준)를 잃고, 이미 자리를 잡았던 작품이 다시 검증 대상으로 올라온다. 사용자는 무엇이 사라졌는지 알 수 없다.


**개선안** — 내보내기 요약에 `검증 이력 1000/1843건(초과분 제외)` 처럼 잘린 사실과 수치를 표시하고, 상한을 하드코딩 대신 '이력 포함/제외' 옵션(용량 표시 동반)으로 사용자에게 넘길 것. RS는 blocker_id 조건을 완화해 완료 세션 전부를 카운트 기준으로 보존.


<details><summary>검증자 재확인 노트</summary>

상한·필터·요약 누락은 확인: 57201-57205 `WHERE state='completed' AND blocker_id IS NOT NULL ... LIMIT 500`, 57226-57228 `LIMIT 1000`, 57239-57241 `WHERE state='pending' ... LIMIT 200`, 57373 요약 문자열에 VL/VQ/RS 없음, 58471 완료 Alert에도 없음, 57606-57608 복원 전 3개 테이블 DELETE. 그러나 핵심 영향 주장 두 개가 반박된다. ① '수문장 누적 통계를 잃는다' — 37431의 통계 쿼리가 `SELECT COUNT(*) FROM tier_repositioning_session WHERE state='completed' AND blocker_id=?`라서 백업 필터(blocker_id IS NOT NULL)는 정확히 그 통계가 쓰는 행만 남긴다. blocker_id NULL 세션은 이 5회 기준에 애초에 기여하지 않는다. ② '자리를 잡았던 작품이 다시 검증 대상으로 올라온다' — 큐 INSERT는 CRUD 트리거(enqueueVerification) 경로이고 VL/RS 부재를 재검증 조건으로 읽는 코드는 없다(tier_validation_log 소비처는 53799 buildWhyExplanation과 진단 통계뿐). 실제 손실은 53830 loadRepositioningHistory(LIMIT 20, blocker 필터 없음)에 뜨던 무(無)수문장 세션의 '왜?' 설명과, 세션 500·로그 1000·pending 200 초과분 정도 → severity 대폭 하향.

</details>


---

## 취향 분석·어워드·통계


### `ANA-1` 수상 확률·자동 추천이 티어 가중 200점에 독점돼 티어 배지의 재표현일 뿐이고, 같은 티어 안에서는 사용자의 manual_order를 완결/재독/태그 보너스가 눌러버린다

✅ CONFIRMED · 🟡 중간 · 품질 미흡


**증거**

> App.jsx 31186-31193 calculateNovelScore(hybrid/manual): `score += (tierOrder.length - tierIndex) * 30;` … `score += (tierOrder.length - tierIndex) * 170;` (합계 티어당 200점). 비-티어 항은 manual_order `Math.max(0, 15 - order / 200)`(31189, 최대 15), 태그매칭 `matchRatio * 50`(31219), 완결 `+25`(31224), 재독 `Math.min(30, (rereadCount-1)*10)`(31234), 신뢰도 `reliability * 15`(31248) → 최대 합 ~120. 31272 `const temperature = 50;`, 31286 `Math.min(99, Math.max(1, probability))`. 표시는 32090 `📊 수상 확률: {winProbability.toFixed(1)}%`. 추천 랭킹은 31356 `.map(n => ({ novel: n, prob: calculateWinProbability(...) })).sort((a,b)=>b.prob-a.prob)`.


**왜 있으나 마나인가** — 티어 격차 200 > 나머지 가산점 총합 120이므로 티어를 가로지르는 순위 역전이 구조적으로 불가능하다. 즉 '확률'은 이미 화면에 티어 배지로 보이는 정보를 소수점 한 자리로 다시 쓴 값이다. 게다가 exp(-200/50)=0.018이라 하위 티어는 전부 1% 클램프로 뭉개져 후보 간 구분이 사라지고, 클램프 때문에 합계도 100%가 아니다. 반대로 같은 티어 안에서는 태그매칭 50·재독 30·완결 25가 manual_order 15를 압도해, hybrid의 'patrick truth'인 사용자 수동 순위와 반대로 정렬된다.


**사용자가 보는 손해** — 후보 20개를 펼치면 1위만 90%대이고 나머지는 전부 '1.0%'라 어느 작품이 경쟁력 있는지 판단할 수 없다. 그리고 '선택 수여'를 누르면 같은 티어에서 사용자가 직접 1위로 올려둔 작품 대신 완결·다회독 표시가 붙은 다른 작품이 상을 받는다.


**개선안** — ① 확률 배지는 클램프(1~99) 대신 정규화된 소프트맥스 값을 그대로 쓰고 소수점을 없앤다(정수 %). ② hybrid/manual에서는 티어 항을 정렬 키로만 쓰고, 같은 티어 내부 점수는 manual_order를 1차 항으로(밴드 폭 기준 최소 60점 이상) 두고 완결/재독/태그는 ±10 이내 타이브레이커로 축소한다. ③ 티어 가중치(30/170)와 temperature(50)를 상 설정 모달에 노출하거나, 최소한 '티어만 반영/보너스 반영' 토글을 준다.


<details><summary>검증자 재확인 노트</summary>

31177-31262 직접 확인. isManualOrHybrid 분기에서 31186 `score += (tierOrder.length - tierIndex) * 30;` + 31193 `score += (tierOrder.length - tierIndex) * 170;` = 티어당 200점 확인. 비-티어 항 실측 최대: 31189 manual_order `Math.max(0, 15 - order/200)` ≤15, 31219 `matchRatio * 50`, 31224 완결 +25(31228 dropped -30), 31234 재독 ≤30, 31248 신뢰도 ≤15 → 상한 135, 하한 -30, 즉 동일 티어 내 변동폭 165 < 티어 격차 200. 따라서 티어를 가로지르는 역전 불가는 산술적으로 성립. 31272 `const temperature = 50;`, 31288 `Math.min(99, Math.max(1, probability))` 확인 — 인접 티어(gap 200)는 exp(-4)=0.018로 1~2%대, 2티어 이상 차이는 exp(-8)로 1% 클램프에 뭉개짐(주장의 '전부 1.0%'는 인접 티어에선 다소 과장이나 2티어 이상에선 정확). 자동 추천 경로는 31349-31351 `.map(n => ({novel:n, prob: calculateWinProbability(...)})).sort((a,b)=>b.prob-a.prob)`로 prob 정렬 확인 — 반면 후보 목록 자체는 31160/31330 `.sort(compareNovels)`. 즉 31190-31192의 개발자 주석 '정렬은 compareNovels라 무관 — 확률 배지만 정합'은 autoSuggestions 경로에서 성립하지 않는다(같은 티어 내 태그50/완결25/재독30이 manual_order 15를 압도해 사용자 수동 1위가 아닌 작품이 pre-select됨). 표시는 32090에서 확인되나 31986 `awardFilter.awardId`가 지정된 경우에만 배지가 뜬다는 점, 그리고 31361-31369 isSuggestSelected/toggleSuggest로 수여 전 체크 해제가 가능하다는 점이 피해를 완화한다. 37195 autoAwardSuggest 기본 ON도 확인. → 메커니즘 전부 사실이나 사용자 확인 단계가 있어 high는 과함.

</details>


### `ANA-2` 취향 분석 최상단 '핵심 취향' 문장이 평점·티어를 전혀 안 쓰고 보유 개수 1위만 읊는다

🟨 PARTIAL · 🟡 중간 · 가치 없음


**증거**

> App.jsx 39956 `const corePreference = \`${topMajorGenres[0] || "다양한 장르"} 기반에 ${topSubGenres.slice(0, 2).join(", ")}를 선호하며, ${lengthLabel}의 작품을 즐겨 읽습니다.${topPlatform ? \` ${topPlatform} 플랫폼을 주로 이용합니다.\` : ""}\`;`. 재료의 정렬 키는 전부 빈도다 — 38769 `majorGenreAnalysis … .sort((a,b)=>b.weightedCount - a.weightedCount || b.adjRating - a.adjRating)`, 38798 subGenre 동일, 38882 `platformAnalysis … .sort((a,b)=>b.count-a.count)`. 렌더는 34649 `{insights.corePreference}` (항상 펼침 카드) + 34675 `majorGenreAnalysis.slice(0,3)`를 '선호 장르' 칩으로 표시.


**왜 있으나 마나인가** — weightedCount는 작품 수(×다회독 가중)일 뿐 만족도 신호가 아니다. avgRating/adjRating은 동점일 때만 쓰이는 2차 키라 사실상 개수가 전부 결정한다. 게다가 analyzePreferences는 38622 `if (!novels || novels.length === 0)`만 막으므로 작품 3개짜리 서재에서도 같은 확신 어조의 문장이 나온다.


**사용자가 보는 손해** — '취향 분석' 화면 최상단, 항상 펼쳐진 대표 카드가 사용자가 서재 탭의 장르 필터 개수만 봐도 아는 사실을 단정적으로 말한다. 많이 등록했지만 평가는 낮은 장르가 '선호 장르'로 못박혀, 실제로 높게 평가한 소수 장르는 이 문장에 절대 등장하지 못한다.


**개선안** — corePreference를 adjRating(수축평균) 상위 장르 기준으로 만들고, 빈도 1위와 만족도 1위가 다르면 '가장 많이 읽은 건 A지만 가장 높게 평가한 건 B' 형태로 두 축을 함께 쓴다. 표본이 N<10이면 문장 대신 '표본이 적어 성향 판단을 보류합니다'를 노출한다.


<details><summary>검증자 재확인 노트</summary>

39956 corePreference 문자열, 39943-39945 topMajorGenres/topSubGenres/topPlatform, 38769·38798 `.sort((a,b)=>b.weightedCount - a.weightedCount || b.adjRating - a.adjRating)` 모두 인용대로 존재. weightedCount는 38778 rereadWeight 누적이라 실수라서 동점이 거의 없고 adjRating이 2차 키로만 작동한다는 지적도 타당. 38622 `if (!novels || novels.length === 0)` 외 최소 표본 게이트 없음도 확인(34411/38623 외 min-count 가드 grep 결과 없음). **그러나 '평점·티어를 전혀 안 쓴다'는 부정확하다** — 문장 4요소 중 lengthLabel(39948-39953)은 39011-39017 preferredLength에서 나오고 이는 `avg(...prefScore)` 비교로 결정되는 평점 기반 값이다. 또 34673-34681 '선호 장르' 칩은 `{g.genre} ({prefScoreLabel(g.avgRating, ...)})`로 각 장르의 평균 선호도 라벨을 함께 노출하므로 '개수만 보여준다'는 영향 서술도 과장이다. 개수 편향 자체는 실재하나 화면상 평점 신호가 병기됨.

</details>


### `ANA-3` '취향 스펙트럼'의 선호 배지가 평점과 무관한 태그 분포 평균이고, 작품 2개면 표시된다

✅ CONFIRMED · 🟡 중간 · 품질 미흡


**증거**

> App.jsx 39341-39343 `preferenceLabel: avgPos < 0.35 ? spectrum.tags[0] + " 선호" : avgPos > 0.65 ? spectrum.tags[spectrumLength-1] + " 선호" : "중간 성향"`. 여기서 avgPos는 39287 `const avgPos = positions.reduce((a,b)=>a+b,0)/positions.length;` 즉 해당 태그를 가진 **모든** 작품 위치의 산술평균으로, rating/prefScore가 개입하지 않는다. 게이트는 39284 `if (novelAnalyses.length >= 2)` 하나뿐. 선호 구간도 39318 `const validSegments = segments.filter(s => s.novels.length >= 1);` → 1작품 구간이 '선호 구간'이 될 수 있다. 렌더 36227 `{data.preferenceLabel}` 배지 + 36284 `{data.novelCount}개 작품 분석`.


**왜 있으나 마나인가** — '먼치킨 선호'라고 쓰지만 실제 계산은 '내 서재의 먼치킨 계열 태그 비중이 높다'이다. 정작 평점을 쓰는 highRatedAvgPosition(39289)은 확장했을 때 작은 회색 글씨 한 줄로만 나오고, 색상·배지·마커 위치 같은 눈에 띄는 요소는 전부 빈도 기반 avgPos가 결정한다. 최소 표본 2 + 구간 최소 1이라 노이즈가 그대로 '취향'으로 승격된다.


**사용자가 보는 손해** — 작품 2개에 태그를 붙였을 뿐인데 '피폐 선호', '느린템포 선호' 같은 단정적 배지가 뜬다. 사용자는 자기 태깅 습관을 자기 취향으로 오독하고, 실제로 높게 평가한 반대쪽 성향은 배지에 반영되지 않는다.


**개선안** — preferenceLabel을 highRatedAvgPosition(고선호군 평균) 기준으로 바꾸거나, 두 값을 나란히 보여주고 avgPos 쪽은 '분포'라고 명시한다. 표본 게이트를 2 → 8 이상으로 올리고, novelCount<8이면 배지 대신 '표본 N — 참고용'을 표시한다. preferredSegment의 `novels.length >= 1`도 3 이상으로 올린다.


<details><summary>검증자 재확인 노트</summary>

39341-39343 preferenceLabel이 avgPos만 사용, 39287 `const avgPos = positions.reduce((a,b)=>a+b,0)/positions.length;`로 rating/prefScore 미개입 확인. 39284 `if (novelAnalyses.length >= 2)`가 유일 게이트, 39318 `filter(s => s.novels.length >= 1)`도 확인. 렌더 쪽도 검증: 36227 배지 `{data.preferenceLabel}`, 36195-36196 마커 위치 `data.avgPosition`, 36202-36204 좌/중/우 색상 모두 avgPosition 기반 — 즉 눈에 띄는 요소 전부 빈도 기반이 맞다. 반면 평점 기반 highRatedAvgPosition은 36282-36287의 확장 시에만 나오는 fontSize 11 회색 한 줄뿐. 39290 highRated 필터가 HIGH_THRESHOLD를 쓰지만 배지에는 반영 안 됨. 다만 36186 `isGroupExpanded("genreTag")` 하위 섹션이라 상시 노출은 아니고, 36282 `{data.novelCount}개 작품 분석`으로 표본 수가 병기되므로 오독 피해가 무제한은 아니다.

</details>


### `ANA-4` 스펙트럼 6축의 태그 목록이 하드코딩이고 편집 UI가 없으며, 태그 이름을 바꾸면 축이 조용히 비어버린다

🟨 PARTIAL · 🟡 중간 · 하드코딩


**증거**

> App.jsx 14907-14950 `const FACTORY_TAG_SPECTRUM_GROUPS = { "protagonist_power": { tags: ["약한주인공","성장형","천재","먼치킨","만능캐"] }, … "quality": { tags:["졸작","가작","수작","명작","레전드"] }, … }`. 레지스트리 필드는 있으나(15032 `TAG_SPECTRUM_GROUPS = registry.spectrumGroups … : {...FACTORY_TAG_SPECTRUM_GROUPS}`) 이를 사용자 값으로 **쓰는 코드가 없다** — spectrumGroups 전체 출현은 15032/42630/42731/49950/49968/58105뿐이고 42630 외 전부 `{...FACTORY_TAG_SPECTRUM_GROUPS}` 리터럴이다. 결정적으로 50580-50596 renameTagGlobally는 `nr.majorGenres = ren(...)`, `nr.subGenres = ren(...)`, generalTags만 갱신하고 spectrumGroups는 손대지 않는다. 매칭은 39243 `spectrum.tags.includes(t.tag) || spectrum.tags.includes(normalizeTag(t.tag))` 정확 일치다. 14958 주석은 웹툰 모드에서도 이 목록을 '모드 무관 공유(스왑 안 함)'라고 명시한다.


**왜 있으나 마나인가** — 축을 커스터마이즈할 진입점이 전혀 없는데, 앱은 태그 이름 변경(renameTagGlobally)·커스텀 태그 추가·웹툰 모드 전환을 모두 정식 기능으로 제공한다. 즉 사용자가 정상 기능을 쓸수록 스펙트럼 섹션은 조용히 비어간다. 실패도 무음이다 — 39284 게이트에 걸리면 spectrumAnalysis에서 그 축이 통째로 빠지고, 36186 `Object.keys(spectrumAnalysis).length > 0` 때문에 섹션 자체가 사라져 '왜 안 보이는지' 알 방법이 없다.


**사용자가 보는 손해** — '먼치킨'을 '먼치킨물'로 정리한 순간 '주인공 강함' 축이 사라지고, 사용자는 원인도 복구 방법도 알 수 없다. 웹툰 모드 슬롯이나 자기 어휘로 태깅한 서재에서는 6축 중 상당수가 처음부터 빈 채로 존재한다.


**개선안** — ① renameTagGlobally의 레지스트리 갱신 블록(50580 부근)에 `nr.spectrumGroups`의 각 group.tags에도 ren()을 적용한다. ② 태그 관리 화면에 스펙트럼 축 편집(축 추가/삭제, 축별 태그 순서 지정) UI를 붙여 registry.spectrumGroups를 실제로 쓰게 한다. ③ 축이 표본 미달로 빠질 때 섹션을 숨기지 말고 '이 축에 해당하는 태그가 붙은 작품이 N개뿐입니다(필요 태그: …)'를 표시한다.


<details><summary>검증자 재확인 노트</summary>

14907-14950 FACTORY_TAG_SPECTRUM_GROUPS 6축 확인, 15032-15033 registry.spectrumGroups 폴백 확인. spectrumGroups 전체 출현(15032/42630/42731/49950/49968/58105) 중 42630만 `curReg?.spectrumGroups`이고 나머지는 팩토리 리터럴 — 사용자 값을 **쓰는** 코드는 있으나(15032) **쓰는(write) UI가 없다**는 점은 '스펙트럼' 전수 grep(60건)에서 편집 화면 부재로 확인. renameTagGlobally 본문 50583-50600 직접 확인: majorGenres/subGenres/generalTags만 rename하고 spectrumGroups 미포함, 50602-50668에서 pinned/hidden/sentiment/attributes/tag_relations/coordinateSystems까지 이전하면서 스펙트럼만 누락. alias 자동 추가도 없어(50670-50687이 함수 끝) 39252의 `spectrum.tags.includes(normalizeTag(t.tag))` 폴백도 못 살린다 → rename 후 축 소실은 CONFIRMED. 경고 부재도 확인: 50709-50713 computeTagImpact가 '좌표/스펙트럼 소속'을 집계하지만 호출처는 50740 **삭제 경로 단 한 곳**뿐이라 rename 경로엔 경고 없음. **그러나 웹툰 모드 주장은 REFUTED** — 14971-14972 `FACTORY_GENERAL_TAGS_WEBTOON = { ...FACTORY_GENERAL_TAGS, ... }`가 14956-14957 주석대로 '스펙트럼 참조 태그 보존'을 위해 상위집합을 유지하므로 웹툰 슬롯에서 축이 처음부터 비지 않는다. 두 근거 중 하나가 틀렸으므로 PARTIAL.

</details>


### `ANA-5` 웹 추천의 '취향순' 정렬이 ELO 승률에만 의존해, hybrid/manual 모드에서는 모든 후보 점수가 0이 되어 정렬이 무동작이다

✅ CONFIRMED · 🟡 중간 · 미완성 · 🔍 직접확인


**증거**

> App.jsx 45291 `const pats = await all("SELECT pattern_key, win_rate FROM preference_patterns WHERE sample_size>=3;"); … tasteMap[v] = Math.max(tasteMap[v] || 0, Number(p.win_rate) || 0);` → 45295 `let s = 0; for (const t of toks) { const wr = tasteMap[t]; if (wr) s += Math.max(0, (wr - 0.5) * 100); }` → 45300 `if (sortMode === "taste") cands.sort((a,b)=>(b._taste||0)-(a._taste||0));`. hybrid/manual에서 유일하게 쓰이는 preference_patterns 행은 39725 `row.sample_size, 0, null, null, null, null,` 즉 win_rate=NULL로 들어간다(tier_concentration/tier_inversion/award_tier). 선택 UI는 60167 `[["무작위","random"],["취향순","taste"],["인기순","popular"],["숨은작","hidden"]]`. 바로 옆 buildTasteKeywordPool은 45101 `if (out.size === 0)` 폴백(고티어 작품 태그)을 갖고 있는데 이 경로에만 없다.


**왜 있으나 마나인가** — win_rate는 ELO 매칭 학습에서만 채워진다. v7.0의 주력인 hybrid와 manual 모드는 ELO 매칭을 돌리지 않으므로 win_rate가 있는 행이 하나도 생기지 않고, tasteMap은 전부 0 → 모든 후보 `_taste = 0` → sort가 안정정렬이라 아무것도 바뀌지 않는다. 키워드 풀 쪽에는 있는 티어 기반 폴백이 여기만 누락됐다.


**사용자가 보는 손해** — hybrid/manual 사용자가 '취향순'을 눌러도 결과 순서가 '무작위'와 동일하다. 실패 표시도 없어서 사용자는 앱이 자기 취향을 반영해 골라준 목록이라고 믿고 추천을 받아들인다.


**개선안** — scoreWeb의 tasteMap을 만들 때 win_rate 행이 비면 buildTasteKeywordPool과 동일한 폴백(prefHighThreshold 이상 작품의 태그/장르 빈도 → 0~1로 정규화)을 태우고, 그래도 신호가 없으면 '취향순' 칩을 비활성화하거나 '매칭/티어 데이터가 부족해 무작위로 표시합니다'를 노출한다.


<details><summary>검증자 재확인 노트</summary>

45291 `SELECT pattern_key, win_rate FROM preference_patterns WHERE sample_size>=3;`, 45295 `if (wr) s += Math.max(0,(wr-0.5)*100);`, 45300 `if (sortMode === "taste") cands.sort(...)`, 60167 정렬 칩 4종 모두 인용대로 존재. win_rate 채워지는 경로 추적: 13097-13148 batchUpdatePatternStats(win_count 누적) → 13169-13209 refreshPatternStats가 win_rate 산출, 호출처는 12973/13085(processPatternUpdates, 매칭 choice log)과 13862(migrateExistingMatchesToPatterns) — 전부 ELO 매칭 산물. hybrid 검증 매칭은 37908-37944 logVerificationMatch가 tier_validation_log와 novels.verification_* 에만 쓰고 preference_patterns를 건드리지 않음을 확인 → hybrid에서 win_rate 행 생성 경로 없음. 39725 `row.sample_size, 0, null, ...`로 정적 분석 upsert는 win_rate NULL, 13174에서 해당 카테고리를 refresh 대상에서 제외하는 것도 확인. 결과적으로 tasteMap 전량 0 → 모든 `_taste=0` → 정렬 무동작 CONFIRMED. 실패 표시 부재도 확인(60658 `ts > 0 ?` 가드라 취향 막대가 그냥 사라짐). 다만 영향은 축소 필요: 45102-45109 buildTasteKeywordPool의 고티어 폴백이 살아 있고 60161-60162 '취향↔탐험' 슬라이더가 그 풀을 통해 취향을 주입하므로, 추천 자체가 취향 무관해지는 것은 아니고 4개 정렬 옵션 중 1개가 무력화되는 것.

</details>


### `ANA-8` '선호 길이' 판정이 100화/400화 하드코딩 버킷 + 최소 표본 0이라, 작품 1개짜리 버킷이 헤드라인 문장을 결정한다

✅ CONFIRMED · 🟡 중간 · 하드코딩


**증거**

> App.jsx 38997-39002 `if (ep > 0 && ep < 100) lengthGroups.short.push(n); else if (ep >= 100 && ep < 400) lengthGroups.medium.push(n); else if (ep >= 400) lengthGroups.long.push(n);`. 39011-39017 `preferredLength: (() => { const lens = [{key:"short", rating: avg(...)||0}, {key:"medium", …}, {key:"long", …}]; return lens.sort((a,b)=>b.rating-a.rating)[0]?.key || "unknown"; })()` — count 조건이 전혀 없다. 이 값이 39953 `}[readingPattern.preferredLength];` 를 거쳐 39956 corePreference 문장에 '장편(400화 이상)의 작품을 즐겨 읽습니다'로 박힌다. UI 라벨도 34506-34508 / 35919-35921에 `단편(<100)` `중편(100-400)` `장편(400+)`로 고정 문자열이다.


**왜 있으나 마나인가** — 경계 100/400은 웹소설 연재 관행 가정인데, 앱은 웹툰 모드 슬롯(14962 FACTORY_*_WEBTOON)을 정식 지원한다. 웹툰은 보통 100~200화라 거의 전부 medium 한 버킷에 몰려 '길이 선호' 자체가 성립하지 않는다. 게다가 평균 비교에 표본 하한이 없어 long에 1작품만 있고 그게 S티어면 즉시 '장편 선호'로 확정된다.


**사용자가 보는 손해** — 400화짜리 작품 한 편이 우연히 최상위 티어면 헤드라인 문장이 '장편을 즐겨 읽습니다'로 바뀌고, 파이 차트도 그 왜곡된 분류를 그대로 보여준다. 웹툰 슬롯 사용자에게는 세 버킷 중 하나만 채워져 문장이 항상 같은 값으로 고정된다.


**개선안** — 버킷 경계를 슬롯 모드별 기본값 + 설정 UI(사용자 편집 가능한 2개 경계값)로 빼고, preferredLength는 각 버킷 count>=5인 것들 중에서만 비교하며, 자격 버킷이 2개 미만이면 "unknown"을 반환해 문장에서 길이 절을 생략한다.


<details><summary>검증자 재확인 노트</summary>

38997-39002 버킷 경계 리터럴(`ep < 100`, `ep >= 100 && ep < 400`, `ep >= 400`), 39011-39017 preferredLength에 count 조건 전무, 39948-39956에서 그 값이 corePreference 문장에 박히는 경로, 34506-34508·35919-35921 고정 라벨 모두 인용대로 확인. 설정 경로 없음(38997의 리터럴을 직접 쓰므로 설정값이 있어도 무시됨). **검증 중 주장보다 나쁜 경우를 추가 확인**: 38398 `const avg = (arr) => arr.length ? ... : 0;`이므로 빈 버킷은 0점이고, 39017 `lens.sort((a,b)=>b.rating-a.rating)[0]?.key`는 배열 길이가 항상 3이라 `"unknown"`을 절대 반환하지 않는다 → 회차를 아무도 입력하지 않은 서재(세 버킷 모두 0, 안정정렬)에서 short가 1위가 되어 헤드라인이 '단편(100화 미만)의 작품을 즐겨 읽습니다'로 단정된다. 39952의 '다양한 길이' 라벨은 도달 불가. 웹툰 슬롯 편중 주장은 데이터 없이 추론이지만 로직상 성립(한 버킷만 채워지면 그 버킷이 항상 승). 완화 요소는 35913-35927 '읽기 패턴' 섹션이 버킷별 작품 수를 병기한다는 점뿐이고, 문제의 헤드라인 문장에는 표본 단서가 없다.

</details>


### `ANA-6` 태그 '농도(intensity)' 가중치가 기본값 3 탓에 사실상 전원 1.0 — 계산에 아무 영향이 없다

🟨 PARTIAL · ⚪ 낮음 · 사실상 미동작


**증거**

> App.jsx 38809-38813 `const intensity = n.tagDataMap[tag] || 3; const intensityWeight = intensity / 3; … tagStats[tag].weightedCount += rereadWeight * intensityWeight;` 그리고 스펙트럼 39260-39262 `const intensity = m.intensity || 3; sumPos += (pos + 1) * intensity; sumWeight += intensity;`. 저장 시점 기본값은 26404-26406 `const tagData = allSelectedTags.map(tag => ({ tag, intensity: tagIntensities[tag] || 3 }));` — 태그 선택 모달에서 농도를 따로 만지지 않으면 전부 3이다. 앱 자신도 이걸 흔한 상태로 간주한다: 58722 `if (tagData.length >= 3 && tagData.every(t => t.intensity === 3 || t.intensity === undefined)) issues.push("allDefaultIntensity");`.


**왜 있으나 마나인가** — 모든 intensity가 3이면 intensityWeight = 3/3 = 1.0이라 weightedCount는 rereadWeight만 남고, 스펙트럼의 가중평균도 단순 산술평균으로 붕괴한다. 농도를 조정하려면 작품마다 태그마다 수동으로 손대야 하는데, 그 노력에 대한 보상은 태그 순위가 미세하게 흔들리는 것뿐이라 되먹임이 없다.


**사용자가 보는 손해** — '농도'라는 입력 항목이 태그 편집 화면을 복잡하게 만들지만, 실제로 설정해도 분석 결과가 눈에 띄게 달라지지 않는다. 반대로 설정하지 않은 사용자는 자기 분석이 농도 가중을 반영했다고 오해한다.


**개선안** — 농도가 전부 기본값인 작품이 다수면 취향 분석 상단에 '농도 미설정 — 태그 가중치가 적용되지 않습니다' 배지를 띄우고, 농도 미설정 시에는 대체 신호(작품의 prefScore·태그 등장 순서)를 가중치로 쓰거나, 농도 입력 자체를 태그 3~5개 상위에만 요구하는 축약 UI로 바꾼다.


<details><summary>검증자 재확인 노트</summary>

인용 줄 전부 실재: 38809-38813 `const intensity = n.tagDataMap[tag] || 3; const intensityWeight = intensity / 3;`, 39260-39264 스펙트럼 가중, 26404-26406 `intensity: tagIntensities[tag] || 3`, 58720-58724 allDefaultIntensity 감지. 전원 3이면 가중이 1.0으로 붕괴한다는 산술도 맞다. **그러나 hollow 결론은 지지되지 않는다.** (1) 이는 '중립 기본값'이지 고장이 아니다 — 설정 시 실제로 작동한다: intensity 1~5 → 가중 0.33~1.67로 태그 간 5배 차이가 나며 38813 weightedCount(장르/태그 순위·핵심 취향 문장 재료)와 39263 스펙트럼 위치를 직접 움직인다. 주장의 '설정해도 미세하게만 흔들린다'는 근거 제시가 없다. (2) 되먹임 부재 주장도 반박됨 — 37212 `requireIntensityTuning`(기본 off) 설정과 74648 `{ key: "requireIntensityTuning", label: "태그 농도 미조절 감지" }` 토글이 존재해 사용자가 켜면 보충 목록(58732-58736)에 미조절 작품이 뜬다. (3) 'UI를 복잡하게 한다'도 약함 — 농도 조절은 26309-26358의 별도 탭이라 기본 선택 흐름을 막지 않는다. 사실관계만 남기면 severity는 낮다.

</details>


### `ANA-7` '상위 티어 집중도'가 표본 2~3에서 '상위 100% (N=2)'를 순위로 내보내고, 계산해 둔 윌슨 신뢰구간은 화면에 안 쓴다

🟨 PARTIAL · ⚪ 낮음 · 품질 미흡


**증거**

> App.jsx 39474-39478 `const tierConcentration = { topGenres: _toSortedArray(tierStratification.byMajorGenre, 2).slice(0,5), topSubGenres: _toSortedArray(..., 2)…, topTags: _toSortedArray(..., 3)…, topAuthors: _toSortedArray(..., 3)… }`, 정렬 키는 39470 `.sort((a,b) => b.topTierRatio - a.topTierRatio)`. 렌더는 35496-35498 / 35512 / 35528 `상위 {(s.topTierRatio * 100).toFixed(0)}% (N={s.totalCount})`. CI는 38568 `stat.topTierCI = wilsonConfidenceInterval(Math.round(topWeight), Math.max(1, Math.round(stat.totalWeight)));`로 계산되고 39632 `topTierCI: stat.topTierCI`로 DB details에 저장까지 되지만, UI 어디에서도 topTierCI를 읽지 않는다(전체 출현: 38522 주석·38568·39628·39632).


**왜 있으나 마나인가** — topTierRatio 기준 내림차순 정렬이라 N=2에서 둘 다 상위 티어인 항목이 항상 100%로 1위를 차지하고, N=20에 80%인 진짜 신호는 그 아래로 밀린다. 즉 이 섹션의 TOP 5는 구조적으로 최소 표본 항목들의 목록이 된다. 불확실성을 정량화한 CI를 이미 갖고 있는데도 표시하지 않아, 화면에는 근거를 초과하는 100%만 남는다.


**사용자가 보는 손해** — 작품 2편 등록한 작가가 '작가 TOP 1 — 상위 100%'로 뜨고, 사용자는 표본 2를 자기 최애 작가 판정으로 읽는다. 반대로 실제로 꾸준히 상위에 두는 작가/태그는 TOP 5 밖으로 밀려 보이지 않는다.


**개선안** — 정렬 키를 topTierRatio 대신 topTierCI.lower(윌슨 하한)로 바꾸고, 표시도 `상위 62% (95% CI 34~84%, N=8)` 형태로 CI를 함께 렌더한다. 임계값 2/3도 최소 5로 올리거나 설정에서 조절 가능하게 한다.


<details><summary>검증자 재확인 노트</summary>

39469-39472 `_toSortedArray`의 `.sort((a,b)=>b.topTierRatio - a.topTierRatio)` 및 39474-39479 임계값, 35496/35512/35528 `상위 {(s.topTierRatio*100).toFixed(0)}% (N={s.totalCount})` 전부 실재. topTierCI 전수 grep 결과 38522(주석)·38568(계산)·39628·39632(DB details 저장) 4곳뿐 — UI 미소비 CONFIRMED. 비율 내림차순이라 소표본이 상위를 점령하는 구조도 CONFIRMED. **그러나 대표 사례가 틀렸다** — 39478 `topAuthors: _toSortedArray(tierStratification.byAuthor, 3)`, 39477 topTags도 임계 3이므로 '작품 2편 등록한 작가가 작가 TOP 1'은 성립하지 않는다(작가/태그는 N≥3, 임계 2는 39475-39476 대장르/부장르뿐). 또 화면에 `(N={s.totalCount})`가 항상 병기되므로 '근거를 초과하는 100%만 남는다'는 서술도 과장 — 사용자는 표본 수를 함께 본다. 게다가 35478 `isTierMode && isGroupExpanded("tier")` + 35484 `isExpanded("tierConcentration")` 이중 접힘 안에 있어 노출 빈도도 낮다.

</details>


---

## 재조사 방법

- 6개 도메인(AI 태그관리 / 하이브리드 / 추천 / 하드코딩 / 분석 / 데이터관리)을 각각 독립 조사
- 조사자 규칙: **증거 없는 주장 금지** — 모든 항목에 `App.jsx` 줄 번호 + 실제 코드 인용 필수
- 다른 에이전트가 "반박 기본자세"로 재검증, 아래면 기각:
  - 인용된 코드가 실제로 없거나 다르게 동작
  - 사용자가 설정 UI 등 **다른 경로로 이미 조정 가능**
  - 다른 분기/가드가 이미 문제를 막고 있음
- 다음에 볼 만한 미조사 영역: 매칭 엔진/ELO 루프, 태그 관계(유의어·상반) UI, 백업 v9 스키마 상세,
  웹툰 모드 전반, 성능(대량 라이브러리에서의 렌더·쿼리)
