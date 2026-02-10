/**
 * JSON 가져오기 모달 (v6.0 Context)
 * @module components/modals/ImportModal
 * @source_origin 원본 App.jsx 28411-28565줄
 * 
 * @bugfix v6.1.5
 * - [FIX] Import 시 settings 키가 camelCase(customTags)로 DB에 저장되지만
 *   loadTagSettings는 snake_case(custom_tags)로 읽음 → 설정 복원 실패
 *   → KEY_MAP으로 camelCase→snake_case 변환 후 저장
 * - [FIX] v11 백업에서 parsed.settings 접근 → parseV11Backup은 settings 미반환 → undefined
 *   → data.settings(원본 JSON)에서 직접 읽도록 수정
 * - [FIX] 예정 작품(planned) 복원 누락 → data.planned 데이터를 planned_novels 테이블에 삽입
 * - [FIX] v11 Import INSERT에 read_count_updated_at, aliases 컬럼 누락 → 추가
 * - [FIX] v11 Import: parseV11Backup 반환 novels에 id 없음(undefined) + matches가 인덱스 참조
 *   → UUID 생성 후 인덱스→ID 매핑 테이블로 변환. 기존엔 전체 가져오기 작동불능
 *
 * @bugfix v6.1.6
 * - [FIX] planned_novels 복원 INSERT에 link, major_genre, sub_genre 누락 → 추가
 *
 * @description JSON 백업 가져오기. Context 직접 소비 + 내부 상태 관리.
 */
import React, { memo, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { PrimaryButton, OutlineButton } from "../common/ui";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useTag } from "../../contexts/TagContext";
import { useModal } from "../../contexts/ModalContext";
import { validateImportData, parseV11Backup } from "../../services/backupService";
import { exec, execBatch, all } from "../../database/connection";
import { uuid } from "../../utils/helpers"; // [FIX v6.1.5] v11 import용 ID 생성

const ImportModal = memo(() => {
  const { theme, setIsLoading } = useApp();
  const { loadList, loadPlanned } = useData();
  const { loadTagSettings } = useTag();
  const { importOpen, setImportOpen } = useModal();
  const C = theme;

  // ── 내부 상태 ──
  const [importText, setImportText] = useState("");
  const [importValidation, setImportValidation] = useState(null);

  const handleClose = useCallback(() => {
    setImportOpen(false);
    setImportValidation(null);
    setImportText("");
  }, [setImportOpen]);

  const handleTextChange = useCallback((t) => {
    setImportText(t);
    setImportValidation(null);
  }, []);

  const handleValidate = useCallback(() => {
    const result = validateImportData(importText);
    setImportValidation(result);
  }, [importText]);

  const handleImport = useCallback(async () => {
    if (!importValidation || !importValidation.valid) {
      Alert.alert("알림", "먼저 '검증' 버튼을 눌러 검증해주세요.");
      return;
    }
    try {
      const text = importText.trim();
      if (!text) { Alert.alert("오류", "JSON 데이터를 입력해주세요."); return; }
      const data = JSON.parse(text);

      // v9~v11 초압축 포맷
      if (data && [9, 10, 11].includes(data.v) && Array.isArray(data.N)) {
        const parsed = parseV11Backup(data);
        if (!parsed || parsed.error) {
          Alert.alert("오류", parsed?.error || "파싱 실패");
          return;
        }
        Alert.alert(
          "최종 확인",
          `${parsed.novels?.length || 0}개 작품과 ${parsed.matches?.length || 0}개 대진 기록을 가져옵니다.\n\n⚠️ 기존 데이터는 모두 삭제됩니다!`,
          [
            { text: "취소" },
            { text: "가져오기", onPress: async () => {
              setIsLoading(true);
              try {
                await execBatch([
                  { sql: "DELETE FROM novels;", params: [] },
                  { sql: "DELETE FROM matches;", params: [] },
                ]);
                // [FIX v6.1.5] 소설 삽입: UUID 생성 + 인덱스→ID 매핑 테이블 구축
                const novelIdMap = []; // index → generated UUID
                if (parsed.novels?.length > 0) {
                  // 1단계: 각 소설에 UUID 할당
                  for (let i = 0; i < parsed.novels.length; i++) {
                    novelIdMap.push(uuid());
                  }
                  // 2단계: DB 삽입
                  const batchSize = 50;
                  for (let i = 0; i < parsed.novels.length; i += batchSize) {
                    const chunk = parsed.novels.slice(i, i + batchSize);
                    const queries = chunk.map((n, ci) => ({
                      sql: `INSERT OR REPLACE INTO novels (id,title,author,tags,platforms,rating,rd,wins,losses,match_count,status,work_status,read_count,total_episodes,note,created_at,manual_tier,cover_image,pinned,major_genre,sub_genre,gaiden_status,gaiden_read_count,gaiden_total_episodes,reread_count,memorable_quote,link,awards,tag_data,read_count_updated_at,aliases) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                      params: [novelIdMap[i + ci],n.title||"",n.author||"",n.tags||"",n.platforms||"",n.rating||1500,n.rd||350,n.wins||0,n.losses||0,n.match_count||0,n.status||"reading",n.work_status||"ongoing",n.read_count||0,n.total_episodes||0,n.note||"",n.created_at||Date.now(),n.manual_tier||"",n.cover_image||"",n.pinned||0,n.major_genre||"",n.sub_genre||"",n.gaiden_status||"none",n.gaiden_read_count||0,n.gaiden_total_episodes||0,n.reread_count||1,n.memorable_quote||"",n.link||"",n.awards||"",n.tag_data||"",n.read_count_updated_at||Date.now(),n.aliases||""],
                    }));
                    await execBatch(queries);
                  }
                }
                // [FIX v6.1.5] 매칭 삽입: 인덱스 참조 → UUID 변환
                if (parsed.matches?.length > 0) {
                  const batchSize = 100;
                  for (let i = 0; i < parsed.matches.length; i += batchSize) {
                    const chunk = parsed.matches.slice(i, i + batchSize);
                    const queries = chunk.map(m => {
                      const aId = m.a_idx < novelIdMap.length ? novelIdMap[m.a_idx] : null;
                      const bId = m.b_idx < novelIdMap.length ? novelIdMap[m.b_idx] : null;
                      const wId = m.winner_idx < novelIdMap.length ? novelIdMap[m.winner_idx] : null;
                      return {
                        sql: `INSERT INTO matches (id,a_id,b_id,winner_id,decided_by,gap_when_matched,k_factor_used,created_at) VALUES (?,?,?,?,?,?,?,?)`,
                        params: [uuid(),aId,bId,wId,m.decided_by||"user",0,32,Date.now()],
                      };
                    });
                    await execBatch(queries);
                  }
                }
                // 설정 복원 - [FIX v6.1.5] (1) parsed.settings→data.settings (parseV11Backup는 settings 미반환)
                //                          (2) Export camelCase→DB snake_case 키 매핑
                if (data.settings) {
                  const KEY_MAP = {
                    customTags: "custom_tags",
                    comboTags: "combo_tags",
                    customComboTraits: "custom_combo_traits",
                    customComboTargets: "custom_combo_targets",
                    userMajorGenres: "user_major_genres",
                    userSubGenres: "user_sub_genres",
                    tagSentiments: "tag_sentiments",
                    pinnedTags: "pinned_tags",
                    hiddenTags: "hidden_tags",
                    tagRelations: "tag_relations",
                    coordinateSystems: "coordinate_systems",
                    appSettings: "app_settings",
                  };
                  for (const [k, v] of Object.entries(data.settings)) {
                    const dbKey = KEY_MAP[k] || k;
                    await exec(`INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`, [dbKey, typeof v === "string" ? v : JSON.stringify(v)]);
                  }
                }
                // [FIX v6.1.5] 예정 작품 복원 (기존: data.planned 무시 → 예정작 소실)
                if (data.planned && Array.isArray(data.planned) && data.planned.length > 0) {
                  await exec("DELETE FROM planned_novels;", []);
                  const batchSize = 50;
                  for (let i = 0; i < data.planned.length; i += batchSize) {
                    const chunk = data.planned.slice(i, i + batchSize);
                    const queries = chunk.map(p => ({
                      sql: `INSERT OR REPLACE INTO planned_novels (id,title,author,tags,platforms,note,total_episodes,priority,cover_image,work_status,expected_tier,created_at,link,major_genre,sub_genre) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                      params: [p.id||('p_'+Date.now()+'_'+Math.random().toString(36).slice(2)),p.title||"",p.author||"",p.tags||"",p.platforms||"[]",p.note||"",p.total_episodes||0,p.priority||2,p.cover_image||"",p.work_status||"ongoing",p.expected_tier||"모름",p.created_at||Date.now(),p.link||"",p.major_genre||"",p.sub_genre||""],
                    }));
                    await execBatch(queries);
                  }
                }
                // 데이터 다시 로드
                await loadList();
                await loadPlanned();
                await loadTagSettings();
                handleClose();
                Alert.alert("완료", "데이터를 성공적으로 가져왔습니다.");
              } catch (e) {
                Alert.alert("오류", "가져오기 중 오류:\n" + e.message);
              } finally {
                setIsLoading(false);
              }
            }},
          ]
        );
      } else {
        Alert.alert("오류", "지원하지 않는 백업 형식입니다. (v9~v11 지원)");
      }
    } catch (e) {
      Alert.alert("오류", "JSON 파싱 실패:\n" + e.message);
    }
  }, [importText, importValidation, loadList, loadPlanned, loadTagSettings, setIsLoading, handleClose]);

  if (!importOpen) return null;
  return (
    <Modal visible={importOpen} animationType="slide" onRequestClose={handleClose} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "85%" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}>JSON 데이터 입력</Text>
          <Text style={{ color: C.sub, marginBottom: 12 }}>백업한 JSON 데이터를 아래에 붙여넣으세요</Text>
          <TextInput value={importText} onChangeText={handleTextChange} multiline placeholder='{"v":9, "N":[...], "M":"..."}' placeholderTextColor="#9aa8bd"
            style={{ backgroundColor: "#f8f9fa", borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontSize: 14, color: C.text, height: importValidation ? 150 : 250, textAlignVertical: "top" }}
          />
          {importValidation && (
            <ScrollView style={{ maxHeight: 150, marginTop: 12, backgroundColor: importValidation.valid ? "#f0fdf4" : "#fef2f2", borderRadius: 12, padding: 12 }}>
              <Text style={{ fontWeight: "700", color: importValidation.valid ? "#166534" : "#dc2626", marginBottom: 8 }}>
                {importValidation.valid ? "✅ 유효한 데이터" : "❌ 유효하지 않은 데이터"}
              </Text>
              {importValidation.valid && (<>
                <Text style={{ color: "#166534", marginBottom: 4 }}>📚 작품 수: {importValidation.novelCount || 0}개</Text>
                <Text style={{ color: "#166534", marginBottom: 4 }}>⚔️ 매칭 수: {importValidation.matchCount || 0}개</Text>
                {importValidation.format && <Text style={{ color: "#166534" }}>📝 포맷: {importValidation.format}</Text>}
              </>)}
              {!importValidation.valid && importValidation.error && <Text style={{ color: "#dc2626" }}>오류: {importValidation.error}</Text>}
            </ScrollView>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <OutlineButton title="검증" onPress={handleValidate} style={{ flex: 1 }} theme={C} />
            <PrimaryButton title="가져오기" onPress={handleImport} style={{ flex: 1 }} theme={C} />
            <OutlineButton title="취소" onPress={handleClose} style={{ flex: 1 }} theme={C} />
          </View>
        </View>
      </View>
    </Modal>
  );
});
ImportModal.displayName = "ImportModal";
export default ImportModal;
