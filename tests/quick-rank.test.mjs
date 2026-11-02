// 최소 매칭 회귀 테스트 (node — RN 불필요)
//   점수·선택·순위 계산과, 진짜 SQLite(node:sqlite) 위에서 저장·적용·되돌리기·백업 왕복을 돌린다.
//   화면과 expo-sqlite 동작은 에뮬레이터나 폰에서 확인해야 한다.
//   실행: node tests/quick-rank.test.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const strip = (text) => text.replace(/^import .*$/gm, "").replace(/^export /gm, "");

const box = { console, Date, Math, JSON, Map, Set, Number, String, Array };
vm.createContext(box);
vm.runInContext(
  `${strip(read("src/features/quick-rank/scoring.js"))}\n${strip(read("src/features/quick-rank/store.js"))}
  globalThis.__Q = { startScore, newEntry, countChoice, fitScores, refineScores, pickRound, computeResult, ensureQuickRankSchema, QUICK_RANK_TABLES, QUICK_RANK_CLEAR_QUERIES, loadState, setCell, fillCellsFromCurrentTier, savePick, undoLastPick, resetSession, applyResult, getLatestApply, revertApply, buildBackup, restoreQueries };`,
  box,
  { filename: "quick-rank" }
);
const Q = box.__Q;

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}
const plain = (value) => JSON.parse(JSON.stringify(value));
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TIERS = ["S", "A", "B+", "B", "B-", "C"];

// ── ① 점수 ──
check("6칸 시작 점수가 정해진 값", TIERS.map((_, i) => Q.startScore(i, 6)).join() === "1900,1700,1560,1440,1300,1100");
for (const count of [2, 3, 5, 7, 10]) {
  const scores = Array.from({ length: count }, (_, i) => Q.startScore(i, count));
  check(`${count}칸도 높은 칸일수록 시작 점수가 높다`, scores.every((v, i) => i === 0 || v < scores[i - 1]));
}
check("1칸이면 오류 없이 중간값", Q.startScore(0, 1) === 1500);

const group = ["a", "b", "c", "d", "e"].map((id) => Q.newEntry(id, "A", TIERS));
const snapshot = JSON.stringify(group);
const after = Q.countChoice(group, "c");
const winner = after.find((x) => x.id === "c");
check("고른 작품은 4번, 나머지는 1번 비교로 센다", winner.matchCount === 4 && after.filter((x) => x.id !== "c").every((x) => x.matchCount === 1));
check("넘긴 배열을 바꾸지 않는다", JSON.stringify(group) === snapshot);
let threw = false;
try { Q.countChoice(group, "없음"); } catch { threw = true; }
check("후보에 없는 작품을 고르면 오류", threw);

const oneLog = [{ shown: ["a", "b", "c", "d", "e"], chosen: "c" }];
const fitted = Q.fitScores(group, oneLog, TIERS);
const fittedScore = (id, list = fitted) => list.find((x) => x.id === id).score;
check("고른 작품만 점수가 오른다", fittedScore("c") > 1700 && fitted.filter((x) => x.id !== "c").every((x) => x.score < 1700));
check("비교한 작품은 불확실성이 줄어든다", fitted.every((x) => x.rd < 100));
check("기록이 없으면 칸의 시작 점수 그대로", plain(Q.fitScores(group, [], TIERS)).every((x) => x.score === 1700 && x.rd === 100));
check("같은 입력이면 다시 계산해도 같다", JSON.stringify(Q.fitScores(group, oneLog, TIERS)) === JSON.stringify(fitted));
const withoutLoser = Q.fitScores(group.filter((x) => x.id !== "a"), oneLog, TIERS);
check("지운 작품을 빼고 남은 기록만 쓴다", withoutLoser.length === 4 && fittedScore("c", withoutLoser) > 1700);
check("고른 작품이 지워진 기록은 건너뛴다", plain(Q.fitScores(group.filter((x) => x.id !== "c"), oneLog, TIERS)).every((x) => x.score === 1700));
let chain = group;
const chainLogs = [{ shown: ["a", "b"], chosen: "a" }, { shown: ["b", "c"], chosen: "b" }, { shown: ["c", "d"], chosen: "c" }, { shown: ["d", "e"], chosen: "d" }];
const chainFit = Q.fitScores(group, chainLogs, TIERS);
check("직접 비교하지 않은 작품도 기록을 타고 순서가 정해진다", ["a", "b", "c", "d", "e"].every((id, i, ids) => i === 0 || fittedScore(ids[i - 1], chainFit) > fittedScore(id, chainFit)));
for (let i = 0; i < 300; i++) chain = Q.refineScores(chain, chainLogs, TIERS);
check("한 번씩 고쳐도 처음부터 계산한 값에 수렴한다", chain.every((x) => Math.abs(x.score - fittedScore(x.id, chainFit)) < 0.1));
const moveCell = Q.fitScores(group.map((x) => (x.id === "c" ? { ...x, cellTier: "B" } : x)), oneLog, TIERS);
check("칸을 바꾸면 새 칸과 기록으로 계산한다", fittedScore("c", moveCell) < fittedScore("c"));

// ── ② 다음 후보 ──
const many = Array.from({ length: 40 }, (_, i) => Q.newEntry(`w${i}`, TIERS[i % 6], TIERS, { rd: i === 7 ? 100 : 60 }));
const round = Q.pickRound(many, seeded(1));
check("5개를 겹치지 않게 내준다", round.length === 5 && new Set(round.map((x) => x.id)).size === 5);
check("가장 불확실한 작품이 들어간다", round.some((x) => x.id === "w7"));
const w7Score = many[7].score;
const nearest = [...many].filter((x) => x.id !== "w7").map((x) => Math.abs(x.score - w7Score)).sort((a, b) => a - b)[11];
check("나머지는 점수가 비슷한 작품에서 고른다", round.every((x) => x.id === "w7" || Math.abs(x.score - w7Score) <= nearest));
const uncertainPick = Q.pickRound(many.map((x) => ({ ...x, score: 1500, rd: x.id === "w7" ? 100 : x.id === "w1" ? 90 : 40 })), seeded(3));
check("점수가 같으면 더 불확실한 작품을 먼저 고른다", uncertainPick.some((x) => x.id === "w1"));
const firsts = new Set(Array.from({ length: 40 }, (_, i) => Q.pickRound(many, seeded(i))[0].id));
check("맨 윗줄이 늘 같은 작품이 아니다", firsts.size > 1);
check("작품이 5개보다 적으면 있는 만큼", Q.pickRound(many.slice(0, 3).map((x) => ({ ...x })), seeded(2)).length === 3);
check("작품이 1개면 비교하지 않는다", Q.pickRound(many.slice(0, 1)).length === 0);

// ── ③ 순위 계산 ──
const entry = (id, cellTier, score, manualTier = cellTier, manualOrder = 0) => ({ id, cellTier, score, manualTier, manualOrder });
const untouched = [
  entry("s2", "S", 1900, "S", 200), entry("s1", "S", 1900, "S", 100),
  entry("a1", "A", 1700, "A", 100), entry("a2", "A", 1700, "A", 200),
];
const same = Q.computeResult({ entries: untouched, tierOrder: TIERS });
check("비교 전에는 티어도 순서도 그대로", same.map((r) => `${r.id}:${r.afterTier}:${r.afterOrder}`).join() === "s1:S:100,s2:S:200,a1:A:100,a2:A:200", JSON.stringify(same));

const mixed = [entry("x", "S", 1650), entry("y", "S", 1950), entry("z", "A", 1800), entry("w", "A", 1600)];
const moved = Q.computeResult({ entries: mixed, tierOrder: TIERS });
check("티어를 옮기면 칸별 작품 수는 그대로", moved.filter((r) => r.afterTier === "S").length === 2 && moved.filter((r) => r.afterTier === "A").length === 2);
check("티어를 옮기면 점수 순으로 채운다", moved.map((r) => r.id).join() === "y,z,x,w" && moved[1].afterTier === "S" && moved[2].afterTier === "A");
const kept = Q.computeResult({ entries: mixed, tierOrder: TIERS, moveTiers: false });
check("티어 고정이면 칸 안에서만 정렬한다", kept.map((r) => `${r.id}:${r.afterTier}`).join() === "y:S,x:S,z:A,w:A");
check("순서 번호는 100 간격", moved.filter((r) => r.afterTier === "A").map((r) => r.afterOrder).join() === "100,200");

const held = Q.computeResult({
  entries: [entry("p", "S", 1900, "S", 100), entry("q", "S", 1950, "S", 300), entry("r", "A", 1700, "A", 100)],
  held: [{ id: "ban", manualTier: "S", manualOrder: 200 }],
  tierOrder: TIERS,
});
check("매칭 제외 작품은 티어와 칸 안 자리를 유지한다", held.filter((r) => r.afterTier === "S").map((r) => r.id).join() === "q,ban,p", JSON.stringify(held));

// ── ④ 가상 사용자 계산 (시뮬레이션과 같은 조건: 작품 300개, 판단 '보통'). 약속이 아니라 계산식이 어긋나지 않았는지만 본다. ──
function virtualRun(seed, decisions, cellNoise, noise) {
  const random = seeded(seed);
  const randn = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const cuts = [1.28, 0.67, 0, -0.67, -1.28];
  const tierOf = (v) => { const i = cuts.findIndex((c) => v > c); return TIERS[i < 0 ? 5 : i]; };
  const truth = Array.from({ length: 300 }, randn);
  let entries = truth.map((v, i) => Q.newEntry(i, tierOf(v + cellNoise * randn()), TIERS));
  const logs = [];
  for (let d = 0; d < decisions; d++) {
    const shown = Q.pickRound(entries, random);
    const best = shown.map((x) => [truth[x.id] + noise * randn(), x.id]).sort((a, b) => b[0] - a[0])[0][1];
    const updated = new Map(Q.countChoice(shown, best).map((x) => [x.id, x]));
    logs.push({ shown: shown.map((x) => x.id), chosen: best });
    entries = Q.refineScores(entries.map((x) => updated.get(x.id) || x), logs, TIERS);
  }
  entries = Q.fitScores(entries, logs, TIERS);
  const order = [...entries].sort((a, b) => b.score - a.score).map((x) => x.id);
  const trueRank = new Array(300);
  [...truth.keys()].sort((a, b) => truth[b] - truth[a]).forEach((id, i) => { trueRank[id] = i; });
  const gotRank = new Array(300);
  order.forEach((id, i) => { gotRank[id] = i; });
  const pct = [0.1, 0.25, 0.5, 0.75, 0.9, 1];
  const band = (r) => pct.findIndex((c) => r < 300 * c);
  let sameBand = 0, top = 0;
  for (let i = 0; i < 300; i++) {
    if (band(trueRank[i]) === band(gotRank[i])) sameBand++;
    if (trueRank[i] < 30 && gotRank[i] < 30) top++;
  }
  return { tier: sameBand / 300, top: top / 30 };
}
// 판단이 많이 흔들리고 한 작품이 자주 뽑히는 기록에서 점수가 튀던 문제. 시작 점수 차가 800이므로 그보다 훨씬 커지면 발산이다.
function stressLogs(seed) {
  const random = seeded(seed);
  const randn = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const truth = Array.from({ length: 300 }, randn);
  const list = truth.map((v, i) => Q.newEntry(i, TIERS[Math.min(5, Math.floor(random() * 6))], TIERS));
  const logs = [];
  for (let d = 0; d < 4000; d++) {
    const anchor = Math.floor(random() * 6);
    const shown = [anchor, ...Array.from({ length: 4 }, () => 6 + Math.floor(random() * 294))];
    const best = shown.map((id) => [truth[id] + 0.4 * randn(), id]).sort((a, b) => b[0] - a[0])[0][1];
    logs.push({ shown, chosen: best });
  }
  return { list, logs };
}
const stress = [1, 2, 3].map(stressLogs).map(({ list, logs }) => Math.max(...Q.fitScores(list, logs, TIERS).map((x) => Math.abs(x.score - 1500))));
check("기록이 몰리고 판단이 흔들려도 점수가 발산하지 않는다", stress.every((v) => Number.isFinite(v) && v < 3000), JSON.stringify(stress));

const avg = (runs) => ({ tier: runs.reduce((s, r) => s + r.tier, 0) / runs.length, top: runs.reduce((s, r) => s + r.top, 0) / runs.length });
const r900 = avg([1, 2, 3, 4].map((s) => virtualRun(s, 600, 0.5, 0.25)));
const r1500 = avg([5, 6, 7, 8].map((s) => virtualRun(s, 1200, 0.5, 0.25)));
console.log(`   (가상) 칸+600번 티어 ${(r900.tier * 100).toFixed(0)}% 상위 ${(r900.top * 100).toFixed(0)}% / 칸+1200번 티어 ${(r1500.tier * 100).toFixed(0)}% 상위 ${(r1500.top * 100).toFixed(0)}%`);
check("가상 계산이 크게 어긋나지 않는다 (칸+600번)", r900.tier > 0.66 && r900.top > 0.70, JSON.stringify(r900));
check("가상 계산이 크게 어긋나지 않는다 (칸+1200번)", r1500.tier > 0.74 && r1500.top > 0.76, JSON.stringify(r1500));
check("더 많이 고를수록 나아진다", r1500.tier > r900.tier);

// ── ⑤ 저장 (진짜 SQLite) ──
function openDb() {
  const raw = new DatabaseSync(":memory:");
  raw.exec(`CREATE TABLE novels (id TEXT PRIMARY KEY, title TEXT, author TEXT, cover_image TEXT, manual_tier TEXT, manual_order INTEGER DEFAULT 0, match_ban INTEGER DEFAULT 0, rating REAL DEFAULT 1500, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, match_count INTEGER DEFAULT 0);
    CREATE TABLE matches (id TEXT PRIMARY KEY);
    CREATE TABLE tier_verification_queue (id TEXT PRIMARY KEY, novel_id TEXT, state TEXT);`);
  let idCounter = 0;
  const db = {
    raw,
    failNext: null,
    newId: () => `id${++idCounter}`,
    exec: async (sql, params = []) => raw.prepare(sql).run(...params),
    all: async (sql, params = []) => plain(raw.prepare(sql).all(...params)),
    first: async (sql, params = []) => { const row = raw.prepare(sql).get(...params); return row ? plain(row) : null; },
    // App.jsx의 execBatch처럼 50개씩 쪼갠다.
    execBatch: async (queries) => {
      for (let i = 0; i < queries.length; i += 50) {
        raw.exec("BEGIN");
        try {
          for (const { sql, params } of queries.slice(i, i + 50)) {
            if (db.failNext && sql.includes(db.failNext)) { db.failNext = null; throw new Error("가짜 실패"); }
            raw.prepare(sql).run(...(params || []));
          }
          raw.exec("COMMIT");
        } catch (e) { raw.exec("ROLLBACK"); throw e; }
      }
    },
  };
  return db;
}
const addNovels = (db, rows) => { for (const [id, tier = null, order = 0, ban = 0] of rows) db.raw.prepare("INSERT INTO novels (id, title, author, manual_tier, manual_order, match_ban) VALUES (?,?,?,?,?,?)").run(id, `제목${id}`, "작가", tier, order, ban); };
const tiersOf = (db) => Object.fromEntries(db.raw.prepare("SELECT id, manual_tier, manual_order FROM novels ORDER BY id").all().map((r) => [r.id, `${r.manual_tier}:${r.manual_order}`]));
const legacy = (db) => JSON.stringify(plain(db.raw.prepare("SELECT id, rating, wins, losses, match_count FROM novels ORDER BY id").all()));

const db = openDb();
await Q.ensureQuickRankSchema((sql) => db.exec(sql));
await Q.ensureQuickRankSchema((sql) => db.exec(sql));
check("표 만들기를 두 번 해도 문제없다", true);

addNovels(db, [["n1", "S", 100], ["n2", "A", 100], ["n3", "A", 200], ["n4", null, 0], ["n5", "B", 100], ["n6", "B", 200], ["ban", "A", 150, 1]]);
db.raw.exec("INSERT INTO tier_verification_queue VALUES ('q1', 'n2', 'pending')");
const legacyBefore = legacy(db);

let state = await Q.loadState(db, TIERS);
check("처음에는 진행 상황이 없고 모두 칸을 물어야 한다", !state.session && state.needCell.length === 6 && state.entries.length === 0);
check("매칭 제외 작품은 묻지 않는다", !state.needCell.some((w) => w.id === "ban") && state.held.length === 1);
check("지금 티어가 있는 작품 수를 센다", state.withTierCount === 5);
check("채우기 전에는 표에 아무것도 없다", db.raw.prepare("SELECT COUNT(*) c FROM quick_rank_session").get().c === 0);

const filled = await Q.fillCellsFromCurrentTier(db, state.needCell, TIERS);
state = await Q.loadState(db, TIERS);
check("지금 티어로 칸을 채운다", filled === 5 && state.entries.length === 5);
check("티어가 없는 작품만 칸을 묻는다", state.needCell.map((w) => w.id).join() === "n4");
await Q.setCell(db, "n4", "C", TIERS);
state = await Q.loadState(db, TIERS);
check("칸을 정하면 모두 준비된다", state.needCell.length === 0 && state.entries.length === 6);

const shown = state.entries.filter((e) => ["n2", "n3", "n4", "n5", "n6"].includes(e.id));
await Q.savePick(db, state.session.id, shown, "n4");
state = await Q.loadState(db, TIERS); // 앱을 끄고 다시 연 것과 같다
const n4 = state.entries.find((e) => e.id === "n4");
check("고른 결과가 다시 읽어도 남는다", state.decisions === 1 && n4.score > 1100 && n4.matchCount === 4);
check("비교 기록이 쌓인다", db.raw.prepare("SELECT COUNT(*) c FROM quick_rank_log").get().c === 1);
check("matches와 rating, 승패는 그대로", legacy(db) === legacyBefore && db.raw.prepare("SELECT COUNT(*) c FROM matches").get().c === 0);

const undone = await Q.undoLastPick(db, state.session.id);
state = await Q.loadState(db, TIERS);
check("방금 고른 것을 취소하면 점수와 횟수가 돌아온다", state.decisions === 0 && state.entries.find((e) => e.id === "n4").score === 1100 && state.entries.find((e) => e.id === "n4").matchCount === 0);
check("취소하면 그때 보여 준 작품을 돌려준다", plain(undone).length === 5 && plain(undone).includes("n4"));
check("취소하면 기록도 빠진다", db.raw.prepare("SELECT COUNT(*) c FROM quick_rank_log").get().c === 0);
check("취소할 것이 없으면 null", (await Q.undoLastPick(db, state.session.id)) === null);

await Q.savePick(db, state.session.id, state.entries.filter((e) => ["n2", "n3", "n4", "n5", "n6"].includes(e.id)), "n4");
await Q.savePick(db, state.session.id, (await Q.loadState(db, TIERS)).entries.filter((e) => ["n2", "n3", "n4", "n5", "n6"].includes(e.id)), "n4");

db.failNext = "UPDATE quick_rank_session";
let pickFailed = false;
state = await Q.loadState(db, TIERS);
try { await Q.savePick(db, state.session.id, state.entries.filter((e) => ["n2", "n3", "n4", "n5", "n6"].includes(e.id)), "n5"); } catch { pickFailed = true; }
const stateAfterFail = await Q.loadState(db, TIERS);
check("고르기 저장이 실패하면 절반만 저장되지 않는다", pickFailed && stateAfterFail.decisions === state.decisions && stateAfterFail.entries.find((e) => e.id === "n5").score === state.entries.find((e) => e.id === "n5").score);

// 작품 추가·삭제와 티어 구성 변경
addNovels(db, [["n7"]]);
state = await Q.loadState(db, TIERS);
check("새 작품은 칸을 먼저 묻는다", state.needCell.map((w) => w.id).join() === "n7");
let blocked = false;
try { await Q.applyResult(db, state, TIERS, true); } catch { blocked = true; }
check("칸이 비어 있으면 적용하지 않는다", blocked);
await Q.setCell(db, "n7", "B", TIERS);

const removedRow = db.raw.prepare("SELECT * FROM novels WHERE id='n6'").get();
db.raw.exec("DELETE FROM novels WHERE id='n6'");
state = await Q.loadState(db, TIERS);
check("지운 작품은 후보에서 빠진다", !state.entries.some((e) => e.id === "n6") && state.workCount === 6);
db.raw.prepare("INSERT INTO novels (id,title,author,manual_tier,manual_order) VALUES (?,?,?,?,?)").run(removedRow.id, removedRow.title, removedRow.author, removedRow.manual_tier, removedRow.manual_order);
state = await Q.loadState(db, TIERS);
check("삭제를 되돌리면 쌓인 점수와 함께 돌아온다", state.entries.find((e) => e.id === "n6")?.matchCount > 0);

const smallTiers = ["S", "A"];
const smallState = await Q.loadState(db, smallTiers);
check("티어 구성이 바뀌어 없어진 칸의 작품은 다시 묻는다", smallState.needCell.some((w) => w.id === "n5") && smallState.entries.every((e) => smallTiers.includes(e.cellTier)));

await Q.setCell(db, "n4", "A", TIERS);
state = await Q.loadState(db, TIERS);
check("이미 비교한 작품은 칸을 바꿔도 비교 기록을 유지한다", state.entries.find((e) => e.id === "n4").matchCount > 0 && state.entries.find((e) => e.id === "n4").score > Q.startScore(1, 6) && state.entries.find((e) => e.id === "n4").cellTier === "A");

// 적용과 되돌리기
const beforeApply = tiersOf(db);
const legacyBeforeApply = legacy(db);
db.failNext = "INSERT INTO quick_rank_apply (";
let applyFailed = false;
try { await Q.applyResult(db, state, TIERS, true); } catch { applyFailed = true; }
check("적용 마지막 단계가 실패하면 작품은 전부 그대로", applyFailed && JSON.stringify(tiersOf(db)) === JSON.stringify(beforeApply));
check("실패한 적용은 되돌리기 대상이 아니다", (await Q.getLatestApply(db)) === null);

const applied = await Q.applyResult(db, state, TIERS, true);
const afterApply = tiersOf(db);
const expectedRows = Q.computeResult({ entries: state.entries, held: state.held, tierOrder: TIERS, moveTiers: true });
check("적용하면 계산한 티어와 순서가 들어간다", plain(expectedRows).every((r) => afterApply[r.id] === `${r.afterTier}:${r.afterOrder}`), JSON.stringify(afterApply));
check("적용은 진행 상황을 지우지 않는다", (await Q.loadState(db, TIERS)).decisions === state.decisions);
check("매칭 제외 작품의 티어가 유지된다", afterApply.ban.startsWith("A:"));
check("적용해도 rating, matches, 검증 큐는 그대로", legacy(db) === legacyBeforeApply && db.raw.prepare("SELECT state FROM tier_verification_queue").get().state === "pending");

addNovels(db, [["late", "S", 999]]);
const reverted = await Q.revertApply(db);
const afterRevert = tiersOf(db);
const { late, ...revertRest } = afterRevert;
check("되돌리면 적용 전 티어와 순서로 돌아온다", reverted.ok && JSON.stringify(revertRest) === JSON.stringify(beforeApply), JSON.stringify(afterRevert));
check("적용 뒤에 넣은 작품은 그대로 두고 그 티어를 알려 준다", late === "S:999" && plain(reverted.tiersToReorder).includes("S"));
check("이미 되돌린 적용은 다시 되돌리지 않는다", (await Q.revertApply(db)).ok === false);
check("전역 되돌리기의 옛 기록도 거절한다", (await Q.revertApply(db, applied.applyId)).ok === false);
db.raw.exec("DELETE FROM novels WHERE id='late'");

state = await Q.loadState(db, TIERS);
const first = await Q.applyResult(db, state, TIERS, true);
const second = await Q.applyResult(db, await Q.loadState(db, TIERS), TIERS, false);
check("최근 적용이 아니면 전역 되돌리기가 거절한다", (await Q.revertApply(db, first.applyId)).ok === false);
const secondRevert = await Q.revertApply(db, second.applyId);
check("최근 적용부터 차례로 되돌린다", secondRevert.ok && (await Q.getLatestApply(db)).id === first.applyId);
await Q.revertApply(db);
check("두 번 적용해도 차례로 되돌리면 처음으로 돌아온다", JSON.stringify(tiersOf(db)) === JSON.stringify(beforeApply));

for (let i = 0; i < 8; i++) await Q.applyResult(db, await Q.loadState(db, TIERS), TIERS, true);
check("적용 기록은 최근 5개만 남긴다", db.raw.prepare("SELECT COUNT(*) c FROM quick_rank_apply").get().c === 5 && db.raw.prepare("SELECT COUNT(DISTINCT apply_id) c FROM quick_rank_apply_item").get().c === 5);

// 작품 300개: execBatch가 쪼개도 한 문장으로 적용되는지
const bigDb = openDb();
await Q.ensureQuickRankSchema((sql) => bigDb.exec(sql));
addNovels(bigDb, Array.from({ length: 300 }, (_, i) => [`b${String(i).padStart(3, "0")}`, TIERS[i % 6], 100 + i]));
await Q.fillCellsFromCurrentTier(bigDb, (await Q.loadState(bigDb, TIERS)).needCell, TIERS);
const bigBefore = tiersOf(bigDb);
const bigState = await Q.loadState(bigDb, TIERS);
await Q.applyResult(bigDb, bigState, TIERS, true);
const updates = bigDb.raw.prepare("SELECT COUNT(DISTINCT manual_tier) c, MAX(manual_order) m FROM novels").get();
check("작품 300개도 모두 적용한다 (칸당 50개, 100 간격)", updates.c === 6 && updates.m === 5000, JSON.stringify(updates));
await Q.revertApply(bigDb);
check("작품 300개도 그대로 되돌린다", JSON.stringify(tiersOf(bigDb)) === JSON.stringify(bigBefore));

// ── ⑥ 백업 왕복 ──
state = await Q.loadState(db, TIERS);
const aliveIds = db.raw.prepare("SELECT id FROM novels").all().map((r) => r.id);
await Q.savePick(db, state.session.id, state.entries.filter((e) => ["n1", "n2", "n3"].includes(e.id)), "n1");
const backup = plain(await Q.buildBackup(db, aliveIds));
const size = JSON.stringify(backup).length;
const remap = (id) => `new-${id}`;
const restored = openDb();
await Q.ensureQuickRankSchema((sql) => restored.exec(sql));
addNovels(restored, aliveIds.map((id) => [remap(id), null, 0, id === "ban" ? 1 : 0]));
let counter = 0;
await restored.execBatch(plain(Q.restoreQueries(backup, remap, () => `r${++counter}`)));
const restoredState = await Q.loadState(restored, TIERS);
const original = (await Q.loadState(db, TIERS));
check("복원하면 진행 횟수가 이어진다", restoredState.decisions === original.decisions);
check("복원하면 칸과 점수가 새 ID로 이어진다", original.entries.every((e) => {
  const r = restoredState.entries.find((x) => x.id === remap(e.id));
  return r && Math.abs(r.score - e.score) < 1e-6 && r.cellTier === e.cellTier && r.matchCount === e.matchCount;
}));
const restoredLog = restored.raw.prepare("SELECT shown, chosen_id, before_state FROM quick_rank_log").all();
check("복원하면 비교 기록이 새 ID로 이어진다", restoredLog.length === db.raw.prepare("SELECT COUNT(*) c FROM quick_rank_log").get().c && restoredLog.every((l) => l.chosen_id.startsWith("new-") && JSON.parse(l.shown).every((id) => id.startsWith("new-"))));
const pickOldDb = openDbWithSchema();
addNovels(pickOldDb, [["o1", "S", 100], ["o2", "S", 200], ["o3", "S", 300]]);
await Q.fillCellsFromCurrentTier(pickOldDb, (await Q.loadState(pickOldDb, TIERS)).needCell, TIERS);
const oldSession = (await Q.loadState(pickOldDb, TIERS)).session.id;
pickOldDb.raw.prepare("INSERT INTO quick_rank_log (id, session_id, shown, chosen_id, before_state, created_at) VALUES ('old', ?, ?, 'o3', NULL, 1)").run(oldSession, JSON.stringify(["o1", "o2", "o3"]));
pickOldDb.raw.prepare("INSERT INTO quick_rank_log (id, session_id, shown, chosen_id, before_state, created_at) VALUES ('bad', ?, 'not json', 'o1', NULL, 2)").run(oldSession);
pickOldDb.raw.exec("UPDATE quick_rank_item SET score=5000, rd=350");
const oldState = await Q.loadState(pickOldDb, TIERS);
check("옛 버전의 진행 상황은 저장된 값 대신 기록으로 다시 계산한다", oldState.entries.every((e) => e.score < 2500 && e.rd <= 100) && oldState.entries.find((e) => e.id === "o3").score > oldState.entries.find((e) => e.id === "o1").score);
check("읽을 수 없는 기록은 건너뛴다", oldState.logs.length === 1);
const previewFit = Q.computeResult({ entries: Q.fitScores(oldState.entries, oldState.logs, TIERS), held: oldState.held, tierOrder: TIERS, moveTiers: true });
const appliedFit = Q.computeResult({ entries: (await Q.loadState(pickOldDb, TIERS)).entries, held: oldState.held, tierOrder: TIERS, moveTiers: true });
check("미리보기와 적용의 순위가 같다", JSON.stringify(previewFit) === JSON.stringify(appliedFit));
check("복원한 기록은 취소 대상이 아니다 (적용 전 값이 없다)", (await Q.undoLastPick(restored, restoredState.session.id)) === null);
check("옛 백업(항목 없음)은 아무것도 하지 않는다", Q.restoreQueries(undefined, remap, () => "x").length === 0);
check("형식이 틀린 항목은 건너뛴다", plain(Q.restoreQueries({ ids: ["a"], s: { id: "s" }, i: [[9, "S", 1, 1, 0], [0, "S", "x", 1, 0]], l: [["s", 9, [0], 1], ["s", 0, "x", 1]] }, remap, () => "x")).length === 1);
check("진행 중인 것이 없으면 백업 항목을 만들지 않는다", (await Q.buildBackup(openDbWithSchema(), [])) === null);
console.log(`   백업 항목 크기 (작품 7개): ${size} 글자`);

function openDbWithSchema() {
  const d = openDb();
  for (const sql of read("src/features/quick-rank/store.js").match(/`CREATE [\s\S]*?;`/g)) d.raw.exec(sql.slice(1, -1));
  return d;
}

const clearDb = openDbWithSchema();
await clearDb.execBatch(plain(Q.QUICK_RANK_CLEAR_QUERIES));
check("복원·초기화용 비우기가 모든 새 표를 지운다", plain(Q.QUICK_RANK_CLEAR_QUERIES).length === Q.QUICK_RANK_TABLES.length);

// ── ⑦ App.jsx 연결 (소스 정적 검사) ──
const app = read("App.jsx");
const fnOf = (head) => { const s = app.indexOf(`\n${head}`); return s < 0 ? "" : app.slice(s, app.indexOf("\n}\n", s)); };
const storeSrc = read("src/features/quick-rank/store.js");
const snapLine = app.slice(app.indexOf("const IMPORT_SNAP_TABLES"), app.indexOf("\n", app.indexOf("const IMPORT_SNAP_TABLES")));
check("복원 스냅샷이 새 표를 함께 복구한다", snapLine.includes("...QUICK_RANK_TABLES"));
const resetUses = app.split("...QUICK_RANK_CLEAR_QUERIES").length - 1;
check("복원, 전체 초기화, 선택 초기화가 새 표를 비운다", resetUses === 3, `${resetUses}곳`);
check("initDb가 새 표를 만든다", app.includes("ensureQuickRankSchema("));
check("내보내기와 복원이 QR을 함께 다룬다", fnOf("async function exportJSON(").includes("payload.QR") && fnOf("async function importJSON(").includes("data.QR"));
check("저장 코드는 기존 기록과 검증 큐를 건드리지 않는다", !/\b(UPDATE|INSERT INTO|DELETE FROM) +(matches|choice_logs|tier_verification_queue)\b/.test(storeSrc) && !/\brating\b|enqueueVerification/.test(storeSrc.replace(/^\s*(\/\/|\/\*|\*).*$/gm, "")));
const screenSrc = read("src/features/quick-rank/QuickRankScreen.js");
check("화면 코드는 App.jsx를 가져오지 않는다", !/from "\.\.\/\.\.\/\.\.\/App/.test(screenSrc + storeSrc));
check("화면은 앱 전용 Modal을 쓴다", screenSrc.includes('from "../system-insets"') && screenSrc.includes('from "react-native-safe-area-context"'));
check("매칭 기반 모드에는 진입 버튼이 없다", /const quickRankAvailable = globalTierConfig\.mode === "manual" \|\| globalTierConfig\.mode === "hybrid"/.test(app));

console.log(`\n${fail === 0 ? "🎉 ALL PASS" : "❌ FAILED"}  pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
