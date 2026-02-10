/**
 * 표지 선택 모달 (v6.0 Context)
 * @module components/modals/CoverSelectModal
 * @source_origin 원본 App.jsx 29764-29875줄
 * @description 표지 라이브러리에서 표지 선택. Context 직접 소비.
 */
import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

const CoverSelectModal = memo(() => {
  const { theme } = useApp();
  const { coverLibrary } = useData();
  const { coverSelectOpen, coverSelectTarget, coverSelectCallback, closeCoverSelect, editForm, editingPlanned, setEditingPlanned } = useModal();
  const C = theme;

  const handleSelect = useCallback((item) => {
    // 타겟에 따라 적절한 콜백 호출
    if (coverSelectTarget === "edit" && editForm?.setEditCoverImage) {
      editForm.setEditCoverImage(item.file_path);
    } else if (coverSelectTarget === "plannedEdit" && editingPlanned) {
      setEditingPlanned({ ...editingPlanned, cover_image: item.file_path });
    } else if (coverSelectCallback) {
      // "new", "planned" 등 콜백 기반 타겟
      coverSelectCallback(item.file_path);
    }
    closeCoverSelect();
  }, [coverSelectTarget, editForm, editingPlanned, setEditingPlanned, coverSelectCallback, closeCoverSelect]);

  if (!coverSelectOpen) return null;
  return (
    <Modal visible={coverSelectOpen} animationType="slide" onRequestClose={closeCoverSelect} transparent>
      <TouchableOpacity style={{ flex: 1, backgroundColor: C.modal || "rgba(0,0,0,0.4)" }} activeOpacity={1} onPress={closeCoverSelect}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, minHeight: "60%", maxHeight: "90%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>🖼️ 표지 라이브러리에서 선택</Text>
                <TouchableOpacity onPress={closeCoverSelect} style={{ padding: 8 }}>
                  <Text style={{ color: C.sub, fontSize: 28, fontWeight: "300" }}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: C.sub, marginBottom: 12 }}>미사용 표지 중에서 선택하세요. (사용 중인 표지는 회색으로 표시됩니다)</Text>
              {(coverLibrary || []).length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={{ color: C.sub, textAlign: "center" }}>표지 라이브러리가 비어있습니다.{"\n"}'표지' 탭에서 이미지를 추가해주세요.</Text>
                </View>
              ) : (
                <FlatList data={coverLibrary} keyExtractor={(item) => item.id} numColumns={4} style={{ flex: 1 }} columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                  renderItem={({ item }) => {
                    const isUsed = item.status === "used";
                    return (
                      <TouchableOpacity onPress={() => handleSelect(item)}
                        style={{ width: 80, height: 110, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: isUsed ? C.line : C.primary, opacity: isUsed ? 0.5 : 1 }}>
                        <ExpoImage source={{ uri: item.file_path }} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
                        {isUsed && (
                          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", paddingVertical: 2 }}>
                            <Text style={{ color: "#fff", fontSize: 9, textAlign: "center" }}>사용중</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});
CoverSelectModal.displayName = "CoverSelectModal";
export default CoverSelectModal;
