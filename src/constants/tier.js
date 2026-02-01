/**
 * 티어 시스템 상수 및 순수 함수
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 2416-2433, 14301-14354
 * 
 * 사용법:
 * import { TIER_ORDER, getTierDiff, isTierHigher, tierRank, getTierColor } from './src/constants';
 */

// ═══════════════════════════════════════════════════════════════
// 🏆 티어 순서 (높은 순)
// ═══════════════════════════════════════════════════════════════
export const TIER_ORDER = ["S", "A", "B+", "B", "B-", "C"];

// ═══════════════════════════════════════════════════════════════
// 🏆 티어 차이 계산 (양수면 A가 높음)
// ═══════════════════════════════════════════════════════════════
export function getTierDiff(tierA, tierB) {
  const idxA = TIER_ORDER.indexOf(tierA);
  const idxB = TIER_ORDER.indexOf(tierB);
  if (idxA === -1 || idxB === -1) return 0;
  return idxB - idxA;
}

// ═══════════════════════════════════════════════════════════════
// 🏆 티어가 더 높은지 확인
// ═══════════════════════════════════════════════════════════════
export function isTierHigher(tierA, tierB) {
  return getTierDiff(tierA, tierB) > 0;
}

// ═══════════════════════════════════════════════════════════════
// 🏆 티어 순위 비교용 (S=0, A=1, ... C=5)
// ═══════════════════════════════════════════════════════════════
export function tierRank(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? 5 : idx;
}

// ═══════════════════════════════════════════════════════════════
// 🏆 티어 색상 가져오기
// ═══════════════════════════════════════════════════════════════
export function getTierColor(tier) {
  const colors = {
    S: "#8b5cf6",
    A: "#3b82f6", 
    "B+": "#22c55e",
    B: "#a3e635",
    "B-": "#f59e0b",
    C: "#ef4444",
  };
  return colors[tier] || colors.C;
}
