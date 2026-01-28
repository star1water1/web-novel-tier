/**
 * 취향 분석 관련 헬퍼 함수 (순수 함수)
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 2423-2478
 * 
 * 사용법:
 * import { createGenreMatchupKey, findSharedTags, wilsonConfidenceInterval } from './src/utils';
 */

// ═══════════════════════════════════════════════════════════════
// 🎯 장르 매치업 키 생성 (알파벳 순 정렬로 일관성)
// ═══════════════════════════════════════════════════════════════
export function createGenreMatchupKey(genreA, genreB) {
  if (!genreA || !genreB) return null;
  if (genreA === genreB) return null;
  const sorted = [genreA, genreB].sort();
  return `${sorted[0]}_vs_${sorted[1]}`;
}

// ═══════════════════════════════════════════════════════════════
// 🎯 공통 태그 찾기
// ═══════════════════════════════════════════════════════════════
export function findSharedTags(tagsA, tagsB) {
  if (!tagsA || !tagsB) return [];
  const setB = new Set(tagsB.map(t => t.toLowerCase()));
  return tagsA.filter(t => setB.has(t.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════
// 🎯 읽은 비율 계산
// ═══════════════════════════════════════════════════════════════
export function calculateReadRatio(novel) {
  const read = Number(novel.read_count) || 0;
  const total = Number(novel.total_episodes) || 0;
  if (total <= 0) return 0.5;  // 모르면 중립
  return Math.min(1, read / total);
}

// ═══════════════════════════════════════════════════════════════
// 🎯 레이팅 갭 버킷 생성
// ═══════════════════════════════════════════════════════════════
export function getGapBucket(gap) {
  if (gap < 50) return "tiny";      // 0-49
  if (gap < 100) return "small";    // 50-99
  if (gap < 200) return "medium";   // 100-199
  if (gap < 300) return "large";    // 200-299
  return "huge";                     // 300+
}

// ═══════════════════════════════════════════════════════════════
// 🎯 윌슨 신뢰구간 계산 (통계적 유의성)
// ═══════════════════════════════════════════════════════════════
export function wilsonConfidenceInterval(successes, total, confidence = 0.95) {
  if (total === 0) return { lower: 0, upper: 1 };
  
  const z = confidence === 0.95 ? 1.96 : 1.645;
  const p = successes / total;
  const n = total;
  
  const denominator = 1 + z * z / n;
  const center = p + z * z / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n);
  
  return {
    lower: Math.max(0, (center - spread) / denominator),
    upper: Math.min(1, (center + spread) / denominator),
  };
}
