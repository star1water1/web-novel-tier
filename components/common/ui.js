/**
 * 공통 UI 컴포넌트 통합
 * @module components/common/ui
 * @merged buttons.js + indicators.js
 *
 * @exports 버튼: Chip, PrimaryButton, OutlineButton, Section, H, Label
 * @exports 표시: tierBadge, getTierColor, TierTag, ActualTierTag, StatusIcon,
 *   WorkStatusIcon, GaidenStatusIcon, GenreBadge, GenreRow, StatusBadge, WorkStatusBadge
 */
import React, { memo, useMemo } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { TIER_COLORS } from "../../constants/config";
import { MAJOR_GENRE_COLORS, SUB_GENRE_COLORS } from "../../constants/tags";


// ═══════════════════════════════════════════════════════════════
// 📌 버튼 컴포넌트 (원본 buttons.js)
// ═══════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════
// 📌 Chip (태그/필터 칩)
// ═══════════════════════════════════════════════════════════════

export const Chip = memo(
  ({ label, active, onPress, value, onToggle, theme }) => (
    <TouchableOpacity
      onPress={value !== undefined && onToggle ? () => onToggle(value) : onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? (theme?.primary || "#2D6AE3") : (theme?.chip || "#EEF4FF"),
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? "#fff" : (theme?.text || "#0B1220"), fontWeight: "600" }}>
        {label}
      </Text>
    </TouchableOpacity>
  ),
  (prev, next) => prev.label === next.label && prev.active === next.active
);

// ═══════════════════════════════════════════════════════════════
// 📌 PrimaryButton (주요 액션 버튼)
// ═══════════════════════════════════════════════════════════════

export const PrimaryButton = memo(({ title, onPress, style, disabled = false, theme }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        backgroundColor: disabled 
          ? (theme?.sub || "#6B7A90") 
          : (theme?.primary || "#2D6AE3"),
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      },
      style,
    ]}
  >
    <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
      {title}
    </Text>
  </TouchableOpacity>
));

// ═══════════════════════════════════════════════════════════════
// 📌 OutlineButton (보조 액션 버튼)
// ═══════════════════════════════════════════════════════════════

export const OutlineButton = memo(({ title, onPress, style, color, disabled = false, theme }) => {
  const borderColor = color || theme?.sub || "#6B7A90";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
          borderWidth: 1,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: borderColor, fontSize: 15, fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 Section (카드 섹션)
// ═══════════════════════════════════════════════════════════════

export const Section = ({ title, children, theme, style }) => (
  <View
    style={[
      {
        backgroundColor: theme?.card || "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme?.line || "#E7EEF6",
      },
      style,
    ]}
  >
    {title && (
      <>
        <Text style={{ fontWeight: "800", fontSize: 18, color: theme?.text || "#0B1220" }}>
          {title}
        </Text>
        <View style={{ height: 8 }} />
      </>
    )}
    {children}
  </View>
);

// ═══════════════════════════════════════════════════════════════
// 📌 H (헤더 텍스트)
// ═══════════════════════════════════════════════════════════════

export const H = ({ children, theme }) => (
  <Text
    style={{
      fontSize: 28,
      fontWeight: "800",
      color: theme?.text || "#0B1220",
      marginTop: 6,
      marginBottom: 12,
    }}
  >
    {children}
  </Text>
);

// ═══════════════════════════════════════════════════════════════
// 📌 Label (라벨 텍스트)
// ═══════════════════════════════════════════════════════════════

export const Label = ({ children, style, theme }) => (
  <Text
    style={[
      { fontSize: 13, color: theme?.sub || "#6B7A90", marginBottom: 6 },
      style,
    ]}
  >
    {children}
  </Text>
);

// ═══════════════════════════════════════════════════════════════
// 📌 인디케이터 컴포넌트 (원본 indicators.js)
// ═══════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════
// 📌 티어 관련 헬퍼 (테마 독립적)
// ═══════════════════════════════════════════════════════════════

export function tierBadge(r, thresholds = { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 }) {
  const colors = TIER_COLORS;
  if (r >= thresholds.S) return { t: "S", c: colors.s };
  if (r >= thresholds.A) return { t: "A", c: colors.a };
  if (r >= thresholds["B+"]) return { t: "B+", c: colors.bp };
  if (r >= thresholds.B) return { t: "B", c: colors.b };
  if (r >= thresholds["B-"]) return { t: "B-", c: colors.bm };
  return { t: "C", c: colors.c };
}

export function getTierColor(tier) {
  const colorMap = {
    S: TIER_COLORS.s,
    A: TIER_COLORS.a,
    "B+": TIER_COLORS.bp,
    B: TIER_COLORS.b,
    "B-": TIER_COLORS.bm,
    C: TIER_COLORS.c,
  };
  return colorMap[tier] || TIER_COLORS.c;
}

// ═══════════════════════════════════════════════════════════════
// 📌 TierTag (티어 뱃지)
// ═══════════════════════════════════════════════════════════════

export const TierTag = memo(({ rating, thresholds }) => {
  const { t, c } = tierBadge(rating, thresholds);
  return (
    <View
      style={{
        backgroundColor: c,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "800" }}>{t}</Text>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 ActualTierTag (실제 티어 표시 - manual_tier 고려)
// ═══════════════════════════════════════════════════════════════

export const ActualTierTag = memo(({ 
  novel, 
  showDiff = false, 
  thresholds,
  getDisplayTier,
  tierFromRating,
  tierRank,
}) => {
  if (!novel) return null;
  
  const actual = getDisplayTier ? getDisplayTier(novel) : tierFromRating(novel.rating || 1500, thresholds);
  const recommended = tierFromRating ? tierFromRating(novel.rating || 1500, thresholds) : actual;
  const color = getTierColor(actual);
  const isForced = novel.manual_tier && tierRank && tierRank(tierFromRating(novel.rating, thresholds)) > tierRank(novel.manual_tier);
  const hasDiff = actual !== recommended;
  
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={{
          backgroundColor: color,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: isForced ? 2 : 0,
          borderColor: "#fef3c7",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>
          {isForced ? "⚠️" : ""}{actual}
        </Text>
      </View>
      {showDiff && hasDiff && (
        <Text style={{ color: "#6b7280", fontSize: 11 }}>
          ({recommended} 권장)
        </Text>
      )}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 StatusIcon (읽기 상태 아이콘)
// ═══════════════════════════════════════════════════════════════

const STATUS_COLORS = {
  reading: "#3b82f6",    // 파랑 - 읽는 중
  completed: "#22c55e",  // 초록 - 완독
  pending: "#f59e0b",    // 주황 - 보류
  dropped: "#ef4444",    // 빨강 - 드롭
};

export const StatusIcon = memo(({ status }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.reading;
  return (
    <View style={{ 
      width: 10, 
      height: 10, 
      borderRadius: 5, 
      backgroundColor: color,
    }} />
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 WorkStatusIcon (작품 연재 상태 아이콘)
// ═══════════════════════════════════════════════════════════════

const WORK_STATUS_COLORS = {
  ongoing: "#3b82f6",      // 파란색 - 연재중
  completed: "#22c55e",    // 초록색 - 완결
  hiatus: "#f59e0b",       // 주황색 - 휴재
  dropped: "#ef4444",      // 빨간색 - 연중
  discontinued: "#6b7280", // 회색 - 서비스종료
};

export const WorkStatusIcon = memo(({ workStatus }) => {
  const color = WORK_STATUS_COLORS[workStatus];
  if (!color) return null;
  return (
    <View style={{ 
      width: 10, 
      height: 10, 
      borderRadius: 5, 
      backgroundColor: color,
      marginLeft: 6,
    }} />
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 GaidenStatusIcon (외전 상태 아이콘)
// ═══════════════════════════════════════════════════════════════

export const GaidenStatusIcon = memo(({ gaidenStatus }) => {
  if (!gaidenStatus || gaidenStatus === "none") return null;
  const color = gaidenStatus === "ongoing" ? "#3b82f6" : "#22c55e";
  return (
    <View style={{ 
      width: 10, 
      height: 10, 
      borderRadius: 2, // 사각형으로 외전 구분
      backgroundColor: color,
      marginLeft: 6,
    }} />
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 GenreBadge (장르 뱃지)
// ═══════════════════════════════════════════════════════════════


export const GenreBadge = memo(({ genre, type = "major" }) => {
  if (!genre) return null;
  const colors = type === "major" ? MAJOR_GENRE_COLORS : SUB_GENRE_COLORS;
  const bgColor = colors[genre] || (type === "major" ? "#6b7280" : "#9ca3af");
  return (
    <View
      style={{
        backgroundColor: bgColor,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        marginRight: 4,
        marginBottom: 2,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
        {genre}
      </Text>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 GenreRow (장르 행)
// ═══════════════════════════════════════════════════════════════

export const GenreRow = memo(({ majorGenre, subGenre }) => {
  if (!majorGenre && !subGenre) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
      {majorGenre && <GenreBadge genre={majorGenre} type="major" />}
      {subGenre && <GenreBadge genre={subGenre} type="sub" />}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 StatusBadge (읽기 상태 배지 - 라벨 포함)
// ═══════════════════════════════════════════════════════════════

const STATUS_MAP = {
  reading: { label: "읽는 중", color: "#3b82f6" },
  completed: { label: "완독", color: "#22c55e" },
  pending: { label: "보류", color: "#f59e0b" },
  dropped: { label: "중단", color: "#ef4444" },
};

export const StatusBadge = memo(({ status, theme }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.reading;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
      <View style={{ 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        backgroundColor: s.color,
        marginRight: 4,
      }} />
      <Text style={{ fontSize: 11, color: theme?.sub || "#6B7280" }}>{s.label}</Text>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 WorkStatusBadge (작품 연재 상태 배지 - 라벨 포함)
// ═══════════════════════════════════════════════════════════════

const WORK_STATUS_MAP = {
  ongoing: { label: "연재중", color: "#3b82f6" },
  completed: { label: "완결", color: "#22c55e" },
  hiatus: { label: "휴재", color: "#f59e0b" },
  dropped: { label: "연중", color: "#ef4444" },
  discontinued: { label: "서비스종료", color: "#6b7280" },
};

export const WorkStatusBadge = memo(({ workStatus, theme }) => {
  if (!workStatus || workStatus === "ongoing") return null;
  const s = WORK_STATUS_MAP[workStatus];
  if (!s) return null;
  return (
    <View style={{ 
      flexDirection: "row", 
      alignItems: "center", 
      marginRight: 8,
    }}>
      <View style={{ 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        backgroundColor: s.color,
        marginRight: 3,
      }} />
      <Text style={{ color: theme?.sub || "#6B7280", fontSize: 10 }}>{s.label}</Text>
    </View>
  );
});
