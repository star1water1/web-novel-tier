/**
 * 매치 인사이트 서비스 (v6.0)
 * @module services/matchInsightsService
 * 
 * @source_origin 원본 App.jsx 5037-5163줄 (127줄)
 * 
 * @description
 * 매치 히스토리에서 인사이트 재구축
 * 
 * 주요 기능:
 * - rebuildMatchInsightsFromHistory: 매칭 이력 분석 및 인사이트 생성
 * 
 * @dependencies
 * - database: all
 */

import { all } from "../database";

// ═══════════════════════════════════════════════════════════════
// 📌 매치 인사이트 재구축
// ═══════════════════════════════════════════════════════════════

async function rebuildMatchInsightsFromHistory(novels) {
  const matches = await all("SELECT * FROM matches ORDER BY created_at ASC;");
  
  if (!matches || matches.length === 0) {
    return { insights: [], upsetFactors: [], stats: { total: 0, rebuilt: 0, skipped: 0, upsets: 0 } };
  }
  
  // 소설 맵 생성
  const novelMap = {};
  for (const n of novels) {
    novelMap[n.id] = n;
  }
  
  const insights = [];
  const upsetFactorMap = {}; // 이변 요인 누적
  let skipped = 0;
  let upsetCount = 0;
  
  for (const m of matches) {
    const winner = novelMap[m.winner_id];
    const loserId = m.winner_id === m.a_id ? m.b_id : m.a_id;
    const loser = novelMap[loserId];
    
    // 삭제된 작품이면 스킵
    if (!winner || !loser) {
      skipped++;
      continue;
    }
    
    const winnerRating = Number(winner.rating) || 1500;
    const loserRating = Number(loser.rating) || 1500;
    const gap = m.gap_when_matched || Math.abs(winnerRating - loserRating);
    
    // 이변 판정 (근사치):
    // - 매칭 당시 격차(gap_when_matched)가 100 이상이고
    // - 현재 레이팅 기준으로 승자가 패자보다 낮으면 이변으로 간주
    // - 또는 gap_when_matched가 100 이상인데 decided_by가 user면 잠재적 이변
    const isUpset = gap >= 100 && winnerRating < loserRating;
    
    // 예측 정확도 (현재 레이팅 기준)
    const wasCorrect = winnerRating >= loserRating;
    
    if (isUpset) upsetCount++;
    
    const insight = {
      matchId: m.id,
      winnerId: winner.id,
      winnerTitle: winner.title,
      loserId: loser.id,
      loserTitle: loser.title,
      ratingDiff: gap,
      isUpset,
      wasCorrect,
      decidedBy: m.decided_by || "user",
      timestamp: m.created_at,
      // 근사치임을 표시
      isApproximate: true,
    };
    
    insights.push(insight);
    
    // 이변 요인 분석 (근사치)
    if (isUpset) {
      // 승자(이변을 일으킨 작품)의 태그 분석
      const winnerTags = (winner.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      const loserTags = (loser.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      
      // 승자에게만 있는 태그 = 긍정 요인
      const winnerOnlyTags = winnerTags.filter(t => !loserTags.includes(t));
      for (const tag of winnerOnlyTags) {
        const key = `tag:${tag}`;
        if (!upsetFactorMap[key]) {
          upsetFactorMap[key] = { type: "tag_only_winner", key: tag, direction: "positive", occurrences: 0 };
        }
        upsetFactorMap[key].occurrences++;
      }
      
      // 패자에게만 있는 태그 = 부정 요인
      const loserOnlyTags = loserTags.filter(t => !winnerTags.includes(t));
      for (const tag of loserOnlyTags) {
        const key = `tag_neg:${tag}`;
        if (!upsetFactorMap[key]) {
          upsetFactorMap[key] = { type: "tag_only_loser", key: tag, direction: "negative", occurrences: 0 };
        }
        upsetFactorMap[key].occurrences++;
      }
      
      // 장르 분석
      const winnerGenre = winner.major_genre || "";
      const loserGenre = loser.major_genre || "";
      if (winnerGenre && winnerGenre !== loserGenre) {
        const gKey = `genre:${winnerGenre}`;
        if (!upsetFactorMap[gKey]) {
          upsetFactorMap[gKey] = { type: "genre_preference", key: winnerGenre, direction: "positive", occurrences: 0 };
        }
        upsetFactorMap[gKey].occurrences++;
      }
      
      // 작가 분석
      const winnerAuthor = (winner.author || "").trim();
      if (winnerAuthor) {
        const aKey = `author:${winnerAuthor}`;
        if (!upsetFactorMap[aKey]) {
          upsetFactorMap[aKey] = { type: "author_preference", key: winnerAuthor, direction: "positive", occurrences: 0 };
        }
        upsetFactorMap[aKey].occurrences++;
      }
    }
  }
  
  // 요인 배열로 변환
  const upsetFactors = Object.values(upsetFactorMap)
    .filter(f => f.occurrences >= 2) // 2회 이상 발생한 것만
    .sort((a, b) => b.occurrences - a.occurrences);
  
  return {
    insights,
    upsetFactors,
    stats: {
      total: matches.length,
      rebuilt: insights.length,
      skipped,
      upsets: upsetCount,
      upsetRate: insights.length > 0 ? ((upsetCount / insights.length) * 100).toFixed(1) : 0,
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 📌 Export
// ═══════════════════════════════════════════════════════════════

export {
  rebuildMatchInsightsFromHistory,
};
