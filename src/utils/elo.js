/**
 * Elo 레이팅 시스템 (순수 함수)
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 4972-5006
 * 
 * 사용법:
 * import { expected, kFactor, applyElo } from './src/utils';
 */

// ═══════════════════════════════════════════════════════════════
// 🎯 예상 승률 계산
// ═══════════════════════════════════════════════════════════════
export const expected = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

// ═══════════════════════════════════════════════════════════════
// 🎯 K-Factor 계산 (매칭 횟수 + RD 기반)
// ═══════════════════════════════════════════════════════════════
export const kFactor = (mc, rd) => {
  const base = 24;
  const mcAdj = Math.min(1.25, Math.max(0.75, 1.25 - mc / 80));
  const rdAdj = Math.min(1.25, Math.max(0.75, (rd || 350) / 350));
  return base * (mcAdj * 0.6 + rdAdj * 0.4);
};

// ═══════════════════════════════════════════════════════════════
// 🎯 Elo 적용 (순수 함수 - 두 작품의 새 레이팅 반환)
// ═══════════════════════════════════════════════════════════════
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
