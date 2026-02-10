/**
 * 보충 설정 모달 (v6.0 Context)
 * @module components/modals/SupplementSettingsModal
 * @source_origin 원본 App.jsx 28243-28410줄 (~165줄)
 * @description 정보 보충 탭 설정. Context 직접 소비.
 */
import React, { memo, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Modal } from "react-native";
import { OutlineButton } from "../common/ui";
import { useApp } from "../../contexts/AppContext";
import { useModal } from "../../contexts/ModalContext";

const DEFAULT_SUPPLEMENT_SETTINGS = {
  enabled: true, minTags: 2, minReadCount: 0,
  noAuthor: true, noPlatform: true, noCover: true,
  noMajorGenre: true, noTotalEpisodes: true,
};

const SupplementSettingsModal = memo(() => {
  const { theme, appSettings, saveSettings } = useApp();
  const { supplementSettingsOpen, setSupplementSettingsOpen } = useModal();
  const C = theme;
  const visible = supplementSettingsOpen;
  const onClose = useCallback(() => setSupplementSettingsOpen(false), [setSupplementSettingsOpen]);
  const supplementSettings = appSettings?.supplement || DEFAULT_SUPPLEMENT_SETTINGS;

  const updateSetting = (key, value) => {
    saveSettings({
      supplement: { ...DEFAULT_SUPPLEMENT_SETTINGS, ...supplementSettings, [key]: value }
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{
          backgroundColor: C.card,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          maxHeight: "85%",
        }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}>
            📝 보충 기준 설정
          </Text>
          <Text style={{ color: C.sub, marginBottom: 16 }}>
            어떤 작품을 보충 대상으로 표시할지 설정합니다.
          </Text>
          
          <ScrollView style={{ maxHeight: 500 }} nestedScrollEnabled showsVerticalScrollIndicator>
            {/* 활성화 토글 */}
            <View style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}>
              <Text style={{ fontWeight: "700", color: C.text }}>보충 탭 활성화</Text>
              <Switch
                value={supplementSettings.enabled !== false}
                onValueChange={(v) => updateSetting("enabled", v)}
              />
            </View>

            {/* 최소 태그 수 */}
            <View style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: C.text }}>최소 태그 수</Text>
                <Text style={{ color: C.sub, fontSize: 12 }}>이 수 이하면 보충 대상</Text>
              </View>
              <TextInput
                value={String(supplementSettings.minTags ?? DEFAULT_SUPPLEMENT_SETTINGS.minTags)}
                onChangeText={(t) => updateSetting("minTags", Number(t) || 0)}
                keyboardType="number-pad"
                style={{ 
                  width: 60, 
                  textAlign: "center",
                  backgroundColor: C.bg || "#F5F7FB",
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 8,
                  paddingVertical: 8,
                  color: C.text,
                }}
              />
            </View>

            {/* 최소 읽은 회차 */}
            <View style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: C.text }}>최소 읽은 회차</Text>
                <Text style={{ color: C.sub, fontSize: 12 }}>이 수 이하면 보충 대상</Text>
              </View>
              <TextInput
                value={String(supplementSettings.minReadCount ?? DEFAULT_SUPPLEMENT_SETTINGS.minReadCount)}
                onChangeText={(t) => updateSetting("minReadCount", Number(t) || 0)}
                keyboardType="number-pad"
                style={{ 
                  width: 60, 
                  textAlign: "center",
                  backgroundColor: C.bg || "#F5F7FB",
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 8,
                  paddingVertical: 8,
                  color: C.text,
                }}
              />
            </View>

            {/* 체크박스 옵션들 */}
            {[
              { key: "noAuthor", label: "작가 미입력", desc: "작가명이 비어있는 작품" },
              { key: "noPlatform", label: "플랫폼 미입력", desc: "연재처가 비어있는 작품" },
              { key: "noCover", label: "표지 미등록", desc: "표지 이미지가 없는 작품" },
              { key: "noMajorGenre", label: "대장르 미설정", desc: "대장르가 없는 작품" },
              { key: "noTotalEpisodes", label: "전체 회차 미입력", desc: "전체 회차 수가 0인 작품" },
            ].map((opt) => (
              <View key={opt.key} style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: C.text }}>{opt.label}</Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>{opt.desc}</Text>
                </View>
                <Switch
                  value={supplementSettings[opt.key] !== false}
                  onValueChange={(v) => updateSetting(opt.key, v)}
                />
              </View>
            ))}
          </ScrollView>

          <OutlineButton
            title="닫기"
            onPress={onClose}
            style={{ marginTop: 16 }}
            theme={C}
          />
        </View>
      </View>
    </Modal>
  );
});

SupplementSettingsModal.displayName = "SupplementSettingsModal";

export default SupplementSettingsModal;
