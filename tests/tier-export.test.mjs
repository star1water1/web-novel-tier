// 티어표 엑셀 내보내기 회귀 테스트 (node — RN 불필요)
//   변동 판정, 행 가공, xlsx 구조를 확인한다. 파일이 실제 엑셀·한컴에서 열리는지와 폰 저장은 여기서 확인되지 않는다.
//   실행: node tests/tier-export.test.mjs
//   시트 확인용 파일 만들기: node tests/tier-export.test.mjs --write-sample <경로>
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const strip = (text) => text.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const appSrc = read("App.jsx");
const plainJson = (value) => JSON.parse(JSON.stringify(value));

const box = { console, Date, Math, JSON, Map, Set, Number, String, Array, Uint8Array, Uint32Array, DataView, Infinity };
vm.createContext(box);
vm.runInContext(
  `${strip(read("src/features/tier-export/xlsxWriter.js"))}\n${strip(read("src/features/tier-export/diff.js"))}\n${strip(read("src/features/tier-export/sheet.js"))}\n${strip(read("src/features/tier-export/store.js"))}
  globalThis.__T = { crc32, utf8Encode, buildZip, buildXlsx, findStable, compareToBaseline, EXPORT_COLORS, formatRead, buildRows, buildSheet, TIER_EXPORT_TABLES, TIER_EXPORT_CLEAR_QUERIES, ensureTierExportSchema, listSnapshots, loadSnapshot, saveSnapshot, buildBackup, restoreQueries };`,
  box,
  { filename: "tier-export" }
);
const T = box.__T;

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}

// ── 변동 판정 ──
const TIERS = ["S", "A", "B"];
const row = (id, over = {}) => ({ id, tier: "A", rating: 1500, read: 10, gaidenRead: 0, title: `t${id}`, ...over });
const rowsOf = (ids, over = {}) => ids.map((id) => row(id, over[id]));
const base = (ids, over = {}, tierMode = "manual", tierOrder = TIERS) => ({ tierMode, tierOrder, items: rowsOf(ids, over) });
const cur = (tierMode = "manual", tierOrder = TIERS) => ({ tierMode, tierOrder });
const changes = (result) => Object.fromEntries([...result.status].filter(([, s]) => s.change).map(([id, s]) => [id, s.change]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const range = (n) => Array.from({ length: n }, (_, i) => `w${i}`);

{
  const r = T.compareToBaseline(rowsOf(["a", "b"]), cur(), null);
  check("첫 출력은 아무것도 칠하지 않는다", r.first && same(changes(r), {}) && r.counts.read === 0);
}
{
  const ids = range(50);
  const next = [...ids]; next.splice(5, 0, "n1"); next.splice(30, 0, "n2");
  const r = T.compareToBaseline(rowsOf(next), cur(), base(ids));
  check("추가만 있으면 밀린 작품을 칠하지 않는다", r.counts.new === 2 && r.counts.up === 0 && r.counts.down === 0, JSON.stringify(r.counts));
}
{
  const ids = range(50);
  const r = T.compareToBaseline(rowsOf(ids.filter((id) => id !== "w3")), cur(), base(ids));
  check("삭제만 있으면 칠하지 않고 삭제 목록에 넣는다", r.counts.up === 0 && r.counts.down === 0 && same(r.removed, ["tw3"]));
}
{
  const ids = range(100);
  const next = ids.filter((id) => id !== "w70"); next.splice(30, 0, "w70");
  check("한 작품이 크게 오르면 그 작품만 칠한다", same(changes(T.compareToBaseline(rowsOf(next), cur(), base(ids))), { w70: "up" }));
  const down = ids.filter((id) => id !== "w10"); down.splice(60, 0, "w10");
  check("한 작품이 크게 내리면 그 작품만 칠한다", same(changes(T.compareToBaseline(rowsOf(down), cur(), base(ids))), { w10: "down" }));
}
{
  const ids = range(100);
  let next = ids.filter((id) => id !== "w70" && id !== "w10" && id !== "w50");
  next.splice(30, 0, "w70"); next.splice(70, 0, "w10"); next.splice(5, 0, "n1");
  const r = T.compareToBaseline(rowsOf(next), cur(), base(ids));
  check("상승·하락·추가·삭제가 섞여도 주체만 칠한다", same(changes(r), { n1: "new", w70: "up", w10: "down" }) && same(r.removed, ["tw50"]), JSON.stringify(changes(r)));
}
{
  const r = T.compareToBaseline(rowsOf(["a", "c", "b"]), cur(), base(["a", "b", "c"]));
  check("맞바뀌면 한 작품만 칠한다", Object.keys(changes(r)).length === 1);
}
{
  // b가 점수 변동 없이 맞바뀐 쌍에 있으면 점수가 바뀐 c가 주체다.
  const before = base(["a", "b", "c", "d"], {}, "match");
  const now = rowsOf(["a", "c", "b", "d"], { c: { rating: 1540 } });
  check("rating 방식은 점수가 그대로인 작품을 칠하지 않는다", same(changes(T.compareToBaseline(now, cur("match"), before)), { c: "up" }));
  const hybrid = base(["a", "b", "c", "d"], {}, "hybrid");
  check("방식이 바뀌면 점수를 쓰지 않고 순서만 본다", Object.keys(changes(T.compareToBaseline(now, cur("match"), hybrid))).length === 1);
}
{
  const r = T.compareToBaseline(rowsOf(["a", "b"], { b: { tier: "S" } }), cur(), base(["a", "b"]));
  check("순서가 그대로여도 티어가 오르면 상승으로 칠한다", same(changes(r), { b: "up" }));
  const r2 = T.compareToBaseline(rowsOf(["a", "b"], { a: { tier: "B" } }), cur(), base(["a", "b"]));
  check("순서가 그대로여도 티어가 내리면 하락으로 칠한다", same(changes(r2), { a: "down" }));
}
{
  const r = T.compareToBaseline(rowsOf(["a", "b"], { a: { read: 11 } }), cur(), base(["a", "b"]));
  check("읽은 화수 변화는 순위 변동과 따로 표시한다", r.status.get("a").readChanged && !r.status.get("a").change && !r.status.get("b").readChanged && r.counts.read === 1);
  const r2 = T.compareToBaseline(rowsOf(["a"], { a: { gaidenRead: 3 } }), cur(), base(["a"]));
  check("외전 화수 변화도 잡는다", r2.status.get("a").readChanged);
}
{
  const r = T.compareToBaseline(rowsOf(["a"]), cur("manual", ["S", "B"]), base(["a"]));
  check("티어 구성이 바뀌면 알린다", r.tierConfigChanged);
  const r2 = T.compareToBaseline(rowsOf(["a"], { a: { tier: "S" } }), cur("manual", ["S", "B"]), base(["a"]));
  check("지난 티어가 없어졌으면 방향을 지어내지 않는다", r2.status.get("a").change === null);
}
{
  // 임의 순서: 칠하지 않은 작품끼리는 순서가 유지되고, 방향은 언제나 정해진다.
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  let ok = true;
  for (let t = 0; t < 200 && ok; t++) {
    const ids = range(40);
    const next = [...ids];
    for (let k = 0; k < 8; k++) { const [x] = next.splice(Math.floor(rnd() * next.length), 1); next.splice(Math.floor(rnd() * next.length), 0, x); }
    const r = T.compareToBaseline(rowsOf(next), cur(), base(ids));
    const kept = next.filter((id) => !r.status.get(id).change).map((id) => ids.indexOf(id));
    if (kept.some((v, i) => i > 0 && kept[i - 1] > v)) ok = false;
  }
  check("칠하지 않은 작품끼리는 순서가 항상 유지된다", ok);
}

// ── 행 가공 ──
const work = (over) => ({ id: "x", title: "제목", read_count: 0, gaiden_read_count: 0, total_episodes: 0, work_status: "ongoing", gaiden_status: "none", platforms: "[]", major_genre: "", author: "", rating: 1500, ...over });
check("읽은 화수: 숫자", T.formatRead(work({ read_count: 120 })) === 120);
check("읽은 화수: 완결을 끝까지 읽으면 (完)", T.formatRead(work({ read_count: 400, total_episodes: 400, work_status: "completed" })) === "400(完)");
check("읽은 화수: 완결이어도 덜 읽었으면 숫자", T.formatRead(work({ read_count: 399, total_episodes: 400, work_status: "completed" })) === 399);
check("읽은 화수: 외전을 읽었으면 외전 표기", T.formatRead(work({ read_count: 400, gaiden_status: "ongoing", gaiden_read_count: 26 })) === "외전 26");
check("읽은 화수: 외전이 있어도 안 읽었으면 본편 표기", T.formatRead(work({ read_count: 40, gaiden_status: "ongoing" })) === 40);
{
  const helpers = { getTier: (w) => w.tier, tierLabel: (t) => t, tierColor: () => "#123456" };
  const rows = T.buildRows([
    work({ id: "1", tier: "S", platforms: '["문피아","시리즈"]', major_genre: '["현대판타지","SF"]', author: " 작가 " }),
    work({ id: "2", tier: "S", major_genre: "무협, 선협" }),
    work({ id: "3", tier: "A", major_genre: "[깨짐" }),
  ], helpers);
  check("순위는 티어마다 1부터 센다", same(rows.map((r) => r.rank), [1, 2, 1]));
  check("플랫폼은 모두 잇는다", rows[0].platform === "문피아, 시리즈");
  check("대장르는 하나만 넣는다 (JSON)", rows[0].genre === "현대판타지");
  check("대장르는 하나만 넣는다 (쉼표)", rows[1].genre === "무협");
  check("대장르가 깨져 있어도 멈추지 않는다", rows[2].genre === "");
  check("작가 앞뒤 공백을 지운다", rows[0].author === "작가");
}

// ── 시트 색 ──
const sheetRows = T.buildRows(
  [work({ id: "n", tier: "S" }), work({ id: "u", tier: "S" }), work({ id: "d", tier: "A" }), work({ id: "r", tier: "B" }), work({ id: "ur", tier: "C" }), work({ id: "dr", tier: "상" }), work({ id: "z", tier: "상" })],
  { getTier: (w) => w.tier, tierLabel: (t) => t, tierColor: () => "#112233" }
);
const sheetStatus = new Map([
  ["n", { change: "new", readChanged: false }],
  ["u", { change: "up", readChanged: false }],
  ["d", { change: "down", readChanged: false }],
  ["r", { change: null, readChanged: true }],
  ["ur", { change: "up", readChanged: true }],
  ["dr", { change: "down", readChanged: true }],
  ["z", { change: null, readChanged: false }],
]);
const sheet = T.buildSheet(sheetRows, sheetStatus);
const fills = (i) => sheet.rows[i + 1].slice(1).map((c) => c.style.fill);
const C = T.EXPORT_COLORS;
check("A열은 비워 둔다", sheet.rows.every((r) => r[0] === null));
check("머리글은 양식과 같다", same(sheet.rows[0].slice(1).map((c) => c.value), ["Tier", "순위", "제목", "읽은 화수", "플랫폼", "대장르", "작가"]));
check("신규는 행 전체가 노랑", fills(0).every((f) => f === C.new));
check("상승은 행 전체가 연두", fills(1).every((f) => f === C.up));
check("하락은 행 전체가 붉은색", fills(2).every((f) => f === C.down));
check("화수 변화는 그 칸만 연두", same(fills(3), [null, null, null, C.read, null, null, null]));
check("상승과 화수 변화가 겹치면 그 칸만 진하게", fills(4)[3] === C.readOnUp && fills(4)[0] === C.up && C.readOnUp !== C.up);
check("하락과 화수 변화가 겹치면 그 칸만 연두", fills(5)[3] === C.read && fills(5)[0] === C.down);
check("변화가 없으면 칠하지 않는다", fills(6).every((f) => !f));
const tierFont = (i) => sheet.rows[i + 1][1].style;
check("티어 글자색은 양식을 따른다", tierFont(0).color === "FF0000" && tierFont(2).color === "F79646" && tierFont(3).color === "8064A2" && tierFont(4).color === "00B050" && tierFont(0).bold);
check("커스텀 티어는 앱의 티어 색을 쓴다", tierFont(5).color === "112233");

// ── xlsx 구조 ──
function unzip(bytes) {
  const buf = Buffer.from(bytes);
  const files = {};
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(at) !== 0x02014b50) throw new Error("중앙 디렉터리가 어긋남");
    const method = buf.readUInt16LE(at + 10);
    const crc = buf.readUInt32LE(at + 16);
    const size = buf.readUInt32LE(at + 20);
    const nameLen = buf.readUInt16LE(at + 28);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.toString("utf8", at + 46, at + 46 + nameLen);
    if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error("로컬 헤더가 어긋남");
    const dataAt = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(dataAt, dataAt + size);
    if (method !== 0) throw new Error("예상과 다른 압축 방식");
    if (zlib.crc32 && zlib.crc32(data) !== crc) throw new Error(`CRC 불일치: ${name}`);
    files[name] = data.toString("utf8");
    at += 46 + nameLen + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32);
  }
  return files;
}
const utf8Case = "가A😀é";
check("UTF-8 인코딩이 표준과 같다", Buffer.from(T.utf8Encode(utf8Case)).equals(Buffer.from(utf8Case, "utf8")));
check("CRC32 표준값", T.crc32(T.utf8Encode("123456789")) === 0xcbf43926);

const tricky = [work({ id: "t", tier: "S", title: 'A&B <"태그">\u0001😀', author: "=SUM(1)" })];
const trickyFile = unzip(T.buildXlsx(T.buildSheet(T.buildRows(tricky, { getTier: (w) => w.tier, tierLabel: (t) => t, tierColor: () => "#000000" }), new Map()), new Date(2026, 10, 3, 4, 5, 6)));
check("필수 파일이 모두 들어 있다", ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/worksheets/sheet1.xml", "xl/styles.xml", "xl/sharedStrings.xml"].every((n) => trickyFile[n]));
check("특수 문자를 이스케이프하고 제어 문자를 뺀다", trickyFile["xl/sharedStrings.xml"].includes("A&amp;B &lt;&quot;태그&quot;&gt;😀"));
check("수식처럼 보이는 값도 글자로 넣는다", trickyFile["xl/sharedStrings.xml"].includes("=SUM(1)") && !trickyFile["xl/worksheets/sheet1.xml"].includes("<f>"));

const file = unzip(T.buildXlsx(sheet, new Date(2026, 10, 3, 4, 5, 6)));
const styles = file["xl/styles.xml"];
const sheetXml = file["xl/worksheets/sheet1.xml"];
const countOf = (tag) => (styles.match(new RegExp(`<${tag}[ >/]`, "g")) || []).length;
const declared = (tag) => Number(styles.match(new RegExp(`<${tag} count="(\\d+)"`))[1]);
check("서식 개수 선언이 실제와 같다", declared("fonts") === countOf("font") && declared("fills") === countOf("fill") && declared("borders") === countOf("border"));
const xfCount = declared("cellXfs");
const usedStyles = [...sheetXml.matchAll(/ s="(\d+)"/g)].map((m) => Number(m[1]));
check("모든 칸의 서식 번호가 범위 안이다", usedStyles.every((v) => v < xfCount));
const sst = file["xl/sharedStrings.xml"];
const unique = Number(sst.match(/uniqueCount="(\d+)"/)[1]);
const stringRefs = [...sheetXml.matchAll(/t="s"><v>(\d+)<\/v>/g)].map((m) => Number(m[1]));
check("문자열 번호가 범위 안이고 개수 선언이 맞다", stringRefs.every((v) => v < unique) && (sst.match(/<si>/g) || []).length === unique && Number(sst.match(/ count="(\d+)"/)[1]) === stringRefs.length);
check("채우기 색이 파일에 들어간다", [C.new, C.up, C.down, C.readOnUp].every((c) => styles.includes(`FF${c}`)));
check("A열 칸을 쓰지 않는다", !/r="A\d+"/.test(sheetXml));

const small = T.buildZip([{ name: "a.txt", data: "hello" }], new Date(2026, 10, 3));
check("ZIP을 다시 읽을 수 있다", unzip(small)["a.txt"] === "hello");

// ── 출력 기록 (진짜 SQLite) ──
function makeDb() {
  const raw = new DatabaseSync(":memory:");
  let idCounter = 0;
  const plain = (value) => JSON.parse(JSON.stringify(value));
  const db = {
    raw,
    newId: () => `snap${++idCounter}`,
    exec: async (sql, params = []) => raw.prepare(sql).run(...params),
    all: async (sql, params = []) => plain(raw.prepare(sql).all(...params)),
    first: async (sql, params = []) => { const r = raw.prepare(sql).get(...params); return r ? plain(r) : null; },
    execBatch: async (queries) => {
      raw.exec("BEGIN");
      try {
        for (const { sql, params } of queries) raw.prepare(sql).run(...(params || []));
        raw.exec("COMMIT");
      } catch (e) { raw.exec("ROLLBACK"); throw e; }
    },
  };
  return db;
}
const db = makeDb();
await T.ensureTierExportSchema((sql) => db.raw.exec(sql));
await T.ensureTierExportSchema((sql) => db.raw.exec(sql));
check("기록이 없으면 비어 있다", (await T.listSnapshots(db)).length === 0 && (await T.buildBackup(db)) === null);

const storedRows = [
  { id: "a", tier: "S", rating: 1700.25, read: 12, gaidenRead: 0, title: "작품 \"A\"" },
  { id: "gone", tier: "A", rating: 1500, read: 3, gaidenRead: 1, title: "지운 작품" },
];
const firstId = await T.saveSnapshot(db, { fileName: "a.xlsx", tierMode: "match", tierOrder: ["S", "A"], rows: storedRows });
const loaded = await T.loadSnapshot(db, firstId);
check("저장한 출력본을 그대로 읽는다", loaded.tierMode === "match" && same(loaded.tierOrder, ["S", "A"]) && same(loaded.items, storedRows));
check("없는 출력본은 null", (await T.loadSnapshot(db, "nope")) === null);
db.raw.prepare("UPDATE tier_export_snapshot SET items='{깨짐' WHERE id=?").run(firstId);
check("깨진 출력본은 null", (await T.loadSnapshot(db, firstId)) === null);
check("깨진 출력본은 백업에서 뺀다", (await T.buildBackup(db)) === null);
db.raw.exec("DELETE FROM tier_export_snapshot");

for (let i = 0; i < 25; i++) {
  const id = await T.saveSnapshot(db, { fileName: `f${i}.xlsx`, tierMode: "manual", tierOrder: ["S"], rows: storedRows });
  db.raw.prepare("UPDATE tier_export_snapshot SET created_at=? WHERE id=?").run(1000 + i, id);
}
const kept = await T.listSnapshots(db);
check("출력 기록은 20개까지 남긴다", kept.length === 20, String(kept.length));
check("목록은 최신순이고 오래된 것을 지운다", kept[0].file_name === "f24.xlsx" && kept[19].file_name === "f5.xlsx" && kept[0].item_count === 2);

const backup = plainJson(await T.buildBackup(db));
const restoredDb = makeDb();
await T.ensureTierExportSchema((sql) => restoredDb.raw.exec(sql));
const idMap = { a: "new-a" };
await restoredDb.execBatch(T.restoreQueries(backup, (id) => idMap[id] || id, restoredDb.newId));
const restoredList = await T.listSnapshots(restoredDb);
const restored = await T.loadSnapshot(restoredDb, restoredList[0].id);
check("백업 왕복: 개수와 순서를 유지한다", restoredList.length === 20 && restoredList[0].file_name === "f24.xlsx" && restoredList[0].created_at === 1024);
check("백업 왕복: 작품 ID를 새 ID로 바꾼다", restored.items[0].id === "new-a" && restored.items[0].rating === 1700.25);
check("백업 왕복: 없는 작품은 그대로 남아 삭제로 잡힌다", restored.items[1].id === "gone");
{
  const r = T.compareToBaseline([row("new-a", { tier: "S", rating: 1700.25, read: 12 })], { tierMode: "manual", tierOrder: ["S"] }, restored);
  check("복원 뒤 비교: 같은 작품으로 알아보고 지운 작품을 찾는다", r.status.get("new-a").change === null && !r.status.get("new-a").readChanged && same(r.removed, ["지운 작품"]));
}
check("형식이 맞지 않는 백업은 건너뛴다", T.restoreQueries(null, (x) => x, () => "x").length === 0 && T.restoreQueries({}, (x) => x, () => "x").length === 0 && T.restoreQueries([null, { x: "no" }], (x) => x, () => "x").length === 0);
for (const { sql, params } of T.TIER_EXPORT_CLEAR_QUERIES) db.raw.prepare(sql).run(...params);
check("초기화 쿼리가 기록을 비운다", (await T.listSnapshots(db)).length === 0);
check("복원 스냅샷 대상에 표가 등록되어 있다", T.TIER_EXPORT_TABLES.includes("tier_export_snapshot") && appSrc.includes("...TIER_EXPORT_TABLES]"));
check("초기화·복원 세 곳이 기록을 비운다", (appSrc.match(/\.\.\.TIER_EXPORT_CLEAR_QUERIES/g) || []).length === 3);

// ── 시트 확인용 파일 ──
const sampleAt = process.argv.indexOf("--write-sample");
if (sampleAt > 0) {
  const target = process.argv[sampleAt + 1];
  const works = ["S", "S", "A", "A", "B+", "B+", "B", "B-", "C", "상"].map((tier, i) =>
    work({ id: `s${i}`, tier, title: `시험 작품 ${i + 1}`, read_count: 10 + i * 30, total_episodes: i % 3 === 0 ? 10 + i * 30 : 900, work_status: i % 3 === 0 ? "completed" : "ongoing", platforms: '["시리즈","문피아"]', major_genre: '["판타지"]', author: `작가${i}` }));
  const samples = T.buildRows(works, { getTier: (w) => w.tier, tierLabel: (t) => t, tierColor: () => "#6b7280" });
  const status = new Map(samples.map((s, i) => [s.id, { change: [null, "new", "up", "down", null, "up", "down", null, null, null][i], readChanged: [false, false, false, false, true, true, true, false, false, false][i] }]));
  fs.writeFileSync(target, T.buildXlsx(T.buildSheet(samples, status)));
  console.log(`시험 파일: ${target}`);
}

console.log(`\n${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
