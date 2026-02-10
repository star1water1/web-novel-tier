/**
 * 좌표계 관리 모달 (v6.0)
 * @module components/modals/CoordManageModal
 * 
 * @source_origin 원본 App.jsx 28881-29256줄 (~375줄)
 * 
 * @bugfix v6.1.3
 * - [FIX] allTags는 객체({allMajorGenres, allSubGenres, allTagsSorted})인데 .filter() 호출
 *   → allTags.allTagsSorted로 배열 접근하도록 수정. 태그 검색 시 TypeError 크래시 해소
 *
 * @bugfix v6.1.4
 * - [FIX] onSave가 editingCoordSystem 인자를 무시하고 coordinateSystems(원본)을 저장
 *   → 편집된 좌표계를 coordinateSystems에 병합 후 저장하도록 수정
 * - [FIX] onSave 후 handleClose 중복 호출 제거
 *
 * @bugfix v6.1.5
 * - [FIX] onDelete가 setCoordinateSystems(raw setter)만 호출 → DB 미저장 + .filter()를 객체에 사용(타입 에러)
 *   → Object.entries/fromEntries로 객체 타입 유지 + saveCoordinateSystems로 DB 저장
 *
 * @description
 * 좌표계 편집 및 태그 배치 모달
 */

import React, { memo, useState, useCallback } from "react";
import { useApp } from "../../contexts/AppContext";
import { useTag } from "../../contexts/TagContext";
import { useModal } from "../../contexts/ModalContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { PrimaryButton, OutlineButton, Chip } from "../common/ui";

const CoordManageModal = memo(() => {
  // Context 직접 소비
  const { theme } = useApp();
  // [FIX v6.1.3] allTags는 { allMajorGenres, allSubGenres, allTagsSorted } 객체
  const { coordinateSystems, setCoordinateSystems, saveCoordinateSystems, allTags } = useTag();
  const allTagsList = allTags?.allTagsSorted || [];
  const { coordManageOpen: visible, setCoordManageOpen } = useModal();
  const C = theme;
  const onClose = useCallback(() => setCoordManageOpen(false), [setCoordManageOpen]);

  // 내부 편집 상태
  const [editingCoordSystem, setEditingCoordSystem] = useState(null);
  const [editingCoordTag, setEditingCoordTag] = useState(null);
  // [FIX v6.1.4] onSave: 편집된 좌표계를 coordinateSystems에 병합 후 저장
  const onSave = useCallback(async (editedSystem) => {
    if (editedSystem && editedSystem.id) {
      const merged = { ...coordinateSystems, [editedSystem.id]: editedSystem };
      setCoordinateSystems(merged);
      await saveCoordinateSystems(merged);
    } else {
      await saveCoordinateSystems(coordinateSystems);
    }
    onClose();
  }, [saveCoordinateSystems, coordinateSystems, setCoordinateSystems, onClose]);
  // [FIX v6.1.5] onDelete: (1) raw setter만 사용 → DB 미저장 (2) .filter()는 객체에 사용불가
  //   → Object.entries + filter 후 fromEntries로 객체 유지, saveCoordinateSystems 추가
  const onDelete = useCallback((id) => {
    const updated = Object.fromEntries(
      Object.entries(coordinateSystems || {}).filter(([k]) => k !== id)
    );
    setCoordinateSystems(updated);
    saveCoordinateSystems(updated);
  }, [coordinateSystems, setCoordinateSystems, saveCoordinateSystems]);
  const [tagSearch, setTagSearch] = useState("");

  // 닫기 핸들러
  const handleClose = useCallback(() => {
    onClose();
    setEditingCoordSystem(null);
    setEditingCoordTag(null);
  }, [onClose, setEditingCoordSystem, setEditingCoordTag]);

  // 태그 위치 설정
  const setTagPosition = useCallback((tag, x, y) => {
    if (!editingCoordSystem) return;
    const newTags = { ...(editingCoordSystem.tags || {}) };
    newTags[tag] = { x, y };
    setEditingCoordSystem({ ...editingCoordSystem, tags: newTags });
  }, [editingCoordSystem, setEditingCoordSystem]);

  // 태그 제거
  const removeTag = useCallback((tag) => {
    if (!editingCoordSystem) return;
    const newTags = { ...(editingCoordSystem.tags || {}) };
    delete newTags[tag];
    setEditingCoordSystem({ ...editingCoordSystem, tags: newTags });
    if (editingCoordTag === tag) setEditingCoordTag(null);
  }, [editingCoordSystem, setEditingCoordSystem, editingCoordTag, setEditingCoordTag]);

  // 검색된 태그 목록
  const filteredTags = tagSearch.trim()
    ? allTagsList.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : [];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      transparent
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", padding: 16 }}>
          {/* 헤더 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
              📐 좌표계 편집
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ fontSize: 24, color: C.sub }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {editingCoordSystem && (
            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator>
              {/* 좌표계 이름 */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>좌표계 이름</Text>
              <TextInput
                value={editingCoordSystem.name || ""}
                onChangeText={(text) => setEditingCoordSystem({ ...editingCoordSystem, name: text })}
                placeholder="좌표계 이름"
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: C.text,
                  marginBottom: 12,
                }}
              />
              
              {/* X축 라벨 */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>X축 (의미적 위치)</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <TextInput
                  value={editingCoordSystem.xAxis?.negative || ""}
                  onChangeText={(text) => setEditingCoordSystem({ 
                    ...editingCoordSystem, 
                    xAxis: { ...editingCoordSystem.xAxis, negative: text } 
                  })}
                  placeholder="왼쪽 (예: 약함)"
                  placeholderTextColor={C.sub}
                  style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                />
                <Text style={{ alignSelf: "center", color: C.sub, fontWeight: "700" }}>↔</Text>
                <TextInput
                  value={editingCoordSystem.xAxis?.positive || ""}
                  onChangeText={(text) => setEditingCoordSystem({ 
                    ...editingCoordSystem, 
                    xAxis: { ...editingCoordSystem.xAxis, positive: text } 
                  })}
                  placeholder="오른쪽 (예: 강함)"
                  placeholderTextColor={C.sub}
                  style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                />
              </View>
              
              {/* Y축 라벨 */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>Y축 (의미적 위치)</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <TextInput
                  value={editingCoordSystem.yAxis?.negative || ""}
                  onChangeText={(text) => setEditingCoordSystem({ 
                    ...editingCoordSystem, 
                    yAxis: { ...editingCoordSystem.yAxis, negative: text } 
                  })}
                  placeholder="아래 (예: 느림)"
                  placeholderTextColor={C.sub}
                  style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                />
                <Text style={{ alignSelf: "center", color: C.sub, fontWeight: "700" }}>↕</Text>
                <TextInput
                  value={editingCoordSystem.yAxis?.positive || ""}
                  onChangeText={(text) => setEditingCoordSystem({ 
                    ...editingCoordSystem, 
                    yAxis: { ...editingCoordSystem.yAxis, positive: text } 
                  })}
                  placeholder="위 (예: 빠름)"
                  placeholderTextColor={C.sub}
                  style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text }}
                />
              </View>

              {/* 태그 추가 */}
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6, marginTop: 8 }}>태그 추가</Text>
              <TextInput
                value={tagSearch}
                onChangeText={setTagSearch}
                placeholder="태그 검색..."
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: C.text,
                  marginBottom: 8,
                }}
              />
              
              {filteredTags.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {filteredTags.slice(0, 20).map(tag => {
                    const isInCoord = editingCoordSystem.tags && editingCoordSystem.tags[tag];
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => {
                          if (!isInCoord) {
                            setTagPosition(tag, 0, 0);
                            setEditingCoordTag(tag);
                          }
                        }}
                        style={{
                          backgroundColor: isInCoord ? C.primary : C.chip,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                        }}
                      >
                        <Text style={{ color: isInCoord ? "#fff" : C.text, fontSize: 12 }}>
                          {isInCoord ? "✓ " : ""}{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* 현재 등록된 태그 목록 */}
              {editingCoordSystem.tags && Object.keys(editingCoordSystem.tags).length > 0 && (
                <>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6, marginTop: 8 }}>
                    등록된 태그 ({Object.keys(editingCoordSystem.tags).length}개)
                  </Text>
                  <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                    {Object.entries(editingCoordSystem.tags).map(([tag, pos]) => (
                      <View key={tag} style={{ 
                        flexDirection: "row", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: C.line,
                      }}>
                        <TouchableOpacity 
                          onPress={() => setEditingCoordTag(tag)}
                          style={{ flex: 1 }}
                        >
                          <Text style={{ 
                            color: editingCoordTag === tag ? C.primary : C.text, 
                            fontWeight: editingCoordTag === tag ? "700" : "400" 
                          }}>
                            {tag}
                          </Text>
                          <Text style={{ color: C.sub, fontSize: 11 }}>
                            X: {pos.x?.toFixed(1)}, Y: {pos.y?.toFixed(1)}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeTag(tag)} style={{ padding: 4 }}>
                          <Text style={{ color: C.warn }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* 선택된 태그 위치 조정 */}
              {editingCoordTag && editingCoordSystem.tags?.[editingCoordTag] && (
                <View style={{ backgroundColor: "#e0f2fe", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <Text style={{ fontWeight: "700", color: "#0369a1", marginBottom: 8 }}>
                    "{editingCoordTag}" 위치 조정
                  </Text>
                  
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ width: 60, color: "#0369a1" }}>X축:</Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TouchableOpacity 
                        onPress={() => setTagPosition(editingCoordTag, -1, editingCoordSystem.tags[editingCoordTag].y)}
                        style={{ padding: 8, backgroundColor: "#0369a1", borderRadius: 6 }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>-1</Text>
                      </TouchableOpacity>
                      <TextInput
                        value={String(editingCoordSystem.tags[editingCoordTag].x || 0)}
                        onChangeText={(t) => setTagPosition(editingCoordTag, parseFloat(t) || 0, editingCoordSystem.tags[editingCoordTag].y)}
                        keyboardType="numeric"
                        style={{ flex: 1, backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, textAlign: "center", color: "#0369a1" }}
                      />
                      <TouchableOpacity 
                        onPress={() => setTagPosition(editingCoordTag, 1, editingCoordSystem.tags[editingCoordTag].y)}
                        style={{ padding: 8, backgroundColor: "#0369a1", borderRadius: 6 }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>+1</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ width: 60, color: "#0369a1" }}>Y축:</Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TouchableOpacity 
                        onPress={() => setTagPosition(editingCoordTag, editingCoordSystem.tags[editingCoordTag].x, -1)}
                        style={{ padding: 8, backgroundColor: "#0369a1", borderRadius: 6 }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>-1</Text>
                      </TouchableOpacity>
                      <TextInput
                        value={String(editingCoordSystem.tags[editingCoordTag].y || 0)}
                        onChangeText={(t) => setTagPosition(editingCoordTag, editingCoordSystem.tags[editingCoordTag].x, parseFloat(t) || 0)}
                        keyboardType="numeric"
                        style={{ flex: 1, backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, textAlign: "center", color: "#0369a1" }}
                      />
                      <TouchableOpacity 
                        onPress={() => setTagPosition(editingCoordTag, editingCoordSystem.tags[editingCoordTag].x, 1)}
                        style={{ padding: 8, backgroundColor: "#0369a1", borderRadius: 6 }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "700" }}>+1</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* 버튼 */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <PrimaryButton
                  title="저장"
                  onPress={() => {
                    if (onSave) onSave(editingCoordSystem);
                    else handleClose();
                  }}
                  style={{ flex: 1 }}
                  theme={C}
                />
                {onDelete && (
                  <OutlineButton
                    title="삭제"
                    onPress={() => {
                      Alert.alert("삭제 확인", "이 좌표계를 삭제할까요?", [
                        { text: "취소" },
                        { text: "삭제", style: "destructive", onPress: () => {
                          onDelete(editingCoordSystem.id);
                          handleClose();
                        }},
                      ]);
                    }}
                    color={C.warn}
                    style={{ flex: 1 }}
                    theme={C}
                  />
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
});

CoordManageModal.displayName = "CoordManageModal";

export default CoordManageModal;
