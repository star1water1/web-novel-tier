// 맨 위로 버튼 연결 (소스 정적 검사). 화면 동작은 에뮬레이터나 폰에서 확인해야 한다.
//   실행: node tests/scroll-top.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
let fail = 0;
function check(name, ok) {
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  if (!ok) fail++;
}

const app = read("App.jsx");
const module_ = read("src/features/scroll-top/index.js");
const nav = app.indexOf("        <Nav />\n");
const head = app.slice(app.lastIndexOf("<ScrollView", nav), nav);
check("메인 스크롤에 ref와 onScroll이 있다", head.includes("ref={mainScrollRef}") && head.includes("scrollTopButtonRef.current?.setOffset(") && head.includes("scrollEventThrottle="));
const close = app.indexOf("\n      </ScrollView>\n", nav);
const button = app.indexOf("<ScrollTopButton", nav);
check("버튼은 메인 스크롤 밖에 있어 함께 움직이지 않는다", close > 0 && button > close && button - close < 200);
check("누르면 애니메이션 없이 맨 위로 간다", app.slice(button, button + 200).includes("scrollTo({ y: 0, animated: false })"));
check("보임 상태를 App에 두지 않는다", !/showScrollTop|setScrollTopVisible/.test(app) && module_.includes("useState(false)"));
check("내비게이션 바 위에 띄운다", module_.includes("insets.bottom"));
check("모듈은 App.jsx를 가져오지 않는다", !/from ".*App/.test(module_));

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "❌ FAILED"}`);
if (fail > 0) process.exit(1);
