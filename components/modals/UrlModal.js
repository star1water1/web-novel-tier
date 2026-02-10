/**
 * URL 입력 모달 (v6.0 Context)
 * @module components/modals/UrlModal
 * @source_origin 원본 App.jsx 28775-28824줄
 * @description 표지 이미지 URL 입력. Context 직접 소비.
 */
import React, { memo, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import { PrimaryButton, OutlineButton } from "../common/ui";
import { useApp } from "../../contexts/AppContext";
import { useModal } from "../../contexts/ModalContext";

const UrlModal = memo(() => {
  const { theme } = useApp();
  const { urlOpen, urlCallback, closeUrl } = useModal();
  const C = theme;
  const [urlInput, setUrlInput] = useState("");

  const handleClose = useCallback(() => {
    closeUrl(); setUrlInput("");
  }, [closeUrl]);

  const handleConfirm = useCallback(() => {
    if (urlCallback) urlCallback(urlInput.trim());
    closeUrl(); setUrlInput("");
  }, [urlCallback, urlInput, closeUrl]);

  if (!urlOpen) return null;
  return (
    <Modal visible={urlOpen} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: C.overlay || "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
        <TouchableOpacity style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={handleClose} />
        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 12 }}>표지 이미지 URL</Text>
          <Text style={{ color: C.sub, marginBottom: 12 }}>이미지 주소를 입력하세요{"\n"}(노벨피아, 문피아 등의 표지 URL)</Text>
          <TextInput value={urlInput} onChangeText={setUrlInput} placeholder="https://..." placeholderTextColor={C.sub} autoCapitalize="none" autoCorrect={false}
            style={{ backgroundColor: C.bg || "#F5F7FB", borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text }}
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            <OutlineButton title="취소" onPress={handleClose} style={{ flex: 1 }} theme={C} />
            <PrimaryButton title="확인" onPress={handleConfirm} style={{ flex: 1 }} theme={C} />
          </View>
        </View>
      </View>
    </Modal>
  );
});
UrlModal.displayName = "UrlModal";
export default UrlModal;
