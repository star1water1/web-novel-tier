/**
 * 대진 기록 모달 (v6.0 Context)
 * @module components/modals/LogModal
 * @source_origin 원본 App.jsx 28102-28242줄
 * @description 특정 작품의 대진 기록 조회/관리. Context 직접 소비.
 */
import React, { memo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { OutlineButton } from "../common/ui";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

const LogModal = memo(() => {
  const { theme } = useApp();
  const { getNovelMatchLogs, deleteMatch, flipMatchWinner, loadList } = useData();
  const { logOpen, logTarget, closeLogs } = useModal();
  const C = theme;
  const [logs, setLogs] = useState([]);

  // logTarget 변경 시 로그 로딩
  useEffect(() => {
    if (logOpen && logTarget?.id) {
      (async () => {
        try { setLogs(await getNovelMatchLogs(logTarget.id) || []); }
        catch { setLogs([]); }
      })();
    } else setLogs([]);
  }, [logOpen, logTarget?.id, getNovelMatchLogs]);

  const refreshLogs = useCallback(async () => {
    if (logTarget?.id) setLogs(await getNovelMatchLogs(logTarget.id) || []);
  }, [logTarget, getNovelMatchLogs]);

  const handleFlipWinner = useCallback(async (mid) => {
    await flipMatchWinner(mid); await loadList(); await refreshLogs();
  }, [flipMatchWinner, loadList, refreshLogs]);

  const handleDeleteLog = useCallback((mid) => {
    Alert.alert("확인", "이 대진 기록을 삭제할까요?", [
      { text: "취소" },
      { text: "삭제", style: "destructive", onPress: async () => {
        await deleteMatch(mid); await loadList(); await refreshLogs();
      }},
    ]);
  }, [deleteMatch, loadList, refreshLogs]);

  if (!logOpen) return null;
  return (
    <Modal visible={logOpen} animationType="slide" onRequestClose={closeLogs} transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeLogs} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "85%" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 8, color: C.text }}>대진 기록</Text>
          {logTarget && (<>
            <Text style={{ color: C.sub, marginBottom: 8 }}>{logTarget.title}</Text>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {logs.length === 0 ? (
                <Text style={{ color: C.sub }}>기록이 없습니다.</Text>
              ) : logs.map((item) => {
                const youAreA = item.a_id === logTarget.id;
                const oppTitle = youAreA ? item.b_title : item.a_title;
                const win = item.winner_id === logTarget.id;
                return (
                  <View key={item.id} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                    <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>{oppTitle || "(삭제됨)"}</Text>
                    <Text style={{ color: C.sub, marginTop: 4 }}>{win ? "🏆 승" : "❌ 패"} · {new Date(item.created_at || 0).toLocaleString()}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      <OutlineButton title="승자 변경" onPress={() => handleFlipWinner(item.id)} style={{ flex: 1 }} theme={C} />
                      <OutlineButton title="삭제" onPress={() => handleDeleteLog(item.id)} color={C.warn} style={{ flex: 1 }} theme={C} />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <OutlineButton title="닫기" onPress={closeLogs} style={{ marginTop: 12 }} theme={C} />
          </>)}
        </View>
      </View>
    </Modal>
  );
});
LogModal.displayName = "LogModal";
export default LogModal;
