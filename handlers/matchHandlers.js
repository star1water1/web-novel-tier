/**
 * 매칭/분석/인사이트/추천 핸들러 통합
 * @module handlers/matchHandlers
 * @merged matchHandlers + matchAnalysisHandlers + insightHandlers + recoHandlers
 */
import { exec, all, first, execBatch, getAppMeta, setAppMeta } from '../database';
import { applyElo, rebuildAllFromMatches } from '../services/eloService';
import { deriveMajorGenre, tierBadge, computeReliability } from '../constants';


// ═══════════════════════════════════════════════════════════════
// 📌 matchHandlers
// ═══════════════════════════════════════════════════════════════



export async function loadMatchStats() {
  const novels = await all("SELECT id FROM novels;");
  const n = novels.length;
  
  if (n < 2) {
    return { total: 0, done: 0, percent: 0 };
  }
  
  const total = (n * (n - 1)) / 2;
  const rows = await all(
    `SELECT COUNT(DISTINCT (CASE WHEN a_id < b_id THEN a_id || '|' || b_id ELSE b_id || '|' || a_id END)) AS c FROM matches;`
  );
  const done = rows[0]?.c || 0;
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  
  return { total, done, percent };
}

export async function pickRandomUnseenPair(focusNovelId = null) {
  const allNovels = await all("SELECT * FROM novels ORDER BY rating DESC;");
  
  if (!allNovels || allNovels.length < 2) {
    return { pair: null, error: "작품을 2개 이상 추가하세요." };
  }

  const played = new Set(
    (await all("SELECT a_id, b_id FROM matches;")).map((r) =>
      pairKey(r.a_id, r.b_id)
    )
  );

  const candidates = [];

  if (focusNovelId) {
    // 특정 작품이 선택된 경우: 해당 작품이 포함된 미대전 조합만 후보에 넣기
    const focus = allNovels.find((n) => n.id === focusNovelId);
    if (!focus) {
      return { pair: null, error: "선택한 작품을 찾을 수 없습니다.", clearFocus: true };
    }
    
    for (let i = 0; i < allNovels.length; i++) {
      const other = allNovels[i];
      if (other.id === focusNovelId) continue;
      if (played.has(pairKey(focus.id, other.id))) continue;
      candidates.push({ A: focus, B: other });
    }
  } else {
    // 평소처럼 전역 미대전 조합 전체에서 후보 생성
    for (let i = 0; i < allNovels.length; i++) {
      for (let j = i + 1; j < allNovels.length; j++) {
        const A = allNovels[i], B = allNovels[j];
        if (played.has(pairKey(A.id, B.id))) continue;
        candidates.push({ A, B });
      }
    }
  }

  if (candidates.length === 0) {
    const error = focusNovelId
      ? "선택한 작품이 포함된 새로운(미대전) 매칭이 없습니다."
      : "새로운(미대전) 매칭이 없습니다.";
    return { pair: null, error };
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return { pair: { A: picked.A, B: picked.B }, error: null };
}

export async function decideMatch(pair, winnerId, decidedBy = "user") {
  if (!pair) return null;

  const A = await first("SELECT * FROM novels WHERE id=?", [pair.A.id]);
  const B = await first("SELECT * FROM novels WHERE id=?", [pair.B.id]);
  
  if (!A || !B) {
    return { error: "작품을 찾을 수 없습니다." };
  }

  const aIsWinner = winnerId === A.id;
  const { newA, newB, kA, kB } = applyElo(A, B, aIsWinner);
  const kUsed = aIsWinner ? kA : kB;

  const mid = uuid();
  await execBatch([
    {
      sql: `UPDATE novels SET rating=?, rd=?, wins=?, losses=?, match_count=? WHERE id=?`,
      params: [newA.rating, newA.rd, newA.wins, newA.losses, newA.match_count, newA.id],
    },
    {
      sql: `UPDATE novels SET rating=?, rd=?, wins=?, losses=?, match_count=? WHERE id=?`,
      params: [newB.rating, newB.rd, newB.wins, newB.losses, newB.match_count, newB.id],
    },
    {
      sql: `INSERT INTO matches (id, a_id, b_id, winner_id, decided_by, gap_when_matched, k_factor_used, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        mid,
        A.id,
        B.id,
        winnerId,
        decidedBy,
        Math.abs(A.rating - B.rating),
        kUsed,
        Date.now(),
      ],
    },
  ]);

  return { matchId: mid, newA, newB };
}

export async function undoLastMatch(matchId) {
  if (!matchId) {
    return { error: "되돌릴 최근 매칭이 없습니다." };
  }

  await exec("DELETE FROM matches WHERE id=?", [matchId]);
  await rebuildAllFromMatches();
  
  return { success: true };
}

export async function deleteMatch(matchId) {
  await exec("DELETE FROM matches WHERE id=?", [matchId]);
  await rebuildAllFromMatches();
}

export async function flipMatchWinner(matchId) {
  const m = await first("SELECT * FROM matches WHERE id=?", [matchId]);
  if (!m) return { error: "매칭을 찾을 수 없습니다." };

  const newWinner = m.winner_id === m.a_id ? m.b_id : m.a_id;
  await exec("UPDATE matches SET winner_id=? WHERE id=?", [newWinner, matchId]);
  await rebuildAllFromMatches();
  
  return { newWinner };
}

export async function getNovelMatchLogs(novelId) {
  const logs = await all(
    `SELECT m.*, a.title AS a_title, b.title AS b_title
     FROM matches m
     LEFT JOIN novels a ON a.id = m.a_id
     LEFT JOIN novels b ON b.id = m.b_id
     WHERE m.a_id = ? OR m.b_id = ?
     ORDER BY m.created_at DESC;`,
    [novelId, novelId]
  );
  return logs || [];
}

export async function getHeadToHead(aId, bId) {
  const matches = await all(
    `SELECT * FROM matches WHERE (a_id=? AND b_id=?) OR (a_id=? AND b_id=?) ORDER BY created_at DESC;`,
    [aId, bId, bId, aId]
  );
  
  let aWins = 0, bWins = 0;
  for (const m of matches) {
    if (m.winner_id === aId) aWins++;
    else if (m.winner_id === bId) bWins++;
  }
  
  return { matches, aWins, bWins };
}

export async function resetAllMatches() {
  await exec("DELETE FROM matches;");
  await rebuildAllFromMatches();
}

// 페어 키 생성 (정렬된 ID 조합)
function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// UUID 생성
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ═══════════════════════════════════════════════════════════════
// 📌 matchAnalysisHandlers
// ═══════════════════════════════════════════════════════════════



export async function analyzeGenreMatchup(genreA, genreB) {
  if (!genreA || !genreB) return null;

  const matches = await all(
    `SELECT m.*, 
            a.tags AS a_tags, b.tags AS b_tags,
            a.rating AS a_rating, b.rating AS b_rating
     FROM matches m
     LEFT JOIN novels a ON a.id = m.a_id
     LEFT JOIN novels b ON b.id = m.b_id
     WHERE m.winner_id IS NOT NULL;`
  );

  let wins = 0;
  let losses = 0;

  for (const m of matches || []) {
    const majorA = deriveMajorGenre(m.a_tags);
    const majorB = deriveMajorGenre(m.b_tags);

    const aHasGenreA = majorA === genreA;
    const bHasGenreA = majorB === genreA;
    const aHasGenreB = majorA === genreB;
    const bHasGenreB = majorB === genreB;

    // genreA vs genreB 매칭인 경우
    if ((aHasGenreA && bHasGenreB) || (aHasGenreB && bHasGenreA)) {
      const winnerIsA = m.winner_id === m.a_id;
      const genreAWon = (aHasGenreA && winnerIsA) || (bHasGenreA && !winnerIsA);
      
      if (genreAWon) {
        wins++;
      } else {
        losses++;
      }
    }
  }

  const total = wins + losses;
  if (total === 0) return null;

  return {
    genreA,
    genreB,
    wins,
    losses,
    total,
    winRate: (wins / total * 100).toFixed(1),
  };
}

export async function analyzeMatchPrediction(A, B, tagRelations, upsetFactors) {
  if (!A || !B) return null;

  const ratingGap = A.rating - B.rating;
  const favorite = ratingGap >= 0 ? A : B;
  const underdog = ratingGap >= 0 ? B : A;
  const gap = Math.abs(ratingGap);

  // 기본 승률 (Elo 기반)
  const expectedWin = 1 / (1 + Math.pow(10, -gap / 400));

  // 태그 기반 분석
  const favTags = (favorite.tags || "").split(",").map(t => t.trim()).filter(Boolean);
  const undTags = (underdog.tags || "").split(",").map(t => t.trim()).filter(Boolean);

  // 장르 매칭 분석
  const favGenre = deriveMajorGenre(favorite.tags);
  const undGenre = deriveMajorGenre(underdog.tags);
  const genreMatchup = await analyzeGenreMatchup(favGenre, undGenre);

  // 업셋 가능성 계산
  let upsetChance = 0;
  const upsetReasons = [];

  // 1) 레이팅 갭이 작으면 업셋 가능성 증가
  const thresholdGap = upsetFactors?.ratingGap || 100;
  if (gap < thresholdGap) {
    upsetChance += 0.2;
    upsetReasons.push(`레이팅 차이 ${gap.toFixed(0)}점으로 근소함`);
  }

  // 2) 장르 상성 고려
  if (genreMatchup && genreMatchup.total >= 3) {
    const genreWinRate = parseFloat(genreMatchup.winRate);
    if (genreWinRate < 40) {
      upsetChance += 0.15;
      upsetReasons.push(`${favGenre} vs ${undGenre} 장르 상성 불리`);
    }
  }

  // 3) RD(불확실성) 고려
  if ((favorite.rd || 350) > 200) {
    upsetChance += 0.1;
    upsetReasons.push(`${favorite.title}의 레이팅 불확실성 높음`);
  }

  return {
    favorite,
    underdog,
    gap,
    expectedWin: (expectedWin * 100).toFixed(1),
    upsetChance: Math.min(0.5, upsetChance),
    upsetReasons,
    genreMatchup,
  };
}

export async function analyzeMatchResult(A, B, winnerId, prediction, tagRelations) {
  if (!A || !B || !winnerId) return null;

  const winner = winnerId === A.id ? A : B;
  const loser = winnerId === A.id ? B : A;

  const wasUpset = prediction && 
    prediction.favorite.id === loser.id && 
    prediction.gap >= 50;

  const insight = {
    winner,
    loser,
    wasUpset,
    ratingChange: null,
    analysis: [],
  };

  if (wasUpset) {
    insight.analysis.push({
      type: 'upset',
      message: `업셋! ${winner.title}이(가) ${prediction.gap.toFixed(0)}점 차이를 뒤집음`,
    });

    // 업셋 원인 분석
    const causes = analyzeUpsetCausesInternal(winner, loser, tagRelations);
    if (causes.length > 0) {
      insight.upsetCauses = causes;
    }
  }

  return insight;
}

function analyzeUpsetCausesInternal(winner, loser, tagRelations) {
  const causes = [];

  const winnerTags = (winner.tags || "").split(",").map(t => t.trim()).filter(Boolean);
  const loserTags = (loser.tags || "").split(",").map(t => t.trim()).filter(Boolean);

  // 태그 관계 기반 분석
  const groups = tagRelations?.groups || {};
  
  for (const wTag of winnerTags) {
    for (const [groupId, group] of Object.entries(groups)) {
      if (group.type === 'similar' && group.tags?.includes(wTag)) {
        // 유사 태그 그룹에 속한 경우
        const oppositeGroupId = group.oppositeGroupId;
        if (oppositeGroupId && groups[oppositeGroupId]) {
          const oppositeTags = groups[oppositeGroupId].tags || [];
          for (const lTag of loserTags) {
            if (oppositeTags.includes(lTag)) {
              causes.push({
                type: 'opposite_tags',
                winnerTag: wTag,
                loserTag: lTag,
                description: `${wTag} vs ${lTag} 상반된 태그`,
              });
            }
          }
        }
      }
    }
  }

  // 작가 동일 여부
  if (winner.author && winner.author === loser.author) {
    causes.push({
      type: 'same_author',
      author: winner.author,
      description: `같은 작가(${winner.author}) 내 선호도 차이`,
    });
  }

  // 읽은 회차 차이
  const winnerRead = winner.read_count || 0;
  const loserRead = loser.read_count || 0;
  if (winnerRead > loserRead * 2 && winnerRead > 50) {
    causes.push({
      type: 'read_count',
      description: `${winner.title}을 더 많이 읽음 (${winnerRead}회 vs ${loserRead}회)`,
    });
  }

  return causes;
}

export async function saveMatchInsight(insight) {
  const insights = (await getAppMeta("match_insights")) || [];
  
  insights.unshift({
    ...insight,
    timestamp: Date.now(),
  });

  // 최대 100개 유지
  if (insights.length > 100) {
    insights.pop();
  }

  await setAppMeta("match_insights", insights);
  return insights;
}

export async function loadMatchInsights() {
  return (await getAppMeta("match_insights")) || [];
}

// ═══════════════════════════════════════════════════════════════
// 📌 insightHandlers
// ═══════════════════════════════════════════════════════════════



export async function loadInsights() {
  return (await getAppMeta("insights")) || [];
}

export async function loadPreferencePatterns() {
  return (await getAppMeta("preference_patterns")) || [];
}

export async function handleInsightResponse(insightId, response, insights, setInsights) {
  const updated = (insights || []).map(ins => {
    if (ins.id === insightId) {
      return { ...ins, response, respondedAt: Date.now() };
    }
    return ins;
  });
  
  setInsights(updated);
  await setAppMeta("insights", updated);
}

export async function recordInsightFeedback(insightId, response) {
  const feedbacks = (await getAppMeta("insight_feedbacks")) || [];
  
  feedbacks.push({
    insightId,
    response,
    timestamp: Date.now(),
  });
  
  // 최대 200개 유지
  if (feedbacks.length > 200) {
    feedbacks.shift();
  }
  
  await setAppMeta("insight_feedbacks", feedbacks);
}

export async function adjustWeightsFromFeedback() {
  const feedbacks = (await getAppMeta("insight_feedbacks")) || [];
  const weights = (await getAppMeta("pattern_weights")) || {};
  
  // 긍정 피드백이 많은 패턴의 가중치 증가
  const positiveCounts = {};
  const negativeCounts = {};
  
  for (const fb of feedbacks) {
    if (fb.response === 'agree' || fb.response === 'helpful') {
      positiveCounts[fb.insightId] = (positiveCounts[fb.insightId] || 0) + 1;
    } else if (fb.response === 'disagree' || fb.response === 'not_helpful') {
      negativeCounts[fb.insightId] = (negativeCounts[fb.insightId] || 0) + 1;
    }
  }
  
  // 가중치 조정 (간단한 로직)
  for (const [id, count] of Object.entries(positiveCounts)) {
    weights[id] = Math.min(2.0, (weights[id] || 1.0) + count * 0.1);
  }
  
  for (const [id, count] of Object.entries(negativeCounts)) {
    weights[id] = Math.max(0.1, (weights[id] || 1.0) - count * 0.1);
  }
  
  await setAppMeta("pattern_weights", weights);
  return weights;
}

export async function checkAutoApprove(novelId) {
  const settings = (await getAppMeta("app_settings")) || {};
  const autoApprove = settings.autoApproveInsights;
  
  if (!autoApprove) return false;
  
  // 자동 승인 조건 체크 로직
  // (예: 특정 신뢰도 이상의 인사이트만 자동 승인)
  return true;
}

export async function generateMatchPrediction(novelA, novelB) {
  if (!novelA || !novelB) return null;
  
  const ratingGap = novelA.rating - novelB.rating;
  const expectedWin = 1 / (1 + Math.pow(10, -ratingGap / 400));
  
  const favorite = ratingGap >= 0 ? novelA : novelB;
  const underdog = ratingGap >= 0 ? novelB : novelA;
  
  return {
    favorite,
    underdog,
    gap: Math.abs(ratingGap),
    expectedWin: (expectedWin * 100).toFixed(1),
    confidence: Math.min(95, 50 + Math.abs(ratingGap) / 10),
  };
}

export async function performUndo(lastMatchId, setLastMatchId, rebuildCallback, loadCallback) {
  if (!lastMatchId) return { success: false, message: "되돌릴 매칭이 없습니다." };
  
  await exec("DELETE FROM matches WHERE id=?", [lastMatchId]);
  setLastMatchId(null);
  
  if (rebuildCallback) await rebuildCallback();
  if (loadCallback) await loadCallback();
  
  return { success: true, message: "마지막 매칭을 되돌렸습니다." };
}

export async function resetAll(loadCallback) {
  await execBatch([
    { sql: "DELETE FROM matches;", params: [] },
    { sql: "DELETE FROM novels;", params: [] },
  ]);
  
  if (loadCallback) await loadCallback();
  
  return { success: true };
}

export async function saveTierHistory(newHistory) {
  await setAppMeta("tier_history", newHistory);
}

// ═══════════════════════════════════════════════════════════════
// 📌 recoHandlers
// ═══════════════════════════════════════════════════════════════



export async function refreshDailyRecommendation(forceNew = false) {
  const novels = await all("SELECT * FROM novels;");
  if (!novels || novels.length === 0) {
    return null;
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 강제 갱신이 아니면 저장된 추천 확인
  if (!forceNew) {
    const saved = await getAppMeta("daily_reco");
    if (saved && saved.novel_id && saved.picked_at && now - saved.picked_at < dayMs) {
      const existing = novels.find((n) => n.id === saved.novel_id);
      if (existing) {
        const reli = computeReliability(existing, novels.length);
        return {
          novel: existing,
          pickedAt: saved.picked_at,
          reliability: reli,
        };
      }
    }
  }

  // 새로 뽑기
  const totalCount = novels.length;
  const enriched = novels.map((n) => ({
    ...n,
    reliability: computeReliability(n, totalCount),
  }));

  // 1) 신뢰도 낮은 작품 (0 < r < 50)
  const lowReli = enriched.filter((n) => n.reliability > 0 && n.reliability < 50);

  // 2) 티어 높고 덜 읽은 작품
  const highTierLessRead = enriched.filter((n) => {
    const rating = Number(n.rating) || 1500;
    const { t } = tierBadge(rating);
    if (!["S", "A", "B+"].includes(t)) return false;

    const totalEp = Number(n.total_episodes) || 0;
    const read = Number(n.read_count) || 0;

    if (totalEp > 0) {
      return read / totalEp < 0.8;
    }
    return read < 30;
  });

  // 3) 풀 구성 (중복 제거)
  const poolMap = new Map();
  for (const n of lowReli) poolMap.set(n.id, n);
  for (const n of highTierLessRead) {
    if (!poolMap.has(n.id)) poolMap.set(n.id, n);
  }

  let pool = Array.from(poolMap.values());
  if (pool.length === 0) {
    pool = enriched;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const meta = { novel_id: pick.id, picked_at: now };
  await setAppMeta("daily_reco", meta);

  return {
    novel: pick,
    pickedAt: now,
    reliability: pick.reliability,
  };
}

export async function loadRecoHistory() {
  const history = await getAppMeta("reco_history");
  return history || [];
}

export async function addToRecoHistory(novel) {
  const history = (await getAppMeta("reco_history")) || [];
  
  // 중복 방지 (같은 날 같은 작품)
  const today = new Date().toDateString();
  const exists = history.some(
    (h) => h.novelId === novel.id && new Date(h.pickedAt).toDateString() === today
  );
  
  if (!exists) {
    history.unshift({
      novelId: novel.id,
      title: novel.title,
      pickedAt: Date.now(),
    });
    
    // 최대 30개 유지
    if (history.length > 30) {
      history.pop();
    }
    
    await setAppMeta("reco_history", history);
  }
  
  return history;
}
