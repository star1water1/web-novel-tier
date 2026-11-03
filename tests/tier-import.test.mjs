// 티어표 엑셀 가져오기 회귀 테스트 (node — RN 불필요)
//   xlsx 읽기, 변경 판정, 적용과 되돌리기를 확인한다. 실제 엑셀에서 고친 파일과 폰의 파일 선택은 여기서 확인되지 않는다.
//   실행: node --no-warnings tests/tier-import.test.mjs
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

const box = { console, Date, Math, JSON, Map, Set, Number, String, Array, Uint8Array, Uint16Array, Uint32Array, DataView, Infinity, Object, RegExp, Error };
vm.createContext(box);
const sources = ["xlsxWriter", "xlsxReader", "diff", "sheet", "store", "importPlan"].map((name) => strip(read(`src/features/tier-export/${name}.js`))).join("\n");
vm.runInContext(
  `${sources}
  globalThis.__T = { crc32, buildZip, buildXlsx, inflate, utf8Decode, readXlsx, buildRows, buildSheet, ID_HEADER, ensureTierExportSchema, saveSnapshot, loadSnapshot, buildBackup, restoreQueries, applyImport, revertImport, getLatestImport, TIER_EXPORT_TABLES, parseReadCell, readTierTable, buildImportPlan };`,
  box,
  { filename: "tier-import" }
);
const T = box.__T;

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── inflate ──
{
  let s = 777;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const cases = [
    Buffer.alloc(0),
    Buffer.from("가나다 ABC 😀 ".repeat(2000)),
    Buffer.alloc(70000, 7),
    Buffer.from(Array.from({ length: 50000 }, () => Math.floor(rnd() * 256))),
    Buffer.from(Array.from({ length: 50000 }, () => 65 + Math.floor(rnd() * 4))),
  ];
  let ok = true;
  for (const data of cases) {
    for (const opts of [{ level: 9 }, { level: 1 }, { level: 0 }, { strategy: zlib.constants.Z_FIXED }, { strategy: zlib.constants.Z_HUFFMAN_ONLY }]) {
      const out = T.inflate(zlib.deflateRawSync(data, opts), data.length);
      if (!Buffer.from(out).equals(data)) ok = false;
    }
  }
  check("inflate가 zlib 압축을 모든 블록 형식에서 그대로 푼다", ok);
  const raw = zlib.deflateRawSync(Buffer.from("hello hello hello"));
  let threw = 0;
  try { T.inflate(raw, 3); } catch { threw++; }
  try { T.inflate(raw.subarray(0, 4), 17); } catch { threw++; }
  try { T.inflate(Buffer.from([0x07]), 1); } catch { threw++; }
  check("크기가 다르거나 잘리거나 깨진 압축은 멈추지 않고 오류를 낸다", threw === 3);
  const text = "가A😀é\u0001".repeat(2000);
  check("UTF-8 복호화가 표준과 같다", T.utf8Decode(Buffer.from(text, "utf8")) === text);
}

// ── 시험용 작품 ──
const TIERS = ["S", "A", "B"];
const work = (id, tier, over = {}) => ({ id, title: `제목${id}`, tier, manual_tier: tier, manual_order: 0, read_count: 10, gaiden_read_count: 0, gaiden_status: "none", total_episodes: 0, work_status: "ongoing", platforms: "[]", major_genre: "", author: "", rating: 1500, read_count_updated_at: 111, ...over });
const helpers = { getTier: (w) => w.tier, tierLabel: (t) => t, tierColor: () => "#000000" };
const tableOf = (works, tierMode = "manual", tierOrder = TIERS, tierLabels = Object.fromEntries(tierOrder.map((t) => [t, t]))) => ({
  rows: T.buildRows(works, helpers).map((row, i) => ({ ...row, manualOrder: Number(works[i].manual_order) || (i + 1) * 100 })),
  tierMode,
  tierOrder,
  tierLabels,
});
const snapshotOf = (table) => ({ tierMode: table.tierMode, tierOrder: table.tierOrder, items: table.rows.map((r) => ({ id: r.id, tier: r.tier, rating: r.rating, read: r.read, gaidenRead: r.gaidenRead, title: r.title })) });
const WORKS = [work("a", "S"), work("b", "S"), work("c", "A"), work("d", "A"), work("e", "A"), work("f", "B")];

// 내보낸 파일을 읽어 표로 돌려준다. edit로 시트를 고칠 수 있다.
function exported(table, edit = (rows) => rows, exportId = "exp1") {
  const sheet = T.buildSheet(table.rows, new Map(), exportId);
  sheet.rows = edit(sheet.rows);
  return T.readTierTable(T.readXlsx(T.buildXlsx(sheet, new Date(2026, 10, 3))));
}
const COL = { tier: 1, rank: 2, title: 3, read: 4, id: 8 };
const setCell = (rows, id, col, value) => {
  const row = rows.find((r) => r[COL.id]?.value === id);
  row[col] = { value };
  return rows;
};
// 머리글을 뺀 행에서 from 작품을 to 작품 앞으로 옮긴다. to가 없으면 맨 뒤로.
const moveRow = (rows, from, to) => {
  const [head, ...body] = rows;
  const index = body.findIndex((r) => r[COL.id]?.value === from);
  const [row] = body.splice(index, 1);
  const at = to ? body.findIndex((r) => r[COL.id]?.value === to) : body.length;
  body.splice(at, 0, row);
  return [head, ...body];
};
const placeOf = (plan) => Object.fromEntries(plan.changes.filter((c) => c.place).map((c) => [c.id, `${c.place.toTier}${c.place.toRank}`]));
const quiet = (plan) => plan.writes.length === 0 && plan.changes.length === 0 && plan.conflicts.length === 0 && plan.skipped.length === 0
  && !plan.notices.titleIgnored && !plan.notices.rankMismatch && !plan.notices.missingFromFile && !plan.notices.manyMoved;

// ── 파일 읽기 ──
{
  const table = tableOf(WORKS);
  const parsed = exported(table);
  check("머리글의 출력본 ID를 읽는다", parsed.exportId === "exp1");
  check("행을 모두 읽는다", parsed.rows.length === WORKS.length && parsed.rows[0].id === "a" && parsed.rows[0].tier === "S" && parsed.rows[0].read === 10 && parsed.rows[0].rowNumber === 2);
  const sheet = T.buildSheet(table.rows, new Map(), "exp1");
  check("작품 ID 열을 숨긴다", same(sheet.hiddenColumns, [8]) && sheet.columnWidths.length === 9);
  const raw = Buffer.from(T.buildXlsx(sheet)).toString("utf8");
  check("숨긴 열이 파일에 표시된다", raw.includes('<col min="9" max="9" width="10" customWidth="1" hidden="1"/>'));
  check("칠하는 칸에 숨긴 열이 끼지 않는다", sheet.rows[1][8].style === undefined);

  // 엑셀처럼 압축하고, 접두사·inlineStr·수식 결과·후리가나·빈 칸을 쓴 파일
  const entry = (name, data) => ({ name, data });
  const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const zipCompressed = (files) => {
    const parts = [];
    const central = [];
    let at = 0;
    for (const { name, data } of files) {
      const raw2 = Buffer.from(data, "utf8");
      const body = zlib.deflateRawSync(raw2);
      const nameBytes = Buffer.from(name, "utf8");
      const crc = T.crc32(raw2);
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
      local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(raw2.length, 22); local.writeUInt16LE(nameBytes.length, 26);
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(8, 10);
      cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(body.length, 20); cd.writeUInt32LE(raw2.length, 24); cd.writeUInt16LE(nameBytes.length, 28); cd.writeUInt32LE(at, 42);
      parts.push(local, nameBytes, body);
      central.push(cd, nameBytes);
      at += local.length + nameBytes.length + body.length;
    }
    const cdBuf = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(cdBuf.length, 12); end.writeUInt32LE(at, 16);
    return Buffer.concat([...parts, cdBuf, end]);
  };
  const file = zipCompressed([
    entry("xl/workbook.xml", `<x:workbook xmlns:x="${main}" xmlns:r="r"><x:sheets><x:sheet name="메모" sheetId="1" r:id="rId1"/><x:sheet name="티어표" sheetId="2" r:id="rId2"/></x:sheets></x:workbook>`),
    entry("xl/_rels/workbook.xml.rels", `<Relationships><Relationship Id="rId1" Target="worksheets/a.xml"/><Relationship Id='rId2' Target='/xl/worksheets/b.xml'/></Relationships>`),
    entry("xl/sharedStrings.xml", `<sst><si><t>Tier</t></si><si><t>제목</t></si><si><t>읽은 화수</t></si><si><r><t>제</t></r><r><t xml:space="preserve">목 &amp; 1</t></r><rPh sb="0" eb="1"><t>후리가나</t></rPh></si><si><t>S</t></si></sst>`),
    entry("xl/worksheets/a.xml", `<x:worksheet xmlns:x="${main}"><x:sheetData><x:row r="1"><x:c r="A1" t="inlineStr"><x:is><x:t>아무 메모</x:t></x:is></x:c></x:row></x:sheetData></x:worksheet>`),
    entry("xl/worksheets/b.xml", `<x:worksheet xmlns:x="${main}"><x:sheetData><x:row r="3"><x:c r="B3" t="s"><x:v>0</x:v></x:c><x:c r="D3" t="s"><x:v>1</x:v></x:c><x:c r="E3" t="s"><x:v>2</x:v></x:c></x:row><x:row r="4" spans="1:5"><x:c r="B4" t="s"><x:v>4</x:v></x:c><x:c r="C4"/><x:c r="D4" t="s"><x:v>3</x:v></x:c><x:c r="E4"><x:f>10+2</x:f><x:v>12</x:v></x:c></x:row><x:row r="6"><x:c r="B6" t="str"><x:f>"A"</x:f><x:v>A</x:v></x:c><x:c r="D6" t="inlineStr"><x:is><x:t>두번째</x:t></x:is></x:c><x:c r="E6" t="e"><x:v>#N/A</x:v></x:c></x:row></x:sheetData></x:worksheet>`),
  ]);
  const table2 = T.readTierTable(T.readXlsx(file));
  check("다시 저장한 압축 파일에서 '티어표' 시트를 고른다", table2 && table2.rows.length === 2);
  check("서식 있는 글자를 잇고 후리가나를 뺀다", table2.rows[0].title === "제목 & 1");
  check("수식 칸은 계산 결과를 읽는다", table2.rows[0].read === 12 && table2.rows[1].tier === "A");
  check("오류 칸은 빈칸으로 본다", table2.rows[1].read === null);
  check("행 번호를 파일 그대로 쓴다", table2.rows[0].rowNumber === 4 && table2.rows[1].rowNumber === 6);
  check("열은 위치가 아니라 머리글로 찾는다", table2.columns.tier === 1 && table2.columns.title === 3 && table2.columns.read === 4 && table2.columns.rank === -1 && table2.columns.id === -1);

  let threw = 0;
  try { T.readXlsx(Buffer.from("이건 엑셀이 아니에요. 그냥 긴 글자입니다. 그냥 긴 글자입니다.")); } catch (e) { if (/xlsx/.test(e.message)) threw++; }
  const broken = Buffer.from(file);
  broken[60] ^= 0xff;
  try { T.readXlsx(broken); } catch { threw++; }
  check("엑셀이 아니거나 깨진 파일은 오류를 낸다", threw === 2);
  const noHeader = T.readXlsx(T.buildXlsx({ name: "다른 표", fontName: "x", fontSize: 11, columnWidths: [1], rows: [[{ value: "이름" }]] }));
  check("티어표가 아니면 찾지 못한다", T.readTierTable(noHeader) === null);
}

// ── 화수 칸 ──
check("화수 칸: 숫자", same(T.parseReadCell(120), { kind: "main", value: 120 }));
check("화수 칸: 글자 숫자와 쉼표", same(T.parseReadCell(" 1,200 "), { kind: "main", value: 1200 }));
check("화수 칸: 완결 표기", same(T.parseReadCell("400(完)"), { kind: "main", value: 400 }) && same(T.parseReadCell("400(완)"), { kind: "main", value: 400 }));
check("화수 칸: 외전 표기", same(T.parseReadCell("외전 26"), { kind: "gaiden", value: 26 }) && same(T.parseReadCell("외전26"), { kind: "gaiden", value: 26 }));
check("화수 칸: 빈칸은 null", T.parseReadCell(null) === null && T.parseReadCell("  ") === null);
check("화수 칸: 소수·음수·글자·너무 큰 값은 잘못된 값", [1.5, -1, "많이", "1e3", 99999999, "-3"].every((v) => T.parseReadCell(v).invalid));

// ── 왕복 멱등 ──
{
  const table = tableOf(WORKS);
  const base = snapshotOf(table);
  check("고치지 않은 파일은 아무것도 바꾸지 않고 경고도 없다", quiet(T.buildImportPlan({ table: exported(table), current: table, baseline: base })));
  const works = [work("a", "S", { read_count: 400, total_episodes: 400, work_status: "completed" }), work("b", "S", { read_count: 400, gaiden_status: "ongoing", gaiden_read_count: 26 }), work("c", "A", { read_count: 0 })];
  const table2 = tableOf(works);
  check("完과 외전 표기가 있어도 고치지 않으면 그대로다", quiet(T.buildImportPlan({ table: exported(table2), current: table2, baseline: snapshotOf(table2) })));
  const custom = tableOf(WORKS, "manual", TIERS, { S: "최고", A: "좋음", B: "보통" });
  const customRows = { ...custom, rows: custom.rows.map((r) => ({ ...r, tierLabel: custom.tierLabels[r.tier] })) };
  check("티어 이름을 따로 정해도 그대로다", quiet(T.buildImportPlan({ table: exported(customRows), current: customRows, baseline: snapshotOf(customRows) })));
  const hybrid = tableOf(WORKS, "hybrid");
  const match = tableOf(WORKS, "match");
  check("혼합·매칭 방식도 그대로다", quiet(T.buildImportPlan({ table: exported(hybrid), current: hybrid, baseline: snapshotOf(hybrid) })) && quiet(T.buildImportPlan({ table: exported(match), current: match, baseline: snapshotOf(match) })));

  // 내보낸 뒤 앱에서 바뀌어도 파일을 고치지 않았으면 덮어쓰지 않는다.
  const moved = tableOf([work("b", "S", { read_count: 99 }), work("a", "S"), work("n", "S"), work("c", "A"), work("d", "A"), work("f", "B")]);
  const plan = T.buildImportPlan({ table: exported(table), current: moved, baseline: base });
  check("내보낸 뒤 앱이 달라져도 고치지 않은 값은 덮지 않는다", plan.writes.length === 0 && plan.conflicts.length === 0, JSON.stringify(plan.writes));
  check("앱에서 지운 작품은 삭제로 되살리지 않고 건너뛴다", plan.skipped.length === 1 && plan.skipped[0].title === "제목e");

  const reordered = tableOf(WORKS, "manual", ["B", "A", "S"]);
  const planOrder = T.buildImportPlan({ table: exported(table), current: reordered, baseline: base });
  check("티어 구성의 순서만 바뀌면 작품이 움직인 것으로 보지 않는다", planOrder.writes.length === 0 && planOrder.notices.tierConfigChanged);
}

// ── 화수 변경과 충돌 ──
{
  const table = tableOf(WORKS);
  const base = snapshotOf(table);
  const plan = T.buildImportPlan({ table: exported(table, (rows) => setCell(rows, "c", COL.read, 50)), current: table, baseline: base });
  check("고친 화수만 바꾼다", plan.writes.length === 1 && plan.writes[0].id === "c" && plan.writes[0].setRead && plan.writes[0].afterRead === 50 && !plan.writes[0].setPlace && !plan.writes[0].setGaiden && same(plan.changes[0].read, { from: 10, to: 50 }));

  const later = tableOf([work("a", "S"), work("b", "S"), work("c", "A", { read_count: 30 }), work("d", "A"), work("e", "A"), work("f", "B")]);
  const file = exported(table, (rows) => setCell(rows, "c", COL.read, 50));
  const conflict = T.buildImportPlan({ table: file, current: later, baseline: base });
  check("양쪽에서 바뀐 화수는 충돌로 두고 앱 값을 지킨다", conflict.conflicts.length === 1 && conflict.conflicts[0].app === 30 && conflict.conflicts[0].file === 50 && !conflict.conflicts[0].chosen && conflict.writes.length === 0);
  const chosen = T.buildImportPlan({ table: file, current: later, baseline: base, useFile: new Set(["read:c"]) });
  check("충돌에서 파일 값을 고르면 적용한다", chosen.conflicts[0].chosen && chosen.writes.length === 1 && chosen.writes[0].afterRead === 50);
  const already = tableOf([work("a", "S"), work("b", "S"), work("c", "A", { read_count: 50 }), work("d", "A"), work("e", "A"), work("f", "B")]);
  check("이미 같은 값이면 충돌도 변경도 아니다", quiet(T.buildImportPlan({ table: file, current: already, baseline: base })));
  const noBase = T.buildImportPlan({ table: file, current: later, baseline: null });
  check("출력 기록이 없으면 앱 값과 비교하고 알린다", noBase.notices.noBaseline && noBase.conflicts.length === 0 && noBase.writes[0].afterRead === 50 && noBase.writes[0].beforeRead === 30);

  const gaidenWorks = [work("a", "S", { read_count: 400, gaiden_status: "ongoing", gaiden_read_count: 26 }), work("b", "S")];
  const gaidenTable = tableOf(gaidenWorks);
  const gaiden = T.buildImportPlan({ table: exported(gaidenTable, (rows) => setCell(rows, "a", COL.read, "외전 30")), current: gaidenTable, baseline: snapshotOf(gaidenTable) });
  check("외전 표기는 외전 화수만 바꾸고 본편은 건드리지 않는다", gaiden.writes[0].setGaiden && gaiden.writes[0].afterGaiden === 30 && !gaiden.writes[0].setRead && gaiden.writes[0].afterRead === 400);
  const gaidenMain = T.buildImportPlan({ table: exported(gaidenTable, (rows) => setCell(rows, "a", COL.read, 410)), current: gaidenTable, baseline: snapshotOf(gaidenTable) });
  check("외전 표기를 숫자로 고치면 본편 화수를 바꾼다", gaidenMain.writes[0].setRead && gaidenMain.writes[0].afterRead === 410 && !gaidenMain.writes[0].setGaiden);
  const noGaiden = T.buildImportPlan({ table: exported(gaidenTable, (rows) => setCell(rows, "b", COL.read, "외전 3")), current: gaidenTable, baseline: snapshotOf(gaidenTable) });
  check("외전이 없는 작품의 외전 표기는 건너뛴다", noGaiden.writes.length === 0 && /외전이 없는/.test(noGaiden.skipped[0].reason));

  const invalid = T.buildImportPlan({ table: exported(table, (rows) => setCell(setCell(rows, "a", COL.read, "많이"), "b", COL.read, null)), current: table, baseline: base });
  check("읽을 수 없거나 빈 화수는 건너뛰고 행 번호를 알린다", invalid.writes.length === 0 && invalid.skipped.length === 2 && invalid.skipped[0].rowNumber === 2 && /많이/.test(invalid.skipped[0].reason) && /비어/.test(invalid.skipped[1].reason));
}

// ── 티어와 순서 ──
{
  const table = tableOf(WORKS);
  const base = snapshotOf(table);
  const plan = (edit, current = table, baseline = base, useFile) => T.buildImportPlan({ table: exported(table, edit), current, baseline, useFile });

  const swap = plan((rows) => moveRow(rows, "e", "c"));
  check("행을 옮기면 그 작품만 움직인다", same(placeOf(swap), { e: "A1" }), JSON.stringify(placeOf(swap)));
  check("순서를 바꾼 티어만 쓴다", swap.writes.every((w) => ["c", "d", "e"].includes(w.id)) && same(swap.writes.map((w) => w.afterOrder), [200, 300, 100]));
  check("순서를 옮기면 순위 숫자와 어긋남을 알린다", swap.notices.rankMismatch > 0);

  const toLast = plan((rows) => setCell(rows, "a", COL.tier, "B"));
  check("티어 칸만 고쳐 다른 티어 자리에 남으면 그 티어 맨 뒤로 간다", same(placeOf(toLast), { a: "B2" }), JSON.stringify(placeOf(toLast)));
  const edge = plan((rows) => setCell(rows, "c", COL.tier, "S"));
  check("경계의 행은 놓인 자리를 따른다", same(placeOf(edge), { c: "S3" }), JSON.stringify(placeOf(edge)));
  const edge2 = plan((rows) => setCell(rows, "b", COL.tier, "A"));
  check("티어 첫 자리 바로 앞의 행은 맨 앞으로 간다", same(placeOf(edge2), { b: "A1" }), JSON.stringify(placeOf(edge2)));
  const dragged = plan((rows) => setCell(moveRow(rows, "a", "d"), "a", COL.tier, "A"));
  check("행을 옮기고 티어도 고치면 놓은 자리로 간다", same(placeOf(dragged), { a: "A2" }), JSON.stringify(placeOf(dragged)));

  const byLabel = tableOf(WORKS, "manual", TIERS, { S: "최고", A: "좋음", B: "보통" });
  const labelled = T.buildImportPlan({ table: exported(table, (rows) => setCell(rows, "a", COL.tier, " 보통 ")), current: byLabel, baseline: base });
  check("티어는 이름으로도 찾는다", same(placeOf(labelled), { a: "보통2" }), JSON.stringify(placeOf(labelled)));
  const lowerCase = plan((rows) => setCell(rows, "a", COL.tier, "b"));
  check("티어 대소문자는 가리지 않는다", same(placeOf(lowerCase), { a: "B2" }));

  const unknown = plan((rows) => setCell(rows, "a", COL.tier, "Z"));
  check("없는 티어는 건너뛰고 나머지를 움직이지 않는다", unknown.writes.length === 0 && /'Z' 티어/.test(unknown.skipped[0].reason));
  const blank = plan((rows) => setCell(rows, "a", COL.tier, null));
  check("빈 티어는 건너뛴다", blank.writes.length === 0 && /비어/.test(blank.skipped[0].reason));

  const later = tableOf([work("n", "A"), work("a", "S"), work("b", "S"), work("c", "A"), work("d", "A"), work("e", "A"), work("f", "B")].sort((x, y) => "SAB".indexOf(x.tier) - "SAB".indexOf(y.tier)));
  const withNew = plan((rows) => moveRow(rows, "e", "d"), later);
  const orderedA = withNew.writes.filter((w) => w.setPlace).sort((x, y) => x.afterOrder - y.afterOrder).map((w) => w.id);
  check("내보낸 뒤 앱에 추가한 작품을 지우거나 밀어내지 않는다", same(orderedA, ["n", "c", "e", "d"]) || same(orderedA, ["c", "e", "d"]), JSON.stringify(orderedA));
  check("내보낸 뒤 앱에 추가한 작품이 자리를 지킨다", !withNew.writes.some((w) => w.id === "n" && w.afterTier !== "A"));

  const appMoved = tableOf([work("a", "S"), work("b", "S"), work("e", "A"), work("c", "A"), work("d", "A"), work("f", "B")]);
  const conflict = plan((rows) => setCell(rows, "e", COL.tier, "B"), appMoved);
  check("양쪽에서 옮긴 작품은 충돌로 두고 앱 자리를 지킨다", conflict.conflicts.length === 1 && conflict.conflicts[0].field === "place" && conflict.conflicts[0].app === "A 1위" && conflict.writes.length === 0, JSON.stringify(conflict.conflicts));
  const chosen = plan((rows) => setCell(rows, "e", COL.tier, "B"), appMoved, base, new Set(["place:e"]));
  check("자리 충돌에서 파일을 고르면 옮긴다", same(placeOf(chosen), { e: "B1" }), JSON.stringify(placeOf(chosen)));
  const onlyApp = plan((rows) => moveRow(rows, "b", "a"), appMoved);
  const orderS = onlyApp.writes.filter((w) => w.setPlace).sort((x, y) => x.afterOrder - y.afterOrder).map((w) => w.id);
  check("파일에서 옮긴 것만 반영하고 앱에서만 옮긴 작품은 앱 자리를 유지한다", same(orderS, ["b", "a"]) && !onlyApp.writes.some((w) => ["c", "d", "e"].includes(w.id)), JSON.stringify(orderS));

  for (const mode of ["match", "ratio"]) {
    const rated = tableOf(WORKS, mode);
    const p = T.buildImportPlan({
      table: exported(rated, (rows) => setCell(setCell(moveRow(rows, "e", "c"), "a", COL.tier, "B"), "c", COL.read, 77)),
      current: rated,
      baseline: snapshotOf(rated),
    });
    check(`${mode} 방식은 화수만 받고 티어·순서는 알리고 버린다`, p.writes.length === 1 && p.writes[0].id === "c" && !p.writes[0].setPlace && p.notices.placementBlocked === "mode" && p.notices.placementIgnored === 2 && p.skipped.length === 0, JSON.stringify(p.notices));
  }
  const switched = T.buildImportPlan({ table: exported(table, (rows) => moveRow(rows, "e", "c")), current: table, baseline: { ...base, tierMode: "match" } });
  check("내보낸 뒤 티어 방식이 바뀌면 티어·순서를 받지 않는다", switched.writes.length === 0 && switched.notices.placementBlocked === "mode_changed" && switched.notices.placementIgnored === 1);

  const nullTier = tableOf([work("a", "S", { manual_tier: null }), work("b", "S", { manual_tier: null }), work("c", "S")], "hybrid");
  const pin = T.buildImportPlan({ table: exported(nullTier, (rows) => moveRow(rows, "c", "a")), current: nullTier, baseline: snapshotOf(nullTier) });
  const pinOf = Object.fromEntries(pin.writes.map((w) => [w.id, w]));
  check("혼합 방식에서 옮긴 작품만 티어를 고정하고 나머지는 점수 티어로 둔다", pinOf.c.afterTier === "S" && pinOf.a.afterTier === null && pinOf.b.afterTier === null && pinOf.c.afterOrder === 100, JSON.stringify(pin.writes));

  const sorted = plan((rows) => { const [head, ...body] = rows; return [head, ...body.reverse()]; });
  check("표를 뒤집으면 많이 바뀌었다고 알리는 기준은 작품 수를 본다", sorted.notices.manyMoved === 0 && Object.keys(placeOf(sorted)).length > 0);
  const manyWorks = Array.from({ length: 20 }, (_, i) => work(`w${String(i).padStart(2, "0")}`, "A"));
  const manyTable = tableOf(manyWorks);
  const many = T.buildImportPlan({ table: exported(manyTable, (rows) => { const [head, ...body] = rows; return [head, ...body.reverse()]; }), current: manyTable, baseline: snapshotOf(manyTable) });
  check("정렬처럼 많이 바뀌면 알린다", many.notices.manyMoved > 6);
  const after = many.writes.sort((a, b) => a.afterOrder - b.afterOrder).map((w) => w.id);
  check("많이 바뀌어도 결과가 파일 순서와 같다", same(after, manyWorks.map((w) => w.id).reverse()));

  // 임의 편집: 앱이 그대로면 결과 순서가 언제나 파일 순서와 같다.
  let s = 4242;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  let ok = true;
  for (let t = 0; t < 100 && ok; t++) {
    const works = Array.from({ length: 30 }, (_, i) => work(`r${i}`, TIERS[Math.floor(i / 10)]));
    const start = tableOf(works);
    const file = exported(start, (rows) => {
      const [head, ...body] = rows;
      for (let k = 0; k < 6; k++) {
        const [row] = body.splice(Math.floor(rnd() * body.length), 1);
        const at = Math.floor(rnd() * body.length);
        // 옮긴 자리의 앞 행과 같은 티어로 맞춰 '놓은 자리'가 분명한 편집만 만든다.
        const near = body[at - 1] || body[at];
        row[COL.tier] = { value: near[COL.tier].value };
        body.splice(at, 0, row);
      }
      return [head, ...body];
    });
    const p = T.buildImportPlan({ table: file, current: start, baseline: snapshotOf(start) });
    const finalTier = new Map(start.rows.map((r) => [r.id, r.tier]));
    const finalOrder = new Map(start.rows.map((r) => [r.id, r.manualOrder]));
    for (const w of p.writes) if (w.setPlace) { finalTier.set(w.id, w.afterTier); finalOrder.set(w.id, w.afterOrder); }
    for (const tier of TIERS) {
      const expected = file.rows.filter((r) => r.tier === tier).map((r) => r.id);
      const got = start.rows.filter((r) => finalTier.get(r.id) === tier).sort((a, b) => finalOrder.get(a.id) - finalOrder.get(b.id)).map((r) => r.id);
      if (expected.length !== got.length) ok = false;
      if (new Set(got).size !== got.length) ok = false;
    }
    // 같은 값 재비교: 적용한 뒤의 표로 다시 계획하면 바뀔 것이 없다.
    const appliedRows = tableOf(TIERS.flatMap((tier) => start.rows
      .filter((r) => finalTier.get(r.id) === tier)
      .sort((a, b) => finalOrder.get(a.id) - finalOrder.get(b.id))
      .map((r, i) => work(r.id, tier, { manual_order: (i + 1) * 100 }))));
    const again = T.buildImportPlan({ table: file, current: appliedRows, baseline: snapshotOf(start) });
    if (again.writes.length !== 0 || again.conflicts.length !== 0) { ok = false; console.log(JSON.stringify(again.writes), JSON.stringify(again.conflicts)); }
  }
  check("임의 편집: 작품이 사라지거나 겹치지 않고, 적용 뒤 같은 파일을 다시 가져오면 바뀌는 것이 없다", ok);
}

// ── 작품 찾기 ──
{
  const table = tableOf(WORKS);
  const base = snapshotOf(table);
  const copy = T.buildImportPlan({ table: exported(table, (rows) => [...rows, rows[1].map((c) => c && { ...c })]), current: table, baseline: base });
  check("같은 작품이 여러 행이면 모두 건너뛴다", copy.skipped.length === 2 && copy.skipped.every((x) => /여러 행/.test(x.reason)) && copy.writes.length === 0);
  const newRow = T.buildImportPlan({ table: exported(table, (rows) => [...rows, [null, { value: "S" }, { value: 1 }, { value: "없는 작품" }, { value: 3 }]]), current: table, baseline: base });
  check("앱에 없는 작품은 추가하지 않고 건너뛴다", newRow.skipped.length === 1 && /추가/.test(newRow.skipped[0].reason) && newRow.writes.length === 0);
  const missing = T.buildImportPlan({ table: exported(table, (rows) => rows.filter((r) => r[COL.id]?.value !== "a")), current: table, baseline: base });
  check("파일에서 지운 행은 삭제가 아니다", missing.writes.length === 0 && missing.notices.missingFromFile === 1);
  const renamed = T.buildImportPlan({ table: exported(table, (rows) => setCell(rows, "a", COL.title, "새 제목")), current: table, baseline: base });
  check("ID로 찾은 행의 제목 변경은 반영하지 않고 알린다", renamed.writes.length === 0 && renamed.notices.titleIgnored === 1);

  // 복원하면 작품 ID가 새로 만들어질 수 있다: 파일은 옛 ID, 기록은 새 ID.
  const fresh = tableOf(WORKS.map((w) => ({ ...w, id: `new-${w.id}` })));
  const restored = T.buildImportPlan({ table: exported(table, (rows) => setCell(rows, "c", COL.read, 50)), current: fresh, baseline: snapshotOf(fresh) });
  check("복원으로 ID가 바뀌어도 제목으로 찾아 고친 값만 반영한다", restored.writes.length === 1 && restored.writes[0].id === "new-c" && restored.writes[0].afterRead === 50 && restored.skipped.length === 0);
  const twins = tableOf([work("x", "S", { title: "같은 제목" }), work("y", "S", { title: "같은 제목" })]);
  const noId = T.readTierTable({ sheets: [{ name: "티어표", rows: [{ rowNumber: 1, cells: ["Tier", "제목", "읽은 화수"] }, { rowNumber: 2, cells: ["S", "같은 제목", 9] }] }] });
  const ambiguous = T.buildImportPlan({ table: noId, current: twins, baseline: null });
  check("ID 없이 제목이 겹치면 고르지 않고 건너뛴다", ambiguous.writes.length === 0 && /같은 제목/.test(ambiguous.skipped[0].reason));
  const readOnly = T.readTierTable({ sheets: [{ name: "x", rows: [{ rowNumber: 1, cells: ["제목", "읽은 화수"] }, { rowNumber: 2, cells: ["제목a", 77] }] }] });
  const readOnlyPlan = T.buildImportPlan({ table: readOnly, current: table, baseline: null });
  check("티어 열이 없으면 티어·순서는 그대로 두고 화수만 읽는다", readOnlyPlan.writes.length === 1 && readOnlyPlan.writes[0].afterRead === 77 && !readOnlyPlan.writes[0].setPlace);
  const tierOnly = T.readTierTable({ sheets: [{ name: "x", rows: [{ rowNumber: 1, cells: ["제목", "Tier"] }, { rowNumber: 2, cells: ["제목a", "B"] }] }] });
  const tierOnlyPlan = T.buildImportPlan({ table: tierOnly, current: table, baseline: null });
  check("화수 열이 없으면 화수는 그대로 둔다", tierOnlyPlan.writes.every((w) => !w.setRead) && tierOnlyPlan.skipped.length === 0);
}

// ── 적용과 되돌리기 (진짜 SQLite) ──
function makeDb() {
  const raw = new DatabaseSync(":memory:");
  let idCounter = 0;
  const plain = (value) => JSON.parse(JSON.stringify(value));
  const db = {
    raw,
    newId: () => `id${++idCounter}`,
    exec: async (sql, params = []) => raw.prepare(sql).run(...params),
    all: async (sql, params = []) => plain(raw.prepare(sql).all(...params)),
    first: async (sql, params = []) => { const r = raw.prepare(sql).get(...params); return r ? plain(r) : null; },
    // 앱의 execBatch처럼 50개씩 나눠 각각 트랜잭션으로 돌린다.
    execBatch: async (queries) => {
      for (let i = 0; i < queries.length; i += 50) {
        raw.exec("BEGIN");
        try {
          for (const { sql, params } of queries.slice(i, i + 50)) raw.prepare(sql).run(...(params || []));
          raw.exec("COMMIT");
        } catch (e) { raw.exec("ROLLBACK"); throw e; }
      }
    },
  };
  raw.exec("CREATE TABLE novels (id TEXT PRIMARY KEY, title TEXT, manual_tier TEXT, manual_order INTEGER, read_count INTEGER, read_count_updated_at INTEGER, gaiden_read_count INTEGER)");
  return db;
}
{
  const db = makeDb();
  await T.ensureTierExportSchema((sql) => db.raw.exec(sql));
  await T.ensureTierExportSchema((sql) => db.raw.exec(sql));
  check("표가 복원 스냅샷과 초기화에 등록된다", T.TIER_EXPORT_TABLES.includes("tier_import_apply") && T.TIER_EXPORT_TABLES.includes("tier_import_apply_item"));
  const works = [work("a", "S", { manual_order: 100 }), work("b", "S", { manual_order: 200 }), work("c", "A", { manual_order: 100 }), work("d", "A", { manual_order: 200, gaiden_status: "ongoing", gaiden_read_count: 5 })];
  for (const w of works) db.raw.prepare("INSERT INTO novels VALUES (?, ?, ?, ?, ?, ?, ?)").run(w.id, w.title, w.manual_tier, w.manual_order, w.read_count, w.read_count_updated_at, w.gaiden_read_count);
  const dump = () => JSON.stringify(db.raw.prepare("SELECT * FROM novels ORDER BY id").all());
  const before = dump();
  const table = tableOf(works);
  const baseline = snapshotOf(table);

  const exportId = await T.saveSnapshot(db, { id: "fixed-export", fileName: "a.xlsx", tierMode: "manual", tierOrder: TIERS, rows: table.rows });
  check("출력본 ID를 정해 저장한다", exportId === "fixed-export" && (await T.loadSnapshot(db, "fixed-export")).items.length === 4);
  const backup = JSON.parse(JSON.stringify(await T.buildBackup(db)));
  check("백업에 출력본 ID가 들어간다", backup[0].i === "fixed-export");
  const restoredDb = makeDb();
  await T.ensureTierExportSchema((sql) => restoredDb.raw.exec(sql));
  await restoredDb.execBatch(T.restoreQueries(backup, (id) => id, restoredDb.newId));
  check("복원 뒤에도 파일의 출력본 ID로 기록을 찾는다", (await T.loadSnapshot(restoredDb, "fixed-export"))?.items.length === 4);
  delete backup[0].i;
  const oldDb = makeDb();
  await T.ensureTierExportSchema((sql) => oldDb.raw.exec(sql));
  await oldDb.execBatch(T.restoreQueries(backup, (id) => id, oldDb.newId));
  check("출력본 ID가 없는 옛 백업도 복원한다", (await oldDb.first("SELECT COUNT(*) AS n FROM tier_export_snapshot")).n === 1);

  const file = exported(table, (rows) => setCell(setCell(moveRow(rows, "d", "c"), "a", COL.read, 42), "d", COL.read, "외전 8"));
  const plan = T.buildImportPlan({ table: file, current: table, baseline });
  const { applyId } = await T.applyImport(db, { writes: plan.writes, fileName: "고친.xlsx", itemCount: plan.changes.length });
  const row = (id) => db.raw.prepare("SELECT * FROM novels WHERE id=?").get(id);
  check("화수를 쓰고 화수 시각을 새로 적는다", row("a").read_count === 42 && row("a").read_count_updated_at > 111);
  check("고치지 않은 작품은 값이 그대로다", row("b").read_count === 10 && row("b").manual_order === 200 && row("b").read_count_updated_at === 111);
  check("옮긴 순서를 쓴다", row("d").manual_order === 100 && row("c").manual_order === 200 && row("c").manual_tier === "A");
  check("외전 화수를 쓰고 본편 화수와 시각은 그대로다", row("d").gaiden_read_count === 8 && row("d").read_count === 10 && row("d").read_count_updated_at === 111);
  const latest = await T.getLatestImport(db);
  check("가져오기 기록을 남긴다", latest.id === applyId && latest.file_name === "고친.xlsx" && latest.item_count === plan.changes.length);

  const again = T.buildImportPlan({ table: file, current: tableOf([work("a", "S", { manual_order: 100, read_count: 42 }), work("b", "S", { manual_order: 200 }), work("d", "A", { manual_order: 100, gaiden_status: "ongoing", gaiden_read_count: 8 }), work("c", "A", { manual_order: 200 })]), baseline });
  check("적용한 파일을 다시 가져오면 바뀌는 것이 없다", again.writes.length === 0 && again.conflicts.length === 0, JSON.stringify(again));

  check("다른 ID로는 되돌리지 않는다", (await T.revertImport(db, "없음")).ok === false);
  const reverted = await T.revertImport(db, applyId);
  check("되돌리면 모든 값이 처음과 같다", reverted.ok && dump() === before && reverted.keptRead === 0, dump());
  check("되돌린 기록은 다시 되돌릴 수 없다", (await T.getLatestImport(db)) === null && (await T.revertImport(db)).ok === false);

  const second = await T.applyImport(db, { writes: plan.writes, fileName: "b.xlsx", itemCount: 1 });
  db.raw.prepare("UPDATE novels SET read_count=500, read_count_updated_at=999 WHERE id='a'").run();
  const kept = await T.revertImport(db);
  check("가져온 뒤 앱에서 또 고친 화수는 되돌릴 때 지우지 않고 알린다", kept.ok && kept.applyId === second.applyId && row("a").read_count === 500 && row("a").read_count_updated_at === 999 && kept.keptRead === 1 && row("d").gaiden_read_count === 5);
  check("순서를 바꾼 가져오기는 다른 작품의 티어를 다시 매기게 한다", kept.tiersToReorder.includes("S"));

  const readOnly = plan.writes.filter((w) => w.id === "a" && w.setRead).map((w) => ({ ...w, setPlace: false }));
  await T.applyImport(db, { writes: readOnly, fileName: "c.xlsx", itemCount: 1 });
  const readRevert = await T.revertImport(db);
  check("화수만 바꾼 가져오기는 순서를 건드리지 않는다", readRevert.tiersToReorder.length === 0);

  for (let i = 0; i < 8; i++) await T.applyImport(db, { writes: readOnly, fileName: `p${i}.xlsx`, itemCount: 1 });
  check("가져오기 기록은 5개까지 남긴다", (await db.first("SELECT COUNT(*) AS n FROM tier_import_apply")).n === 5 && (await db.first("SELECT COUNT(*) AS n FROM tier_import_apply_item")).n === 5);

  // 50개를 넘어도 한 문장으로 적용한다.
  const bulk = makeDb();
  await T.ensureTierExportSchema((sql) => bulk.raw.exec(sql));
  const bulkWorks = Array.from({ length: 180 }, (_, i) => work(`w${i}`, "A", { manual_order: (i + 1) * 100 }));
  for (const w of bulkWorks) bulk.raw.prepare("INSERT INTO novels VALUES (?, ?, ?, ?, ?, ?, ?)").run(w.id, w.title, w.manual_tier, w.manual_order, w.read_count, w.read_count_updated_at, w.gaiden_read_count);
  const bulkTable = tableOf(bulkWorks);
  const bulkPlan = T.buildImportPlan({ table: exported(bulkTable, (rows) => moveRow(rows, "w170", "w0")), current: bulkTable, baseline: snapshotOf(bulkTable) });
  const execLog = [];
  const realBatch = bulk.execBatch;
  bulk.execBatch = async (queries) => { execLog.push(queries.filter((q) => /UPDATE novels/.test(q.sql)).length); return realBatch(queries); };
  await T.applyImport(bulk, { writes: bulkPlan.writes, fileName: "b.xlsx", itemCount: 1 });
  const orderOf = bulk.raw.prepare("SELECT id FROM novels ORDER BY manual_order, id").all().map((r) => r.id);
  check("작품이 많아도 UPDATE 한 문장으로 적용한다", bulkPlan.writes.length > 50 && execLog.reduce((a, b) => a + b, 0) === 1 && orderOf[0] === "w170" && orderOf[1] === "w0", `${bulkPlan.writes.length}`);

  // 전후 값을 쓴 뒤 앱이 꺼진 경우
  const crash = makeDb();
  await T.ensureTierExportSchema((sql) => crash.raw.exec(sql));
  crash.raw.prepare("INSERT INTO tier_import_apply_item (apply_id, novel_id) VALUES ('죽은기록', 'a')").run();
  await T.applyImport(crash, { writes: [], fileName: "x", itemCount: 0 });
  check("적용 도중 꺼져 남은 전후 값을 치운다", (await crash.first("SELECT COUNT(*) AS n FROM tier_import_apply_item")).n === 0);
}

// ── App.jsx 연결 ──
const appSrc = read("App.jsx");
check("되돌리기 스택에 등록한다", appSrc.includes('pushUndo("tier_import_apply"') && appSrc.includes("case 'tier_import_apply'"));
check("슬롯을 바꾸면 화면을 닫는다", /setTierExportOpen\(false\);\s*setTierImportOpen\(false\);/.test(appSrc));
const screenSrc = read("src/features/tier-export/TierImportScreen.js");
check("가져오기 화면은 Alert를 쓰지 않는다", !/Alert\./.test(screenSrc) && !/\bAlert\b.*from/.test(screenSrc));
check("적용과 되돌리기는 자동매칭 중에 막고 매칭 큐를 비운다", (screenSrc.match(/isBlocked\(\)/g) || []).length >= 3 && (screenSrc.match(/beforeRankWrite\(\)/g) || []).length === 2);

console.log(`\n${pass}/${pass + fail} 통과`);
process.exit(fail ? 1 : 0);
