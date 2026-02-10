/**
 * 검색용 태그 선택 모달 (v6.0)
 * @module components/modals/SearchTagModal
 * 
 * @source_origin 원본 App.jsx 7347-7781줄 (435줄)
 * 
 * @description
 * 다중 태그 AND 조건 검색을 위한 모달
 * 
 * 탭 구조:
 * 1. 포함 탭 - 검색에 포함할 태그 선택
 * 2. 제외 탭 - 검색에서 제외할 태그 선택
 * 3. 상태 탭 - 읽기 상태 / 작품 상태 필터
 * 
 * @props
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - includeTags / setIncludeTags: 포함 태그 상태
 * - excludeTags / setExcludeTags: 제외 태그 상태
 * - excludeStatus / setExcludeStatus: 제외 읽기 상태
 * - excludeWorkStatus / setExcludeWorkStatus: 제외 작품 상태
 * - customTags: 커스텀 태그 배열
 * - comboTags: 조합 태그 배열
 * - userMajorGenres / userSubGenres: 사용자 추가 장르
 * - pinnedTags / hiddenTags: 고정/숨김 태그
 * - theme: 테마 객체
 */

import React, { memo, useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";

// Constants
import { 
  MAJOR_GENRES, 
  SUB_GENRES, 
  ALL_DEFAULT_TAGS,
} from "../../constants/tags";
import { STATUS_OPTIONS, WORK_STATUS_OPTIONS, STATUS_MAP, WORK_STATUS_MAP } from "../../constants/config";

// Context
import { useApp } from "../../contexts/AppContext";
import { useTag } from "../../contexts/TagContext";
import { useFilter } from "../../contexts/FilterContext";

// ═══════════════════════════════════════════════════════════════
// 📌 SearchTagModal 컴포넌트
// ═══════════════════════════════════════════════════════════════

const SearchTagModal = memo(() => {
  // Context 직접 소비
  const { theme } = useApp();
  const { customTags, comboTags, userMajorGenres, userSubGenres, pinnedTags, hiddenTags } = useTag();
  const { searchTagModalOpen: visible, setSearchTagModalOpen, searchTagModalMode,
    searchIncludeTags: includeTags, setSearchIncludeTags: setIncludeTags,
    searchExcludeTags: excludeTags, setSearchExcludeTags: setExcludeTags,
    searchExcludeStatus: excludeStatus, setSearchExcludeStatus: setExcludeStatus,
    searchExcludeWorkStatus: excludeWorkStatus, setSearchExcludeWorkStatus: setExcludeWorkStatus,
  } = useFilter();
  const onClose = useCallback(() => setSearchTagModalOpen(false), [setSearchTagModalOpen]);
  const C = theme;
  const [activeTab, setActiveTab] = useState("include"); // "include" | "exclude" | "status"
  const [searchQ, setSearchQ] = useState("");
  
  // 모든 태그 합치기 (숨김 태그 제외)
  const allTags = useMemo(() => {
    const tags = new Set([
      ...MAJOR_GENRES,
      ...userMajorGenres,
      ...SUB_GENRES,
      ...userSubGenres,
      ...ALL_DEFAULT_TAGS,
      ...customTags,
      ...comboTags,
    ]);
    return Array.from(tags).filter(t => !hiddenTags.includes(t));
  }, [customTags, comboTags, userMajorGenres, userSubGenres, hiddenTags]);
  
  // 검색 필터링
  const filteredTags = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    let result = allTags;
    if (q) {
      result = result.filter(t => t.toLowerCase().includes(q));
    }
    // 고정 태그를 앞으로
    const pinned = result.filter(t => pinnedTags.includes(t));
    const others = result.filter(t => !pinnedTags.includes(t));
    return [...pinned, ...others];
  }, [allTags, searchQ, pinnedTags]);
  
  const toggleInclude = (tag) => {
    if (includeTags.includes(tag)) {
      setIncludeTags(includeTags.filter(t => t !== tag));
    } else {
      setIncludeTags([...includeTags, tag]);
      // 제외에서 제거
      if (excludeTags.includes(tag)) {
        setExcludeTags(excludeTags.filter(t => t !== tag));
      }
    }
  };
  
  const toggleExclude = (tag) => {
    if (excludeTags.includes(tag)) {
      setExcludeTags(excludeTags.filter(t => t !== tag));
    } else {
      setExcludeTags([...excludeTags, tag]);
      // 포함에서 제거
      if (includeTags.includes(tag)) {
        setIncludeTags(includeTags.filter(t => t !== tag));
      }
    }
  };
  
  const toggleStatusExclude = (status) => {
    if (excludeStatus.includes(status)) {
      setExcludeStatus(excludeStatus.filter(s => s !== status));
    } else {
      setExcludeStatus([...excludeStatus, status]);
    }
  };
  
  const toggleWorkStatusExclude = (status) => {
    if (excludeWorkStatus.includes(status)) {
      setExcludeWorkStatus(excludeWorkStatus.filter(s => s !== status));
    } else {
      setExcludeWorkStatus([...excludeWorkStatus, status]);
    }
  };
  
  const clearAll = () => {
    setIncludeTags([]);
    setExcludeTags([]);
    setExcludeStatus([]);
    setExcludeWorkStatus([]);
  };
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>🔍 고급 검색 필터</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: C.sub }}>×</Text>
            </TouchableOpacity>
          </View>
          
          {/* 탭 */}
          <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
            {[
              { key: "include", label: "✅ 포함", count: includeTags.length },
              { key: "exclude", label: "🚫 제외", count: excludeTags.length },
              { key: "status", label: "📊 상태", count: excludeStatus.length + excludeWorkStatus.length },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: activeTab === tab.key ? C.primary : C.chip,
                  alignItems: "center",
                }}
              >
                <Text style={{ 
                  fontWeight: "700", 
                  color: activeTab === tab.key ? "#fff" : C.text,
                  fontSize: 13,
                }}>
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
            {/* 포함 태그 탭 */}
            {activeTab === "include" && (
              <View>
                <Text style={{ color: C.sub, marginBottom: 8, fontSize: 13 }}>
                  선택한 태그를 <Text style={{ fontWeight: "700", color: C.ok }}>모두 포함</Text>하는 작품만 표시합니다. (AND 조건)
                </Text>
                
                {/* 검색 */}
                <TextInput
                  value={searchQ}
                  onChangeText={setSearchQ}
                  placeholder="태그 검색..."
                  placeholderTextColor={C.sub}
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 12,
                    color: C.text,
                  }}
                />
                
                {/* 선택된 태그 */}
                {includeTags.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>선택됨:</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {includeTags.map(tag => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => toggleInclude(tag)}
                          style={{
                            backgroundColor: C.ok,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            marginRight: 6,
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 12 }}>{tag} ✓</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* 태그 목록 */}
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {filteredTags.slice(0, 100).map(tag => {
                    const isSelected = includeTags.includes(tag);
                    const isPinned = pinnedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleInclude(tag)}
                        style={{
                          backgroundColor: isSelected ? C.ok : C.chip,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          marginRight: 6,
                          marginBottom: 6,
                          borderWidth: isPinned ? 2 : 0,
                          borderColor: "#f59e0b",
                        }}
                      >
                        <Text style={{ color: isSelected ? "#fff" : C.text, fontSize: 12 }}>
                          {isPinned && "📌 "}{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {filteredTags.length > 100 && (
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>
                    검색으로 더 많은 태그를 찾을 수 있습니다 ({filteredTags.length}개 중 100개 표시)
                  </Text>
                )}
              </View>
            )}
            
            {/* 제외 태그 탭 */}
            {activeTab === "exclude" && (
              <View>
                <Text style={{ color: C.sub, marginBottom: 8, fontSize: 13 }}>
                  선택한 태그를 가진 작품을 <Text style={{ fontWeight: "700", color: C.warn }}>제외</Text>합니다.
                </Text>
                
                {/* 검색 */}
                <TextInput
                  value={searchQ}
                  onChangeText={setSearchQ}
                  placeholder="태그 검색..."
                  placeholderTextColor={C.sub}
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 12,
                    color: C.text,
                  }}
                />
                
                {/* 선택된 태그 */}
                {excludeTags.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>제외됨:</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {excludeTags.map(tag => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => toggleExclude(tag)}
                          style={{
                            backgroundColor: C.warn,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            marginRight: 6,
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 12 }}>{tag} ✕</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* 태그 목록 */}
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {filteredTags.slice(0, 100).map(tag => {
                    const isSelected = excludeTags.includes(tag);
                    const isPinned = pinnedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleExclude(tag)}
                        style={{
                          backgroundColor: isSelected ? C.warn : C.chip,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          marginRight: 6,
                          marginBottom: 6,
                          borderWidth: isPinned ? 2 : 0,
                          borderColor: "#f59e0b",
                        }}
                      >
                        <Text style={{ color: isSelected ? "#fff" : C.text, fontSize: 12 }}>
                          {isPinned && "📌 "}{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* 상태 제외 탭 */}
            {activeTab === "status" && (
              <View>
                <Text style={{ color: C.sub, marginBottom: 12, fontSize: 13 }}>
                  특정 상태의 작품을 검색 결과에서 <Text style={{ fontWeight: "700", color: C.warn }}>제외</Text>합니다.
                </Text>
                
                {/* 읽기 상태 */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>📖 읽기 상태</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
                  {Object.entries(STATUS_MAP).map(([key, val]) => {
                    const isExcluded = excludeStatus.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => toggleStatusExclude(key)}
                        style={{
                          backgroundColor: isExcluded ? C.warn : C.chip,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          marginRight: 8,
                          marginBottom: 8,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ 
                          width: 10, height: 10, borderRadius: 5, 
                          backgroundColor: val.color, marginRight: 6 
                        }} />
                        <Text style={{ color: isExcluded ? "#fff" : C.text, fontSize: 13 }}>
                          {val.label} {isExcluded && "✕"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                {/* 작품 연재 상태 */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>📝 작품 연재 상태</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {Object.entries(WORK_STATUS_MAP).map(([key, val]) => {
                    const isExcluded = excludeWorkStatus.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => toggleWorkStatusExclude(key)}
                        style={{
                          backgroundColor: isExcluded ? C.warn : C.chip,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          marginRight: 8,
                          marginBottom: 8,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ 
                          width: 10, height: 10, borderRadius: 5, 
                          backgroundColor: val.color, marginRight: 6 
                        }} />
                        <Text style={{ color: isExcluded ? "#fff" : C.text, fontSize: 13 }}>
                          {val.label} {isExcluded && "✕"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
          
          {/* 현재 필터 요약 */}
          {(includeTags.length > 0 || excludeTags.length > 0 || excludeStatus.length > 0 || excludeWorkStatus.length > 0) && (
            <View style={{ 
              backgroundColor: C.bg, 
              padding: 12, 
              borderRadius: 12, 
              marginTop: 12 
            }}>
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>📋 현재 필터</Text>
              {includeTags.length > 0 && (
                <Text style={{ fontSize: 12, color: C.ok }}>✅ 포함: {includeTags.join(", ")}</Text>
              )}
              {excludeTags.length > 0 && (
                <Text style={{ fontSize: 12, color: C.warn }}>🚫 제외 태그: {excludeTags.join(", ")}</Text>
              )}
              {excludeStatus.length > 0 && (
                <Text style={{ fontSize: 12, color: C.warn }}>
                  🚫 제외 상태: {excludeStatus.map(s => STATUS_MAP[s]?.label || s).join(", ")}
                </Text>
              )}
              {excludeWorkStatus.length > 0 && (
                <Text style={{ fontSize: 12, color: C.warn }}>
                  🚫 제외 연재: {excludeWorkStatus.map(s => WORK_STATUS_MAP[s]?.label || s).join(", ")}
                </Text>
              )}
            </View>
          )}
          
          {/* 버튼 */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            <TouchableOpacity
              onPress={clearAll}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.warn,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.warn, fontWeight: "700" }}>초기화</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: C.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default SearchTagModal;
