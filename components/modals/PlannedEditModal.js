/**
 * 예정 작품 편집 모달 (v6.0 Context)
 * @module components/modals/PlannedEditModal
 * @source_origin 원본 App.jsx 29282-29763줄
 *
 * @bugfix v6.1.2
 * - [FIX] openTagSelect 콜백에서 tags를 배열로 설정 → updatePlannedNovel의 .trim() 호출 시 TypeError
 *   → Array.isArray 체크 후 .join(",")으로 문자열 변환
 *
 * @description 예정 작품 정보 편집. Context 직접 소비.
 */
import React, { memo, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Label, Chip, PrimaryButton, OutlineButton } from "../common/ui";
import { PLATFORM_OPTIONS, WORK_STATUS_OPTIONS } from "../../constants/config";
import { parsePlatforms } from "../../utils/helpers";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

const PRIORITY_OPTIONS = [
  { value: 3, label: "🔥 높음", color: "#ef4444" },
  { value: 2, label: "⭐ 보통", color: "#f59e0b" },
  { value: 1, label: "📋 낮음", color: "#6b7280" },
];
const EXPECTED_TIER_OPTIONS = ["S", "A", "B+", "B", "B-", "C", "모름"];

const PlannedEditModal = memo(() => {
  const { theme } = useApp();
  const { updatePlanned, removePlanned, pickImage } = useData();
  const { plannedEditOpen, editingPlanned, setEditingPlanned, closePlannedEdit, openUrl, openCoverSelect, openTagSelect } = useModal();
  const C = theme;

  const plannedEditItem = editingPlanned;
  const setPlannedEditItem = setEditingPlanned;

  const togglePlatform = useCallback((p) => {
    if (!plannedEditItem) return;
    const cur = parsePlatforms(plannedEditItem.platforms);
    const next = cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p];
    setPlannedEditItem({ ...plannedEditItem, platforms: JSON.stringify(next) });
  }, [plannedEditItem, setPlannedEditItem]);

  const handleSave = useCallback(async () => {
    if (!plannedEditItem) return;
    await updatePlanned(plannedEditItem);
    closePlannedEdit();
  }, [plannedEditItem, updatePlanned, closePlannedEdit]);

  const handleRemove = useCallback(async () => {
    if (!plannedEditItem) return;
    closePlannedEdit();
    await removePlanned(plannedEditItem.id);
  }, [plannedEditItem, removePlanned, closePlannedEdit]);

  const handlePickImage = useCallback(async () => {
    const uri = await pickImage();
    if (uri) setPlannedEditItem({ ...plannedEditItem, cover_image: uri });
  }, [pickImage, plannedEditItem, setPlannedEditItem]);

  const handleTagSelect = useCallback(() => {
    openTagSelect((selected) => {
      if (plannedEditItem) {
        // TagSelectModal은 배열을 반환하므로 쉼표 구분 문자열로 변환
        const tagString = Array.isArray(selected) ? selected.join(",") : (selected || "");
        setPlannedEditItem({ ...plannedEditItem, tags: tagString });
      }
    });
  }, [openTagSelect, plannedEditItem, setPlannedEditItem]);

  if (!plannedEditOpen || !plannedEditItem) return null;
  return (
    <Modal visible={plannedEditOpen} animationType="slide" onRequestClose={closePlannedEdit} transparent>
      <View style={{ flex: 1, backgroundColor: C.modal || "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closePlannedEdit} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "85%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>📋 예정 작품 수정</Text>
            <TouchableOpacity onPress={handleRemove} style={{ padding: 6 }}>
              <Text style={{ color: C.warn, fontSize: 13 }}>🗑 삭제</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator>
            <Label theme={C}>제목 *</Label>
            <TextInput value={plannedEditItem.title || ""} onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, title: t })} placeholderTextColor={C.sub}
              style={{ backgroundColor: C.bg || "#F5F7FB", borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text, marginBottom: 10 }} />
            <Label theme={C}>작가</Label>
            <TextInput value={plannedEditItem.author || ""} onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, author: t })} placeholderTextColor={C.sub}
              style={{ backgroundColor: C.bg || "#F5F7FB", borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text, marginBottom: 10 }} />
            <Label theme={C}>태그</Label>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <TextInput value={plannedEditItem.tags || ""} onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, tags: t })} placeholder="쉼표로 구분" placeholderTextColor={C.sub}
                style={{ flex: 1, backgroundColor: C.bg || "#F5F7FB", borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text }} />
              <OutlineButton title="🏷️ 고르기" onPress={handleTagSelect} theme={C} />
            </View>
            <Label theme={C}>연재처</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
              {PLATFORM_OPTIONS.map(p => <Chip key={p} label={p} active={parsePlatforms(plannedEditItem.platforms).includes(p)} onPress={() => togglePlatform(p)} theme={C} />)}
            </View>
            <Label theme={C}>작품 상태</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
              {WORK_STATUS_OPTIONS.map(opt => <Chip key={opt.key} label={opt.label} active={plannedEditItem.work_status === opt.key} onPress={() => setPlannedEditItem({ ...plannedEditItem, work_status: opt.key })} theme={C} />)}
            </View>
            <Label theme={C}>우선순위</Label>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              {PRIORITY_OPTIONS.map(opt => <Chip key={opt.value} label={opt.label} active={plannedEditItem.priority === opt.value} onPress={() => setPlannedEditItem({ ...plannedEditItem, priority: opt.value })} theme={C} />)}
            </View>
            <Label theme={C}>예상 티어</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
              {EXPECTED_TIER_OPTIONS.map(tier => <Chip key={tier} label={tier} active={plannedEditItem.expected_tier === tier} onPress={() => setPlannedEditItem({ ...plannedEditItem, expected_tier: tier })} theme={C} />)}
            </View>
            <Label theme={C}>전체 회차 수</Label>
            <TextInput value={String(plannedEditItem.total_episodes || "")} onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, total_episodes: t })} keyboardType="number-pad" placeholder="예: 120" placeholderTextColor={C.sub}
              style={{ backgroundColor: C.bg || "#F5F7FB", borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text, marginBottom: 10 }} />
            <Label theme={C}>표지 이미지</Label>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
              {plannedEditItem.cover_image ? (
                <ExpoImage source={{ uri: plannedEditItem.cover_image }} style={{ width: 50, height: 70, borderRadius: 6 }} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}><Text style={{ color: C.sub, fontSize: 10 }}>없음</Text></View>
              )}
              <OutlineButton title="URL" onPress={() => openUrl((url) => setPlannedEditItem({ ...plannedEditItem, cover_image: url }))} style={{ minWidth: 60 }} theme={C} />
              <OutlineButton title="갤러리" onPress={handlePickImage} style={{ minWidth: 70 }} theme={C} />
              <OutlineButton title="라이브러리" onPress={() => openCoverSelect("plannedEdit")} color={C.primary} style={{ minWidth: 90 }} theme={C} />
              {plannedEditItem.cover_image && <OutlineButton title="삭제" onPress={() => setPlannedEditItem({ ...plannedEditItem, cover_image: "" })} color={C.warn} style={{ minWidth: 60 }} theme={C} />}
            </View>
            <Label theme={C}>메모</Label>
            <TextInput value={plannedEditItem.note || ""} onChangeText={(t) => setPlannedEditItem({ ...plannedEditItem, note: t })} multiline placeholder="관심 갖게 된 이유, 추천받은 곳 등" placeholderTextColor={C.sub}
              style={{ backgroundColor: C.bg || "#F5F7FB", borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text, minHeight: 80, marginBottom: 10 }} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <PrimaryButton title="저장" onPress={handleSave} style={{ flex: 1 }} theme={C} />
              <OutlineButton title="닫기" onPress={closePlannedEdit} style={{ flex: 1 }} theme={C} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});
PlannedEditModal.displayName = "PlannedEditModal";
export default PlannedEditModal;
