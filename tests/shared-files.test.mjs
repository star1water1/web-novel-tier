// 공유 파일 삭제 보호 회귀 테스트 (node — RN 불필요)
//   App.jsx의 실제 함수 소스를 떼어 가짜 파일시스템·슬롯 DB 위에서 실행한다.
//   실제 파일과 SQLite 동작은 폰에서 확인해야 한다.
//   실행: node tests/shared-files.test.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, "..", "App.jsx"), "utf8").replace(/\r\n/g, "\n");

function fnSource(head) {
  const start = src.indexOf("\n" + head);
  if (start < 0) throw new Error(`App.jsx에서 못 찾음: ${head}`);
  return src.slice(start + 1, src.indexOf("\n}\n", start) + 2);
}
function constArraySource(head) {
  const start = src.indexOf("\n" + head);
  if (start < 0) throw new Error(`App.jsx에서 못 찾음: ${head}`);
  return src.slice(start + 1, src.indexOf("\n];\n", start) + 3);
}

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}

const code = [
  fnSource("async function deleteCoverFromLibrary("),
  fnSource("async function forEachOtherSlotDb("),
  fnSource("async function deleteGalleryFilesUnusedByOtherSlots("),
  constArraySource("const FILE_REF_QUERIES = ["),
  fnSource("async function readFileRefs("),
  fnSource("async function deleteFilesUnusedAnywhere("),
  fnSource("function isImageQuote("),
  fnSource("function getQuoteStyle("),
  fnSource("function parseQuotes("),
  fnSource("function quoteFilePaths("),
  "globalThis.__F = { deleteFilesUnusedAnywhere, deleteGalleryFilesUnusedByOtherSlots, quoteFilePaths };",
].join("\n");

const ROOT = "file:///app/";
const cover = (name) => `${ROOT}covers/${name}.jpg`;
const quoteText = (...uris) => JSON.stringify(uris.map((uri) => ({ type: "image", uri })));
const bgQuote = (uri) => JSON.stringify([{ type: "text", text: "문장", style: { bgImage: uri } }]);

// tables: { novels: [{cover_image, memorable_quote}], planned_novels: [...], cover_library: [{file_path}], gallery_images: [{file_path}] }
function fakeDb(db) {
  const tables = db.tables || {};
  const run = (sql) => {
    if (db.broken) throw new Error("db broken");
    if (sql.includes("sqlite_master")) {
      const named = /name='(\w+)'/.exec(sql);
      const names = Object.keys(tables).filter((t) => !named || t === named[1]);
      return names.map((name) => ({ name }));
    }
    const table = /FROM (\w+)/.exec(sql)[1];
    if (!(table in tables)) throw new Error(`no such table: ${table}`);
    if (table === "gallery_images" && sql.startsWith("SELECT file_path FROM")) return tables[table];
    if (table === "novels" || table === "planned_novels") {
      return tables[table].map((r) => ({ a: r.cover_image || null, b: r.memorable_quote || null }));
    }
    if (table === "cover_library" || table === "gallery_images") return tables[table].map((r) => ({ a: r.file_path, b: null }));
    return [];
  };
  return {
    getAllAsync: async (sql) => run(sql),
    getFirstAsync: async (sql) => {
      if (sql.includes("app_meta")) return db.settings ? { value: db.settings } : null;
      return run(sql)[0] || null;
    },
    closeAsync: async () => { db.closed = true; },
  };
}

// 슬롯 0이 활성이다. files에 있는 파일 중 지워지지 않고 남은 목록을 돌려준다.
async function scenario({ active = {}, others = {}, files = [], run }) {
  const remaining = new Set(files);
  const opened = [];
  const box = {
    console: { warn: () => {} },
    activeSlotId: 0,
    getSlotDbFilename: (id) => (id === 0 ? "novel_tiers.db" : `novel_tiers_slot${id}.db`),
    FileSystem: {
      documentDirectory: ROOT,
      readDirectoryAsync: async () => ["novel_tiers.db", "novel_tiers.db-wal", ...Object.keys(others), "other.txt"],
      getInfoAsync: async (uri) => ({ exists: remaining.has(uri) }),
      deleteAsync: async (uri) => { remaining.delete(uri); },
    },
    SQLite: {
      openDatabaseAsync: async (name) => { opened.push(name); return fakeDb(others[name]); },
    },
    all: async (sql) => fakeDb(active).getAllAsync(sql),
  };
  vm.createContext(box);
  vm.runInContext(code, box, { filename: "App.jsx#shared-files" });
  await run(box.__F);
  return { remaining: [...remaining], opened, others };
}

const a = cover("aaaa");
const b = cover("bbbb");

// ── 보존해야 하는 경우 ──
let r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { novels: [{ memorable_quote: quoteText(a) }] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("다른 슬롯의 명대사 이미지는 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { planned_novels: [{ memorable_quote: bgQuote(a) }] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("다른 슬롯 예정작의 서식 배경은 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { novels: [{ cover_image: a }] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("다른 슬롯의 작품 표지는 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { cover_library: [{ file_path: a }] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("다른 슬롯의 표지 라이브러리 파일은 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { novels: [] }, settings: JSON.stringify({ quoteDefaultStyle: { bgImage: a } }) } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("다른 슬롯의 기본 서식 배경은 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  active: { tables: { novels: [{ memorable_quote: bgQuote(a) }] } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("같은 슬롯의 다른 작품이 쓰면 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  run: (f) => f.deleteFilesUnusedAnywhere([a], { quoteDefaultStyle: { bgImage: a } }),
});
check("현재 기본 서식 배경은 지우지 않는다", r.remaining.includes(a));

// ── 지워야 하는 경우 ──
r = await scenario({
  files: [a, b],
  active: { tables: { novels: [{ cover_image: b }] } },
  others: { "novel_tiers_slot1.db": { tables: { novels: [] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([a, b], {}),
});
check("아무도 안 쓰는 파일만 지운다", !r.remaining.includes(a) && r.remaining.includes(b));
check("다른 슬롯 DB를 닫는다", r.others["novel_tiers_slot1.db"].closed === true);

r = await scenario({
  files: [a],
  run: (f) => f.deleteFilesUnusedAnywhere([a], { quoteDefaultStyle: null }),
});
check("기본 서식에서 비운 배경은 지운다", !r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { novels: [] } } },
  run: async (f) => { await f.deleteFilesUnusedAnywhere([a, a, null, ""], {}); },
});
check("중복과 빈 값을 처리한다", !r.remaining.includes(a));

// ── 확인할 수 없으면 지우지 않는다 ──
r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { broken: true } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("다른 슬롯 DB를 못 읽으면 지우지 않는다", r.remaining.includes(a));
check("읽기에 실패한 DB도 닫는다", r.others["novel_tiers_slot1.db"].closed === true);

r = await scenario({
  files: [a],
  active: { broken: true },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("현재 슬롯 DB를 못 읽으면 지우지 않는다", r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { novels: [] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([], {}),
});
check("지울 파일이 없으면 다른 슬롯 DB를 열지 않는다", r.opened.length === 0 && r.remaining.includes(a));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { tables: { novels: [] } } },
  run: (f) => f.deleteFilesUnusedAnywhere([a], {}),
});
check("슬롯 DB가 아닌 파일은 열지 않는다", r.opened.join() === "novel_tiers_slot1.db", r.opened.join());

// ── 갤러리 삭제는 기존 동작 유지 ──
r = await scenario({
  files: [a, b],
  others: { "novel_tiers_slot1.db": { tables: { gallery_images: [{ file_path: a }] } } },
  run: (f) => f.deleteGalleryFilesUnusedByOtherSlots([a, b]),
});
check("갤러리: 다른 슬롯이 쓰는 파일만 남긴다", r.remaining.includes(a) && !r.remaining.includes(b));

r = await scenario({
  files: [a],
  others: { "novel_tiers_slot1.db": { broken: true } },
  run: (f) => f.deleteGalleryFilesUnusedByOtherSlots([a]),
});
check("갤러리: 다른 슬롯 DB를 못 읽으면 지우지 않는다", r.remaining.includes(a));

// ── 명대사 파일 경로 ──
r = await scenario({
  run: async (f) => {
    const mixed = JSON.stringify([{ type: "image", uri: a }, { type: "text", text: "문장", style: { bgImage: b } }, "일반 문장"]);
    check("명대사의 이미지와 배경 경로를 모은다", f.quoteFilePaths(mixed).join() === [a, b].join());
    check("명대사가 없으면 빈 목록", f.quoteFilePaths(null).length === 0 && f.quoteFilePaths("").length === 0);
  },
});

// ── 호출처 (소스 정적 검사) ──
const unguarded = [
  "if (isImageQuote(q) && q.uri) FileSystem.deleteAsync(q.uri",
  "if (_st && _st.bgImage) FileSystem.deleteAsync(_st.bgImage",
  "await deleteCoverFromLibrary(cover.file_path)",
  "await deleteCoverFromLibrary(cv.file_path)",
];
for (const text of unguarded) check(`확인 없는 삭제가 없다: ${text.slice(0, 40)}`, !src.includes(text));
const callCount = (src.match(/\bdeleteSharedFiles\(/g) || []).length - 1; // 선언 제외
check("작품·예정작·편집·표지 경로가 보호된 삭제를 쓴다", callCount === 10, `${callCount}곳`);
check("기본 서식 경로 2곳이 보호된 삭제를 쓴다", (src.match(/deleteFilesUnusedAnywhere\(\[[^\]]+\], \{ \.\.\.appSettingsRef\.current, quoteDefaultStyle: null \}\)/g) || []).length === 2);

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "❌ FAILED"}  pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
