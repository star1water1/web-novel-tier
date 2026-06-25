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
slice += "\n;globalThis.__SCR = { detectPlatformFromUrl, scraperExtractMetaTags, scraperExtractJsonLd, scraperNormalizeFromHtml, scraperRefineByPlatform, scraperDetectBlock, parseRidiSearch, parseNaverSeriesSearch, parseMunpiaSearch, parseNovelpiaSearch, mergeSearchResults, scraperDecodeEntities, scraperExtractHashtags, scraperExtractNextData, mapScrapedGenres, buildScrapeItems, parseNaverUpdateYear, parseNaverUpdateTs, scraperDateToTs, canonicalPlatform, parseMunpiaSearchJson, SCRAPER_HEADERS, SCRAPER_UA };\n";

// fetch/resolveAbortSignal은 정의 시점엔 호출 안 됨(스텁만). 순수 함수만 꺼내 쓴다.
// buildScrapeItems가 슬라이스 밖 parseGenreArray·MAJOR/SUB_GENRES를 참조 → 샌드박스에 주입(실제 동작 동일).
const sandbox = { console, fetch() { throw new Error("no net"); }, resolveAbortSignal: () => ({ signal: undefined, cleanup() {} }) };
sandbox.parseGenreArray = (value) => { if (!value) return []; if (Array.isArray(value)) return value; try { const p = JSON.parse(value); return Array.isArray(p) ? p : [p]; } catch { return value ? [value] : []; } };
sandbox.parsePlatforms = (p) => { try { const a = JSON.parse(p || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } }; // buildScrapeItems가 슬라이스 밖 parsePlatforms 참조
sandbox.MAJOR_GENRES = ["판타지", "무협", "퓨전판타지", "로맨스판타지", "현대판타지", "로맨스", "BL"];
sandbox.SUB_GENRES = ["회귀", "환생", "헌터", "빙의"];
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
eq("리디 줄거리 접두(제목·작품소개:) 제거", rd.synopsis, "다른 놈이 창칼 쓸 때 나는 위키 쓴다....");

const sr = S.parseRidiSearch(fx("ridi-search-yongsa.html"));
truthy("리디 검색 후보 ≥1개", sr.length >= 1);
truthy("리디 후보 url=/books/{id}", /ridibooks\.com\/books\/\d+/.test(sr[0] && sr[0].url));
truthy("리디 후보 제목 존재", sr[0] && sr[0].title);
eq("리디 후보 플랫폼 라벨", sr[0] && sr[0].platform, "리디");

// ── ④' 네이버시리즈 검색 파싱(v7.28.39, 폰 캡처 실측 픽스처) ────────────────────
//   itemList SSR <li class="lst"> 4건 + 클라이언트 템플릿/푸터폼 디코이 → 디코이 제외 4건만.
const ns = S.parseNaverSeriesSearch(fx("naver-series-search.html"));
eq("네이버시리즈 후보 4건(템플릿·푸터 디코이 제외)", ns.length, 4);
eq("네이버시리즈 후보1 제목", ns[0].title, "무적철검");
eq("네이버시리즈 후보1 작가", ns[0].author, "미송검");
eq("네이버시리즈 후보1 장르", ns[0].category, "무협");
eq("네이버시리즈 후보1 url(series.naver.com 절대경로)", ns[0].url, "https://series.naver.com/novel/detail.series?productNo=5445580");
eq("네이버시리즈 후보1 플랫폼 라벨", ns[0].platform, "네이버시리즈");
truthy("네이버시리즈 후보1 표지(comicthumb)", /comicthumb-phinf\.pstatic\.net/.test(ns[0].coverUrl));
eq("네이버시리즈 후보2 장르(판타지)", ns[1].category, "판타지");
eq("네이버시리즈 후보3 CJK·괄호 제목 보존", ns[2].title, "도비검무(刀飛劍務)");
eq("네이버시리즈 후보4 대괄호·공백 제목 보존", ns[3].title, "검중검 [단행본]");
eq("네이버시리즈 전부 소설(isComic=false)", ns.every(x => x.isComic === false), true);
eq("네이버시리즈 productNo 중복 없음", new Set(ns.map(x => x.url)).size, 4);
// 엔티티 디코드
eq("디코드 &amp; → &", S.scraperDecodeEntities("A&amp;B"), "A&B");
eq("디코드 숫자참조 &#39; → '", S.scraperDecodeEntities("it&#39;s"), "it's");

// ── ④''' 노벨피아 검색 파싱(v7.28.42, 폰 캡처 실측 JSON API) ─────────────────────
//   /proc/novel JSON → list[] 매핑. (SPA라 HTML엔 결과 없음 — 내부 API에서 받음)
const nv = S.parseNovelpiaSearch(fx("novelpia-search-hoegwi.json"));
eq("노벨피아 후보 4건", nv.length, 4);
eq("노벨피아 후보1 제목", nv[0].title, "일인칭 빌런 시점");
eq("노벨피아 후보1 작가", nv[0].author, "둥이둥");
eq("노벨피아 후보1 url(/novel/{id})", nv[0].url, "https://novelpia.com/novel/436348");
eq("노벨피아 후보1 표지(// → https:)", nv[0].coverUrl, "https://images.novelpia.com/imagebox/cover/166eca7e88654af412ea592a670efecc_596155_ori.wimg");
eq("노벨피아 후보1 장르(태그 앞 3개)", nv[0].category, "판타지, 하렘, 빙의");
eq("노벨피아 후보1 플랫폼 라벨", nv[0].platform, "노벨피아");
eq("노벨피아 기본표지도 https 보정", nv[1].coverUrl, "https://images.novelpia.com/img/layout/readycover4.png");
eq("노벨피아 후보4 제목(공백·한글)", nv[3].title, "나를 죽인 성기사의 몸으로 회귀했다");
eq("노벨피아 전부 소설(isComic=false)", nv.every(x => x.isComic === false), true);
eq("노벨피아 id 중복 없음(4건)", new Set(nv.map(x => x.url)).size, 4);
eq("노벨피아 status≠200/깨진 JSON → 빈 배열", S.parseNovelpiaSearch('{"status":403}'), []);
eq("노벨피아 비JSON → 빈 배열", S.parseNovelpiaSearch('<html>not json</html>'), []);
// 노벨피아 후보는 상세 재긁기용 meta 동봉(제목/작가/줄거리/완결/회차/장르)
truthy("노벨피아 후보에 meta 동봉", nv[0].meta && nv[0].meta.title === "일인칭 빌런 시점");
eq("노벨피아 meta 작가(검색 API 값)", nv[0].meta.author, "둥이둥");
eq("노벨피아 meta 줄거리", nv[0].meta.synopsis, "나는 이 세계의 비극을 일으킨다.");
eq("노벨피아 meta 장르(전체 배열)", nv[0].meta.genres.length, 10);
eq("노벨피아 meta 연재상태(is_complete=0→ongoing)", nv[0].meta.workStatus, "ongoing");
eq("노벨피아 meta 회차(count_book=2)", nv[0].meta.totalEpisodes, 2);
eq("노벨피아 meta 회차 0이면 null", nv[1].meta.totalEpisodes, null);

// ── ④'''' 검색 결과 병합(v7.28.43) — 관련도 정렬 + 플랫폼 균형 + 리디 노이즈 후순위 ──
const mLists = [
  [ { title: "회귀수선전(回歸修仙傳)", platform: "네이버시리즈", isComic: false }, { title: "무적철검", platform: "네이버시리즈", isComic: false } ],
  [ { title: "복원수선전 1화", platform: "리디", isComic: false }, { title: "헌터 수선전 1화", platform: "리디", isComic: false } ], // 부분매칭 노이즈
  [ { title: "회귀수선전(回歸修仙傳)", platform: "문피아", isComic: false } ],
  [ { title: "회귀수선전 외전", platform: "노벨피아", isComic: false } ],
];
const mg = S.mergeSearchResults(mLists, "회귀수선전");
eq("병합 총 6건", mg.length, 6);
truthy("병합 1위는 회귀수선전 관련(정확/시작 일치)", /회귀수선전/.test(mg[0].title));
truthy("리디 부분매칭 노이즈는 시리즈/문피아/노벨 뒤로", mg.findIndex(x => x.platform === "리디") > mg.findIndex(x => x.platform === "네이버시리즈"));
truthy("상위 3건은 모두 회귀수선전 관련(시리즈·문피아·노벨 골고루)", mg.slice(0, 3).every(x => /회귀수선전/.test(x.title)));
eq("상위 3건 플랫폼 골고루(중복 없이 3종)", new Set(mg.slice(0, 3).map(x => x.platform)).size, 3);
eq("perPlatform 상한 적용", S.mergeSearchResults([Array.from({length: 30}, (_, i) => ({ title: "회귀수선전 " + i, platform: "리디", isComic: false }))], "회귀수선전", { perPlatform: 12 }).length, 12);

// ── ④'' 문피아 검색 파싱(v7.28.40, 폰 캡처 실측 픽스처) ─────────────────────────
//   <ul id=list_ul> 서버렌더 4건 + 하단 JS 렌더 템플릿 디코이 → 디코이 제외 4건만.
const ms = S.parseMunpiaSearch(fx("munpia-search-hoegwi.html"));
eq("문피아 후보 4건(JS 렌더 템플릿 디코이 제외)", ms.length, 4);
eq("문피아 후보1 제목(complete 배지 통째 제거)", ms[0].title, "회귀수선전(回歸修仙傳)");
eq("문피아 후보1 작가(첫 구분선 앞)", ms[0].author, "엄청난");
eq("문피아 후보1 장르", ms[0].category, "무협, 퓨전");
eq("문피아 후보1 url(mm 도메인 menu=novel&id)", ms[0].url, "https://mm.munpia.com/?menu=novel&id=346981&renewal2=TRUE");
eq("문피아 후보1 플랫폼 라벨", ms[0].platform, "문피아");
truthy("문피아 후보1 표지(// → https 보정)", /^https:\/\/cdn1\.munpia\.com\//.test(ms[0].coverUrl));
eq("문피아 후보3 배지 없는 제목 보존", ms[2].title, "회귀했는데 세상이 안 망함");
eq("문피아 후보3 작가 특수문자(仙宇) 보존", ms[2].author, "선우(仙宇)");
eq("문피아 후보4 작가 ™ 보존", ms[3].author, "소라게™");
eq("문피아 전부 소설(isComic=false)", ms.every(x => x.isComic === false), true);
// v7.28.57: 완결작 완결연도(작가줄 끝 날짜=최근 연재일=완결 시점) / 연재중은 null / 시작연도는 검색에 없음
eq("문피아 후보1 완결연도(완결·2025-12-31)", ms[0].meta.endYear, 2025);
eq("문피아 후보3 완결연도 null(연재중)", ms[2].meta.endYear, null);
eq("문피아 후보4 완결연도(완결·2020-08-21)", ms[3].meta.endYear, 2020);
eq("문피아 시작연도는 미제공(null)", ms[0].meta.startYear, null);
// v7.28.58: 문피아 AJAX JSON 파서 — 시작연도(nvTimeReg)+완결연도(nvTimeUpdate 역타임스탬프) 실측 검증
const mj = S.parseMunpiaSearchJson(fx("munpia-search-ajax-hoegwi.json"));
eq("문피아 JSON 3건", mj.length, 3);
eq("문피아 JSON 후보1 제목", mj[0].title, "회귀수선전(回歸修仙傳)");
eq("문피아 JSON 후보1 시작연도(nvTimeReg 2023)", mj[0].meta.startYear, 2023);
eq("문피아 JSON 후보1 완결연도(역타임스탬프 2025)", mj[0].meta.endYear, 2025);
eq("문피아 JSON 후보1 완결상태", mj[0].meta.workStatus, "completed");
eq("문피아 JSON 후보2 시작연도(2017)", mj[1].meta.startYear, 2017);
eq("문피아 JSON 후보2 완결연도(2018)", mj[1].meta.endYear, 2018);
eq("문피아 JSON 후보3 연재중(nvOptFinish=0) → endYear null", mj[2].meta.endYear, null);
eq("문피아 JSON 후보3 시작연도(2024)", mj[2].meta.startYear, 2024);
eq("문피아 JSON 후보3 연재중 상태", mj[2].meta.workStatus, "ongoing");
truthy("문피아 JSON 표지(cdn1+tb.jpg)", /^https:\/\/cdn1\.munpia\.com\/.*tb\.jpg$/.test(mj[1].meta.coverUrl));
eq("문피아 JSON 회차수(863)", mj[0].meta.totalEpisodes, 863);
// v7.28.61: 완결일(ms) + 연중(dropped) + 날짜 헬퍼
eq("문피아 JSON 후보1 완결일(역타임스탬프 ms)", mj[0].meta.completedAt, (10000000000 - 8232824800) * 1000);
eq("문피아 JSON 후보3 연재중 → 완결일 0", mj[2].meta.completedAt, 0);
truthy("scraperDateToTs YYYY.MM.DD → 2019", new Date(S.scraperDateToTs("2019.07.03")).getUTCFullYear() === 2019);
truthy("scraperDateToTs YYYY-MM-DD HH:MM → 2018", new Date(S.scraperDateToTs("2018-01-29 10:00:00")).getUTCFullYear() === 2018);
eq("scraperDateToTs 잘못된 값 → 0", S.scraperDateToTs("없음"), 0);
truthy("parseNaverUpdateTs dt/dd → 2019", new Date(S.parseNaverUpdateTs('<dt>업데이트</dt><dd>2019.07.03.</dd>')).getUTCFullYear() === 2019);
eq("parseNaverUpdateTs 없으면 0", S.parseNaverUpdateTs('<dl></dl>'), 0);
// 문피아 연중(nvOptDiscontinued>0, nvOptFinish=0) → dropped
const mjDisc = S.parseMunpiaSearchJson(JSON.stringify({ list: [{ nvSrl: "1", nvTitle: "연중작", nvAuthor: "A", nvNgCode: "pl.serial", genreStr: "판타지", nvSumEntry: "100", nvTimeReg: "1483930800", nvTimeUpdate: "8483668900", nvOptFinish: "0", nvOptDiscontinued: "1600000000", nvOptAdult: "" }] }));
eq("문피아 JSON 연중작 → dropped(연중)", mjDisc[0].meta.workStatus, "dropped");
eq("문피아 JSON 연중작 완결일 0", mjDisc[0].meta.completedAt, 0);
eq("문피아 id 중복 없음(4건)", new Set(ms.map(x => x.url)).size, 4);
// 검색 SSR 메타 동봉(상세 재긁기 생략) — 줄거리/완결/회차/장르
truthy("문피아 후보에 meta 동봉", ms[0].meta && ms[0].meta.title === "회귀수선전(回歸修仙傳)");
truthy("문피아 meta 줄거리(작품소개)", /워크샵/.test(ms[0].meta.synopsis));
eq("문피아 meta 완결(complete 배지)", ms[0].meta.workStatus, "completed");
eq("문피아 meta 회차(총 863화)", ms[0].meta.totalEpisodes, 863);
eq("문피아 meta 장르 분리(무협/퓨전)", ms[0].meta.genres, ["무협", "퓨전"]);
eq("문피아 배지 없는 작품은 ongoing", ms[2].meta.workStatus, "ongoing");

// ── ⑤ 장르 매핑(v7.28.30) — 플랫폼 장르 → 앱 어휘 + 확인 모달 항목 ──────────────
eq("장르 매핑: 공백 정규화(퓨전 판타지→퓨전판타지)", S.mapScrapedGenres(["퓨전 판타지"], ["퓨전판타지", "무협"], ["회귀"]).major, ["퓨전판타지"]);
eq("장르 매핑: 대분류 정확", S.mapScrapedGenres(["무협"], ["무협", "판타지"], ["회귀"]), { major: ["무협"], sub: [], tags: [] });
eq("장르 매핑: 부장르 분류", S.mapScrapedGenres(["회귀"], ["무협"], ["회귀", "환생"]), { major: [], sub: ["회귀"], tags: [] });
eq("장르 매핑: 미매칭→일반 태그(v7.28.45)", S.mapScrapedGenres(["듣보장르"], ["무협"], ["회귀"]).tags, ["듣보장르"]);
eq("장르 매핑: 미매칭은 대장르에 안 넣음", S.mapScrapedGenres(["듣보장르"], ["무협"], ["회귀"]).major, []);
const giNew = S.buildScrapeItems({ title: "T", genres: ["무협", "회귀"] }, { major_genre: "[]", sub_genre: "[]" });
const mjItem = giNew.find(it => it.key === "major_genre");
const sbItem = giNew.find(it => it.key === "sub_genre");
truthy("buildScrapeItems 대장르 항목(value=[무협], 빈칸→체크)", mjItem && JSON.stringify(mjItem.value) === JSON.stringify(["무협"]) && mjItem.checked === true);
truthy("buildScrapeItems 부장르 항목(value=[회귀])", sbItem && JSON.stringify(sbItem.value) === JSON.stringify(["회귀"]));
truthy("buildScrapeItems 이미 있는 장르는 항목 제외", !S.buildScrapeItems({ title: "T", genres: ["무협"] }, { major_genre: '["무협"]' }).find(it => it.key === "major_genre"));
// v7.28.45: 미매칭 키워드 → 태그 항목, 연재 연도 항목
const giTag = S.buildScrapeItems({ title: "T", genres: ["판타지", "하렘", "집착"], startYear: 2024, endYear: 0 }, {});
truthy("buildScrapeItems 태그 항목(미매칭 키워드 하렘/집착)", (() => { const t = giTag.find(it => it.key === "tags"); return t && /하렘/.test(t.value) && /집착/.test(t.value); })());
truthy("buildScrapeItems 판타지는 대장르(태그 아님)", (() => { const t = giTag.find(it => it.key === "tags"); return t && !/판타지/.test(t.value); })());
truthy("buildScrapeItems 시작연도 항목(2024)", (() => { const y = giTag.find(it => it.key === "start_year"); return y && Number(y.value) === 2024; })());
truthy("buildScrapeItems 종료연도 0이면 항목 없음", !giTag.find(it => it.key === "end_year"));
truthy("buildScrapeItems 태그 이미 있으면 추가분만/없으면 제외", !S.buildScrapeItems({ title: "T", genres: ["하렘"] }, { tags: "하렘" }).find(it => it.key === "tags"));
eq("노벨피아 meta 시작연도(start 0000→reg 2026)", nv[0].meta.startYear, 2026);
eq("노벨피아 meta 종료연도(미완결→null)", nv[0].meta.endYear, null);
eq("노벨피아 비성인(15세)은 ageTag null", nv[0].meta.ageTag, null);
// === 전면 검수(v7.28.49): 실측 검색 메타 → buildScrapeItems가 태그·연도·링크·연재처 항목을 실제로 만드는가 ===
{
  const npI = S.buildScrapeItems(nv[0].meta, {}); // 노벨피아 검색 후보 메타(신규 등록 가정)
  truthy("[검수] 노벨피아 검색메타 → 태그 항목 생성", npI.some(i => i.key === "tags"));
  truthy("[검수] 노벨피아 검색메타 → 시작연도 항목(2026)", npI.some(i => i.key === "start_year" && Number(i.value) === 2026));
  truthy("[검수] 노벨피아 검색메타 → 대장르 항목", npI.some(i => i.key === "major_genre"));
  truthy("[검수] 노벨피아 검색메타 → 작품링크 항목", npI.some(i => i.key === "link"));
  truthy("[검수] 노벨피아 검색메타 → 연재처 항목", npI.some(i => i.key === "platforms"));
  const mpI = S.buildScrapeItems(ms[0].meta, {}); // 문피아 검색 후보 메타
  truthy("[검수] 문피아 검색메타 → 태그 항목 생성", mpI.some(i => i.key === "tags"));
  truthy("[검수] 문피아 검색메타 → 연재처 항목", mpI.some(i => i.key === "platforms"));
  truthy("[검수] 문피아 검색메타 → 시작연도 항목 없음(검색에 연도 데이터 없음)", !mpI.some(i => i.key === "start_year"));
}
// === v7.28.49: 줄거리 #해시태그 추출 → 태그 보강(노벨피아·문피아 작품소개) ===
eq("해시태그 추출(중복 제거·순서)", S.scraperExtractHashtags("줄거리 #회귀 #헌터물 #회귀!"), ["회귀", "헌터물"]);
eq("해시태그 없으면 빈 배열", S.scraperExtractHashtags("해시태그 없는 평범한 줄거리"), []);
truthy("줄거리 #해시태그 → 소재성(회귀)은 부장르로", (() => { const it = S.buildScrapeItems({ title: "T", genres: [], synopsis: "내용 #회귀 #겜천재" }, {}); const s = it.find(i => i.key === "sub_genre"); return s && /회귀/.test(s.display); })());
truthy("줄거리 #해시태그 → 그 외(겜천재)는 일반 태그로", (() => { const it = S.buildScrapeItems({ title: "T", genres: [], synopsis: "내용 #회귀 #겜천재" }, {}); const t = it.find(i => i.key === "tags"); return t && /겜천재/.test(t.value); })());
truthy("buildScrapeItems 연령등급(19금)을 태그로", (() => { const t = S.buildScrapeItems({ title: "T", genres: ["판타지"], ageTag: "19금" }, {}).find(it => it.key === "tags"); return t && /19금/.test(t.value); })());
// v7.28.46: 작품 링크·연재처 항목
const giLP = S.buildScrapeItems({ title: "T", url: "https://novelpia.com/novel/1", platform: "노벨피아" }, {});
truthy("buildScrapeItems 작품링크 항목", (() => { const l = giLP.find(it => it.key === "link"); return l && l.value === "https://novelpia.com/novel/1"; })());
truthy("buildScrapeItems 연재처 항목(노벨피아)", (() => { const p = giLP.find(it => it.key === "platforms"); return p && JSON.stringify(p.value) === JSON.stringify(["노벨피아"]); })());
truthy("buildScrapeItems 동일 링크·연재처면 항목 제외", (() => { const it2 = S.buildScrapeItems({ title: "T", url: "https://x/1", platform: "리디" }, { link: "https://x/1", platforms: ["리디"] }); return !it2.find(i => i.key === "link") && !it2.find(i => i.key === "platforms"); })());
truthy("buildScrapeItems 연재처 병합(기존 리디 + 노벨피아)", (() => { const p = S.buildScrapeItems({ title: "T", platform: "노벨피아" }, { platforms: ["리디"] }).find(it => it.key === "platforms"); return p && JSON.stringify(p.value) === JSON.stringify(["리디", "노벨피아"]); })());

// ── v7.28.55 플랫폼 동의어 정규화 ──────────────────────────────────────────
eq("canonical 네이버시리즈→시리즈", S.canonicalPlatform("네이버시리즈"), "시리즈");
eq("canonical 카카오페이지→카카페", S.canonicalPlatform("카카오페이지"), "카카페");
eq("canonical 리디북스→리디", S.canonicalPlatform("리디북스"), "리디");
eq("canonical 표준명 유지(노벨피아)", S.canonicalPlatform("노벨피아"), "노벨피아");
eq("canonical 모르는 플랫폼 원본 유지", S.canonicalPlatform("브릿G"), "브릿G");
truthy("buildScrapeItems: 스크랩 네이버시리즈 vs 기존 시리즈 → 연재처 항목 없음(동의어)", (() => {
  const it = S.buildScrapeItems({ title: "T", platform: "네이버시리즈" }, { platforms: ["시리즈"] });
  return !it.find(i => i.key === "platforms");
})());
// ── v7.28.56 네이버 완결연도(moreDetail 업데이트일) ─────────────────────────
eq("parseNaverUpdateYear: dt/dd 업데이트 → 연도", S.parseNaverUpdateYear('<dl class="info_v5"><dt>작가</dt><dd>남희성</dd><dt>업데이트</dt><dd>2019.07.03.</dd></dl>'), 2019);
eq("parseNaverUpdateYear: 업데이트 없으면 null", S.parseNaverUpdateYear('<dl><dt>작가</dt><dd>X</dd></dl>'), null);
eq("parseNaverUpdateYear: 범위 밖(1899) → null", S.parseNaverUpdateYear('<dt>업데이트</dt><dd>1899.01.01.</dd>'), null);

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "⚠️  FAILED"}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
