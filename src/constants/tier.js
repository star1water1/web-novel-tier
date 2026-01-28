/**
 * 티어 시스템 상수 및 순수 함수
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 2416-2433
 * 
 * 사용법:
 * import { TIER_ORDER, getTierDiff, isTierHigher } from './src/constants';
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
