/**
 * 백업 내보내기 모달 (v6.0 Context)
 * @module components/modals/ExportModal
 * @source_origin 원본 App.jsx 28566-28662줄
 * @description JSON 백업 데이터 생성 및 공유. Context 직접 소비.
 *
 * @bugfix v6.1.6
 * - [FIX] coordinateSystems 기본값 [] → {} (객체 타입 불일치 수정)
 *
 * @bugfix v6.1.7
 * - [FIX] buildUltraCompactBackup에 coverImages 미전달 → 표지 이미지 URL 백업 누락
 *   → collectCoverImageUrls(list) 호출 후 3번째 인자로 전달
 */
import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Share, Alert } from "react-native";
import { PrimaryButton, OutlineButton } from "../common/ui";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useTag } from "../../contexts/TagContext";
import { useModal } from "../../contexts/ModalContext";
import { buildUltraCompactBackup, collectCoverImageUrls } from "../../services/backupService";
import { all } from "../../database/connection";

const ExportModal = memo(() => {
  const { theme, appSettings } = useApp();
  const { list, plannedList } = useData();
  const tag = useTag();
  const { exportOpen, setExportOpen } = useModal();
  const C = theme;

  const [exportText, setExportText] = useState("");
  const [exportInfo, setExportInfo] = useState("");
  const exportFullJsonRef = useRef("");

  // 모달 열릴 때 백업 데이터 생성
  useEffect(() => {
    if (exportOpen && list) {
      (async () => {
        try {
          const matches = await all("SELECT * FROM matches ORDER BY created_at;");
          const backup = buildUltraCompactBackup(list, matches || [], collectCoverImageUrls(list)); // [FIX v6.1.7] 표지 이미지 URL 포함
          // 확장 데이터 추가
          if (backup) {
            backup.settings = {
              appSettings: appSettings || {},
              customTags: tag.customTags || [],
              comboTags: tag.comboTags || [],
              customComboTraits: tag.customComboTraits || [],
              customComboTargets: tag.customComboTargets || [],
              userMajorGenres: tag.userMajorGenres || [],
              userSubGenres: tag.userSubGenres || [],
              tagSentiments: tag.tagSentiments || {},
              pinnedTags: tag.pinnedTags || [],
              hiddenTags: tag.hiddenTags || [],
              tagRelations: tag.tagRelations || {},
              coordinateSystems: tag.coordinateSystems || {},  // [FIX v6.1.6] 객체 타입 유지 ([]→{})
            };
            if (plannedList?.length > 0) backup.planned = plannedList;
          }
          const fullJson = JSON.stringify(backup);
          exportFullJsonRef.current = fullJson;
          // 미리보기 텍스트 (너무 길면 자름)
          const preview = fullJson.length > 5000 ? fullJson.slice(0, 5000) + "\n...(이하 생략)" : fullJson;
          setExportText(preview);
          setExportInfo(`작품 ${list.length}개, 매칭 ${(matches||[]).length}개, v11 포맷 (${(fullJson.length / 1024).toFixed(1)}KB)`);
        } catch (e) {
          setExportText("오류: " + e.message);
          setExportInfo("백업 생성 실패");
        }
      })();
    }
  }, [exportOpen, list, plannedList, appSettings, tag]);

  const handleClose = useCallback(() => {
    setExportOpen(false);
    setExportText("");
    setExportInfo("");
    exportFullJsonRef.current = "";
  }, [setExportOpen]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ title: "웹소설 티어 백업(v11)", message: exportFullJsonRef.current || exportText || "" });
    } catch {
      Alert.alert("공유 실패", "데이터가 너무 큽니다.\n텍스트 박스를 길게 눌러 '전체 선택' 후 직접 복사해주세요.");
    }
  }, [exportText]);

  if (!exportOpen) return null;
  return (
    <Modal visible={exportOpen} animationType="slide" onRequestClose={handleClose} transparent>
      <View style={{ flex: 1, backgroundColor: C.modal || "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "90%" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}>📦 백업 데이터 내보내기</Text>
          <Text style={{ color: C.sub, marginBottom: 8 }}>{exportInfo}</Text>
          <Text style={{ color: C.sub, marginBottom: 12, fontSize: 12 }}>💡 텍스트 박스를 길게 눌러 "전체 선택" 후 복사하세요.{"\n"}   또는 아래 "공유 시도" 버튼을 사용하세요.</Text>
          <TextInput value={exportText} editable={false} multiline selectTextOnFocus
            style={{ backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontSize: 11, color: C.text, height: 250, textAlignVertical: "top", fontFamily: "monospace" }}
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <PrimaryButton title="📤 공유 시도" onPress={handleShare} style={{ flex: 1 }} theme={C} />
            <OutlineButton title="닫기" onPress={handleClose} style={{ flex: 1 }} theme={C} />
          </View>
        </View>
      </View>
    </Modal>
  );
});
ExportModal.displayName = "ExportModal";
export default ExportModal;
