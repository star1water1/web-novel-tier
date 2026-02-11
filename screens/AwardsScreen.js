/**
 * 수상 관리 스크린
 * @module screens/AwardsScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @bugfix v6.1.4
 * - [FIX] getWinRate, parsePlatforms import 누락 → 수상 후보 카드에서 ReferenceError 크래시
 *
 * @bugfix v6.1.2
 * - [FIX] Section, getTierColor import 누락 → 수상 화면 전체 ReferenceError 크래시 수정
 *
 * @description
 * 연도별 수상 시스템을 관리하는 스크린 컴포넌트
 * Context: useApp(theme), useData(list, giveAward, removeAward, awardSystemSettings, saveAwardSettings)
 * 로컬 상태: awardSelectedYear, awardSubTab, awardFilter, settingsModalOpen 등
 */

import React, { memo, useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from "react-native";

// Constants
import { getAwardYears, AWARD_META, parseAwards, DEFAULT_AWARD_TEMPLATE, WORK_STATUS_MAP } from "../constants/config";

// Utils
import { tierFromRating, deriveMajorGenre, getWinRate, parsePlatforms } from "../utils/helpers";

// UI Components
import { Section, getTierColor } from "../components/common/ui";

// Database
import { getAppMeta, setAppMeta } from "../database";
import { updateNovelAwards } from "../handlers/novelHandlers";

// Context
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";

// ═══════════════════════════════════════════════════════════════
// 📌 AwardsScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const AwardsScreen = memo(() => {
  const { theme } = useApp();
  const { list, loadList } = useData();
  const C = theme;

  // ── 로컬 상태 ──
  const [awardSelectedYear, setAwardSelectedYear] = useState(new Date().getFullYear());
  const [awardSubTab, setAwardSubTab] = useState("settings");
  const [awardFilter, setAwardFilter] = useState({
    excludeDropped: true, excludeDiscontinued: true,
  });
  const [awardSystemSettings, setAwardSystemSettings] = useState({ yearlyAwards: {} });

  // ── 수상 설정 로드 ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await getAppMeta("awardSystemSettings");
        if (saved) setAwardSystemSettings(typeof saved === "string" ? JSON.parse(saved) : saved);
      } catch (e) { console.warn("수상 설정 로드 실패:", e); }
    })();
  }, []);

  // ── 수상 설정 저장 ──
  const onSaveSettings = useCallback(async (updated) => {
    setAwardSystemSettings(updated);
    try { await setAppMeta("awardSystemSettings", JSON.stringify(updated)); }
    catch (e) { console.warn("수상 설정 저장 실패:", e); }
  }, []);

  // ── 수상 지급 ──
  const onGiveAward = useCallback(async (novelId, awardId, year) => {
    try {
      const novel = list.find(n => n.id === novelId);
      if (!novel) return;
      const current = novel.awards ? JSON.parse(novel.awards) : [];
      current.push({ type: awardId, year, timestamp: Date.now() });
      await updateNovelAwards(novelId, current);
      await loadList();
    } catch (e) { console.warn("수상 지급 실패:", e); }
  }, [list, loadList]);

  // ── 수상 회수 ──
  const onRemoveAward = useCallback(async (novelId, awardId, year) => {
    try {
      const novel = list.find(n => n.id === novelId);
      if (!novel) return;
      const current = novel.awards ? JSON.parse(novel.awards) : [];
      const idx = current.findIndex(a => a.type === awardId && a.year === year);
      if (idx >= 0) current.splice(idx, 1);
      await updateNovelAwards(novelId, current);
      await loadList();
    } catch (e) { console.warn("수상 회수 실패:", e); }
  }, [list, loadList]);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [newAwardName, setNewAwardName] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [editingAwardId, setEditingAwardId] = useState(null);
  
  // 🆕 v3.2.1: 후보작 목록 접힘 상태 (수상별)
  const [expandedCandidates, setExpandedCandidates] = useState({});
  
  // 연도 목록 (2024년부터 현재+1년까지)
  const years = useMemo(() => getAwardYears(), []);
  
  // 현재 연도 상 설정
  const currentYearAwards = useMemo(() => {
    return awardSystemSettings?.yearlyAwards?.[awardSelectedYear] || [];
  }, [awardSystemSettings, awardSelectedYear]);
  
  // 🆕 후보작 필터링 - 해당 연도 관련 작품만 (v3.0 개선)
  // 기준: 태그/메모에 연도가 명시되어 있거나, 완결작 중 해당 연도 힌트가 있는 경우
  // ※ 단순 등록일은 기준에서 제외 (앱 등록일 ≠ 연재시작일)
  const candidates = useMemo(() => {
    if (!list || list.length === 0) return [];
    const yearNum = Number(awardSelectedYear);
    const yearStr = String(awardSelectedYear);
    const shortYear = String(yearNum).slice(2); // "25" for 2025
    
    return list.filter(novel => {
      // 🆕 v3.2.1: 연중작/서비스종료작 제외 옵션
      if (awardFilter.excludeDropped && novel.work_status === "dropped") return false;
      if (awardFilter.excludeDiscontinued && novel.work_status === "discontinued") return false;
      
      // 1. 태그에 연도 포함 (예: "2025", "2025년", "25년", "2025완결")
      const tags = (novel.tags || "").toLowerCase();
      const hasYearInTags = tags.includes(yearStr) || 
                           tags.includes(`${yearStr}년`) ||
                           tags.includes(`${shortYear}년`) ||
                           tags.includes(`${yearStr}완결`) ||
                           tags.includes(`${shortYear}완결`);
      
      // 2. 메모에 연도 포함
      const note = (novel.note || "").toLowerCase();
      const hasYearInNote = note.includes(yearStr) || 
                           note.includes(`${yearStr}년`) ||
                           note.includes(`${shortYear}년`);
      
      // 3. 완결작이면서 연도 힌트가 있는 경우
      const isCompleteWithYearHint = novel.work_status === "completed" && (hasYearInTags || hasYearInNote);
      
      // 최소 하나의 명시적 기준 충족 필요
      return hasYearInTags || hasYearInNote || isCompleteWithYearHint;
    });
  }, [list, awardSelectedYear, awardFilter.excludeDropped, awardFilter.excludeDiscontinued]);
  
  // 필터 적용된 후보작
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];
    
    // 상 종류 필터
    if (awardFilter.awardId && awardFilter.awardId !== "all") {
      const award = currentYearAwards.find(a => a.id === awardFilter.awardId);
      if (award) {
        // 태그 필터 (태그무관이 아닌 경우만)
        if (award.matchTags && award.matchTags.length > 0 && !award.matchTags.includes("__ANY__")) {
          result = result.filter(novel => {
            const novelTags = (novel.tags || "").toLowerCase();
            const majorGenre = (novel.major_genre || "").toLowerCase();
            const subGenre = (novel.sub_genre || "").toLowerCase();
            const allTags = [novelTags, majorGenre, subGenre].join(" ");
            
            return award.matchTags.some(tag => {
              if (tag === "__ANY__") return true; // 태그무관
              return allTags.includes(tag.toLowerCase());
            });
          });
        }
        
        // 티어 최소 조건 (상 설정의 tierMin)
        if (award.tierMin) {
          const tierOrder = ["S", "A", "B+", "B", "B-", "C"];
          const minIndex = tierOrder.indexOf(award.tierMin);
          if (minIndex !== -1) {
            result = result.filter(novel => {
              const novelTier = novel.manual_tier || tierFromRating(novel.rating);
              const novelIndex = tierOrder.indexOf(novelTier);
              return novelIndex <= minIndex;
            });
          }
        }
      }
    }
    
    // 전역 티어 필터
    if (awardFilter.tierMin) {
      const tierOrder = ["S", "A", "B+", "B", "B-", "C"];
      const minIndex = tierOrder.indexOf(awardFilter.tierMin);
      if (minIndex !== -1) {
        result = result.filter(novel => {
          const novelTier = novel.manual_tier || tierFromRating(novel.rating);
          const novelIndex = tierOrder.indexOf(novelTier);
          return novelIndex <= minIndex;
        });
      }
    }
    
    // 레이팅 순 정렬
    result.sort((a, b) => b.rating - a.rating);
    
    return result;
  }, [candidates, awardFilter, currentYearAwards]);
  
  // 해당 연도 수상작 수집
  const awardWinners = useMemo(() => {
    const winners = {};
    
    for (const novel of list) {
      const awards = parseAwards(novel.awards, awardSystemSettings);
      for (const award of awards) {
        if (award.year === Number(awardSelectedYear)) {
          if (!winners[award.type]) winners[award.type] = [];
          winners[award.type].push({ ...novel, awardType: award.type });
        }
      }
    }
    
    // 각 상별로 레이팅 순 정렬
    for (const key in winners) {
      winners[key].sort((a, b) => b.rating - a.rating);
    }
    
    return winners;
  }, [list, awardSelectedYear, awardSystemSettings]);
  
  // 수상 여부 확인
  const getNovelAwardsForYear = useCallback((novel) => {
    const awards = parseAwards(novel.awards, awardSystemSettings);
    return awards.filter(a => a.year === Number(awardSelectedYear));
  }, [awardSelectedYear, awardSystemSettings]);
  
  // 미수상 후보작 (수상 결과 탭용)
  const nonWinnerCandidates = useMemo(() => {
    const winnerIds = new Set(Object.values(awardWinners).flat().map(n => n.id));
    return candidates.filter(n => !winnerIds.has(n.id)).sort((a, b) => b.rating - a.rating);
  }, [candidates, awardWinners]);
  
  // 🆕 v3.2.2: 수상 확률 계산 (개선된 알고리즘)
  // - 모든 후보작에 동일한 보정 로직 적용
  // - 소프트맥스를 사용한 확률 분포
  // - 재독 횟수, 신뢰도, 완결 상태 등 다양한 요소 반영
  const calculateWinProbability = useCallback((novel, award, candidatesForAward) => {
    if (!candidatesForAward || candidatesForAward.length === 0) return 0;
    if (candidatesForAward.length === 1) return 100;
    
    const tierOrder = ["S", "A", "B+", "B", "B-", "C"];
    const totalNovelCount = list.length;
    
    // 개별 작품 점수 계산 함수
    const calculateNovelScore = (n) => {
      let score = 0;
      
      // 1. 기본 레이팅 (정규화: 1500 기준으로 차이를 점수화)
      score += (n.rating - 1400) * 0.5;  // 레이팅 1500이면 50점, 1800이면 200점
      
      // 2. 티어 보정 (S:100, A:80, B+:60, B:40, B-:20, C:0)
      const tier = n.manual_tier || tierFromRating(n.rating);
      const tierIndex = tierOrder.indexOf(tier);
      score += (5 - tierIndex) * 20;
      
      // 3. 태그 매칭 보정 (상의 matchTags와 얼마나 일치하는지)
      if (award.matchTags && award.matchTags.length > 0 && !award.matchTags.includes("__ANY__")) {
        const novelTags = [
          ...(n.tags || "").split(",").map(t => t.trim().toLowerCase()),
          (n.major_genre || "").toLowerCase(),
          (n.sub_genre || "").toLowerCase(),
        ].filter(Boolean);
        
        const matchCount = award.matchTags.filter(tag => 
          novelTags.some(nt => nt.includes(tag.toLowerCase()))
        ).length;
        
        // 매칭 비율에 따른 가산점 (최대 50점)
        const matchRatio = matchCount / award.matchTags.length;
        score += matchRatio * 50;
      }
      
      // 4. 완결 상태 보정
      if (n.work_status === "completed") {
        score += 25;  // 완결작 가산
      } else if (n.work_status === "ongoing") {
        score += 10;  // 연재중 약간의 가산
      } else if (n.work_status === "dropped" || n.work_status === "discontinued") {
        score -= 30;  // 연중/서비스종료 감점
      }
      
      // 5. 재독 횟수 보정 (많이 읽은 작품은 그만큼 좋다는 신호)
      const rereadCount = Number(n.reread_count) || 1;
      if (rereadCount > 1) {
        score += Math.min(30, (rereadCount - 1) * 10);  // 최대 30점
      }
      
      // 6. 신뢰도 보정 (신뢰도가 높은 작품에 약간의 가산)
      if (totalNovelCount > 1) {
        const totalEpisodes = Number(n.total_episodes) || 0;
        const readCount = Number(n.read_count) || 0;
        const matchCount = Number(n.match_count) || 0;
        const maxMatchForNovel = Math.max(0, totalNovelCount - 1);
        
        if (totalEpisodes > 0 && maxMatchForNovel > 0) {
          const readRatio = Math.min(1, readCount / totalEpisodes);
          const matchRatio = Math.min(1, matchCount / maxMatchForNovel);
          const reliability = readRatio * matchRatio;
          score += reliability * 15;  // 최대 15점
        }
      }
      
      // 7. 승률 반영 (매칭에서 이긴 비율)
      const totalMatches = (n.wins || 0) + (n.losses || 0);
      if (totalMatches >= 5) {  // 최소 5경기 이상
        const winRate = n.wins / totalMatches;
        score += (winRate - 0.5) * 20;  // 승률 50%면 0점, 80%면 +6점, 20%면 -6점
      }
      
      return Math.max(0, score);  // 최소 0점
    };
    
    // 모든 후보작의 점수 계산
    const allScores = candidatesForAward.map(n => ({
      id: n.id,
      score: calculateNovelScore(n),
    }));
    
    // 소프트맥스로 확률 계산 (온도 파라미터로 분포 조절)
    const temperature = 50;  // 높을수록 확률이 균등해짐
    const maxScore = Math.max(...allScores.map(s => s.score));
    const expScores = allScores.map(s => ({
      id: s.id,
      exp: Math.exp((s.score - maxScore) / temperature),  // 오버플로우 방지
    }));
    
    const sumExp = expScores.reduce((sum, s) => sum + s.exp, 0);
    
    // 해당 작품의 확률 찾기
    const novelExpScore = expScores.find(s => s.id === novel.id);
    if (!novelExpScore || sumExp === 0) return 0;
    
    const probability = (novelExpScore.exp / sumExp) * 100;
    
    // 범위 제한 (1% ~ 99%)
    return Math.min(99, Math.max(1, probability));
  }, [list.length]);
  
  // 🆕 v3.2.1: 상별 후보작 목록 계산
  const getCandidatesForAward = useCallback((award) => {
    let result = [...candidates];
    
    // 태그 필터
    if (award.matchTags && award.matchTags.length > 0 && !award.matchTags.includes("__ANY__")) {
      result = result.filter(novel => {
        const novelTags = (novel.tags || "").toLowerCase();
        const majorGenre = (novel.major_genre || "").toLowerCase();
        const subGenre = (novel.sub_genre || "").toLowerCase();
        const allTags = [novelTags, majorGenre, subGenre].join(" ");
        
        return award.matchTags.some(tag => {
          if (tag === "__ANY__") return true;
          return allTags.includes(tag.toLowerCase());
        });
      });
    }
    
    // 티어 최소 조건
    if (award.tierMin) {
      const tierOrder = ["S", "A", "B+", "B", "B-", "C"];
      const minIndex = tierOrder.indexOf(award.tierMin);
      if (minIndex !== -1) {
        result = result.filter(novel => {
          const novelTier = novel.manual_tier || tierFromRating(novel.rating);
          const novelIndex = tierOrder.indexOf(novelTier);
          return novelIndex <= minIndex;
        });
      }
    }
    
    // 이미 수상한 작품 제외
    const winnersForThisAward = awardWinners[award.id] || [];
    const winnerIds = new Set(winnersForThisAward.map(w => w.id));
    result = result.filter(n => !winnerIds.has(n.id));
    
    return result.sort((a, b) => b.rating - a.rating);
  }, [candidates, awardWinners]);
  
  // 상 추가
  const addNewAward = () => {
    if (!newAwardName.trim()) {
      Alert.alert("알림", "상 이름을 입력해주세요.");
      return;
    }
    
    const newId = `custom_${Date.now()}`;
    const newAward = {
      id: newId,
      name: newAwardName.trim(),
      count: 1,
      tierMin: null,
      matchTags: ["__ANY__"], // 기본값: 태그무관
      color: "#6366f1",
      icon: "🏅"
    };
    
    const updated = { ...awardSystemSettings };
    if (!updated.yearlyAwards) updated.yearlyAwards = {};
    if (!updated.yearlyAwards[awardSelectedYear]) {
      updated.yearlyAwards[awardSelectedYear] = [];
    }
    updated.yearlyAwards[awardSelectedYear].push(newAward);
    
    onSaveSettings(updated);
    setNewAwardName("");
    Alert.alert("완료", "새 상이 추가되었습니다.");
  };
  
  // 상 삭제
  const deleteAward = (awardId) => {
    Alert.alert("확인", "이 상을 삭제할까요?", [
      { text: "취소" },
      { text: "삭제", style: "destructive", onPress: () => {
        const updated = { ...awardSystemSettings };
        updated.yearlyAwards[awardSelectedYear] = 
          updated.yearlyAwards[awardSelectedYear].filter(a => a.id !== awardId);
        onSaveSettings(updated);
      }}
    ]);
  };
  
  // 상 설정 업데이트
  const updateAward = (awardId, updates) => {
    const updated = { ...awardSystemSettings };
    const idx = updated.yearlyAwards[awardSelectedYear]?.findIndex(a => a.id === awardId);
    if (idx !== -1) {
      updated.yearlyAwards[awardSelectedYear][idx] = {
        ...updated.yearlyAwards[awardSelectedYear][idx],
        ...updates
      };
      onSaveSettings(updated);
    }
  };
  
  // 아이콘 옵션
  const iconOptions = ["🏆", "🥇", "🥈", "🥉", "🏅", "⭐", "💎", "👑", "🌟", "❤️", "🔥", "⚡", "🎯", "📚", "✨"];
  
  // 색상 옵션
  const colorOptions = [
    "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#6366f1", 
    "#3b82f6", "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16",
    "#eab308", "#f59e0b", "#78716c", "#64748b", "#1e293b"
  ];

  return (
    <>
      <H>🏆 {awardSelectedYear}년 시상식</H>
      
      {/* 연도 선택 */}
      <Section title="📅 연도 선택">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {years.map(year => (
              <TouchableOpacity
                key={year}
                onPress={() => setAwardSelectedYear(year)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  backgroundColor: awardSelectedYear === year ? C.primary : C.chip,
                  borderWidth: awardSelectedYear === year ? 0 : 1,
                  borderColor: C.line,
                }}
              >
                <Text style={{ 
                  color: awardSelectedYear === year ? "#fff" : C.text, 
                  fontWeight: "800",
                  fontSize: 15,
                }}>
                  {year}년
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <Text style={{ color: C.sub, marginTop: 8, fontSize: 12 }}>
          후보작 {candidates.length}작 · 총 {Object.values(awardWinners).flat().length}건 수상
        </Text>
      </Section>
      
      {/* 서브탭: 수상 / 수상 결과 */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setAwardSubTab("candidates")}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: awardSubTab === "candidates" ? C.primary : C.chip,
            alignItems: "center",
            borderWidth: awardSubTab === "candidates" ? 0 : 1,
            borderColor: C.line,
          }}
        >
          <Text style={{ 
            color: awardSubTab === "candidates" ? "#fff" : C.text, 
            fontWeight: "800" 
          }}>
            🎯 수상 ({filteredCandidates.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setAwardSubTab("results")}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: awardSubTab === "results" ? "#f97316" : C.chip,
            alignItems: "center",
            borderWidth: awardSubTab === "results" ? 0 : 1,
            borderColor: C.line,
          }}
        >
          <Text style={{ 
            color: awardSubTab === "results" ? "#fff" : C.text, 
            fontWeight: "800" 
          }}>
            🏆 수상 결과
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSettingsModalOpen(true)}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 12,
            backgroundColor: C.chip,
            borderWidth: 1,
            borderColor: C.line,
          }}
        >
          <Text style={{ color: C.text, fontWeight: "700" }}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      {/* ===== 수상 탭 (후보작 관리) ===== */}
      {awardSubTab === "candidates" && (
        <>
          {/* 필터 */}
          <Section title="🔍 필터">
            <Text style={{ color: C.sub, marginBottom: 10, fontSize: 12 }}>
              상 종류를 선택하면 해당 상 조건에 맞는 작품만 표시됩니다.
            </Text>
            
            {/* 상 종류 필터 */}
            <Text style={{ color: C.text, fontWeight: "700", marginBottom: 6 }}>상 종류</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setAwardFilter({ ...awardFilter, awardId: "all" })}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: awardFilter.awardId === "all" ? C.primary : C.bg,
                    borderWidth: 1,
                    borderColor: awardFilter.awardId === "all" ? C.primary : C.line,
                  }}
                >
                  <Text style={{ 
                    color: awardFilter.awardId === "all" ? "#fff" : C.text,
                    fontWeight: "700",
                    fontSize: 13,
                  }}>
                    전체
                  </Text>
                </TouchableOpacity>
                {currentYearAwards.map(award => {
                  const winCount = (awardWinners[award.id] || []).length;
                  return (
                    <TouchableOpacity
                      key={award.id}
                      onPress={() => setAwardFilter({ ...awardFilter, awardId: award.id })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        backgroundColor: awardFilter.awardId === award.id ? award.color : C.bg,
                        borderWidth: 1,
                        borderColor: awardFilter.awardId === award.id ? award.color : C.line,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ marginRight: 4 }}>{award.icon}</Text>
                      <Text style={{ 
                        color: awardFilter.awardId === award.id ? "#fff" : C.text,
                        fontWeight: "700",
                        fontSize: 13,
                      }}>
                        {award.name}
                      </Text>
                      {winCount > 0 && (
                        <View style={{ 
                          backgroundColor: "rgba(255,255,255,0.3)", 
                          borderRadius: 999, 
                          marginLeft: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}>
                          <Text style={{ 
                            color: awardFilter.awardId === award.id ? "#fff" : C.sub, 
                            fontSize: 10, 
                            fontWeight: "700" 
                          }}>
                            {winCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            {/* 티어 필터 */}
            <Text style={{ color: C.text, fontWeight: "700", marginBottom: 6 }}>최소 티어</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                { value: null, label: "무관" },
                { value: "S", label: "S 이상" },
                { value: "A", label: "A 이상" },
                { value: "B+", label: "B+ 이상" },
                { value: "B", label: "B 이상" },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value || "null"}
                  onPress={() => setAwardFilter({ ...awardFilter, tierMin: opt.value })}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: awardFilter.tierMin === opt.value ? C.primary : C.bg,
                    borderWidth: 1,
                    borderColor: awardFilter.tierMin === opt.value ? C.primary : C.line,
                  }}
                >
                  <Text style={{ 
                    color: awardFilter.tierMin === opt.value ? "#fff" : C.text,
                    fontWeight: "600",
                    fontSize: 12,
                  }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 🆕 v3.2.1: 제외 옵션 */}
            <Text style={{ color: C.text, fontWeight: "700", marginTop: 12, marginBottom: 6 }}>제외 옵션</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setAwardFilter({ ...awardFilter, excludeDropped: !awardFilter.excludeDropped })}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 4,
                  borderWidth: 2,
                  borderColor: awardFilter.excludeDropped ? C.warn : C.line,
                  backgroundColor: awardFilter.excludeDropped ? C.warn : "transparent",
                  alignItems: "center", justifyContent: "center",
                  marginRight: 6,
                }}>
                  {awardFilter.excludeDropped && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>}
                </View>
                <Text style={{ color: C.text, fontSize: 12 }}>연중작 제외</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setAwardFilter({ ...awardFilter, excludeDiscontinued: !awardFilter.excludeDiscontinued })}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 4,
                  borderWidth: 2,
                  borderColor: awardFilter.excludeDiscontinued ? C.sub : C.line,
                  backgroundColor: awardFilter.excludeDiscontinued ? C.sub : "transparent",
                  alignItems: "center", justifyContent: "center",
                  marginRight: 6,
                }}>
                  {awardFilter.excludeDiscontinued && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>}
                </View>
                <Text style={{ color: C.text, fontSize: 12 }}>서비스종료 제외</Text>
              </TouchableOpacity>
            </View>
          </Section>
          
          {/* 후보작 목록 (🆕 v3.2.1: 표지, 확률 추가) */}
          <Section title={`📋 후보작 (${filteredCandidates.length})`}>
            {filteredCandidates.length === 0 ? (
              <View style={{ padding: 30, alignItems: "center" }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
                <Text style={{ color: C.sub, textAlign: "center", lineHeight: 20 }}>
                  {awardSelectedYear}년 후보작이 없습니다.{"\n\n"}
                  작품의 태그나 메모에 "{awardSelectedYear}" 또는 "{awardSelectedYear}년"을{"\n"}
                  추가하면 해당 연도 후보로 표시됩니다.
                </Text>
              </View>
            ) : (
              filteredCandidates.map((novel, idx) => {
                const novelAwards = getNovelAwardsForYear(novel);
                const tier = novel.manual_tier || tierFromRating(novel.rating);
                const tierColor = getTierColor(tier);
                const isWinner = novelAwards.length > 0;
                
                // 🆕 v3.2.1: 선택된 상의 수상 확률 계산
                const selectedAward = awardFilter.awardId !== "all" 
                  ? currentYearAwards.find(a => a.id === awardFilter.awardId)
                  : null;
                const candidatesForSelectedAward = selectedAward ? getCandidatesForAward(selectedAward) : [];
                const winProbability = selectedAward 
                  ? calculateWinProbability(novel, selectedAward, candidatesForSelectedAward)
                  : null;
                
                return (
                  <View
                    key={novel.id}
                    style={{
                      backgroundColor: C.card,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: isWinner ? 2 : 1,
                      borderColor: isWinner ? "#f97316" : C.line,
                      shadowColor: isWinner ? "#f97316" : "#000",
                      shadowOpacity: isWinner ? 0.15 : 0.05,
                      shadowRadius: isWinner ? 8 : 4,
                      elevation: isWinner ? 4 : 2,
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      {/* 🆕 v3.2.1: 표지 이미지 */}
                      {novel.cover_image ? (
                        <ExpoImage 
                          source={{ uri: novel.cover_image }}
                          style={{
                            width: 50,
                            height: 70,
                            borderRadius: 6,
                            marginRight: 12,
                            backgroundColor: C.bg,
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={{
                          width: 50,
                          height: 70,
                          borderRadius: 6,
                          marginRight: 12,
                          backgroundColor: C.bg,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: C.line,
                        }}>
                          <Text style={{ fontSize: 20 }}>📖</Text>
                        </View>
                      )}
                      
                      <View style={{ flex: 1 }}>
                        {/* 상단: 티어 + 제목 + 점수 */}
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                          <View style={{
                            backgroundColor: tierColor,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            marginRight: 8,
                          }}>
                            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{tier}</Text>
                          </View>
                          <Text style={{ fontWeight: "800", color: C.text, flex: 1, fontSize: 14 }} numberOfLines={1}>
                            {idx + 1}. {novel.title}
                          </Text>
                        </View>
                        
                        {/* 작가 + 점수 */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text style={{ color: C.sub, fontSize: 12 }} numberOfLines={1}>
                            {novel.author || "-"}
                          </Text>
                          <Text style={{ color: C.text, fontSize: 13, fontWeight: "700" }}>
                            {novel.rating.toFixed(0)}점
                          </Text>
                        </View>
                        
                        {/* 🆕 v3.2.1: 수상 확률 */}
                        {winProbability !== null && !isWinner && (
                          <View style={{ 
                            flexDirection: "row", 
                            alignItems: "center",
                            backgroundColor: winProbability >= 30 ? "#dcfce7" : winProbability >= 15 ? "#fef9c3" : C.bg,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            alignSelf: "flex-start",
                          }}>
                            <Text style={{ 
                              color: winProbability >= 30 ? "#16a34a" : winProbability >= 15 ? "#ca8a04" : C.sub, 
                              fontSize: 11, 
                              fontWeight: "700" 
                            }}>
                              📊 수상 확률: {winProbability.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                    </View>
                    </View>
                    
                    {/* 이미 받은 상 표시 */}
                    {novelAwards.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                        {novelAwards.map((award, i) => {
                          const meta = currentYearAwards.find(a => a.id === award.type) || AWARD_META[award.type];
                          if (!meta) return null;
                          return (
                            <TouchableOpacity
                              key={i}
                              onPress={() => {
                                Alert.alert("🏆 수상 취소", `"${meta.name || meta.label}" 수상을 취소할까요?`, [
                                  { text: "취소" },
                                  { text: "확인", style: "destructive", onPress: () => onRemoveAward(novel.id, award.type, awardSelectedYear) }
                                ]);
                              }}
                              style={{
                                backgroundColor: meta.color,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 999,
                                marginRight: 6,
                                marginBottom: 4,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {meta.icon && <Text style={{ marginRight: 4, fontSize: 12 }}>{meta.icon}</Text>}
                              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                                {meta.name || meta.label}
                              </Text>
                              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginLeft: 4 }}>✕</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    
                    {/* 작품 정보 */}
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>
                      {novel.author || "-"} · {novel.major_genre || deriveMajorGenre(novel.tags) || "-"} · {novel.work_status || "연재중"}
                    </Text>
                    
                    {/* 즉석 수상 버튼들 */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {currentYearAwards.map(award => {
                          const alreadyHas = novelAwards.some(a => a.type === award.id);
                          return (
                            <TouchableOpacity
                              key={award.id}
                              onPress={() => {
                                if (alreadyHas) {
                                  onRemoveAward(novel.id, award.id, awardSelectedYear);
                                } else {
                                  onGiveAward(novel.id, award.id, awardSelectedYear);
                                }
                              }}
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 10,
                                backgroundColor: alreadyHas ? award.color : C.bg,
                                borderWidth: 1.5,
                                borderColor: award.color,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ marginRight: 5, fontSize: 14 }}>{award.icon}</Text>
                              <Text style={{ 
                                color: alreadyHas ? "#fff" : award.color,
                                fontWeight: "700",
                                fontSize: 12,
                              }}>
                                {award.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                );
              })
            )}
          </Section>
        </>
      )}
      
      {/* ===== 수상 결과 탭 ===== */}
      {awardSubTab === "results" && (
        <>
          {/* 수상작 섹션 */}
          {currentYearAwards.map(award => {
            const winners = awardWinners[award.id] || [];
            
            return (
              <View key={award.id} style={{ marginBottom: 28 }}>
                {/* 상 헤더 - 화려한 배너 스타일 */}
                <View style={{
                  backgroundColor: award.color,
                  padding: 20,
                  borderRadius: 20,
                  marginBottom: 14,
                  shadowColor: award.color,
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 6,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 40, marginRight: 14 }}>{award.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
                        {award.name}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>
                        {winners.length > 0 
                          ? `🎉 ${winners.length}작 수상` 
                          : "아직 수상작이 없습니다"}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* 수상작 (크게 표시) */}
                {winners.length > 0 ? (
                  winners.map((novel, idx) => {
                    const tier = novel.manual_tier || tierFromRating(novel.rating);
                    const tierColor = getTierColor(tier);
                    const winRate = getWinRate(novel.wins, novel.losses);
                    const plats = parsePlatforms(novel.platforms);
                    
                    return (
                      <View
                        key={novel.id}
                        style={{
                          backgroundColor: C.card,
                          borderRadius: 18,
                          padding: 18,
                          marginBottom: 12,
                          borderWidth: 3,
                          borderColor: award.color,
                          shadowColor: award.color,
                          shadowOpacity: 0.25,
                          shadowRadius: 12,
                          elevation: 6,
                        }}
                      >
                        {/* 수상 뱃지 */}
                        <View style={{ 
                          position: "absolute", 
                          top: -10, 
                          right: 12,
                          backgroundColor: award.color,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 999,
                          flexDirection: "row",
                          alignItems: "center",
                        }}>
                          <Text style={{ marginRight: 4 }}>{award.icon}</Text>
                          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>
                            {award.name}
                          </Text>
                        </View>
                        
                        {/* 표지 + 기본 정보 */}
                        <View style={{ flexDirection: "row", marginTop: 8 }}>
                          {novel.cover_image && (
                            <View style={{ marginRight: 14 }}>
                              <ExpoImage 
                                source={{ uri: novel.cover_image }} 
                                style={{ width: 70, height: 100, borderRadius: 10 }}
                                contentFit="cover"
                              />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                              <View style={{
                                backgroundColor: tierColor,
                                paddingHorizontal: 12,
                                paddingVertical: 5,
                                borderRadius: 10,
                                marginRight: 10,
                              }}>
                                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>{tier}</Text>
                              </View>
                              <Text style={{ fontSize: 19, fontWeight: "900", color: C.text, flex: 1 }} numberOfLines={2}>
                                {novel.title}
                              </Text>
                            </View>
                            <Text style={{ color: C.sub, marginBottom: 6, fontSize: 14 }}>
                              ✍️ {novel.author || "-"}
                            </Text>
                            
                            {/* 상세 스탯 */}
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontSize: 13 }}>📊</Text>
                                <Text style={{ color: C.text, fontSize: 13, fontWeight: "700", marginLeft: 4 }}>
                                  {novel.rating.toFixed(1)}점
                                </Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontSize: 13 }}>🏅</Text>
                                <Text style={{ color: C.text, fontSize: 13, fontWeight: "700", marginLeft: 4 }}>
                                  {winRate}% 승률
                                </Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontSize: 13 }}>⚔️</Text>
                                <Text style={{ color: C.text, fontSize: 13, fontWeight: "700", marginLeft: 4 }}>
                                  {novel.wins}승 {novel.losses}패
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        
                        {/* 분석 정보 */}
                        <View style={{ 
                          marginTop: 14, 
                          paddingTop: 14, 
                          borderTopWidth: 1, 
                          borderTopColor: C.line 
                        }}>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {novel.major_genre && (
                              <View style={{ backgroundColor: "#dbeafe", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "700" }}>
                                  📚 {novel.major_genre}
                                </Text>
                              </View>
                            )}
                            {novel.sub_genre && (
                              <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                <Text style={{ color: "#92400e", fontSize: 12, fontWeight: "700" }}>
                                  🏷️ {novel.sub_genre}
                                </Text>
                              </View>
                            )}
                            {plats.map(p => (
                              <View key={p} style={{ backgroundColor: "#f3e8ff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                <Text style={{ color: "#7c3aed", fontSize: 12, fontWeight: "700" }}>📱 {p}</Text>
                              </View>
                            ))}
                            {novel.work_status && (
                              <View style={{ 
                                backgroundColor: novel.work_status === "completed" ? "#dcfce7" : "#e0e7ff", 
                                paddingHorizontal: 10, 
                                paddingVertical: 5, 
                                borderRadius: 8 
                              }}>
                                <Text style={{ 
                                  color: novel.work_status === "completed" ? "#166534" : "#3730a3", 
                                  fontSize: 12, 
                                  fontWeight: "700" 
                                }}>
                                  {novel.work_status === "completed" ? "✅ 완결" : `📝 ${WORK_STATUS_MAP[novel.work_status]?.label || novel.work_status}`}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        
                        {/* 💬 인상깊은 문장 */}
                        {novel.memorable_quote && novel.memorable_quote.trim() && (
                          <View style={{ 
                            marginTop: 14,
                            padding: 14, 
                            backgroundColor: isDark ? "#1e293b" : "#fffbeb", 
                            borderRadius: 12,
                            borderLeftWidth: 4,
                            borderLeftColor: award.color,
                          }}>
                            <Text style={{ 
                              fontStyle: "italic", 
                              fontSize: 14, 
                              color: isDark ? "#fef3c7" : "#78350f",
                              lineHeight: 22,
                            }}>
                              {`"${novel.memorable_quote.trim()}"`}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={{ 
                    backgroundColor: C.bg, 
                    padding: 24, 
                    borderRadius: 14, 
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.line,
                    borderStyle: "dashed",
                  }}>
                    <Text style={{ fontSize: 30, marginBottom: 8 }}>🎯</Text>
                    <Text style={{ color: C.sub, textAlign: "center" }}>
                      아직 수상작이 없습니다{"\n"}
                      <Text style={{ fontSize: 12 }}>수상 탭에서 후보작에 상을 부여하세요</Text>
                    </Text>
                  </View>
                )}
                
                {/* 🆕 v3.2.1: 접었다 폈다 가능한 후보작 목록 */}
                {(() => {
                  const candidatesForThisAward = getCandidatesForAward(award);
                  if (candidatesForThisAward.length === 0) return null;
                  
                  const isExpanded = expandedCandidates[award.id];
                  
                  return (
                    <TouchableOpacity
                      onPress={() => setExpandedCandidates(prev => ({
                        ...prev,
                        [award.id]: !prev[award.id]
                      }))}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        backgroundColor: C.bg,
                        borderRadius: 12,
                        padding: 12,
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: C.line,
                      }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>
                            📋 후보작 목록 ({candidatesForThisAward.length})
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 16 }}>
                            {isExpanded ? "▼" : "▶"}
                          </Text>
                        </View>
                        
                        {isExpanded && (
                          <View style={{ marginTop: 12 }}>
                            <ScrollView 
                              horizontal 
                              showsHorizontalScrollIndicator={false}
                              style={{ marginHorizontal: -4 }}
                            >
                              <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 4 }}>
                                {candidatesForThisAward.slice(0, 15).map((novel, idx) => {
                                  const tier = novel.manual_tier || tierFromRating(novel.rating);
                                  const tierColor = getTierColor(tier);
                                  const prob = calculateWinProbability(novel, award, candidatesForThisAward);
                                  
                                  return (
                                    <View
                                      key={novel.id}
                                      style={{
                                        width: 80,
                                        alignItems: "center",
                                      }}
                                    >
                                      {/* 표지 또는 플레이스홀더 */}
                                      {novel.cover_image ? (
                                        <ExpoImage
                                          source={{ uri: novel.cover_image }}
                                          style={{
                                            width: 60,
                                            height: 85,
                                            borderRadius: 8,
                                            backgroundColor: C.card,
                                          }}
                                          contentFit="cover"
                                        />
                                      ) : (
                                        <View style={{
                                          width: 60,
                                          height: 85,
                                          borderRadius: 8,
                                          backgroundColor: C.card,
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderWidth: 1,
                                          borderColor: C.line,
                                        }}>
                                          <Text style={{ fontSize: 24 }}>📖</Text>
                                        </View>
                                      )}
                                      
                                      {/* 티어 뱃지 (표지 위 오버레이) */}
                                      <View style={{
                                        position: "absolute",
                                        top: 4,
                                        left: 6,
                                        backgroundColor: tierColor,
                                        paddingHorizontal: 5,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                      }}>
                                        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 9 }}>{tier}</Text>
                                      </View>
                                      
                                      {/* 순위 */}
                                      <View style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 6,
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        paddingHorizontal: 5,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                      }}>
                                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 9 }}>#{idx + 1}</Text>
                                      </View>
                                      
                                      {/* 제목 */}
                                      <Text 
                                        style={{ 
                                          color: C.text, 
                                          fontSize: 10, 
                                          fontWeight: "600",
                                          marginTop: 6,
                                          textAlign: "center",
                                        }} 
                                        numberOfLines={2}
                                      >
                                        {novel.title}
                                      </Text>
                                      
                                      {/* 확률 */}
                                      <Text style={{ 
                                        color: prob >= 20 ? C.ok : C.sub, 
                                        fontSize: 9, 
                                        fontWeight: "700",
                                        marginTop: 2,
                                      }}>
                                        {prob.toFixed(0)}%
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </ScrollView>
                            
                            {candidatesForThisAward.length > 15 && (
                              <Text style={{ color: C.sub, fontSize: 11, textAlign: "center", marginTop: 8 }}>
                                외 {candidatesForThisAward.length - 15}작 더 있음
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            );
          })}
          
          {/* 미수상 후보작 (🆕 v3.2.1: 표지 이미지 추가, 가로 스크롤) */}
          {nonWinnerCandidates.length > 0 && (
            <Section title={`📋 미수상 후보작 (${nonWinnerCandidates.length})`}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -8 }}
              >
                <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 8 }}>
                  {nonWinnerCandidates.slice(0, 25).map((novel, idx) => {
                    const tier = novel.manual_tier || tierFromRating(novel.rating);
                    const tierColor = getTierColor(tier);
                    
                    return (
                      <View
                        key={novel.id}
                        style={{
                          width: 90,
                          alignItems: "center",
                        }}
                      >
                        {/* 표지 또는 플레이스홀더 */}
                        <View style={{ position: "relative" }}>
                          {novel.cover_image ? (
                            <ExpoImage
                              source={{ uri: novel.cover_image }}
                              style={{
                                width: 70,
                                height: 100,
                                borderRadius: 8,
                                backgroundColor: C.card,
                              }}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={{
                              width: 70,
                              height: 100,
                              borderRadius: 8,
                              backgroundColor: C.card,
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1,
                              borderColor: C.line,
                            }}>
                              <Text style={{ fontSize: 28 }}>📖</Text>
                            </View>
                          )}
                          
                          {/* 티어 뱃지 (표지 위) */}
                          <View style={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            backgroundColor: tierColor,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 9 }}>{tier}</Text>
                          </View>
                          
                          {/* 순위 */}
                          <View style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}>
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 9 }}>#{idx + 1}</Text>
                          </View>
                        </View>
                        
                        {/* 제목 */}
                        <Text 
                          style={{ 
                            color: C.text, 
                            fontSize: 10, 
                            fontWeight: "600",
                            marginTop: 6,
                            textAlign: "center",
                          }} 
                          numberOfLines={2}
                        >
                          {novel.title}
                        </Text>
                        
                        {/* 점수 */}
                        <Text style={{ 
                          color: C.sub, 
                          fontSize: 9, 
                          marginTop: 2,
                        }}>
                          {novel.rating.toFixed(0)}점
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              {nonWinnerCandidates.length > 25 && (
                <Text style={{ color: C.sub, marginTop: 10, textAlign: "center", fontSize: 12 }}>
                  외 {nonWinnerCandidates.length - 25}작 더 있음 →
                </Text>
              )}
            </Section>
          )}
          
          {/* 전체 통계 */}
          <Section title="📊 시상 통계">
            {(() => {
              const totalAwards = Object.values(awardWinners).flat().length;
              const uniqueWinners = new Set(Object.values(awardWinners).flat().map(n => n.id)).size;
              const avgRating = candidates.length > 0 
                ? (candidates.reduce((s, n) => s + n.rating, 0) / candidates.length).toFixed(1)
                : 0;
              
              return (
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 28, fontWeight: "900" }}>{totalAwards}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>총 시상</Text>
                    </View>
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 28, fontWeight: "900" }}>{uniqueWinners}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>수상 작품</Text>
                    </View>
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 28, fontWeight: "900" }}>{candidates.length}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>후보작</Text>
                    </View>
                  </View>
                  <View style={{ 
                    backgroundColor: C.bg, 
                    padding: 12, 
                    borderRadius: 10,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 20,
                  }}>
                    <Text style={{ color: C.sub, fontSize: 12 }}>
                      후보작 평균: <Text style={{ color: C.text, fontWeight: "700" }}>{avgRating}점</Text>
                    </Text>
                    <Text style={{ color: C.sub, fontSize: 12 }}>
                      수상률: <Text style={{ color: C.text, fontWeight: "700" }}>
                        {candidates.length > 0 ? Math.round((uniqueWinners / candidates.length) * 100) : 0}%
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })()}
          </Section>
        </>
      )}
      
      {/* ===== 상 설정 모달 ===== */}
      <Modal
        visible={settingsModalOpen}
        animationType="slide"
        onRequestClose={() => setSettingsModalOpen(false)}
        transparent
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setSettingsModalOpen(false)} 
          />
          <View style={{ 
            backgroundColor: C.card, 
            borderTopLeftRadius: 20, 
            borderTopRightRadius: 20, 
            padding: 20, 
            maxHeight: "90%" 
          }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: C.text, marginBottom: 16 }}>
              ⚙️ {awardSelectedYear}년 상 설정
            </Text>
            
            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {/* 현재 상 목록 */}
              <Text style={{ fontWeight: "800", color: C.text, marginBottom: 12, fontSize: 16 }}>
                📋 현재 상 목록 ({currentYearAwards.length}개)
              </Text>
              
              {currentYearAwards.map(award => (
                <View
                  key={award.id}
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                    borderLeftWidth: 5,
                    borderLeftColor: award.color,
                  }}
                >
                  {/* 상 헤더 */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 24, marginRight: 10 }}>{award.icon}</Text>
                    <Text style={{ fontWeight: "800", color: C.text, flex: 1, fontSize: 16 }}>{award.name}</Text>
                    <TouchableOpacity
                      onPress={() => deleteAward(award.id)}
                      style={{ padding: 6 }}
                    >
                      <Text style={{ color: "#ef4444", fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* 아이콘 선택 */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>아이콘</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {iconOptions.map(icon => (
                          <TouchableOpacity
                            key={icon}
                            onPress={() => updateAward(award.id, { icon })}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              backgroundColor: award.icon === icon ? award.color : C.card,
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: award.icon === icon ? award.color : C.line,
                            }}
                          >
                            <Text style={{ fontSize: 18 }}>{icon}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  
                  {/* 색상 선택 */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>색상</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {colorOptions.map(color => (
                          <TouchableOpacity
                            key={color}
                            onPress={() => updateAward(award.id, { color })}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: color,
                              borderWidth: award.color === color ? 3 : 0,
                              borderColor: "#fff",
                            }}
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  
                  {/* 티어 조건 */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>최소 티어 조건</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {[
                        { value: null, label: "무관" },
                        { value: "S", label: "S+" },
                        { value: "A", label: "A+" },
                        { value: "B+", label: "B++" },
                        { value: "B", label: "B+" },
                      ].map(opt => (
                        <TouchableOpacity
                          key={opt.value || "none"}
                          onPress={() => updateAward(award.id, { tierMin: opt.value })}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: award.tierMin === opt.value ? C.primary : C.card,
                            borderWidth: 1,
                            borderColor: award.tierMin === opt.value ? C.primary : C.line,
                          }}
                        >
                          <Text style={{ 
                            color: award.tierMin === opt.value ? "#fff" : C.text,
                            fontSize: 12,
                            fontWeight: "600",
                          }}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* 매칭 태그 */}
                  <View>
                    <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>
                      어울리는 태그 {award.matchTags?.includes("__ANY__") ? "(태그무관)" : `(${(award.matchTags || []).filter(t => t !== "__ANY__").length}개)`}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {/* 태그무관 옵션 */}
                      <TouchableOpacity
                        onPress={() => {
                          if (award.matchTags?.includes("__ANY__")) {
                            updateAward(award.id, { matchTags: [] });
                          } else {
                            updateAward(award.id, { matchTags: ["__ANY__"] });
                          }
                        }}
                        style={{
                          backgroundColor: award.matchTags?.includes("__ANY__") ? C.primary : C.card,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: award.matchTags?.includes("__ANY__") ? C.primary : C.line,
                        }}
                      >
                        <Text style={{ 
                          color: award.matchTags?.includes("__ANY__") ? "#fff" : C.text, 
                          fontSize: 12,
                          fontWeight: "600",
                        }}>
                          🌐 태그무관
                        </Text>
                      </TouchableOpacity>
                      
                      {/* 기존 태그들 */}
                      {(award.matchTags || []).filter(t => t !== "__ANY__").map((tag, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            const newTags = (award.matchTags || []).filter((_, idx) => award.matchTags[idx] !== tag);
                            updateAward(award.id, { matchTags: newTags });
                          }}
                          style={{
                            backgroundColor: "#dbeafe",
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "600" }}>{tag} ✕</Text>
                        </TouchableOpacity>
                      ))}
                      
                      {/* 태그 추가 버튼 또는 입력 필드 */}
                      {!award.matchTags?.includes("__ANY__") && (
                        editingAwardId === award.id ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <TextInput
                              value={newTagInput}
                              onChangeText={setNewTagInput}
                              placeholder="태그 입력"
                              placeholderTextColor={C.sub}
                              style={{
                                backgroundColor: C.card,
                                borderWidth: 1,
                                borderColor: C.primary,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                fontSize: 12,
                                color: C.text,
                                width: 80,
                              }}
                              autoFocus
                              onSubmitEditing={() => {
                                if (newTagInput.trim()) {
                                  const newTags = [...(award.matchTags || []).filter(t => t !== "__ANY__"), newTagInput.trim()];
                                  updateAward(award.id, { matchTags: newTags });
                                  setNewTagInput("");
                                }
                                setEditingAwardId(null);
                              }}
                            />
                            <TouchableOpacity
                              onPress={() => {
                                if (newTagInput.trim()) {
                                  const newTags = [...(award.matchTags || []).filter(t => t !== "__ANY__"), newTagInput.trim()];
                                  updateAward(award.id, { matchTags: newTags });
                                  setNewTagInput("");
                                }
                                setEditingAwardId(null);
                              }}
                              style={{ backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}
                            >
                              <Text style={{ color: "#166534", fontSize: 11, fontWeight: "700" }}>✓</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => { setEditingAwardId(null); setNewTagInput(""); }}
                              style={{ backgroundColor: "#fee2e2", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}
                            >
                              <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "700" }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => { setEditingAwardId(award.id); setNewTagInput(""); }}
                            style={{
                              backgroundColor: "#dcfce7",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: "#166534", fontSize: 12, fontWeight: "600" }}>+ 태그 추가</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                </View>
              ))}
              
              {/* 새 상 추가 */}
              <View style={{ marginTop: 20, padding: 14, backgroundColor: C.bg, borderRadius: 14 }}>
                <Text style={{ fontWeight: "800", color: C.text, marginBottom: 10 }}>➕ 새 상 추가</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={newAwardName}
                    onChangeText={setNewAwardName}
                    placeholder="상 이름 (예: 베스트 신작)"
                    placeholderTextColor={C.sub}
                    style={{
                      flex: 1,
                      backgroundColor: C.card,
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: C.text,
                      fontSize: 14,
                    }}
                  />
                  <TouchableOpacity
                    onPress={addNewAward}
                    style={{
                      backgroundColor: C.primary,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800" }}>추가</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* 연도 간 복사 */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontWeight: "800", color: C.text, marginBottom: 10 }}>
                  📋 다른 연도에서 복사
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {years.filter(y => y !== awardSelectedYear).map(year => (
                      <TouchableOpacity
                        key={year}
                        onPress={() => {
                          Alert.alert(
                            "상 설정 복사",
                            `${year}년 상 설정을 ${awardSelectedYear}년으로 복사할까요?\n\n현재 ${awardSelectedYear}년 설정은 덮어씌워집니다.`,
                            [
                              { text: "취소" },
                              { text: "복사", onPress: () => {
                                const sourceAwards = awardSystemSettings?.yearlyAwards?.[year];
                                if (sourceAwards) {
                                  const updated = { ...awardSystemSettings };
                                  updated.yearlyAwards[awardSelectedYear] = sourceAwards.map(a => ({ ...a }));
                                  onSaveSettings(updated);
                                  Alert.alert("✅ 완료", "복사되었습니다.");
                                }
                              }}
                            ]
                          );
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          borderRadius: 10,
                          backgroundColor: C.card,
                          borderWidth: 1,
                          borderColor: C.line,
                        }}
                      >
                        <Text style={{ color: C.text, fontWeight: "600" }}>{year}년</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              <View style={{ height: 30 }} />
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setSettingsModalOpen(false)}
              style={{
                marginTop: 16,
                paddingVertical: 16,
                borderRadius: 14,
                backgroundColor: C.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

export default AwardsScreen;
