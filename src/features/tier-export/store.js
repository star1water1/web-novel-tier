// 출력 기록 저장. 슬롯 DB의 새 표만 쓴다. 파일 저장에 성공한 뒤에만 기록을 남겨 다음 출력의 비교 기준으로 쓴다.
// db: App.jsx가 넘기는 { exec, all, first, execBatch, newId }. 모두 safeDbOperation을 거친다.

export const TIER_EXPORT_TABLES = ["tier_export_snapshot"];

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
];

const KEEP_SNAPSHOTS = 20;

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

export async function saveSnapshot(db, { fileName, tierMode, tierOrder, rows }) {
  const id = db.newId();
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

/** 백업 항목 XS. 기록이 없으면 null. 작품 ID는 NID 매핑으로 복원한다. */
export async function buildBackup(db) {
  const rows = await db.all("SELECT created_at, file_name, tier_mode, tier_order, items FROM tier_export_snapshot ORDER BY created_at DESC, id DESC");
  if (!rows || rows.length === 0) return null;
  const list = [];
  for (const row of rows) {
    const items = parseArray(row.items);
    if (items) list.push({ c: row.created_at, f: row.file_name, m: row.tier_mode, o: parseArray(row.tier_order) || [], x: items });
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
      params: [newId(), Number(snap.c) || Date.now(), String(snap.f ?? ""), String(snap.m ?? ""), JSON.stringify(Array.isArray(snap.o) ? snap.o : []), items.length, JSON.stringify(items)],
    });
  }
  return queries;
}
