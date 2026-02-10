/**
 * 태그 편집 모달 (v6.0)
 * @module components/modals/TagEditModal
 * 
 * @bugfix v6.1.4
 * - [FIX] onSave가 onClose()만 호출하고 인자를 무시 → 고정/숨김/감정 변경이 저장 안 됨
 *   → onSave 구현: changes.pinned/hidden/sentiment를 실제 Context에 저장
 * 
 * @source_origin 원본 App.jsx 7804-8293줄 (490줄)
 * 
 * @description
 * 개별 태그의 상세 설정을 편집하는 모달
 * 
 * 기능:
 * - 태그 고정/숨김 설정
 * - 감정 설정 (긍정/중립/부정)
 * - 좌표계 위치 편집
 * - 태그 승격/강등 (커스텀↔대장르/부장르)
 * - 태그 관계 편집
 * - 전역 삭제
 * 
 * @props
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - tag: 편집 대상 태그
 * - tagType: 태그 유형
 * - isPinned / isHidden: 고정/숨김 상태
 * - sentiment: 감정 설정
 * - coordinateSystems: 좌표계 목록
 * - tagUsageStats: 사용 통계
 * - 각종 콜백 함수들
 * - theme: 테마 객체
 */

import React, { memo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";

// Context
import { useApp } from "../../contexts/AppContext";
import { useTag } from "../../contexts/TagContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 TagEditModal 컴포넌트
// ═══════════════════════════════════════════════════════════════

const TagEditModal = memo(() => {
  // Context 직접 소비
  const { theme } = useApp();
  const tagCtx = useTag();
  const { list } = useData();
  const { tagEditOpen: visible, editingTag, closeTagEdit: onClose, setTagRelationOpen } = useModal();

  // editingTag에서 정보 추출
  const tag = editingTag?.tag || editingTag;
  const tagType = editingTag?.tagType || "custom";

  // 태그 상태 파생
  const isPinned = (tagCtx.pinnedTags || []).includes(tag);
  const isHidden = (tagCtx.hiddenTags || []).includes(tag);
  const sentiment = tagCtx.tagSentiments?.[tag] || null;
  const coordinateSystems = tagCtx.coordinateSystems || [];

  // 사용 통계 계산
  const tagUsageStats = (() => {
    if (!tag || !list) return { count: 0, avgIntensity: 0, avgRating: 0 };
    const matches = list.filter(n => (n.tags || "").split(",").map(t => t.trim()).includes(tag));
    const count = matches.length;
    const avgRating = count > 0 ? matches.reduce((s, n) => s + (n.rating || 0), 0) / count : 0;
    return { count, avgIntensity: 0, avgRating };
  })();

  // 어댑터 콜백
  const onPin = useCallback(() => {
    const next = isPinned ? tagCtx.pinnedTags.filter(t => t !== tag) : [...tagCtx.pinnedTags, tag];
    tagCtx.savePinnedTags(next);
  }, [tag, isPinned, tagCtx]);

  const onHide = useCallback(() => {
    const next = isHidden ? tagCtx.hiddenTags.filter(t => t !== tag) : [...tagCtx.hiddenTags, tag];
    tagCtx.saveHiddenTags(next);
  }, [tag, isHidden, tagCtx]);

  const onSetSentiment = useCallback((s) => {
    const next = { ...tagCtx.tagSentiments, [tag]: s };
    tagCtx.saveTagSentiments(next);
  }, [tag, tagCtx]);

  const onPromoteToMajor = useCallback(() => {
    const next = [...(tagCtx.userMajorGenres || []), tag];
    tagCtx.setUserMajorGenres(next);
  }, [tag, tagCtx]);

  const onPromoteToSub = useCallback(() => {
    const next = [...(tagCtx.userSubGenres || []), tag];
    tagCtx.setUserSubGenres(next);
  }, [tag, tagCtx]);

  const onDemoteToCustom = useCallback(() => {
    tagCtx.setUserMajorGenres((tagCtx.userMajorGenres || []).filter(t => t !== tag));
    tagCtx.setUserSubGenres((tagCtx.userSubGenres || []).filter(t => t !== tag));
  }, [tag, tagCtx]);

  const onComboToCustom = useCallback(() => {
    tagCtx.removeComboTag(tag);
    tagCtx.addCustomTag(tag);
  }, [tag, tagCtx]);

  const onDeleteGlobally = useCallback(() => {
    Alert.alert("확인", `"${tag}" 태그를 전역 삭제하시겠습니까?`, [
      { text: "취소" },
      { text: "삭제", style: "destructive", onPress: () => {
        tagCtx.removeCustomTag(tag);
        onClose();
      }},
    ]);
  }, [tag, tagCtx, onClose]);

  const onEditRelations = useCallback(() => {
    setTagRelationOpen(true);
  }, [setTagRelationOpen]);

  const onEditCoordinate = useCallback(() => {}, []);
  // [FIX v6.1.4] onSave: 로컬 변경사항을 실제로 Context에 저장
  const onSave = useCallback((targetTag, changes) => {
    if (!targetTag) { onClose(); return; }
    // 고정 상태 변경
    if (changes.pinned !== isPinned) {
      const next = changes.pinned
        ? [...(tagCtx.pinnedTags || []).filter(t => t !== targetTag), targetTag]
        : (tagCtx.pinnedTags || []).filter(t => t !== targetTag);
      tagCtx.savePinnedTags(next);
    }
    // 숨김 상태 변경
    if (changes.hidden !== isHidden) {
      const next = changes.hidden
        ? [...(tagCtx.hiddenTags || []).filter(t => t !== targetTag), targetTag]
        : (tagCtx.hiddenTags || []).filter(t => t !== targetTag);
      tagCtx.saveHiddenTags(next);
    }
    // 감정 변경
    if (changes.sentiment !== sentiment) {
      const next = { ...tagCtx.tagSentiments };
      if (changes.sentiment) {
        next[targetTag] = changes.sentiment;
      } else {
        delete next[targetTag];
      }
      tagCtx.saveTagSentiments(next);
    }
    onClose();
  }, [onClose, isPinned, isHidden, sentiment, tagCtx]);
  const relationInfo = null;
  const C = theme;
  
  // 🆕 내부 상태 (변경사항 추적)
  const [localPinned, setLocalPinned] = useState(isPinned);
  const [localHidden, setLocalHidden] = useState(isHidden);
  const [localSentiment, setLocalSentiment] = useState(sentiment);
  const [hasChanges, setHasChanges] = useState(false);
  
  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (visible) {
      setLocalPinned(isPinned);
      setLocalHidden(isHidden);
      setLocalSentiment(sentiment);
      setHasChanges(false);
    }
  }, [visible, isPinned, isHidden, sentiment]);
  
  if (!visible || !tag) return null;
  
  // 분류 라벨
  const typeLabels = {
    custom: "커스텀 태그",
    combo: "조합식 태그",
    major: "사용자 대장르",
    sub: "사용자 부장르",
    userMajor: "사용자 대장르",
    userSub: "사용자 부장르",
    defaultMajor: "기본 대장르",
    defaultSub: "기본 부장르",
    defaultTag: "기본 태그",
  };
  
  // 속성 색상
  const sentimentColors = {
    positive: { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46", label: "😊 긍정" },
    neutral: { bg: "#e5e7eb", border: "#9ca3af", text: "#374151", label: "😐 중립" },
    negative: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", label: "😟 부정" },
  };
  
  // 사용자 정의 태그인지 확인
  const isUserDefined = ["custom", "combo", "major", "sub", "userMajor", "userSub"].includes(tagType);
  const canPromote = ["custom", "combo"].includes(tagType);
  const canDemote = ["major", "sub", "userMajor", "userSub"].includes(tagType);
  
  // 좌표계에 배치된 정보 찾기
  const getCoordinatePlacements = () => {
    if (!coordinateSystems) return [];
    const placements = [];
    for (const [sysId, sys] of Object.entries(coordinateSystems)) {
      const pos = sys.tags?.[tag];
      if (pos) {
        placements.push({
          systemId: sysId,
          systemName: sys.name,
          x: pos.x,
          y: pos.y,
          xLabel: sys.xAxis ? (pos.x < 0.5 ? sys.xAxis.negative : sys.xAxis.positive) : "",
          yLabel: sys.yAxis ? (pos.y < 0.5 ? sys.yAxis.negative : sys.yAxis.positive) : "",
        });
      }
    }
    return placements;
  };
  
  const coordPlacements = getCoordinatePlacements();
  
  // 변경사항 감지
  const handleLocalChange = (setter, value) => {
    setter(value);
    setHasChanges(true);
  };
  
  // 저장 (일괄)
  const handleSave = () => {
    if (hasChanges && onSave) {
      onSave(tag, {
        pinned: localPinned,
        hidden: localHidden,
        sentiment: localSentiment,
      });
    }
    onClose();
  };
  
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity 
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, width: "90%", maxWidth: 420, maxHeight: "85%" }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 헤더 */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>{tag}</Text>
                <Text style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  {typeLabels[tagType] || tagType}
                </Text>
              </View>
              {hasChanges && (
                <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, color: "#92400e", fontWeight: "600" }}>변경됨</Text>
                </View>
              )}
            </View>
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🎭 속성 (긍정/중립/부정) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>🎭 속성</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {Object.entries(sentimentColors).map(([key, style]) => {
                  const isSelected = localSentiment === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleLocalChange(setLocalSentiment, isSelected ? null : key)}
                      style={{
                        flex: 1,
                        backgroundColor: isSelected ? style.bg : C.bg,
                        borderWidth: 2,
                        borderColor: isSelected ? style.border : C.line,
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: isSelected ? style.text : C.sub }}>
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ⚙️ 옵션 (고정/숨김) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>⚙️ 옵션</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* 고정 */}
                <TouchableOpacity
                  onPress={() => handleLocalChange(setLocalPinned, !localPinned)}
                  style={{
                    flex: 1,
                    backgroundColor: localPinned ? "#fef3c7" : C.bg,
                    borderWidth: 2,
                    borderColor: localPinned ? "#fcd34d" : C.line,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📌</Text>
                  <Text style={{ fontWeight: "700", color: localPinned ? "#92400e" : C.sub }}>
                    {localPinned ? "고정됨" : "고정"}
                  </Text>
                </TouchableOpacity>
                
                {/* 숨김 */}
                <TouchableOpacity
                  onPress={() => handleLocalChange(setLocalHidden, !localHidden)}
                  style={{
                    flex: 1,
                    backgroundColor: localHidden ? "#e5e7eb" : C.bg,
                    borderWidth: 2,
                    borderColor: localHidden ? "#9ca3af" : C.line,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{localHidden ? "🙈" : "👁️"}</Text>
                  <Text style={{ fontWeight: "700", color: localHidden ? "#374151" : C.sub }}>
                    {localHidden ? "숨겨짐" : "표시"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📐 좌표계 배치 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>📐 좌표계 배치</Text>
              {coordPlacements.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {coordPlacements.map((p) => (
                    <TouchableOpacity
                      key={p.systemId}
                      onPress={() => onEditCoordinate?.(tag, p.systemId)}
                      style={{
                        backgroundColor: C.bg,
                        padding: 12,
                        borderRadius: 10,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <Text style={{ fontWeight: "600", color: C.text }}>{p.systemName}</Text>
                        <Text style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                          X: {p.x.toFixed(2)} ({p.xLabel}) • Y: {p.y.toFixed(2)} ({p.yLabel})
                        </Text>
                      </View>
                      <Text style={{ color: C.primary, fontWeight: "600" }}>편집 →</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ color: C.sub, fontSize: 13 }}>좌표계에 배치되지 않음</Text>
                </View>
              )}
              {/* 좌표계 추가 버튼 */}
              <TouchableOpacity
                onPress={() => onEditCoordinate?.(tag, null)}
                style={{
                  marginTop: 8,
                  backgroundColor: "#dbeafe",
                  padding: 10,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#1d4ed8", fontWeight: "600" }}>+ 좌표계에 추가</Text>
              </TouchableOpacity>
            </View>
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🔗 관계 정보 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {relationInfo && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>🔗 태그 관계</Text>
                <TouchableOpacity
                  onPress={() => { onEditRelations?.(tag); onClose(); }}
                  style={{ 
                    backgroundColor: relationInfo.type === "similar" ? "#dbeafe" : "#fef3c7",
                    padding: 12, 
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontSize: 13, color: C.text, fontWeight: "600" }}>
                    {relationInfo.type === "similar" ? "🔗 유사 태그 그룹" : "⚡ 상반 관계"}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>
                    {relationInfo.groupName || "이름 없음"}: {relationInfo.tags?.slice(0, 5).join(", ")}{relationInfo.tags?.length > 5 ? "..." : ""}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.primary, marginTop: 4 }}>터치하여 편집 →</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📊 사용 현황 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {tagUsageStats && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>📊 사용 현황</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1, backgroundColor: C.bg, padding: 10, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: C.primary }}>{tagUsageStats.count}</Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>작품</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: C.bg, padding: 10, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#22c55e" }}>
                      {tagUsageStats.avgIntensity?.toFixed(1) || "-"}
                    </Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>평균 농도</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: C.bg, padding: 10, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#f59e0b" }}>
                      {tagUsageStats.avgRating ? Math.round(tagUsageStats.avgRating).toLocaleString() : "-"}
                    </Text>
                    <Text style={{ fontSize: 10, color: C.sub }}>평균 레이팅</Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 📂 분류 변경 액션 */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>📂 분류 변경</Text>
              <View style={{ gap: 6 }}>
                {/* 관계 편집 */}
                {!relationInfo && (
                  <TouchableOpacity
                    onPress={() => { onEditRelations?.(tag); onClose(); }}
                    style={{
                      backgroundColor: "#e0e7ff",
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>🔗</Text>
                    <Text style={{ fontWeight: "600", color: "#3730a3" }}>유사/상반 태그 설정</Text>
                  </TouchableOpacity>
                )}
                
                {/* 대장르 속성 추가 */}
                {canPromote && (
                  <TouchableOpacity
                    onPress={() => { onPromoteToMajor?.(tag); onClose(); }}
                    style={{
                      backgroundColor: "#fef3c7",
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>🏷️</Text>
                    <Text style={{ fontWeight: "600", color: "#92400e" }}>대장르 속성 추가</Text>
                  </TouchableOpacity>
                )}
                
                {/* 부장르 속성 추가 */}
                {canPromote && (
                  <TouchableOpacity
                    onPress={() => { onPromoteToSub?.(tag); onClose(); }}
                    style={{
                      backgroundColor: "#e0e7ff",
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>🔖</Text>
                    <Text style={{ fontWeight: "600", color: "#3730a3" }}>부장르 속성 추가</Text>
                  </TouchableOpacity>
                )}
                
                {/* 일반 태그로 변환 (조합식) */}
                {tagType === "combo" && (
                  <TouchableOpacity
                    onPress={() => { onComboToCustom?.(tag); onClose(); }}
                    style={{
                      backgroundColor: C.bg,
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>🔄</Text>
                    <Text style={{ fontWeight: "600", color: C.text }}>일반 태그로 변환</Text>
                  </TouchableOpacity>
                )}
                
                {/* 장르 속성 제거 */}
                {canDemote && (
                  <TouchableOpacity
                    onPress={() => { onDemoteToCustom?.(tag, tagType); onClose(); }}
                    style={{
                      backgroundColor: C.bg,
                      padding: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>✖️</Text>
                    <Text style={{ fontWeight: "600", color: C.text }}>장르 속성 제거</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 🗑️ 삭제 (사용자 정의만) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {isUserDefined && (
              <TouchableOpacity
                onPress={() => { onDeleteGlobally?.(tag); onClose(); }}
                style={{
                  backgroundColor: "#fee2e2",
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>🗑️</Text>
                <Text style={{ fontWeight: "700", color: "#dc2626" }}>전체에서 삭제</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 하단 버튼 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            {hasChanges ? (
              <>
                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    flex: 2,
                    backgroundColor: C.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    flex: 1,
                    backgroundColor: C.bg,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.line,
                  }}
                >
                  <Text style={{ color: C.sub, fontWeight: "700" }}>취소</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  backgroundColor: C.bg,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: C.line,
                }}
              >
                <Text style={{ color: C.sub, fontWeight: "700" }}>닫기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default TagEditModal;
