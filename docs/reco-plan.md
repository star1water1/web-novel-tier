# 추천 탭 개편 + 넷상 추천 — 설계 & 핸드오프 문서

> **목적**: 세션 간 연속성을 위한 기록. 추천 탭 재설계(여러작) + "넷상 추천작"(외부 발견) 기능에 대해 합의한 설계·결정·견적·빌드 순서·리스크·코드 앵커를 담는다.
> **새 세션은 이 문서를 읽고 그대로 이어서 진행하면 된다.**
>
> 관련 선행 문서: `docs/scraper-plan.md` (플랫폼 스크래퍼/제목검색 엔진 — 이 기능의 토대).
> 상태: **M1 완료(v7.50.0) · M2 완료(v7.51.0).** 남은 후속: ① reco 설정 백업 직렬화(rc) ② AI 키워드 Claude 제공자 지원(현 Gemini만) ③ 폰 실사용 시각 검증.
>
> **구현 메모(2026-06-29)**
> - M1(v7.50.0): 내 서재 N작 + 맞춤설정. `refreshDailyRecommendation` 배열화, `appSettings.reco`.
> - M2(v7.51.0): 넷상 추천. 테이블 3종(web_reco/web_reco_keywords/reco_hidden_works), 키워드 엔진(취향+탐험+수확+커스텀, 에코챔버 역가중), 페치(쿨다운·부분성공·dedup·필터·정렬·수확·TTL), 카드 액션(예정/본목록 모드별/보관/관심없음), UI(설정 web 서브섹션·🌐 섹션·키워드 에디터·티어 모달), 자동1일1회.
> - **미완(후속)**: reco 설정/밴/커스텀의 **백업 직렬화 미적용** — app_meta엔 영속되나 export→import 시 기본값으로 리셋(백업 압축부는 데이터손실 이력 때문에 라운드트립 테스트 동반 별도 작업). AI 키워드는 **Gemini 키에서만** 동작(Claude 후속).

---

## 1. 배경 / 동기

- **문제 1 (여러작 추천)**: 현재 `오늘의 추천`은 **하루 1작**. 8개 우선순위 카테고리에서 가중치 랜덤휠로 *딱 1개*만 뽑는다(`refreshDailyRecommendation`, App.jsx ~41490). **작품이 많으면(수백 작) 하루 1작은 너무 느려** 서재를 한 바퀴 도는 데 수년이 걸린다.
- **문제 2 (넷상 추천작)**: 추천 대상이 **내 서재(novels+planned)로 한정**. "아직 내가 모르는, 밖에 있는 작품"을 발견하는 경로가 없다.
- **자산**: `searchNovels(키워드)`가 이미 5개 플랫폼(리디·네이버시리즈·문피아·노벨피아·카카오)을 병렬 검색해 후보(제목·작가·표지·링크·장르)를 반환한다(`docs/scraper-plan.md` §8 Stage 4b 완료). 특히 **노벨피아 검색 API는 줄거리·완결여부·조회수/추천수·연령등급까지** 한 번에 준다(실측 확인). → "넷상 추천작"의 토대가 이미 존재.
- **핵심 제약(실측)**: 플랫폼에 **키워드 없는 브라우즈/랭킹 API는 없다**(노벨피아 빈 검색 → 500). 따라서 외부 발견은 **"키워드로 검색 → 결과에서 추림"** 방식이 유일하게 현실적. → 키워드 풀의 질이 곧 발견의 질.

---

## 2. 핵심 철학 (사용자 확정)

> **최대한 많은 부분을 커스텀 가능하게 하되, 앱이 그걸 최대한 편하게 돕고(스마트 기본값), 최대한의 성능을 보여준다.**

구체화:
- **의견이 섞이는 건 전부 노브(끌 수 있는 옵션)로 빼고, 앱은 좋은 기본값만 제공.** (인기/검증 필터는 호불호라 강제 게이트 X → 정렬 옵션으로. 최소회차만 게이트로 두되 조절 가능.)
- **아무 설정 안 해도 바로 잘 돌고**, 원하면 다 만질 수 있다. (취향 풀·탐험 풀·키워드 수확이 자동, 사용자는 비중·개수·밴·커스텀만 손대면 됨.)
- **닫힌 인앱 어휘에 갇히지 않는다** — 키워드는 실제 사이트 데이터로 자라난다(수확). "진짜 모험"이 가능해야 의도에 맞음.

---

## 3. 합의된 결정 전체 (시나리오 검토 10건으로 검증됨)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 콜드스타트 | 취향 풀 비면 슬라이더 무시하고 탐험 폴백 + "아직 취향 데이터가 없어 탐색 위주" 안내 |
| 2 | 재추천 윈도우 | 기본 `auto = min(작품수×0.3, 100)`, **사용자 커스텀 가능** |
| 3 | 넷상 부분성공 | 되는 플랫폼만으로 채움. 전부 실패 시 **이전 배치 보존** + 차단 hint 안내 |
| 4 | 넷상→본목록 직접추가 | **모드별 분기**: match/ratio=미평가(매칭 합류) · **hybrid=잠정위치로 넣고 `enqueueVerification`(동적 자리탐색이 확정)** · **manual=티어 지정 후 추가** |
| 5 | 밴/숨김 | **밴은 탐험 키워드 선정에서만** 제외(취향 데이터 불간섭). 밴/커스텀 리스트는 **직접 편집**(태그 칩뷰+텍스트뷰처럼, 상세편집도). 숨김은 링크키 + 상한 |
| 6 | TTL | **달력일 기준** + **새 배치 받을 때** 이전 배치 정리(앱 안 열면 안 지움) + **⭐보관 시 TTL 면제** + "사라질 예정" 표시 |
| 7 | dedup | **링크키 + 제목정규화** 2단. 유사중복은 완전숨김 대신 "이미 서재에 있어요" 약한 표시 |
| 8 | AI 키워드 | 키 없으면 토글 비활성 + 안내. 생성 키워드는 **수확풀에 캐시**. 실패 시 조용히 폴백 |
| 9 | **에코챔버 방지** | 탐험 슬롯은 수확풀에서 **hit_count 낮고 취향거리 먼 키워드 우선** + 가끔 완전 무작위 시드 강제 주입. ("탐험=내가 잘 안 가는 쪽") |
| 10 | 재뽑기/슬롯 | **재뽑기 쿨다운** + 한 번에 **검색 1~3회 제한**. 상태는 전부 **슬롯별**(app_meta=슬롯 DB라 자동) |

---

## 4. 데이터 (전부 슬롯별 DB)

### 4.1 새 테이블 (`CREATE TABLE IF NOT EXISTS` + `ensureColumn` 패턴)

**`web_reco`** — 넷상 추천 임시 작품 (표지 다운로드 X, 원격 URL 보관)
```
id TEXT PK, title, author, platform, link,
cover_url TEXT,          -- 원격 URL (저장 시점에만 saveCoverToLibrary)
genres TEXT,             -- JSON 배열
tags TEXT, synopsis TEXT,
total_episodes INTEGER, is_completed INTEGER, age INTEGER,
popularity INTEGER,      -- 조회/추천 집계 (노벨피아 등)
taste_score REAL,        -- computeTasteScore 결과
source_keyword TEXT, keyword_source TEXT,  -- taste|harvest|ai|inapp|custom
fetched_at INTEGER, batch_id TEXT,
pinned INTEGER DEFAULT 0,    -- ⭐보관 → TTL 면제
status TEXT DEFAULT 'pending' -- pending|saved|dismissed
```

**`web_reco_keywords`** — 수확 키워드 풀 (에코챔버 역가중용)
```
keyword TEXT PK, source TEXT,   -- harvest|ai|inapp
hit_count INTEGER DEFAULT 1,    -- 자주 등장할수록 ↑ → 탐험 가중 ↓
last_seen INTEGER, first_seen INTEGER
```

**`reco_hidden_works`** — "관심없음" 영구숨김 (상한 500, 오래된 것 자동정리)
```
link_key TEXT PK, title TEXT, created_at INTEGER
```

### 4.2 app_meta 키 (슬롯별, 칩 편집)
- `reco_settings` (JSON): §5 모든 노브
- `reco_banned_keywords` (배열): 탐험 제외 — 칩뷰+텍스트뷰 직접 편집
- `reco_custom_keywords` (배열): 내가 추가한 탐색 키워드 — 동일 편집
- `daily_reco` → **객체에서 배열로 변경**(N작). `reco_history` → 윈도우 확장

### 4.3 기존 재활용
`discovery_source="넷탐색"`(예정/본목록 보존 → "예정→실제" 분석 자동 집계), `saveCoverToLibrary`(저장 시 표지 다운로드), `computeTasteScore`, `enqueueVerification`(hybrid), `scraperDetectBlock`, `searchNovels`/`parseNovelpiaSearch` 등.

---

## 5. 커스텀 노브 (스마트 기본값 → 전부 오버라이드)

```
reco_settings = {
  library: {
    count: 4,                 // 내 서재 추천 작 수
    tasteExploreRatio: 70,    // 취향↔탐험 (넷상과 분리)
    rerollWindow: null,       // null=auto(min(작품수×0.3,100)) | 숫자=사용자값
  },
  web: {
    count: 5,                 // 넷상 추천 작 수 (라이브러리와 분리)
    tasteExploreRatio: 70,    // 취향↔탐험 (라이브러리와 분리)
    platforms: ["노벨피아","리디","네이버시리즈","문피아","카카오페이지"],
    sort: "random",           // random | taste | popular | hidden(숨은작 우선)
    workStatus: "all",        // all | completed | ongoing
    includeAdult: true,       // 19금 (기본 포함)
    minEpisodes: 50,          // 게이트, 0=끔
    useAiKeywords: false,     // 키 있을 때만 유효
    autoDaily: false,         // 1일1회 자동 (옵트인)
  },
  // 키워드: reco_banned_keywords / reco_custom_keywords (별도 키)
}
```
`*` 기본값은 시작값일 뿐 전부 조절. 두 슬라이더·두 작수는 **완전 분리**.

---

## 6. 키워드 엔진 (개방형 + 에코챔버 방지)

- **취향 풀**(auto): `preference_patterns` 고승률 장르·태그·작가 + 고티어 작품 태그. (`refreshDailyRecommendation` 내 기존 쿼리 재활용)
- **탐험 풀** (3층, 점점 밖으로):
  1. **인앱 어휘**(콜드스타트): `SUB_GENRES`(~100: 회귀·헌터·던전·먼치킨…)/`MAJOR_GENRES`/내 서재 태그. 이미 Tag Registry로 사용자 편집 가능.
  2. **수확 풀**: 검색결과 작품의 **실제 플랫폼 태그**(`novel_genre_arr` 등)를 `web_reco_keywords`에 누적 → 쓸수록 사이트 어휘로 확장.
  3. **AI 키워드**(선택): Claude/Gemini로 "다양한/요즘 뜨는 키워드 N개" 생성 → 수확풀 캐시.
- **에코챔버 방지(핵심)**: 탐험 슬롯은 수확풀에서 `hit_count` 낮음 + 취향거리 멈 우선 + 드물게 완전 무작위 시드 강제.
- **밴**: 탐험 키워드 선정에서만 제외(취향 불간섭). 메인 키워드가 밴이면 경고.
- **수확 오염 필터**: 플랫폼 태그 중 잡음("19","독점","공모전","무료","연재중",작가명류) 제외 후 누적.

---

## 7. 동작 흐름

### 7.1 넷상 가져오기 `fetchWebRecommendations(forceNew)`
1. **쿨다운/검색 1~3회 제한** 체크 → 키워드 N개 선정(§6) → `searchNovels` 병렬.
2. **부분성공 허용**, 전부 실패면 이전 배치 보존 + 안내(`scraperDetectBlock` hint 재활용).
3. **dedup**(링크키 + 제목정규화 / 서재·예정·숨김·밴 제외, 유사중복은 약한 표시).
4. **필터**(최소회차 게이트, 연재상태, 19금) → **정렬**(노브) → `computeTasteScore` 부여.
5. `web_reco` 배치 저장(표지 다운로드 X) → 결과 태그 **수확**(`harvestKeywordsFromResults`).
6. **TTL 정리**: 새 배치 받을 때 이전 배치 중 달력일 경과 + `pinned=0` 삭제(`cleanupExpiredWebReco`).

### 7.2 카드 액션
- 🔗 바로가기 `safeOpenURL(link)`
- 📋 예정에 추가 → `saveWebRecoToPlanned`(=`addPlannedNovel` 경로, `discovery_source="넷탐색"`, **표지 다운로드**)
- 📥 본목록 추가 → `saveWebRecoToLibrary`(**모드별**):
  - match/ratio: 미평가(rating 1500) 추가 → 매칭 큐 합류
  - hybrid: 잠정 위치(expected 있으면 그 티어, 없으면 최하위)로 추가 + `enqueueVerification` → 동적 자리탐색이 확정
  - manual: 티어 지정 모달 → 지정 후 추가
- ⭐ 보관 `pinWebReco`(TTL 면제) / 🙅 관심없음 `dismissWebReco`(`reco_hidden_works` 등록)

### 7.3 내 서재 추천 (`refreshDailyRecommendation` 개편)
- 1작 → **N작 배열**. 8카테고리 가중 유지하되 **취향↔탐험 슬라이더로 카테고리 가중 편향**(탐험=low_data/other/안읽음 쪽↑). **다양성 보장**(카테고리/장르 중복 회피). 재추천 윈도우 커스텀.
- `daily_reco`(배열)·`reco_history`(확장) 저장. 24h 캐시 유지.

---

## 8. UI 구조 (추천 탭, `screen === "reco"` ~56008)

1. **⚙️ 추천 맞춤설정** (상단 접이식): 내 서재/넷상 서브섹션(슬라이더·작수·필터) + 키워드 관리(커스텀·밴 칩 편집) + 숨긴작품 관리.
2. **🎯 내 서재 추천**: 균일 N카드(중밀도).
3. **🌐 넷상 추천**: 균일 N카드 + "🎲 새로 가져오기"(쿨다운) + 카드 액션. 빈/차단 시 안내.
4. **🔄 재평가 추천작**(기존, match/ratio) · **최근 추천 기록**(기존).
- **`RecoCard` 하나로 통일**(넷상은 티어 대신 인기·취향점수·플랫폼·바로가기). 현재의 무거운 큰 카드 대신 중밀도 카드 신설.

---

## 9. 함수 목록

**신규**: `fetchWebRecommendations`, `buildRecoKeywordPool`, `pickRecoKeywords`, `harvestKeywordsFromResults`, `generateAiKeywords`, `cleanupExpiredWebReco`, `dedupAgainstLibrary`, `normalizeWorkTitle`, `saveWebRecoToPlanned`, `saveWebRecoToLibrary`(모드분기), `dismissWebReco`, `pinWebReco`, ban/custom/hidden CRUD, `RecoCard`(컴포넌트), 설정 load/save.
**수정**: `refreshDailyRecommendation`(N작), 추천 탭 JSX 전면, 백업/복원(설정·밴·커스텀 직렬화, v13→v14), 헤더 버전 히스토리.

---

## 10. 코드 앵커 (App.jsx, 줄번호 근사 — 심볼로 검색)

| 목적 | 심볼 / 위치 |
|---|---|
| 일일추천 엔진 | `refreshDailyRecommendation` ~41490, `computeTasteScore`(그 안) |
| 추천 탭 JSX | `screen === "reco"` ~56008, `🎯 오늘의 추천` |
| 예정 추가/전환 | `addPlannedNovel` ~40522, `convertPlannedToNovel` ~40778 |
| 본목록 추가 | `addNovel`, hybrid `enqueueVerification`(~4670 헬퍼) |
| 검색/스크랩 | `searchNovels` ~16331, `fetchNovelMeta` ~16115, `parseNovelpiaSearch` ~16708, `scraperDetectBlock` ~15380 |
| 스키마 | `planned_novels` CREATE ~9704, `novels` + `discovery_source` ~9649/9725, `app_meta` 키-값 |
| app_meta | `getAppMeta` ~10255, `setAppMeta` ~10270 (슬롯별 DB) |
| 백업/복원 | `buildUltraCompactBackup`(선별 직렬화, 현재 v13), import 경로 |
| 태그 어휘 | `FACTORY_SUB_GENRES` ~12686, `FACTORY_MAJOR_GENRES` ~12674, `MAJOR_GENRES`/`SUB_GENRES` let ~13740 |
| 표지/취향 | `saveCoverToLibrary`, `computeTasteScore`, `safeDbOperation`, `safeOpenURL` |
| AI 호출 패턴 | `callClaude/GeminiForTagging`, `resolveAbortSignal({timeoutMs})`, `aiProvider`/키 로드 |

---

## 11. 빌드 순서 (제안)

- [x] **0. 설계 문서** (이 문서)
- [ ] **1. 토대**: 3 테이블 + 상수 + `reco_settings` load/save + 마이그레이션. (낮은 위험)
- [ ] **2. 키워드 엔진**: 취향/탐험 풀, 수확, 에코챔버 역가중, 밴/커스텀, AI 키워드. + 순수함수 테스트(`docs/scraper-test.mjs` 확장). (알고리즘 핵심)
- [ ] **3. 페치 오케스트레이션**: `fetchWebRecommendations`(쿨다운·부분성공·dedup·필터·정렬·수확·TTL).
- [ ] **4. 카드 액션**: 예정/본목록(모드분기)/숨김/보관.
- [ ] **5. 내 서재 N작 개편**: `refreshDailyRecommendation` 배열화 + 다양성 + 슬라이더 + 윈도우. (회귀 주의 — 단일모드 보존)
- [ ] **6. UI** (최대 분량): 설정 패널·`RecoCard`·두 섹션·밴/커스텀/숨김 에디터.
- [ ] **7. 백업 v14 + 버전업 + 게이트**: 설정/밴/커스텀 직렬화, esbuild + node 회귀.

테스트 가능성: **노벨피아 검색 API는 이 개발환경에서 200/실데이터 동작**(라이브 일부 가능). 나머지 플랫폼은 차단 → 픽스처/폰. 순수함수(정규화·dedup·키워드 가중·TTL)는 오프라인 회귀.

---

## 12. 신경써야 할 요소 / 리스크

- **단일 파일 57k줄**: 정확한 삽입 위치 + 기존 패턴 준수. `memo` 컴포넌트 리렌더 설계.
- **5대 불변조건**(App.jsx 11-42): 자동매칭 중 Alert 금지, 큐 스냅샷, write 전 queue drain, SQLITE_BUSY≠연결오류, 비동기 catch/finally. → 카드 액션 DB write는 `safeDbOperation`, 본목록 추가가 매칭 큐와 상호작용함에 유의.
- **daily_reco 형태 변경(객체→배열)**: 기존 캐시 마이그레이션 + 하위호환(구형 객체 읽으면 1원소 배열로).
- **백업 v14**: 설정/밴/커스텀은 백업 포함(사용자 노력) — `buildUltraCompactBackup` 선별 직렬화에 추가 + import. web_reco/수확풀은 임시라 **제외**. (AI 키처럼 app_meta라고 자동 포함 아님 — 명시 직렬화 필요.)
- **네트워크/ToS**: 쿨다운·검색 1~3회·on-demand 원칙(scraper-plan §9). 자동1일1회 신중.
- **성능(헤비유저 500작)**: dedup·taste 계산 캐싱. 추천 탭 과거 속도 이슈(v7.21.10) 재발 방지.
- **원격 표지 URL**: 핫링크 차단/만료 → 깨진 이미지. ExpoImage 캐시정책 + 플레이스홀더 폴백.
- **dedup 한계**: 제목 정규화(시즌/외전/표기차) 불완전 → 약한 표시로 흡수(완전숨김 X).
- **에코챔버 가중치 검증**: 런타임 데이터 의존이라 효과 측정 어려움 → 튜닝 여지 남김.
- **모드별 본목록 추가 회귀**: hybrid `enqueueVerification` 잠정위치, manual 티어 피커 — 기존 모달/플로우 재사용으로 위험 최소화.
- **슬롯 전환 경합**: 넷상 fetch 중 슬롯 전환 → 임시데이터 슬롯격리(app_meta·테이블 슬롯 DB라 자연 격리, 단 진행 중 fetch 취소 처리).

---

## 13. 새 세션에서 이어가는 법
1. 저장소 `star1water1/web-novel-tier`, 작업 브랜치에서 시작.
2. 지시: **"docs/reco-plan.md 읽고 이어서 진행해줘."**
3. §11 빌드 순서대로. 각 단계 후 esbuild 문법 게이트 + `node docs/scraper-test.mjs` 회귀.
