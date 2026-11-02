// 지난 출력본과 이번 출력본을 비교한다. 순서와 티어 결과만 보므로 티어 방식과 상관없이 같은 코드로 돈다.
// 원인(매칭, 직접 배정, 최소 매칭, 추가·삭제)은 알 수 없고 찾지 않는다. 순서를 깬 작품을 주체로 본다.

const RATING_MODES = new Set(["match", "ratio"]);

/**
 * 순서를 유지한 작품 묶음 중 가중치 합이 가장 큰 것을 찾는다.
 * @param {number[]} seq 이번 순서대로 나열한 지난 위치
 * @param {number[]} weights
 * @returns {Set<number>} seq의 인덱스
 */
export function findStable(seq, weights) {
  const best = new Array(seq.length);
  const parent = new Array(seq.length).fill(-1);
  let end = -1;
  let top = -Infinity;
  for (let i = 0; i < seq.length; i++) {
    best[i] = weights[i];
    for (let j = 0; j < i; j++) {
      if (seq[j] < seq[i] && best[j] + weights[i] > best[i]) {
        best[i] = best[j] + weights[i];
        parent[i] = j;
      }
    }
    if (best[i] > top) { top = best[i]; end = i; }
  }
  const stable = new Set();
  for (let i = end; i >= 0; i = parent[i]) stable.add(i);
  return stable;
}

/**
 * @param {Array<{id: string, tier: string, rating: number, read: number, gaidenRead: number}>} rows 이번 표 순서
 * @param {{tierMode: string, tierOrder: string[]}} current
 * @param {{tierMode: string, tierOrder: string[], items: Array<{id, tier, rating, read, gaidenRead, title}>}|null} baseline
 * @returns {{first: boolean, status: Map<string, {change: "new"|"up"|"down"|null, readChanged: boolean}>,
 *   counts: {new: number, up: number, down: number, read: number, removed: number}, removed: string[], tierConfigChanged: boolean}}
 */
export function compareToBaseline(rows, current, baseline) {
  const status = new Map();
  const counts = { new: 0, up: 0, down: 0, read: 0, removed: 0 };
  if (!baseline) {
    for (const row of rows) status.set(row.id, { change: null, readChanged: false });
    return { first: true, status, counts, removed: [], tierConfigChanged: false };
  }

  const before = new Map(baseline.items.map((item, index) => [item.id, { ...item, index }]));
  const common = rows.filter((row) => before.has(row.id));
  const seq = common.map((row) => before.get(row.id).index);

  // rating으로 순위를 정한 두 출력본이면, 점수가 그대로인 작품은 스스로 움직일 수 없으므로 먼저 지킨다.
  // 직접 배정과 혼합은 rebalanceTierOrder가 manual_order를 다시 매기므로 값 변화로 가릴 수 없다.
  const useRating = RATING_MODES.has(current.tierMode) && RATING_MODES.has(baseline.tierMode);
  const heavy = common.length + 1;
  const stable = findStable(seq, common.map((row) => (useRating && row.rating === before.get(row.id).rating ? heavy : 1)));
  const stableIndexes = [...stable];

  const tierIndex = (tier) => current.tierOrder.indexOf(tier);
  const moved = new Map();
  common.forEach((row, i) => {
    if (stable.has(i)) return;
    // 지킨 작품을 몇이나 넘었는지로 방향을 정한다. 최대 묶음이므로 0이 될 수 없다.
    let passed = 0;
    for (const k of stableIndexes) {
      if (k < i && seq[k] > seq[i]) passed--;
      else if (k > i && seq[k] < seq[i]) passed++;
    }
    moved.set(row.id, passed > 0 ? "up" : "down");
  });

  for (const row of rows) {
    const prev = before.get(row.id);
    if (!prev) {
      status.set(row.id, { change: "new", readChanged: false });
      counts.new++;
      continue;
    }
    let change = moved.get(row.id) || null;
    // 티어가 바뀌면 순서가 그대로여도 표에 보이는 값이 달라졌으므로 칠한다.
    if (prev.tier !== row.tier) {
      const from = tierIndex(prev.tier);
      const to = tierIndex(row.tier);
      if (from >= 0 && to >= 0) change = to < from ? "up" : "down";
    }
    const readChanged = prev.read !== row.read || prev.gaidenRead !== row.gaidenRead;
    status.set(row.id, { change, readChanged });
    if (change) counts[change]++;
    if (readChanged) counts.read++;
  }

  const alive = new Set(rows.map((row) => row.id));
  const removed = baseline.items.filter((item) => !alive.has(item.id)).map((item) => item.title);
  counts.removed = removed.length;
  const tierConfigChanged = baseline.tierOrder.join("\n") !== current.tierOrder.join("\n");
  return { first: false, status, counts, removed, tierConfigChanged };
}
