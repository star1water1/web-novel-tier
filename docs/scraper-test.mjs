// 스크래퍼 엔진 오프라인 회귀 테스트 (node — RN 불필요)
//   App.jsx의 실제 스크래퍼 함수 소스를 그대로 떼어 vm에서 실행한다(로직 복제 없음 → 드리프트 0).
//   ① 합성 작품 HTML 3종 파싱(§5)  ② 실측 차단 픽스처(scraper-fixtures) 판별  ③ 플랫폼 판별.
//   실행: node docs/scraper-test.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(__dirname, "..", "App.jsx");
const src = fs.readFileSync(appPath, "utf8");

// App.jsx의 스크래퍼 모듈 구간만 슬라이스(순수 JS — JSX/import 없음)
const start = src.indexOf("const SCRAPER_UA =");
const end = src.indexOf("function findSameTag(");
if (start < 0 || end < 0 || end <= start) { console.error("✗ 슬라이스 마커를 못 찾음(App.jsx 구조 변경?)"); process.exit(1); }
let slice = src.slice(start, end);
slice += "\n;globalThis.__SCR = { detectPlatformFromUrl, scraperExtractMetaTags, scraperExtractJsonLd, scraperNormalizeFromHtml, scraperRefineByPlatform, scraperDetectBlock, parseRidiSearch, scraperExtractNextData, SCRAPER_HEADERS, SCRAPER_UA };\n";

// fetch/resolveAbortSignal은 정의 시점엔 호출 안 됨(스텁만). 순수 함수만 꺼내 쓴다.
const sandbox = { console, fetch() { throw new Error("no net"); }, resolveAbortSignal: () => ({ signal: undefined, cleanup() {} }) };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(slice, sandbox, { filename: "App.jsx#scraper" });
const S = sandbox.__SCR;

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✅" : "❌"} ${name}${ok ? "" : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};
const truthy = (name, got) => { const ok = !!got; console.log(`${ok ? "✅" : "❌"} ${name}${ok ? "" : `  got=${JSON.stringify(got)}`}`); ok ? pass++ : fail++; };

// ── ① 합성 작품 파싱(§5: A 풍부 / B OG만 / C @graph 변형) ─────────────────────
const A = `<html><head>
<meta property="og:title" content="OG제목"><meta property="og:image" content="https://x/og.jpg">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Book","name":"별을 삼킨 검","author":{"@type":"Person","name":"홍길동"},"image":"https://x/cover.jpg","description":"무협 줄거리","genre":["무협","판타지"],"numberOfEpisodes":320}</script>
</head><body>이 작품은 완결되었습니다</body></html>`;
const a = S.scraperNormalizeFromHtml(A, "https://novelpia.com/novel/1");
eq("A.title", a.title, "별을 삼킨 검");
eq("A.author", a.author, "홍길동");
eq("A.coverUrl", a.coverUrl, "https://x/cover.jpg");      // JSON-LD가 OG보다 우선
eq("A.genres", a.genres, ["무협", "판타지"]);
eq("A.totalEpisodes", a.totalEpisodes, 320);
eq("A.workStatus", a.workStatus, "completed");
eq("A.platform", a.platform, "노벨피아");

const B = `<html><head>
<meta property="og:title" content="연재작"><meta property="og:image" content="https://x/b.jpg">
<meta property="og:description" content="설명"></head><body>연재중</body></html>`;
const b = S.scraperNormalizeFromHtml(B, "https://www.munpia.com/novel/2");
eq("B.title", b.title, "연재작");
eq("B.author(공란 degrade)", b.author, "");
eq("B.workStatus", b.workStatus, "ongoing");
truthy("B.ok", b.ok);

const C = `<html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"플랫폼"},{"@type":"Book","name":"그래프북","author":"김작가","image":{"@type":"ImageObject","url":"https://x/c.png"},"description":"설명C","numberOfPages":"150"}]}</script>
</head><body>총 150화 연재중</body></html>`;
const c = S.scraperNormalizeFromHtml(C, "https://series.naver.com/novel/detail.series?productNo=1");
eq("C.title(@graph 안 Book)", c.title, "그래프북");
eq("C.author(문자열)", c.author, "김작가");
eq("C.coverUrl(image 객체)", c.coverUrl, "https://x/c.png");
eq("C.totalEpisodes(numberOfPages)", c.totalEpisodes, 150);

// ── ② 실측 차단 픽스처 판별(scraper-fixtures, 이 세션 egress로 직접 받음) ──────
const fx = (f) => fs.readFileSync(path.join(__dirname, "scraper-fixtures", f), "utf8");
const np = S.scraperDetectBlock(403, fx("novelpia-403-awselb.html"));
eq("노벨피아 403(nginx) → forbidden", { blocked: np.blocked, kind: np.kind }, { blocked: true, kind: "forbidden" });
const mp = S.scraperDetectBlock(403, fx("munpia-cf-challenge.html"));
eq("문피아 CF 챌린지 → challenge", { blocked: mp.blocked, kind: mp.kind }, { blocked: true, kind: "challenge" });
eq("정상 200 페이지 → 차단 아님", S.scraperDetectBlock(200, A).blocked, false);
eq("429 → ratelimit", S.scraperDetectBlock(429, "").kind, "ratelimit");

// ── ③ 플랫폼 판별 ────────────────────────────────────────────────────────────
eq("detect novelpia", S.detectPlatformFromUrl("https://novelpia.com/novel/1"), "노벨피아");
eq("detect munpia", S.detectPlatformFromUrl("https://www.munpia.com/novel/2"), "문피아");
eq("detect naver", S.detectPlatformFromUrl("https://series.naver.com/novel/detail.series?productNo=1"), "네이버시리즈");
eq("detect ridi", S.detectPlatformFromUrl("https://ridibooks.com/books/123"), "리디");
eq("detect kakao", S.detectPlatformFromUrl("https://page.kakao.com/content/123"), "카카오페이지");
eq("detect unknown→null", S.detectPlatformFromUrl("https://example.com/x"), null);

// ── 헤더 강화 확인 ───────────────────────────────────────────────────────────
truthy("SCRAPER_HEADERS sec-ch-ua 존재", S.SCRAPER_HEADERS["sec-ch-ua"]);
truthy("SCRAPER_HEADERS Sec-Fetch-Mode 존재", S.SCRAPER_HEADERS["Sec-Fetch-Mode"]);

// ── ④ 실측 라이브 픽스처(카카오페이지·리디, 이 세션 egress로 직접 캡처) ────────────
//   엔진+정밀화가 실제 페이지에서 제목·작가·장르·완결·회차·검색 후보를 바르게 뽑는지 회귀.
//   (fixtures는 실제 페이지의 head meta + JSON-LD + __NEXT_DATA__를 보존한 축약본 — docs/scraper-plan.md §11.1B)
const refine = (html, url) => { const m = S.scraperNormalizeFromHtml(html, url); return S.scraperRefineByPlatform(m, html, m.platform); };

const kk = refine(fx("kakao-novel-heukbaekmuje.html"), "https://page.kakao.com/content/56598258");
eq("카카오 제목(흑백무제, Organization 폴백 버그 회귀)", kk.title, "흑백무제");
eq("카카오 작가(현임, meta author)", kk.author, "현임");
eq("카카오 장르(무협, __NEXT_DATA__ subcategory)", kk.genres, ["무협"]);
eq("카카오 완결(onIssue=End, 웹툰화 노드와 seriesId로 분리)", kk.workStatus, "completed");
truthy("카카오 표지 URL", kk.coverUrl);

const rd = refine(fx("ridi-book-wiki.html"), "https://ridibooks.com/books/425094972");
eq("리디 제목", rd.title, "위키 쓰는 용사");
eq("리디 작가(JSON-LD Person)", rd.author, "로드워리어");
eq("리디 장르", rd.genres, ["퓨전 판타지"]);
eq("리디 완결", rd.workStatus, "completed");
eq("리디 회차(총 260화)", rd.totalEpisodes, 260);

const sr = S.parseRidiSearch(fx("ridi-search-yongsa.html"));
truthy("리디 검색 후보 ≥1개", sr.length >= 1);
truthy("리디 후보 url=/books/{id}", /ridibooks\.com\/books\/\d+/.test(sr[0] && sr[0].url));
truthy("리디 후보 제목 존재", sr[0] && sr[0].title);
eq("리디 후보 플랫폼 라벨", sr[0] && sr[0].platform, "리디");

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "⚠️  FAILED"}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
