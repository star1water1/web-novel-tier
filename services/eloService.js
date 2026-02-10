/**
 * Elo 레이팅 계산 서비스
 * @module services/eloService
 * 
 * @source_origin 원본 App.jsx 4954-5029줄
 * 
 * @description
 * Elo 레이팅 시스템 구현
 * - expected(): 예상 승률 계산
 * - kFactor(): K-factor 계산
 * - applyElo(): 매칭 결과 적용
 * - rebuildAllFromMatches(): 전체 재계산
 */

import { all, exec, execBatch } from "../database/connection";

// ═══════════════════════════════════════════════════════════════
// 📌 Elo 계산 기본 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 예상 승률 계산
 * @param {number} ra - 플레이어 A 레이팅
 * @param {number} rb - 플레이어 B 레이팅
 * @returns {number} A의 예상 승률 (0-1)
 */
export const expected = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

/**
 * K-factor 계산 (동적)
 * - 매칭 수가 적을수록 K가 높음 (빠른 수렴)
 * - RD(Rating Deviation)가 높을수록 K가 높음 (불확실성 반영)
 * 
 * @param {number} mc - 매칭 수
 * @param {number} rd - Rating Deviation
 * @returns {number} K-factor
 */
export const kFactor = (mc, rd) => {
  const base = 24;
  const mcAdj = Math.min(1.25, Math.max(0.75, 1.25 - mc / 80));
  const rdAdj = Math.min(1.25, Math.max(0.75, (rd || 350) / 350));
  return base * (mcAdj * 0.6 + rdAdj * 0.4);
};

/**
 * 매칭 결과 적용 (Elo 업데이트)
 * @param {object} A - 작품 A
 * @param {object} B - 작품 B
 * @param {boolean} aWin - A가 승리했는지
 * @returns {{ newA: object, newB: object, kA: number, kB: number }}
 */
export function applyElo(A, B, aWin) {
  const Ea = expected(A.rating, B.rating);
  const Eb = expected(B.rating, A.rating);
  const kA = kFactor(A.match_count || 0, A.rd || 350);
  const kB = kFactor(B.match_count || 0, B.rd || 350);
  const Sa = aWin ? 1 : 0;
  const Sb = aWin ? 0 : 1;
  
  const newA = { ...A };
  const newB = { ...B };

  // 레이팅 업데이트
  newA.rating = A.rating + kA * (Sa - Ea);
  newB.rating = B.rating + kB * (Sb - Eb);
  
  // RD 감소 (최소 60)
  newA.rd = Math.max(60, (A.rd || 350) * 0.98);
  newB.rd = Math.max(60, (B.rd || 350) * 0.98);
  
  // 매칭 수 증가
  newA.match_count = (A.match_count || 0) + 1;
  newB.match_count = (B.match_count || 0) + 1;

  // 승패 기록
  if (aWin) {
    newA.wins = (A.wins || 0) + 1;
    newB.losses = (B.losses || 0) + 1;
  } else {
    newB.wins = (B.wins || 0) + 1;
    newA.losses = (A.losses || 0) + 1;
  }

  return { newA, newB, kA, kB };
}

// ═══════════════════════════════════════════════════════════════
// 📌 전체 재계산
// ═══════════════════════════════════════════════════════════════

/**
 * 매치 로그 기준 전체 재계산 (메모리 기반 최적화)
 * 
 * ⚠️ 중요: Elo 관련 필드(rating, rd, wins, losses, match_count)만 초기화합니다.
 * manual_tier(수동 티어 지정)는 변경하지 않으며, 검토 시스템의 S/A 지정이 유지됩니다.
 * 
 * @returns {Promise<void>}
 */
export async function rebuildAllFromMatches() {
  const logs = await all(`SELECT * FROM matches ORDER BY created_at ASC;`);

  // 1) 모든 소설의 Elo 관련 필드만 초기화 (manual_tier는 건드리지 않음!)
  await exec(
    `UPDATE novels SET rating=1500, rd=350, wins=0, losses=0, match_count=0;`
  );

  // 2) 모든 소설 메모리에 로드
  const novelMap = {};
  const novels = await all(`SELECT * FROM novels;`);
  for (const n of novels) {
    novelMap[n.id] = { ...n };
  }

  // 3) 매치 로그를 순서대로 적용
  for (const m of logs) {
    const A = novelMap[m.a_id];
    const B = novelMap[m.b_id];
    if (!A || !B) continue;

    const { newA, newB } = applyElo(A, B, m.winner_id === m.a_id);
    novelMap[m.a_id] = { ...novelMap[m.a_id], ...newA };
    novelMap[m.b_id] = { ...novelMap[m.b_id], ...newB };
  }

  // 4) 한 번의 트랜잭션으로 DB 갱신 (Elo 필드만)
  const updateQueries = Object.values(novelMap).map((n) => ({
    sql: `UPDATE novels SET rating=?, rd=?, wins=?, losses=?, match_count=? WHERE id=?`,
    params: [n.rating, n.rd, n.wins, n.losses, n.match_count, n.id],
  }));
  
  if (updateQueries.length > 0) {
    await execBatch(updateQueries);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 예측 및 분석 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 예측 승률 (퍼센트)
 * @param {number} ratingA - A 레이팅
 * @param {number} ratingB - B 레이팅
 * @returns {number} A의 예상 승률 (0-100)
 */
export function predictWinRate(ratingA, ratingB) {
  return Math.round(expected(ratingA, ratingB) * 100);
}

/**
 * 레이팅 변화량 예측
 * @param {object} A - 작품 A
 * @param {object} B - 작품 B
 * @param {boolean} aWin - A가 승리 시
 * @returns {{ deltaA: number, deltaB: number }}
 */
export function predictRatingChange(A, B, aWin) {
  const { newA, newB } = applyElo(A, B, aWin);
  return {
    deltaA: newA.rating - A.rating,
    deltaB: newB.rating - B.rating,
  };
}

/**
 * 이변 여부 판정
 * @param {number} winnerRating - 승자 레이팅
 * @param {number} loserRating - 패자 레이팅
 * @param {number} threshold - 임계값 (기본 100)
 * @returns {boolean}
 */
export function isUpset(winnerRating, loserRating, threshold = 100) {
  return loserRating - winnerRating >= threshold;
}

/**
 * 매칭 품질 점수 (0-100)
 * - 레이팅 격차가 작을수록 좋은 매칭
 * @param {number} ratingA - A 레이팅
 * @param {number} ratingB - B 레이팅
 * @returns {number}
 */
export function matchQuality(ratingA, ratingB) {
  const gap = Math.abs(ratingA - ratingB);
  // 격차 0 → 100점, 격차 400 이상 → 0점
  return Math.max(0, Math.round(100 - gap / 4));
}
