/**
 * 패턴 학습 서비스 (v6.0)
 * @module services/patternLearningService
 * 
 * @source_origin 원본 App.jsx 2481-3742줄 (1,262줄)
 * 
 * @description
 * 사용자의 선택 패턴을 학습하고 예측하는 서비스
 * 
 * 주요 기능:
 * 1. 스냅샷 생성 (createNovelSnapshot, createComparisonData)
 * 2. 선택 컨텍스트 수집 (collectChoiceContext)
 * 3. 이상치 감지 (detectAnomaly)
 * 4. 선택 로그 저장 (saveChoiceLog)
 * 5. 패턴 업데이트 (processPatternUpdates, batchUpdatePatternStats)
 * 6. 인사이트 발견 (discoverInsights, generateInsightFromPattern)
 * 7. 예측 생성 (generateEnhancedPrediction)
 * 8. 통계 조회 (getH2HRecord, getTopPatterns, calculatePredictionAccuracy)
 * 
 * @dependencies
 * - database: all, first, exec, execBatch
 * - utils/helpers: 여러 헬퍼 함수들
 */

import { all, first, exec, execBatch } from "../database";
import { 
  getTierDiff, 
  isTierHigher, 
  createGenreMatchupKey, 
  findSharedTags,
  calculateReadRatio,
  getGapBucket,
  wilsonConfidenceInterval,
  tierFromRating,
  uuid,
} from "../utils/helpers";

// ═══════════════════════════════════════════════════════════════
// 📌 전역 상태 (스케줄러용)
// ═══════════════════════════════════════════════════════════════

let patternUpdateTimer = null;
let patternStatsRefreshTimer = null;
let insightDiscoveryTimer = null;

// ═══════════════════════════════════════════════════════════════
// 📌 스냅샷 및 컨텍스트 생성
// ═══════════════════════════════════════════════════════════════

function createNovelSnapshot(novel) {
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
function createComparisonData(winnerSnap, loserSnap) {
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
function collectChoiceContext(winner, loser) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 이상 탐지: 평소와 다른 선택 감지
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 이상 선택 탐지 (패턴 기반)
 */
async function detectAnomaly(context, patterns) {
  const factors = {};
  const { winnerSnapshot, loserSnapshot, comparison } = context;
  
  // 1. 레이팅 역전 체크 (낮은 레이팅이 이김)
  if (!comparison.ratingWinnerHigher && comparison.ratingGap >= 100) {
    const severity = Math.min(1, comparison.ratingGap / 300);
    factors.ratingReversal = {
      type: "rating_underdog_win",
      gap: comparison.ratingGap,
      severity: severity,
    };
  }
  
  // 2. 장르 상성 역전 체크
  if (comparison.genreMatchup && patterns && patterns.length > 0) {
    const genrePattern = patterns.find(p => 
      p.category === "genre_matchup" && 
      p.pattern_key === comparison.genreMatchup
    );
    
    if (genrePattern && genrePattern.sample_size >= 10) {
      const [genreA, genreB] = comparison.genreMatchup.split("_vs_");
      const expectedWinnerGenre = genrePattern.win_rate >= 0.5 ? genreA : genreB;
      
      if (winnerSnapshot.major_genre !== expectedWinnerGenre) {
        const usualRate = genrePattern.win_rate >= 0.5 
          ? genrePattern.win_rate 
          : (1 - genrePattern.win_rate);
        
        if (usualRate >= 0.7) {
          factors.genreReversal = {
            type: "genre_upset",
            expected: expectedWinnerGenre,
            actual: winnerSnapshot.major_genre,
            usualRate: usualRate,
            severity: (usualRate - 0.5) * 2,
          };
        }
      }
    }
  }
  
  // 3. 태그 기피 역전 체크
  if (patterns && patterns.length > 0) {
    const aversionPatterns = patterns.filter(p => 
      p.category === "tag_aversion" && p.significance >= 0.7
    );
    
    for (const ap of aversionPatterns) {
      const aversedTag = ap.pattern_key.replace("tag:", "");
      if (winnerSnapshot.tags.map(t => t.toLowerCase()).includes(aversedTag.toLowerCase())) {
        factors.tagSurprise = factors.tagSurprise || { unexpected: [] };
        factors.tagSurprise.unexpected.push({
          tag: aversedTag,
          usualAvoidRate: 1 - ap.win_rate,
        });
      }
    }
  }
  
  // 4. 이상 점수 계산
  const severities = Object.values(factors).map(f => f.severity || 0.3);
  const anomalyScore = severities.length > 0
    ? Math.min(1, severities.reduce((a, b) => a + b, 0) / 2)
    : 0;
  
  return {
    anomalyScore,
    factors: Object.keys(factors).length > 0 ? factors : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💾 저장: 선택 로그 기록
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 선택 로그 저장 (배치 큐 통합)
 */
const choiceLogQueue = {
  pending: [],
  maxSize: 20,
  flushInterval: 5000,
  timer: null,
  
  add(log) {
    this.pending.push(log);
    
    if (this.pending.length >= this.maxSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  },
  
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.pending.length === 0) return;
    
    const batch = this.pending.splice(0);
    
    try {
      const queries = batch.map(log => ({
        sql: `INSERT INTO choice_logs (
          id, match_id, winner_id, loser_id,
          predicted_winner_id, prediction_confidence, prediction_factors, was_correct,
          winner_snapshot, loser_snapshot, comparison,
          anomaly_score, anomaly_factors, match_type, session_position, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          log.id,
          log.match_id,
          log.winner_id,
          log.loser_id,
          log.predicted_winner_id || null,
          log.prediction_confidence || null,
          log.prediction_factors ? JSON.stringify(log.prediction_factors) : null,
          log.was_correct,
          JSON.stringify(log.winner_snapshot),
          JSON.stringify(log.loser_snapshot),
          JSON.stringify(log.comparison),
          log.anomaly_score || 0,
          log.anomaly_factors ? JSON.stringify(log.anomaly_factors) : null,
          log.match_type || "manual",
          log.session_position || null,
          log.created_at || Date.now(),
        ],
      }));
      
      await execBatch(queries);
      
      // 패턴 업데이트 스케줄 (비동기)
      schedulePatternUpdate(batch);
      
    } catch (e) {
      console.error("[choiceLogQueue.flush] 저장 실패:", e);
      // 실패한 로그는 다시 큐에 넣지 않음 (무한 루프 방지)
    }
  },
};

/**
 * 선택 로그 생성 및 큐에 추가
 */
async function saveChoiceLog(matchId, winner, loser, matchType = "manual", prediction = null) {
  try {
    const context = collectChoiceContext(winner, loser);
    if (!context) return null;
    
    // 패턴 조회 (이상 탐지용)
    let patterns = [];
    try {
      patterns = await all(`SELECT * FROM preference_patterns WHERE sample_size >= 5`);
    } catch (e) {
      // 패턴 없어도 계속 진행
    }
    
    // 이상 탐지
    const anomaly = await detectAnomaly(context, patterns);
    
    // 예측 정확도 판단
    let wasCorrect = null;
    if (prediction && prediction.predictedWinnerId) {
      wasCorrect = prediction.predictedWinnerId === winner.id ? 1 : 0;
    }
    
    const log = {
      id: uuid(),
      match_id: matchId,
      winner_id: winner.id,
      loser_id: loser.id,
      predicted_winner_id: prediction?.predictedWinnerId || null,
      prediction_confidence: prediction?.confidence || null,
      prediction_factors: prediction?.factors || null,
      was_correct: wasCorrect,
      winner_snapshot: context.winnerSnapshot,
      loser_snapshot: context.loserSnapshot,
      comparison: context.comparison,
      anomaly_score: anomaly.anomalyScore,
      anomaly_factors: anomaly.factors,
      match_type: matchType,
      session_position: null,
      created_at: Date.now(),
    };
    
    // 큐에 추가
    choiceLogQueue.add(log);
    
    return log;
    
  } catch (e) {
    console.error("[saveChoiceLog] 오류:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 분석층: 패턴 업데이트
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 패턴 업데이트 스케줄러
 */
let patternUpdateScheduled = false;
let patternUpdateBatch = [];

function schedulePatternUpdate(logs) {
  patternUpdateBatch.push(...logs);
  
  if (!patternUpdateScheduled) {
    patternUpdateScheduled = true;
    setTimeout(async () => {
      const batch = patternUpdateBatch.splice(0);
      patternUpdateScheduled = false;
      
      if (batch.length > 0) {
        await processPatternUpdates(batch);
      }
    }, 1000);
  }
}

/**
 * 패턴 업데이트 처리
 */
async function processPatternUpdates(logs) {
  try {
    const updates = [];
    
    for (const log of logs) {
      // 수동 매칭만 학습에 사용
      if (log.match_type === "auto") continue;
      
      const ws = log.winner_snapshot;
      const ls = log.loser_snapshot;
      const comp = log.comparison;
      
      if (!ws || !ls || !comp) continue;
      
      // 1. 장르 상성 패턴
      if (comp.genreMatchup) {
        updates.push({
          category: "genre_matchup",
          patternKey: comp.genreMatchup,
          didWin: comp.winnerGenre === comp.genreMatchup.split("_vs_")[0],
        });
      }
      
      // 2. 장르 선호도 패턴
      if (ws.major_genre) {
        updates.push({
          category: "genre_affinity",
          patternKey: `genre:${ws.major_genre}`,
          didWin: true,
        });
      }
      if (ls.major_genre) {
        updates.push({
          category: "genre_affinity",
          patternKey: `genre:${ls.major_genre}`,
          didWin: false,
        });
      }
      
      // 3. 태그 파워 패턴
      for (const tag of ws.tags || []) {
        updates.push({
          category: "tag_power",
          patternKey: `tag:${tag}`,
          didWin: true,
          context: {
            wasUnderdog: !comp.ratingWinnerHigher,
            ratingGap: comp.ratingGap,
          },
        });
      }
      for (const tag of ls.tags || []) {
        updates.push({
          category: "tag_power",
          patternKey: `tag:${tag}`,
          didWin: false,
        });
      }
      
      // 4. 작가 충성도 패턴
      if (ws.author) {
        updates.push({
          category: "author_loyalty",
          patternKey: `author:${ws.author}`,
          didWin: true,
        });
      }
      if (ls.author) {
        updates.push({
          category: "author_loyalty",
          patternKey: `author:${ls.author}`,
          didWin: false,
        });
      }
      
      // 5. 레이팅 역전 패턴 (언더독 승리 시)
      if (!comp.ratingWinnerHigher && comp.ratingGap >= 50) {
        const gapBucket = getGapBucket(comp.ratingGap);
        updates.push({
          category: "rating_behavior",
          patternKey: `underdog_win:${gapBucket}`,
          didWin: true,
        });
      }
    }
    
    // DB 업데이트 (배치)
    if (updates.length > 0) {
      await batchUpdatePatternStats(updates);
    }
    
  } catch (e) {
    console.error("[processPatternUpdates] 오류:", e);
  }
}

/**
 * 패턴 통계 배치 업데이트
 */
async function batchUpdatePatternStats(updates) {
  const now = Date.now();
  
  // 패턴별로 그룹화
  const grouped = {};
  for (const u of updates) {
    const key = `${u.category}:${u.patternKey}`;
    if (!grouped[key]) {
      grouped[key] = {
        category: u.category,
        patternKey: u.patternKey,
        wins: 0,
        total: 0,
        contexts: [],
      };
    }
    grouped[key].total++;
    if (u.didWin) grouped[key].wins++;
    if (u.context) grouped[key].contexts.push(u.context);
  }
  
  // 각 패턴 업데이트
  const queries = [];
  for (const [key, data] of Object.entries(grouped)) {
    // 기존 패턴 조회 또는 생성
    queries.push({
      sql: `INSERT INTO preference_patterns (
        id, category, pattern_key, sample_size, win_count, first_seen_at, last_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category, pattern_key) DO UPDATE SET
        sample_size = sample_size + ?,
        win_count = win_count + ?,
        last_updated_at = ?`,
      params: [
        key,  // id
        data.category,
        data.patternKey,
        data.total,  // 초기 sample_size
        data.wins,   // 초기 win_count
        now,         // first_seen_at
        now,         // last_updated_at
        data.total,  // 업데이트 시 sample_size 증가
        data.wins,   // 업데이트 시 win_count 증가
        now,         // 업데이트 시 last_updated_at
      ],
    });
  }
  
  await execBatch(queries);
  
  // 통계 재계산 스케줄
  schedulePatternStatsRefresh();
}

/**
 * 패턴 통계 재계산 스케줄러
 */
let statsRefreshScheduled = false;

function schedulePatternStatsRefresh() {
  if (!statsRefreshScheduled) {
    statsRefreshScheduled = true;
    setTimeout(async () => {
      statsRefreshScheduled = false;
      await refreshPatternStats();
    }, 2000);
  }
}

/**
 * 패턴 통계 재계산 (윌슨 신뢰구간)
 */
async function refreshPatternStats() {
  try {
    const patterns = await all(`SELECT * FROM preference_patterns`);
    
    const queries = [];
    
    for (const p of patterns) {
      const n = p.sample_size || 0;
      const wins = p.win_count || 0;
      
      if (n < 5) continue;  // 샘플 너무 적으면 스킵
      
      const winRate = wins / n;
      const { lower, upper } = wilsonConfidenceInterval(wins, n, 0.95);
      const significance = 1 - (upper - lower);  // 구간 좁을수록 확실
      const deviation = winRate - 0.5;
      
      // 주목할 만한 패턴인지 판단
      const isNotable = (
        n >= 15 &&
        significance >= 0.6 &&
        Math.abs(deviation) >= 0.15
      );
      
      // 인사이트 레벨 결정
      let insightLevel = null;
      if (isNotable) {
        if (Math.abs(deviation) >= 0.35) {
          insightLevel = "deep";
        } else if (Math.abs(deviation) >= 0.25) {
          insightLevel = "discover";
        } else {
          insightLevel = "confirm";
        }
      }
      
      queries.push({
        sql: `UPDATE preference_patterns SET
          win_rate = ?,
          confidence_lower = ?,
          confidence_upper = ?,
          significance = ?,
          is_notable = ?,
          insight_level = ?
        WHERE id = ?`,
        params: [
          winRate, lower, upper, significance,
          isNotable ? 1 : 0, insightLevel,
          p.id
        ],
      });
    }
    
    if (queries.length > 0) {
      await execBatch(queries);
    }
    
    // 인사이트 발견 스케줄
    scheduleInsightDiscovery();
    
  } catch (e) {
    console.error("[refreshPatternStats] 오류:", e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💡 발견층: 인사이트 생성
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 인사이트 발견 스케줄러
 */
let insightDiscoveryScheduled = false;

function scheduleInsightDiscovery() {
  if (!insightDiscoveryScheduled) {
    insightDiscoveryScheduled = true;
    setTimeout(async () => {
      insightDiscoveryScheduled = false;
      await discoverInsights();
    }, 3000);
  }
}

/**
 * 인사이트 발견
 */
async function discoverInsights() {
  try {
    // 아직 안 보여준 주목할 패턴들
    const notablePatterns = await all(`
      SELECT * FROM preference_patterns 
      WHERE is_notable = 1 AND is_shown = 0
      ORDER BY significance DESC, sample_size DESC
      LIMIT 10
    `);
    
    for (const pattern of notablePatterns) {
      const insight = generateInsightFromPattern(pattern);
      if (insight) {
        await queueInsight(insight);
      }
    }
    
  } catch (e) {
    console.error("[discoverInsights] 오류:", e);
  }
}

/**
 * 패턴에서 인사이트 생성
 */
function generateInsightFromPattern(pattern) {
  const generators = {
    genre_matchup: generateGenreMatchupInsight,
    genre_affinity: generateGenreAffinityInsight,
    tag_power: generateTagPowerInsight,
    author_loyalty: generateAuthorLoyaltyInsight,
    rating_behavior: generateRatingBehaviorInsight,
  };
  
  const generator = generators[pattern.category];
  if (!generator) return null;
  
  return generator(pattern);
}

/**
 * 장르 상성 인사이트 생성
 */
function generateGenreMatchupInsight(pattern) {
  const parts = pattern.pattern_key.split("_vs_");
  if (parts.length !== 2) return null;
  
  const [genreA, genreB] = parts;
  const preferredGenre = pattern.win_rate >= 0.5 ? genreA : genreB;
  const avoidedGenre = pattern.win_rate >= 0.5 ? genreB : genreA;
  const rate = pattern.win_rate >= 0.5 ? pattern.win_rate : (1 - pattern.win_rate);
  
  if (rate < 0.65) return null;
  
  return {
    patternId: pattern.id,
    source: "dynamic",
    type: "genre_matchup",  // category 기반 타입
    priority: Math.round(rate * 100),
    confidence: rate,
    title: `${avoidedGenre} vs ${preferredGenre} 상성`,
    description: `${genreA} vs ${genreB} 대결에서 ${preferredGenre}를 ${Math.round(rate * 100)}% 선택했어요.`,
    evidence: {
      sampleSize: pattern.sample_size,
      winRate: rate,
      preferredGenre,
      avoidedGenre,
    },
  };
}

/**
 * 장르 선호도 인사이트 생성
 */
function generateGenreAffinityInsight(pattern) {
  const genre = pattern.pattern_key.replace("genre:", "");
  const rate = pattern.win_rate;
  
  if (rate < 0.6 || pattern.sample_size < 20) return null;
  
  return {
    patternId: pattern.id,
    source: "dynamic",
    type: "genre_affinity",  // category 기반 타입
    priority: Math.round(rate * 80),
    confidence: rate,
    title: `${genre} 장르 선호`,
    description: `${genre} 장르 작품의 선택률이 ${Math.round(rate * 100)}%예요.`,
    evidence: {
      genre,
      winRate: rate,
      sampleSize: pattern.sample_size,
    },
  };
}

/**
 * 태그 파워 인사이트 생성
 */
function generateTagPowerInsight(pattern) {
  const tag = pattern.pattern_key.replace("tag:", "");
  const rate = pattern.win_rate;
  
  if (rate < 0.6 || pattern.sample_size < 15) return null;
  
  return {
    patternId: pattern.id,
    source: "dynamic",
    type: "tag_power",  // category 기반 타입
    priority: Math.round(rate * 90),
    confidence: rate,
    title: `"${tag}" 태그 파워`,
    description: `"${tag}" 태그가 있는 작품 선택률이 ${Math.round(rate * 100)}%예요.`,
    evidence: {
      tag,
      winRate: rate,
      sampleSize: pattern.sample_size,
    },
  };
}

/**
 * 작가 충성도 인사이트 생성
 */
function generateAuthorLoyaltyInsight(pattern) {
  const author = pattern.pattern_key.replace("author:", "");
  const rate = pattern.win_rate;
  
  if (rate < 0.7 || pattern.sample_size < 10) return null;
  
  return {
    patternId: pattern.id,
    source: "dynamic",
    type: "author_loyalty",  // category 기반 타입
    priority: Math.round(rate * 70),
    confidence: rate,
    title: `${author} 작가 충성`,
    description: `${author} 작가 작품의 선택률이 ${Math.round(rate * 100)}%예요.`,
    evidence: {
      author,
      winRate: rate,
      sampleSize: pattern.sample_size,
    },
  };
}

/**
 * 레이팅 역전 인사이트 생성
 */
function generateRatingBehaviorInsight(pattern) {
  const key = pattern.pattern_key;
  if (!key.startsWith("underdog_win:")) return null;
  
  const bucket = key.replace("underdog_win:", "");
  const rate = pattern.win_rate;
  
  if (rate < 0.3 || pattern.sample_size < 10) return null;
  
  const bucketLabels = {
    tiny: "50점 미만",
    small: "50~100점",
    medium: "100~200점",
    large: "200~300점",
    huge: "300점 이상",
  };
  
  return {
    patternId: pattern.id,
    source: "dynamic",
    type: "rating_behavior",  // category 기반 타입
    priority: Math.round(rate * 100),
    confidence: rate,
    title: `레이팅 역전 성향`,
    description: `레이팅이 ${bucketLabels[bucket] || bucket} 낮아도 ${Math.round(rate * 100)}% 확률로 선택해요. 점수보다 취향이 중요한 것 같아요.`,
    evidence: {
      bucket,
      winRate: rate,
      sampleSize: pattern.sample_size,
    },
  };
}

/**
 * 인사이트 큐에 추가
 */
async function queueInsight(insight) {
  try {
    // 중복 체크
    const existing = await first(`
      SELECT id FROM insight_queue 
      WHERE pattern_id = ? AND status IN ('pending', 'shown')
    `, [insight.patternId]);
    
    if (existing) return;
    
    // confidence 계산: evidence.winRate 또는 패턴 신뢰도 사용
    const confidence = insight.confidence || 
                       (insight.evidence?.winRate) || 
                       (insight.evidence?.confidence_lower) || 
                       0.5;
    
    await exec(`
      INSERT INTO insight_queue (
        id, source, pattern_id, insight_type, priority, confidence,
        title, description, evidence, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      uuid(),
      insight.source,
      insight.patternId,
      insight.type,
      insight.priority,
      confidence,
      insight.title,
      insight.description,
      JSON.stringify(insight.evidence),
      Date.now(),
    ]);
    
  } catch (e) {
    console.error("[queueInsight] 오류:", e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 예측 엔진: 취향 기반 승부 예측
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 현재 활성 가중치 조회
 */
async function getActiveWeights() {
  try {
    const row = await first(`SELECT * FROM weight_config WHERE is_active = 1`);
    if (row) return row;
    
    // 기본값 반환
    return {
      w_elo: 0.35,
      w_h2h: 0.20,
      w_overall_winrate: 0.10,
      w_reliability: 0.05,
      w_genre_matchup: 0.10,
      w_tag_power: 0.10,
      w_read_preference: 0.05,
      w_author_affinity: 0.03,
      w_coordinate_zone: 0.02,
    };
  } catch (e) {
    console.error("[getActiveWeights] 오류:", e);
    return {
      w_elo: 0.35,
      w_h2h: 0.20,
      w_overall_winrate: 0.10,
      w_reliability: 0.05,
      w_genre_matchup: 0.10,
      w_tag_power: 0.10,
      w_read_preference: 0.05,
      w_author_affinity: 0.03,
      w_coordinate_zone: 0.02,
    };
  }
}

/**
 * 취향 기반 승부 예측 생성
 */
async function generateEnhancedPrediction(A, B) {
  try {
    const weights = await getActiveWeights();
    const patterns = await all(`SELECT * FROM preference_patterns WHERE sample_size >= 5`);
    
    const factors = {};
    
    // 1. ELO 기반
    const eloExpected = 1 / (1 + Math.pow(10, (B.rating - A.rating) / 400));
    factors.elo = {
      value: eloExpected,
      weight: weights.w_elo,
      contribution: eloExpected * weights.w_elo,
    };
    
    // 2. 직접 대결
    const h2h = await getH2HRecord(A.id, B.id);
    if (h2h && h2h.total > 0) {
      const h2hRate = h2h.aWins / h2h.total;
      factors.h2h = {
        value: h2hRate,
        weight: weights.w_h2h,
        contribution: h2hRate * weights.w_h2h,
        detail: `${h2h.aWins}-${h2h.bWins}`,
      };
    } else {
      factors.h2h = { value: 0.5, weight: weights.w_h2h, contribution: 0.5 * weights.w_h2h };
    }
    
    // 3. 장르 상성 (패턴 기반)
    let majorA = null, majorB = null;
    try {
      const mgA = JSON.parse(A.major_genre || "[]");
      majorA = Array.isArray(mgA) ? mgA[0] : mgA;
      const mgB = JSON.parse(B.major_genre || "[]");
      majorB = Array.isArray(mgB) ? mgB[0] : mgB;
    } catch {}
    
    const genreKey = createGenreMatchupKey(majorA, majorB);
    if (genreKey) {
      const genrePattern = patterns.find(p => 
        p.category === "genre_matchup" && p.pattern_key === genreKey
      );
      
      if (genrePattern && genrePattern.sample_size >= 10) {
        const isAFirst = genreKey.startsWith(majorA);
        const genreRate = isAFirst ? genrePattern.win_rate : (1 - genrePattern.win_rate);
        
        factors.genre = {
          value: genreRate,
          weight: weights.w_genre_matchup,
          contribution: genreRate * weights.w_genre_matchup,
          detail: `${genreKey} (${genrePattern.sample_size}회)`,
        };
      }
    }
    factors.genre = factors.genre || { value: 0.5, weight: weights.w_genre_matchup, contribution: 0.5 * weights.w_genre_matchup };
    
    // 4. 태그 파워 (패턴 기반)
    let tagsA = [], tagsB = [];
    try {
      const tdA = JSON.parse(A.tag_data || "[]");
      tagsA = Array.isArray(tdA) ? tdA.map(t => t.tag || t) : [];
      const tdB = JSON.parse(B.tag_data || "[]");
      tagsB = Array.isArray(tdB) ? tdB.map(t => t.tag || t) : [];
    } catch {}
    
    if (tagsA.length === 0) {
      tagsA = (A.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    }
    if (tagsB.length === 0) {
      tagsB = (B.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    }
    
    let tagPowerA = 0, tagPowerB = 0;
    let tagCount = 0;
    
    for (const tag of [...new Set([...tagsA, ...tagsB])]) {
      const tagPattern = patterns.find(p => 
        p.category === "tag_power" && p.pattern_key === `tag:${tag}`
      );
      
      if (tagPattern && tagPattern.sample_size >= 10) {
        const power = tagPattern.win_rate - 0.5;
        if (tagsA.map(t => t.toLowerCase()).includes(tag.toLowerCase())) tagPowerA += power;
        if (tagsB.map(t => t.toLowerCase()).includes(tag.toLowerCase())) tagPowerB += power;
        tagCount++;
      }
    }
    
    if (tagCount > 0) {
      const tagAdvantage = 0.5 + (tagPowerA - tagPowerB) / 2;
      factors.tagPower = {
        value: Math.max(0.1, Math.min(0.9, tagAdvantage)),
        weight: weights.w_tag_power,
        contribution: tagAdvantage * weights.w_tag_power,
      };
    } else {
      factors.tagPower = { value: 0.5, weight: weights.w_tag_power, contribution: 0.5 * weights.w_tag_power };
    }
    
    // 5. 읽은 비율
    const readRatioA = calculateReadRatio(A);
    const readRatioB = calculateReadRatio(B);
    const readAdvantage = 0.5 + (readRatioA - readRatioB) * 0.3;
    
    factors.readRatio = {
      value: readAdvantage,
      weight: weights.w_read_preference,
      contribution: readAdvantage * weights.w_read_preference,
    };
    
    // 종합 계산
    let totalContribution = 0;
    let totalWeight = 0;
    
    for (const f of Object.values(factors)) {
      totalContribution += f.contribution;
      totalWeight += f.weight;
    }
    
    const predictedWinRateA = totalWeight > 0 ? totalContribution / totalWeight : 0.5;
    const confidence = Math.abs(predictedWinRateA - 0.5) * 2;
    
    // 주요 요인 추출
    const mainReasons = Object.entries(factors)
      .map(([key, f]) => ({
        key,
        influence: f.value >= 0.5 ? "A 유리" : "B 유리",
        strength: Math.abs(f.value - 0.5) * 2,
        detail: f.detail,
      }))
      .filter(r => r.strength >= 0.1)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    
    return {
      predictedWinnerId: predictedWinRateA >= 0.5 ? A.id : B.id,
      predictedWinRateA,
      confidence,
      factors,
      mainReasons,
    };
    
  } catch (e) {
    console.error("[generateEnhancedPrediction] 오류:", e);
    
    // 폴백: 단순 ELO
    const eloExpected = 1 / (1 + Math.pow(10, (B.rating - A.rating) / 400));
    return {
      predictedWinnerId: eloExpected >= 0.5 ? A.id : B.id,
      predictedWinRateA: eloExpected,
      confidence: Math.abs(eloExpected - 0.5) * 2,
      factors: { elo: { value: eloExpected, weight: 1, contribution: eloExpected } },
      mainReasons: [],
      isFallback: true,
    };
  }
}

/**
 * 직접 대결 기록 조회
 */
async function getH2HRecord(aId, bId) {
  try {
    const rows = await all(`
      SELECT winner_id FROM matches 
      WHERE (a_id = ? AND b_id = ?) OR (a_id = ? AND b_id = ?)
    `, [aId, bId, bId, aId]);
    
    let aWins = 0, bWins = 0;
    for (const r of rows) {
      if (r.winner_id === aId) aWins++;
      else if (r.winner_id === bId) bWins++;
    }
    
    return { aWins, bWins, total: aWins + bWins };
    
  } catch (e) {
    return { aWins: 0, bWins: 0, total: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 조회 API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 대기 중인 인사이트 조회
 */
async function getPendingInsights(limit = 5) {
  try {
    return await all(`
      SELECT * FROM insight_queue 
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at DESC
      LIMIT ?
    `, [limit]);
  } catch (e) {
    console.error("[getPendingInsights] 오류:", e);
    return [];
  }
}

/**
 * 인사이트 응답 기록
 */
async function respondToInsight(insightId, response) {
  try {
    await exec(`
      UPDATE insight_queue 
      SET status = 'shown', shown_at = ?, user_response = ?
      WHERE id = ?
    `, [Date.now(), response, insightId]);
    
    // 패턴에도 반영
    const insight = await first(`SELECT pattern_id FROM insight_queue WHERE id = ?`, [insightId]);
    if (insight && insight.pattern_id) {
      await exec(`
        UPDATE preference_patterns 
        SET is_shown = 1, shown_at = ?, user_reaction = ?
        WHERE id = ?
      `, [Date.now(), response, insight.pattern_id]);
    }
    
  } catch (e) {
    console.error("[respondToInsight] 오류:", e);
  }
}

/**
 * 주요 패턴 조회 (취향 분석용)
 */
async function getTopPatterns(category = null, limit = 10) {
  try {
    let sql = `
      SELECT * FROM preference_patterns 
      WHERE sample_size >= 10 AND significance >= 0.5
    `;
    const params = [];
    
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    
    sql += ` ORDER BY is_notable DESC, significance DESC, sample_size DESC LIMIT ?`;
    params.push(limit);
    
    return await all(sql, params);
    
  } catch (e) {
    console.error("[getTopPatterns] 오류:", e);
    return [];
  }
}

/**
 * 예측 정확도 계산
 */
async function calculatePredictionAccuracy(days = 30) {
  try {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const rows = await all(`
      SELECT was_correct FROM choice_logs 
      WHERE match_type = 'manual' 
        AND was_correct IS NOT NULL 
        AND created_at >= ?
    `, [since]);
    
    if (rows.length === 0) {
      return { accuracy: 0, sampleSize: 0 };
    }
    
    const correct = rows.filter(r => r.was_correct === 1).length;
    return {
      accuracy: correct / rows.length,
      sampleSize: rows.length,
    };
    
  } catch (e) {
    console.error("[calculatePredictionAccuracy] 오류:", e);
    return { accuracy: 0, sampleSize: 0 };
  }
}

/**
 * 기존 매칭 데이터에서 초기 패턴 추출 (마이그레이션)
 */
async function migrateExistingMatchesToPatterns() {
  try {
    const existing = await first(`SELECT COUNT(*) as c FROM choice_logs`);
    if (existing && existing.c > 0) {
      console.log("[migrateExistingMatchesToPatterns] 이미 마이그레이션됨, 스킵");
      return;
    }
    
    const matches = await all(`
      SELECT m.*, a.title as a_title, a.rating as a_rating, a.tags as a_tags, 
             a.major_genre as a_genre, a.author as a_author,
             a.read_count as a_read, a.total_episodes as a_total,
             b.title as b_title, b.rating as b_rating, b.tags as b_tags,
             b.major_genre as b_genre, b.author as b_author,
             b.read_count as b_read, b.total_episodes as b_total
      FROM matches m
      JOIN novels a ON a.id = m.a_id
      JOIN novels b ON b.id = m.b_id
      WHERE m.decided_by = 'user'
      ORDER BY m.created_at ASC
    `);
    
    console.log(`[migrateExistingMatchesToPatterns] ${matches.length}개 매칭 마이그레이션 시작`);
    
    const updates = [];
    
    for (const m of matches) {
      const winnerId = m.winner_id;
      const winnerIsA = winnerId === m.a_id;
      
      // 장르 상성
      let majorA = null, majorB = null;
      try {
        const mga = JSON.parse(m.a_genre || "[]");
        majorA = Array.isArray(mga) ? mga[0] : mga;
        const mgb = JSON.parse(m.b_genre || "[]");
        majorB = Array.isArray(mgb) ? mgb[0] : mgb;
      } catch {}
      
      if (majorA && majorB && majorA !== majorB) {
        const genreKey = createGenreMatchupKey(majorA, majorB);
        if (genreKey) {
          const winnerGenre = winnerIsA ? majorA : majorB;
          const didFirstWin = genreKey.startsWith(winnerGenre);
          
          updates.push({
            category: "genre_matchup",
            patternKey: genreKey,
            didWin: didFirstWin,
          });
        }
      }
      
      // 장르 선호도
      if (winnerIsA && majorA) {
        updates.push({ category: "genre_affinity", patternKey: `genre:${majorA}`, didWin: true });
      }
      if (!winnerIsA && majorB) {
        updates.push({ category: "genre_affinity", patternKey: `genre:${majorB}`, didWin: true });
      }
      if (winnerIsA && majorB) {
        updates.push({ category: "genre_affinity", patternKey: `genre:${majorB}`, didWin: false });
      }
      if (!winnerIsA && majorA) {
        updates.push({ category: "genre_affinity", patternKey: `genre:${majorA}`, didWin: false });
      }
      
      // 태그 파워
      const winnerTags = (winnerIsA ? m.a_tags : m.b_tags || "").split(",").map(t => t.trim()).filter(Boolean);
      const loserTags = (winnerIsA ? m.b_tags : m.a_tags || "").split(",").map(t => t.trim()).filter(Boolean);
      
      for (const tag of winnerTags) {
        updates.push({ category: "tag_power", patternKey: `tag:${tag}`, didWin: true });
      }
      for (const tag of loserTags) {
        updates.push({ category: "tag_power", patternKey: `tag:${tag}`, didWin: false });
      }
      
      // 작가 충성도
      const winnerAuthor = winnerIsA ? m.a_author : m.b_author;
      const loserAuthor = winnerIsA ? m.b_author : m.a_author;
      
      if (winnerAuthor) {
        updates.push({ category: "author_loyalty", patternKey: `author:${winnerAuthor}`, didWin: true });
      }
      if (loserAuthor) {
        updates.push({ category: "author_loyalty", patternKey: `author:${loserAuthor}`, didWin: false });
      }
    }
    
    // 배치 업데이트
    if (updates.length > 0) {
      await batchUpdatePatternStats(updates);
      await refreshPatternStats();
    }
    
    console.log(`[migrateExistingMatchesToPatterns] 완료: ${updates.length}개 패턴 업데이트`);
    
  } catch (e) {
    console.error("[migrateExistingMatchesToPatterns] 오류:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 Export
// ═══════════════════════════════════════════════════════════════

export {
  createNovelSnapshot,
  createComparisonData,
  collectChoiceContext,
  detectAnomaly,
  saveChoiceLog,
  schedulePatternUpdate,
  processPatternUpdates,
  batchUpdatePatternStats,
  schedulePatternStatsRefresh,
  refreshPatternStats,
  scheduleInsightDiscovery,
  discoverInsights,
  generateInsightFromPattern,
  generateGenreMatchupInsight,
  generateGenreAffinityInsight,
  generateTagPowerInsight,
  generateAuthorLoyaltyInsight,
  generateRatingBehaviorInsight,
  queueInsight,
  getActiveWeights,
  generateEnhancedPrediction,
  getH2HRecord,
  getPendingInsights,
  respondToInsight,
  getTopPatterns,
  calculatePredictionAccuracy,
  migrateExistingMatchesToPatterns,
};
