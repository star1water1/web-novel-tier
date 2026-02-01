
/**
 * src/components/ui.js
 * 공통 UI 컴포넌트 모음
 * 
 * v4.0 Step 32 - 모듈 스코프 테마 공유 방식
 * 
 * 사용법:
 * import { H, Label, Input, Chip, PrimaryButton, OutlineButton, Section, TierTag } from './src/components/ui';
 * 
 * ⚠️ App.jsx에서 렌더링 시작 시 setCurrentTheme(isDark) 호출 필요
 */

import React, { memo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCurrentTheme } from '../theme/currentTheme';
import { getTierColor } from '../constants/tier';

// ═══════════════════════════════════════════════════════════════
// 📝 Typography
// ═══════════════════════════════════════════════════════════════

/**
 * 대제목 (H1 스타일)
 */
export function H({ children, style }) {
  const C = getCurrentTheme();
  return (
    <Text
      style={[
        {
          fontSize: 28,
          fontWeight: "800",
          color: C.text,
          marginTop: 6,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * 라벨 텍스트
 */
export function Label({ children, style }) {
  const C = getCurrentTheme();
  return (
    <Text
      style={[
        { fontSize: 13, color: C.sub, marginBottom: 6 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📝 Input
// ═══════════════════════════════════════════════════════════════

/**
 * 텍스트 입력
 */
export function Input(props) {
  const C = getCurrentTheme();
  const { style, ...rest } = props;
  
  return (
    <TextInput
      {...rest}
      placeholderTextColor={C.sub}
      style={[
        {
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: C.text,
        },
        style,
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// 🔘 Buttons
// ═══════════════════════════════════════════════════════════════

/**
 * Chip 버튼 (태그 선택용)
 */
export const Chip = memo(
  function Chip({ label, active, onPress, value, onToggle, style }) {
    const C = getCurrentTheme();
    
    return (
      <TouchableOpacity
        onPress={value !== undefined && onToggle ? () => onToggle(value) : onPress}
        style={[
          {
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: active ? C.primary : C.chip,
            marginRight: 8,
            marginBottom: 8,
          },
          style,
        ]}
      >
        <Text style={{ color: active ? "#fff" : C.text, fontWeight: "600" }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.label === next.label && prev.active === next.active
);

/**
 * 주요 액션 버튼
 */
export const PrimaryButton = memo(function PrimaryButton({ title, onPress, style, disabled }) {
  const C = getCurrentTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: disabled ? C.sub : C.primary,
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
  );
});

/**
 * 아웃라인 버튼
 */
export const OutlineButton = memo(function OutlineButton({ title, onPress, style, color, disabled }) {
  const C = getCurrentTheme();
  const buttonColor = color || C.sub;
  
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
          borderColor: buttonColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: buttonColor, fontSize: 15, fontWeight: "700" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📦 Layout
// ═══════════════════════════════════════════════════════════════

/**
 * 섹션 카드
 */
export function Section({ title, children, style }) {
  const C = getCurrentTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: C.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: C.line,
        },
        style,
      ]}
    >
      {title && (
        <>
          <Text style={{ fontWeight: "800", fontSize: 18, color: C.text }}>
            {title}
          </Text>
          <View style={{ height: 8 }} />
        </>
      )}
      {children}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🏷️ Tier Tags
// ═══════════════════════════════════════════════════════════════

/**
 * 티어 뱃지 색상 계산 (순수 함수)
 */
export function tierBadge(rating) {
  const C = getCurrentTheme();
  if (rating >= 1950) return { t: "S", c: C.s };
  if (rating >= 1850) return { t: "A", c: C.a };
  if (rating >= 1700) return { t: "B+", c: C.bp };
  if (rating >= 1600) return { t: "B", c: C.b };
  if (rating >= 1500) return { t: "B-", c: C.bm };
  return { t: "C", c: C.c };
}

/**
 * 티어 태그 컴포넌트
 */
export const TierTag = memo(function TierTag({ rating, style }) {
  const { t, c } = tierBadge(rating);
  
  return (
    <View
      style={[
        {
          backgroundColor: c,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
        },
        style,
      ]}
    >
      <Text style={{ color: "#fff", fontWeight: "800" }}>{t}</Text>
    </View>
  );
});

/**
 * 실제 표시 티어 (manual_tier 고려)
 * @param {Object} props
 * @param {Object} props.novel - 작품 객체
 * @param {boolean} props.showDiff - 권장 티어와의 차이 표시 여부
 * @param {Function} props.getDisplayTier - 표시 티어 계산 함수 (선택)
 * @param {Function} props.tierFromRating - 레이팅→티어 함수 (선택)
 */
export const ActualTierTag = memo(function ActualTierTag({ 
  novel, 
  showDiff = false,
  getDisplayTier: getDisplayTierProp,
  tierFromRating: tierFromRatingProp,
}) {
  const C = getCurrentTheme();
  
  if (!novel) return null;
  
  // 기본 티어 계산 함수들
  const defaultTierFromRating = (r) => {
    if (r >= 1950) return 'S';
    if (r >= 1850) return 'A';
    if (r >= 1700) return 'B+';
    if (r >= 1600) return 'B';
    if (r >= 1500) return 'B-';
    return 'C';
  };
  
  const defaultGetDisplayTier = (n) => {
    if (n.manual_tier === 'S' || n.manual_tier === 'A') return n.manual_tier;
    return defaultTierFromRating(n.rating || 1500);
  };
  
  const tierFromRatingFn = tierFromRatingProp || defaultTierFromRating;
  const getDisplayTierFn = getDisplayTierProp || defaultGetDisplayTier;
  
  const tierRankMap = { 'S': 6, 'A': 5, 'B+': 4, 'B': 3, 'B-': 2, 'C': 1 };
  const tierRank = (t) => tierRankMap[t] || 0;
  
  const actual = getDisplayTierFn(novel);
  const recommended = tierFromRatingFn(novel.rating || 1500);
  const color = getTierColor(actual);
  const isForced = novel.manual_tier && tierRank(tierFromRatingFn(novel.rating)) > tierRank(novel.manual_tier);
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
        <Text style={{ color: C.sub, fontSize: 11 }}>
          ({recommended} 권장)
        </Text>
      )}
    </View>
  );
});
