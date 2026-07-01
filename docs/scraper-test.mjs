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
slice += "\n;globalThis.__SCR = { detectPlatformFromUrl, scraperExtractMetaTags, scraperExtractJsonLd, scraperNormalizeFromHtml, scraperRefineByPlatform, scraperDetectBlock, parseRidiSearch, parseNaverSeriesSearch, parseMunpiaSearch, parseNovelpiaSearch, parseNovelpiaGetNovel, novelpiaItemToMeta, mergeSearchResults, SEARCH_PLATFORMS, isSearchPlatformOn, scraperDecodeEntities, scraperCleanSynopsis, scraperExtractHashtags, scraperExtractNextData, mapScrapedGenres, buildScrapeItems, parseNaverUpdateYear, parseNaverUpdateTs, scraperDateToTs, canonicalPlatform, mergePlatformFromLink, parseMunpiaSearchJson, parseNaverStartYear, ridiBookOf, ridiPublishDate, backfillMetaFromCandidate, isGaidenTitle, parseNaverEpisodeSplit, splitEpisodesByGaiden, parseNovelpiaEpisodeList, parseRidiSearchSeries, pickRidiGaidenSeries, applyEpisodeSplitToMeta, parseKakaoProductList, parseKakaoViewerDate, parseKakaoOverview, kakaoSeriesIdFromUrl, parseMunpiaEntries, parseMunpiaNovelInfo, munpiaIdFromUrl, SCRAPER_HEADERS, SCRAPER_UA, parseNaverWebtoonSearch, extractNaverWebtoonItems, naverWebtoonItemToMeta, WEBTOON_SEARCH_PLATFORMS, naverNormalizeDate, naverDate2ToYear, parseNaverWebtoonStartYear, coverUrlHighRes, isImplausibleEpisodeDrop, parseKakaoWebtoonSearch, kakaoWebtoonDetailToMeta, kakaoAuthorsSplit, naverPublishDayLabel, parseKakaoWebtoonEpisodeCount };\n";

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

// ── 🎨 네이버웹툰 검색 파서(실캡처 — comic.naver.com/api/search/all?keyword=화산귀환) ──
const nwReal = S.parseNaverWebtoonSearch(fx("naver-webtoon-search-hwasan.json"));
eq("웹툰 검색 후보 1건(웹툰 버킷만, nbooks 소설/단행본 제외)", nwReal.length, 1);
eq("웹툰 후보 제목", nwReal[0].title, "화산귀환");
eq("웹툰 후보 isComic=true", nwReal[0].isComic, true);
eq("웹툰 후보 platform", nwReal[0].platform, "네이버웹툰");
eq("웹툰 후보 url(titleId=769209)", nwReal[0].url, "https://comic.naver.com/webtoon/list?titleId=769209");
eq("웹툰 후보 meta 첨부(재fetch 불필요)", !!(nwReal[0].meta && nwReal[0].meta.ok), true);
eq("웹툰 글작가(ARTIST_WRITER)", nwReal[0].meta.author, "ARCHE, LICO");
eq("웹툰 그림작가(글=그림 동일 → 생략)", nwReal[0].meta.artist, "");
eq("웹툰 회차(articleTotalCount=175)", nwReal[0].meta.totalEpisodes, 175);
eq("웹툰 연재상태(finished=false→연재중)", nwReal[0].meta.workStatus, "ongoing");
truthy("웹툰 표지 https", String(nwReal[0].meta.coverUrl).startsWith("https://"));
truthy("웹툰 장르에 무협/사극", nwReal[0].meta.genres.includes("무협/사극"));
truthy("웹툰 태그에 회귀", nwReal[0].meta.genres.includes("회귀"));
truthy("웹툰 태그에 먼치킨", nwReal[0].meta.genres.includes("먼치킨"));
truthy("웹툰 태그에 소설원작", nwReal[0].meta.genres.includes("소설원작"));
eq("웹툰 연령(nineteen=false→null)", nwReal[0].meta.ageTag, null);
eq("웹툰 검색 플랫폼 목록", S.WEBTOON_SEARCH_PLATFORMS, ["네이버웹툰", "카카오웹툰"]);

// ── 🎨 v7.56.2 네이버웹툰 연재연도(시작/종료) ──
// 날짜 정규화/연도 추출: 2자리 연("26.06.30")·4자리 연 모두 수용
eq("naverNormalizeDate 2자리연 → 4자리", S.naverNormalizeDate("26.06.30"), "2026.06.30");
eq("naverNormalizeDate 4자리연 그대로", S.naverNormalizeDate("2021.5.3"), "2021.5.3");
eq("naverNormalizeDate 비날짜 → 빈문자열", S.naverNormalizeDate("연재중"), "");
eq("naverDate2ToYear 2자리연", S.naverDate2ToYear("26.06.30"), 2026);
eq("naverDate2ToYear 4자리연", S.naverDate2ToYear("2021.05.30"), 2021);
eq("naverDate2ToYear 비날짜 → null", S.naverDate2ToYear("미정"), null);
// 검색응답=마지막화라 startYear는 항상 null(선택 시 회차목록으로 보강); 진행중 작품은 endYear도 null
eq("진행중 웹툰 startYear=null(검색단계)", nwReal[0].meta.startYear, null);
eq("진행중 웹툰 endYear=null(완결 아님)", nwReal[0].meta.endYear, null);
eq("진행중 웹툰 completedAt=0", nwReal[0].meta.completedAt, 0);
// 완결작 합성: finished=true → lastArticleServiceDate가 종료연도/완결일
const nwDone = S.naverWebtoonItemToMeta({ titleId: 111, titleName: "완결웹툰", finished: true, lastArticleServiceDate: "23.11.02", articleTotalCount: 80 });
eq("완결 웹툰 endYear(lastArticleServiceDate→2023)", nwDone.endYear, 2023);
eq("완결 웹툰 workStatus=completed", nwDone.workStatus, "completed");
truthy("완결 웹툰 completedAt(ms>0)", nwDone.completedAt > 0);
eq("완결 웹툰 completedAt=UTC 2023-11-02", nwDone.completedAt, Date.UTC(2023, 10, 2));
// 시작연도 파서: ① article/list JSON(articleList[0] 날짜 필드) ② 날짜패턴 스캔 폴백
const alJson = JSON.stringify({ titleId: 769209, articleList: [{ no: 1, serviceDateDescription: "20.07.27" }, { no: 2, serviceDateDescription: "20.08.03" }] });
eq("startYear 파서 JSON(articleList[0].serviceDateDescription→2020)", S.parseNaverWebtoonStartYear(alJson), 2020);
const alJson2 = JSON.stringify({ articleList: [{ no: 1, serviceDate: "2018.01.05" }] });
eq("startYear 파서 JSON(serviceDate 4자리연→2018)", S.parseNaverWebtoonStartYear(alJson2), 2018);
const alScan = `<ul><li><span class="date">19.03.14</span></li><li><span class="date">19.03.21</span></li></ul>`;
eq("startYear 파서 날짜스캔 폴백(첫 날짜→2019)", S.parseNaverWebtoonStartYear(alScan), 2019);
eq("startYear 파서 날짜 없음 → null", S.parseNaverWebtoonStartYear("{\"articleList\":[]}"), null);

// ── 🎨 v7.57.1 웹툰 메타 보강: 연재요일(네이버 publishDescription) ──
eq("연재요일 수요웹툰→수", S.naverPublishDayLabel("수요웹툰"), "수");
eq("연재요일 월요웹툰→월", S.naverPublishDayLabel("월요웹툰"), "월");
eq("연재요일 완결웹툰→''(요일 아님)", S.naverPublishDayLabel("완결웹툰"), "");
eq("연재요일 매일+→매일", S.naverPublishDayLabel("매일+"), "매일");
eq("연재요일 요일무관→자유", S.naverPublishDayLabel("요일무관"), "자유");
eq("연재요일 빈값→''", S.naverPublishDayLabel(""), "");
// 실 픽스처(화산귀환)=수요웹툰 → meta.publishDay="수"
eq("네이버 웹툰 meta.publishDay(수요웹툰→수)", nwReal[0].meta.publishDay, "수");
eq("완결 웹툰 meta.publishDay=''(publishDescription 없음)", nwDone.publishDay, "");

// ── 🎨 v7.57.0 카카오웹툰 (실캡처 — gateway-kw.kakao.com) ──
// 검색(search/v1/content): 후보 파싱(meta 미첨부 → pick 시 상세 재fetch)
const kwSearch = S.parseKakaoWebtoonSearch(fx("kakao-webtoon-search-solo.json"));
truthy("카카오웹툰 검색 후보 ≥1", kwSearch.length >= 1);
eq("카카오웹툰 후보 제목", kwSearch[0].title, "나 혼자만 레벨업");
eq("카카오웹툰 후보 platform", kwSearch[0].platform, "카카오웹툰");
eq("카카오웹툰 후보 isComic", kwSearch[0].isComic, true);
truthy("카카오웹툰 후보 url(/content/…/2320)", /\/content\/.+\/2320$/.test(kwSearch[0].url));
eq("카카오웹툰 후보 글작가(AUTHOR)", kwSearch[0].author, "현군");
eq("카카오웹툰 후보 meta 미첨부(상세 재fetch)", kwSearch[0].meta, undefined);
// 작가 역할 분리
const kwAu = S.kakaoAuthorsSplit([{name:"현군",type:"AUTHOR"},{name:"장성락(REDICE STUDIO)",type:"ILLUSTRATOR"},{name:"추공",type:"ORIGINAL_STORY"},{name:"디앤씨",type:"PUBLISHER"}]);
eq("kakaoAuthorsSplit 글작가", kwAu.author, "현군");
eq("kakaoAuthorsSplit 그림작가", kwAu.artist, "장성락(REDICE STUDIO)");
eq("kakaoAuthorsSplit 원작", kwAu.original, "추공");
// 상세(decorator/v2) → 정규화 meta
const kwDetail = S.kakaoWebtoonDetailToMeta(JSON.parse(fx("kakao-webtoon-detail-2320.json")).data);
eq("카카오웹툰 상세 제목", kwDetail.title, "나 혼자만 레벨업");
eq("카카오웹툰 상세 글작가", kwDetail.author, "현군");
eq("카카오웹툰 상세 그림작가", kwDetail.artist, "장성락(REDICE STUDIO)");
eq("카카오웹툰 상세 완결(badges COMPLETED)", kwDetail.workStatus, "completed");
truthy("카카오웹툰 상세 장르 학원", kwDetail.genres.includes("학원"));
truthy("카카오웹툰 상세 장르 판타지", kwDetail.genres.includes("판타지"));
truthy("카카오웹툰 상세 원작있음(ORIGINAL_STORY)", kwDetail.genres.includes("원작있음"));
truthy("카카오웹툰 상세 표지 https", String(kwDetail.coverUrl).startsWith("https://"));
eq("카카오웹툰 상세 연령(adult=false→null)", kwDetail.ageTag, null);
eq("카카오웹툰 상세 platform", kwDetail.platform, "카카오웹툰");
// 🎨 v7.57.1: 인기지표(statistics) 캡처
eq("카카오웹툰 상세 조회수(viewCount)", kwDetail.viewCount, 206297989);
eq("카카오웹툰 상세 좋아요(likeCount)", kwDetail.likeCount, 6774525);
eq("카카오웹툰 상세 연재요일 없음(publishDay undefined)", kwDetail.publishDay, undefined);
// statistics 누락 방어 → 0
const kwNoStat = S.kakaoWebtoonDetailToMeta({ id: 9, title: "무통계", authors: [] });
eq("카카오웹툰 statistics 없음→viewCount 0", kwNoStat.viewCount, 0);
eq("카카오웹툰 statistics 없음→likeCount 0", kwNoStat.likeCount, 0);
// 🆕 v7.57.2: 회차수 파서(실응답 미확인 → 다중 shape 방어). 세션 WebView가 가로챈 episodes 응답 대응.
const kep = S.parseKakaoWebtoonEpisodeCount;
eq("회차수: 명시 totalCount", kep({ data: { meta: { pagination: { totalCount: 179 } }, episodes: [{ episodeId: "a", no: 1 }] } }), 179);
eq("회차수: 배열 최대 no", kep({ data: { episodes: [{ no: 1 }, { no: 2 }, { no: 3 }] } }), 3);
eq("회차수: episodeNumber 최대", kep({ episodes: [{ episodeNumber: 5 }, { episodeNumber: 12 }, { episodeNumber: 8 }] }), 12);
eq("회차수: 문자열 JSON 입력", kep(JSON.stringify({ data: { episodes: [{ seq: 1 }, { seq: 2 }] } })), 2);
eq("회차수: episodeCount 필드", kep({ data: { content: { episodeCount: 84 } } }), 84);
eq("회차수: 비회차 객체 → null", kep({ foo: { bar: 1 }, baz: [{ x: 1 }] }), null);
eq("회차수: 빈/이상 입력 → null", kep(""), null);
eq("detect 카카오웹툰 URL", S.detectPlatformFromUrl("https://webtoon.kakao.com/content/x/2320"), "카카오웹툰");
eq("detect 카카오페이지 URL(구분)", S.detectPlatformFromUrl("https://page.kakao.com/content/123"), "카카오페이지");

// ── 🎨 v7.56.4 표지 고화질 변형(coverUrlHighRes) — 실측 픽스처 URL 패턴 기반 ──
const cov = S.coverUrlHighRes;
// 리디: /small|/large → /xxlarge (프래그먼트 보존)
eq("리디 small→xxlarge", cov("https://img.ridicdn.net/cover/3010023188/small"), "https://img.ridicdn.net/cover/3010023188/xxlarge");
eq("리디 large→xxlarge(#1 보존)", cov("https://img.ridicdn.net/cover/3010023341/large#1"), "https://img.ridicdn.net/cover/3010023341/xxlarge#1");
eq("리디 이미 xxlarge → 무변", cov("https://img.ridicdn.net/cover/425094972/xxlarge"), "https://img.ridicdn.net/cover/425094972/xxlarge");
// 카카오: filename=th3(썸네일) → o1(원본)
eq("카카오 th3→o1", cov("https://dn-img-page.kakao.com/download/resource?kid=bi9ttf/hyQ9UNBPyp/K0RMFa5KOkjh0BlXNfHkVK&filename=th3"), "https://dn-img-page.kakao.com/download/resource?kid=bi9ttf/hyQ9UNBPyp/K0RMFa5KOkjh0BlXNfHkVK&filename=o1");
eq("카카오 이미 o1 → 무변", cov("https://dn-img-page.kakao.com/download/resource?kid=me8A4/x/y&filename=o1"), "https://dn-img-page.kakao.com/download/resource?kid=me8A4/x/y&filename=o1");
// 네이버시리즈/스토어 표지: ?type=m128(소형) → m500
eq("네이버 표지 m128→m500", cov("https://bookthumb-phinf.pstatic.net/cover/123/456.jpg?type=m128"), "https://bookthumb-phinf.pstatic.net/cover/123/456.jpg?type=m500");
eq("네이버 표지 이미 큼(m640) → 무변", cov("https://shopping-phinf.pstatic.net/x.jpg?type=m640"), "https://shopping-phinf.pstatic.net/x.jpg?type=m640");
// 네이버웹툰(image-comic)은 더 큰 변형 없음 → 손대지 않음(원본 유지)
eq("네이버웹툰 썸네일 무변(폴백 안전)", cov("https://image-comic.pstatic.net/webtoon/769209/thumbnail/thumbnail_IMAG21_x.jpg"), "https://image-comic.pstatic.net/webtoon/769209/thumbnail/thumbnail_IMAG21_x.jpg");
// 문피아: 끝 tb.jpg 제거(두 패턴) → 원본
eq("문피아 v2 …tb.jpg→.jpg", cov("https://cdn1.munpia.com/v2/files/cover/2024/0115/18/EJptTuR8cAAtb.jpg"), "https://cdn1.munpia.com/v2/files/cover/2024/0115/18/EJptTuR8cAA.jpg");
eq("문피아 구형 .jpgtb.jpg→.jpg", cov("https://cdn1.munpia.com/files/attach/2017/0327/001/sPJ7QhSF6AAvZN3r.jpgtb.jpg"), "https://cdn1.munpia.com/files/attach/2017/0327/001/sPJ7QhSF6AAvZN3r.jpg");
// 비-URL/로컬은 그대로
eq("로컬 file:// 무변", cov("file:///data/cover/x.jpg"), "file:///data/cover/x.jpg");
eq("빈 값 무변", cov(""), "");

// ── 🛡️ v7.56.6 회차수 무결성 (applyEpisodeSplitToMeta 외전≤본편 가드 + isImplausibleEpisodeDrop) ──
// (a) 외전이 본편보다 많음(880/900) → split 불신: 차감 스킵·total 유지·gaidenCount 미설정
{
  const m = S.applyEpisodeSplitToMeta({ totalEpisodes: 900 }, { hasGaiden: true, gaidenCount: 880 });
  eq("외전>본편 → total 유지(900)", m.totalEpisodes, 900);
  eq("외전>본편 → gaidenCount 미설정", m.gaidenCount, undefined);
}
// (b) 정상 외전(30/900) → 본편 차감 적용
{
  const m = S.applyEpisodeSplitToMeta({ totalEpisodes: 900 }, { hasGaiden: true, gaidenCount: 30 });
  eq("정상 외전 → 본편 차감(870)", m.totalEpisodes, 870);
  eq("정상 외전 → gaidenCount 기록(30)", m.gaidenCount, 30);
}
// (c) 경계(gaiden=total*0.5=450, 과반 아님) → 차감 적용
{
  const m = S.applyEpisodeSplitToMeta({ totalEpisodes: 900 }, { hasGaiden: true, gaidenCount: 450 });
  eq("외전=본편 경계(450) → 차감(450)", m.totalEpisodes, 450);
}
// (d) 리디 noTotalAdjust(외전 별도시리즈) → 비율가드 비적용·차감 안 함·gaidenCount 기록
{
  const m = S.applyEpisodeSplitToMeta({ totalEpisodes: 10 }, { hasGaiden: true, gaidenCount: 50 }, { noTotalAdjust: true });
  eq("리디 noTotalAdjust → total 유지(10)", m.totalEpisodes, 10);
  eq("리디 noTotalAdjust → gaidenCount 기록(50)", m.gaidenCount, 50);
}
// isImplausibleEpisodeDrop — 쓰기 경계 하향 가드
eq("급감 차단 900→7", S.isImplausibleEpisodeDrop(900, 7), true);
eq("성장 허용 7→900", S.isImplausibleEpisodeDrop(7, 900), false);
eq("소폭 정정 허용 900→880", S.isImplausibleEpisodeDrop(900, 880), false);
eq("소량작품 무가드 10→3(cur<20)", S.isImplausibleEpisodeDrop(10, 3), false);
eq("반토막 경계 900→450 허용", S.isImplausibleEpisodeDrop(900, 450), false);
eq("반토막 직하 900→449 차단", S.isImplausibleEpisodeDrop(900, 449), true);
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
// 🆕 v7.37.0: 줄거리는 본편 content.description(전체 본문, 줄바꿈 보존)에서, 시작연도는 startSaleDt에서 —
//   같은 페이지의 웹툰화 노드(전란…/2024)에 덮이지 않고 주소 content id(56598258)의 본편을 정확히 집는다.
truthy("카카오 줄거리=본편 description(웹툰판 '전란…' 아님)", kk.synopsis && kk.synopsis.startsWith("최초로 흑도를 통합한 흑도대종사"));
truthy("카카오 줄거리 줄바꿈(\\n) 보존", /\n/.test(kk.synopsis));
eq("카카오 연재 시작연도(본편 startSaleDt 2021, 웹툰 2024 아님)", kk.startYear, 2021);

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

// ── ④'' 노벨피아 단건 상세 API get_novel(v7.38.0) — 성인물(19금) 비로그인 취득 ─────
//   검색 API와 동일 스키마. 19금은 제목/작가/장르/줄거리/연/회차 다 오고 표지만 게이트(플레이스홀더).
const npAdult = JSON.stringify({ status: 200, code: "0000", novel: {
  novel_no: 397834, novel_name: "19금 음지 버튜버 양지에 데뷔함.", novel_age: 19,
  writer_nick: "백발성애자", novel_genre_arr: ["현대", "라이트노벨", "하렘", "버튜버", "고수위"],
  novel_story: "19금 음지 방송하던 버튜버인 내가.\r\n\r\n시청자의 말에 양지로.", is_complete: 1, count_book: 122,
  start_date: "2025-12-07 19:12:11", complete_date: "2026-04-09 23:41:55",
  cover_img: "//images.novelpia.com/img/novel/adult_cover_img.jpg", novel_img: "//images.novelpia.com/img/novel/adult_cover_img.jpg",
} });
const na = S.parseNovelpiaGetNovel(npAdult, "https://novelpia.com/novel/397834");
eq("노벨피아 19금 제목(사이트명 접두 없음)", na.title, "19금 음지 버튜버 양지에 데뷔함.");
eq("노벨피아 19금 작가(og 'Devlife' 더미 아님)", na.author, "백발성애자");
eq("노벨피아 19금 장르 배열", na.genres, ["현대", "라이트노벨", "하렘", "버튜버", "고수위"]);
eq("노벨피아 19금 → 19금 태그", na.ageTag, "19금");
eq("노벨피아 19금 완결/회차", { s: na.workStatus, ep: na.totalEpisodes }, { s: "completed", ep: 122 });
eq("노벨피아 19금 시작·완결연도", { sy: na.startYear, ey: na.endYear }, { sy: 2025, ey: 2026 });
eq("노벨피아 19금 표지=플레이스홀더라 빈칸", na.coverUrl, "");
truthy("노벨피아 19금 줄거리 줄바꿈 보존", /\n/.test(na.synopsis));
eq("노벨피아 단건 url=원본 링크 보존", na.url, "https://novelpia.com/novel/397834");
// 비성인: cover_img 실제 표지 → https 보정, 19금 태그 없음
const npClean = JSON.stringify({ status: 200, novel: {
  novel_no: 434044, novel_name: "마법소녀들에게 사랑받는 바텐더가 되었다", novel_age: 0, writer_nick: "힐링조아",
  novel_genre_arr: ["판타지"], novel_story: "줄거리", is_complete: 0, count_book: 10, start_date: "2024-01-01",
  cover_img: "//images.novelpia.com/imagebox/cover/abc_q_ori.file",
} });
const nc = S.parseNovelpiaGetNovel(npClean, "https://novelpia.com/novel/434044");
eq("노벨피아 비성인 표지 https 보정", nc.coverUrl, "https://images.novelpia.com/imagebox/cover/abc_q_ori.file");
eq("노벨피아 비성인 ageTag 없음/연재중", { a: nc.ageTag, s: nc.workStatus }, { a: null, s: "ongoing" });
eq("노벨피아 get_novel status≠200 → null", S.parseNovelpiaGetNovel(JSON.stringify({ status: 403 }), "x"), null);
eq("노벨피아 get_novel 깨진 JSON → null", S.parseNovelpiaGetNovel("<html>nope", "x"), null);
eq("노벨피아 genres novel_genre 문자열 폴백", S.novelpiaItemToMeta({ novel_no: 1, novel_name: "t", novel_genre: '["로맨스","여사친"]' }).genres, ["로맨스", "여사친"]);

// ── v7.39.0: 제목 검색 사이트 온오프(기본 전체 활성) ───────────────────────────
eq("검색 사이트 목록(검색 가능 4종)", S.SEARCH_PLATFORMS, ["리디", "네이버시리즈", "문피아", "노벨피아"]);
eq("검색 사이트 기본 전체 ON(globalSearchPlatforms null)", S.SEARCH_PLATFORMS.map(S.isSearchPlatformOn), [true, true, true, true]);

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
// === v7.31.2: 줄거리 정제(엔티티 디코드 + 메타 접두 제거) + 엔티티 오태그 방지 ===
truthy("scraperCleanSynopsis: HTML 엔티티 디코드(&lt; &gt; &#039;)", (() => { const c = S.scraperCleanSynopsis("소설 &lt;제목&gt; 이야기 &#039;엑스&#039;"); return c.includes("<제목>") && c.includes("'엑스'") && !/&lt;|&#039;/.test(c); })());
truthy("scraperCleanSynopsis: 메타 접두(N화 완결, #태그, 줄거리:) 제거", (() => { const c = S.scraperCleanSynopsis("225화 완결, #NOVEL, #판타지, 줄거리: 본문 시작"); return c === "본문 시작"; })());
truthy("scraperCleanSynopsis: 메타 접두 아니면 원문 유지(오탐 없음)", (() => { const c = S.scraperCleanSynopsis("그는 학생이었다. 줄거리: 본문 안 단어"); return c.startsWith("그는 학생"); })());
truthy("buildScrapeItems note: 엔티티 디코드 + 접두 제거 반영", (() => { const it = S.buildScrapeItems({ title: "T", synopsis: "120화 연재중, #판타지, 줄거리: 모험 &amp; 성장" }, {}); const n = it.find(i => i.key === "note"); return n && n.value === "모험 & 성장"; })());
truthy("buildScrapeItems 대장르: 엔티티(&#039;) 섞인 줄거리에서도 #판타지→대장르, '039' 오태그 없음", (() => { const it = S.buildScrapeItems({ title: "T", genres: [], synopsis: "#판타지 줄거리 &#039;엑스&#039;" }, {}); const mj = it.find(i => i.key === "major_genre"); const tg = it.find(i => i.key === "tags"); return mj && /판타지/.test(mj.display) && !(tg && /039/.test(tg.value)); })());
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
// ── v7.28.64 링크 플랫폼 → 연재처 자동 병합 ────────────────────────────────
eq("mergePlatformFromLink: 빈 연재처 + 노벨피아 링크 → [노벨피아]",
  JSON.stringify(S.mergePlatformFromLink([], "https://novelpia.com/novel/123")), JSON.stringify(["노벨피아"]));
eq("mergePlatformFromLink: 리디만 있는데 노벨피아 링크 → 추가",
  JSON.stringify(S.mergePlatformFromLink(["리디"], "https://novelpia.com/novel/123")), JSON.stringify(["리디", "노벨피아"]));
eq("mergePlatformFromLink: 네이버시리즈 링크 → 표준명(시리즈)로 추가",
  JSON.stringify(S.mergePlatformFromLink(["리디"], "https://series.naver.com/novel/detail.series?productNo=1")), JSON.stringify(["리디", "시리즈"]));
truthy("mergePlatformFromLink: 이미 시리즈 보유 + 네이버시리즈 링크 → 중복 추가 없음(동의어)",
  S.mergePlatformFromLink(["시리즈"], "https://series.naver.com/novel/detail.series?productNo=1").length === 1);
truthy("mergePlatformFromLink: 이미 노벨피아 보유 + 노벨피아 링크 → 불변",
  S.mergePlatformFromLink(["노벨피아"], "https://novelpia.com/novel/1").length === 1);
eq("mergePlatformFromLink: 지원 안 하는/빈 링크 → 원본 그대로",
  JSON.stringify(S.mergePlatformFromLink(["리디"], "https://example.com/x")), JSON.stringify(["리디"]));
eq("mergePlatformFromLink: 빈 링크 → 원본 그대로",
  JSON.stringify(S.mergePlatformFromLink(["리디"], "")), JSON.stringify(["리디"]));
eq("mergePlatformFromLink: 문피아 링크 → 추가",
  JSON.stringify(S.mergePlatformFromLink([], "https://novel.munpia.com/123")), JSON.stringify(["문피아"]));
truthy("mergePlatformFromLink: 원본 배열 불변(side-effect 없음)", (() => {
  const orig = ["리디"]; S.mergePlatformFromLink(orig, "https://novelpia.com/novel/1"); return orig.length === 1;
})());
// ── v7.28.56 네이버 완결연도(moreDetail 업데이트일) ─────────────────────────
eq("parseNaverUpdateYear: dt/dd 업데이트 → 연도", S.parseNaverUpdateYear('<dl class="info_v5"><dt>작가</dt><dd>남희성</dd><dt>업데이트</dt><dd>2019.07.03.</dd></dl>'), 2019);
eq("parseNaverUpdateYear: 업데이트 없으면 null", S.parseNaverUpdateYear('<dl><dt>작가</dt><dd>X</dd></dl>'), null);
eq("parseNaverUpdateYear: 범위 밖(1899) → null", S.parseNaverUpdateYear('<dt>업데이트</dt><dd>1899.01.01.</dd>'), null);

// ── 🆕 v7.40.1: 네이버 시작연도(회차목록 API) ────────────────────────────────
eq("parseNaverStartYear: ASC 1화 등록일 → 시작연도", S.parseNaverStartYear('{"resultData":[{"lastVolumeUpdateDate":"2018-05-21 00:03:19"}]}'), 2018);
eq("parseNaverStartYear: 화산귀환 2019", S.parseNaverStartYear('{"resultData":[{"volumeName":"序","lastVolumeUpdateDate":"2019-04-25 10:00:00"}]}'), 2019);
eq("parseNaverStartYear: 빈 목록 → null", S.parseNaverStartYear('{"resultData":[]}'), null);
eq("parseNaverStartYear: 날짜 null(미채움 필드) → null", S.parseNaverStartYear('{"resultData":[{"registerDate":null,"lastVolumeUpdateDate":null}]}'), null);
eq("parseNaverStartYear: 비JSON(400 에러페이지) → null", S.parseNaverStartYear('<html>서비스에 접속할 수 없습니다</html>'), null);

// ── 🆕 v7.40.1: 리디 완결일(book-api 마지막 권 출간일) ───────────────────────
eq("ridiBookOf: {book:{…}} 언랩", S.ridiBookOf({ book: { id: 1 } }), { id: 1 });
eq("ridiBookOf: 래퍼 없는 단건 그대로", S.ridiBookOf({ id: 2 }), { id: 2 });
eq("ridiPublishDate: ridibooks_publish(ISO) → 완결연도", S.ridiPublishDate({ ridibooks_publish: "2024-06-12T06:30:01+09:00" }).year, 2024);
eq("ridiPublishDate: 완결일 ts = 해당 날짜 자정(UTC)", S.ridiPublishDate({ ridibooks_publish: "2024-06-12T06:30:01+09:00" }).ts, S.scraperDateToTs("2024-06-12"));
eq("ridiPublishDate: ebook_publish 폴백", S.ridiPublishDate({ ebook_publish: "2018-10-02" }).year, 2018);
eq("ridiPublishDate: 날짜 없음 → {null,0}", S.ridiPublishDate({}), { year: null, ts: 0 });

// ── 🆕 v7.40.1: 카카오페이지 완결일(content.lastSlideAddedDate) ───────────────
{
  const kkNext = '<html><head><meta property="og:title" content="완결웹소설"></head><body>' +
    '<script id="__NEXT_DATA__" type="application/json">' +
    JSON.stringify({ props: { pageProps: { dehydratedState: { node: {
      ogTitle: "완결웹소설",
      seriesId: 777, title: "완결웹소설", authors: "김작가", categoryType: "Novel", subcategory: "판타지",
      onIssue: "End", startSaleDt: "2019-03-01", lastSlideAddedDate: "2022-11-30T09:00:00+09:00",
    } } } } }) + '</script></body></html>';
  const km0 = S.scraperNormalizeFromHtml(kkNext, "https://page.kakao.com/content/777");
  const km = S.scraperRefineByPlatform(km0, kkNext, "카카오페이지");
  eq("카카오: 완결작 endYear = lastSlideAddedDate 연도", km.endYear, 2022);
  eq("카카오: 완결일 ts = lastSlideAddedDate 날짜", km.completedAt, S.scraperDateToTs("2022-11-30"));
  eq("카카오: 시작연도는 startSaleDt 유지", km.startYear, 2019);
}
{
  // 연재중(Ing)이면 lastSlideAddedDate가 있어도 완결일로 쓰지 않음
  const kkIng = '<html><head><meta property="og:title" content="연재중작"></head><body>' +
    '<script id="__NEXT_DATA__" type="application/json">' +
    JSON.stringify({ props: { pageProps: { node: {
      ogTitle: "연재중작", seriesId: 888, title: "연재중작", authors: "이작가", categoryType: "Novel", subcategory: "현대판타지",
      onIssue: "Ing", startSaleDt: "2023-01-01", lastSlideAddedDate: "2024-05-05T09:00:00+09:00",
    } } } }) + '</script></body></html>';
  const im = S.scraperRefineByPlatform(S.scraperNormalizeFromHtml(kkIng, "https://page.kakao.com/content/888"), kkIng, "카카오페이지");
  eq("카카오: 연재중은 완결일 미설정", im.completedAt, 0);
  eq("카카오: 연재중은 endYear null", im.endYear, null);
}

// ── 🆕 v7.40.2: 검색 후보 → 상세 메타 작가/표지 폴백 보강(네이버 작가 누락 해결) ──
eq("backfill: 상세 작가 비면 후보 작가로 채움", S.backfillMetaFromCandidate({ title: "T", author: "", coverUrl: "" }, { author: "남희성", coverUrl: "c.jpg" }), { title: "T", author: "남희성", coverUrl: "c.jpg" });
eq("backfill: 상세 작가 있으면 후보로 덮지 않음", S.backfillMetaFromCandidate({ title: "T", author: "상세작가" }, { author: "후보작가" }).author, "상세작가");
eq("backfill: 후보 없으면 원본 그대로", S.backfillMetaFromCandidate({ title: "T", author: "" }, null), { title: "T", author: "" });
eq("backfill: 후보 작가 공백 트림", S.backfillMetaFromCandidate({ author: "" }, { author: "  김작가  " }).author, "김작가");
truthy("backfill: meta null 방어", S.backfillMetaFromCandidate(null, { author: "X" }) === null);

// ── 🆕 v7.41.0: 본편/외전 분리 (네이버 회차목록) ─────────────────────────────
eq("isGaidenTitle: '외전 483화' → true", S.isGaidenTitle("외전 483화"), true);
eq("isGaidenTitle: '번외편' → true", S.isGaidenTitle("번외편 5화"), true);
eq("isGaidenTitle: 본편 '517화' → false", S.isGaidenTitle("517화"), false);
eq("isGaidenTitle: '완결'은 외전 아님(오탐 방지)", S.isGaidenTitle("550화 (완결)"), false);
eq("isGaidenTitle: '에필로그'는 본편 종결(외전 제외)", S.isGaidenTitle("에필로그"), false);
eq("isGaidenTitle: '番外' → true", S.isGaidenTitle("番外 1"), true);
{
  // DESC(최신순): 외전 2건이 앞, 본편 경계 뒤. 본편 완결일=본편 최신, 외전 시작/완결=외전 min/max
  const desc = JSON.stringify({ resultData: [
    { volumnNameText: "외전 2화", lastVolumeUpdateDate: "2023-03-01 10:00:00" },
    { volumnNameText: "외전 1화", lastVolumeUpdateDate: "2023-02-15 10:00:00" },
    { volumnNameText: "517화", lastVolumeUpdateDate: "2020-02-02 10:00:00" },
    { volumnNameText: "516화", lastVolumeUpdateDate: "2020-02-01 10:00:00" },
  ]});
  const sp = S.parseNaverEpisodeSplit(desc);
  eq("split: 외전 있음", sp.hasGaiden, true);
  eq("split: 외전 회차수 2", sp.gaidenCount, 2);
  eq("split: 본편 완결일 = 본편 최신(2020-02-02)", sp.mainCompletedAt, S.scraperDateToTs("2020-02-02"));
  eq("split: 외전 시작일 = 2023-02-15", sp.gaidenStartAt, S.scraperDateToTs("2023-02-15"));
  eq("split: 외전 완결일 = 2023-03-01", sp.gaidenCompletedAt, S.scraperDateToTs("2023-03-01"));
}
{
  // 외전 없는 작품: 본편 완결일만, 외전 0
  const noG = JSON.stringify({ resultData: [
    { volumnNameText: "320화 (완결)", lastVolumeUpdateDate: "2019-07-03 09:00:00" },
    { volumnNameText: "319화", lastVolumeUpdateDate: "2019-07-02 09:00:00" },
  ]});
  const sp2 = S.parseNaverEpisodeSplit(noG);
  eq("split: 외전 없음", sp2.hasGaiden, false);
  eq("split: 외전 0화", sp2.gaidenCount, 0);
  eq("split: 본편 완결일(2019-07-03)", sp2.mainCompletedAt, S.scraperDateToTs("2019-07-03"));
}
eq("split: 빈 목록 → null", S.parseNaverEpisodeSplit('{"resultData":[]}'), null);
eq("split: 비JSON → null", S.parseNaverEpisodeSplit("<html>error</html>"), null);
// 🆕 v7.41.1: 플랫폼 공통 분리기(타 플랫폼 페처는 [{title,ts}]만 만들면 됨) — 노벨피아 "외전)" 마커 등
{
  const eps = [
    { title: "외전) 후일담 2", ts: S.scraperDateToTs("2023-08-09") },
    { title: "외전) 후일담 1", ts: S.scraperDateToTs("2022-06-03") },
    { title: "320화", ts: S.scraperDateToTs("2021-10-04") },
    { title: "319화", ts: S.scraperDateToTs("2021-10-03") },
  ];
  const r = S.splitEpisodesByGaiden(eps);
  eq("splitEpisodes: 외전 2화", r.gaidenCount, 2);
  eq("splitEpisodes: 본편 완결일=2021-10-04", r.mainCompletedAt, S.scraperDateToTs("2021-10-04"));
  eq("splitEpisodes: 외전 시작=2022-06-03", r.gaidenStartAt, S.scraperDateToTs("2022-06-03"));
  eq("splitEpisodes: 외전 완결=2023-08-09", r.gaidenCompletedAt, S.scraperDateToTs("2023-08-09"));
}
eq("splitEpisodes: 빈 입력 → null", S.splitEpisodesByGaiden([]), null);
eq("splitEpisodes: 외전 없음", S.splitEpisodesByGaiden([{ title: "1화", ts: S.scraperDateToTs("2020-01-01") }]).hasGaiden, false);

// 🆕 v7.41.1: 노벨피아 회차목록 HTML 파서 (실측 구조 — novel 50000·113155 캡처 기반)
{
  // 본편(19금 배지 포함) 2 + 외전 1. 제목 배지/아이콘/개행 정제 + ep_style2 NanumSquareOTF 날짜, 주석 ep_style3 무시.
  const npHtml =
    '<table id="episode_table">' +
    '<tr class="ep_style5" data-episode-no="1"><td class="font12" onclick="location=\'/viewer/1\'"><b>' +
      '<span class="b_free s_inv">무료</span> <span class="b_19 s_inv">19</span>&nbsp;<i class="icon ion-bookmark"></i>1.\r\n\t\t시작</b>' +
      '<div class="ep_style2"><span>EP.1</span><!--<b>99.99.99</b>--><b style=\'font: normal normal bold 12px/29px NanumSquareOTF;\'>20.01.01</b></div></td></tr>' +
    '<tr class="ep_style5" data-episode-no="2"><td class="font12"><b><span class="b_free s_inv">무료</span>2. 끝 (완결)</b>' +
      '<div class="ep_style2"><b style=\'NanumSquareOTF\'>20.06.01</b></div></td></tr>' +
    '<tr class="ep_style5" data-episode-no="3"><td class="font12"><b>외전)후일담</b>' +
      '<div class="ep_style2"><b style=\'NanumSquareOTF\'>21.03.01</b></div></td></tr>' +
    '</table>';
  const eps = S.parseNovelpiaEpisodeList(npHtml);
  eq("노벨피아: 3회차 파싱", eps.length, 3);
  eq("노벨피아: 19배지·개행 정제된 제목", eps[0].title, "1. 시작");
  eq("노벨피아: '완결' 본편 제목 보존", eps[1].title, "2. 끝 (완결)");
  eq("노벨피아: 외전 제목", eps[2].title, "외전)후일담");
  eq("노벨피아: 주석 날짜 무시, 실제 20.01.01", eps[0].ts, S.scraperDateToTs("2020-01-01"));
  eq("노벨피아: YY→20YY 변환(21.03.01)", eps[2].ts, S.scraperDateToTs("2021-03-01"));
  // 분리: 본편 완결일=20.06.01, 외전 1화(21.03.01)
  const sp = S.splitEpisodesByGaiden(eps);
  eq("노벨피아 split: 외전 1화", sp.gaidenCount, 1);
  eq("노벨피아 split: 본편 완결일=20.06.01", sp.mainCompletedAt, S.scraperDateToTs("2020-06-01"));
  eq("노벨피아 split: 외전 시작/완결=21.03.01", sp.gaidenStartAt, S.scraperDateToTs("2021-03-01"));
}
eq("노벨피아: 빈 HTML → []", S.parseNovelpiaEpisodeList("<table></table>").length, 0);

// 🆕 v7.41.2: 리디 출간일 중첩 구조(book.publish.ebook_publish) 버그 수정
eq("ridiPublishDate: 중첩 publish.ebook_publish", S.ridiPublishDate({ publish: { ebook_publish: "2024-06-12T00:00:00+09:00" } }).year, 2024);
eq("ridiPublishDate: 중첩 우선, 최상위 폴백 유지", S.ridiPublishDate({ ridibooks_publish: "2018-10-02" }).year, 2018);
// 🆕 v7.41.2: 리디 외전(별도 시리즈) 검색 발견 — 실측 무직전생 구조 기반
{
  const ridiSearch = JSON.stringify({ books: [
    { title: "무직전생", series_prices_info: [{ series_id: "505013198" }], opened_last_volume_id: "505083089", book_count: 26, parent_category_name: "라이트노벨", authors_info: [{ role: "story_writer", name: "리후진 나 마고노테" }] },
    { title: "무직전생 ~사족 편~", series_prices_info: [{ series_id: "505088480" }], opened_last_volume_id: "505088999", book_count: 3, parent_category_name: "라이트노벨", authors_info: [{ role: "story_writer", name: "리후진 나 마고노테" }] },
    { title: "[코믹] 무직전생 ~이세계에 갔으면~", series_prices_info: [{ series_id: "505024392" }], opened_last_volume_id: "505105971", book_count: 20, parent_category_name: "만화 e북", authors_info: [{ role: "illustrator", name: "후지카와 유카" }] },
  ] });
  const list = S.parseRidiSearchSeries(ridiSearch);
  eq("리디 검색: 3 시리즈", list.length, 3);
  eq("리디 검색: 본편 series_id", list[0].seriesId, "505013198");
  eq("리디 검색: 외전 lastVolumeId", list[1].lastVolumeId, "505088999");
  eq("리디 검색: 코믹 플래그", list[2].isComic, true);
  eq("리디 검색: 작가(story_writer)", list[0].author, "리후진 나 마고노테");
  const base = { title: "무직전생", author: "리후진 나 마고노테", seriesId: "505013198" };
  const gaiden = S.pickRidiGaidenSeries(base, list);
  eq("리디 외전선별: 1건(사족 편만)", gaiden.length, 1);
  eq("리디 외전선별: 외전 시리즈 id", gaiden[0].seriesId, "505088480");
  eq("리디 외전선별: 본편 자신 제외", gaiden.some(g => g.seriesId === "505013198"), false);
  eq("리디 외전선별: 코믹 제외", gaiden.some(g => g.isComic), false);
}
eq("pickRidiGaidenSeries: 빈 목록 → []", S.pickRidiGaidenSeries({ title: "x", seriesId: "1" }, []).length, 0);
// 🔧 v7.41.3: 짧은/접두 제목 오탐 방지 — 본편 제목 직후 구분자/마커 없이 다른 단어로 이어지면 제외
{
  const base = { title: "검", author: "갑", seriesId: "1" };
  const list = [
    { seriesId: "2", title: "검술명가 막내아들", author: "갑", isComic: false, bookCount: 10 }, // 구분자 없이 '술'로 이어짐 → 제외
    { seriesId: "3", title: "검 외전", author: "갑", isComic: false, bookCount: 2 },           // 공백+마커 → 포함
  ];
  const g = S.pickRidiGaidenSeries(base, list).map(x => x.seriesId);
  eq("리디 외전선별: 접두 오탐('검'→'검술명가') 제외", g.includes("2"), false);
  eq("리디 외전선별: 구분자/마커 있으면 포함('검 외전')", g.includes("3"), true);
}
// 🔧 v7.41.3: applyEpisodeSplitToMeta — 외전-only 윈도(본편 완결일 0)에서도 외전 데이터 보존
{
  const m1 = { totalEpisodes: 50 };
  S.applyEpisodeSplitToMeta(m1, { mainCompletedAt: 0, hasGaiden: true, gaidenCount: 3, gaidenStartAt: 111, gaidenCompletedAt: 222 });
  eq("split적용: 본편완결일 0이어도 외전 보존(count)", m1.gaidenCount, 3);
  eq("split적용: 외전 시작/완결 보존", [m1.gaidenStartAt, m1.gaidenCompletedAt], [111, 222]);
  eq("split적용: 본편완결일 0이면 completedAt 미설정", m1.completedAt, undefined);
  // 리디(noTotalAdjust): total 보정 안 함
  const m2 = { totalEpisodes: 26 };
  S.applyEpisodeSplitToMeta(m2, { mainCompletedAt: 1000, hasGaiden: true, gaidenCount: 3, gaidenStartAt: 5, gaidenCompletedAt: 9, gaidenStatus: "ongoing" }, { noTotalAdjust: true });
  eq("split적용(리디): total 미보정", m2.totalEpisodes, 26);
  eq("split적용(리디): gaidenStatus 전파(ongoing)", m2.gaidenStatus, "ongoing");
  // 회차모델(노벨피아/네이버): total=본편(전체-외전)
  const m3 = { totalEpisodes: 100 };
  S.applyEpisodeSplitToMeta(m3, { mainCompletedAt: 1000, hasGaiden: true, gaidenCount: 10, gaidenStartAt: 5, gaidenCompletedAt: 9 });
  eq("split적용(회차모델): total=본편(100-10)", m3.totalEpisodes, 90);
  eq("split적용(회차모델): gaidenStatus 기본 completed", m3.gaidenStatus, "completed");
}

// 🆕 v7.41.4: 카카오 GraphQL 파서 (contentHomeProductList + viewerInfo — Hitomi 검증 쿼리 구조)
{
  const list = JSON.stringify({ data: { contentHomeProductList: { totalCount: 100, pageInfo: { hasNextPage: true }, edges: [
    { node: { single: { productId: 111, title: "외전 2화" } } },
    { node: { single: { productId: 110, title: "외전 1화" } } },
    { node: { single: { productId: 100, title: "100화 (완결)" } } },
  ] } } });
  const pl = S.parseKakaoProductList(list);
  eq("카카오 목록: 3회차", pl.episodes.length, 3);
  eq("카카오 목록: productId 문자열", pl.episodes[0].productId, "111");
  eq("카카오 목록: 외전 제목", pl.episodes[0].title, "외전 2화");
  eq("카카오 목록: hasNext", pl.hasNext, true);
  eq("카카오 목록: 본편 '완결' 오탐 없음", S.isGaidenTitle(pl.episodes[2].title), false);
  eq("카카오 목록: 비JSON → null", S.parseKakaoProductList("<html>"), null);
  const view = JSON.stringify({ data: { viewerInfo: { item: { productId: 100, lastReleasedDate: "2020-06-01T00:00:00+09:00" } } } });
  eq("카카오 viewerInfo: lastReleasedDate → ts", S.parseKakaoViewerDate(view), S.scraperDateToTs("2020-06-01"));
  eq("카카오 viewerInfo: 날짜 없음 → 0", S.parseKakaoViewerDate('{"data":{"viewerInfo":{"item":{}}}}'), 0);
  eq("카카오 viewerInfo: 비JSON → 0", S.parseKakaoViewerDate("err"), 0);
}

// 🆕 v7.42.0: 카카오 GraphQL contentHomeOverview → 정규화 meta (풀-CSR 전환 후 메인 취득 경로)
//   응답 모양은 본 repo 픽스처(kakao-novel-heukbaekmuje)로 확인한 실데이터 기준.
{
  const ov = (c) => JSON.stringify({ data: { contentHomeOverview: { content: c } } });
  const real = ov({ seriesId: 56598258, title: "흑백무제", authors: "현임", category: "웹소설", categoryType: "Webnovel",
    subcategory: "무협", onIssue: "End", startSaleDt: "2021-02-26T12:00:47+09:00", lastSlideAddedDate: "2025-08-08T17:00:04+09:00",
    description: "줄거리 본문\n둘째 줄", pubPeriod: "월, 화, 수, 목, 금", ageGrade: "All", thumbnail: "//dn-img-page.kakao.com/x.jpg" });
  const m = S.parseKakaoOverview(real, "https://page.kakao.com/content/56598258");
  eq("카카오 overview: ok", m.ok, true);
  eq("카카오 overview: 제목", m.title, "흑백무제");
  eq("카카오 overview: 작가", m.author, "현임");
  eq("카카오 overview: 장르=subcategory", m.genres, ["무협"]);
  eq("카카오 overview: 완결(End)", m.workStatus, "completed");
  eq("카카오 overview: 시작연도=startSaleDt", m.startYear, 2021);
  eq("카카오 overview: 완결연도=lastSlideAddedDate", m.endYear, 2025);
  eq("카카오 overview: 완결일 ts", m.completedAt, S.scraperDateToTs("2025-08-08"));
  eq("카카오 overview: 줄거리 줄바꿈 보존", m.synopsis, "줄거리 본문\n둘째 줄");
  eq("카카오 overview: 플랫폼/URL", [m.platform, m.url], ["카카오페이지", "https://page.kakao.com/content/56598258"]);
  eq("카카오 overview: 썸네일=coverUrl", m.coverUrl, "//dn-img-page.kakao.com/x.jpg");
  const ing = S.parseKakaoOverview(ov({ title: "연재작", onIssue: "Ing", startSaleDt: "2024-01-02T00:00:00+09:00", lastSlideAddedDate: "2024-06-01T00:00:00+09:00" }), "u");
  eq("카카오 overview: 연재중(Ing)", ing.workStatus, "ongoing");
  eq("카카오 overview: 연재중은 완결일 비움", [ing.endYear, ing.completedAt], [null, 0]);
  eq("카카오 overview: 19금 등급 태그", S.parseKakaoOverview(ov({ title: "성인작", onIssue: "End", ageGrade: "Adult" }), "u").ageTag, "19금");
  eq("카카오 overview: 제목 없음 → null", S.parseKakaoOverview(ov({ onIssue: "End" }), "u"), null);
  eq("카카오 overview: content 없음 → null", S.parseKakaoOverview('{"data":{"contentHomeOverview":{}}}', "u"), null);
  eq("카카오 overview: 비JSON → null", S.parseKakaoOverview("<html>", "u"), null);
  // 🆕 v7.44.2: seriesId 추출 — /content/{id} + 공유링크 쿼리
  eq("카카오 sid: /content/ 경로", S.kakaoSeriesIdFromUrl("https://page.kakao.com/content/53705302"), "53705302");
  eq("카카오 sid: 공유링크 series_id=", S.kakaoSeriesIdFromUrl("https://page.kakao.com/?n_source=sh_more&series_id=69296192"), "69296192");
  eq("카카오 sid: seriesId= 변형", S.kakaoSeriesIdFromUrl("https://x/y?seriesId=12345&z=1"), "12345");
  eq("카카오 sid: 없음 → null", S.kakaoSeriesIdFromUrl("https://page.kakao.com/home"), null);
}

// 🆕 v7.41.5: 문피아 회차 JSON 파서 (신 SPA API — result.list의 title+createdAt, 실측 구조)
{
  const basic = JSON.stringify({ result: { total: 3, next: false, sliceEntryId: null, list: [
    { num: 3, title: "외전 1화", createdAt: "2023-08-09T10:00:00" },
    { num: 2, title: "320화 (완결)", createdAt: "2021-10-04T10:00:00" },
    { num: 1, title: "1화", createdAt: "2021-01-01T10:25:00" },
  ] } });
  const p = S.parseMunpiaEntries(basic);
  eq("문피아: 3회차", p.episodes.length, 3);
  eq("문피아: 외전 제목", p.episodes[0].title, "외전 1화");
  eq("문피아: createdAt(ISO) → ts", p.episodes[1].ts, S.scraperDateToTs("2021-10-04"));
  eq("문피아: next=false", p.next, false);
  eq("문피아: 본편 '완결' 오탐 없음", S.isGaidenTitle(p.episodes[1].title), false);
  const sp = S.splitEpisodesByGaiden(p.episodes);
  eq("문피아 split: 외전 1화", sp.gaidenCount, 1);
  eq("문피아 split: 본편 완결일=2021-10-04", sp.mainCompletedAt, S.scraperDateToTs("2021-10-04"));
  // result.entries 폴백 + next/sliceEntryId(paid)
  const paid = JSON.stringify({ result: { next: true, sliceEntryId: 555, entries: [{ title: "외전 2화", createdAt: "2023-09-01T00:00:00" }] } });
  const pp = S.parseMunpiaEntries(paid);
  eq("문피아: entries 폴백", pp.episodes.length, 1);
  eq("문피아: sliceEntryId(paid cursor)", pp.sliceEntryId, 555);
  eq("문피아: 비JSON/구조이상 → null", S.parseMunpiaEntries("<html>"), null);
}

// 🆕 v7.44.7: 문피아 detail API(novelInfo) → 메타 + 링크 id 추출
{
  const j = JSON.stringify({ result: { novelInfo: {
    id: 346981, title: "회귀수선전", authorName: "엄청난", coverUrl: "https://cdn1.munpia.com/x", genres: ["무협", "퓨전"],
    finish: true, pause: false, adult: false, chapterCount: 863, createdAt: "2023-01-18T16:39:54",
  }, introductionInfo: { introduction: "줄거리\r\n둘째 줄", tags: [{ id: 45, title: "선협" }, { id: 93, title: "회귀" }] } } });
  const m = S.parseMunpiaNovelInfo(j, "https://m.munpia.com/novel/346981");
  eq("문피아 메타: 제목", m.title, "회귀수선전");
  eq("문피아 메타: 작가", m.author, "엄청난");
  eq("문피아 메타: 완결(finish)", m.workStatus, "completed");
  eq("문피아 메타: 시작연도=createdAt", m.startYear, 2023);
  eq("문피아 메타: 장르+소재태그 병합", m.genres, ["무협", "퓨전", "선협", "회귀"]);
  eq("문피아 메타: 줄거리 개행 정규화", m.synopsis, "줄거리\n둘째 줄");
  eq("문피아 메타: 총회차", m.totalEpisodes, 863);
  eq("문피아 메타: 표지", m.coverUrl, "https://cdn1.munpia.com/x");
  eq("문피아 메타: 19금 아님", m.ageTag, null);
  const ing = S.parseMunpiaNovelInfo(JSON.stringify({ result: { novelInfo: { title: "T", finish: false, pause: true, adult: true } } }), "u");
  eq("문피아 메타: 휴재(pause)", ing.workStatus, "hiatus");
  eq("문피아 메타: 성인", ing.ageTag, "19금");
  eq("문피아 메타: novelInfo 없음 → null", S.parseMunpiaNovelInfo('{"result":{}}', "u"), null);
  eq("문피아 메타: 비JSON → null", S.parseMunpiaNovelInfo("x", "u"), null);
  eq("문피아 id: ?id=", S.munpiaIdFromUrl("https://m.munpia.com/novel?id=346981"), "346981");
  eq("문피아 id: link /n/", S.munpiaIdFromUrl("https://link.munpia.com/n/346981"), "346981");
  eq("문피아 id: /novel/", S.munpiaIdFromUrl("https://m.munpia.com/novel/346981"), "346981");
  eq("문피아 id: 없음 → null", S.munpiaIdFromUrl("https://m.munpia.com/"), null);
}

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "⚠️  FAILED"}  pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
