/**
 * 작품 편집 모달 (v6.0 Context)
 * @module components/modals/EditNovelModal
 * @source_origin 원본 App.jsx 27600-28101줄 (501줄)
 *
 * @bugfix v6.1.2
 * - [FIX] openTagSelect 콜백에서 tags를 배열로 설정 → updateNovel의 .trim() 호출 시 TypeError
 *   → Array.isArray 체크 후 .join(",")으로 문자열 변환
 *
 * @description 작품 정보 편집. Context 직접 소비.
 */
import React, { memo, useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Label, Chip, PrimaryButton, OutlineButton } from "../common/ui";
import { TierTag, GenreBadge } from "../common/ui";
import { PLATFORM_OPTIONS, STATUS_OPTIONS, WORK_STATUS_OPTIONS, GAIDEN_STATUS_OPTIONS } from "../../constants/config";
import { AWARD_META } from "../../constants/config";
import { MAJOR_GENRES, SUB_GENRES } from "../../constants/tags";
import { parsePlatforms } from "../../utils/helpers";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useTag } from "../../contexts/TagContext";
import { useModal } from "../../contexts/ModalContext";

const EditNovelModal = memo(() => {
  const { theme, appSettings } = useApp();
  const { updateNovel, removeNovel: removeNovelFromDB, pickImage } = useData();
  const { userMajorGenres, userSubGenres } = useTag();
  const modal = useModal();
  const C = theme;
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // Context에서 편집 상태 가져오기
  const visible = modal.editOpen;
  const onClose = modal.closeEdit;
  const editItem = modal.editForm?.editItem;
  const setEditItem = modal.editForm?.setEditItem;

  // 편집 폼 상태 (ModalContext.editForm에서 제공)
  const editCoverImage = modal.editForm?.editCoverImage || "";
  const setEditCoverImage = modal.editForm?.setEditCoverImage;
  const editRating = modal.editForm?.editRating || "";
  const setEditRating = modal.editForm?.setEditRating;
  const editStatus = modal.editForm?.editStatus || "reading";
  const setEditStatus = modal.editForm?.setEditStatus;
  const editWorkStatus = modal.editForm?.editWorkStatus || "ongoing";
  const setEditWorkStatus = modal.editForm?.setEditWorkStatus;
  const editGaidenStatus = modal.editForm?.editGaidenStatus || "none";
  const setEditGaidenStatus = modal.editForm?.setEditGaidenStatus;
  const editAwards = modal.editForm?.editAwards || [];
  const setEditAwards = modal.editForm?.setEditAwards;
  const awardYearInput = modal.editForm?.awardYearInput || String(new Date().getFullYear());
  const setAwardYearInput = modal.editForm?.setAwardYearInput;
  const awardTypeInput = modal.editForm?.awardTypeInput || "nomination";
  const setAwardTypeInput = modal.editForm?.setAwardTypeInput;

  // 어댑터 함수 (기존 JSX 호환)
  const openUrlModal = useCallback((setter) => {
    modal.openUrl(setter);
  }, [modal]);

  const pickImageFromGallery = useCallback(async (setter) => {
    const uri = await pickImage();
    if (uri && setter) setter(uri);
  }, [pickImage]);

  const setCoverSelectTarget = useCallback(() => {}, []); // dummy (openCoverSelect에 통합)
  const setCoverSelectModalOpen = useCallback(() => {
    modal.openCoverSelect("edit");
  }, [modal]);

  const openTagSelectForEdit = useCallback(() => {
    if (!editItem) return;
    modal.openTagSelect((selected) => {
      if (setEditItem && editItem) {
        // TagSelectModal은 배열을 반환하므로 쉼표 구분 문자열로 변환
        const tagString = Array.isArray(selected) ? selected.join(",") : (selected || "");
        setEditItem({ ...editItem, tags: tagString });
      }
    });
  }, [modal, editItem, setEditItem]);

  const removeNovel = useCallback((id) => {
    onClose();
    removeNovelFromDB(id);
  }, [onClose, removeNovelFromDB]);

  // 저장 함수
  const saveEdit = useCallback(async () => {
    if (!editItem) return;
    const updated = {
      ...editItem,
      cover_image: editCoverImage,
      rating: parseFloat(editRating) || editItem.rating,
      status: editStatus,
      work_status: editWorkStatus,
      gaiden_status: editGaidenStatus,
      gaiden_read_count: parseInt(modal.editForm?.editGaidenReadCount) || 0,
      gaiden_total_episodes: parseInt(modal.editForm?.editGaidenTotalEpisodes) || 0,
      reread_count: parseInt(modal.editForm?.editRereadCount) || 1,
      memorable_quote: modal.editForm?.editMemorableQuote || "",
      link: modal.editForm?.editLink || "",
      awards: JSON.stringify(editAwards),
    };
    await updateNovel(updated);
    onClose();
  }, [editItem, editCoverImage, editRating, editStatus, editWorkStatus, editGaidenStatus, editAwards, modal.editForm, updateNovel, onClose]);

  // 플랫폼 토글
  const togglePlatform = useCallback((p) => {
    if (!editItem) return;
    const cur = parsePlatforms(editItem.platforms);
    const next = cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p];
    setEditItem({ ...editItem, platforms: JSON.stringify(next) });
  }, [editItem, setEditItem]);

  // 태그 변경 시 장르 자동 감지
  const handleTagsChange = useCallback((newTags) => {
    if (!editItem) return;
    const inputTags = newTags.split(",").map(t => t.trim()).filter(Boolean);
    const allMajor = [...MAJOR_GENRES, ...(userMajorGenres || [])];
    const allSub = [...SUB_GENRES, ...(userSubGenres || [])];
    const detectedMajor = inputTags.filter(tag => allMajor.some(m => m.toLowerCase() === tag.toLowerCase()));
    const detectedSub = inputTags.filter(tag => allSub.some(s => s.toLowerCase() === tag.toLowerCase()));
    const normalizedMajor = detectedMajor.map(tag => allMajor.find(m => m.toLowerCase() === tag.toLowerCase()) || tag);
    const normalizedSub = detectedSub.map(tag => allSub.find(s => s.toLowerCase() === tag.toLowerCase()) || tag);
    setEditItem({ ...editItem, tags: newTags, major_genre: normalizedMajor.length > 0 ? JSON.stringify(normalizedMajor) : "", sub_genre: normalizedSub.length > 0 ? JSON.stringify(normalizedSub) : "" });
  }, [editItem, setEditItem, userMajorGenres, userSubGenres]);

  // 수상 추가
  const addAward = useCallback(() => {
    const y = awardYearInput?.trim();
    if (!y) { Alert.alert("안내", "연도를 입력해주세요."); return; }
    if (!awardTypeInput) { Alert.alert("안내", "수상 종류를 선택해주세요."); return; }
    setEditAwards(prev => [...(prev || []), { year: y, type: awardTypeInput }]);
  }, [awardYearInput, awardTypeInput, setEditAwards]);

  // 장르 파싱
  const parsedMajorGenres = (() => { try { const a = JSON.parse(editItem?.major_genre || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } })();
  const parsedSubGenres = (() => { try { const a = JSON.parse(editItem?.sub_genre || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } })();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={{ flex: 1, backgroundColor: C.modal || "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={{
          backgroundColor: C.card,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          maxHeight: "85%",
        }}>
          {/* 헤더 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
              작품 수정
            </Text>
            {editItem && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  removeNovel(editItem.id);
                }}
                style={{ padding: 6 }}
              >
                <Text style={{ color: C.warn, fontSize: 13 }}>🗑 삭제</Text>
              </TouchableOpacity>
            )}
          </View>

          {editItem && (
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {/* 표지 이미지 */}
              <Label theme={C}>표지 이미지</Label>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
                {editCoverImage ? (
                  <ExpoImage 
                    source={{ uri: editCoverImage }} 
                    style={{ width: 50, height: 70, borderRadius: 6 }} 
                    contentFit="cover" 
                    cachePolicy="memory-disk" 
                  />
                ) : (
                  <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: C.sub, fontSize: 10 }}>없음</Text>
                  </View>
                )}
                <OutlineButton title="URL" onPress={() => openUrlModal(setEditCoverImage)} style={{ minWidth: 60 }} theme={C} />
                <OutlineButton title="갤러리" onPress={() => pickImageFromGallery(setEditCoverImage)} style={{ minWidth: 70 }} theme={C} />
                <OutlineButton 
                  title="라이브러리" 
                  onPress={() => {
                    modal.openCoverSelect("edit");
                  }} 
                  color={C.primary}
                  style={{ minWidth: 90 }}
                  theme={C}
                />
                {editCoverImage && (
                  <OutlineButton title="삭제" onPress={() => setEditCoverImage("")} color={C.warn} style={{ minWidth: 60 }} theme={C} />
                )}
              </View>

              {/* 제목 */}
              <Label theme={C}>제목</Label>
              <TextInput
                value={editItem.title || ""}
                onChangeText={(t) => setEditItem({ ...editItem, title: t })}
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
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

              {/* 작가 */}
              <Label theme={C}>작가</Label>
              <TextInput
                value={editItem.author || ""}
                onChangeText={(t) => setEditItem({ ...editItem, author: t })}
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
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

              {/* 태그 */}
              <Label theme={C}>태그 (쉼표 구분)</Label>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <TextInput
                  value={editItem.tags || ""}
                  onChangeText={handleTagsChange}
                  placeholderTextColor={C.sub}
                  style={{
                    flex: 1,
                    backgroundColor: C.bg || "#F5F7FB",
                    borderWidth: 1,
                    borderColor: C.line,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: C.text,
                  }}
                />
                <OutlineButton title="🏷️ 고르기" onPress={openTagSelectForEdit} theme={C} />
              </View>

              {/* 감지된 장르 표시 */}
              {(parsedMajorGenres.length > 0 || parsedSubGenres.length > 0) && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {parsedMajorGenres.map(g => <GenreBadge key={g} genre={g} type="major" />)}
                  {parsedSubGenres.map(g => <GenreBadge key={g} genre={g} type="sub" />)}
                </View>
              )}

              {/* 연재처 */}
              <Label theme={C}>연재처</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                {PLATFORM_OPTIONS.map(p => {
                  const cur = parsePlatforms(editItem.platforms);
                  return (
                    <Chip
                      key={p}
                      label={p}
                      active={cur.includes(p)}
                      onPress={() => togglePlatform(p)}
                      theme={C}
                    />
                  );
                })}
              </View>

              {/* 읽기 상태 */}
              <Label theme={C}>읽기 상태</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                {STATUS_OPTIONS.map(s => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    active={editStatus === s.key}
                    onPress={() => setEditStatus(s.key)}
                    theme={C}
                  />
                ))}
              </View>

              {/* 작품 상태 */}
              <Label theme={C}>작품 상태</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                {WORK_STATUS_OPTIONS.map(s => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    active={editWorkStatus === s.key}
                    onPress={() => setEditWorkStatus(s.key)}
                    theme={C}
                  />
                ))}
              </View>

              {/* 읽은 회차 수 */}
              <Label theme={C}>읽은 회차 수</Label>
              <TextInput
                value={String(editItem.read_count || 0)}
                onChangeText={(t) => setEditItem({ ...editItem, read_count: t })}
                keyboardType="number-pad"
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
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

              {/* 전체 회차 수 */}
              <Label theme={C}>전체 회차 수</Label>
              <TextInput
                value={String(editItem.total_episodes || 0)}
                onChangeText={(t) => setEditItem({ ...editItem, total_episodes: t })}
                keyboardType="number-pad"
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
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

              {/* 외전 상태 */}
              <Label theme={C}>외전 상태</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                {GAIDEN_STATUS_OPTIONS.map(s => (
                  <Chip
                    key={s.key}
                    label={s.label}
                    active={editGaidenStatus === s.key}
                    onPress={() => setEditGaidenStatus(s.key)}
                    theme={C}
                  />
                ))}
              </View>

              {/* 레이팅 직접 입력 */}
              <Label style={{ color: C.warn }} theme={C}>고급: 레이팅 직접 입력</Label>
              <TextInput
                value={editRating}
                onChangeText={setEditRating}
                keyboardType="numeric"
                placeholder="예: 1725.0"
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
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

              {/* 수상 설정 */}
              <Label theme={C}>수상 설정</Label>
              <Text style={{ color: C.sub, marginBottom: 8, fontSize: 12 }}>
                연도와 수상 종류를 선택한 뒤 "수상 추가"를 누르세요.
              </Text>
              
              <Label theme={C}>연도</Label>
              <TextInput
                value={awardYearInput}
                onChangeText={setAwardYearInput}
                keyboardType="number-pad"
                placeholder="예: 2024"
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: C.text,
                  marginBottom: 8,
                }}
              />

              <Label theme={C}>수상 종류</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                {Object.entries(AWARD_META).map(([key, meta]) => (
                  <Chip
                    key={key}
                    label={meta.label}
                    active={awardTypeInput === key}
                    onPress={() => setAwardTypeInput(key)}
                    theme={C}
                  />
                ))}
              </View>

              <PrimaryButton
                title="수상 추가"
                onPress={addAward}
                style={{ marginBottom: 8 }}
                theme={C}
              />

              {/* 등록된 수상 목록 */}
              {(editAwards || []).length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  {editAwards.map((a, idx) => {
                    const meta = AWARD_META[a.type] || { label: a.type };
                    return (
                      <View
                        key={`${a.year}-${a.type}-${idx}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: C.text }}>{a.year} {meta.label}</Text>
                        <OutlineButton
                          title="삭제"
                          onPress={() => setEditAwards(prev => prev.filter((_, i) => i !== idx))}
                          style={{ paddingVertical: 4, paddingHorizontal: 8 }}
                          theme={C}
                        />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* 메모 */}
              <Label theme={C}>메모</Label>
              <TextInput
                value={editItem.note || ""}
                onChangeText={(t) => setEditItem({ ...editItem, note: t })}
                multiline
                placeholderTextColor={C.sub}
                style={{
                  backgroundColor: C.bg || "#F5F7FB",
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: C.text,
                  minHeight: 80,
                  marginBottom: 10,
                }}
              />

              {/* 버튼 */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <PrimaryButton title="저장" onPress={saveEdit} style={{ flex: 1 }} theme={C} />
                <OutlineButton title="닫기" onPress={onClose} style={{ flex: 1 }} theme={C} />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
});

EditNovelModal.displayName = "EditNovelModal";

export default EditNovelModal;
