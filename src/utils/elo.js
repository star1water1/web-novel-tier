/**
 * src/utils/elo.js
 * Elo 레이팅 시스템 관련 유틸리티 함수
 * 
 * 분리 날짜: 2025-01-28
 * v4.0 Step 31: rebuildAllFromMatches 추가 (2025-01-29)
 * 
 * 사용법:
 * import { expected, kFactor, applyElo, rebuildAllFromMatches } from './src/utils';
 */

import { exec, all, execBatch } from './database';

// ═══════════════════════════════════════════════════════════════
// 🎯 예상 승률 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 기대 승률 계산
 * @param {number} ra - 플레이어 A의 레이팅
 * @param {number} rb - 플레이어 B의 레이팅
 * @returns {number} A의 기대 승률 (0~1)
 */
export const expected = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

// ═══════════════════════════════════════════════════════════════
// 🎯 K-Factor 계산 (매칭 횟수 + RD 기반)
// ═══════════════════════════════════════════════════════════════

/**
 * K-factor 계산 (매치 수와 RD에 따라 동적 조정)
 * @param {number} mc - 매치 카운트
 * @param {number} rd - Rating Deviation
 * @returns {number} K-factor
 */
export const kFactor = (mc, rd) => {
  const base = 24;
  const mcAdj = Math.min(1.25, Math.max(0.75, 1.25 - mc / 80));
  const rdAdj = Math.min(1.25, Math.max(0.75, (rd || 350) / 350));
  return base * (mcAdj * 0.6 + rdAdj * 0.4);
};

// ═══════════════════════════════════════════════════════════════
// 🎯 Elo 적용 (순수 함수 - 두 작품의 새 레이팅 반환)
// ═══════════════════════════════════════════════════════════════

/**
 * Elo 레이팅 적용 (두 작품의 대결 결과 반영)
 * @param {Object} A - 작품 A 객체 (rating, rd, match_count, wins, losses)
 * @param {Object} B - 작품 B 객체
 * @param {boolean} aWin - A가 이겼는지 여부
 * @returns {{ newA: Object, newB: Object, kA: number, kB: number }}
 */
export function applyElo(A, B, aWin) {
  const Ea = expected(A.rating, B.rating),
    Eb = expected(B.rating, A.rating);
  const kA = kFactor(A.match_count || 0, A.rd || 350);
  const kB = kFactor(B.match_count || 0, B.rd || 350);
  const Sa = aWin ? 1 : 0,
    Sb = aWin ? 0 : 1;
  const newA = { ...A },
    newB = { ...B };

  newA.rating = A.rating + kA * (Sa - Ea);
  newB.rating = B.rating + kB * (Sb - Eb);
  newA.rd = Math.max(60, (A.rd || 350) * 0.98);
  newB.rd = Math.max(60, (B.rd || 350) * 0.98);
  newA.match_count = (A.match_count || 0) + 1;
  newB.match_count = (B.match_count || 0) + 1;

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
// 🔄 Elo 재계산 (v4.0 Step 31)
// ═══════════════════════════════════════════════════════════════

/**
 * 매치 로그 기준 전체 재계산 (메모리 기반 최적화)
 * 
 * ⚠️ 중요: 이 함수는 Elo 관련 필드(rating, rd, wins, losses, match_count)만 초기화합니다.
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
