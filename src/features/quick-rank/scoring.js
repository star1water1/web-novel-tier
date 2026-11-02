// 최소 매칭의 숨은 내부 점수와 순위 계산. DB와 화면을 모른다.
// 점수는 다음 작품을 고르는 데와 최종 순서에만 쓴다. 화면에 보이지 않고 작품의 rating과 섞지 않는다.

export const ROUND_SIZE = 5;
const NEAR_POOL = 12;
const TIER_SCORES = [1900, 1700, 1560, 1440, 1300, 1100];
const START_RD = 350;
const MIN_RD = 60;

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
    rd: START_RD,
    matchCount: 0,
    ...extra,
  };
}

function kFactor(matchCount, rd) {
  const byCount = Math.min(1.25, Math.max(0.75, 1.25 - matchCount / 80));
  const byRd = Math.min(1.25, Math.max(0.75, rd / START_RD));
  return 24 * (byCount * 0.6 + byRd * 0.4);
}

/** 고른 작품이 나머지를 하나씩 이긴 것으로 친다. 넘긴 배열은 바꾸지 않는다. */
export function applyChoice(group, winnerId) {
  const copies = group.map((entry) => ({ ...entry }));
  const winner = copies.find((entry) => entry.id === winnerId);
  if (!winner) throw new Error("고른 작품이 후보에 없습니다.");
  for (const loser of copies) {
    if (loser === winner) continue;
    const expected = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
    const kWinner = kFactor(winner.matchCount, winner.rd);
    const kLoser = kFactor(loser.matchCount, loser.rd);
    winner.score += kWinner * (1 - expected);
    loser.score -= kLoser * expected;
    winner.rd = Math.max(MIN_RD, winner.rd * 0.98);
    loser.rd = Math.max(MIN_RD, loser.rd * 0.98);
    winner.matchCount += 1;
    loser.matchCount += 1;
  }
  return copies;
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
 * 다음에 보여 줄 작품들. 비교가 가장 적은 작품 하나와, 점수가 가까운 작품 중 무작위 4개.
 * 어느 줄에 나오는지가 판단에 영향을 주지 않게 순서도 섞는다.
 */
export function pickRound(entries, random = Math.random) {
  if (entries.length < 2) return [];
  const fewest = Math.min(...entries.map((entry) => entry.matchCount));
  const targets = entries.filter((entry) => entry.matchCount === fewest);
  const target = targets[Math.floor(random() * targets.length)];
  const near = shuffled(entries.filter((entry) => entry !== target), random)
    .sort((a, b) => Math.abs(a.score - target.score) - Math.abs(b.score - target.score))
    .slice(0, NEAR_POOL);
  const others = shuffled(near, random).slice(0, ROUND_SIZE - 1);
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
