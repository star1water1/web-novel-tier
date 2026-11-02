// '새로운 소식' 항목 선택 회귀 테스트 (node — RN 불필요)
//   실행: node tests/whats-new.test.mjs
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

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}

check("App.jsx에 겹친 CR이 없다 (있으면 git이 텍스트로 보지 못한다)", !src.includes("\r"));

const box = {};
vm.createContext(box);
vm.runInContext(
  `${fnSource("function compareVersions(")}\n${fnSource("function pickWhatsNewEntries(")}\nglobalThis.__W = { pickWhatsNewEntries, compareVersions };`,
  box
);
const { pickWhatsNewEntries, compareVersions } = box.__W;

const ENTRIES = [{ version: "7.60.1" }, { version: "7.58.4" }, { version: "7.58.3" }];
const picked = (lastSeen, current) => pickWhatsNewEntries(ENTRIES, lastSeen, current).map((e) => e.version).join();

check("처음 보는 슬롯은 이번 버전 항목을 본다", picked(null, "7.60.1") === "7.60.1");
check("이번 버전 항목이 없으면 옛 내용을 대신 보여 주지 않는다", picked(null, "7.60.2") === "", picked(null, "7.60.2"));
check("이전 버전 사용자는 놓친 항목을 모두 본다", picked("7.58.3", "7.60.1") === "7.60.1,7.58.4", picked("7.58.3", "7.60.1"));
check("항목 없는 버전을 거쳐도 놓친 항목을 본다", picked("7.59.28", "7.60.2") === "7.60.1", picked("7.59.28", "7.60.2"));
check("이미 본 버전은 다시 보여 주지 않는다", picked("7.60.1", "7.60.1") === "");
check("현재 버전보다 새 항목은 보여 주지 않는다", picked("7.58.3", "7.58.4") === "7.58.4");

const version = /const APP_VERSION = "([^"]+)";/.exec(src)?.[1];
const top = /const CHANGELOG_DATA = \[\s*\{\s*version: "([^"]+)"/.exec(src)?.[1];
check("변경 내역 맨 위 항목이 현재 버전을 넘지 않는다", !!version && !!top && compareVersions(top, version) <= 0, `${top} / ${version}`);
const headerUsesEntry = src.includes("v{whatsNewEntries[0]?.version || APP_VERSION} 업데이트");
check("창 제목이 보여 주는 항목의 버전을 쓴다", headerUsesEntry);

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "❌ FAILED"}  pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
