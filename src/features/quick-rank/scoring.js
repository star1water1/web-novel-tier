// 최소 매칭의 숨은 내부 점수와 순위 계산. DB와 화면을 모른다.
// 점수는 다음 작품을 고르는 데와 최종 순서에만 쓴다. 화면에 보이지 않고 작품의 rating과 섞지 않는다.
// 칸을 사전 정보로, 고르기 기록 전체를 Plackett-Luce 우도로 다시 추정한다. 기록이 원본이고 점수는 계산 결과다.

export const ROUND_SIZE = 5;
const TIER_SCORES = [1900, 1700, 1560, 1440, 1300, 1100];
const SCORE_PER_LOGIT = 50;
const PRIOR_RD = 100;
const FIT_STEP = 0.7;
const FIT_MAX_STEP = 1; // 곡률이 작은 작품의 점수가 튀어 발산하지 않게 한 번에 움직이는 양을 묶는다.
const FIT_MAX_PASSES = 80;
const FIT_TOLERANCE = 0.01;

/** 티어 칸에 넣었을 때의 시작 점수. 티어 수가 6개가 아니면 사이 값을 쓴다. */
export function startScore(tierIndex, tierCount) {
  if (tierCount <= 1) return 1500;
  const position = (Math.max(0, Math.min(tierIndex, tierCount - 1)) / (tierCount - 1)) * (TIER_SCORES.length - 1);
  const low = Math.floor(position);
  const high = Math.min(low + 1, TIER_SCORES.length - 1);
  return TIER_SCORES[low] + (TIER_SCORES[high] - TIER_SCORES[low]) * (position - low);
}

export function newEntry(id, cellTier, tierOrder, extra = {}) {
  return {
    id,
    cellTier,
    score: startScore(tierOrder.indexOf(cellTier), tierOrder.length),
    rd: PRIOR_RD,
    matchCount: 0,
    ...extra,
  };
}

/** 비교 횟수만 센다. 고른 작품은 나머지를 하나씩 이긴 것으로 친다. 넘긴 배열은 바꾸지 않는다. */
export function countChoice(group, winnerId) {
  if (!group.some((entry) => entry.id === winnerId)) throw new Error("고른 작품이 후보에 없습니다.");
  return group.map((entry) => ({
    ...entry,
    matchCount: entry.matchCount + (entry.id === winnerId ? group.length - 1 : 1),
  }));
}

function estimate(entries, logs, tierOrder, start, maxPasses) {
  const indexById = new Map(entries.map((entry, index) => [entry.id, index]));
  const prior = entries.map((entry) => (startScore(tierOrder.indexOf(entry.cellTier), tierOrder.length) - 1500) / SCORE_PER_LOGIT);
  const precision = (SCORE_PER_LOGIT / PRIOR_RD) ** 2;
  // 지운 작품은 기록에서 뺀다. 고른 작품이 없어진 기록은 건너뛴다.
  const rounds = [];
  for (const log of logs) {
    const win = indexById.get(log.chosen);
    if (win === undefined) continue;
    const members = log.shown.map((id) => indexById.get(id)).filter((index) => index !== undefined);
    if (members.length >= 2) rounds.push({ members, win });
  }
  const theta = start ? start.map((score) => (score - 1500) / SCORE_PER_LOGIT) : [...prior];
  const gradient = new Array(entries.length);
  const curvature = new Array(entries.length).fill(precision);
  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = 0; i < entries.length; i++) {
      gradient[i] = precision * (prior[i] - theta[i]);
      curvature[i] = precision;
    }
    for (const { members, win } of rounds) {
      let sum = 0;
      for (const i of members) sum += Math.exp(theta[i]);
      for (const i of members) {
        const share = Math.exp(theta[i]) / sum;
        gradient[i] -= share;
        curvature[i] += share * (1 - share);
      }
      gradient[win] += 1;
    }
    let largest = 0;
    for (let i = 0; i < entries.length; i++) {
      const step = Math.max(-FIT_MAX_STEP, Math.min(FIT_MAX_STEP, FIT_STEP * gradient[i] / curvature[i]));
      theta[i] += step;
      largest = Math.max(largest, Math.abs(step));
    }
    if (largest * SCORE_PER_LOGIT < FIT_TOLERANCE) break;
  }
  return entries.map((entry, i) => ({
    ...entry,
    score: 1500 + theta[i] * SCORE_PER_LOGIT,
    rd: SCORE_PER_LOGIT / Math.sqrt(curvature[i]),
  }));
}

/** 칸과 기록 전체로 점수를 처음부터 계산한다. 같은 입력이면 결과가 같아 미리보기와 적용이 일치한다. logs: [{shown, chosen}] */
export function fitScores(entries, logs, tierOrder) {
  return estimate(entries, logs, tierOrder, null, FIT_MAX_PASSES);
}

/** 고를 때마다 부른다. 지금 점수에서 한 번만 고쳐 다음 후보에 쓴다. */
export function refineScores(entries, logs, tierOrder) {
  return estimate(entries, logs, tierOrder, entries.map((entry) => entry.score), 1);
}

function shuffled(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 다음에 보여 줄 작품들. 가장 불확실한 작품 하나와, 점수가 비슷하고 아직 불확실한 작품 4개.
 * 어느 줄에 나오는지가 판단에 영향을 주지 않게 순서도 섞는다.
 */
export function pickRound(entries, random = Math.random) {
  if (entries.length < 2) return [];
  const variance = (entry) => (entry.rd / SCORE_PER_LOGIT) ** 2;
  let target = entries[0];
  let widest = -1;
  for (const entry of entries) {
    const value = variance(entry) * (1 + 0.001 * random());
    if (value > widest) { widest = value; target = entry; }
  }
  const others = entries
    .filter((entry) => entry !== target)
    .map((entry) => ({
      entry,
      rank: Math.abs(entry.score - target.score) / SCORE_PER_LOGIT / Math.sqrt(variance(target) + variance(entry) + 1)
        - 0.3 * Math.sqrt(variance(entry))
        + 0.02 * random(),
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, ROUND_SIZE - 1)
    .map((item) => item.entry);
  return shuffled([target, ...others], random);
}

const orderValue = (value) => Number(value) || 0;

/**
 * 적용할 티어와 순서를 계산한다.
 * entries: 비교에 참여한 작품 {id, cellTier, score, manualTier, manualOrder}
 * held: 매칭 제외 작품 {id, manualTier, manualOrder}. 티어와 칸 안 자리를 유지한다.
 * moveTiers: true면 티어별 작품 수는 칸 그대로 두고 점수 순으로 채운다. false면 칸 안에서만 정렬한다.
 */
export function computeResult({ entries, held = [], tierOrder, moveTiers = true }) {
  const tierIndex = (tier) => {
    const index = tierOrder.indexOf(tier);
    return index < 0 ? tierOrder.length : index;
  };
  const ranked = [...entries].sort((a, b) =>
    b.score - a.score
    || tierIndex(a.cellTier) - tierIndex(b.cellTier)
    || tierIndex(a.manualTier) - tierIndex(b.manualTier)
    || orderValue(a.manualOrder) - orderValue(b.manualOrder)
    || String(a.id).localeCompare(String(b.id))
  );

  const byTier = new Map(tierOrder.map((tier) => [tier, []]));
  if (moveTiers) {
    let next = 0;
    for (const tier of tierOrder) {
      const count = entries.filter((entry) => entry.cellTier === tier).length;
      byTier.set(tier, ranked.slice(next, next + count));
      next += count;
    }
  } else {
    for (const entry of ranked) byTier.get(entry.cellTier)?.push(entry);
  }

  const rows = [];
  for (const tier of tierOrder) {
    const list = byTier.get(tier);
    const before = [...entries, ...held]
      .filter((work) => work.manualTier === tier)
      .sort((a, b) => orderValue(a.manualOrder) - orderValue(b.manualOrder));
    before.forEach((work, index) => {
      if (held.includes(work)) list.splice(Math.min(index, list.length), 0, work);
    });
    list.forEach((work, index) => {
      rows.push({
        id: work.id,
        beforeTier: work.manualTier ?? null,
        beforeOrder: orderValue(work.manualOrder),
        afterTier: tier,
        afterOrder: (index + 1) * 100,
        held: held.includes(work),
      });
    });
  }
  return rows;
}
