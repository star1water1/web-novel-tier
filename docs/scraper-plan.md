# 웹소설 플랫폼 메타데이터 스크래퍼 — 설계 & 핸드오프 문서

> **이 문서의 목적**: 세션 간 연속성을 위한 기록. 스크래퍼 기능에 대해 합의한 설계·결정·검증 결과·빌드 순서·남은 과제·코드 앵커를 담는다.
> **새 세션은 이 문서를 읽고 그대로 이어서 진행하면 된다.** (대화 맥락은 세션마다 초기화되지만 git에 커밋된 이 문서는 따라온다.)
>
> 작업 브랜치: `claude/festive-einstein-fub63d`
> 관련 기 적용분: 명대사 이미지 OCR(v7.28.24), 보충탭 무작위 정렬(v7.28.23)

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
| 장르 | `major_genre`/`sub_genre` | 앱 어휘로 매핑(후보 제시) |
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

| 플랫폼 | 구조 | 제목·작가·표지·회차·완결·줄거리 | 난이도 |
|---|---|---|---|
| 노벨피아 | 서버렌더 상세페이지 | 🟢 대부분 | 쉬움 (**PoC 1순위**) |
| 문피아 | 전통 서버렌더 HTML | 🟢 대부분 | 쉬움 |
| 네이버 시리즈 | 서버렌더 + `ld+json` | 🟡 | 쉬움~중 |
| 리디 | SPA + `__PRELOADED_STATE__` | 🟡 내장 JSON | 중 |
| 카카오페이지 | GraphQL SPA + 안티봇 | 🔴 | 어려움(후순위/보류) |

---

## 8. 빌드 순서 & 현재 상태

- [x] **0. 파싱 엔진 프로토타입 검증** (§5, node 테스트 통과) — App.jsx 미이식
- [ ] **1. 엔진 이식**: §5 함수 + `fetchNovelMeta(url)` 라이브 래퍼를 App.jsx에 (OTA 가능, egress 불필요 — 단 라이브 정확도는 실측 전까지 미확정)
- [ ] **2. 확인 모달**: `aiTagSuggest` 패턴으로 현재값↔가져온값 diff + 체크 적용 (공통, 4화면 재사용)
- [ ] **3. 4화면 배선**: 신규등록·예정등록·보충탭·편집모달에 "🔗 불러오기" 진입점 + 표지 다운로드 연결
- [ ] **4. 제목 검색(메인)**: `searchNovels(query)` → 후보 picker → 선택 → 엔진. ★**플랫폼 검색 엔드포인트 실측 필요**
- [ ] **5. 클립보드 감지** (expo-clipboard, 리빌드)
- [ ] **6. 공유 시트** (Android intent filter / config plugin, 리빌드)

---

## 9. 남은 과제 / 막힌 것

- **노벨피아 실제 HTML 구조 확인** — 상세페이지가 OG/JSON-LD에 어떤 필드를 싣는지, 회차/완결 표기. (egress 켜진 새 세션에서 직접 fetch, 또는 사용자 기기 응답으로 확인)
- **제목 검색 엔드포인트 디스커버리** — 메인 입력인데 추측 불가. 플랫폼 검색/자동완성 JSON 엔드포인트를 실측해야 함.
- **안티봇/UA** — 데이터센터 IP·비브라우저 차단 가능. 브라우저 UA 필수, 호출당 1회. (단, 실제 앱은 폰이라 datacenter IP 이슈 없음 — 개발 환경 fetch와 폰 응답이 다를 수 있음을 유의)
- **ToS** — 사용자가 자기 서재에 1건씩 붙여넣는 **개인용 on-demand** 원칙(대량 스크래핑 아님). 결과 캐시·재배포 금지.

---

## 10. egress (개발 환경 네트워크) 설정 메모

- Claude Code 웹 → **클라우드 아이콘 → 환경 편집 → Network access = `Custom`** → **Allowed domains**에 한 줄씩: `novelpia.com`, `*.novelpia.com`, `www.munpia.com`, `series.naver.com` 등. "Also include default list of common package managers" 체크(기본 허용목록 유지).
- **변경은 "새 세션"부터 적용**(현재 세션 컨테이너는 기존 정책 유지). 문서: https://code.claude.com/docs/en/claude-code-on-the-web (Network access)
- egress는 **개발 편의용일 뿐 실제 앱과 무관**(앱은 폰에서 정상 인터넷). 안 켜도 일반 OG/JSON-LD 엔진으로 진행 가능, 정밀화만 기기 응답으로.

---

## 11. 새 세션에서 이어가는 법

1. 같은 저장소 `star1water1/web-novel-tier`, 같은 브랜치 **`claude/festive-einstein-fub63d`**, **egress를 추가한 환경**으로 새 세션 시작.
2. 지시: **"docs/scraper-plan.md 읽고 노벨피아 PoC 이어서 진행해줘."**
3. 그 세션은 이 문서로 풀 컨텍스트를 복원하고 §8 빌드 순서대로 진행한다(egress 있으면 노벨피아 실측까지).
