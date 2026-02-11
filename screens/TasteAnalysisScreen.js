/**
 * 취향 분석 스크린
 * @module screens/TasteAnalysisScreen
 * @version 6.1.4 (Context 아키텍처)
 *
 * @bugfix v6.1.4
 * - [FIX] parseMajorSub import 누락 → 공동출현/이변 분석 등 6개소에서 ReferenceError 크래시
 *
 * @bugfix v6.1.7
 * - [FIX] tagRelations.groups가 배열인데 Object.entries/[id] 접근 → 항상 빈 결과
 *   → 배열을 {id: group} 객체 맵으로 변환 후 처리 (oppositeTagAnalysis, similarGroupConsistency)
 *
 * @description
 * 사용자의 웹소설 취향을 종합 분석하는 대형 스크린 컴포넌트
 * Context: useApp(theme, isDark), useData(list), useTag(tagRelations, coordinateSystems)
 * 
 * 포함된 분석 섹션 (22개):
 * 1. 기본 통계 (총 작품, 평균 레이팅, 신뢰도 분포)
 * 2. 대장르 분석
 * 3. 부장르 분석
 * 4. 일반 태그 분석
 * 5. 조합 태그 분석
 * 6. 스펙트럼 분석 (태그 연속 스케일)
 * 7. 상반 태그 관계 분석
 * 8. 공동 출현 분석
 * 9. 좌표계 선호도 분석
 * 10. 매칭 일관성 분석
 * 11. 유사 그룹 일관성 분석
 * 12. 플랫폼별 만족도
 * 13. 읽기 패턴 (길이 선호도)
 * 14. 작가 충성도 분석
 * 15. 매칭 분석 (상대전적)
 * 16. 시간 트렌드
 * 17. 숨겨진 패턴 탐지
 * 18. 기피 요소
 * 19. 추천 조건
 * 20. 이상치 탐지
 * 21. 이변(Upset) 분석
 * 22. 이변 요인 분석
 * 
 * @dependencies
 * - database: all() - 매칭 로그 조회
 * - services/analysisService: analyzePreferences() - 취향 분석 실행
 * - components/charts: PieChartSimple, HeatmapRow, RadarChartSimple - 시각화
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

// Database
import { all } from "../database";

// Services
import { analyzePreferences } from "../services/analysisService";

// Components (차트)
import { PieChartSimple, HeatmapRow, RadarChartSimple } from "../components/charts";

// Common UI
import { H, Section, PrimaryButton } from "../components/common/ui";

// Constants
import { parseMajorSub } from "../constants/tags";

// Context
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useTag } from "../contexts/TagContext";

// ═══════════════════════════════════════════════════════════════
// 📌 TasteAnalysisScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const TasteAnalysisScreen = memo(() => {
  const { theme, isDark } = useApp();
  const { list } = useData();
  const { tagRelations, coordinateSystems } = useTag();
  const C = theme;

  // 기본값 설정
  const matchInsights = [];
  const upsetFactors = { factors: [] };
  const tagCoOccurrences = {};

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  // 🆕 v3.4: 여러 섹션 동시 펼침 가능 (Set 사용)
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState(null);

  // 🆕 v3.4: 섹션 토글 함수
  const toggleSection = useCallback((key) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // 🆕 v3.4: 섹션 펼침 여부 확인
  const isExpanded = useCallback((key) => expandedSections.has(key), [expandedSections]);

  // 🆕 v3.4: 전체 펼침/접기
  const expandAll = useCallback(() => {
    const allKeys = [
      "basicStats", "majorGenre", "subGenre", "tagAnalysis", "comboAnalysis",
      "spectrum", "oppositeTag", "coOccurrence", "coordPref", "matchConsist",
      "simGroupConsist", "platform", "readPattern", "author", "matchAnalysis",
      "trend", "hiddenPattern", "avoid", "recommend", "anomalies", "upsets", "factors"
    ];
    setExpandedSections(new Set(allKeys));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  // 🔮 v3.0.3: 이변(Upset) 분석 데이터 계산
  const upsetAnalysis = useMemo(() => {
    if (!matchInsights || matchInsights.length === 0) return null;
    
    const upsets = matchInsights.filter(i => i.isUpset);
    const correct = matchInsights.filter(i => i.wasCorrect);
    
    // 이변 작품 집계 (몇 번 이변을 일으켰는지)
    const upsetCausers = {};
    const upsetVictims = {};
    
    for (const u of upsets) {
      // 이변을 일으킨 작품 (예상 외 승리)
      upsetCausers[u.winnerId] = upsetCausers[u.winnerId] || { count: 0, title: u.winnerTitle };
      upsetCausers[u.winnerId].count++;
      
      // 이변 당한 작품 (예상 외 패배)
      upsetVictims[u.loserId] = upsetVictims[u.loserId] || { count: 0, title: u.loserTitle };
      upsetVictims[u.loserId].count++;
    }
    
    // 레이팅 격차별 이변 분포
    const gapDistribution = { small: 0, medium: 0, large: 0 };
    for (const u of upsets) {
      if (u.ratingDiff < 100) gapDistribution.small++;
      else if (u.ratingDiff < 250) gapDistribution.medium++;
      else gapDistribution.large++;
    }
    
    return {
      total: matchInsights.length,
      upsetCount: upsets.length,
      upsetRate: matchInsights.length > 0 ? (upsets.length / matchInsights.length * 100).toFixed(1) : 0,
      predictionAccuracy: matchInsights.length > 0 ? (correct.length / matchInsights.length * 100).toFixed(1) : 0,
      topUpsetCausers: Object.entries(upsetCausers)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]) => ({ id, ...data })),
      topUpsetVictims: Object.entries(upsetVictims)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]) => ({ id, ...data })),
      gapDistribution,
    };
  }, [matchInsights]);
  
  // 🔮 v3.0.3: 이변 요인 분석 (누적 학습 데이터)
  const factorAnalysis = useMemo(() => {
    if (!upsetFactors || !upsetFactors.factors || upsetFactors.factors.length === 0) return null;
    
    const factors = upsetFactors.factors;
    
    // 유형별 분류
    const byType = {
      tag_only_winner: [], // 승자 전용 태그 (긍정 요인)
      tag_only_loser: [],  // 패자 전용 태그 (부정 요인)
      genre_preference: [], // 선호 장르
      genre_aversion: [],   // 기피 장르
      platform_preference: [], // 선호 플랫폼
      author_preference: [],   // 선호 작가
      read_engagement: [],     // 읽기 참여도
    };
    
    for (const f of factors) {
      if (byType[f.type]) {
        byType[f.type].push(f);
      }
    }
    
    // 상위 요인 추출 (발생 횟수 기준)
    const topPositive = factors
      .filter(f => f.direction === "positive")
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);
      
    const topNegative = factors
      .filter(f => f.direction === "negative")
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);
    
    // 태그 그룹 통합 요인 (유사 태그 그룹으로 묶인 것들)
    const groupedFactors = {};
    for (const f of factors) {
      if (f.key.startsWith("[SIM:")) {
        const groupKey = f.key;
        if (!groupedFactors[groupKey]) {
          groupedFactors[groupKey] = {
            key: groupKey,
            direction: f.direction,
            totalOccurrences: 0,
            originalTags: new Set(),
          };
        }
        groupedFactors[groupKey].totalOccurrences += f.occurrences;
        if (f.originalTag) groupedFactors[groupKey].originalTags.add(f.originalTag);
      }
    }
    
    return {
      total: factors.length,
      byType,
      topPositive,
      topNegative,
      groupedFactors: Object.values(groupedFactors)
        .sort((a, b) => b.totalOccurrences - a.totalOccurrences),
      lastUpdated: upsetFactors.lastUpdated,
    };
  }, [upsetFactors]);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log("Starting analysis, list length:", list?.length);
      const matches = await all("SELECT * FROM matches ORDER BY created_at ASC;");
      console.log("Matches loaded:", matches?.length);
      const result = analyzePreferences(list, matches);
      console.log("Analysis complete:", result?.basicStats?.total);
      setAnalysis(result);
    } catch (e) {
      console.warn("Analysis error:", e);
      console.warn("Error stack:", e?.stack);
      const errText = e?.message || e?.toString() || "알 수 없는 오류";
      setErrorMsg(errText);
      Alert.alert("오류", "분석 중 오류: " + errText);
    }
    setLoading(false);
  }, [list]);

  useEffect(() => {
    if (list && list.length > 0 && !analysis) {
      runAnalysis();
    }
  }, [list]);

  // 🎯 v3.1.2: 상반 태그 관계 분석
  // [FIX v6.1.7] tagRelations.groups는 배열[{id,...}]인데 Object.entries/[id] 접근 → 항상 실패
  //   → 배열을 {id: group} 맵으로 변환 후 처리
  const oppositeTagAnalysis = useMemo(() => {
    if (!tagRelations || !tagRelations.groups) return null;
    // 배열→객체 변환 (TagRelationModal은 배열로 관리)
    const rawGroups = tagRelations.groups;
    const groupsMap = Array.isArray(rawGroups)
      ? Object.fromEntries(rawGroups.filter(g => g && g.id).map(g => [g.id, g]))
      : rawGroups;
    if (!groupsMap || Object.keys(groupsMap).length === 0) return null;
    if (!list || list.length === 0) return null;
    
    const results = [];
    const processedPairs = new Set();
    
    // 상반 관계인 그룹 쌍 찾기
    for (const [groupId, group] of Object.entries(groupsMap)) {
      if (group.type !== "opposite" || !group.relatedGroupId) continue;
      
      const pairKey = [groupId, group.relatedGroupId].sort().join("|");
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      const relatedGroup = groupsMap[group.relatedGroupId];
      if (!relatedGroup) continue;
      
      // 각 그룹에 속한 태그들
      const groupATags = new Set(group.tags || []);
      const groupBTags = new Set(relatedGroup.tags || []);
      
      // 각 그룹의 태그를 가진 작품들 분석
      const groupANovels = [];
      const groupBNovels = [];
      
      for (const novel of list) {
        const novelTags = (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean);
        let hasGroupA = false, hasGroupB = false;
        
        for (const tag of novelTags) {
          if (groupATags.has(tag)) hasGroupA = true;
          if (groupBTags.has(tag)) hasGroupB = true;
        }
        
        if (hasGroupA && !hasGroupB) {
          groupANovels.push(novel);
        } else if (hasGroupB && !hasGroupA) {
          groupBNovels.push(novel);
        }
      }
      
      // 통계 계산
      const calcStats = (novels) => {
        if (novels.length === 0) return { count: 0, avgRating: 0, completedRate: 0, droppedRate: 0 };
        const ratings = novels.map(n => Number(n.rating) || 1500);
        const completed = novels.filter(n => n.status === "completed").length;
        const dropped = novels.filter(n => n.status === "dropped").length;
        return {
          count: novels.length,
          avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          completedRate: completed / novels.length,
          droppedRate: dropped / novels.length,
        };
      };
      
      const statsA = calcStats(groupANovels);
      const statsB = calcStats(groupBNovels);
      
      // 최소 2작품 이상 있는 경우만 분석
      if (statsA.count >= 1 && statsB.count >= 1) {
        const preference = statsA.avgRating > statsB.avgRating + 50 ? "A" 
                        : statsB.avgRating > statsA.avgRating + 50 ? "B" 
                        : "neutral";
        
        results.push({
          groupA: { id: groupId, name: group.name || groupATags.values().next().value || "그룹A", tags: Array.from(groupATags), stats: statsA },
          groupB: { id: group.relatedGroupId, name: relatedGroup.name || groupBTags.values().next().value || "그룹B", tags: Array.from(groupBTags), stats: statsB },
          preference,
          ratingDiff: Math.abs(statsA.avgRating - statsB.avgRating),
        });
      }
    }
    
    return results.length > 0 ? results : null;
  }, [tagRelations, list]);

  // 🆕 v3.2.1: 공동출현 기반 "함께 좋아하는 태그" 분석
  const coOccurrenceInsights = useMemo(() => {
    if (!tagCoOccurrences || Object.keys(tagCoOccurrences).length === 0) return null;
    if (!list || list.length === 0) return null;
    
    // 고평점 작품(1700+)의 태그들에서 공동출현 패턴 찾기
    const highRatedNovels = list.filter(n => (Number(n.rating) || 1500) >= 1700);
    if (highRatedNovels.length < 3) return null;
    
    // 고평점 작품에서 자주 함께 나타나는 태그 조합
    const pairCounts = {};
    
    for (const novel of highRatedNovels) {
      const tags = (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      const majorGenres = parseMajorSub(novel.major_genre);
      const subGenres = parseMajorSub(novel.sub_genre);
      const allTags = [...new Set([...tags, ...majorGenres, ...subGenres])];
      
      // 2개 조합
      for (let i = 0; i < allTags.length; i++) {
        for (let j = i + 1; j < allTags.length; j++) {
          const key = [allTags[i], allTags[j]].sort().join(" + ");
          if (!pairCounts[key]) {
            pairCounts[key] = { count: 0, ratings: [], tags: [allTags[i], allTags[j]] };
          }
          pairCounts[key].count++;
          pairCounts[key].ratings.push(Number(novel.rating) || 1500);
        }
      }
    }
    
    // 전체 작품에서의 조합 빈도와 비교하여 "고평점 작품에서 특히 많이 나타나는" 조합 찾기
    const allNovels = list;
    const allPairCounts = {};
    
    for (const novel of allNovels) {
      const tags = (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      const majorGenres = parseMajorSub(novel.major_genre);
      const subGenres = parseMajorSub(novel.sub_genre);
      const allTags = [...new Set([...tags, ...majorGenres, ...subGenres])];
      
      for (let i = 0; i < allTags.length; i++) {
        for (let j = i + 1; j < allTags.length; j++) {
          const key = [allTags[i], allTags[j]].sort().join(" + ");
          allPairCounts[key] = (allPairCounts[key] || 0) + 1;
        }
      }
    }
    
    // 고평점 비율이 높은 조합 찾기
    const insights = Object.entries(pairCounts)
      .filter(([key, data]) => data.count >= 2 && allPairCounts[key] >= 3)
      .map(([key, data]) => {
        const totalCount = allPairCounts[key] || 1;
        const highRatedRatio = data.count / totalCount;
        const ratings = data.ratings || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 1500;
        
        return {
          combo: key,
          tags: data.tags || [],
          highRatedCount: data.count,
          totalCount,
          highRatedRatio,
          avgRating,
          // 점수: 고평점 비율 * 평균 레이팅 * log(출현 횟수)
          score: highRatedRatio * (avgRating / 1500) * Math.log2(totalCount + 1),
        };
      })
      .filter(item => item.highRatedRatio >= 0.5) // 50% 이상이 고평점
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return insights.length > 0 ? insights : null;
  }, [tagCoOccurrences, list]);

  // 🆕 v3.2.1: 좌표계 기반 취향 분포 분석
  const coordinatePreferenceAnalysis = useMemo(() => {
    if (!coordinateSystems || Object.keys(coordinateSystems).length === 0) return null;
    if (!list || list.length === 0) return null;
    
    const results = [];
    
    for (const [sysId, sys] of Object.entries(coordinateSystems)) {
      if (!sys.tags || Object.keys(sys.tags).length === 0) continue;
      
      // 이 좌표계의 태그를 가진 작품들 분석
      const novelPositions = [];
      
      for (const novel of list) {
        const novelTags = (novel.tags || "").split(",").map(t => t.trim()).filter(Boolean);
        const majorGenres = parseMajorSub(novel.major_genre);
        const subGenres = parseMajorSub(novel.sub_genre);
        const allTags = [...novelTags, ...majorGenres, ...subGenres];
        
        // 이 작품이 좌표계에 해당하는 태그를 가지고 있는지
        let sumPosX = 0, count = 0;
        for (const tag of allTags) {
          const tagData = sys.tags[tag];
          // tagData는 {x, y} 객체 또는 숫자일 수 있음
          if (tagData !== undefined) {
            const xVal = typeof tagData === "object" ? (tagData.x ?? 0.5) : Number(tagData);
            if (!isNaN(xVal)) {
              sumPosX += xVal;
              count++;
            }
          }
        }
        
        if (count > 0) {
          const avgPos = sumPosX / count; // 0~1 범위
          novelPositions.push({
            id: novel.id,
            title: novel.title,
            rating: Number(novel.rating) || 1500,
            position: avgPos * 100, // 0~100으로 변환
            tagCount: count,
          });
        }
      }
      
      if (novelPositions.length >= 3) {
        // 위치별 레이팅 분석 (5구간: 0~20, 20~40, 40~60, 60~80, 80~100)
        const segments = Array(5).fill(null).map((_, i) => ({
          range: `${i * 20}~${(i + 1) * 20}%`,
          novels: [],
          avgRating: 0,
        }));
        
        for (const np of novelPositions) {
          // position은 0~100 범위
          const segIdx = Math.min(4, Math.max(0, Math.floor(np.position / 20)));
          if (segments[segIdx]) {
            segments[segIdx].novels.push(np);
          }
        }
        
        for (const seg of segments) {
          if (seg.novels.length > 0) {
            seg.avgRating = seg.novels.reduce((sum, n) => sum + n.rating, 0) / seg.novels.length;
          }
        }
        
        // 선호 구간 찾기
        const validSegments = segments.filter(s => s.novels.length >= 1);
        const preferredSegment = validSegments.length > 0
          ? validSegments.reduce((best, s) => s.avgRating > best.avgRating ? s : best)
          : null;
        
        // 전체 평균 위치
        const avgPosition = novelPositions.reduce((sum, n) => sum + n.position, 0) / novelPositions.length;
        
        // 고평점(1700+) 작품의 평균 위치
        const highRated = novelPositions.filter(n => n.rating >= 1700);
        const highRatedAvgPos = highRated.length > 0
          ? highRated.reduce((sum, n) => sum + n.position, 0) / highRated.length
          : avgPosition;
        
        // 라벨 추출 (xAxis 또는 기존 leftLabel/rightLabel)
        const leftLabel = sys.xAxis?.negative || sys.leftLabel || "왼쪽";
        const rightLabel = sys.xAxis?.positive || sys.rightLabel || "오른쪽";
        
        results.push({
          id: sysId,
          name: sys.name || sysId,
          leftLabel,
          rightLabel,
          novelCount: novelPositions.length,
          avgPosition,
          highRatedAvgPos,
          segments,
          preferredSegment: preferredSegment?.range || null,
          // 선호 성향 해석
          preferenceLabel: avgPosition < 35 ? `${leftLabel} 선호` 
                         : avgPosition > 65 ? `${rightLabel} 선호`
                         : "중간 성향",
          // 고평점 작품과 전체 평균의 차이
          highRatedBias: highRatedAvgPos - avgPosition,
        });
      }
    }
    
    return results.length > 0 ? results : null;
  }, [coordinateSystems, list]);

  // 🆕 v3.2.1: 매칭 일관성 분석
  const matchConsistencyAnalysis = useMemo(() => {
    if (!matchInsights || matchInsights.length < 10) return null;
    
    // 같은 조합이 여러 번 매칭된 경우 찾기
    const pairResults = {};
    
    for (const m of matchInsights) {
      const pairKey = [m.winnerId, m.loserId].sort().join("|");
      if (!pairResults[pairKey]) {
        pairResults[pairKey] = {
          novelA: { id: m.winnerId, title: m.winnerTitle },
          novelB: { id: m.loserId, title: m.loserTitle },
          matches: [],
        };
      }
      pairResults[pairKey].matches.push({
        winnerId: m.winnerId,
        timestamp: m.timestamp,
        isUpset: m.isUpset,
      });
    }
    
    // 2회 이상 매칭된 조합만 분석
    const repeatedPairs = Object.values(pairResults)
      .filter(p => p.matches.length >= 2)
      .map(p => {
        const totalMatches = p.matches.length;
        const aWins = p.matches.filter(m => m.winnerId === p.novelA.id).length;
        const bWins = totalMatches - aWins;
        
        // 일관성 = 더 많이 이긴 쪽의 승률
        const consistency = Math.max(aWins, bWins) / totalMatches;
        const dominant = aWins > bWins ? p.novelA : p.novelB;
        const dominated = aWins > bWins ? p.novelB : p.novelA;
        
        return {
          ...p,
          totalMatches,
          aWins,
          bWins,
          consistency,
          dominant,
          dominated,
          // 완전 일관 (한쪽이 100% 승리)
          isFullyConsistent: consistency === 1,
          // 불안정 (50% 근처)
          isUnstable: consistency < 0.6,
        };
      })
      .sort((a, b) => a.consistency - b.consistency); // 불안정한 것부터
    
    if (repeatedPairs.length === 0) return null;
    
    // 통계
    const totalRepeated = repeatedPairs.length;
    const fullyConsistent = repeatedPairs.filter(p => p.isFullyConsistent).length;
    const unstable = repeatedPairs.filter(p => p.isUnstable).length;
    const avgConsistency = repeatedPairs.reduce((sum, p) => sum + p.consistency, 0) / totalRepeated;
    
    return {
      totalRepeatedPairs: totalRepeated,
      fullyConsistentCount: fullyConsistent,
      unstableCount: unstable,
      avgConsistency,
      // 가장 불안정한 조합 (결정하기 어려운 작품들)
      mostUnstable: repeatedPairs.filter(p => p.isUnstable).slice(0, 5),
      // 가장 일관된 조합
      mostConsistent: repeatedPairs.filter(p => p.isFullyConsistent).slice(0, 5),
    };
  }, [matchInsights]);

  // 🆕 v3.2.1: 유사 그룹 간 선호도 일관성 분석
  // [FIX v6.1.7] tagRelations.groups 배열→객체 변환 (oppositeTagAnalysis와 동일 패턴)
  const similarGroupConsistency = useMemo(() => {
    if (!tagRelations || !tagRelations.groups) return null;
    if (!list || list.length === 0) return null;
    const rawGroups2 = tagRelations.groups;
    const groupsMap2 = Array.isArray(rawGroups2)
      ? Object.fromEntries(rawGroups2.filter(g => g && g.id).map(g => [g.id, g]))
      : rawGroups2;
    
    const similarGroups = Object.entries(groupsMap2)
      .filter(([_, g]) => g.type === "similar" && g.tags && g.tags.length >= 2);
    
    if (similarGroups.length === 0) return null;
    
    const results = [];
    
    for (const [groupId, group] of similarGroups) {
      // 그룹 내 각 태그의 평균 레이팅 계산
      const tagRatings = {};
      
      for (const tag of group.tags) {
        const novelsWithTag = list.filter(n => {
          const novelTags = (n.tags || "").split(",").map(t => t.trim());
          return novelTags.includes(tag);
        });
        
        if (novelsWithTag.length > 0) {
          const avgRating = novelsWithTag.reduce((sum, n) => sum + (Number(n.rating) || 1500), 0) / novelsWithTag.length;
          tagRatings[tag] = { count: novelsWithTag.length, avgRating };
        }
      }
      
      const ratedTags = Object.entries(tagRatings);
      if (ratedTags.length < 2) continue;
      
      // 그룹 내 태그들의 레이팅 편차 계산
      const ratings = ratedTags.map(([_, data]) => data.avgRating);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
      const stdDev = Math.sqrt(variance);
      
      // 일관성 점수 (표준편차가 낮을수록 일관)
      // 50점 이하 편차면 일관적으로 판단
      const isConsistent = stdDev < 50;
      
      results.push({
        id: groupId,
        name: group.name || "유사 그룹",
        tags: ratedTags.sort((a, b) => b[1].avgRating - a[1].avgRating),
        avgRating,
        stdDev,
        isConsistent,
        // 그룹 내 최고/최저
        bestTag: ratedTags.reduce((best, curr) => curr[1].avgRating > best[1].avgRating ? curr : best),
        worstTag: ratedTags.reduce((worst, curr) => curr[1].avgRating < worst[1].avgRating ? curr : worst),
      });
    }
    
    return results.length > 0 ? results.sort((a, b) => b.stdDev - a.stdDev) : null;
  }, [tagRelations, list]);

  if (!list || list.length === 0) {
    return (
      <>
        <H>취향 분석</H>
        <Section title="데이터 없음">
          <Text style={{ color: C.sub }}>분석할 작품이 없습니다. 작품을 등록하고 매칭을 진행해주세요.</Text>
        </Section>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <H>취향 분석</H>
        <Section title="분석 중...">
          <Text style={{ color: C.sub }}>데이터를 분석하고 있습니다...</Text>
        </Section>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        <H>취향 분석</H>
        <Section title="분석 준비">
          {errorMsg && (
            <View style={{ backgroundColor: "#fee2e2", padding: 10, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ color: "#dc2626" }}>오류: {errorMsg}</Text>
            </View>
          )}
          <PrimaryButton title="분석 시작" onPress={runAnalysis} />
        </Section>
      </>
    );
  }

  // 분석에 오류가 있으면 표시
  if (analysis.error) {
    return (
      <>
        <H>취향 분석</H>
        <Section title="분석 불가">
          <Text style={{ color: C.sub }}>{analysis.error}</Text>
          <PrimaryButton title="다시 시도" onPress={runAnalysis} style={{ marginTop: 12 }} />
        </Section>
      </>
    );
  }

  const { basicStats, majorGenreAnalysis, subGenreAnalysis, tagAnalysis,
          comboAnalysis, platformAnalysis, loyalAuthors, readingPattern,
          matchAnalysis, trendAnalysis, anomalies, insights, spectrumAnalysis } = analysis;

  // 차트 데이터 준비
  const genreChartData = majorGenreAnalysis.slice(0, 8).map(g => ({
    label: g.genre,
    value: g.avgRating - 1400, // 1400 기준으로 표시
    displayValue: g.avgRating.toFixed(0),
    color: g.avgRating >= 1700 ? "#22c55e" : g.avgRating >= 1550 ? "#3b82f6" : "#f59e0b",
  }));

  const platformChartData = platformAnalysis.map(p => ({
    label: p.platform,
    value: p.count,
  }));

  const statusPieData = [
    { label: "읽는중", value: basicStats.readingCount },
    { label: "완독", value: basicStats.completedCount },
    { label: "드롭", value: basicStats.droppedCount },
    { label: "기타", value: basicStats.total - basicStats.readingCount - basicStats.completedCount - basicStats.droppedCount },
  ].filter(d => d.value > 0);

  const lengthPieData = [
    { label: "단편(<100)", value: readingPattern.lengthPreference.short.count },
    { label: "중편(100-400)", value: readingPattern.lengthPreference.medium.count },
    { label: "장편(400+)", value: readingPattern.lengthPreference.long.count },
  ].filter(d => d.value > 0);

  return (
    <>
      <H>🎯 취향 분석</H>

      {/* 🆕 v3.4: 전체 펼침/접기 컨트롤 */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <TouchableOpacity 
          onPress={expandAll}
          style={{ 
            flex: 1, 
            backgroundColor: C.chip, 
            paddingVertical: 10, 
            borderRadius: 10, 
            alignItems: "center" 
          }}
        >
          <Text style={{ color: C.primary, fontWeight: "700" }}>📂 전체 펼치기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={collapseAll}
          style={{ 
            flex: 1, 
            backgroundColor: C.chip, 
            paddingVertical: 10, 
            borderRadius: 10, 
            alignItems: "center" 
          }}
        >
          <Text style={{ color: C.sub, fontWeight: "700" }}>📁 전체 접기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={runAnalysis}
          style={{ 
            backgroundColor: C.primary, 
            paddingVertical: 10, 
            paddingHorizontal: 16,
            borderRadius: 10, 
            alignItems: "center" 
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════
         🌟 핵심 요약 카드 (항상 펼침) - 한눈에 파악
         ═══════════════════════════════════════════════════════════════ */}
      <View style={{ 
        backgroundColor: isDark ? "#1e293b" : "#f0f9ff", 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16,
        borderWidth: 2,
        borderColor: C.primary + "40",
      }}>
        {/* 핵심 문장 */}
        <Text style={{ color: C.text, fontSize: 15, fontWeight: "600", lineHeight: 24, marginBottom: 12 }}>
          {insights.corePreference}
        </Text>

        {/* 핵심 수치 3개 */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: C.card, padding: 12, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: C.primary, fontSize: 22, fontWeight: "800" }}>{basicStats.total}</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>총 작품</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.card, padding: 12, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: C.ok, fontSize: 22, fontWeight: "800" }}>{basicStats.avgRating.toFixed(0)}</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>평균 레이팅</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.card, padding: 12, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: "#f59e0b", fontSize: 22, fontWeight: "800" }}>{(basicStats.totalReadCount / 1000).toFixed(1)}k</Text>
            <Text style={{ color: C.sub, fontSize: 11 }}>읽은 회차</Text>
          </View>
        </View>

        {/* 선호 장르 태그 */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {majorGenreAnalysis.slice(0, 3).map((g, i) => (
            <View key={i} style={{ 
              backgroundColor: C.primary + "20", 
              paddingHorizontal: 10, 
              paddingVertical: 5, 
              borderRadius: 12 
            }}>
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: "700" }}>
                {g.genre} ({g.avgRating.toFixed(0)})
              </Text>
            </View>
          ))}
          {insights.recommendConditions.preferred?.slice(0, 2).map((tag, i) => (
            <View key={`pref-${i}`} style={{ 
              backgroundColor: C.ok + "20", 
              paddingHorizontal: 10, 
              paddingVertical: 5, 
              borderRadius: 12 
            }}>
              <Text style={{ color: C.ok, fontSize: 12, fontWeight: "600" }}>+{tag}</Text>
            </View>
          ))}
          {insights.avoidFactors?.slice(0, 2).map((factor, i) => (
            <View key={`avoid-${i}`} style={{ 
              backgroundColor: C.warn + "20", 
              paddingHorizontal: 10, 
              paddingVertical: 5, 
              borderRadius: 12 
            }}>
              <Text style={{ color: C.warn, fontSize: 12, fontWeight: "600" }}>-{factor.split(" ")[0]}</Text>
            </View>
          ))}
        </View>

        {/* 취향 변화 감지 */}
        {insights.trendNote && (
          <View style={{ backgroundColor: "#fef3c7", padding: 10, borderRadius: 10 }}>
            <Text style={{ color: "#92400e", fontSize: 12, fontWeight: "600" }}>
              📈 {insights.trendNote}
            </Text>
          </View>
        )}

        {/* 신뢰도 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ color: C.sub, fontSize: 11 }}>
            분석 신뢰도 {insights.dataQualityScore}%
          </Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>
            {insights.reliableCount}개 신뢰 / {insights.suspiciousCount}개 검토필요
          </Text>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════
         📊 세부 분석 섹션들 (기본 접힘)
         ═══════════════════════════════════════════════════════════════ */}

      {/* 📊 기본 통계 */}
      <TouchableOpacity onPress={() => toggleSection("basicStats")} activeOpacity={0.7}>
        <Section title={`📊 기본 통계 ${isExpanded("basicStats") ? "▼" : "▶"}`}>
          {isExpanded("basicStats") ? (
            <>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { label: "총 작품", value: basicStats.total },
                  { label: "평균 레이팅", value: basicStats.avgRating.toFixed(0) },
                  { label: "총 읽은 회차", value: basicStats.totalReadCount.toLocaleString() },
                  { label: "평균 읽은 회차", value: basicStats.avgReadCount.toFixed(0) },
                  { label: "다회독 작품", value: basicStats.rereadNovelCount || 0 },
                  { label: "총 다회독 횟수", value: basicStats.totalRereadCount || 0 },
                ].map((item, i) => (
                  <View key={i} style={{ backgroundColor: C.chip, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, minWidth: "45%" }}>
                    <Text style={{ color: C.sub, fontSize: 11 }}>{item.label}</Text>
                    <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>{item.value}</Text>
                  </View>
                ))}
              </View>
              
              <Text style={{ color: C.sub, fontSize: 12, marginTop: 12, marginBottom: 6 }}>읽기 상태 분포</Text>
              <PieChartSimple data={statusPieData} theme={C} />
            </>
          ) : (
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {basicStats.total}작 · 평균 {basicStats.avgRating.toFixed(0)}점 · 총 {(basicStats.totalReadCount / 1000).toFixed(1)}k회 읽음
            </Text>
          )}
        </Section>
      </TouchableOpacity>

      {/* 대장르 분석 */}
      <TouchableOpacity onPress={() => toggleSection("majorGenre")}>
        <Section title={`📚 대장르 선호도 ${isExpanded("majorGenre") ? "▼" : "▶"}`}>
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
            평균 레이팅 기준 (1400점 이상 표시)
          </Text>
          <RadarChartSimple 
            data={genreChartData.map(g => ({ ...g, value: g.value + 1400 }))} 
            maxValue={2000} 
            theme={C} 
          />
          
          {isExpanded("majorGenre") && (
            <View style={{ marginTop: 12 }}>
              {majorGenreAnalysis.map((g, i) => (
                <View key={i} style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                }}>
                  <View>
                    <Text style={{ color: C.text, fontWeight: "700" }}>{g.genre}</Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>
                      {g.count}작 · 완독률 {(g.completionRate * 100).toFixed(0)}% · 드롭률 {(g.dropRate * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: C.text, fontWeight: "800" }}>{g.avgRating.toFixed(0)}</Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>승률 {(g.winRate * 100).toFixed(0)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>
      </TouchableOpacity>

      {/* 부장르/태그 분석 */}
      <TouchableOpacity onPress={() => toggleSection("subGenre")}>
        <Section title={`🏷️ 부장르 선호도 TOP 10 ${isExpanded("subGenre") ? "▼" : "▶"}`}>
          {subGenreAnalysis.slice(0, isExpanded("subGenre") ? 20 : 10).map((g, i) => (
            <View key={i} style={{ 
              flexDirection: "row", 
              justifyContent: "space-between",
              paddingVertical: 4,
            }}>
              <Text style={{ color: C.text, fontSize: 13 }}>
                {i + 1}. {g.genre} ({g.count}작)
              </Text>
              <Text style={{ color: g.avgRating >= 1700 ? C.ok : C.text, fontWeight: "600", fontSize: 13 }}>
                {g.avgRating.toFixed(0)}
              </Text>
            </View>
          ))}
        </Section>
      </TouchableOpacity>

      {/* 태그 조합 분석 */}
      {comboAnalysis.length > 0 && (
        <Section title="✨ 최애 태그 조합">
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
            높은 만족도를 보이는 태그 조합
          </Text>
          {comboAnalysis.slice(0, 8).map((c, i) => (
            <View key={i} style={{ 
              flexDirection: "row", 
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: C.primary, fontWeight: "800", marginRight: 8 }}>#{i + 1}</Text>
                <Text style={{ color: C.text }}>{c.combo}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: C.sub, fontSize: 12, marginRight: 6 }}>{c.count}작</Text>
                <Text style={{ color: C.ok, fontWeight: "700" }}>{c.avgRating.toFixed(0)}</Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* 🎯 v3.1.2 상반 태그 분석 */}
      {oppositeTagAnalysis && oppositeTagAnalysis.length > 0 && (
        <Section title="⚡ 상반 태그 선호도 비교">
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
            서로 반대 의미의 태그 그룹 간 선호도 비교
          </Text>
          
          {oppositeTagAnalysis.map((pair, idx) => {
            const { groupA, groupB, preference, ratingDiff } = pair;
            const maxRating = Math.max(groupA.stats.avgRating, groupB.stats.avgRating);
            const minRating = Math.min(groupA.stats.avgRating, groupB.stats.avgRating);
            
            // 좌우 비율 계산 (기본 50:50, 레이팅 차이에 따라 조정)
            const totalRating = groupA.stats.avgRating + groupB.stats.avgRating;
            const leftPercent = totalRating > 0 ? (groupA.stats.avgRating / totalRating) * 100 : 50;
            
            return (
              <View key={idx} style={{ 
                marginBottom: 16,
                padding: 12,
                backgroundColor: isDark ? "#1a202c" : "#f8fafc",
                borderRadius: 12,
              }}>
                {/* 그룹명 및 태그 */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flex: 1, alignItems: "flex-start" }}>
                    <Text style={{ 
                      color: preference === "A" ? C.ok : C.text, 
                      fontWeight: preference === "A" ? "800" : "600",
                      fontSize: 13,
                    }}>
                      {groupA.tags.slice(0, 2).join(", ")}
                      {preference === "A" && " ✓"}
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 10 }}>
                      {groupA.stats.count}작 · {groupA.stats.avgRating.toFixed(0)}점
                    </Text>
                  </View>
                  
                  <View style={{ paddingHorizontal: 8 }}>
                    <Text style={{ color: C.sub, fontSize: 11, fontWeight: "700" }}>VS</Text>
                  </View>
                  
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ 
                      color: preference === "B" ? C.ok : C.text, 
                      fontWeight: preference === "B" ? "800" : "600",
                      fontSize: 13,
                    }}>
                      {preference === "B" && "✓ "}
                      {groupB.tags.slice(0, 2).join(", ")}
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 10 }}>
                      {groupB.stats.count}작 · {groupB.stats.avgRating.toFixed(0)}점
                    </Text>
                  </View>
                </View>
                
                {/* 비교 바 */}
                <View style={{ 
                  height: 12, 
                  flexDirection: "row", 
                  borderRadius: 6, 
                  overflow: "hidden",
                }}>
                  <View style={{ 
                    width: `${leftPercent}%`, 
                    backgroundColor: preference === "A" ? C.ok : "#60a5fa",
                  }} />
                  <View style={{ 
                    flex: 1, 
                    backgroundColor: preference === "B" ? C.ok : "#f59e0b",
                  }} />
                </View>
                
                {/* 해석 */}
                {ratingDiff > 30 && (
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 6, textAlign: "center" }}>
                    {preference === "A" 
                      ? `${groupA.tags[0]} 계열을 ${ratingDiff.toFixed(0)}점 더 선호`
                      : preference === "B"
                        ? `${groupB.tags[0]} 계열을 ${ratingDiff.toFixed(0)}점 더 선호`
                        : "비슷한 선호도"}
                  </Text>
                )}
              </View>
            );
          })}
        </Section>
      )}

      {/* 🆕 v3.2.1: 공동출현 기반 "황금 조합" 분석 */}
      {coOccurrenceInsights && coOccurrenceInsights.length > 0 && (
        <Section title="🏆 황금 조합 발견">
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
            고평점 작품에서 특히 자주 함께 나타나는 태그 조합
          </Text>
          
          {coOccurrenceInsights.map((item, idx) => {
            const highRatePercent = (item.highRatedRatio * 100).toFixed(0);
            
            return (
              <View key={idx} style={{ 
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 8,
                backgroundColor: idx === 0 ? (isDark ? "#2d1f00" : "#fffbeb") : C.chip,
                borderRadius: 12,
                borderLeftWidth: idx < 3 ? 3 : 0,
                borderLeftColor: idx === 0 ? "#f59e0b" : idx === 1 ? "#d97706" : "#b45309",
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>
                      {idx < 3 && ["🥇", "🥈", "🥉"][idx]} {item.combo}
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
                      {item.totalCount}회 출현 중 {item.highRatedCount}회가 고평점 ({highRatePercent}%)
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: C.ok, fontWeight: "800", fontSize: 16 }}>
                      {item.avgRating.toFixed(0)}
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 10 }}>평균</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* 🆕 v3.2.1: 좌표계 기반 취향 분포 */}
      {coordinatePreferenceAnalysis && coordinatePreferenceAnalysis.length > 0 && (
        <TouchableOpacity onPress={() => toggleSection("coordPref")}>
          <Section title={`📐 취향 좌표 분석 ${isExpanded("coordPref") ? "▼" : "▶"}`}>
            <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
              사용자 정의 좌표계 기반 취향 위치 분석
            </Text>
            
            {coordinatePreferenceAnalysis.map((coord, idx) => {
              const position = coord.avgPosition;
              const highRatedPos = coord.highRatedAvgPos;
              
              return (
                <View key={idx} style={{ 
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: isDark ? "#1a202c" : "#f8fafc",
                  borderRadius: 12,
                }}>
                  {/* 좌표계 이름 */}
                  <Text style={{ color: C.text, fontWeight: "700", marginBottom: 8 }}>
                    {coord.name}
                  </Text>
                  
                  {/* 슬라이더 바 */}
                  <View style={{ marginBottom: 8 }}>
                    <View style={{ 
                      height: 8, 
                      backgroundColor: isDark ? "#374151" : "#e5e7eb", 
                      borderRadius: 4,
                      position: "relative",
                    }}>
                      {/* 전체 평균 위치 마커 */}
                      <View style={{ 
                        position: "absolute",
                        left: `${position}%`,
                        top: -4,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: C.primary,
                        marginLeft: -8,
                        borderWidth: 2,
                        borderColor: "#fff",
                      }} />
                      
                      {/* 고평점 작품 평균 위치 마커 (다른 색) */}
                      {Math.abs(highRatedPos - position) > 5 && (
                        <View style={{ 
                          position: "absolute",
                          left: `${highRatedPos}%`,
                          top: -2,
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: C.ok,
                          marginLeft: -6,
                          borderWidth: 2,
                          borderColor: "#fff",
                        }} />
                      )}
                    </View>
                    
                    {/* 양 끝 레이블 */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                      <Text style={{ color: C.sub, fontSize: 10 }}>{coord.leftLabel}</Text>
                      <Text style={{ color: C.sub, fontSize: 10 }}>{coord.rightLabel}</Text>
                    </View>
                  </View>
                  
                  {/* 해석 */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ 
                      backgroundColor: C.primary + "20", 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 6 
                    }}>
                      <Text style={{ color: C.primary, fontSize: 11, fontWeight: "600" }}>
                        {coord.preferenceLabel}
                      </Text>
                    </View>
                    <Text style={{ color: C.sub, fontSize: 11 }}>
                      {coord.novelCount}작 분석
                    </Text>
                  </View>
                  
                  {/* 고평점 편향 표시 */}
                  {Math.abs(coord.highRatedBias) > 10 && (
                    <Text style={{ color: C.sub, fontSize: 10, marginTop: 6, fontStyle: "italic" }}>
                      💡 고평점 작품은 {coord.highRatedBias > 0 ? coord.rightLabel : coord.leftLabel} 쪽으로 
                      {Math.abs(coord.highRatedBias).toFixed(0)}% 더 치우침
                    </Text>
                  )}
                  
                  {/* 상세 구간 (펼침 시) */}
                  {isExpanded("coordPref") && coord.segments && (
                    <View style={{ 
                      backgroundColor: isDark ? "#111827" : "#f1f5f9", 
                      padding: 8, 
                      borderRadius: 8,
                      marginTop: 8,
                    }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {coord.segments.map((seg, segIdx) => (
                          <View key={segIdx} style={{ 
                            width: "20%", 
                            alignItems: "center",
                            paddingVertical: 4,
                          }}>
                            <Text style={{ color: C.sub, fontSize: 9 }}>{seg.range}</Text>
                            <Text style={{ 
                              color: seg.novels.length > 0 ? C.text : C.sub, 
                              fontSize: 11,
                              fontWeight: seg.range === coord.preferredSegment ? "800" : "400",
                            }}>
                              {seg.novels.length > 0 ? seg.avgRating.toFixed(0) : "-"}
                            </Text>
                            <Text style={{ color: C.sub, fontSize: 9 }}>{seg.novels.length}작</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Section>
        </TouchableOpacity>
      )}

      {/* 🆕 v3.2.1: 매칭 일관성 분석 */}
      {matchConsistencyAnalysis && (
        <TouchableOpacity onPress={() => toggleSection("matchConsist")}>
          <Section title={`🎯 매칭 일관성 분석 ${isExpanded("matchConsist") ? "▼" : "▶"}`}>
            {/* 요약 통계 */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <View style={{ backgroundColor: C.chip, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: C.sub, fontSize: 10 }}>반복 매칭 조합</Text>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: "800" }}>
                  {matchConsistencyAnalysis.totalRepeatedPairs}쌍
                </Text>
              </View>
              <View style={{ backgroundColor: C.ok + "20", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: C.ok, fontSize: 10 }}>완전 일관</Text>
                <Text style={{ color: C.ok, fontSize: 16, fontWeight: "800" }}>
                  {matchConsistencyAnalysis.fullyConsistentCount}쌍
                </Text>
              </View>
              <View style={{ backgroundColor: C.warn + "20", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: C.warn, fontSize: 10 }}>불안정</Text>
                <Text style={{ color: C.warn, fontSize: 16, fontWeight: "800" }}>
                  {matchConsistencyAnalysis.unstableCount}쌍
                </Text>
              </View>
              <View style={{ backgroundColor: C.primary + "20", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: C.primary, fontSize: 10 }}>평균 일관성</Text>
                <Text style={{ color: C.primary, fontSize: 16, fontWeight: "800" }}>
                  {(matchConsistencyAnalysis.avgConsistency * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            
            {/* 불안정한 조합 (결정하기 어려운 작품들) */}
            {isExpanded("matchConsist") && matchConsistencyAnalysis.mostUnstable.length > 0 && (
              <>
                <Text style={{ color: C.warn, fontWeight: "700", marginBottom: 8 }}>
                  ⚠️ 결정하기 어려운 조합
                </Text>
                <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
                  여러 번 매칭해도 결과가 달라지는 작품들 - 취향이 비슷할 수 있음
                </Text>
                
                {matchConsistencyAnalysis.mostUnstable.map((pair, idx) => (
                  <View key={idx} style={{ 
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    marginBottom: 6,
                    backgroundColor: isDark ? "#2d1f1f" : "#fef2f2",
                    borderRadius: 8,
                  }}>
                    <Text style={{ color: C.text, fontSize: 13 }} numberOfLines={1}>
                      {pair.novelA.title} vs {pair.novelB.title}
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
                      {pair.totalMatches}회 매칭 · {pair.aWins}:{pair.bWins} · 
                      일관성 {(pair.consistency * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </>
            )}
            
            {/* 완전 일관 조합 */}
            {isExpanded("matchConsist") && matchConsistencyAnalysis.mostConsistent.length > 0 && (
              <>
                <Text style={{ color: C.ok, fontWeight: "700", marginTop: 12, marginBottom: 8 }}>
                  ✓ 확실한 선호 조합
                </Text>
                <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
                  여러 번 매칭해도 항상 같은 결과 - 명확한 취향 차이
                </Text>
                
                {matchConsistencyAnalysis.mostConsistent.slice(0, 5).map((pair, idx) => (
                  <View key={idx} style={{ 
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    marginBottom: 6,
                    backgroundColor: isDark ? "#1a2e1a" : "#f0fdf4",
                    borderRadius: 8,
                  }}>
                    <Text style={{ color: C.text, fontSize: 13 }} numberOfLines={1}>
                      <Text style={{ fontWeight: "700" }}>{pair.dominant.title}</Text>
                      {" > "}
                      {pair.dominated.title}
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
                      {pair.totalMatches}회 매칭 · 
                      {pair.dominant.title === pair.novelA.title ? pair.aWins : pair.bWins}전 전승
                    </Text>
                  </View>
                ))}
              </>
            )}
          </Section>
        </TouchableOpacity>
      )}

      {/* 🆕 v3.2.1: 유사 그룹 일관성 분석 */}
      {similarGroupConsistency && similarGroupConsistency.length > 0 && (
        <TouchableOpacity onPress={() => toggleSection("simGroupConsist")}>
          <Section title={`🔗 유사 태그 일관성 ${isExpanded("simGroupConsist") ? "▼" : "▶"}`}>
            <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
              비슷한 태그들에 대한 평가 일관성 분석
            </Text>
            
            {similarGroupConsistency.slice(0, isExpanded("simGroupConsist") ? 10 : 3).map((group, idx) => {
              const isConsistent = group.isConsistent;
              
              return (
                <View key={idx} style={{ 
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  marginBottom: 8,
                  backgroundColor: isConsistent 
                    ? (isDark ? "#1a2e1a" : "#f0fdf4") 
                    : (isDark ? "#2d1f1f" : "#fef2f2"),
                  borderRadius: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: isConsistent ? C.ok : C.warn,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>
                      {group.name}
                    </Text>
                    <View style={{ 
                      backgroundColor: isConsistent ? C.ok + "20" : C.warn + "20", 
                      paddingHorizontal: 8, 
                      paddingVertical: 2, 
                      borderRadius: 6 
                    }}>
                      <Text style={{ color: isConsistent ? C.ok : C.warn, fontSize: 10, fontWeight: "600" }}>
                        {isConsistent ? "일관적" : "불일관"}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                    평균 {group.avgRating.toFixed(0)}점 · 편차 ±{group.stdDev.toFixed(0)}점
                  </Text>
                  
                  {/* 상세 (펼침 시) */}
                  {isExpanded("simGroupConsist") && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: C.sub, fontSize: 10, marginBottom: 4 }}>
                        그룹 내 태그별 평점:
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {group.tags.map(([tag, data], tagIdx) => (
                          <View key={tagIdx} style={{ 
                            backgroundColor: isDark ? "#374151" : "#e5e7eb", 
                            paddingHorizontal: 8, 
                            paddingVertical: 4, 
                            borderRadius: 6 
                          }}>
                            <Text style={{ color: C.text, fontSize: 11 }}>
                              {tag} <Text style={{ fontWeight: "700" }}>{data.avgRating.toFixed(0)}</Text>
                              <Text style={{ color: C.sub }}> ({data.count})</Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      {!isConsistent && group.bestTag && group.worstTag && (
                        <Text style={{ color: C.warn, fontSize: 10, marginTop: 6, fontStyle: "italic" }}>
                          💡 "{group.bestTag[0]}"({group.bestTag[1].avgRating.toFixed(0)})과 
                          "{group.worstTag[0]}"({group.worstTag[1].avgRating.toFixed(0)}) 사이에 
                          {(group.bestTag[1].avgRating - group.worstTag[1].avgRating).toFixed(0)}점 차이
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </Section>
        </TouchableOpacity>
      )}

      {/* 플랫폼 분석 */}
      <Section title="📱 플랫폼별 만족도">
        {platformAnalysis.map((p, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
              <Text style={{ color: C.text, fontWeight: "600" }}>{p.platform}</Text>
              <Text style={{ color: C.sub, fontSize: 12 }}>
                {p.count}작 · 평균 {p.avgRating.toFixed(0)}점
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: C.chip, borderRadius: 4, overflow: "hidden" }}>
              <View style={{ 
                width: `${Math.min(100, ((p.avgRating - 1400) / 600) * 100)}%`, 
                height: "100%", 
                backgroundColor: p.avgRating >= 1700 ? C.ok : C.primary,
              }} />
            </View>
          </View>
        ))}
      </Section>

      {/* 읽기 패턴 */}
      <Section title="📖 읽기 패턴">
        <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>선호 작품 길이</Text>
        <PieChartSimple data={lengthPieData} theme={C} />
        
        <View style={{ marginTop: 12 }}>
          {[
            { label: "단편 (<100화)", ...readingPattern.lengthPreference.short },
            { label: "중편 (100-400화)", ...readingPattern.lengthPreference.medium },
            { label: "장편 (400화+)", ...readingPattern.lengthPreference.long },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ color: C.text }}>{item.label}</Text>
              <Text style={{ color: C.sub }}>
                {item.count}작 · 평균 {(item.avgRating || 0).toFixed(0)}점
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* 작가 충성도 (상세) */}
      {loyalAuthors.length > 0 && (
        <Section title="✍️ 재구매 작가 분석">
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
            2작품 이상 읽은 작가 · 평점 편향 분석
          </Text>
          {loyalAuthors.slice(0, 7).map((a, i) => {
            // 점수 편향 표시
            const biasText = a.ratingBias > 0 
              ? `+${a.ratingBias.toFixed(0)}점 고평가` 
              : a.ratingBias < -10 
                ? `${a.ratingBias.toFixed(0)}점 저평가`
                : "평균 수준";
            const biasColor = a.ratingBias > 20 ? C.ok : a.ratingBias < -20 ? C.warn : C.sub;
            
            // 작품 목록 (점수 포함)
            const novelList = a.novels.slice(0, 3).map(n => 
              typeof n === "object" ? `${n.title}(${n.rating.toFixed(0)})` : n
            );
            
            return (
              <View key={i} style={{ 
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 8,
                backgroundColor: i === 0 ? (isDark ? "#1a2e1a" : "#f0fdf4") : C.chip,
                borderRadius: 12,
                borderLeftWidth: i === 0 ? 4 : 0,
                borderLeftColor: C.ok,
              }}>
                {/* 작가명 + 점수 */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {i === 0 && <Text style={{ fontSize: 16, marginRight: 6 }}>👑</Text>}
                    <Text style={{ color: C.text, fontWeight: "800", fontSize: 15 }}>{a.author}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: C.ok, fontWeight: "800", fontSize: 16 }}>{a.avgRating.toFixed(0)}</Text>
                    <Text style={{ color: C.sub, fontSize: 12, marginLeft: 4 }}>점</Text>
                  </View>
                </View>
                
                {/* 점수 편향 */}
                <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ 
                    backgroundColor: biasColor + "20", 
                    paddingHorizontal: 8, 
                    paddingVertical: 3, 
                    borderRadius: 12 
                  }}>
                    <Text style={{ color: biasColor, fontSize: 11, fontWeight: "700" }}>
                      {biasText}
                    </Text>
                  </View>
                  <Text style={{ color: C.sub, fontSize: 11, marginLeft: 8 }}>
                    {a.count}작품 · 완독률 {(a.completionRate * 100).toFixed(0)}%
                  </Text>
                </View>
                
                {/* 작가 특징 */}
                {a.features && (
                  <Text style={{ color: C.primary, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>
                    💡 {a.features}
                  </Text>
                )}
                
                {/* 작품 목록 */}
                <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>
                  📚 {novelList.join(", ")}{a.novels.length > 3 ? ` 외 ${a.novels.length - 3}작` : ""}
                </Text>
              </View>
            );
          })}
          
          {/* 총평 */}
          {loyalAuthors.length > 0 && (
            <View style={{ 
              marginTop: 8, 
              padding: 12, 
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9", 
              borderRadius: 10 
            }}>
              <Text style={{ color: C.text, fontWeight: "700", marginBottom: 4 }}>📊 작가 선호 분석</Text>
              <Text style={{ color: C.sub, fontSize: 12, lineHeight: 18 }}>
                {(() => {
                  const highBiasAuthors = loyalAuthors.filter(a => a.ratingBias > 30);
                  const mostReadAuthor = [...loyalAuthors].sort((a, b) => b.totalRead - a.totalRead)[0];
                  const lines = [];
                  
                  if (highBiasAuthors.length > 0) {
                    lines.push(`• ${highBiasAuthors.map(a => a.author).join(", ")} 작가를 특히 고평가하는 경향`);
                  }
                  if (mostReadAuthor && mostReadAuthor.totalRead > 100) {
                    lines.push(`• ${mostReadAuthor.author} 작가 작품을 가장 많이 읽음 (${mostReadAuthor.totalRead}화)`);
                  }
                  if (loyalAuthors[0]?.mainGenres?.length > 0) {
                    lines.push(`• 선호 작가들의 주요 장르: ${loyalAuthors.slice(0, 3).flatMap(a => a.mainGenres || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(", ")}`);
                  }
                  
                  return lines.length > 0 ? lines.join("\n") : "더 많은 작품을 읽으면 정확한 분석이 가능합니다.";
                })()}
              </Text>
            </View>
          )}
        </Section>
      )}

      {/* 매칭 패턴 */}
      {matchAnalysis.total > 0 && (
        <TouchableOpacity onPress={() => toggleSection("matchAnalysis")}>
          <Section title={`⚔️ 매칭 패턴 분석 ${isExpanded("matchAnalysis") ? "▼" : "▶"}`}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: C.chip, padding: 10, borderRadius: 8 }}>
                <Text style={{ color: C.sub, fontSize: 11 }}>총 매칭</Text>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>{matchAnalysis.total}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: C.chip, padding: 10, borderRadius: 8 }}>
                <Text style={{ color: C.sub, fontSize: 11 }}>자동 결정</Text>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: "800" }}>
                  {(matchAnalysis.autoRatio * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            
            {isExpanded("matchAnalysis") && matchAnalysis.genreVsGenre.length > 0 && (
              <>
                <Text style={{ color: C.text, fontWeight: "700", marginBottom: 8 }}>
                  장르간 상대전적 (승률 높은 순)
                </Text>
                <HeatmapRow data={matchAnalysis.genreVsGenre} theme={C} />
              </>
            )}
          </Section>
        </TouchableOpacity>
      )}

      {/* 시간 트렌드 */}
      {(trendAnalysis.recent.count >= 3 || trendAnalysis.older.count >= 3) && (
        <Section title="📈 취향 변화">
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: C.chip, padding: 10, borderRadius: 8 }}>
              <Text style={{ color: C.sub, fontSize: 11 }}>최근 3개월</Text>
              <Text style={{ color: C.text, fontWeight: "700" }}>{trendAnalysis.recent.count}작</Text>
              <Text style={{ color: C.sub, fontSize: 11 }}>평균 {trendAnalysis.recent.avgRating.toFixed(0)}점</Text>
              <Text style={{ color: C.primary, fontSize: 11, marginTop: 4 }}>
                {trendAnalysis.recent.topGenres.join(", ") || "-"}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.chip, padding: 10, borderRadius: 8 }}>
              <Text style={{ color: C.sub, fontSize: 11 }}>이전 기간</Text>
              <Text style={{ color: C.text, fontWeight: "700" }}>{trendAnalysis.older.count}작</Text>
              <Text style={{ color: C.sub, fontSize: 11 }}>평균 {trendAnalysis.older.avgRating.toFixed(0)}점</Text>
              <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                {trendAnalysis.older.topGenres.join(", ") || "-"}
              </Text>
            </View>
          </View>
          {insights.trendNote && (
            <View style={{ backgroundColor: C.primary + "15", padding: 10, borderRadius: 8, marginTop: 8 }}>
              <Text style={{ color: C.text, fontSize: 12 }}>💡 {insights.trendNote}</Text>
            </View>
          )}
        </Section>
      )}

      {/* 숨겨진 패턴 */}
      {insights.hiddenPatterns.length > 0 && (
        <Section title="🔍 숨겨진 패턴">
          {insights.hiddenPatterns.map((pattern, i) => (
            <View key={i} style={{ 
              flexDirection: "row", 
              alignItems: "flex-start",
              paddingVertical: 6,
            }}>
              <Text style={{ color: C.primary, marginRight: 8 }}>•</Text>
              <Text style={{ color: C.text, flex: 1, fontSize: 13 }}>{pattern}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* 🎯 v3.1.2 스펙트럼 분석 UI */}
      {spectrumAnalysis && Object.keys(spectrumAnalysis).length > 0 && (
        <TouchableOpacity onPress={() => toggleSection("spectrum")}>
          <Section title={`📊 취향 스펙트럼 ${isExpanded("spectrum") ? "▼" : "▶"}`}>
            <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
              태그의 연속적 성향을 분석하여 취향 위치를 파악합니다
            </Text>
            
            {Object.entries(spectrumAnalysis).map(([spectrumId, data]) => {
              // 스펙트럼 시각화
              const position = data.avgPosition; // 0~1 범위
              const positionPercent = Math.round(position * 100);
              const tags = data.tags || [];
              const leftTag = tags[0] || "";
              const rightTag = tags[tags.length - 1] || "";
              
              // 색상 (왼쪽: 파랑, 중간: 회색, 오른쪽: 주황)
              const posColor = position < 0.35 ? "#3b82f6" 
                             : position > 0.65 ? "#f59e0b" 
                             : "#6b7280";
              
              return (
                <View key={spectrumId} style={{ 
                  marginBottom: isExpanded("spectrum") ? 16 : 10,
                  padding: 12,
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  borderRadius: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: posColor,
                }}>
                  {/* 스펙트럼 이름 + 선호 성향 */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: C.text, fontWeight: "700", fontSize: 14 }}>
                      {data.name}
                    </Text>
                    <View style={{ 
                      backgroundColor: posColor + "20", 
                      paddingHorizontal: 8, 
                      paddingVertical: 3, 
                      borderRadius: 10 
                    }}>
                      <Text style={{ color: posColor, fontSize: 11, fontWeight: "700" }}>
                        {data.preferenceLabel}
                      </Text>
                    </View>
                  </View>
                  
                  {/* 스펙트럼 막대 */}
                  <View style={{ marginBottom: 6 }}>
                    {/* 양쪽 라벨 */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: "#3b82f6", fontSize: 11, fontWeight: "600" }}>{leftTag}</Text>
                      <Text style={{ color: "#f59e0b", fontSize: 11, fontWeight: "600" }}>{rightTag}</Text>
                    </View>
                    
                    {/* 막대 */}
                    <View style={{ 
                      height: 8, 
                      backgroundColor: isDark ? "#374151" : "#e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden",
                      position: "relative",
                    }}>
                      {/* 그라데이션 효과 (좌→우) */}
                      <View style={{ 
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "100%",
                        flexDirection: "row",
                      }}>
                        <View style={{ flex: 1, backgroundColor: "#3b82f620" }} />
                        <View style={{ flex: 1, backgroundColor: "#6b728020" }} />
                        <View style={{ flex: 1, backgroundColor: "#f59e0b20" }} />
                      </View>
                      
                      {/* 현재 위치 마커 */}
                      <View style={{
                        position: "absolute",
                        left: `${positionPercent}%`,
                        top: -2,
                        bottom: -2,
                        width: 12,
                        marginLeft: -6,
                        backgroundColor: posColor,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: "#fff",
                      }} />
                    </View>
                  </View>
                  
                  {/* 상세 정보 (확장 시) */}
                  {isExpanded("spectrum") && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>
                        {data.novelCount}개 작품 분석 · 고평점 작품 성향: {
                          data.highRatedAvgPosition < 0.35 ? leftTag 
                          : data.highRatedAvgPosition > 0.65 ? rightTag 
                          : "중간"
                        }
                      </Text>
                      
                      {/* 구간별 분포 */}
                      <View style={{ flexDirection: "row", marginTop: 4 }}>
                        {(data.segments || []).map((seg, i) => (
                          <View key={i} style={{ 
                            flex: 1, 
                            alignItems: "center",
                            paddingVertical: 4,
                            backgroundColor: seg.novels?.length > 0 
                              ? (seg.avgRating >= 1700 ? "#22c55e20" : seg.avgRating >= 1550 ? "#3b82f620" : "#f59e0b20")
                              : "transparent",
                            borderRadius: 4,
                            marginHorizontal: 1,
                          }}>
                            <Text style={{ 
                              color: seg.novels?.length > 0 ? C.text : C.sub, 
                              fontSize: 10, 
                              fontWeight: seg.novels?.length > 0 ? "700" : "400" 
                            }}>
                              {seg.novels?.length || 0}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <Text style={{ color: C.sub, fontSize: 9, marginTop: 2, textAlign: "center" }}>
                        구간별 작품 수
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Section>
        </TouchableOpacity>
      )}

      {/* 🎯 v3.1.2 상반 태그 관계 분석 */}
      {oppositeTagAnalysis && oppositeTagAnalysis.length > 0 && (
        <Section title="⚡ 상반 태그 선호 분석">
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
            반대 의미의 태그 그룹 간 선호도 비교
          </Text>
          
          {oppositeTagAnalysis.map((pair, idx) => {
            const preferA = pair.preference === "A";
            const preferB = pair.preference === "B";
            const neutral = pair.preference === "neutral";
            
            // 선호 측 색상
            const colorA = preferA ? "#22c55e" : "#6b7280";
            const colorB = preferB ? "#22c55e" : "#6b7280";
            
            return (
              <View key={idx} style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                borderRadius: 12,
              }}>
                {/* VS 헤더 */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: colorA, 
                      fontWeight: "700", 
                      fontSize: 14,
                      textAlign: "center",
                    }}>
                      {pair.groupA.name}
                      {preferA && " ★"}
                    </Text>
                  </View>
                  <View style={{ 
                    backgroundColor: "#f59e0b20", 
                    paddingHorizontal: 10, 
                    paddingVertical: 4, 
                    borderRadius: 12 
                  }}>
                    <Text style={{ color: "#f59e0b", fontWeight: "800", fontSize: 12 }}>VS</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: colorB, 
                      fontWeight: "700", 
                      fontSize: 14,
                      textAlign: "center",
                    }}>
                      {preferB && "★ "}
                      {pair.groupB.name}
                    </Text>
                  </View>
                </View>
                
                {/* 비교 막대 */}
                <View style={{ flexDirection: "row", height: 24, borderRadius: 12, overflow: "hidden" }}>
                  <View style={{ 
                    flex: pair.groupA.stats.avgRating - 1400, 
                    backgroundColor: colorA,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                      {pair.groupA.stats.avgRating.toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ 
                    flex: pair.groupB.stats.avgRating - 1400, 
                    backgroundColor: colorB,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                      {pair.groupB.stats.avgRating.toFixed(0)}
                    </Text>
                  </View>
                </View>
                
                {/* 상세 통계 */}
                <View style={{ flexDirection: "row", marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.sub, fontSize: 10, textAlign: "center" }}>
                      {pair.groupA.stats.count}작 · 완독 {(pair.groupA.stats.completedRate * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.sub, fontSize: 10, textAlign: "center" }}>
                      {pair.groupB.stats.count}작 · 완독 {(pair.groupB.stats.completedRate * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
                
                {/* 결론 */}
                <View style={{ 
                  marginTop: 8, 
                  padding: 8, 
                  backgroundColor: neutral ? "#f59e0b15" : "#22c55e15", 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: C.text, fontSize: 12, textAlign: "center" }}>
                    {neutral 
                      ? "🤔 비슷한 선호도 (차이 50점 이내)"
                      : `✅ ${preferA ? pair.groupA.name : pair.groupB.name} 선호 (${pair.ratingDiff.toFixed(0)}점 차이)`
                    }
                  </Text>
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* 기피 요소 */}
      {insights.avoidFactors.length > 0 && (
        <Section title="⚠️ 기피 요소">
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
            드롭률 또는 평점이 낮은 요소
          </Text>
          {insights.avoidFactors.map((factor, i) => (
            <View key={i} style={{ 
              flexDirection: "row", 
              alignItems: "center",
              paddingVertical: 4,
            }}>
              <Text style={{ color: C.warn, marginRight: 8 }}>✕</Text>
              <Text style={{ color: C.text, fontSize: 13 }}>{factor}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* 추천 조건 */}
      <Section title="🎯 나에게 맞는 작품 조건">
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: C.ok, fontWeight: "700", marginBottom: 4 }}>✓ 필수 조건</Text>
          <Text style={{ color: C.text, fontSize: 13 }}>
            {insights.recommendConditions.mustHave.join(" 또는 ") || "특별한 조건 없음"}
          </Text>
        </View>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: C.primary, fontWeight: "700", marginBottom: 4 }}>★ 선호 조건</Text>
          <Text style={{ color: C.text, fontSize: 13 }}>
            {insights.recommendConditions.preferred.join(", ") || "특별한 조건 없음"}
          </Text>
        </View>
        {insights.recommendConditions.avoid.length > 0 && (
          <View>
            <Text style={{ color: C.warn, fontWeight: "700", marginBottom: 4 }}>✕ 피할 조건</Text>
            <Text style={{ color: C.text, fontSize: 13 }}>
              {insights.recommendConditions.avoid.join(", ")}
            </Text>
          </View>
        )}
      </Section>

      {/* 이상치 */}
      <TouchableOpacity onPress={() => toggleSection("anomalies")}>
        <Section title={`🔬 데이터 품질 점검 ${isExpanded("anomalies") ? "▼" : "▶"}`}>
          <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
            분석 정확도에 영향을 줄 수 있는 데이터
          </Text>
          
          {isExpanded("anomalies") && (
            <>
              {anomalies.highRatingLowRead.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: C.warn, fontWeight: "700", marginBottom: 4 }}>
                    높은 레이팅 but 거의 안 읽음 ({anomalies.highRatingLowRead.length}개)
                  </Text>
                  {anomalies.highRatingLowRead.slice(0, 3).map((n, i) => (
                    <Text key={i} style={{ color: C.sub, fontSize: 12 }}>
                      • {n.title} ({n.rating.toFixed(0)}점, {((n.readRatio || 0) * 100).toFixed(0)}% 읽음)
                    </Text>
                  ))}
                </View>
              )}
              
              {anomalies.lowRatingHighRead.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: C.primary, fontWeight: "700", marginBottom: 4 }}>
                    낮은 레이팅 but 많이 읽음 ({anomalies.lowRatingHighRead.length}개)
                  </Text>
                  {anomalies.lowRatingHighRead.slice(0, 3).map((n, i) => (
                    <Text key={i} style={{ color: C.sub, fontSize: 12 }}>
                      • {n.title} ({n.rating.toFixed(0)}점, {((n.readRatio || 0) * 100).toFixed(0)}% 읽음)
                    </Text>
                  ))}
                </View>
              )}
              
              {anomalies.noMatchHighRating.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: C.sub, fontWeight: "700", marginBottom: 4 }}>
                    매칭 부족한 고레이팅 ({anomalies.noMatchHighRating.length}개)
                  </Text>
                  {anomalies.noMatchHighRating.slice(0, 3).map((n, i) => (
                    <Text key={i} style={{ color: C.sub, fontSize: 12 }}>
                      • {n.title} ({n.rating.toFixed(0)}점, {n.matchCount}회 매칭)
                    </Text>
                  ))}
                </View>
              )}
              
              {/* 🆕 v3.4: 다회독 but 저평가 */}
              {anomalies.rereadButLowRating && anomalies.rereadButLowRating.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: "#8b5cf6", fontWeight: "700", marginBottom: 4 }}>
                    💎 숨겨진 명작 후보 ({anomalies.rereadButLowRating.length}개)
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>
                    다회독했지만 레이팅이 낮음 - 레이팅 조정 검토 필요
                  </Text>
                  {anomalies.rereadButLowRating.slice(0, 3).map((n, i) => (
                    <Text key={i} style={{ color: C.sub, fontSize: 12 }}>
                      • {n.title} ({n.rating.toFixed(0)}점, {n.rereadCount}회독)
                    </Text>
                  ))}
                </View>
              )}
              
              {/* 🆕 v3.4: 정보 불완전 */}
              {anomalies.lowInfoQuality && anomalies.lowInfoQuality.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: "#f59e0b", fontWeight: "700", marginBottom: 4 }}>
                    ⚠️ 정보 보완 필요 ({anomalies.lowInfoQuality.length}개)
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>
                    높은 레이팅이지만 신뢰도가 낮음 - 매칭/읽기 정보 추가 필요
                  </Text>
                  {anomalies.lowInfoQuality.slice(0, 3).map((n, i) => (
                    <Text key={i} style={{ color: C.sub, fontSize: 12 }}>
                      • {n.title} ({n.rating.toFixed(0)}점, 신뢰도 {Math.round(n.reliability)}%)
                    </Text>
                  ))}
                </View>
              )}
              
              {anomalies.highRatingLowRead.length === 0 && 
               anomalies.lowRatingHighRead.length === 0 && 
               anomalies.noMatchHighRating.length === 0 &&
               (!anomalies.rereadButLowRating || anomalies.rereadButLowRating.length === 0) &&
               (!anomalies.lowInfoQuality || anomalies.lowInfoQuality.length === 0) && (
                <Text style={{ color: C.ok }}>✓ 이상치가 발견되지 않았습니다.</Text>
              )}
            </>
          )}
          
          {!isExpanded("anomalies") && (
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {(anomalies.highRatingLowRead?.length || 0) + 
               (anomalies.lowRatingHighRead?.length || 0) + 
               (anomalies.noMatchHighRating?.length || 0) +
               (anomalies.rereadButLowRating?.length || 0) +
               (anomalies.lowInfoQuality?.length || 0)}개 항목 발견 (터치해서 상세 보기)
            </Text>
          )}
        </Section>
      </TouchableOpacity>

      {/* 🔮 v3.0.3: 이변(Upset) 분석 */}
      {upsetAnalysis && upsetAnalysis.total > 0 && (
        <TouchableOpacity onPress={() => toggleSection("upsets")}>
          <Section title={`🔮 이변 분석 ${isExpanded("upsets") ? "▼" : "▶"}`}>
            <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
              예측과 다른 결과 분석 (승부예측 데이터 기반)
            </Text>
            
            {/* 요약 통계 */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: C.text, fontSize: 20, fontWeight: "800" }}>{upsetAnalysis.total}</Text>
                <Text style={{ color: C.sub, fontSize: 11 }}>분석된 매치</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: C.warn, fontSize: 20, fontWeight: "800" }}>{upsetAnalysis.upsetCount}</Text>
                <Text style={{ color: C.sub, fontSize: 11 }}>이변 발생</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: C.ok, fontSize: 20, fontWeight: "800" }}>{upsetAnalysis.predictionAccuracy}%</Text>
                <Text style={{ color: C.sub, fontSize: 11 }}>예측 정확도</Text>
              </View>
            </View>
            
            {isExpanded("upsets") && (
              <>
                {/* 이변률 */}
                <View style={{ marginBottom: 12, padding: 10, backgroundColor: isDark ? "#1f2937" : "#f3f4f6", borderRadius: 8 }}>
                  <Text style={{ color: C.text, fontWeight: "700", marginBottom: 4 }}>📊 이변률: {upsetAnalysis.upsetRate}%</Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>
                    {Number(upsetAnalysis.upsetRate) < 20 
                      ? "취향이 비교적 일관적입니다 - 예측이 잘 맞습니다" 
                      : Number(upsetAnalysis.upsetRate) < 35 
                        ? "적당한 수준의 이변 - 다양한 취향을 가지고 있습니다"
                        : "이변이 많습니다 - 작품 선호가 복잡하거나 데이터가 부족할 수 있습니다"}
                  </Text>
                </View>
                
                {/* 이변을 잘 일으키는 작품 */}
                {upsetAnalysis.topUpsetCausers.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: C.primary, fontWeight: "700", marginBottom: 4 }}>
                      ⬆️ 다크호스 작품 (기대 이상 승리)
                    </Text>
                    {upsetAnalysis.topUpsetCausers.map((item, i) => (
                      <Text key={item.id} style={{ color: C.sub, fontSize: 12, marginBottom: 2 }}>
                        • {item.title} ({item.count}회 이변 승리)
                      </Text>
                    ))}
                    <Text style={{ color: C.sub, fontSize: 11, fontStyle: "italic", marginTop: 4 }}>
                      → 숨겨진 취향 또는 과소평가된 작품일 수 있습니다
                    </Text>
                  </View>
                )}
                
                {/* 이변을 잘 당하는 작품 */}
                {upsetAnalysis.topUpsetVictims.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: C.warn, fontWeight: "700", marginBottom: 4 }}>
                      ⬇️ 기대 미달 작품 (예상 외 패배)
                    </Text>
                    {upsetAnalysis.topUpsetVictims.map((item, i) => (
                      <Text key={item.id} style={{ color: C.sub, fontSize: 12, marginBottom: 2 }}>
                        • {item.title} ({item.count}회 이변 패배)
                      </Text>
                    ))}
                    <Text style={{ color: C.sub, fontSize: 11, fontStyle: "italic", marginTop: 4 }}>
                      → 레이팅 대비 실제 선호도가 낮을 수 있습니다
                    </Text>
                  </View>
                )}
                
                {/* 레이팅 격차별 이변 분포 */}
                <View>
                  <Text style={{ color: C.text, fontWeight: "700", marginBottom: 4 }}>📈 격차별 이변 분포</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ color: C.ok, fontWeight: "700" }}>{upsetAnalysis.gapDistribution.small}</Text>
                      <Text style={{ color: C.sub, fontSize: 10 }}>소격차(&lt;100)</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ color: C.primary, fontWeight: "700" }}>{upsetAnalysis.gapDistribution.medium}</Text>
                      <Text style={{ color: C.sub, fontSize: 10 }}>중격차(100-250)</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ color: C.warn, fontWeight: "700" }}>{upsetAnalysis.gapDistribution.large}</Text>
                      <Text style={{ color: C.sub, fontSize: 10 }}>대격차(&gt;250)</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            {!isExpanded("upsets") && (
              <Text style={{ color: C.sub, fontSize: 12 }}>
                이변률 {upsetAnalysis.upsetRate}% · 예측 정확도 {upsetAnalysis.predictionAccuracy}% (터치해서 상세 보기)
              </Text>
            )}
          </Section>
        </TouchableOpacity>
      )}
      
      {/* 🔮 v3.0.3: 이변 요인 분석 (누적 학습 데이터) */}
      {factorAnalysis && factorAnalysis.total > 0 && (
        <TouchableOpacity 
          onPress={() => toggleSection("factors")}
          activeOpacity={0.7}
        >
          <Section title={`🎯 이변 요인 분석 ${isExpanded("factors") ? "▼" : "▶"}`}>
            {isExpanded("factors") ? (
              <>
                {/* 요약 통계 */}
                <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: C.text, fontSize: 20, fontWeight: "800" }}>{factorAnalysis.total}</Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>발견된 요인</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: C.ok, fontSize: 20, fontWeight: "800" }}>{factorAnalysis.topPositive.length}</Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>긍정 요인</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: C.warn, fontSize: 20, fontWeight: "800" }}>{factorAnalysis.topNegative.length}</Text>
                    <Text style={{ color: C.sub, fontSize: 11 }}>부정 요인</Text>
                  </View>
                </View>
                
                {/* 긍정 요인 (선호) */}
                {factorAnalysis.topPositive.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: C.ok, fontWeight: "700", marginBottom: 8 }}>👍 선호 요인 (이변 승리 시 자주 등장)</Text>
                    <View style={{ backgroundColor: isDark ? "#064e3b" : "#dcfce7", borderRadius: 10, padding: 10 }}>
                      {factorAnalysis.topPositive.slice(0, 5).map((f, i) => {
                        const label = f.key.startsWith("[SIM:") 
                          ? `${f.key.slice(5, -1)} 계열` 
                          : f.key;
                        const typeLabel = {
                          tag_only_winner: "🏷️",
                          genre_preference: "📚",
                          platform_preference: "📱",
                          author_preference: "✍️",
                          read_engagement: "📖",
                        }[f.type] || "•";
                        return (
                          <View key={f.id || i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            <Text style={{ color: C.ok, width: 20 }}>{typeLabel}</Text>
                            <Text style={{ color: C.text, flex: 1, fontWeight: "600" }}>{label}</Text>
                            <Text style={{ color: C.ok, fontWeight: "700" }}>{f.occurrences}회</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                
                {/* 부정 요인 (기피) */}
                {factorAnalysis.topNegative.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: C.warn, fontWeight: "700", marginBottom: 8 }}>👎 기피 요인 (이변 패배 시 자주 등장)</Text>
                    <View style={{ backgroundColor: isDark ? "#7f1d1d" : "#fee2e2", borderRadius: 10, padding: 10 }}>
                      {factorAnalysis.topNegative.slice(0, 5).map((f, i) => {
                        const label = f.key.startsWith("[SIM:") 
                          ? `${f.key.slice(5, -1)} 계열` 
                          : f.key;
                        const typeLabel = {
                          tag_only_loser: "🏷️",
                          genre_aversion: "📚",
                        }[f.type] || "•";
                        return (
                          <View key={f.id || i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            <Text style={{ color: C.warn, width: 20 }}>{typeLabel}</Text>
                            <Text style={{ color: C.text, flex: 1, fontWeight: "600" }}>{label}</Text>
                            <Text style={{ color: C.warn, fontWeight: "700" }}>{f.occurrences}회</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                
                {/* 그룹화된 요인 (유사 태그) */}
                {factorAnalysis.groupedFactors.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: C.primary, fontWeight: "700", marginBottom: 8 }}>🔗 유사 태그 그룹 요인</Text>
                    <View style={{ backgroundColor: isDark ? "#1e3a5f" : "#dbeafe", borderRadius: 10, padding: 10 }}>
                      {factorAnalysis.groupedFactors.slice(0, 3).map((g, i) => (
                        <View key={i} style={{ marginBottom: 6 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                            <Text style={{ color: C.primary, fontWeight: "700", flex: 1 }}>
                              {g.key.slice(5, -1)} 계열
                            </Text>
                            <Text style={{ color: C.text }}>{g.totalOccurrences}회 ({g.direction === "positive" ? "👍" : "👎"})</Text>
                          </View>
                          <Text style={{ color: C.sub, fontSize: 11 }}>
                            포함 태그: {Array.from(g.originalTags).slice(0, 5).join(", ")}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>
                      💡 유사 태그를 그룹으로 묶으면 더 정확한 패턴을 찾을 수 있습니다.
                    </Text>
                  </View>
                )}
                
                {/* 마지막 업데이트 */}
                {factorAnalysis.lastUpdated > 0 && (
                  <Text style={{ color: C.sub, fontSize: 10, textAlign: "right" }}>
                    마지막 업데이트: {new Date(factorAnalysis.lastUpdated).toLocaleString()}
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ color: C.sub, fontSize: 12 }}>
                {factorAnalysis.total}개 요인 발견 · 긍정 {factorAnalysis.topPositive.length} / 부정 {factorAnalysis.topNegative.length} (터치해서 상세 보기)
              </Text>
            )}
          </Section>
        </TouchableOpacity>
      )}
    </>
  );
});

export default TasteAnalysisScreen;
