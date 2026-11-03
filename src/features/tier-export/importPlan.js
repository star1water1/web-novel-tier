// 고친 엑셀 파일을 앱의 표와 맞춰 보고 무엇을 바꿀지 정한다. DB와 화면을 모른다.
// 파일과 출력 기록을 비교해 밖에서 고친 칸만 가린다. 고치지 않은 파일은 앱이 그 뒤 달라졌어도 아무것도 바꾸지 않는다.
import { findStable } from "./diff";
import { ID_HEADER } from "./sheet";

const PLACE_MODES = new Set(["manual", "hybrid"]);
const MAX_READ = 1000000;
const MANY_MOVED_MIN = 10;
const MANY_MOVED_RATIO = 0.3;

const clean = (value) => (value === null || value === undefined ? "" : String(value).normalize("NFC").trim());
const lower = (value) => clean(value).toLowerCase();

/**
 * 읽은 화수 칸을 해석한다. 내보내기의 표기(N, N(完), 외전 N)를 받는다.
 * @returns {{kind: "main"|"gaiden", value: number}|{invalid: true}|null} 빈칸이면 null
 */
export function parseReadCell(cell) {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === "number") {
    return Number.isInteger(cell) && cell >= 0 && cell <= MAX_READ ? { kind: "main", value: cell } : { invalid: true };
  }
  const text = clean(cell).replace(/,/g, "");
  if (!text) return null;
  const match = text.match(/^(\d+)\s*(?:\(\s*[完완]\s*\))?$/);
  const gaiden = match ? null : text.match(/^외전\s*(\d+)$/);
  const value = Number((match || gaiden)?.[1]);
  if (!(match || gaiden) || value > MAX_READ) return { invalid: true };
  return { kind: match ? "main" : "gaiden", value };
}

const HEADER_NAMES = { tier: ["tier", "티어"], rank: ["순위"], title: ["제목"], read: ["읽은 화수"] };

function findColumns(cells) {
  const columns = { id: -1, tier: -1, rank: -1, title: -1, read: -1 };
  let exportId = "";
  cells.forEach((cell, index) => {
    const text = lower(cell);
    if (text.startsWith(ID_HEADER.toLowerCase())) {
      columns.id = index;
      exportId = clean(cell).slice(ID_HEADER.length + 1);
      return;
    }
    for (const [key, names] of Object.entries(HEADER_NAMES)) {
      if (columns[key] < 0 && names.includes(text)) columns[key] = index;
    }
  });
  const usable = (columns.id >= 0 || columns.title >= 0) && (columns.tier >= 0 || columns.read >= 0);
  return usable ? { columns, exportId } : null;
}

/**
 * 티어표 시트를 찾아 행으로 읽는다. 열은 위치가 아니라 머리글로 찾고, 없는 열은 읽지 않는다.
 * @returns {{exportId: string, columns: object, rows: object[]}|null} 티어표를 못 찾으면 null
 */
export function readTierTable(workbook) {
  const sheets = [...workbook.sheets].sort((a, b) => (b.name === "티어표") - (a.name === "티어표"));
  for (const sheet of sheets) {
    for (let i = 0; i < Math.min(sheet.rows.length, 20); i++) {
      const found = findColumns(sheet.rows[i].cells);
      if (!found) continue;
      const { columns, exportId } = found;
      const pick = (cells, column) => (column >= 0 ? cells[column] ?? null : null);
      const rows = [];
      for (const { rowNumber, cells } of sheet.rows.slice(i + 1)) {
        const row = {
          rowNumber,
          id: clean(pick(cells, columns.id)),
          title: clean(pick(cells, columns.title)),
          tier: clean(pick(cells, columns.tier)),
          rank: pick(cells, columns.rank),
          read: pick(cells, columns.read),
        };
        if (row.id || row.title || row.tier || clean(row.read)) rows.push(row);
      }
      return { exportId, columns, rows };
    }
  }
  return null;
}

function tierResolver(current) {
  const byName = new Map();
  const add = (name, tier) => {
    const key = lower(name);
    if (!key) return;
    byName.set(key, byName.has(key) && byName.get(key) !== tier ? null : tier);
  };
  // 티어 키가 다른 티어의 이름과 겹치면 모호하다고 본다.
  for (const tier of current.tierOrder) add(tier, tier);
  for (const tier of current.tierOrder) add(current.tierLabels?.[tier], tier);
  return (name) => byName.get(lower(name)) ?? null;
}

function matchRows(table, current, skip, notices) {
  const byId = new Map(current.rows.map((row) => [row.id, row]));
  const byTitle = new Map();
  for (const row of current.rows) {
    const key = clean(row.title);
    byTitle.set(key, [...(byTitle.get(key) || []), row]);
  }
  const matched = [];
  for (const row of table.rows) {
    let work = row.id ? byId.get(row.id) : null;
    if (work) {
      if (row.title && row.title !== clean(work.title)) notices.titleIgnored++;
    } else {
      // 복원하면 작품 ID가 새로 만들어질 수 있어, 모르는 ID도 제목으로 찾아본다.
      const candidates = byTitle.get(row.title) || [];
      if (!row.title) { skip(row, "작품을 알아볼 수 없어요."); continue; }
      if (candidates.length > 1) { skip(row, "같은 제목의 작품이 여러 개예요."); continue; }
      if (candidates.length === 0) { skip(row, "앱에 없는 작품이에요. 작품 추가는 하지 않아요."); continue; }
      [work] = candidates;
    }
    matched.push({ row, work });
  }
  const seen = new Map();
  for (const { work } of matched) seen.set(work.id, (seen.get(work.id) || 0) + 1);
  return matched.filter(({ row, work }) => {
    if (seen.get(work.id) === 1) return true;
    skip(row, "같은 작품이 여러 행에 있어요.");
    return false;
  });
}

// 티어 안에서만 순서를 본다. 티어 구성의 순서가 바뀐 것은 작품이 움직인 것이 아니다.
const stableMoves = (items, baseIndex) => {
  const moved = new Set(items.filter((item) => item.forced).map((item) => item.id));
  const byTier = new Map();
  for (const item of items) {
    if (!item.forced) byTier.set(item.tier, [...(byTier.get(item.tier) || []), item]);
  }
  for (const free of byTier.values()) {
    const stable = findStable(free.map((item) => baseIndex.get(item.id)), free.map(() => 1));
    free.forEach((item, index) => { if (!stable.has(index)) moved.add(item.id); });
  }
  return moved;
};

// 티어 칸만 고쳐 다른 티어 자리에 남은 행은 앱에서 티어를 바꿀 때처럼 그 티어 맨 뒤로 보낸다.
function orderWithinTiers(entries, tierOrder) {
  const runs = [];
  for (const entry of entries) {
    const run = runs[runs.length - 1];
    if (run && run.tier === entry.tier) run.entries.push(entry);
    else runs.push({ tier: entry.tier, entries: [entry] });
  }
  const groups = new Map(tierOrder.map((tier) => [tier, []]));
  for (const tier of tierOrder) {
    const own = runs.filter((run) => run.tier === tier);
    const score = (run) => run.entries.filter((entry) => !entry.tierChanged).length;
    const main = own.reduce((best, run) => (score(run) > score(best ?? { entries: [] }) ? run : best), null);
    const tail = [];
    for (const run of own) {
      for (const entry of run.entries) {
        if (main && run !== main && entry.tierChanged) tail.push(entry);
        else groups.get(tier).push(entry);
      }
    }
    groups.get(tier).push(...tail);
  }
  return groups;
}

function planPlacement({ table, matched, current, baseline, baseOf, baseIndex, useFile, skip, notices, conflicts, changeFor }) {
  const mode = current.tierMode;
  const blocked = !PLACE_MODES.has(mode) ? "mode" : baseline && baseline.tierMode !== mode ? "mode_changed" : null;
  const active = new Set(current.tierOrder);
  const resolve = tierResolver(current);
  const labelOf = (tier) => current.tierLabels?.[tier] ?? tier;

  const entries = [];
  for (const { row, work } of matched) {
    const base = baseOf(work.id);
    let tier = base.tier;
    if (row.tier) {
      const resolved = resolve(row.tier);
      const sameAsBase = lower(row.tier) === lower(base.tier) || lower(row.tier) === lower(labelOf(base.tier));
      if (resolved) tier = resolved;
      else if (!sameAsBase) {
        if (!blocked) skip(row, `'${row.tier}' 티어가 없어요. 티어와 순서는 그대로 둬요.`);
        continue;
      }
    } else {
      if (!blocked) skip(row, "티어 칸이 비어 있어요. 티어와 순서는 그대로 둬요.");
      continue;
    }
    if (active.has(tier)) entries.push({ id: work.id, row, work, tier, tierChanged: tier !== base.tier, forced: tier !== base.tier || !baseIndex.has(work.id) });
  }

  const groups = orderWithinTiers(entries, current.tierOrder);
  const sequence = current.tierOrder.flatMap((tier) => groups.get(tier));
  const moved = stableMoves(sequence, baseIndex);

  // 순위 칸은 쓰지 않는다. 행을 옮기고 숫자를 그대로 둔 경우도 많아, 어긋나면 알리기만 한다.
  const positions = new Map();
  for (const row of table.rows) {
    if (!row.tier) continue;
    const key = lower(row.tier);
    positions.set(key, (positions.get(key) || 0) + 1);
    if (row.rank !== null && row.rank !== undefined && clean(row.rank) && Number(row.rank) !== positions.get(key)) notices.rankMismatch++;
  }

  if (blocked) {
    notices.placementBlocked = blocked;
    notices.placementIgnored = moved.size;
    return [];
  }
  if (sequence.length >= MANY_MOVED_MIN && moved.size / sequence.length > MANY_MOVED_RATIO) notices.manyMoved = moved.size;

  const appMoved = baseline
    ? stableMoves(
      current.rows.filter((row) => baseIndex.has(row.id)).map((row) => ({ id: row.id, tier: row.tier, forced: row.tier !== baseOf(row.id).tier })),
      baseIndex
    )
    : new Set();

  const currentLists = new Map();
  for (const row of current.rows) currentLists.set(row.tier, [...(currentLists.get(row.tier) || []), row.id]);
  const tierOfNow = new Map(current.rows.map((row) => [row.id, row.tier]));
  const previousIn = (entry, inList) => {
    const group = groups.get(entry.tier);
    for (let i = group.indexOf(entry) - 1; i >= 0; i--) if (inList(group[i].id)) return group[i].id;
    return null;
  };

  const applied = new Set();
  for (const entry of sequence) {
    if (!moved.has(entry.id)) continue;
    const list = currentLists.get(entry.tier) || [];
    const previous = previousIn(entry, (id) => tierOfNow.get(id) === entry.tier && id !== entry.id);
    const samePlace = tierOfNow.get(entry.id) === entry.tier && (list[list.indexOf(entry.id) - 1] ?? null) === previous;
    if (appMoved.has(entry.id) && !samePlace) {
      const key = `place:${entry.id}`;
      const chosen = useFile.has(key);
      conflicts.push({ key, id: entry.id, title: entry.work.title, rowNumber: entry.row.rowNumber, field: "place", app: `${labelOf(entry.work.tier)} ${entry.work.rank}위`, file: `${labelOf(entry.tier)}`, chosen });
      if (!chosen) continue;
    }
    applied.add(entry.id);
  }
  if (applied.size === 0) return [];

  const lists = new Map(current.tierOrder.map((tier) => [tier, (currentLists.get(tier) || []).filter((id) => !applied.has(id))]));
  for (const entry of sequence) {
    if (!applied.has(entry.id)) continue;
    const list = lists.get(entry.tier);
    const previous = previousIn(entry, (id) => list.includes(id));
    list.splice(previous === null ? 0 : list.indexOf(previous) + 1, 0, entry.id);
  }

  const writes = [];
  const worksById = new Map(current.rows.map((row) => [row.id, row]));
  for (const tier of current.tierOrder) {
    const list = lists.get(tier);
    const before = currentLists.get(tier) || [];
    if (list.length === before.length && list.every((id, i) => id === before[i])) continue;
    list.forEach((id, index) => {
      const work = worksById.get(id);
      const afterTier = applied.has(id) ? tier : work.manualTier;
      const afterOrder = (index + 1) * 100;
      if (afterTier !== work.manualTier || afterOrder !== work.manualOrder) writes.push({ id, afterTier, afterOrder });
      const previousNow = before[before.indexOf(id) - 1] ?? null;
      const previousAfter = list[index - 1] ?? null;
      if (applied.has(id) && (work.tier !== tier || previousNow !== previousAfter)) {
        changeFor(work).place = { fromTier: labelOf(work.tier), fromRank: work.rank, toTier: labelOf(tier), toRank: index + 1 };
      }
    });
  }
  return writes;
}

/**
 * @param {object} args
 * @param {ReturnType<typeof readTierTable>} args.table
 * @param {{rows: object[], tierMode: string, tierOrder: string[], tierLabels: object}} args.current 지금 앱의 표. 순위 탭과 같은 순서
 * @param {{tierMode: string, tierOrder: string[], items: object[]}|null} args.baseline 파일을 내보낼 때의 출력 기록
 * @param {Set<string>} [args.useFile] 충돌 중 파일 값을 쓰기로 고른 key
 * @returns {{changes: object[], conflicts: object[], skipped: object[], notices: object, writes: object[], signature: string}}
 */
export function buildImportPlan({ table, current, baseline, useFile = new Set() }) {
  const notices = {
    noBaseline: !baseline,
    tierConfigChanged: Boolean(baseline) && baseline.tierOrder.join("\n") !== current.tierOrder.join("\n"),
    titleIgnored: 0,
    rankMismatch: 0,
    missingFromFile: 0,
    placementBlocked: null,
    placementIgnored: 0,
    manyMoved: 0,
  };
  const skipped = [];
  const skip = (row, reason) => skipped.push({ rowNumber: row.rowNumber, title: row.title, reason });
  const conflicts = [];
  const changes = new Map();
  const changeFor = (work) => {
    if (!changes.has(work.id)) changes.set(work.id, { id: work.id, title: work.title, place: null, read: null, gaiden: null });
    return changes.get(work.id);
  };

  const matched = matchRows(table, current, skip, notices);
  const baseItems = baseline ? baseline.items : current.rows;
  const baseIndex = new Map(baseItems.map((item, index) => [item.id, index]));
  const baseMap = new Map(baseItems.map((item) => [item.id, item]));
  const currentMap = new Map(current.rows.map((row) => [row.id, row]));
  const baseOf = (id) => baseMap.get(id) ?? currentMap.get(id);

  if (baseline) {
    const inFile = new Set(matched.map(({ work }) => work.id));
    notices.missingFromFile = baseline.items.filter((item) => currentMap.has(item.id) && !inFile.has(item.id)).length;
  }

  const readWrites = new Map();
  if (table.columns.read >= 0) {
    for (const { row, work } of matched) {
      const parsed = parseReadCell(row.read);
      if (parsed === null) { skip(row, "읽은 화수 칸이 비어 있어요. 화수는 그대로 둬요."); continue; }
      if (parsed.invalid) { skip(row, `'${clean(row.read)}'을(를) 화수로 읽을 수 없어요. 화수는 그대로 둬요.`); continue; }
      const gaiden = parsed.kind === "gaiden";
      const field = gaiden ? "gaiden" : "read";
      const baseValue = gaiden ? baseOf(work.id).gaidenRead : baseOf(work.id).read;
      const nowValue = gaiden ? work.gaidenRead : work.read;
      if (parsed.value === baseValue || parsed.value === nowValue) continue;
      if (gaiden && !work.hasGaiden) { skip(row, "외전이 없는 작품이에요. 화수는 그대로 둬요."); continue; }
      if (nowValue !== baseValue) {
        const key = `${field}:${work.id}`;
        const chosen = useFile.has(key);
        conflicts.push({ key, id: work.id, title: work.title, rowNumber: row.rowNumber, field, app: nowValue, file: parsed.value, chosen });
        if (!chosen) continue;
      }
      changeFor(work)[field] = { from: nowValue, to: parsed.value };
      readWrites.set(work.id, { ...readWrites.get(work.id), [field]: parsed.value });
    }
  }

  const placeWrites = table.columns.tier >= 0
    ? planPlacement({ table, matched, current, baseline, baseOf, baseIndex, useFile, skip, notices, conflicts, changeFor })
    : [];

  const placeMap = new Map(placeWrites.map((write) => [write.id, write]));
  const writes = current.rows
    .filter((row) => placeMap.has(row.id) || readWrites.has(row.id))
    .map((row) => {
      const place = placeMap.get(row.id);
      const read = readWrites.get(row.id) || {};
      return {
        id: row.id,
        setPlace: Boolean(place),
        beforeTier: row.manualTier,
        beforeOrder: row.manualOrder,
        afterTier: place ? place.afterTier : row.manualTier,
        afterOrder: place ? place.afterOrder : row.manualOrder,
        setRead: read.read !== undefined,
        beforeRead: row.read,
        afterRead: read.read ?? row.read,
        beforeReadAt: row.readUpdatedAt ?? null,
        setGaiden: read.gaiden !== undefined,
        beforeGaiden: row.gaidenRead,
        afterGaiden: read.gaiden ?? row.gaidenRead,
      };
    });

  return {
    changes: [...changes.values()],
    conflicts,
    skipped: skipped.sort((a, b) => a.rowNumber - b.rowNumber),
    notices,
    writes,
    signature: JSON.stringify(writes),
  };
}
