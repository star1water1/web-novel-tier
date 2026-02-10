/**
 * 티어 검토 화면
 * @module screens/ReviewScreen
 * @version 6.1.4 (Context 아키텍처)
 *
 * @bugfix v6.1.4
 * - [FIX] addRecentChange(id, title, type, {...}) → 4인자 호출이지만 DataContext는 (change객체) 1인자
 *   → addRecentChange({ novelId, title, type, from, to }) 객체 형태로 수정
 * - [FIX] setTierHistory(React state)만 호출하고 saveTierHistory(DB 저장) 미호출
 *   → 앱 재시작 시 티어 변경 히스토리 소실. 3곳 모두 saveTierHistory 호출 추가
 *
 * @description
 * S/A 티어 승급/강등 검토 화면
 * Context: useApp(theme, appSettings, setScreen), useData(list, loadList, addRecentChange, tierHistory, saveTierHistory, reviewSearchQuery, reviewSelectedIds)
 */

import React, { memo, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { exec, execBatch } from "../database";
import { 
  uuid, 
  tierFromRating, 
  tierRank, 
  getDisplayTier, 
  getReviewStatus 
} from "../utils/helpers";
import { H, Section, Label, PrimaryButton, OutlineButton, Chip } from "../components/common/ui";
import { TierTag } from "../components/common/ui";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";

// ═══════════════════════════════════════════════════════════════
// 📌 ReviewScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const ReviewScreen = memo(() => {
  const { theme, appSettings, setScreen } = useApp();
  const {
    list, loadList, addRecentChange,
    tierHistory, setTierHistory, saveTierHistory,
    reviewSearchQuery, setReviewSearchQuery,
    reviewSelectedIds, setReviewSelectedIds,
  } = useData();
  const C = theme;
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 검토 대기 목록 계산
  // ─────────────────────────────────────────────────────────────
  const reviewItems = useMemo(() => {
    return list.filter(n => getReviewStatus(n, globalTierThresholds) !== null);
  }, [list, globalTierThresholds]);

  // ─────────────────────────────────────────────────────────────
  // 검색 필터링
  // ─────────────────────────────────────────────────────────────
  const filteredForSearch = useMemo(() => {
    const q = (reviewSearchQuery || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter(n => 
      (n.title || "").toLowerCase().includes(q) ||
      (n.author || "").toLowerCase().includes(q)
    );
  }, [list, reviewSearchQuery]);

  // ─────────────────────────────────────────────────────────────
  // 일괄 적용
  // ─────────────────────────────────────────────────────────────
  const applyAllReviews = useCallback(async () => {
    const reviews = list.filter(n => getReviewStatus(n, globalTierThresholds) !== null);
    if (reviews.length === 0) {
      Alert.alert("알림", "검토 대기 중인 작품이 없습니다.");
      return;
    }
    Alert.alert("확인", `${reviews.length}건을 모두 권장 티어로 적용할까요?`, [
      { text: "취소" },
      { text: "적용", onPress: async () => {
        const historyItems = [];
        const queries = reviews.map(n => {
          const status = getReviewStatus(n, globalTierThresholds);
          const newTier = status.to;
          historyItems.push({
            id: uuid(),
            novelId: n.id,
            title: n.title,
            from: status.from,
            to: newTier,
            at: Date.now(),
          });
          return {
            sql: "UPDATE novels SET manual_tier=? WHERE id=?",
            params: [newTier, n.id],
          };
        });
        await execBatch(queries);
        
        setTierHistory(prev => {
          const updated = [...historyItems, ...prev].slice(0, 100);
          saveTierHistory(updated); // [FIX v6.1.4] DB에도 저장
          return updated;
        });
        
        for (const h of historyItems) {
          await addRecentChange({ novelId: h.novelId, title: h.title, type: "tier_review", from: h.from, to: h.to });
        }
        
        await loadList();
        Alert.alert("완료", `${reviews.length}건이 적용되었습니다.`);
      }},
    ]);
  }, [list, globalTierThresholds, setTierHistory, saveTierHistory, addRecentChange, loadList]);

  // ─────────────────────────────────────────────────────────────
  // 개별 승인
  // ─────────────────────────────────────────────────────────────
  const approveReview = useCallback(async (novel) => {
    const status = getReviewStatus(novel, globalTierThresholds);
    if (!status) return;
    
    const newTier = status.to;
    await exec("UPDATE novels SET manual_tier=? WHERE id=?", [newTier, novel.id]);
    
    const historyItem = {
      id: uuid(),
      novelId: novel.id,
      title: novel.title,
      from: status.from,
      to: newTier,
      at: Date.now(),
    };
    setTierHistory(prev => {
      const updated = [historyItem, ...prev].slice(0, 100);
      saveTierHistory(updated); // [FIX v6.1.4] DB에도 저장
      return updated;
    });
    await addRecentChange({ novelId: novel.id, title: novel.title, type: "tier_review", from: status.from, to: newTier });
    await loadList();
  }, [globalTierThresholds, setTierHistory, saveTierHistory, addRecentChange, loadList]);

  // ─────────────────────────────────────────────────────────────
  // 개별 거부
  // ─────────────────────────────────────────────────────────────
  const rejectReview = useCallback(async (novel) => {
    const status = getReviewStatus(novel, globalTierThresholds);
    if (!status) return;
    
    // 현재 티어 유지
    const keepTier = status.from;
    await exec("UPDATE novels SET manual_tier=? WHERE id=?", [keepTier, novel.id]);
    await loadList();
  }, [globalTierThresholds, loadList]);

  // ─────────────────────────────────────────────────────────────
  // 강제 지정
  // ─────────────────────────────────────────────────────────────
  const forceSetTier = useCallback(async (novel, tier) => {
    const currentTier = getDisplayTier(novel, globalTierThresholds);
    if (currentTier === tier) return;
    
    await exec("UPDATE novels SET manual_tier=? WHERE id=?", [tier, novel.id]);
    
    const historyItem = {
      id: uuid(),
      novelId: novel.id,
      title: novel.title,
      from: currentTier,
      to: tier,
      at: Date.now(),
    };
    setTierHistory(prev => {
      const updated = [historyItem, ...prev].slice(0, 100);
      saveTierHistory(updated); // [FIX v6.1.4] DB에도 저장
      return updated;
    });
    await addRecentChange({ novelId: novel.id, title: novel.title, type: "tier_review", from: currentTier, to: tier, forced: true });
    await loadList();
  }, [globalTierThresholds, setTierHistory, saveTierHistory, addRecentChange, loadList]);

  // ─────────────────────────────────────────────────────────────
  // 선택 항목 일괄 승인
  // ─────────────────────────────────────────────────────────────
  const approveSelected = useCallback(async () => {
    if (reviewSelectedIds.length === 0) {
      Alert.alert("알림", "선택된 항목이 없습니다.");
      return;
    }
    
    const selected = reviewItems.filter(n => reviewSelectedIds.includes(n.id));
    if (selected.length === 0) return;
    
    Alert.alert("확인", `선택한 ${selected.length}건을 승인할까요?`, [
      { text: "취소" },
      { text: "승인", onPress: async () => {
        for (const n of selected) {
          await approveReview(n);
        }
        setReviewSelectedIds([]);
        Alert.alert("완료", `${selected.length}건이 승인되었습니다.`);
      }},
    ]);
  }, [reviewSelectedIds, reviewItems, approveReview, setReviewSelectedIds]);

  // ─────────────────────────────────────────────────────────────
  // 통계 계산
  // ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const sCount = list.filter(n => getDisplayTier(n, globalTierThresholds) === 'S').length;
    const aCount = list.filter(n => getDisplayTier(n, globalTierThresholds) === 'A').length;
    const total = list.length;
    const sPercent = total > 0 ? ((sCount / total) * 100).toFixed(1) : 0;
    const aPercent = total > 0 ? ((aCount / total) * 100).toFixed(1) : 0;
    return { sCount, aCount, total, sPercent, aPercent };
  }, [list, globalTierThresholds]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>🏆 티어 검토</H>
      
      {/* 현황 요약 */}
      <Section title="현황" theme={C}>
        <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
          <View style={{ backgroundColor: "#8b5cf6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>S: {stats.sCount}작품</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{stats.sPercent}%</Text>
          </View>
          <View style={{ backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>A: {stats.aCount}작품</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{stats.aPercent}%</Text>
          </View>
          <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: C.text, fontWeight: "700" }}>전체: {stats.total}작품</Text>
          </View>
        </View>
      </Section>

      {/* 액션 버튼들 */}
      <Section title="일괄 작업" theme={C}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <TouchableOpacity
            onPress={applyAllReviews}
            style={{
              backgroundColor: C.ok,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>✓ 모두 적용 ({reviewItems.length}건)</Text>
          </TouchableOpacity>
          
          {reviewSelectedIds.length > 0 && (
            <TouchableOpacity
              onPress={approveSelected}
              style={{
                backgroundColor: C.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>선택 승인 ({reviewSelectedIds.length}건)</Text>
            </TouchableOpacity>
          )}
        </View>
      </Section>

      {/* 검토 대기 목록 */}
      {reviewItems.length > 0 && (
        <Section title={`검토 대기 (${reviewItems.length}건)`} theme={C}>
          {reviewItems.slice(0, appSettings?.maxReviewItems || 20).map(novel => {
            const status = getReviewStatus(novel, globalTierThresholds);
            if (!status) return null;
            
            const isSelected = reviewSelectedIds.includes(novel.id);
            const isPromote = status.type === "promote";
            
            return (
              <TouchableOpacity
                key={novel.id}
                onPress={() => {
                  setReviewSelectedIds(prev => 
                    prev.includes(novel.id) 
                      ? prev.filter(id => id !== novel.id)
                      : [...prev, novel.id]
                  );
                }}
                style={{
                  padding: 14,
                  backgroundColor: isSelected ? (C.chip || "#EEF4FF") : C.card,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: isSelected ? C.primary : (isPromote ? "#22c55e" : "#ef4444"),
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }} numberOfLines={1}>
                      {novel.title}
                    </Text>
                    <Text style={{ color: C.sub, marginTop: 4 }}>
                      {novel.author || "-"} · R {(novel.rating || 1500).toFixed(0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <TierTag rating={novel.rating} thresholds={globalTierThresholds} />
                      <Text style={{ color: C.sub }}>→</Text>
                      <View style={{
                        backgroundColor: isPromote ? "#22c55e" : "#ef4444",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}>
                        <Text style={{ color: "#fff", fontWeight: "800" }}>{status.to}</Text>
                      </View>
                    </View>
                    <Text style={{ color: isPromote ? "#22c55e" : "#ef4444", fontSize: 12, marginTop: 4, fontWeight: "600" }}>
                      {isPromote ? "승급 권장" : "강등 권장"}
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => approveReview(novel)}
                    style={{
                      flex: 1,
                      backgroundColor: C.ok,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>승인</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => rejectReview(novel)}
                    style={{
                      flex: 1,
                      backgroundColor: C.sub,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>유지</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </Section>
      )}

      {/* 강제 지정 */}
      <Section title="강제 티어 지정" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 10 }}>
          작품을 검색하여 S/A 티어를 직접 지정합니다.
        </Text>
        <TextInput
          value={reviewSearchQuery}
          onChangeText={setReviewSearchQuery}
          placeholder="제목 또는 작가 검색"
          placeholderTextColor={C.sub}
          style={{
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: C.text,
            marginBottom: 10,
          }}
        />
        
        {reviewSearchQuery.trim().length > 0 && (
          <View>
            {filteredForSearch.slice(0, 10).map(novel => {
              const currentTier = getDisplayTier(novel, globalTierThresholds);
              return (
                <View
                  key={novel.id}
                  style={{
                    padding: 12,
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.line,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>{novel.title}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>{novel.author || "-"} · 현재: {currentTier}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {['S', 'A'].map(tier => (
                        <TouchableOpacity
                          key={tier}
                          onPress={() => forceSetTier(novel, tier)}
                          disabled={currentTier === tier}
                          style={{
                            backgroundColor: currentTier === tier ? C.sub : (tier === 'S' ? "#8b5cf6" : "#3b82f6"),
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            opacity: currentTier === tier ? 0.5 : 1,
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>{tier}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Section>

      {/* 티어 변경 히스토리 */}
      {tierHistory && tierHistory.length > 0 && (
        <Section title="티어 변경 히스토리" theme={C}>
          <View>
            {tierHistory.slice(0, 10).map((h, idx) => (
              <View
                key={h.id || idx}
                style={{
                  padding: 10,
                  backgroundColor: C.card,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.line,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>{h.title}</Text>
                <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                  {h.from} → {h.to} · {new Date(h.at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
          {tierHistory.length > 10 && (
            <Text style={{ color: C.sub, fontSize: 12, marginTop: 8, textAlign: "center" }}>
              최근 10건만 표시됩니다
            </Text>
          )}
        </Section>
      )}
    </>
  );
});

ReviewScreen.displayName = "ReviewScreen";

export default ReviewScreen;
