/**
 * src/utils/tierSystem.js
 * 티어 시스템 상태 관리 (전역 임계값 캡슐화)
 * 
 * v4.0 Step 27 - 전역 변수 의존성 버그 방지
 * 
 * ⚠️ 중요: 이 모듈은 전역 티어 임계값을 캡슐화하여
 *    - 설정 로드 전 호출 시에도 안전하게 기본값 사용
 *    - 모듈 간 상태 공유 가능
 *    - 테스트 용이성 향상
 * 
 * 사용법:
 * import { 
 *   setTierThresholds, getTierThresholds,
 *   tierFromRating, getDisplayTier, getReviewStatus,
 *   tierBadge
 * } from './src/utils';
 */

import { TIER_ORDER, tierRank, getTierColor } from '../constants/tier';
import { DEFAULT_TIER_THRESHOLDS } from '../constants/settings';

// ═══════════════════════════════════════════════════════════════
// 📊 캡슐화된 전역 상태
// ═══════════════════════════════════════════════════════════════

/**
 * 전역 티어 임계값 (모듈 내부에서만 직접 접근)
 * - 앱 시작 시 설정에서 로드됨
 * - setTierThresholds()로만 변경 가능
 */
let _globalTierThresholds = { ...DEFAULT_TIER_THRESHOLDS };

// ═══════════════════════════════════════════════════════════════
// 🔧 상태 관리 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 티어 임계값 설정 (설정 로드 시 호출)
 * @param {Object} thresholds - { S: number, A: number, "B+": number, B: number, "B-": number }
 */
export function setTierThresholds(thresholds) {
  if (!thresholds || typeof thresholds !== 'object') {
    console.warn('[setTierThresholds] Invalid thresholds, using defaults');
    _globalTierThresholds = { ...DEFAULT_TIER_THRESHOLDS };
    return;
  }
  
  _globalTierThresholds = {
    ...DEFAULT_TIER_THRESHOLDS,
    ...thresholds,
  };
}

/**
 * 현재 티어 임계값 조회 (읽기 전용 복사본)
 * @returns {Object} 현재 임계값 복사본
 */
export function getTierThresholds() {
  return { ..._globalTierThresholds };
}

/**
 * 티어 임계값 초기화 (테스트용)
 */
export function resetTierThresholds() {
  _globalTierThresholds = { ...DEFAULT_TIER_THRESHOLDS };
}

// ═══════════════════════════════════════════════════════════════
// 🏆 티어 계산 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 레이팅에서 티어 계산
 * @param {number} r - 레이팅 점수
 * @param {Object} [thresholds] - 임계값 (생략 시 전역 임계값 사용)
 * @returns {string} 티어 ("S", "A", "B+", "B", "B-", "C")
 */
export function tierFromRating(r, thresholds = _globalTierThresholds) {
  if (r >= thresholds.S) return "S";
  if (r >= thresholds.A) return "A";
  if (r >= thresholds["B+"]) return "B+";
  if (r >= thresholds.B) return "B";
  if (r >= thresholds["B-"]) return "B-";
  return "C";
}

/**
 * 실제 표시 티어 계산 (S/A는 수동 검토 필요)
 * @param {Object} novel - 작품 객체 (rating, manual_tier 필요)
 * @param {Object} [thresholds] - 임계값 (생략 시 전역 임계값 사용)
 * @returns {string} 표시 티어
 */
export function getDisplayTier(novel, thresholds = _globalTierThresholds) {
  const recommended = tierFromRating(novel.rating || 1500, thresholds);
  
  // S/A 수동 지정이 있으면 그것 사용
  if (novel.manual_tier === 'S' || novel.manual_tier === 'A') {
    return novel.manual_tier;
  }
  
  // 권장 티어가 S/A인데 수동 지정 없으면 B+ 이하 중 최고로 고정
  // (검토를 통해서만 S/A 진입 가능)
  if (recommended === 'S' || recommended === 'A') {
    return 'B+';
  }
  
  // B+ 이하는 점수 기반 자동
  return recommended;
}

/**
 * 검토 상태 확인
 * @param {Object} novel - 작품 객체
 * @param {Object} [thresholds] - 임계값
 * @returns {Object|null} { type: 'promote'|'demote', from, to } 또는 null
 */
export function getReviewStatus(novel, thresholds = _globalTierThresholds) {
  const recommended = tierFromRating(novel.rating || 1500, thresholds);
  const actual = getDisplayTier(novel, thresholds);
  
  // 현재 S/A인데 권장이 더 낮음 → 강등 검토
  if ((actual === 'S' || actual === 'A') && tierRank(recommended) > tierRank(actual)) {
    return { type: 'demote', from: actual, to: recommended };
  }
  
  // 권장이 S/A인데 현재가 더 낮음 → 승급 검토
  if ((recommended === 'S' || recommended === 'A') && tierRank(actual) > tierRank(recommended)) {
    return { type: 'promote', from: actual, to: recommended };
  }
  
  return null; // 검토 불필요
}

// ═══════════════════════════════════════════════════════════════
// 🎨 티어 뱃지 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 레이팅에서 티어 뱃지 정보 반환
 * @param {number} r - 레이팅
 * @param {Object} [thresholds] - 임계값
 * @returns {{ t: string, c: string }} 티어와 색상
 */
export function tierBadge(r, thresholds = _globalTierThresholds) {
  const t = tierFromRating(r, thresholds);
  const c = getTierColor(t);
  return { t, c };
}

/**
 * 작품에서 실제 표시 티어 뱃지 정보 반환
 * @param {Object} novel - 작품 객체
 * @param {Object} [thresholds] - 임계값
 * @returns {{ t: string, c: string, isManual: boolean }}
 */
export function getDisplayTierBadge(novel, thresholds = _globalTierThresholds) {
  const t = getDisplayTier(novel, thresholds);
  const c = getTierColor(t);
  const isManual = novel.manual_tier === 'S' || novel.manual_tier === 'A';
  return { t, c, isManual };
}

// ═══════════════════════════════════════════════════════════════
// 📊 티어 통계 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 티어별 작품 수 집계
 * @param {Array} novels - 작품 배열
 * @param {Object} [thresholds] - 임계값
 * @returns {Object} { S: n, A: n, "B+": n, B: n, "B-": n, C: n }
 */
export function countByTier(novels, thresholds = _globalTierThresholds) {
  const counts = { S: 0, A: 0, "B+": 0, B: 0, "B-": 0, C: 0 };
  
  for (const novel of novels) {
    const tier = getDisplayTier(novel, thresholds);
    counts[tier] = (counts[tier] || 0) + 1;
  }
  
  return counts;
}

/**
 * 티어별 작품 그룹화
 * @param {Array} novels - 작품 배열
 * @param {Object} [thresholds] - 임계값
 * @returns {Object} { S: [...], A: [...], ... }
 */
export function groupByTier(novels, thresholds = _globalTierThresholds) {
  const groups = { S: [], A: [], "B+": [], B: [], "B-": [], C: [] };
  
  for (const novel of novels) {
    const tier = getDisplayTier(novel, thresholds);
    if (!groups[tier]) groups[tier] = [];
    groups[tier].push(novel);
  }
  
  // 각 그룹 내에서 레이팅 내림차순 정렬
  for (const tier of TIER_ORDER) {
    groups[tier].sort((a, b) => (b.rating || 1500) - (a.rating || 1500));
  }
  
  return groups;
}

/**
 * 검토 필요한 작품 필터
 * @param {Array} novels - 작품 배열
 * @param {Object} [thresholds] - 임계값
 * @returns {Array} 검토 필요 작품 배열 (reviewStatus 포함)
 */
export function filterNeedsReview(novels, thresholds = _globalTierThresholds) {
  return novels
    .map(novel => ({
      novel,
      reviewStatus: getReviewStatus(novel, thresholds),
    }))
    .filter(item => item.reviewStatus !== null);
}
