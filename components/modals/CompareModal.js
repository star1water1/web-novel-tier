/**
 * 작품 비교 모달 (v6.0 Context)
 * @module components/modals/CompareModal
 * @source_origin 원본 App.jsx 28663-28745줄
 * @description 두 작품 비교. Context 직접 소비.
 */
import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { OutlineButton } from "../common/ui";
import { TierTag, StatusBadge, WorkStatusBadge } from "../common/ui";
import { parsePlatforms } from "../../utils/helpers";
import { useApp } from "../../contexts/AppContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

const getWinRate = (w, l) => {
  const wins = Number(w) || 0, losses = Number(l) || 0;
  return (wins + losses === 0) ? "0" : ((wins / (wins + losses)) * 100).toFixed(1);
};

const CompareModal = memo(() => {
  const { theme } = useApp();
  const { list } = useData();
  const { compareOpen, compareIds, closeCompare } = useModal();
  const C = theme;

  // compareIds → 실제 작품 객체 resolve
  const compareNovels = useMemo(() => {
    if (!compareIds || compareIds.length !== 2 || !list) return null;
    return compareIds.map(id => list.find(n => n.id === id)).filter(Boolean);
  }, [compareIds, list]);

  if (!compareOpen) return null;
  return (
    <Modal visible={compareOpen} animationType="slide" onRequestClose={closeCompare} transparent>
      <View style={{ flex: 1, backgroundColor: C.modal || "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeCompare} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "90%" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 12, color: C.text }}>작품 비교</Text>
          {compareNovels?.length === 2 && (
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {compareNovels.map((n) => {
                  const plats = parsePlatforms(n.platforms);
                  const winRate = getWinRate(n.wins, n.losses);
                  return (
                    <View key={n.id} style={{ flex: 1, padding: 10, backgroundColor: C.bg, borderRadius: 10 }}>
                      {n.cover_image && (
                        <ExpoImage source={{ uri: n.cover_image }} style={{ width: "100%", height: 100, borderRadius: 6, marginBottom: 6 }} contentFit="cover" cachePolicy="memory-disk" />
                      )}
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <TierTag rating={n.rating} novel={n} />
                        <Text style={{ marginLeft: 6, fontWeight: "700", color: C.text, flex: 1, fontSize: 13 }} numberOfLines={2}>{n.title}</Text>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        <StatusBadge status={n.status} /><WorkStatusBadge workStatus={n.work_status} />
                      </View>
                      <Text style={{ color: C.sub, marginTop: 6, fontSize: 12 }}>레이팅: {n.rating?.toFixed(1)}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>승률: {winRate}%</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>전적: {n.wins}승 {n.losses}패</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>읽음: {n.read_count}회</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>작가: {n.author || "-"}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>플랫폼: {plats.join(",") || "-"}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ marginTop: 14, padding: 10, backgroundColor: C.bg, borderRadius: 10 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>차이</Text>
                <Text style={{ color: C.sub }}>레이팅: {Math.abs((compareNovels[0]?.rating||0) - (compareNovels[1]?.rating||0)).toFixed(1)}점</Text>
                <Text style={{ color: C.sub }}>승률: {Math.abs(parseFloat(getWinRate(compareNovels[0]?.wins, compareNovels[0]?.losses)) - parseFloat(getWinRate(compareNovels[1]?.wins, compareNovels[1]?.losses))).toFixed(1)}%</Text>
              </View>
            </ScrollView>
          )}
          <OutlineButton title="닫기" onPress={closeCompare} style={{ marginTop: 12 }} theme={C} />
        </View>
      </View>
    </Modal>
  );
});
CompareModal.displayName = "CompareModal";
export default CompareModal;
