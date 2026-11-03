// 출력 기록 저장. 슬롯 DB의 새 표만 쓴다. 파일 저장에 성공한 뒤에만 기록을 남겨 다음 출력의 비교 기준으로 쓴다.
// db: App.jsx가 넘기는 { exec, all, first, execBatch, newId }. 모두 safeDbOperation을 거친다.

export const TIER_EXPORT_TABLES = ["tier_export_snapshot", "tier_import_apply", "tier_import_apply_item"];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tier_export_snapshot (
    id TEXT PRIMARY KEY NOT NULL,
    created_at INTEGER NOT NULL,
    file_name TEXT NOT NULL DEFAULT '',
    tier_mode TEXT NOT NULL DEFAULT '',
    tier_order TEXT NOT NULL DEFAULT '[]',
    item_count INTEGER NOT NULL DEFAULT 0,
    items TEXT NOT NULL DEFAULT '[]'
  );`,
  `CREATE INDEX IF NOT EXISTS idx_tes_created ON tier_export_snapshot(created_at);`,
  `CREATE TABLE IF NOT EXISTS tier_import_apply (
    id TEXT PRIMARY KEY NOT NULL,
    file_name TEXT NOT NULL DEFAULT '',
    item_count INTEGER NOT NULL DEFAULT 0,
    applied_at INTEGER NOT NULL,
    reverted_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS tier_import_apply_item (
    apply_id TEXT NOT NULL,
    novel_id TEXT NOT NULL,
    set_place INTEGER NOT NULL DEFAULT 0,
    before_tier TEXT,
    before_order INTEGER NOT NULL DEFAULT 0,
    after_tier TEXT,
    after_order INTEGER NOT NULL DEFAULT 0,
    set_read INTEGER NOT NULL DEFAULT 0,
    before_read INTEGER NOT NULL DEFAULT 0,
    after_read INTEGER NOT NULL DEFAULT 0,
    before_read_at INTEGER,
    set_gaiden INTEGER NOT NULL DEFAULT 0,
    before_gaiden INTEGER NOT NULL DEFAULT 0,
    after_gaiden INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (apply_id, novel_id)
  );`,
];

const KEEP_SNAPSHOTS = 20;
const KEEP_IMPORTS = 5;

/** initDb에서 부른다. 표가 없을 때만 만든다. */
export async function ensureTierExportSchema(run) {
  for (const sql of SCHEMA) await run(sql);
}

/** 복원과 초기화가 작품을 통째로 지울 때 함께 비운다. 복원은 작품 ID를 새로 만들 수 있다. */
export const TIER_EXPORT_CLEAR_QUERIES = TIER_EXPORT_TABLES.map((table) => ({ sql: `DELETE FROM ${table};`, params: [] }));

const parseArray = (text) => {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const toItemRow = (row) => [row.id, row.tier, row.rating, row.read, row.gaidenRead, row.title];
const fromItemRow = ([id, tier, rating, read, gaidenRead, title]) => ({
  id,
  tier,
  rating: Number(rating) || 0,
  read: Number(read) || 0,
  gaidenRead: Number(gaidenRead) || 0,
  title: String(title ?? ""),
});

/** 최신순. 표 내용은 뺀 목록이다. */
export async function listSnapshots(db) {
  return db.all("SELECT id, created_at, file_name, tier_mode, item_count FROM tier_export_snapshot ORDER BY created_at DESC, id DESC");
}

/** @returns 비교에 쓸 출력본. 기록이 없거나 깨졌으면 null */
export async function loadSnapshot(db, id) {
  const row = await db.first("SELECT tier_mode, tier_order, items FROM tier_export_snapshot WHERE id=?", [id]);
  if (!row) return null;
  const items = parseArray(row.items);
  if (!items) return null;
  return {
    tierMode: row.tier_mode,
    tierOrder: parseArray(row.tier_order) || [],
    items: items.filter((item) => Array.isArray(item) && item[0]).map(fromItemRow),
  };
}

export async function saveSnapshot(db, { id: givenId, fileName, tierMode, tierOrder, rows }) {
  const id = givenId || db.newId();
  const createdAt = Date.now();
  await db.execBatch([
    {
      sql: "INSERT INTO tier_export_snapshot (id, created_at, file_name, tier_mode, tier_order, item_count, items) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [id, createdAt, fileName, tierMode, JSON.stringify(tierOrder), rows.length, JSON.stringify(rows.map(toItemRow))],
    },
    {
      sql: `DELETE FROM tier_export_snapshot WHERE id NOT IN (SELECT id FROM tier_export_snapshot ORDER BY created_at DESC, id DESC LIMIT ${KEEP_SNAPSHOTS})`,
      params: [],
    },
  ]);
  return id;
}

/**
 * 파일에서 고친 값을 작품에 넣는다. 시스템 경로이므로 검증 큐를 건드리지 않는다.
 * execBatch는 50개가 넘으면 쪼개므로, 전후 값을 표에 먼저 쓰고 UPDATE 한 문장으로 적용한다.
 * 앱이 중간에 꺼져도 작품은 전부 적용되거나 전부 그대로다.
 */
export async function applyImport(db, { writes, fileName, itemCount }) {
  const applyId = db.newId();
  const now = Date.now();
  await db.execBatch(writes.map((w) => ({
    sql: `INSERT INTO tier_import_apply_item (apply_id, novel_id, set_place, before_tier, before_order, after_tier, after_order, set_read, before_read, after_read, before_read_at, set_gaiden, before_gaiden, after_gaiden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [applyId, w.id, w.setPlace ? 1 : 0, w.beforeTier, w.beforeOrder, w.afterTier, w.afterOrder, w.setRead ? 1 : 0, w.beforeRead, w.afterRead, w.beforeReadAt, w.setGaiden ? 1 : 0, w.beforeGaiden, w.afterGaiden],
  })));
  const item = (column) => `(SELECT ${column} FROM tier_import_apply_item WHERE apply_id=?1 AND novel_id=novels.id)`;
  await db.execBatch([
    {
      sql: `UPDATE novels SET
              manual_tier=CASE WHEN ${item("set_place")}=1 THEN ${item("after_tier")} ELSE manual_tier END,
              manual_order=CASE WHEN ${item("set_place")}=1 THEN ${item("after_order")} ELSE manual_order END,
              read_count=CASE WHEN ${item("set_read")}=1 THEN ${item("after_read")} ELSE read_count END,
              read_count_updated_at=CASE WHEN ${item("set_read")}=1 THEN ?2 ELSE read_count_updated_at END,
              gaiden_read_count=CASE WHEN ${item("set_gaiden")}=1 THEN ${item("after_gaiden")} ELSE gaiden_read_count END
            WHERE id IN (SELECT novel_id FROM tier_import_apply_item WHERE apply_id=?1)`,
      params: [applyId, now],
    },
    {
      sql: "INSERT INTO tier_import_apply (id, file_name, item_count, applied_at, reverted_at) VALUES (?, ?, ?, ?, NULL)",
      params: [applyId, fileName, itemCount, now],
    },
  ]);
  const old = await db.all(`SELECT id FROM tier_import_apply ORDER BY applied_at DESC, rowid DESC LIMIT -1 OFFSET ${KEEP_IMPORTS}`);
  await db.execBatch([
    ...old.flatMap(({ id }) => [
      { sql: "DELETE FROM tier_import_apply_item WHERE apply_id=?", params: [id] },
      { sql: "DELETE FROM tier_import_apply WHERE id=?", params: [id] },
    ]),
    // 적용 도중 꺼져 적용 기록 없이 남은 전후 값도 치운다.
    { sql: "DELETE FROM tier_import_apply_item WHERE apply_id NOT IN (SELECT id FROM tier_import_apply)", params: [] },
  ]);
  return { applyId };
}

/** 되돌릴 수 있는 가장 최근 가져오기. */
export async function getLatestImport(db) {
  return db.first("SELECT * FROM tier_import_apply WHERE reverted_at IS NULL ORDER BY applied_at DESC, rowid DESC LIMIT 1");
}

/**
 * 가져오기 전 값으로 되돌린다. applyId를 넘기면 가장 최근 가져오기일 때만 되돌린다.
 * 그 뒤에 앱에서 또 고친 화수는 지우지 않고 keptRead로 개수를 알린다.
 * 순서를 바꿨던 가져오기는 다른 작품이 있는 티어를 돌려줘 순서 번호를 다시 매기게 한다.
 */
export async function revertImport(db, applyId = null) {
  const latest = await getLatestImport(db);
  if (!latest || (applyId && latest.id !== applyId)) return { ok: false };
  const kept = await db.first(
    `SELECT COUNT(*) AS n FROM novels n JOIN tier_import_apply_item i ON i.novel_id=n.id AND i.apply_id=?
     WHERE (i.set_read=1 AND n.read_count!=i.after_read) OR (i.set_gaiden=1 AND n.gaiden_read_count!=i.after_gaiden)`,
    [latest.id]
  );
  const placed = await db.first("SELECT COUNT(*) AS n FROM tier_import_apply_item WHERE apply_id=? AND set_place=1", [latest.id]);
  const item = (column) => `(SELECT ${column} FROM tier_import_apply_item WHERE apply_id=?1 AND novel_id=novels.id)`;
  const readKept = `${item("set_read")}=1 AND read_count=${item("after_read")}`;
  await db.execBatch([
    {
      sql: `UPDATE novels SET
              manual_tier=CASE WHEN ${item("set_place")}=1 THEN ${item("before_tier")} ELSE manual_tier END,
              manual_order=CASE WHEN ${item("set_place")}=1 THEN ${item("before_order")} ELSE manual_order END,
              read_count_updated_at=CASE WHEN ${readKept} THEN ${item("before_read_at")} ELSE read_count_updated_at END,
              read_count=CASE WHEN ${readKept} THEN ${item("before_read")} ELSE read_count END,
              gaiden_read_count=CASE WHEN ${item("set_gaiden")}=1 AND gaiden_read_count=${item("after_gaiden")} THEN ${item("before_gaiden")} ELSE gaiden_read_count END
            WHERE id IN (SELECT novel_id FROM tier_import_apply_item WHERE apply_id=?1)`,
      params: [latest.id],
    },
    { sql: "UPDATE tier_import_apply SET reverted_at=? WHERE id=?", params: [Date.now(), latest.id] },
  ]);
  const extra = Number(placed?.n) > 0
    ? await db.all(
      `SELECT DISTINCT manual_tier FROM novels
       WHERE manual_tier IS NOT NULL AND manual_tier != ''
         AND id NOT IN (SELECT novel_id FROM tier_import_apply_item WHERE apply_id=? AND set_place=1)`,
      [latest.id]
    )
    : [];
  return { ok: true, applyId: latest.id, keptRead: Number(kept?.n) || 0, tiersToReorder: extra.map((row) => row.manual_tier) };
}

/** 백업 항목 XS. 기록이 없으면 null. 작품 ID는 NID 매핑으로 복원한다. i는 파일의 숨긴 열과 맞춰 보는 출력본 ID다. */
export async function buildBackup(db) {
  const rows = await db.all("SELECT id, created_at, file_name, tier_mode, tier_order, items FROM tier_export_snapshot ORDER BY created_at DESC, id DESC");
  if (!rows || rows.length === 0) return null;
  const list = [];
  for (const row of rows) {
    const items = parseArray(row.items);
    if (items) list.push({ i: row.id, c: row.created_at, f: row.file_name, m: row.tier_mode, o: parseArray(row.tier_order) || [], x: items });
  }
  return list.length > 0 ? list : null;
}

/**
 * 백업 항목 XS를 INSERT 문으로 푼다. 형식이 맞지 않는 행은 건너뛴다.
 * 지금은 없는 작품의 ID는 매핑되지 않은 채 남고, 다음 출력에서 삭제된 작품으로 잡힌다.
 */
export function restoreQueries(backup, remapId, newId) {
  if (!Array.isArray(backup)) return [];
  const queries = [];
  for (const snap of backup) {
    if (!snap || !Array.isArray(snap.x)) continue;
    const items = snap.x.filter((item) => Array.isArray(item) && item[0]).map(([id, ...rest]) => [remapId(id), ...rest]);
    queries.push({
      sql: "INSERT OR IGNORE INTO tier_export_snapshot (id, created_at, file_name, tier_mode, tier_order, item_count, items) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [snap.i ? String(snap.i) : newId(), Number(snap.c) || Date.now(), String(snap.f ?? ""), String(snap.m ?? ""), JSON.stringify(Array.isArray(snap.o) ? snap.o : []), items.length, JSON.stringify(items)],
    });
  }
  return queries;
}
