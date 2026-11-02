// 최소 매칭의 저장. 슬롯 DB의 새 표만 쓰고 matches와 rating은 건드리지 않는다.
// db: App.jsx가 넘기는 { exec, all, first, execBatch, newId }. 모두 safeDbOperation을 거친다.
import { computeResult, countChoice, fitScores, newEntry } from "./scoring";

export const QUICK_RANK_TABLES = [
  "quick_rank_session",
  "quick_rank_item",
  "quick_rank_log",
  "quick_rank_apply",
  "quick_rank_apply_item",
];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS quick_rank_session (
    id TEXT PRIMARY KEY NOT NULL,
    decisions INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS quick_rank_item (
    session_id TEXT NOT NULL,
    novel_id TEXT NOT NULL,
    cell_tier TEXT NOT NULL,
    score REAL NOT NULL,
    rd REAL NOT NULL,
    match_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, novel_id)
  );`,
  `CREATE TABLE IF NOT EXISTS quick_rank_log (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    shown TEXT NOT NULL,
    chosen_id TEXT NOT NULL,
    before_state TEXT,
    created_at INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_qrl_session ON quick_rank_log(session_id, created_at);`,
  `CREATE TABLE IF NOT EXISTS quick_rank_apply (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT,
    applied_at INTEGER NOT NULL,
    reverted_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS quick_rank_apply_item (
    apply_id TEXT NOT NULL,
    novel_id TEXT NOT NULL,
    before_tier TEXT,
    before_order INTEGER NOT NULL DEFAULT 0,
    after_tier TEXT,
    after_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (apply_id, novel_id)
  );`,
];

const KEEP_APPLIES = 5;
const BACKUP_LOG_LIMIT = 5000;

/** initDb에서 부른다. 표가 없을 때만 만든다. */
export async function ensureQuickRankSchema(run) {
  for (const sql of SCHEMA) await run(sql);
}

/** 복원과 초기화가 작품을 통째로 지울 때 함께 비운다. 복원은 작품 ID를 새로 만들 수 있다. */
export const QUICK_RANK_CLEAR_QUERIES = QUICK_RANK_TABLES.map((table) => ({ sql: `DELETE FROM ${table};`, params: [] }));

const parseLog = (row) => {
  try {
    const shown = JSON.parse(row.shown);
    return Array.isArray(shown) ? { shown, chosen: row.chosen_id } : null;
  } catch {
    return null;
  }
};

const toEntry = (row, work) => ({
  id: row.novel_id,
  cellTier: row.cell_tier,
  score: Number(row.score),
  rd: Number(row.rd),
  matchCount: Number(row.match_count) || 0,
  manualTier: work.manual_tier || null,
  manualOrder: Number(work.manual_order) || 0,
  title: work.title,
  author: work.author,
  coverImage: work.cover_image,
});

/**
 * 현재 작품과 저장된 진행 상황을 맞춘다. 지운 작품의 행은 삭제 되돌리기에 대비해 남기고 무시한다.
 * needCell: 칸을 물어야 하는 작품(새 작품, 티어 구성이 바뀌어 칸이 없어진 작품).
 */
export async function loadState(db, tierOrder) {
  const session = await db.first("SELECT * FROM quick_rank_session ORDER BY created_at DESC LIMIT 1");
  const novels = await db.all(
    "SELECT id, title, author, cover_image, manual_tier, manual_order, match_ban FROM novels ORDER BY title COLLATE NOCASE ASC, id ASC"
  );
  const rows = session
    ? await db.all("SELECT * FROM quick_rank_item WHERE session_id=?", [session.id])
    : [];
  const rowById = new Map(rows.map((row) => [row.novel_id, row]));
  const entries = [];
  const needCell = [];
  const held = [];
  for (const work of novels) {
    if (Number(work.match_ban)) {
      if (tierOrder.includes(work.manual_tier)) {
        held.push({ id: work.id, title: work.title, manualTier: work.manual_tier, manualOrder: Number(work.manual_order) || 0 });
      }
      continue;
    }
    const row = rowById.get(work.id);
    if (row && tierOrder.includes(row.cell_tier)) entries.push(toEntry(row, work));
    else needCell.push(work);
  }
  const logs = session
    ? (await db.all("SELECT shown, chosen_id FROM quick_rank_log WHERE session_id=? ORDER BY created_at ASC, rowid ASC", [session.id])).map(parseLog).filter(Boolean)
    : [];
  const lastLog = session
    ? await db.first("SELECT before_state FROM quick_rank_log WHERE session_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1", [session.id])
    : null;
  return {
    session,
    decisions: Number(session?.decisions) || 0,
    canUndo: Boolean(lastLog?.before_state),
    workCount: entries.length + needCell.length,
    withTierCount: needCell.filter((work) => tierOrder.includes(work.manual_tier)).length,
    entries: fitScores(entries, logs, tierOrder),
    logs,
    needCell,
    held,
  };
}

async function ensureSession(db) {
  const existing = await db.first("SELECT id FROM quick_rank_session ORDER BY created_at DESC LIMIT 1");
  if (existing) return existing.id;
  const id = db.newId();
  const now = Date.now();
  await db.exec("INSERT INTO quick_rank_session (id, decisions, created_at, updated_at) VALUES (?, 0, ?, ?)", [id, now, now]);
  return id;
}

/** 칸을 정한다. 이미 비교한 작품은 기록을 유지하고, 점수는 읽을 때 새 칸과 기록으로 다시 계산한다. */
function cellQuery(sessionId, novelId, tier, tierOrder) {
  const start = newEntry(novelId, tier, tierOrder);
  return {
    sql: `INSERT INTO quick_rank_item (session_id, novel_id, cell_tier, score, rd, match_count) VALUES (?, ?, ?, ?, ?, 0)
          ON CONFLICT(session_id, novel_id) DO UPDATE SET
            cell_tier=excluded.cell_tier,
            score=CASE WHEN match_count=0 THEN excluded.score ELSE score END`,
    params: [sessionId, novelId, tier, start.score, start.rd],
  };
}

export async function setCell(db, novelId, tier, tierOrder) {
  const sessionId = await ensureSession(db);
  await db.execBatch([cellQuery(sessionId, novelId, tier, tierOrder)]);
}

/** 칸을 물어야 하는 작품 중 지금 티어가 있는 작품은 그 티어를 칸으로 쓴다. */
export async function fillCellsFromCurrentTier(db, needCell, tierOrder) {
  const sessionId = await ensureSession(db);
  const queries = needCell
    .filter((work) => tierOrder.includes(work.manual_tier))
    .map((work) => cellQuery(sessionId, work.id, work.manual_tier, tierOrder));
  await db.execBatch(queries);
  return queries.length;
}

/** 고른 결과와 기록을 한 트랜잭션으로 저장한다. 앱이 꺼져도 절반만 저장되지 않는다. 점수의 원본은 기록이고 행의 score, rd는 그때 값이다. */
export async function savePick(db, sessionId, group, winnerId) {
  const updated = countChoice(group, winnerId);
  const now = Date.now();
  const before = group.map((entry) => [entry.id, entry.score, entry.rd, entry.matchCount]);
  await db.execBatch([
    {
      sql: "INSERT INTO quick_rank_log (id, session_id, shown, chosen_id, before_state, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      params: [db.newId(), sessionId, JSON.stringify(group.map((entry) => entry.id)), winnerId, JSON.stringify(before), now],
    },
    ...updated.map((entry) => ({
      sql: "UPDATE quick_rank_item SET score=?, rd=?, match_count=? WHERE session_id=? AND novel_id=?",
      params: [entry.score, entry.rd, entry.matchCount, sessionId, entry.id],
    })),
    { sql: "UPDATE quick_rank_session SET decisions=decisions+1, updated_at=? WHERE id=?", params: [now, sessionId] },
  ]);
  return updated;
}

/** 방금 고른 것을 취소한다. 그때 보여 준 작품 ID를 돌려준다. 되돌릴 기록이 없으면 null. */
export async function undoLastPick(db, sessionId) {
  const log = await db.first(
    "SELECT id, shown, before_state FROM quick_rank_log WHERE session_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1",
    [sessionId]
  );
  if (!log?.before_state) return null;
  const before = JSON.parse(log.before_state);
  await db.execBatch([
    ...before.map(([id, score, rd, matchCount]) => ({
      sql: "UPDATE quick_rank_item SET score=?, rd=?, match_count=? WHERE session_id=? AND novel_id=?",
      params: [score, rd, matchCount, sessionId, id],
    })),
    { sql: "DELETE FROM quick_rank_log WHERE id=?", params: [log.id] },
    { sql: "UPDATE quick_rank_session SET decisions=MAX(decisions-1, 0), updated_at=? WHERE id=?", params: [Date.now(), sessionId] },
  ]);
  return JSON.parse(log.shown);
}

/** 진행 상황을 지운다. 비교 기록과 적용 기록은 남긴다. */
export async function resetSession(db, sessionId) {
  await db.execBatch([
    { sql: "DELETE FROM quick_rank_item WHERE session_id=?", params: [sessionId] },
    { sql: "DELETE FROM quick_rank_session WHERE id=?", params: [sessionId] },
  ]);
}

async function pruneApplies(db) {
  const old = await db.all(`SELECT id FROM quick_rank_apply ORDER BY applied_at DESC LIMIT -1 OFFSET ${KEEP_APPLIES}`);
  const queries = old.flatMap(({ id }) => [
    { sql: "DELETE FROM quick_rank_apply_item WHERE apply_id=?", params: [id] },
    { sql: "DELETE FROM quick_rank_apply WHERE id=?", params: [id] },
  ]);
  // 적용 도중 꺼져 적용 기록 없이 남은 전후 값도 치운다.
  queries.push({ sql: "DELETE FROM quick_rank_apply_item WHERE apply_id NOT IN (SELECT id FROM quick_rank_apply)", params: [] });
  await db.execBatch(queries);
}

/**
 * 결과를 manual_tier, manual_order에 넣는다. 시스템 경로이므로 검증 큐를 건드리지 않는다.
 * execBatch는 50개가 넘으면 쪼개므로, 전후 값을 표에 먼저 쓰고 UPDATE 한 문장으로 적용한다.
 * 앱이 중간에 꺼져도 작품은 전부 적용되거나 전부 그대로다.
 */
export async function applyResult(db, state, tierOrder, moveTiers) {
  if (state.needCell.length > 0) throw new Error("칸을 정하지 않은 작품이 있습니다.");
  const rows = computeResult({ entries: state.entries, held: state.held, tierOrder, moveTiers });
  const applyId = db.newId();
  await db.execBatch(rows.map((row) => ({
    sql: "INSERT INTO quick_rank_apply_item (apply_id, novel_id, before_tier, before_order, after_tier, after_order) VALUES (?, ?, ?, ?, ?, ?)",
    params: [applyId, row.id, row.beforeTier, row.beforeOrder, row.afterTier, row.afterOrder],
  })));
  await db.execBatch([
    {
      sql: `UPDATE novels SET
              manual_tier=(SELECT after_tier FROM quick_rank_apply_item WHERE apply_id=? AND novel_id=novels.id),
              manual_order=(SELECT after_order FROM quick_rank_apply_item WHERE apply_id=? AND novel_id=novels.id)
            WHERE id IN (SELECT novel_id FROM quick_rank_apply_item WHERE apply_id=?)`,
      params: [applyId, applyId, applyId],
    },
    {
      sql: "INSERT INTO quick_rank_apply (id, session_id, applied_at, reverted_at) VALUES (?, ?, ?, NULL)",
      params: [applyId, state.session?.id ?? null, Date.now()],
    },
  ]);
  await pruneApplies(db);
  return { applyId, rows };
}

/** 되돌릴 수 있는 가장 최근 적용. */
export async function getLatestApply(db) {
  return db.first("SELECT * FROM quick_rank_apply WHERE reverted_at IS NULL ORDER BY applied_at DESC, rowid DESC LIMIT 1");
}

/**
 * 적용 전 티어와 순서로 되돌린다. 전역 되돌리기에서 applyId를 넘기면 가장 최근 적용일 때만 되돌린다.
 * 적용 뒤에 새로 넣은 작품은 건드리지 않고, 그 작품이 있는 티어를 돌려줘 순서 번호를 다시 매기게 한다.
 */
export async function revertApply(db, applyId = null) {
  const latest = await getLatestApply(db);
  if (!latest || (applyId && latest.id !== applyId)) return { ok: false };
  await db.execBatch([
    {
      sql: `UPDATE novels SET
              manual_tier=(SELECT before_tier FROM quick_rank_apply_item WHERE apply_id=? AND novel_id=novels.id),
              manual_order=(SELECT before_order FROM quick_rank_apply_item WHERE apply_id=? AND novel_id=novels.id)
            WHERE id IN (SELECT novel_id FROM quick_rank_apply_item WHERE apply_id=?)`,
      params: [latest.id, latest.id, latest.id],
    },
    { sql: "UPDATE quick_rank_apply SET reverted_at=? WHERE id=?", params: [Date.now(), latest.id] },
  ]);
  const extra = await db.all(
    `SELECT DISTINCT manual_tier FROM novels
     WHERE manual_tier IS NOT NULL AND manual_tier != ''
       AND id NOT IN (SELECT novel_id FROM quick_rank_apply_item WHERE apply_id=?)`,
    [latest.id]
  );
  return { ok: true, applyId: latest.id, tiersToReorder: extra.map((row) => row.manual_tier) };
}

/** 백업 항목 QR. 작품 ID는 ids 표의 번호로 줄여 담는다. 진행 중인 것이 없으면 null. */
export async function buildBackup(db, aliveIds) {
  const alive = new Set(aliveIds);
  const session = await db.first("SELECT * FROM quick_rank_session ORDER BY created_at DESC LIMIT 1");
  const items = session
    ? (await db.all("SELECT novel_id, cell_tier, score, rd, match_count FROM quick_rank_item WHERE session_id=?", [session.id]))
      .filter((row) => alive.has(row.novel_id))
    : [];
  // 점수는 복원할 때 기록으로 다시 계산하므로 진행 중인 세션의 기록은 전부 담는다. 한도는 지난 세션에만 쓴다.
  const currentLogs = session
    ? await db.all("SELECT session_id, shown, chosen_id, created_at FROM quick_rank_log WHERE session_id=? ORDER BY created_at DESC", [session.id])
    : [];
  const pastLogs = await db.all(
    `SELECT session_id, shown, chosen_id, created_at FROM quick_rank_log WHERE session_id != ? ORDER BY created_at DESC LIMIT ${Math.max(0, BACKUP_LOG_LIMIT - currentLogs.length)}`,
    [session?.id ?? ""]
  );
  const logs = [...currentLogs, ...pastLogs];
  if (!session && logs.length === 0) return null;
  const ids = [];
  const indexOf = new Map();
  const idx = (id) => {
    if (!indexOf.has(id)) { indexOf.set(id, ids.length); ids.push(id); }
    return indexOf.get(id);
  };
  return {
    s: session ? { id: session.id, d: session.decisions, c: session.created_at, u: session.updated_at } : null,
    i: items.map((row) => [idx(row.novel_id), row.cell_tier, row.score, row.rd, row.match_count]),
    l: logs.map((row) => [row.session_id, idx(row.chosen_id), JSON.parse(row.shown).map(idx), row.created_at]),
    ids,
  };
}

/** 백업 항목 QR을 INSERT 문으로 푼다. 형식이 맞지 않는 행은 건너뛴다. */
export function restoreQueries(backup, remapId, newId) {
  if (!backup || !Array.isArray(backup.ids)) return [];
  const ids = backup.ids.map(remapId);
  const queries = [];
  if (backup.s?.id) {
    queries.push({
      sql: "INSERT OR IGNORE INTO quick_rank_session (id, decisions, created_at, updated_at) VALUES (?, ?, ?, ?)",
      params: [backup.s.id, Number(backup.s.d) || 0, backup.s.c || Date.now(), backup.s.u || Date.now()],
    });
    for (const row of Array.isArray(backup.i) ? backup.i : []) {
      const [index, cellTier, score, rd, matchCount] = row;
      if (!ids[index] || !cellTier || !Number.isFinite(score) || !Number.isFinite(rd)) continue;
      queries.push({
        sql: "INSERT OR IGNORE INTO quick_rank_item (session_id, novel_id, cell_tier, score, rd, match_count) VALUES (?, ?, ?, ?, ?, ?)",
        params: [backup.s.id, ids[index], cellTier, score, rd, Number(matchCount) || 0],
      });
    }
  }
  for (const row of Array.isArray(backup.l) ? backup.l : []) {
    const [sessionId, chosen, shown, createdAt] = row;
    if (!sessionId || !ids[chosen] || !Array.isArray(shown)) continue;
    queries.push({
      sql: "INSERT OR IGNORE INTO quick_rank_log (id, session_id, shown, chosen_id, before_state, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
      params: [newId(), sessionId, JSON.stringify(shown.map((i) => ids[i]).filter(Boolean)), ids[chosen], createdAt || Date.now()],
    });
  }
  return queries;
}
