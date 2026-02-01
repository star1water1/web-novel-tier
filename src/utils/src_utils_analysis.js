/**
 * 취향 분석 관련 헬퍼 함수 (순수 함수)
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 2423-2478
 * 
 * v4.0 Step 26: 취향 발견 시스템 헬퍼 추가 (2025-01-29)
 * - createNovelSnapshot, createComparisonData, collectChoiceContext 추가
 * 
 * 사용법:
 * import { createGenreMatchupKey, findSharedTags, wilsonConfidenceInterval } from './src/utils';
 */

import { getTierDiff, isTierHigher } from '../constants/tier';

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

// ═══════════════════════════════════════════════════════════════
// 📊 작품별 신뢰도 점수 계산 (분석용 확장 버전)
// ═══════════════════════════════════════════════════════════════
export function calcNovelReliabilityScore(novel, totalCount) {
  let score = 0;
  const totalEp = Number(novel.total_episodes) || 0;
  const readCnt = Number(novel.read_count) || 0;
  const matchCnt = Number(novel.match_count) || 0;
  const rereadCnt = Number(novel.reread_count) || 1;
  const daysSinceCreated = (Date.now() - (novel.created_at || Date.now())) / (1000 * 60 * 60 * 24);
  
  // 1. 읽은 비율/양 (0-30점)
  if (totalEp > 0) {
    const readRatio = readCnt / totalEp;
    score += Math.min(30, readRatio * 30);
  } else {
    if (readCnt >= 300) score += 30;
    else if (readCnt >= 200) score += 27;
    else if (readCnt >= 100) score += 24;
    else if (readCnt >= 50) score += 20;
    else if (readCnt >= 20) score += 15;
    else if (readCnt >= 10) score += 10;
    else if (readCnt >= 1) score += 5;
  }
  
  // 2. 매칭 참여도 (0-30점)
  const maxMatch = Math.max(1, totalCount - 1);
  const matchRatio = matchCnt / maxMatch;
  score += Math.min(30, matchRatio * 40);
  
  // 3. 등록 성숙도 (0-15점)
  if (daysSinceCreated >= 30) score += 15;
  else if (daysSinceCreated >= 7) score += 12;
  else if (daysSinceCreated >= 1) score += 5;
  
  // 4. 상태 기반 (0-15점)
  if (novel.status === "completed") score += 15;
  else if (novel.status === "reading") score += 12;
  else if (novel.status === "paused") score += 8;
  else if (novel.status === "dropped") score += 5;
  
  // 5. 다회독 보너스 (0-10점)
  if (rereadCnt >= 5) score += 10;
  else if (rereadCnt >= 3) score += 7;
  else if (rereadCnt >= 2) score += 4;
  
  return Math.min(100, score);
}

// ═══════════════════════════════════════════════════════════════
// 📊 통계 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════
export const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const stdDev = (arr) => {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
};

// ═══════════════════════════════════════════════════════════════
// 🧠 취향 발견 시스템 헬퍼 (v4.0 Step 26)
// ═══════════════════════════════════════════════════════════════

/**
 * 작품 스냅샷 생성 (선택 시점의 상태 캡처)
 */
export function createNovelSnapshot(novel) {
  if (!novel) return null;
  
  // 태그 파싱
  let tags = [];
  try {
    const tagData = JSON.parse(novel.tag_data || "[]");
    if (Array.isArray(tagData)) {
      tags = tagData.map(t => t.tag || t).filter(Boolean);
    }
  } catch {
    tags = (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean);
  }
  
  // 플랫폼 파싱
  let platforms = [];
  try {
    platforms = JSON.parse(novel.platforms || "[]");
  } catch {
    platforms = [];
  }
  
  // 대장르 파싱
  let majorGenre = null;
  try {
    const mg = JSON.parse(novel.major_genre || "[]");
    majorGenre = Array.isArray(mg) ? mg[0] : mg;
  } catch {
    majorGenre = novel.major_genre || null;
  }
  
  // 레이팅에서 티어 계산
  const rating = Number(novel.rating) || 1500;
  let tier = "C";
  if (rating >= 1950) tier = "S";
  else if (rating >= 1850) tier = "A";
  else if (rating >= 1700) tier = "B+";
  else if (rating >= 1600) tier = "B";
  else if (rating >= 1500) tier = "B-";
  
  return {
    id: novel.id,
    title: novel.title || "",
    rating: rating,
    tier: tier,
    rd: Number(novel.rd) || 350,
    wins: Number(novel.wins) || 0,
    losses: Number(novel.losses) || 0,
    match_count: Number(novel.match_count) || 0,
    major_genre: majorGenre,
    tags: tags,
    author: novel.author || "",
    read_count: Number(novel.read_count) || 0,
    total_episodes: Number(novel.total_episodes) || 0,
    read_ratio: calculateReadRatio(novel),
    platforms: platforms,
    status: novel.status || "reading",
  };
}

/**
 * 두 작품 간 비교 데이터 생성
 */
export function createComparisonData(winnerSnap, loserSnap) {
  if (!winnerSnap || !loserSnap) return {};
  
  const ratingGap = Math.abs(winnerSnap.rating - loserSnap.rating);
  const ratingWinnerHigher = winnerSnap.rating >= loserSnap.rating;
  
  return {
    ratingGap: ratingGap,
    ratingWinnerHigher: ratingWinnerHigher,
    tierDiff: getTierDiff(winnerSnap.tier, loserSnap.tier),
    tierWinnerHigher: isTierHigher(winnerSnap.tier, loserSnap.tier),
    genreMatchup: createGenreMatchupKey(winnerSnap.major_genre, loserSnap.major_genre),
    winnerGenre: winnerSnap.major_genre,
    loserGenre: loserSnap.major_genre,
    sharedTags: findSharedTags(winnerSnap.tags, loserSnap.tags),
    winnerOnlyTags: winnerSnap.tags.filter(t => !loserSnap.tags.map(x => x.toLowerCase()).includes(t.toLowerCase())),
    loserOnlyTags: loserSnap.tags.filter(t => !winnerSnap.tags.map(x => x.toLowerCase()).includes(t.toLowerCase())),
    readRatioDiff: winnerSnap.read_ratio - loserSnap.read_ratio,
    sameAuthor: winnerSnap.author && winnerSnap.author === loserSnap.author,
    winnerAuthor: winnerSnap.author,
    loserAuthor: loserSnap.author,
  };
}

/**
 * 선택 맥락 전체 수집
 */
export function collectChoiceContext(winner, loser) {
  const winnerSnapshot = createNovelSnapshot(winner);
  const loserSnapshot = createNovelSnapshot(loser);
  
  if (!winnerSnapshot || !loserSnapshot) {
    console.warn("[collectChoiceContext] Invalid novel data");
    return null;
  }
  
  const comparison = createComparisonData(winnerSnapshot, loserSnapshot);
  
  return {
    winnerSnapshot,
    loserSnapshot,
    comparison,
  };
}
