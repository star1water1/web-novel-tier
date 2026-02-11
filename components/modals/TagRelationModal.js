/**
 * 태그 관계 모달 (v6.0)
 * @module components/modals/TagRelationModal
 * 
 * @source_origin 원본 App.jsx 8588-8970줄 (383줄)
 * 
 * @bugfix v6.1.5
 * - [FIX] onCreateGroup/onUpdateGroup/onDeleteGroup 등 모든 CRUD가 setTagRelations(raw setter)만 사용
 *   → DB 미저장, 앱 재시작 시 태그 관계 전부 소실. onClose에서 saveTagRelations 호출 추가
 * 
 * @description
 * 태그 간 관계(유사/상반)를 관리하는 모달
 * 
 * 기능:
 * - 유사 태그 그룹 관리
 * - 상반 태그 그룹 관리
 * - 좌표계 기반 관계 시각화
 * - 관계 추가/삭제
 * 
 * @props
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - tag: 대상 태그
 * - tagRelations: 현재 태그 관계 데이터
 * - coordinateSystems: 좌표계 목록
 * - onUpdateRelations: 관계 업데이트 콜백
 * - theme: 테마 객체
 */

import React, { memo, useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";

// Constants
import { normalizeTag, getTagRelation } from "../../constants/tags";

// Context
import { useApp } from "../../contexts/AppContext";
import { useTag } from "../../contexts/TagContext";
import { useModal } from "../../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 TagRelationModal 컴포넌트
// ═══════════════════════════════════════════════════════════════

const TagRelationModal = memo(() => {
  // Context 직접 소비
  const { theme } = useApp();
  const { tagRelations, setTagRelations, saveTagRelations, coordinateSystems } = useTag();
  const { tagRelationOpen: visible, setTagRelationOpen } = useModal();
  const C = theme;
  // [FIX v6.1.5] onClose 시 saveTagRelations로 DB 저장 (기존: setTagRelations raw setter만 사용 → DB 미저장)
  const onClose = useCallback(() => {
    saveTagRelations(tagRelations);
    setTagRelationOpen(false);
  }, [saveTagRelations, tagRelations, setTagRelationOpen]);

  // 어댑터: 원본 prop 인터페이스 호환
  const targetTag = null; // 전체 관계 관리 모드
  const existingGroup = null;
  const allGroups = tagRelations?.groups || [];

  const onCreateGroup = useCallback((group) => {
    const id = Date.now().toString();
    setTagRelations(prev => ({ ...prev, groups: [...(prev?.groups || []), { ...group, id }] }));
  }, [setTagRelations]);

  const onUpdateGroup = useCallback((id, updates) => {
    setTagRelations(prev => ({
      ...prev,
      groups: (prev?.groups || []).map(g => g.id === id ? { ...g, ...updates } : g),
    }));
  }, [setTagRelations]);

  const onDeleteGroup = useCallback((id) => {
    setTagRelations(prev => ({
      ...prev,
      groups: (prev?.groups || []).filter(g => g.id !== id),
    }));
  }, [setTagRelations]);

  const onAddTagToGroup = useCallback((groupId, tag) => {
    setTagRelations(prev => ({
      ...prev,
      groups: (prev?.groups || []).map(g =>
        g.id === groupId ? { ...g, tags: [...(g.tags || []), tag] } : g
      ),
    }));
  }, [setTagRelations]);

  const onRemoveTagFromGroup = useCallback((groupId, tag) => {
    setTagRelations(prev => ({
      ...prev,
      groups: (prev?.groups || []).map(g =>
        g.id === groupId ? { ...g, tags: (g.tags || []).filter(t => t !== tag) } : g
      ),
    }));
  }, [setTagRelations]);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("similar"); // similar | opposite
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedOppositeGroup, setSelectedOppositeGroup] = useState(null);
  
  // 모달 열릴 때 초기화
  useEffect(() => {
    if (visible) {
      if (existingGroup) {
        setGroupName(existingGroup.name || "");
        setGroupType(existingGroup.type || "similar");
        setSelectedOppositeGroup(existingGroup.relatedGroupId || null);
      } else {
        setGroupName("");
        setGroupType("similar");
        setSelectedOppositeGroup(null);
      }
      setNewTagInput("");
    }
  }, [visible, existingGroup]);
  
  if (!visible || !targetTag) return null;
  
  const currentTags = existingGroup?.tags || [targetTag];
  const otherSimilarGroups = Object.values(allGroups || {}).filter(g => 
    g.type === "similar" && g.id !== existingGroup?.id
  );
  
  const handleSave = () => {
    if (existingGroup) {
      // 기존 그룹 업데이트
      onUpdateGroup(existingGroup.id, {
        ...existingGroup,
        name: groupName.trim() || `${targetTag} 그룹`,
        type: groupType,
        relatedGroupId: groupType === "opposite" ? selectedOppositeGroup : null,
      });
    } else {
      // 새 그룹 생성
      onCreateGroup(
        groupName.trim() || `${targetTag} 그룹`,
        groupType,
        [targetTag],
        groupType === "opposite" ? selectedOppositeGroup : null
      );
    }
    onClose();
  };
  
  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (currentTags.includes(tag)) {
      Alert.alert("알림", "이미 그룹에 있는 태그입니다.");
      return;
    }
    if (existingGroup) {
      onAddTagToGroup(existingGroup.id, tag);
    }
    setNewTagInput("");
  };
  
  const handleRemoveTag = (tag) => {
    if (tag === targetTag && currentTags.length <= 1) {
      Alert.alert("알림", "마지막 태그는 삭제할 수 없습니다. 그룹을 삭제하세요.");
      return;
    }
    if (existingGroup) {
      onRemoveTagFromGroup(existingGroup.id, tag);
    }
  };
  
  const handleDeleteGroup = () => {
    Alert.alert(
      "그룹 삭제",
      "이 태그 관계 그룹을 삭제하시겠습니까?",
      [
        { text: "취소" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: () => {
            if (existingGroup) {
              onDeleteGroup(existingGroup.id);
            }
            onClose();
          }
        }
      ]
    );
  };
  
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ 
          backgroundColor: C.card, 
          borderTopLeftRadius: 20, 
          borderTopRightRadius: 20, 
          padding: 20, 
          maxHeight: "80%" 
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
              🔗 태그 관계 편집
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: C.sub }}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 대상 태그 */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                대상 태그
              </Text>
              <View style={{ 
                backgroundColor: C.primary, 
                paddingHorizontal: 16, 
                paddingVertical: 10, 
                borderRadius: 12,
                alignSelf: "flex-start"
              }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{targetTag}</Text>
              </View>
            </View>
            
            {/* 그룹 이름 */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                그룹 이름 (선택)
              </Text>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder={`예: ${targetTag} 계열`}
                placeholderTextColor="#9ca3af"
                style={{
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: C.text,
                }}
              />
            </View>
            
            {/* 관계 유형 선택 */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                관계 유형
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setGroupType("similar")}
                  style={{
                    flex: 1,
                    backgroundColor: groupType === "similar" ? "#dbeafe" : C.chip,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: groupType === "similar" ? "#3b82f6" : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>🔗</Text>
                  <Text style={{ fontWeight: "700", color: groupType === "similar" ? "#1d4ed8" : C.text }}>
                    유사
                  </Text>
                  <Text style={{ fontSize: 10, color: C.sub, textAlign: "center" }}>
                    비슷한 의미의 태그들
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setGroupType("opposite")}
                  style={{
                    flex: 1,
                    backgroundColor: groupType === "opposite" ? "#fef3c7" : C.chip,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: groupType === "opposite" ? "#f59e0b" : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>⚡</Text>
                  <Text style={{ fontWeight: "700", color: groupType === "opposite" ? "#92400e" : C.text }}>
                    상반
                  </Text>
                  <Text style={{ fontSize: 10, color: C.sub, textAlign: "center" }}>
                    반대 의미의 태그들
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 상반 관계일 때: 연결할 그룹 선택 */}
            {groupType === "opposite" && otherSimilarGroups.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  상반 대상 그룹 선택
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {otherSimilarGroups.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => setSelectedOppositeGroup(g.id === selectedOppositeGroup ? null : g.id)}
                      style={{
                        backgroundColor: selectedOppositeGroup === g.id ? "#fee2e2" : C.chip,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        marginRight: 8,
                        borderWidth: selectedOppositeGroup === g.id ? 2 : 1,
                        borderColor: selectedOppositeGroup === g.id ? "#ef4444" : C.line,
                      }}
                    >
                      <Text style={{ 
                        color: selectedOppositeGroup === g.id ? "#991b1b" : C.text, 
                        fontWeight: "600",
                        fontSize: 13,
                      }}>
                        {g.name || g.tags[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* 그룹 내 태그 목록 */}
            {existingGroup && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  그룹 태그 ({currentTags.length}개)
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {currentTags.map(tag => (
                    <View
                      key={tag}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: tag === targetTag ? "#dbeafe" : C.chip,
                        paddingLeft: 12,
                        paddingRight: 6,
                        paddingVertical: 6,
                        borderRadius: 999,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: C.text, fontWeight: "600", fontSize: 13 }}>{tag}</Text>
                      {tag !== targetTag && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveTag(tag)}
                          style={{ marginLeft: 6, padding: 4 }}
                        >
                          <Text style={{ color: C.warn, fontSize: 12 }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
                
                {/* 태그 추가 입력 */}
                <View style={{ flexDirection: "row", marginTop: 8 }}>
                  <TextInput
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    placeholder="태그 추가 (쉼표로 여러 개)"
                    placeholderTextColor="#9ca3af"
                    style={{
                      flex: 1,
                      backgroundColor: C.bg,
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: C.text,
                      marginRight: 8,
                    }}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    onPress={handleAddTag}
                    style={{
                      backgroundColor: C.primary,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>추가</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* 안내 텍스트 */}
            <View style={{ 
              backgroundColor: C.bg, 
              padding: 12, 
              borderRadius: 12, 
              marginBottom: 16 
            }}>
              <Text style={{ color: C.sub, fontSize: 12, lineHeight: 18 }}>
                💡 <Text style={{ fontWeight: "600" }}>유사 태그</Text>: "먼치킨", "사기캐", "최강" 처럼 비슷한 의미의 태그들을 묶으면 이변 분석 시 같은 요인으로 취급됩니다.{"\n\n"}
                💡 <Text style={{ fontWeight: "600" }}>상반 태그</Text>: "먼치킨" ↔ "약골" 처럼 반대 의미의 태그들을 연결하면 취향 분석에 활용됩니다.
              </Text>
            </View>
          </ScrollView>
          
          {/* 하단 버튼 */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            {existingGroup && (
              <TouchableOpacity
                onPress={handleDeleteGroup}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.warn,
                }}
              >
                <Text style={{ color: C.warn, fontWeight: "700" }}>삭제</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.line,
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.sub, fontWeight: "700" }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={{
                flex: 1,
                backgroundColor: C.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {existingGroup ? "저장" : "그룹 생성"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default TagRelationModal;
