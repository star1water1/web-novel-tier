/**
 * 네비게이션 + 로딩 컴포넌트 통합
 * @module components/navigation/Nav
 * @merged Nav + LoadingOverlay
 * @exports Nav (default), NAV_TABS, BADGE_COLORS, LoadingOverlay
 */
import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";



// 네비게이션 탭 정의
const NAV_TABS = [
  ["홈", "home"],
  ["📋예정", "planned"],
  ["📰최신", "recent"],
  ["순위", "rank"],
  ["🏆수상", "awards"],
  ["검토", "review"],
  ["보충", "supplement"],
  ["취향", "taste"],
  ["추천", "reco"],
  ["매칭", "match"],
  ["분석", "analysis"],
  ["대량", "bulk"],
  ["🖼️표지", "covers"],
  ["설정", "settings"],
];

// 뱃지 색상 정의
const BADGE_COLORS = {
  review: "#f59e0b",
  supplement: "#3b82f6",
  recent: "#10b981",
  planned: "#8b5cf6",
  default: "#3b82f6",
};

const Nav = memo(({
  screen,
  setScreen,
  theme,
  reviewCount = 0,
  supplementCount = 0,
  recentChanges = [],
  plannedList = [],
  appSettings = {},
}) => {
  const C = theme;

  // 최신 변화 개수 (설정 기간 내)
  const recentChangesCount = useMemo(() => {
    const retentionDays = appSettings.recentChanges?.retentionDays || 30;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    return recentChanges.filter(c => c.timestamp > cutoff).length;
  }, [recentChanges, appSettings.recentChanges?.retentionDays]);

  // 예정 작품 개수
  const plannedCount = plannedList?.length || 0;

  // 뱃지 정보 계산
  const getBadgeInfo = (key) => {
    const counts = {
      review: reviewCount,
      supplement: supplementCount,
      recent: recentChangesCount,
      planned: plannedCount,
    };
    
    const count = counts[key] || 0;
    const hasBadge = count > 0;
    const color = BADGE_COLORS[key] || BADGE_COLORS.default;
    
    return { hasBadge, count, color };
  };

  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {NAV_TABS.map(([label, key]) => {
        const { hasBadge, count, color } = getBadgeInfo(key);
        
        return (
          <TouchableOpacity
            key={key}
            onPress={() => setScreen(key)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: screen === key ? C.card : "transparent",
              borderWidth: 1,
              borderColor: hasBadge ? color : C.line,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                color: screen === key ? C.text : C.sub,
              }}
            >
              {label}
            </Text>
            {hasBadge && (
              <View style={{
                backgroundColor: color,
                borderRadius: 999,
                minWidth: 18,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 4,
              }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

Nav.displayName = "Nav";

export default Nav;

// 탭 목록 내보내기 (다른 곳에서 사용 가능)
export { NAV_TABS, BADGE_COLORS };

// ═══════════════════════════════════════════════════════════════
// 📌 LoadingOverlay (로딩 오버레이)
// ═══════════════════════════════════════════════════════════════



const LoadingOverlay = memo(({ isLoading, theme }) => {
  if (!isLoading) return null;
  
  const C = theme;
  
  return (
    <View style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: C.overlay || "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    }}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={{ marginTop: 12, color: C.sub }}>처리 중...</Text>
    </View>
  );
});

LoadingOverlay.displayName = "LoadingOverlay";


export { LoadingOverlay };
