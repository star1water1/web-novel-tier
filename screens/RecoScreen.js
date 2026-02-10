/**
 * 오늘의 추천 화면
 * @module screens/RecoScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 일일 추천 작품 표시 화면
 * Context: useApp(theme, appSettings, setScreen), useData(list, dailyReco, refreshDaily), useModal(openEdit)
 */

import React, { memo, useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { H, Section, PrimaryButton, OutlineButton } from "../components/common/ui";
import { TierTag, tierBadge, getTierColor } from "../components/common/ui";
import { AwardsRow, CoverImage } from "../components/novel/NovelCard";
import { 
  parsePlatforms,
  computeReliability,
  getDisplayTier,
  getWinRate,
} from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useModal } from "../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 추천 카테고리 아이콘
// ═══════════════════════════════════════════════════════════════
const CATEGORY_ICONS = {
  low_reliability: "📊",
  high_tier_unread: "⭐",
  planned_priority: "📋",
  recent_add: "🆕",
  random: "🎲",
  other: "💡",
};

const CATEGORY_LABELS = {
  low_reliability: "신뢰도 향상 필요",
  high_tier_unread: "고티어 미독",
  planned_priority: "예정작 우선",
  recent_add: "최근 추가",
  random: "랜덤 추천",
  other: "추천",
};

// ═══════════════════════════════════════════════════════════════
// 📌 RecoScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const RecoScreen = memo(() => {
  const { theme, appSettings, setScreen } = useApp();
  const { list, dailyReco, refreshDaily: refreshDailyRecommendation } = useData();
  const { openEdit } = useModal();
  const C = theme;
  // 추천 히스토리 (로컬 상태 - 향후 DataContext로 이동 가능)
  const [recoHistory] = useState([]);
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 추천 작품 렌더링
  // ─────────────────────────────────────────────────────────────
  const renderRecoCard = useCallback(() => {
    if (!dailyReco || !dailyReco.novel) {
      return (
        <Text style={{ color: C.sub }}>
          아직 추천할 작품이 없습니다.{"\n"}
          작품을 등록하거나 예정 목록에 추가해 보세요.
        </Text>
      );
    }

    const n = dailyReco.novel;
    const isPlanned = dailyReco.isPlanned;
    const reason = dailyReco.reason || "추천 작품입니다.";
    const category = dailyReco.category || "other";
    
    const plats = parsePlatforms(n.platforms);
    const pickedLabel = (() => {
      try {
        const picked = new Date(dailyReco.pickedAt);
        return isNaN(picked.getTime()) ? "날짜 없음" : picked.toLocaleDateString();
      } catch { return "날짜 없음"; }
    })();
    const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    
    const t = isPlanned ? "예정" : getDisplayTier(n, globalTierThresholds);
    const c = isPlanned ? "#8b5cf6" : getTierColor(t);
    const reliability = isPlanned ? 0 : computeReliability(n, list.length);
    const winRateVal = isPlanned ? 0 : getWinRate(n.wins, n.losses);
    const episodeText = n.total_episodes > 0 
      ? (isPlanned ? `전체 ${n.total_episodes}화` : `${n.read_count || 0} / ${n.total_episodes}화`)
      : (isPlanned ? "회차 미정" : `${n.read_count || 0}화`);

    const categoryIcon = CATEGORY_ICONS[category] || "💡";
    const categoryLabel = CATEGORY_LABELS[category] || "추천";

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
        {/* 카테고리 배지 */}
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          marginBottom: 12,
          backgroundColor: C.chip,
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
        }}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>{categoryIcon}</Text>
          <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>{categoryLabel}</Text>
        </View>

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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", flex: 1, color: C.text }} numberOfLines={2}>
                {n.title}
              </Text>
              {!isPlanned && <TierTag rating={n.rating} thresholds={globalTierThresholds} />}
              {isPlanned && (
                <View style={{ backgroundColor: "#8b5cf6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>예정</Text>
                </View>
              )}
            </View>

            {/* 수상 */}
            <AwardsRow awardsJson={n.awards} />

            {/* 작가 */}
            <Text style={{ color: C.sub, marginTop: 4 }}>
              작가: {n.author || "-"}
            </Text>

            {/* 플랫폼 */}
            <Text style={{ color: C.sub }}>
              플랫폼: {plats.length ? plats.join(", ") : "-"}
            </Text>

            {/* 회차 */}
            <Text style={{ color: C.sub }}>
              {episodeText}
            </Text>
          </View>
        </View>

        {/* 추가 정보 (본목록 작품만) */}
        {!isPlanned && (
          <View style={{ 
            marginTop: 12, 
            paddingTop: 12, 
            borderTopWidth: 1, 
            borderTopColor: C.line,
            flexDirection: "row",
            justifyContent: "space-around",
          }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: C.sub, fontSize: 11 }}>레이팅</Text>
              <Text style={{ color: C.text, fontWeight: "800" }}>{(n.rating || 1500).toFixed(0)}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: C.sub, fontSize: 11 }}>승률</Text>
              <Text style={{ color: C.text, fontWeight: "800" }}>{winRateVal}%</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: C.sub, fontSize: 11 }}>신뢰도</Text>
              <Text style={{ color: C.text, fontWeight: "800" }}>{Math.round(reliability)}%</Text>
            </View>
          </View>
        )}

        {/* 추천 이유 */}
        <View style={{ 
          marginTop: 12, 
          backgroundColor: C.chip,
          padding: 10,
          borderRadius: 8,
        }}>
          <Text style={{ color: C.sub, fontSize: 13 }}>
            💡 {reason}
          </Text>
        </View>

        {/* 추천 날짜 */}
        <Text style={{ color: C.sub, fontSize: 11, marginTop: 8, textAlign: "right" }}>
          추천일: {pickedLabel}
        </Text>
      </View>
    );
  }, [dailyReco, C, list.length, globalTierThresholds]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>🎯 오늘의 추천</H>

      {/* 추천 카드 */}
      <Section title="추천 작품" theme={C}>
        {renderRecoCard()}
      </Section>

      {/* 추천 다시 뽑기 */}
      <Section title="추천 갱신" theme={C}>
        <PrimaryButton
          title="오늘의 추천 다시 뽑기"
          onPress={() => refreshDailyRecommendation(true)}
          theme={C}
        />
        <Text style={{ color: C.sub, fontSize: 12, marginTop: 8, textAlign: "center" }}>
          매일 자정에 자동으로 새로운 추천이 선정됩니다
        </Text>
      </Section>

      {/* 추천 히스토리 */}
      {recoHistory && recoHistory.length > 0 && (
        <Section title="추천 히스토리" theme={C}>
          {recoHistory.slice(0, 7).map((h, idx) => {
            const dateLabel = (() => {
              try {
                const d = new Date(h.pickedAt);
                return isNaN(d.getTime()) ? "날짜 없음" : d.toLocaleDateString();
              } catch { return "날짜 없음"; }
            })();
            const categoryIcon = CATEGORY_ICONS[h.category] || "💡";
            
            return (
              <View
                key={h.id || idx}
                style={{
                  padding: 10,
                  backgroundColor: C.card,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.line,
                  marginBottom: 6,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 10 }}>{categoryIcon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
                    {h.title || "알 수 없는 작품"}
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                    {dateLabel} · {h.isPlanned ? "예정작" : `R ${h.rating?.toFixed(0) || "-"}`}
                  </Text>
                </View>
              </View>
            );
          })}
          {recoHistory.length > 7 && (
            <Text style={{ color: C.sub, fontSize: 12, textAlign: "center", marginTop: 4 }}>
              최근 7건만 표시됩니다
            </Text>
          )}
        </Section>
      )}
    </>
  );
});

RecoScreen.displayName = "RecoScreen";

export default RecoScreen;
