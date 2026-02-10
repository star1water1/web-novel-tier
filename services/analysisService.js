/**
 * 취향 분석 서비스
 * @module services/analysisService
 * 
 * @source_origin 원본 App.jsx 14669-15434줄
 * 
 * @description
 * 사용자의 웹소설 취향을 분석하는 서비스
 * - calcNovelReliabilityScore: 작품별 신뢰도 점수
 * - analyzePreferences: 전체 취향 분석
 * - generateInsights: 인사이트 생성
 */

import { MAJOR_GENRES, SUB_GENRES, TAG_SPECTRUM_GROUPS, normalizeTag } from "../constants/tags";

// ═══════════════════════════════════════════════════════════════
// 📌 통계 헬퍼 함수
// ═══════════════════════════════════════════════════════════════

/** 배열 평균 */
export const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

/** 배열 중앙값 */
export const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** 표준편차 */
export const stdDev = (arr) => {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
};

// ═══════════════════════════════════════════════════════════════
// 📌 신뢰도 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 작품별 신뢰도 점수 계산 (0-100)
 * @param {object} novel - 작품 객체
 * @param {number} totalCount - 전체 작품 수
 * @returns {number} 신뢰도 점수
 */
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
    // 전체 회차 모를 때: 절대 읽은 회차로 평가
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
// 📌 장르 파싱 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 대장르/부장르 JSON 문자열 파싱
 * @param {string} value - JSON 문자열
 * @returns {string[]}
 */
export function parseMajorSub(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return value ? [value] : [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 메인 분석 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 사용자 취향 분석
 * @param {Array} novels - 작품 배열
 * @param {Array} matches - 매칭 배열
 * @returns {object} 분석 결과
 */
export function analyzePreferences(novels, matches) {
  try {
    if (!novels || novels.length === 0) {
      return { error: "분석할 작품이 없습니다.", novels: 0 };
    }

    const totalCount = novels.length;
    const now = Date.now();
    
    // 모든 대장르/부장르 태그 셋
    const allMajorSet = new Set(MAJOR_GENRES);
    const allSubSet = new Set(SUB_GENRES);
    
    // 1. 신뢰도 계산 및 분류
    const enriched = novels.map(n => {
      // tag_data 파싱
      let tagDataMap = {};
      try {
        const td = JSON.parse(n.tag_data || "[]");
        if (Array.isArray(td)) {
          for (const item of td) {
            if (item && item.tag) {
              tagDataMap[item.tag] = item.intensity || 3;
            }
          }
        }
      } catch (e) {}
      
      // 태그 기반 대장르/부장르 추출
      const tagList = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      
      // 기존 major_genre, sub_genre 컬럼도 파싱
      const legacyMajors = parseMajorSub(n.major_genre);
      const legacySubs = parseMajorSub(n.sub_genre);
      
      // 태그에서 대장르/부장르 추출
      const tagBasedMajors = tagList.filter(t => allMajorSet.has(t));
      const tagBasedSubs = tagList.filter(t => allSubSet.has(t));
      
      // 합치기 (중복 제거)
      const majorGenres = [...new Set([...legacyMajors, ...tagBasedMajors])];
      const subGenres = [...new Set([...legacySubs, ...tagBasedSubs])];
      
      return {
        ...n,
        reliability: calcNovelReliabilityScore(n, totalCount),
        readRatio: (Number(n.total_episodes) > 0) 
          ? Number(n.read_count) / Number(n.total_episodes) 
          : null,
        majorGenres,
        subGenres,
        tagList,
        tagDataMap,
        platList: (() => { try { return JSON.parse(n.platforms || "[]"); } catch { return []; } })(),
        daysSinceCreated: (now - (n.created_at || now)) / (1000 * 60 * 60 * 24),
        rating: Number(n.rating) || 1500,
        rereadCount: Math.max(1, Number(n.reread_count) || 1),
        rereadWeight: 1 + Math.sqrt(Math.max(1, Number(n.reread_count) || 1) - 1) * 0.7,
      };
    });
    
    const highReliability = enriched.filter(n => n.reliability >= 60);
    const mediumReliability = enriched.filter(n => n.reliability >= 30 && n.reliability < 60);
    const lowReliability = enriched.filter(n => n.reliability < 30);
    
    // 다회독 통계
    const rereadNovels = enriched.filter(n => n.rereadCount >= 2);
    const totalRereadCount = enriched.reduce((sum, n) => sum + n.rereadCount, 0);
    
    // 분석 대상 (신뢰도 30% 이상 또는 전체)
    let reliable = enriched.filter(n => n.reliability >= 30);
    if (reliable.length < 5) {
      reliable = enriched;
    }
  
    // 2. 기본 통계
    const basicStats = {
      total: totalCount,
      highReliability: highReliability.length,
      mediumReliability: mediumReliability.length,
      lowReliability: lowReliability.length,
      avgRating: avg(reliable.map(n => n.rating)),
      medianRating: median(reliable.map(n => n.rating)),
      stdDevRating: stdDev(reliable.map(n => n.rating)),
      avgReadCount: avg(reliable.filter(n => n.read_count > 0).map(n => Number(n.read_count))),
      totalReadCount: reliable.reduce((sum, n) => sum + (Number(n.read_count) || 0), 0),
      completedCount: reliable.filter(n => n.status === "completed").length,
      droppedCount: reliable.filter(n => n.status === "dropped").length,
      readingCount: reliable.filter(n => n.status === "reading").length,
      rereadNovelCount: rereadNovels.length,
      totalRereadCount,
      avgRereadCount: totalCount > 0 ? totalRereadCount / totalCount : 1,
    };
  
    // 3. 대장르 분석
    const majorGenreStats = {};
    for (const n of reliable) {
      for (const g of n.majorGenres) {
        if (!majorGenreStats[g]) {
          majorGenreStats[g] = { count: 0, weightedCount: 0, ratings: [], readRatios: [], completed: 0, dropped: 0, wins: 0, losses: 0, readCounts: [], rereadSum: 0 };
        }
        const stat = majorGenreStats[g];
        const rereadWeight = n.rereadWeight || (1 + Math.sqrt(n.rereadCount - 1) * 0.7);
        stat.count++;
        stat.weightedCount += rereadWeight;
        stat.ratings.push(n.rating);
        if (n.readRatio !== null) stat.readRatios.push(n.readRatio);
        stat.readCounts.push(Number(n.read_count) || 0);
        if (n.status === "completed") stat.completed++;
        if (n.status === "dropped") stat.dropped++;
        stat.wins += Number(n.wins) || 0;
        stat.losses += Number(n.losses) || 0;
        stat.rereadSum += n.rereadCount;
      }
    }
  
    const majorGenreAnalysis = Object.entries(majorGenreStats)
      .map(([genre, stat]) => ({
        genre,
        count: stat.count,
        weightedCount: stat.weightedCount,
        avgRating: avg(stat.ratings),
        medianRating: median(stat.ratings),
        avgReadRatio: avg(stat.readRatios),
        completionRate: stat.count > 0 ? stat.completed / stat.count : 0,
        dropRate: stat.count > 0 ? stat.dropped / stat.count : 0,
        winRate: (stat.wins + stat.losses) > 0 ? stat.wins / (stat.wins + stat.losses) : 0,
        totalRead: stat.readCounts.reduce((a, b) => a + b, 0),
        avgReread: stat.count > 0 ? stat.rereadSum / stat.count : 1,
      }))
      .sort((a, b) => b.weightedCount - a.weightedCount || b.avgRating - a.avgRating);

    // 4. 부장르 분석
    const subGenreStats = {};
    for (const n of reliable) {
      for (const g of n.subGenres) {
        if (!subGenreStats[g]) {
          subGenreStats[g] = { count: 0, weightedCount: 0, ratings: [], completed: 0, dropped: 0, rereadSum: 0 };
        }
        const rereadWeight = n.rereadWeight || (1 + Math.sqrt(n.rereadCount - 1) * 0.7);
        subGenreStats[g].count++;
        subGenreStats[g].weightedCount += rereadWeight;
        subGenreStats[g].ratings.push(n.rating);
        if (n.status === "completed") subGenreStats[g].completed++;
        if (n.status === "dropped") subGenreStats[g].dropped++;
        subGenreStats[g].rereadSum += n.rereadCount;
      }
    }
  
    const subGenreAnalysis = Object.entries(subGenreStats)
      .map(([genre, stat]) => ({
        genre,
        count: stat.count,
        weightedCount: stat.weightedCount,
        avgRating: avg(stat.ratings),
        dropRate: stat.count > 0 ? stat.dropped / stat.count : 0,
        avgReread: stat.count > 0 ? stat.rereadSum / stat.count : 1,
      }))
      .sort((a, b) => b.weightedCount - a.weightedCount || b.avgRating - a.avgRating);

    // 5. 일반 태그 분석 (농도 가중치 적용)
    const tagStats = {};
    for (const n of reliable) {
      for (const tag of n.tagList) {
        if (!tagStats[tag]) {
          tagStats[tag] = { count: 0, weightedCount: 0, ratings: [], dropped: 0, rereadSum: 0, intensitySum: 0 };
        }
        const rereadWeight = n.rereadWeight || (1 + Math.sqrt(n.rereadCount - 1) * 0.7);
        const intensity = n.tagDataMap[tag] || 3;
        const intensityWeight = intensity / 3;
        
        tagStats[tag].count++;
        tagStats[tag].weightedCount += rereadWeight * intensityWeight;
        tagStats[tag].ratings.push(n.rating);
        tagStats[tag].intensitySum += intensity;
        if (n.status === "dropped") tagStats[tag].dropped++;
      }
    }
  
    const tagAnalysis = Object.entries(tagStats)
      .filter(([_, stat]) => stat.count >= 2)
      .map(([tag, stat]) => ({
        tag,
        count: stat.count,
        weightedCount: stat.weightedCount,
        avgRating: avg(stat.ratings),
        avgIntensity: stat.count > 0 ? stat.intensitySum / stat.count : 3,
        dropRate: stat.count > 0 ? stat.dropped / stat.count : 0,
      }))
      .sort((a, b) => b.weightedCount - a.weightedCount || b.avgRating - a.avgRating);

    // 6. 태그 조합 분석 (2개 조합)
    const combos = {};
    for (const n of reliable) {
      const allTags = [...n.majorGenres, ...n.subGenres];
      for (let i = 0; i < allTags.length; i++) {
        for (let j = i + 1; j < allTags.length; j++) {
          const key = [allTags[i], allTags[j]].sort().join(" + ");
          if (!combos[key]) combos[key] = { count: 0, ratings: [] };
          combos[key].count++;
          combos[key].ratings.push(n.rating);
        }
      }
    }
  
    const comboAnalysis = Object.entries(combos)
      .filter(([_, stat]) => stat.count >= 3)
      .map(([combo, stat]) => ({
        combo,
        count: stat.count,
        avgRating: avg(stat.ratings),
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 15);

    // 7. 플랫폼 분석
    const platStats = {};
    for (const n of reliable) {
      for (const p of n.platList) {
        if (!platStats[p]) {
          platStats[p] = { count: 0, ratings: [], readRatios: [], completed: 0, dropped: 0 };
        }
        platStats[p].count++;
        platStats[p].ratings.push(n.rating);
        if (n.readRatio !== null) platStats[p].readRatios.push(n.readRatio);
        if (n.status === "completed") platStats[p].completed++;
        if (n.status === "dropped") platStats[p].dropped++;
      }
    }
  
    const platformAnalysis = Object.entries(platStats)
      .map(([platform, stat]) => ({
        platform,
        count: stat.count,
        avgRating: avg(stat.ratings),
        avgReadRatio: avg(stat.readRatios),
        completionRate: stat.count > 0 ? stat.completed / stat.count : 0,
        dropRate: stat.count > 0 ? stat.dropped / stat.count : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 8. 작가 분석
    const authorStats = {};
    for (const n of reliable) {
      const author = (n.author || "").trim();
      if (!author) continue;
      if (!authorStats[author]) {
        authorStats[author] = { 
          count: 0, 
          ratings: [], 
          novels: [],
          genres: [],
          subGenres: [],
          tags: [],
          completed: 0,
          dropped: 0,
          totalRead: 0,
          totalEpisodes: 0,
        };
      }
      authorStats[author].count++;
      authorStats[author].ratings.push(n.rating);
      authorStats[author].novels.push({ title: n.title, rating: n.rating });
      authorStats[author].genres.push(...n.majorGenres);
      authorStats[author].subGenres.push(...n.subGenres);
      authorStats[author].tags.push(...n.tagList);
      if (n.status === "completed") authorStats[author].completed++;
      if (n.status === "dropped") authorStats[author].dropped++;
      authorStats[author].totalRead += Number(n.read_count) || 0;
      authorStats[author].totalEpisodes += Number(n.total_episodes) || 0;
    }
  
    // 작가별 특징 분석
    const loyalAuthors = Object.entries(authorStats)
      .filter(([_, stat]) => stat.count >= 2)
      .map(([author, stat]) => {
        const genreCount = {};
        for (const g of stat.genres) {
          genreCount[g] = (genreCount[g] || 0) + 1;
        }
        const mainGenres = Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([g]) => g);
        
        const tagCount = {};
        for (const t of stat.tags) {
          tagCount[t] = (tagCount[t] || 0) + 1;
        }
        const mainTags = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([t]) => t);
        
        const features = [];
        if (mainGenres.length > 0) features.push(`${mainGenres.join("/")} 장르`);
        if (mainTags.length > 0) features.push(`${mainTags.slice(0, 2).join(", ")} 특징`);
        
        const completionRate = stat.count > 0 ? stat.completed / stat.count : 0;
        if (completionRate >= 0.7) features.push("높은 완독률");
        if (stat.dropped === 0 && stat.count >= 2) features.push("드롭 없음");
        
        return {
          author,
          count: stat.count,
          avgRating: avg(stat.ratings),
          novels: stat.novels || [],
          mainGenres,
          mainTags,
          completionRate,
          dropRate: stat.count > 0 ? stat.dropped / stat.count : 0,
          totalRead: stat.totalRead,
          features: features.join(" · ") || "분석 중",
          ratingBias: avg(stat.ratings) - basicStats.avgRating,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating);

    // 9. 읽기 패턴 분석
    const lengthGroups = { short: [], medium: [], long: [] };
    for (const n of reliable) {
      const ep = Number(n.total_episodes) || 0;
      if (ep > 0 && ep < 100) lengthGroups.short.push(n);
      else if (ep >= 100 && ep < 400) lengthGroups.medium.push(n);
      else if (ep >= 400) lengthGroups.long.push(n);
    }
  
    const readingPattern = {
      lengthPreference: {
        short: { count: lengthGroups.short.length, avgRating: avg(lengthGroups.short.map(n => n.rating)) },
        medium: { count: lengthGroups.medium.length, avgRating: avg(lengthGroups.medium.map(n => n.rating)) },
        long: { count: lengthGroups.long.length, avgRating: avg(lengthGroups.long.map(n => n.rating)) },
      },
      preferredLength: (() => {
        const lens = [
          { key: "short", rating: avg(lengthGroups.short.map(n => n.rating)) || 0 },
          { key: "medium", rating: avg(lengthGroups.medium.map(n => n.rating)) || 0 },
          { key: "long", rating: avg(lengthGroups.long.map(n => n.rating)) || 0 },
        ];
        return lens.sort((a, b) => b.rating - a.rating)[0]?.key || "unknown";
      })(),
      completedVsOngoing: {
        completed: reliable.filter(n => n.work_status === "completed"),
        ongoing: reliable.filter(n => n.work_status === "ongoing"),
      },
      droppedNovels: reliable.filter(n => n.status === "dropped").map(n => ({
        title: n.title,
        readCount: n.read_count,
        totalEpisodes: n.total_episodes,
        tags: [...n.majorGenres, ...n.subGenres].join(", "),
      })),
    };

    // 10. 매칭 분석
    let matchAnalysis = { total: 0, autoCount: 0, manualCount: 0, genreVsGenre: {} };
    if (matches && matches.length > 0) {
      const novelMap = {};
      for (const n of enriched) novelMap[n.id] = n;
      
      let autoCount = 0;
      let manualCount = 0;
      const genreVsGenre = {};
      
      for (const m of matches) {
        if (m.decided_by === "auto") autoCount++;
        else manualCount++;
        
        const a = novelMap[m.a_id];
        const b = novelMap[m.b_id];
        if (!a || !b) continue;
        
        const winnerGenres = m.winner_id === m.a_id ? a.majorGenres : b.majorGenres;
        const loserGenres = m.winner_id === m.a_id ? b.majorGenres : a.majorGenres;
        
        for (const wg of winnerGenres) {
          for (const lg of loserGenres) {
            if (wg === lg) continue;
            const key = `${wg}_vs_${lg}`;
            if (!genreVsGenre[key]) genreVsGenre[key] = { wins: 0, losses: 0 };
            genreVsGenre[key].wins++;
            
            const reverseKey = `${lg}_vs_${wg}`;
            if (!genreVsGenre[reverseKey]) genreVsGenre[reverseKey] = { wins: 0, losses: 0 };
            genreVsGenre[reverseKey].losses++;
          }
        }
      }
      
      matchAnalysis = {
        total: matches.length,
        autoCount,
        manualCount,
        autoRatio: matches.length > 0 ? autoCount / matches.length : 0,
        genreVsGenre: Object.entries(genreVsGenre)
          .filter(([_, v]) => v.wins + v.losses >= 3)
          .map(([key, v]) => ({
            matchup: key.replace("_vs_", " > "),
            wins: v.wins,
            total: v.wins + v.losses,
            winRate: (v.wins + v.losses) > 0 ? v.wins / (v.wins + v.losses) : 0,
          }))
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 10),
      };
    }

    // 11. 시간 트렌드
    const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000);
    const recent = reliable.filter(n => (n.created_at || 0) >= threeMonthsAgo);
    const older = reliable.filter(n => (n.created_at || 0) < threeMonthsAgo);
  
    const trendAnalysis = {
      recent: {
        count: recent.length,
        avgRating: avg(recent.map(n => n.rating)),
        topGenres: (() => {
          const gc = {};
          for (const n of recent) {
            for (const g of n.majorGenres) gc[g] = (gc[g] || 0) + 1;
          }
          return Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
        })(),
      },
      older: {
        count: older.length,
        avgRating: avg(older.map(n => n.rating)),
        topGenres: (() => {
          const gc = {};
          for (const n of older) {
            for (const g of n.majorGenres) gc[g] = (gc[g] || 0) + 1;
          }
          return Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
        })(),
      },
    };

    // 12. 이상치 탐지
    const anomalies = {
      highRatingLowRead: reliable.filter(n => 
        n.rating >= 1700 && n.readRatio !== null && n.readRatio < 0.3
      ).map(n => ({ title: n.title, rating: n.rating, readRatio: n.readRatio })),
      lowRatingHighRead: reliable.filter(n => 
        n.rating < 1500 && n.readRatio !== null && n.readRatio > 0.6
      ).map(n => ({ title: n.title, rating: n.rating, readRatio: n.readRatio })),
      noMatchHighRating: enriched.filter(n => 
        (Number(n.match_count) || 0) <= 2 && n.rating >= 1700
      ).map(n => ({ title: n.title, rating: n.rating, matchCount: n.match_count })),
      rereadButLowRating: enriched.filter(n =>
        (Number(n.reread_count) || 1) >= 2 && n.rating < 1550
      ).map(n => ({ title: n.title, rating: n.rating, rereadCount: Number(n.reread_count) || 1 })),
      lowInfoQuality: enriched.filter(n => 
        n.reliability < 25 && n.rating >= 1600
      ).map(n => ({ title: n.title, rating: n.rating, reliability: n.reliability })),
    };

    // 13. 스펙트럼 분석
    const spectrumAnalysis = analyzeSpectrum(reliable, TAG_SPECTRUM_GROUPS, normalizeTag);

    // 14. 종합 인사이트 생성
    const insights = generateInsights({
      basicStats, majorGenreAnalysis, subGenreAnalysis, tagAnalysis,
      comboAnalysis, platformAnalysis, loyalAuthors, readingPattern,
      matchAnalysis, trendAnalysis, anomalies, reliable
    });

    return {
      timestamp: now,
      basicStats,
      majorGenreAnalysis,
      subGenreAnalysis,
      tagAnalysis: tagAnalysis.slice(0, 20),
      comboAnalysis,
      platformAnalysis,
      loyalAuthors: loyalAuthors.slice(0, 10),
      readingPattern,
      matchAnalysis,
      trendAnalysis,
      anomalies,
      spectrumAnalysis,
      insights,
    };
  } catch (e) {
    console.warn("analyzePreferences error:", e);
    return { error: "분석 처리 중 오류: " + (e.message || e.toString()), novels: novels?.length || 0 };
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 스펙트럼 분석 헬퍼
// ═══════════════════════════════════════════════════════════════

function analyzeSpectrum(reliable, spectrumGroups, normalizeTagFn) {
  const spectrumAnalysis = {};
  const spectrumIds = Object.keys(spectrumGroups || {});
  
  for (const spectrumId of spectrumIds) {
    const spectrum = spectrumGroups[spectrumId];
    if (!spectrum || !spectrum.tags) continue;
    
    const spectrumLength = spectrum.tags.length;
    const novelAnalyses = [];
    
    for (const n of reliable) {
      let tagData = [];
      try {
        tagData = JSON.parse(n.tag_data || "[]");
        if (!Array.isArray(tagData)) tagData = [];
      } catch { tagData = []; }
      
      const matches = tagData.filter(t => 
        spectrum.tags.includes(t.tag) || spectrum.tags.includes(normalizeTagFn(t.tag))
      );
      
      if (matches.length > 0) {
        let sumPos = 0, sumWeight = 0;
        for (const m of matches) {
          const tag = normalizeTagFn(m.tag);
          const pos = spectrum.tags.indexOf(tag);
          if (pos >= 0) {
            const intensity = m.intensity || 3;
            sumPos += (pos + 1) * intensity;
            sumWeight += intensity;
          }
        }
        
        if (sumWeight > 0) {
          const avgPosition = sumPos / sumWeight;
          const normalizedPosition = avgPosition / spectrumLength;
          novelAnalyses.push({
            id: n.id,
            title: n.title,
            rating: n.rating,
            position: avgPosition,
            normalizedPosition,
            tags: matches.map(m => m.tag),
          });
        }
      }
    }
    
    if (novelAnalyses.length >= 2) {
      const positions = novelAnalyses.map(n => n.normalizedPosition);
      const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
      
      const highRated = novelAnalyses.filter(n => n.rating >= 1700);
      const highRatedAvgPos = highRated.length > 0 
        ? highRated.reduce((sum, n) => sum + n.normalizedPosition, 0) / highRated.length 
        : avgPos;
      
      const segments = [
        { range: "1구간", novels: [], avgRating: 0 },
        { range: "2구간", novels: [], avgRating: 0 },
        { range: "3구간", novels: [], avgRating: 0 },
        { range: "4구간", novels: [], avgRating: 0 },
        { range: "5구간", novels: [], avgRating: 0 },
      ];
      
      for (const n of novelAnalyses) {
        const segIdx = Math.min(4, Math.max(0, Math.floor((n.normalizedPosition || 0) * 5)));
        if (segments[segIdx]) {
          segments[segIdx].novels.push(n);
        }
      }
      
      for (const seg of segments) {
        if (seg.novels.length > 0) {
          seg.avgRating = seg.novels.reduce((sum, n) => sum + n.rating, 0) / seg.novels.length;
        }
      }
      
      const validSegments = segments.filter(s => s.novels.length >= 1);
      const preferredSegment = validSegments.length > 0
        ? validSegments.reduce((best, s) => s.avgRating > best.avgRating ? s : best)
        : null;
      
      spectrumAnalysis[spectrumId] = {
        name: spectrum.name,
        description: spectrum.description,
        tags: spectrum.tags,
        novelCount: novelAnalyses.length,
        avgPosition: avgPos,
        highRatedAvgPosition: highRatedAvgPos,
        segments,
        preferredSegment: preferredSegment?.range || null,
        preferredSegmentAvgRating: preferredSegment?.avgRating || 0,
        preferenceLabel: avgPos < 0.35 ? spectrum.tags[0] + " 선호" 
                       : avgPos > 0.65 ? spectrum.tags[spectrumLength - 1] + " 선호"
                       : "중간 성향",
      };
    }
  }
  
  return spectrumAnalysis;
}

// ═══════════════════════════════════════════════════════════════
// 📌 인사이트 생성
// ═══════════════════════════════════════════════════════════════

/**
 * 분석 결과로부터 인사이트 생성
 */
export function generateInsights(data) {
  const { basicStats, majorGenreAnalysis, subGenreAnalysis, tagAnalysis, 
          comboAnalysis, platformAnalysis, loyalAuthors, readingPattern,
          matchAnalysis, trendAnalysis, anomalies, reliable } = data;
  
  // 핵심 선호 장르
  const topMajorGenres = majorGenreAnalysis.slice(0, 3).map(g => g.genre);
  const topSubGenres = subGenreAnalysis.slice(0, 3).map(g => g.genre);
  const topPlatform = platformAnalysis[0]?.platform || "";
  
  // 선호 길이
  const lengthLabel = {
    short: "단편(100화 미만)",
    medium: "중편(100~400화)",
    long: "장편(400화 이상)",
    unknown: "다양한 길이"
  }[readingPattern.preferredLength];
  
  // 핵심 취향 문장
  const corePreference = `${topMajorGenres[0] || "다양한 장르"} 기반에 ${topSubGenres.slice(0, 2).join(", ") || "다양한 소재"}를 선호하며, ${lengthLabel}의 작품을 즐겨 읽습니다.${topPlatform ? ` ${topPlatform} 플랫폼을 주로 이용합니다.` : ""}`;

  // 숨겨진 패턴
  const hiddenPatterns = [];
  
  if (loyalAuthors.length > 0) {
    const topAuthor = loyalAuthors[0];
    hiddenPatterns.push(`'${topAuthor.author}' 작가의 작품을 ${topAuthor.count}개 읽으며 평균 ${topAuthor.avgRating.toFixed(0)}점`);
  }
  
  if (comboAnalysis.length > 0 && comboAnalysis[0].avgRating > basicStats.avgRating + 50) {
    hiddenPatterns.push(`'${comboAnalysis[0].combo}' 조합에서 평균보다 +${(comboAnalysis[0].avgRating - basicStats.avgRating).toFixed(0)}점 높은 만족도`);
  }
  
  const completedAvg = avg(readingPattern.completedVsOngoing.completed.map(n => n.rating));
  const ongoingAvg = avg(readingPattern.completedVsOngoing.ongoing.map(n => n.rating));
  if (Math.abs(completedAvg - ongoingAvg) > 30) {
    if (completedAvg > ongoingAvg) {
      hiddenPatterns.push(`완결작을 연재중 작품보다 평균 +${(completedAvg - ongoingAvg).toFixed(0)}점 높게 평가`);
    } else {
      hiddenPatterns.push(`연재중 작품을 완결작보다 평균 +${(ongoingAvg - completedAvg).toFixed(0)}점 높게 평가`);
    }
  }
  
  // 기피 요소
  const avoidFactors = [];
  
  const highDropTags = [...subGenreAnalysis, ...tagAnalysis]
    .filter(t => t.dropRate > 0.3 && t.count >= 3)
    .slice(0, 3);
  for (const t of highDropTags) {
    avoidFactors.push(`${t.genre || t.tag} (드롭률 ${(t.dropRate * 100).toFixed(0)}%)`);
  }
  
  const lowRatedGenres = majorGenreAnalysis.filter(g => g.avgRating < basicStats.avgRating - 80);
  for (const g of lowRatedGenres.slice(0, 2)) {
    avoidFactors.push(`${g.genre} (평균 대비 -${(basicStats.avgRating - g.avgRating).toFixed(0)}점)`);
  }
  
  // 추천 조건
  const recommendConditions = {
    mustHave: topMajorGenres.slice(0, 2),
    preferred: topSubGenres.slice(0, 3),
    avoid: avoidFactors.slice(0, 3),
  };
  
  // 취향 변화 감지
  let trendNote = "";
  if (trendAnalysis.recent.count >= 5 && trendAnalysis.older.count >= 5) {
    const recentTopGenre = trendAnalysis.recent.topGenres[0];
    const olderTopGenre = trendAnalysis.older.topGenres[0];
    if (recentTopGenre && olderTopGenre && recentTopGenre !== olderTopGenre) {
      trendNote = `최근 취향이 '${olderTopGenre}'에서 '${recentTopGenre}'로 변화하는 추세`;
    }
  }
  
  // 데이터 품질 점수
  const dataQualityScore = Math.round(
    (basicStats.highReliability / basicStats.total) * 100
  );
  
  return {
    corePreference,
    hiddenPatterns,
    avoidFactors,
    recommendConditions,
    trendNote,
    dataQualityScore,
    reliableCount: basicStats.highReliability + basicStats.mediumReliability,
    suspiciousCount: basicStats.lowReliability,
  };
}
