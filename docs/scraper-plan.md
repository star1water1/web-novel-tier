# 웹소설 플랫폼 메타데이터 스크래퍼 — 설계 & 핸드오프 문서

> **이 문서의 목적**: 세션 간 연속성을 위한 기록. 스크래퍼 기능에 대해 합의한 설계·결정·검증 결과·빌드 순서·남은 과제·코드 앵커를 담는다.
> **새 세션은 이 문서를 읽고 그대로 이어서 진행하면 된다.** (대화 맥락은 세션마다 초기화되지만 git에 커밋된 이 문서는 따라온다.)
>
> 작업 브랜치: `claude/wonderful-rubin-5xsmo1` (직전 `claude/magical-mayer-ob48ts`와 동일 계보 — 새 작업은 이 브랜치에)
> 관련 기 적용분: 명대사 이미지 OCR(v7.28.24), 보충탭 무작위 정렬(v7.28.23)
>
> **⚡ 2026-06-21 진행(v7.28.29)**: 이 세션 egress가 (이전과 달리) **리디·카카오페이지에 도달** → 실제 페이지로 엔진을 **라이브 검증·정밀화**했다. ① OG/JSON-LD 폴백 버그 수정(§5.1), ② 카카오 `__NEXT_DATA__` 정밀화(장르·완결·작가, 웹소설/웹툰화 seriesId 분리), ③ 리디 제목검색(Stage 4) picker — searchNovels→리디 서버렌더 검색, 4화면 "🔎 제목 검색" 버튼, ④ 실측 픽스처 3종 + 회귀 41/41. 자세한 건 §5.1·§7·§8·§10.1.

---

## 1. 배경 / 동기

- **문제**: 작품 메타데이터(작가·회차·표지·장르·완결여부 등)가 전부 **수동 입력**. 그 빈칸을 메우려고 *보충탭*(`isSupplementTarget`)이 존재.
- **왜 LLM 검색이 아니라 스크래핑인가**: LLM 웹검색은 **마이너 작품에서 환각/오답**이 잦다. 원본 플랫폼 페이지엔 그 작품의 정확한 값이 그대로 있으니 **환각이 원천적으로 없다**. 정확도가 핵심 동기.
- **결정적 기술 사실**: 이 앱은 네이티브 빌드(APK)라 **React Native의 `fetch`는 브라우저가 아니라 네이티브 구현 → CORS가 없다**(웹 빌드 제외). 폰에서 플랫폼 URL을 직접 호출해 원본 HTML을 읽을 수 있다. → **서버렌더링 플랫폼은 백엔드/프록시 없이 폰에서 직접 긁기 가능.**

---

## 2. 핵심 결정 (합의됨)

### 2.1 입력 흐름 — 3종 모두 구현, **제목 검색이 메인**

| 흐름 | 사용자 노력 | URL 필요 | 배포 | 비고 |
|---|---|---|---|---|
| **① 제목 검색 (메인)** | 제목만 입력(어차피 침) | ❌ | **OTA 가능** | `searchNovels(제목)` → 후보 picker → 선택 → `fetchNovelMeta`. **막힌 건 네이티브가 아니라 "플랫폼 검색 엔드포인트를 모른다"는 것뿐** |
| ② 공유 시트 | 읽다가 공유 1탭 | 자동캡처 | **리빌드 필요** | Android `ACTION_SEND` intent filter (config plugin). "지금 읽는 작품" 시나리오 최적 |
| ③ 클립보드 감지 | 0~1탭 | 자동 | **리빌드 필요** | `expo-clipboard`(네이티브 모듈). 등록 화면 열 때 클립보드에 플랫폼 링크 있으면 1탭 칩 |
| (보조) 수동 URL | 링크 붙여넣기 | 필요 | OTA 가능 | 약하지만 파이프라인 검증용으로 가장 단순 |

> 세 방식 모두 **뒷단(`fetchNovelMeta` → 파싱 → 표지 다운로드 → 확인 적용)은 공통**이고 **앞단 입력 단계만** 다르다. 코어 한 번 만들면 입력 흐름은 갈아끼우면 됨.
>
> 시나리오 대응: **지금 읽는 작품 → ②공유 시트**, **이름만 아는 추천작 → ①제목 검색**. ①+②면 "수동 URL 입력"은 사실상 불필요.

### 2.2 적용 화면 — 전부

신규등록 / **예정등록(`planned_novels`)** / **보충탭** / 편집모달. 보충탭이 특히 강력 — *어떤 필드가 비었는지*(`isSupplementTarget`)를 이미 아니까 스크래퍼가 그 빈칸만 정조준.

### 2.3 확인 모달 필수

스크래핑 결과가 **사용자 입력을 조용히 덮어쓰지 않게**: 필드별 `현재값 → 가져온값` diff + 체크박스로 선택 적용, "빈 칸만 채우기 / 전체 덮어쓰기" 토글. → **기존 AI 태그추천 모달 패턴(`aiTagSuggest`/`toggleAiTagItem`/`setAiTagSuggest`)을 그대로 재사용.**

---

## 3. 아키텍처

```
[입력] 제목검색 / 공유 / 클립보드 / 수동URL
   │
   ├─ searchNovels(query)  → 후보[] (title, author, coverUrl, url, platform)  ★엔드포인트 실측 필요
   │                          → 사용자가 후보 1개 선택 → url 확보
   ▼
fetchNovelMeta(url)        // 디스패처
   ├─ detectPlatformFromUrl(url)
   ├─ fetch(url, { headers: { 'User-Agent': 모바일 브라우저 } })   // RN 네이티브 = CORS 없음, 프록시 불필요
   ├─ normalizeFromHtml(html, url)   // OG + JSON-LD 우선 (검증 완료, §5)
   │     └─ (플랫폼별 정밀화 후크: 회차/완결/작가 등)
   └─ coverUrl 있으면 → saveCoverToLibrary(coverUrl)  // 기존 표지 파이프라인(downloadAsync) 그대로
   ▼
[확인 모달] 현재값↔가져온값 diff + 체크 적용
   ▼
폼 setter / DB 필드에 반영
```

**파싱 전략**: HTML을 통째 DOM 파싱하지 않는다(RN엔 DOMParser/cheerio 없음). 서버가 페이지에 심어둔 **JSON 덩어리(`application/ld+json`, `__NEXT_DATA__`, `__PRELOADED_STATE__`)를 정규식으로 떼어 `JSON.parse`** + **OpenGraph 메타**. 셀렉터보다 견고하고 마크업 변경에 덜 깨진다.

---

## 4. 필드 매핑 (원본 페이지 → 앱 실제 컬럼)

| 원본 | 앱 컬럼 | 처리 |
|---|---|---|
| 제목 | `title` | 그대로 |
| 작가 | `author` | 그대로 |
| 표지 이미지 | `cover_image` | **긁은 URL → `saveCoverToLibrary(url)` → 로컬 저장** (downloadAsync 이미 지원) |
| 총 회차 | `total_episodes` | 숫자 파싱 |
| 완결/연재 | `work_status` | `completed`/`ongoing` 매핑 |
| 장르 | `major_genre`/`sub_genre` | **✅ 구현(v7.28.30)** `mapScrapedGenres`: 공백·대소문자 무시로 `MAJOR_GENRES`/`SUB_GENRES`와 대조 → 매칭 시 앱 정식 표기로 치환(예: "퓨전 판타지"→"퓨전판타지"), 대분류 우선. 미매칭은 대분류 후보로 원문 유지. 확인 모달에 대장르/부장르 항목으로 후보 제시(현재값과 합쳐 중복 제거). ※ 별칭(로판 등)까지 필요하면 `normalizeTag` 도입 여지 |
| 줄거리 | `note` | 그대로(선택) |
| 플랫폼 태그 | `tags` | **후보로만** 제시(플랫폼마다 체계 달라 1:1 아님 → 사용자 정리 또는 후속 AI 정규화) |
| 플랫폼 | `platforms` | URL 도메인으로 자동판별 |
| (링크) | `link` | 입력값 그대로 |

> ⚠️ `read_count`(내가 읽은 화수)는 **개인 독서기록 → 스크래핑 대상 아님.** 작품 전체 회차(`total_episodes`)만 가져온다. 둘은 다른 값.

---

## 5. 검증된 파싱 엔진 (프로토타입 — node 테스트 통과)

> 합성 HTML 3종(JSON-LD+OG 풍부 / OG만 / `@graph` 안 Book)으로 검증: 제목·작가·표지·줄거리·장르·완결·회차 정확 추출 + 우아한 degrade 확인.
> **OG 메타·JSON-LD는 사실상 모든 사이트의 표준이라 제목·표지·줄거리·장르는 플랫폼을 몰라도 잘 떨어진다.** 회차·완결·작가는 플랫폼별 정밀화 자리.

```js
// 🔗 fetchNovelMeta 파싱 엔진 — HTML → 정규화 메타. OG + JSON-LD(Book/CreativeWork) 우선.
const PLATFORM_DOMAINS = [
  { key: "노벨피아", host: "novelpia.com" },
  { key: "문피아", host: "munpia.com" },
  { key: "네이버시리즈", host: "series.naver.com" },
  { key: "리디", host: "ridibooks.com" },
  { key: "카카오페이지", host: "page.kakao.com" },
];
function detectPlatformFromUrl(url) {
  const u = (url || "").toLowerCase();
  for (const p of PLATFORM_DOMAINS) if (u.includes(p.host)) return p.key;
  return null;
}

// <meta property/name/itemprop=... content=...> (속성 순서 무관)
function extractMetaTags(html) {
  const out = {};
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = (tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const content = (tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [])[1];
    if (key && content != null && out[key.toLowerCase()] == null) out[key.toLowerCase()] = content;
  }
  return out;
}

// 모든 <script type="application/ld+json"> 블록 파싱 + @graph/배열 평탄화
function extractJsonLd(html) {
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const arr = Array.isArray(parsed) ? parsed
        : (parsed["@graph"] && Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed]);
      for (const o of arr) if (o && typeof o === "object") blocks.push(o);
    } catch { /* 깨진 ld+json 스킵 */ }
  }
  return blocks;
}

const pickType = (blocks, types) => blocks.find(b => {
  const t = b["@type"]; const ts = Array.isArray(t) ? t : [t];
  return ts.some(x => types.includes(String(x)));
});
const asText = (v) => (typeof v === "string" ? v : (v && typeof v === "object" ? (v.name || v.url || "") : "")) || "";
const firstImg = (img) => Array.isArray(img) ? firstImg(img[0]) : asText(img);

function normalizeFromHtml(html, url) {
  const platform = detectPlatformFromUrl(url);
  const og = extractMetaTags(html);
  const ld = extractJsonLd(html);
  const book = pickType(ld, ["Book", "CreativeWork", "CreativeWorkSeries", "Product", "WebPage"]) || ld[0] || {};

  const title = asText(book.name) || og["og:title"] || og["twitter:title"] || "";
  let author = "";
  if (book.author) author = Array.isArray(book.author) ? book.author.map(asText).filter(Boolean).join(", ") : asText(book.author);
  if (!author) author = og["author"] || og["og:novel:author"] || "";
  const coverUrl = firstImg(book.image) || og["og:image"] || og["twitter:image"] || "";
  const synopsis = asText(book.description) || og["og:description"] || "";
  let genres = book.genre || og["og:novel:genre"] || og["genre"] || "";
  genres = Array.isArray(genres) ? genres : (genres ? String(genres).split(/[,/|·]/).map(s => s.trim()).filter(Boolean) : []);

  // 완결/연재 — JSON-LD 표준 없음 → 본문 텍스트 신호(플랫폼별 정밀화 자리)
  let workStatus = null;
  if (/완결|completed/i.test(html)) workStatus = "completed";
  else if (/연재\s*중|연재중|ongoing/i.test(html)) workStatus = "ongoing";

  // 총 회차 — numberOfEpisodes/Pages 또는 "전체/총 N화"(플랫폼별 정밀화 자리)
  let totalEpisodes = null;
  const ne = book.numberOfEpisodes || book.numberOfPages;
  if (ne && !isNaN(Number(ne))) totalEpisodes = Number(ne);
  if (totalEpisodes == null) {
    const mm = html.match(/(?:전체|총)\s*([0-9,]+)\s*화/);
    if (mm) totalEpisodes = Number(mm[1].replace(/,/g, ""));
  }

  return { ok: !!title, platform, url, title, author, coverUrl, synopsis, genres, workStatus, totalEpisodes };
}
```

테스트 결과(요약):
- **A** (JSON-LD Book + OG): 제목/작가/표지/줄거리/장르/완결/320화 전부 ✅
- **B** (OG만): 제목/표지/줄거리/연재중 추출, 작가 공란(없음) → degrade ✅
- **C** (`@graph` 안 Book, author=문자열, image=객체, numberOfPages): 변형 구조 정확 파싱 ✅

### 5.1 라이브 실측으로 드러난 버그 & 수정 (v7.28.29)

- **🐞 비작품 JSON-LD 폴백이 제목을 덮어씀**: `book = pickType(...) || ld[0] || {}`에서, 페이지에 **작품 블록이 없고 `Organization`만 있을 때**(카카오페이지가 그렇다) `ld[0]`=Organization을 집어 그 `name`("카카오페이지")이 진짜 `og:title`을 이김 → 모든 카카오 작품 제목이 "카카오페이지"로 나옴.
  - **수정**: `ld.find(b => !비작품(b))`로 폴백을 **비작품(Organization/WebSite/BreadcrumbList/SearchAction/SiteNavigationElement/ItemList) 제외** 블록으로 한정. 그래도 없으면 `{}` → OG로 정상 degrade. (회귀 테스트: "카카오 제목(흑백무제)")
- **🐞 본문-텍스트 완결 휴리스틱이 정밀화를 가로막음**: 공통 엔진의 `/완결|연재중/` 정규식이 **내장 JSON 안의 라벨**("연재" 등)을 잡아 `workStatus`를 먼저 채우면, `if(!meta.workStatus)` 게이트 때문에 플랫폼 정밀화가 못 덮어씀(카카오 완결작이 "연재중"으로).
  - **수정**: 카카오 정밀화는 구조화 신호(`onIssue`)를 **무조건 우선**(게이트 제거). 장르(`subcategory`)도 동일.

---

## 6. App.jsx 통합 지점 (코드 앵커)

> App.jsx는 단일 파일(~63k줄). 줄 번호는 변하므로 **함수/심볼명으로 검색**할 것.

| 목적 | 심볼 / 위치 |
|---|---|
| novels 스키마 | `CREATE TABLE IF NOT EXISTS novels` + migrations 배열 (`total_episodes`, `cover_image`, `link`, `work_status`, `major_genre`, `sub_genre` 등) |
| 예정 스키마 | `planned_novels` (메타 컬럼 유사 + `memorable_quote`) |
| 신규 등록 폼 상태 | `setTitle`, `setAuthor`, `setTotalEpisodes`, `setNewLink`(state `newLink`), `setNewMajorGenre`, `setNewSubGenre`, `setTags` |
| 신규 등록 함수 | `async function addNovel()` |
| 편집 | `editItem` / `updateEditItem` / `saveEdit` |
| 보충 대상 판별 | `isSupplementTarget` (어떤 필드가 비었는지 정의) |
| 표지 저장(원격 URL 지원) | `saveCoverToLibrary(sourceUri, ...)` — copyAsync→**downloadAsync**→base64 순. http(s) URL이면 downloadAsync로 다운로드 |
| 기존작 표지 적용 | `applyNovelCover(novelId, newCoverPath, oldCoverPath)` |
| 링크 입력 UI(진입점 후보) | placeholder `"https://novelpia.com/novel/..."` 3곳(신규/보충/편집) — 그 옆에 "🔗 불러오기" 버튼 추가 |
| AI 호출 패턴(참고) | `callClaude/GeminiForTagging`, `callClaude/GeminiForOCR`, `resolveAbortSignal({timeoutMs})` |
| AI 핸들러 패턴(참고) | `runAiTagSuggest` — provider 해석→키 검증→busy→try/catch/finally→Alert |
| 확인 모달 패턴(재사용) | `aiTagSuggest` state + `setAiTagSuggest` + `toggleAiTagItem` (체크 후보→적용) |
| API 키/제공자 | `aiProvider`, `geminiApiKey`, `claudeApiKey`, `loadGlobalAiConfig` (스크래핑엔 키 불필요하나 동일 인프라 참고) |
| 네트워크 fetch 선례 | `api.anthropic.com` / `generativelanguage.googleapis.com` 직접 fetch (동일 패턴으로 플랫폼 fetch) |
| 헤더 버전 히스토리 | App.jsx 1~290줄 — 수정 시 버전/날짜/변경내역 갱신 (CLAUDE.md 규칙) |

---

## 7. 플랫폼별 가능 범위 (실측으로 확정 필요)

| 플랫폼 | 구조 | URL→메타 (제목·작가·표지·회차·완결·줄거리) | 제목검색 | 난이도 |
|---|---|---|---|---|
| 노벨피아 | 서버렌더 상세페이지 | 🟡 미실측(개발IP 차단) — 폰에서 확인 | 미실측 | 쉬움(추정) |
| 문피아 | 전통 서버렌더 HTML | 🟡 미실측(CF 챌린지) — 폰에서 확인 | 미실측 | 쉬움(추정) |
| 네이버 시리즈 | 서버렌더 + `ld+json` | 🟡 미실측(egress 비허용) | 미실측 | 쉬움~중 |
| 리디 | Next.js SSR(`__NEXT_DATA__`+JSON-LD Book) | **🟢 실측 완벽**(공통 엔진만으로 제목·작가·장르·완결·회차) | **🟢 구현**(SSR 검색) | 중→**완료** |
| 카카오페이지 | Next.js SSR(`__NEXT_DATA__`) + GraphQL | **🟢 실측 동작**(OG+`__NEXT_DATA__` 정밀화) | 🔴 GraphQL(302)·SSR결과 없음 → 보류 | URL은 쉬움 / 검색 어려움 |

> **실측 메모(v7.28.29, 이 세션 egress)**: 리디·카카오는 **Next.js**라 페이지에 `__NEXT_DATA__`(작품 전체 데이터)가 통째로 박혀 있다.
> - **리디**: JSON-LD `Book`(author=Person, genre, image, description) + 본문 "총 N화"/"완결" → 공통 엔진이 **보정 없이** 정확. 검색은 `ridibooks.com/search?q=`가 서버렌더라 `__NEXT_DATA__`의 `books[].book`을 긁어 후보 생성(검색 *서브도메인* `search.ridibooks.com`은 egress 비허용이지만 SSR 페이지로 우회).
> - **카카오**: 상세 JSON-LD는 `Organization`뿐 → 제목·작가·표지·줄거리는 OG/`<meta author>`, **장르·완결은 `__NEXT_DATA__`의 `content.subcategory`/`content.onIssue`**(End=완결/Ing=연재). 같은 `/content/{id}` 페이지에 **웹소설+웹툰화가 함께** 실리니(제목 동일, seriesId/연재상태 다름) **URL의 content id=seriesId로 정확히 골라야** 완결 오판이 없다. 검색은 GraphQL(POST 302)뿐이고 검색결과 SSR엔 데이터 없음 → **보류**(폰/토큰 확보 후 재도전).

### 7.1 플랫폼 범위 = **전부** (사용자 확정)

목표는 위 **5개 플랫폼 전부**. "노벨피아 먼저"는 *공통 파이프라인을 가장 쉬운 데서 1회 검증*하려는 **순서**일 뿐, 범위 축소가 아니다. 엔진(OG/JSON-LD)이 플랫폼 공통이라 플랫폼 추가 비용 = ① 정밀화 함수(회차·완결 등 고유부) + ② 검색 엔드포인트뿐. `detectPlatformFromUrl`엔 이미 5개 등록됨.

**롤아웃 단계**: ① 공통 파이프라인 + 노벨피아(검증) → ② 문피아·시리즈(서버렌더, 빠름) → ③ 리디(내장 JSON) → ④ 카카오페이지(도전 — 안티봇/GraphQL, 부분/추가작업 가능성, 미리 확정 안 함). "URL→메타"는 공통 엔진이 대부분 커버, **제목검색 엔드포인트만 플랫폼별 실작업**.

---

## 8. 빌드 순서 & 현재 상태

- [x] **0. 파싱 엔진 프로토타입 검증** (§5, node 테스트 통과)
- [x] **1. 엔진 이식** (v7.28.25): `SCRAPER_PLATFORMS`/`detectPlatformFromUrl`/`scraperExtractMetaTags`/`scraperExtractJsonLd`/`scraperNormalizeFromHtml`/`scraperRefineByPlatform`/`fetchNovelMeta`/`searchNovels`(stub) 를 App.jsx에 이식. callGeminiForOCR 직후 모듈 블록. **미배선**(UI 호출 없음). 라이브 정확도는 실측 전까지 미확정.
- [x] **2. 확인 모달** (v7.28.26): `scrapeModal` state + `buildScrapeItems`(현재값↔가져온값 diff, 빈 칸만 기본 체크) + 모달 JSX(체크 적용). `aiTagModal` 오버레이 패턴 미러. **4화면 공용**(`ctx.apply` 분기) — 표지는 원격 URL→`saveCoverToLibrary`(downloadAsync)→경로.
- [x] **3. 4화면 배선** (v7.28.27): 신규·예정·보충·편집 모두 "🔗 링크에서 정보 불러오기" 진입점. 신규/예정=자체 setter(예정은 링크칸 신설), 편집=updateEditItem+setEditWorkStatus+setEditCoverImageSync, 보충=updateEditItem(title은 보충 저장 미포함이라 `ctx.fields`로 제외). 모달은 `ctx.apply` 분기로 4화면 공용.
- [x] **3.5 네트워크 강화 + 차단 판별 + 검증 하네스** (v7.28.28): `SCRAPER_HEADERS`(Accept/sec-ch-ua/Sec-Fetch-* 등 브라우저급 헤더로 교체) + `scraperDetectBlock(status,html)`(Cloudflare 챌린지/403/429/503/캡차 식별 → "정보 없음"과 구분해 안내). `fetchNovelMeta`가 본문을 항상 읽고 차단을 우선 판정. 실측 차단 응답을 `docs/scraper-fixtures/`에 보존, `docs/scraper-test.mjs`가 App.jsx 실제 함수를 추출해 회귀(파싱 §5 + 차단판별 + 플랫폼판별, **27/27 통과**). ※ 개발환경 egress 실측 결과는 §10.
- [x] **3.6 라이브 검증 + 카카오/리디 정밀화** (v7.28.29): 이 세션 egress가 리디·카카오에 도달 → 실제 페이지로 엔진 검증. **OG/JSON-LD 폴백 버그 수정**(§5.1) + **`scraperRefineKakao`**(`__NEXT_DATA__` 장르·완결·작가, seriesId로 웹소설/웹툰화 분리). 리디는 공통 엔진만으로 정확(보정 불필요, 실측). 실측 축약 픽스처 3종 + 회귀 41/41.
- [x] **4. 제목 검색(메인) — 리디** (v7.28.29): `searchNovels(query)`→`searchRidi`(서버렌더 검색 페이지 `__NEXT_DATA__`의 `books[].book` 파싱)→후보 picker 모달→선택 시 `runScrapeFromUrl(url, ctx)`로 기존 확인 모달 합류. **4화면 모두 "🔎 제목 검색" 버튼**(ctx 빌더 공용: `scrapeCtxNew/Planned/Supplement/Edit`). ⚠️ **리디만 구현** — 카카오 검색=GraphQL/SSR결과 없음(보류), 노벨피아·문피아·시리즈=개발IP 차단으로 엔드포인트 미실측(폰/주거망에서 추가).
- [x] **4.5 장르 매핑** (v7.28.30): `mapScrapedGenres`로 플랫폼 장르를 앱 어휘(`MAJOR_GENRES`/`SUB_GENRES`)에 공백·대소문자 무시 매칭 → 확인 모달에 대장르/부장르 후보 항목 추가(이전엔 가져와도 버려졌음). 4화면 ctx 배선(신규·예정=배열 state, 편집·보충=JSON 문자열). 실측 매핑(카카오 "무협", 리디 "퓨전 판타지"→"퓨전판타지") + 회귀 48/48.
- [ ] **4b. 제목 검색 — 나머지 플랫폼**: 노벨피아/문피아/시리즈 검색 엔드포인트 폰 실측 후 `searchNovels`에 추가. 카카오는 GraphQL 토큰/persisted query 필요.
- [ ] **5. 클립보드 감지** (expo-clipboard, 리빌드)
- [ ] **6. 공유 시트** (Android intent filter / config plugin, 리빌드)

---

## 9. 남은 과제 / 막힌 것

- **노벨피아 실제 HTML 구조 확인** — 상세페이지가 OG/JSON-LD에 어떤 필드를 싣는지, 회차/완결 표기. **(2026-06-21 실측: 개발환경 IP는 노벨피아 awselb가 nginx 403으로 전면 차단 → 라이브 HTML 확인 불가.)** ⇒ **폰(주거망)에서 "🔗 불러오기"로 직접 확인**하는 게 현실적 경로. 회차·완결·작가 정밀화(`scraperRefineByPlatform`)는 그 결과를 받아 데이터 기반으로 채운다. (또는 실제 페이지 HTML을 캡처해 `docs/scraper-fixtures/`에 넣고 `scraper-test.mjs`로 검증)
- **제목 검색 엔드포인트 디스커버리** — 메인 입력인데 추측 불가. 플랫폼 검색/자동완성 JSON 엔드포인트를 실측해야 함. **개발 IP 차단으로 이 세션에선 실측 불가** — 폰/주거망 또는 사용자 기기 응답으로 확인 필요.
- **안티봇/UA** — **(2026-06-21 실측 & v7.28.28 대응)** 노벨피아=datacenter IP 차단(nginx 403, 풀 브라우저 헤더로도 안 풀림 → IP 기반), 문피아=Cloudflare JS 챌린지(`cf-mitigated: challenge`, 헤더로 불가). **실제 앱은 폰(주거망 IP)이라 두 경우 모두 통과 기대.** 대응: `SCRAPER_HEADERS`로 브라우저급 헤더 전송 + `scraperDetectBlock`로 차단/챌린지를 사용자에게 명확히 안내(폰 브라우저에서 직접 열기 유도). 호출당 1회 원칙 유지.
- **ToS** — 사용자가 자기 서재에 1건씩 붙여넣는 **개인용 on-demand** 원칙(대량 스크래핑 아님). 결과 캐시·재배포 금지.

---

## 10. egress (개발 환경 네트워크) 설정 메모

- Claude Code 웹 → **클라우드 아이콘 → 환경 편집 → Network access = `Custom`** → **Allowed domains**에 한 줄씩: `novelpia.com`, `*.novelpia.com`, `www.munpia.com`, `series.naver.com` 등. "Also include default list of common package managers" 체크(기본 허용목록 유지).
- **변경은 "새 세션"부터 적용**(현재 세션 컨테이너는 기존 정책 유지). 문서: https://code.claude.com/docs/en/claude-code-on-the-web (Network access)
- egress는 **개발 편의용일 뿐 실제 앱과 무관**(앱은 폰에서 정상 인터넷). 안 켜도 일반 OG/JSON-LD 엔진으로 진행 가능, 정밀화만 기기 응답으로.

### 10.2 egress 재실측 (2026-06-21 후속, 브랜치 `claude/wonderful-rubin-5xsmo1`)

이전 세션과 **정책이 달라져** 일부 플랫폼이 도달 가능해졌다(세션마다 egress가 다를 수 있음):

| 호스트 | 응답 | 의미 |
|---|---|---|
| `page.kakao.com` | **200 (풀 HTML)** | ✅ 도달 — `__NEXT_DATA__` 포함. 상세 라이브 검증·정밀화 완료 |
| `ridibooks.com` | **200 (상세/검색 SSR)** | ✅ 도달 — JSON-LD Book + `__NEXT_DATA__`. URL→메타·제목검색 검증 완료 |
| `search.ridibooks.com` | DNS 실패 | 검색 *서브도메인*은 비허용 → `ridibooks.com/search` SSR로 우회 |
| `series.naver.com` | `Blocked by egress policy` | 여전히 비허용 |
| `novelpia.com` | 403(awselb/nginx) | datacenter IP 차단(이전과 동일) |
| `www.munpia.com` | 403 `cf-mitigated: challenge` | Cloudflare 챌린지(이전과 동일) |

**교훈**: egress 허용목록은 **세션마다 바뀔 수 있으니, 새 세션 첫 단계에서 직접 재실측**(`curl`)하고 도달되는 플랫폼은 라이브로 검증·정밀화한다. 도달 안 되는 건 폰 캡처 픽스처로.

### 10.1 이 환경 egress 실측 (2026-06-21, 브랜치 `claude/magical-mayer-ob48ts`)

| 호스트 | egress | origin 응답 | 의미 |
|---|---|---|---|
| `novelpia.com` | ✅ 허용 | **403 (awselb/nginx)** | 도메인은 도달하나 **datacenter IP 전면 차단**. 풀 브라우저 헤더로도 안 풀림 |
| `www.munpia.com` | ✅ 허용 | **403 `cf-mitigated: challenge`** | **Cloudflare JS 챌린지** — 순수 fetch 불가 |
| `series.naver.com` | ❌ 차단 | `Blocked by egress policy` | 이 환경 허용목록에 없음 |
| `ridibooks.com` / `page.kakao.com` | ❌ 차단 | `Host not in allowlist` | 허용목록에 없음 |
| `web.archive.org` / `google` / `duckduckgo` | ❌ 차단 | `Host not in allowlist` | 캐시 우회로도 막힘 |

**결론**: 이 개발환경에선 **어떤 플랫폼도 라이브 HTML/검색 실측이 불가**(허용된 노벨피아·문피아조차 IP/챌린지로 막힘, 우회용 archive·검색엔진은 비허용). → **라이브 검증은 폰에서.** 실측 차단 응답 2종은 `docs/scraper-fixtures/`에 보존(회귀 테스트에 사용). 다음 세션에서 라이브가 꼭 필요하면 egress에 `*.novelpia.com`만으로는 부족(IP 차단)하므로, 폰 캡처 HTML을 픽스처로 넣는 방식이 더 확실.

---

## 11. 새 세션에서 이어가는 법

1. 같은 저장소 `star1water1/web-novel-tier`, 브랜치 **`claude/wonderful-rubin-5xsmo1`**(현재 작업 계보)로 새 세션 시작.
2. 지시: **"docs/scraper-plan.md 읽고 이어서 진행해줘."**
3. 그 세션은 이 문서로 풀 컨텍스트를 복원하고, **첫 단계로 egress 재실측**(§10.2) 후 §8 빌드 순서대로 진행한다.

### 11.1 라이브 검증 루프 — 도달 가능 플랫폼은 라이브로, 막힌 건 폰 캡처로

엔진/모달/배선/네트워크/제목검색(리디)은 완성·검증됨. egress는 **세션마다 다를 수 있으니** 먼저 재실측한다:

- **(0) egress 재실측(먼저)**: `curl -sS -A "<모바일 UA>" https://<host>` 로 5개 플랫폼 도달 확인(§10.2가 예시). 도달되면 라이브로, 아니면 폰 캡처 픽스처로.
- **(A) 폰 직접 테스트(개발IP 차단 플랫폼)**: 실제 앱(v7.28.29+)에서 노벨피아/문피아 작품 링크로 "🔗 링크에서" → ① 정상이면 제목·작가·표지·회차·완결 검증, ② 차단 안내면 종류 보고. 이 결과로 `scraperRefineByPlatform`에 해당 플랫폼 분기 추가(카카오 `scraperRefineKakao` 패턴 참고).
- **(B) HTML 캡처 → 픽스처**: 폰 브라우저 '페이지 소스 보기'로 HTML 확보 → `docs/scraper-fixtures/<플랫폼>-<작품>.html`(실측 페이지의 `<head>` meta + JSON-LD + `__NEXT_DATA__`만 남긴 축약본으로 OK) → `docs/scraper-test.mjs`에 케이스 추가.
- **오프라인 회귀**: `node docs/scraper-test.mjs` (네트워크 불필요, App.jsx 실제 함수 vm 추출 실행 — 현재 **41/41**).
- **JSX 문법 게이트**: `npx esbuild App.jsx --loader:.jsx=jsx --bundle=false --outfile=/dev/null` (UI 수정 후 전체 파싱 확인 — RN 빌드 없이 문법만).

### 11.2 다음 우선순위(권장 순서)

1. **제목검색 타 플랫폼**(Stage 4b): 폰에서 노벨피아/문피아/시리즈 검색 URL·응답 실측 → `searchNovels`에 분기 추가(`searchRidi` 패턴 그대로). 카카오는 GraphQL 토큰 확보가 선결.
2. **클립보드/공유 시트**(Stage 5·6, 리빌드 필요).
3. (선택) **장르 별칭 매핑 강화**: 현재 `mapScrapedGenres`는 공백·대소문자만 무시. "로판"→"로맨스판타지" 같은 별칭까지 잡으려면 `normalizeTag`(TAG_ALIASES) 경유로 교체(슬라이스 밖 의존 → 테스트 하네스도 조정 필요).

> ✅ **완료**: 장르 매핑(v7.28.30) — 플랫폼 장르→앱 어휘 후보 제시.
