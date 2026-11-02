// 백업 형식 호환성 회귀 테스트 (node — RN 불필요)
//   App.jsx의 실제 함수 소스를 떼어 vm에서 실행하고, 내보내기와 복원 코드의 항목을 대조한다.
//   importJSON은 Alert·DB·React 상태에 묶여 있어 실행하지 않는다. 실제 복원은 폰에서 확인해야 한다.
//   실행: node tests/backup-compat.test.mjs
//   백업 형식을 일부러 넓혔으면(항목 추가): node tests/backup-compat.test.mjs --write-fixture
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fixturePath = path.join(__dirname, "backup-fixtures", "v13-sample.json");
const src = fs.readFileSync(path.join(root, "App.jsx"), "utf8").replace(/\r\n/g, "\n");

// 최상위(들여쓰기 없는) 함수의 소스를 닫는 중괄호까지 떼어낸다.
function fnSource(head) {
  const start = src.indexOf("\n" + head);
  if (start < 0) throw new Error(`App.jsx에서 못 찾음: ${head}`);
  return src.slice(start + 1, src.indexOf("\n}\n", start) + 2);
}
const lineSource = (head) => {
  const start = src.indexOf("\n" + head);
  if (start < 0) throw new Error(`App.jsx에서 못 찾음: ${head}`);
  return src.slice(start + 1, src.indexOf("\n", start + 1));
};
const keysOf = (re, text) => [...new Set([...text.matchAll(re)].map((m) => m[1]))].sort();

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}
const missing = (need, have) => need.filter((k) => !have.includes(k));

// 값이 expected에 있는 항목을 모두 유지하는지 본다. 새 항목 추가는 허용한다.
function isSuperset(actual, expected) {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && expected.every((v, i) => isSuperset(actual[i], v));
  }
  if (expected && typeof expected === "object") {
    return !!actual && typeof actual === "object" && Object.keys(expected).every((k) => isSuperset(actual[k], expected[k]));
  }
  return actual === expected;
}

const sandbox = {
  FileSystem: { EncodingType: { Base64: "base64" }, readAsStringAsync: async () => "" },
  globalSlotMode: "novel",
};
vm.createContext(sandbox);
vm.runInContext(
  [
    "Date.now = () => 1790000000000;", // 백업의 기본 시각이 실행 시점에 따라 달라지지 않게 고정한다
    lineSource("const B64_CHARS ="),
    fnSource("function encodeBase64("),
    fnSource("function decodeBase64("),
    lineSource("const BACKUP_STATUS_ENCODE ="),
    lineSource("const BACKUP_WORK_STATUS_ENCODE ="),
    lineSource("const BASE_TIMESTAMP ="),
    fnSource("function isImageQuote("),
    fnSource("function parseQuotes("),
    fnSource("async function buildUltraCompactBackup("),
    fnSource("function validateImportData("),
    "globalThis.__B = { buildUltraCompactBackup, validateImportData, decodeBase64 };",
  ].join("\n"),
  sandbox,
  { filename: "App.jsx#backup" }
);
const { buildUltraCompactBackup, validateImportData, decodeBase64 } = sandbox.__B;

const NOVELS = [
  {
    id: "n1", title: "테스트 작품 A", author: "작가 1", tags: "회귀, 먼치킨", platforms: JSON.stringify(["문피아", "리디"]),
    rating: 1623.4, rd: 120, wins: 5, losses: 2, match_count: 7, read_count: 120, total_episodes: 300,
    status: "completed", work_status: "completed", pinned: 1, note: "메모", link: "https://example.com/a",
    created_at: 1720000000000, memorable_quote: "기억나는 문장",
  },
  {
    id: "n2", title: "테스트 작품 B", author: "", tags: "", platforms: "[]",
    rating: 1500, rd: 350, wins: 0, losses: 0, match_count: 0, created_at: 1720000000000,
  },
  { id: "n3", title: "테스트 작품 C", author: "작가 1", tags: "회귀", platforms: "not-json", rating: 1400, rd: 200, wins: 1, losses: 3, match_count: 4, created_at: 1720000000000 },
];
const MATCHES = [
  { a_id: "n1", b_id: "n2", winner_id: "n1", decided_by: "user" },
  { a_id: "n1", b_id: "n3", winner_id: "n3", decided_by: "auto" },
  { a_id: "n2", b_id: "n3", winner_id: null, decided_by: "user" },
];

const built = JSON.parse(JSON.stringify(await buildUltraCompactBackup(NOVELS, MATCHES)));

if (process.argv.includes("--write-fixture")) {
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, JSON.stringify(built, null, 2) + "\n");
  console.log(`픽스처 저장: ${fixturePath}`);
  process.exit(0);
}

// ── ① 지금 만드는 백업 ──
const SUPPORTED = [9, 10, 11, 12, 13];
const builtCheck = validateImportData(JSON.stringify(built));
check("현재 내보내기 버전을 복원이 지원한다", SUPPORTED.includes(built.v), `v=${built.v}`);
check("현재 내보내기가 검증을 통과한다", builtCheck.valid === true, builtCheck.errors.join(" / "));
check("작품 수 보존", builtCheck.novelCount === NOVELS.length, `${builtCheck.novelCount}`);
check("대진 수 보존", builtCheck.matchCount === MATCHES.length, `${builtCheck.matchCount}`);
check(
  "대진 바이트 왕복 (승자 B·자동·무승부 플래그)",
  [...decodeBase64(built.M)].join(",") === [0, 1, 0, 0, 2, 3, 1, 2, 4].join(","),
  [...decodeBase64(built.M)].join(",")
);
check("작가 사전이 중복 없이 공유된다", built.A.length === 1 && built.N[0][1] === built.N[2][1]);
check("작품 행 앞 9칸의 순서 유지", JSON.stringify(built.N[0].slice(0, 9)) === JSON.stringify(["테스트 작품 A", 0, [0, 1], [0, 1], 16234, 120, 5, 2, 7]), JSON.stringify(built.N[0].slice(0, 9)));

// ── ② 저장해 둔 옛 백업과 비교 ──
if (fs.existsSync(fixturePath)) {
  const frozen = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const frozenCheck = validateImportData(JSON.stringify(frozen));
  check("저장된 v13 백업이 검증을 통과한다", frozenCheck.valid === true, frozenCheck.errors.join(" / "));
  check("저장된 v13 백업의 작품·대진 수", frozenCheck.novelCount === 3 && frozenCheck.matchCount === 3);
  check("내보내기가 저장된 v13 항목을 모두 유지한다 (추가는 허용)", isSuperset(built, frozen));
  for (const v of SUPPORTED) {
    const result = validateImportData(JSON.stringify({ ...frozen, v }));
    check(`v${v} 백업을 받아들인다`, result.valid === true && result.version === v, result.errors.join(" / "));
  }
  const twoBytes = validateImportData(JSON.stringify({ ...frozen, m: 2, M: frozen.M }));
  check("2바이트 대진 모드를 5바이트 단위로 센다", twoBytes.matchCount === Math.floor(decodeBase64(frozen.M).length / 5));
} else {
  check("저장된 백업 픽스처가 있다", false, fixturePath);
}

// ── ③ 받지 않기로 한 형식은 깨끗하게 거절 ──
const rejects = (name, text) => {
  const result = validateImportData(text);
  check(`거절: ${name}`, result.valid === false && result.errors.length > 0);
};
rejects("빈 문자열", "");
rejects("깨진 JSON", "{not json");
rejects("v8", JSON.stringify({ v: 8, N: [], M: "" }));
rejects("레거시 novels 배열", JSON.stringify({ novels: [] }));
rejects("모르는 미래 버전", JSON.stringify({ v: 99, N: [], M: "" }));

// ── ④ 쓰는 항목과 읽는 항목 대조 (소스 정적 검사) ──
const buildSrc = fnSource("async function buildUltraCompactBackup(");
const extendedSrc = fnSource("async function buildExtendedBackup(");
const exportSrc = fnSource("async function exportJSON(");
const importSrc = fnSource("async function importJSON(");

const optWritten = keysOf(/\bopt\.([A-Za-z]\w*)\s*=[^=]/g, buildSrc);
const optRead = keysOf(/\bopt\.([A-Za-z]\w*)/g, importSrc);
const dataRead = keysOf(/\bdata\.([A-Za-z]\w*)/g, importSrc);
const settingsWritten = keysOf(/\bsettingsDiff\.([A-Za-z]\w*)\s*=[^=]/g, extendedSrc);
const payloadWritten = keysOf(/\bpayload\.([A-Za-z]\w*)\s*=[^=]/g, exportSrc);

check("작품 옵션: 내보낸 항목을 복원이 모두 읽는다", missing(optWritten, optRead).length === 0, missing(optWritten, optRead).join(","));
check("설정: 내보낸 항목을 복원이 모두 읽는다", settingsWritten.every((k) => importSrc.includes(`.${k}`)), settingsWritten.filter((k) => !importSrc.includes(`.${k}`)).join(","));

// 복원 코드가 data.X로 읽지 않아도 되는 항목. 새 항목을 여기에 넣기 전에 정말 복원이 필요 없는지 확인한다.
const PAYLOAD_NOT_READ_BY_IMPORT = [
  "CL", // applyCoverLinks가 읽는다
  "LCV", // 클라우드 pull이 읽는다
  "coverCount", "hasAnalysis", "hasCovers", // validateImportData의 요약용
];
const payloadUnread = missing(payloadWritten, [...dataRead, ...PAYLOAD_NOT_READ_BY_IMPORT]);
check("최상위: 내보낸 항목을 복원이 모두 읽는다", payloadUnread.length === 0, payloadUnread.join(","));

// 옛 백업에 들어 있는 항목이다. 복원에서 빼면 옛 백업의 데이터가 사라진다. 지우지 말고 추가만 한다.
const OPT_READ_FOREVER = "a,al,art,c,ch,cma,ds,e,et,ey,gca,gd,ge,gr,gs,gsa,i,l,ll,mb,mg,mo,mq,mqImg,mt,n,p,pdy,pl,pv,r,rr,s,sg,ss,sy,td,u,uf,ul,vc,vl,vw,w".split(",");
const DATA_READ_FOREVER = "A,AD,AW,CE,FD,GI,H,M,N,NF,NID,P,PC,PL,PP,PR,QR,RS,S,T,TM,TR,TRC,VL,VQ,XS,b,m,mode,v".split(",");
const SETTINGS_READ_FOREVER = "aa,al,am,as,aw,ec,pf,qd,rb,rc,sc,tc,th,us".split(",");
check("복원이 옛 작품 옵션 항목을 계속 읽는다", missing(OPT_READ_FOREVER, optRead).length === 0, missing(OPT_READ_FOREVER, optRead).join(","));
check("복원이 옛 최상위 항목을 계속 읽는다", missing(DATA_READ_FOREVER, dataRead).length === 0, missing(DATA_READ_FOREVER, dataRead).join(","));
check("복원이 옛 설정 항목을 계속 읽는다", SETTINGS_READ_FOREVER.every((k) => importSrc.includes(`.${k}`)));
const SUPPORT_CHECK = "[9, 10, 11, 12, 13].includes(data.v)";
check("복원이 v9~v13을 계속 지원한다", importSrc.includes(SUPPORT_CHECK) && fnSource("function validateImportData(").includes(SUPPORT_CHECK));
check("복원 전 스냅샷과 롤백을 유지한다", importSrc.includes("_restoreSnapshot") && importSrc.includes("_import_snap_active"));

// ── ⑤ 표지 연결(CL) ──
const coverSrc = fs
  .readFileSync(path.join(root, "src/features/file-backup/coverLinks.js"), "utf8")
  .replace(/^import .*$/m, "")
  .replace(/^export /gm, "");
const existing = new Set(["file:///app/covers/a.jpg", "file:///app/covers/lib.jpg"]);
const coverBox = {
  LegacyFS: { documentDirectory: "file:///app/", getInfoAsync: async (uri) => ({ exists: existing.has(uri) }) },
};
vm.createContext(coverBox);
vm.runInContext(`${coverSrc}\nglobalThis.__C = { buildCoverLinks, applyCoverLinks };`, coverBox, { filename: "coverLinks.js" });
const { buildCoverLinks, applyCoverLinks } = coverBox.__C;

const db = () => {
  const calls = [];
  return { calls, all: async () => [], execBatch: async (queries) => { calls.push(...queries); }, newId: () => "id" };
};

const oldDb = db();
const oldResult = await applyCoverLinks(JSON.stringify(built), oldDb);
check("CL 없는 옛 백업은 DB를 건드리지 않는다", oldResult.linked === 0 && oldDb.calls.length === 0);

const cl = JSON.parse(JSON.stringify(buildCoverLinks(
  [
    { title: "A", author: "작가", cover_image: "file:///other-device/files/covers/a.jpg" },
    { title: "B", author: "", cover_image: "https://example.com/b.jpg" },
    { title: "C", author: "", cover_image: "file:///app/covers/gone.jpg" },
  ],
  [{ file_path: "file:///app/covers/lib.jpg", original_name: "lib.jpg" }]
)));
check("표지 경로를 앱 폴더 기준으로 저장한다 (원격 URL 제외)", cl.links["A|||작가"] === "covers/a.jpg" && !("B|||" in cl.links));

const newDb = db();
const newResult = await applyCoverLinks(JSON.stringify({ ...built, CL: cl }), newDb);
check("파일이 있는 표지만 연결하고 없는 파일은 건너뛴다", newResult.linked === 1 && newResult.missing === 1);
check("표지 라이브러리를 복구한다", newResult.libraryAdded === 1);
check("표지가 다른 기기 경로에서 이 기기 경로로 바뀐다", newDb.calls.some((q) => q.params && q.params[0] === "file:///app/covers/a.jpg"));

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "❌ FAILED"}  pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
