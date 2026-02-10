/**
 * 정보 보충 화면
 * @module screens/SupplementScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 정보 입력이 미흡한 작품 보충 화면
 * Context: useApp(theme, appSettings), useData(list), useFilter(supplementList), useModal(openEdit, setSupplementSettingsOpen)
 *
 * 로컬 상태:
 * - supplementCurrentNovel: 현재 보충 중인 작품
 */

import React, { memo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { H, Section, PrimaryButton, OutlineButton } from "../components/common/ui";
import { TierTag, tierBadge } from "../components/common/ui";
import { CoverImage } from "../components/novel/NovelCard";
import { parsePlatforms, getDisplayTier } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useFilter } from "../contexts/FilterContext";
import { useModal } from "../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 SupplementScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const SupplementScreen = memo(() => {
  const { theme, appSettings } = useApp();
  const { list } = useData();
  const { supplementList } = useFilter();
  const { openEdit, setSupplementSettingsOpen } = useModal();
  const C = theme;
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ── 로컬 상태: 현재 보충 중인 작품 ──
  const [supplementCurrentNovel, setSupplementCurrentNovel] = useState(null);

  const supplementCount = supplementList.length;

  // ─────────────────────────────────────────────────────────────
  // 다음 보충 작품 선택
  // ─────────────────────────────────────────────────────────────
  const pickNextSupplement = useCallback(() => {
    if (supplementList.length === 0) {
      setSupplementCurrentNovel(null);
      return;
    }
    const currentId = supplementCurrentNovel?.id;
    const currentIdx = supplementList.findIndex((n) => n.id === currentId);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % supplementList.length : 0;
    setSupplementCurrentNovel(supplementList[nextIdx]);
  }, [supplementList, supplementCurrentNovel]);

  // ─────────────────────────────────────────────────────────────
  // 미흡한 정보 체크
  // ─────────────────────────────────────────────────────────────
  const getMissingInfo = useCallback((novel) => {
    const missing = [];
    
    if (!novel.author || novel.author.trim() === "") missing.push("작가");
    if (!novel.tags || novel.tags.trim() === "") missing.push("태그");
    
    const plats = parsePlatforms(novel.platforms);
    if (!plats || plats.length === 0) missing.push("플랫폼");
    
    const readCount = novel.read_count || 0;
    const minReadCount = appSettings?.supplement?.minReadCount || 10;
    if (readCount < minReadCount) missing.push(`읽은 회차 (${readCount}/${minReadCount})`);
    
    return missing;
  }, [appSettings]);

  // ─────────────────────────────────────────────────────────────
  // 보충 작품 카드 렌더링
  // ─────────────────────────────────────────────────────────────
  const renderSupplementCard = useCallback(() => {
    if (!supplementCurrentNovel) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 30 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
          <Text style={{ color: C.sub, textAlign: "center" }}>
            "다음 작품" 버튼을 눌러{"\n"}보충할 작품을 불러오세요.
          </Text>
        </View>
      );
    }

    const n = supplementCurrentNovel;
    const plats = parsePlatforms(n.platforms);
    const missing = getMissingInfo(n);
    const tier = getDisplayTier(n, globalTierThresholds);
    const { c } = tierBadge(n.rating || 1500, globalTierThresholds);

    return (
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: c,
          backgroundColor: C.card,
        }}
      >
        {/* 표지 + 정보 */}
        <View style={{ flexDirection: "row" }}>
          {n.cover_image && (
            <CoverImage 
              uri={n.cover_image} 
              size={80} 
              style={{ marginRight: 14, borderRadius: 8 }}
            />
          )}
          <View style={{ flex: 1 }}>
            {/* 제목 + 티어 */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", flex: 1, color: C.text }} numberOfLines={2}>
                {n.title}
              </Text>
              <TierTag rating={n.rating} thresholds={globalTierThresholds} />
            </View>

            {/* 작가 */}
            <Text style={{ color: C.sub, marginTop: 6 }}>
              작가: {n.author || "-"}
            </Text>

            {/* 플랫폼 */}
            <Text style={{ color: C.sub }}>
              플랫폼: {plats.length ? plats.join(", ") : "-"}
            </Text>

            {/* 읽은 회차 */}
            <Text style={{ color: C.sub }}>
              읽은 회차: {n.read_count || 0}회
            </Text>
          </View>
        </View>

        {/* 미흡한 정보 표시 */}
        {missing.length > 0 && (
          <View style={{ 
            marginTop: 12, 
            backgroundColor: "#fef3c7",
            padding: 10,
            borderRadius: 8,
          }}>
            <Text style={{ color: "#92400e", fontWeight: "700", marginBottom: 4 }}>
              ⚠️ 보충 필요
            </Text>
            <Text style={{ color: "#92400e", fontSize: 13 }}>
              {missing.join(", ")}
            </Text>
          </View>
        )}

        {/* 편집 버튼 */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <PrimaryButton
            title="정보 편집"
            onPress={() => openEdit(n)}
            style={{ flex: 1 }}
            theme={C}
          />
          <OutlineButton
            title="건너뛰기"
            onPress={pickNextSupplement}
            style={{ flex: 1 }}
            theme={C}
          />
        </View>
      </View>
    );
  }, [supplementCurrentNovel, C, getMissingInfo, globalTierThresholds, openEdit, pickNextSupplement]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>📝 정보 보충</H>
      
      {/* 현황 요약 */}
      <Section title="보충 대상 현황" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          정보 입력이 미흡한 작품을 찾아 보충합니다.{"\n"}
          부정 태그가 {appSettings?.supplement?.excludeNegativeTagCount || 2}개 이상인 작품은 제외됩니다.
        </Text>
        
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <View style={{ backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>{supplementCount}작품</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>보충 대상</Text>
          </View>
          <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: C.text, fontWeight: "700" }}>전체 {list.length}작품</Text>
          </View>
        </View>
        
        <OutlineButton
          title="⚙️ 보충 기준 설정"
          onPress={() => setSupplementSettingsOpen(true)}
          theme={C}
        />
      </Section>

      {supplementCount === 0 ? (
        <Section title="✅ 완료" theme={C}>
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎉</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8 }}>
              모든 작품의 정보가 충분합니다!
            </Text>
            <Text style={{ color: C.sub, textAlign: "center" }}>
              보충이 필요한 작품이 없습니다.{"\n"}
              새 작품을 등록하거나 기준을 조정해 보세요.
            </Text>
          </View>
        </Section>
      ) : (
        <>
          {/* 현재 보충 작품 */}
          <Section title="보충 작품" theme={C}>
            {renderSupplementCard()}
          </Section>

          {/* 다음 작품 버튼 */}
          <Section title="다음 작품" theme={C}>
            <PrimaryButton
              title="다음 작품 불러오기"
              onPress={pickNextSupplement}
              theme={C}
            />
          </Section>
        </>
      )}
    </>
  );
});

SupplementScreen.displayName = "SupplementScreen";

export default SupplementScreen;
