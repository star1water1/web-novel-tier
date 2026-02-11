/**
 * 태그 아이템 컴포넌트 (v6.0)
 * @module components/modals/TagItem
 * 
 * @source_origin 원본 App.jsx 8975-9056줄 (82줄)
 * 
 * @description
 * 개별 태그를 표시하는 터치 가능한 컴포넌트
 * 
 * 기능:
 * - 선택 상태 표시
 * - 고정/숨김 아이콘 표시
 * - 감정 색상 표시
 * - 롱프레스로 편집 모달 열기
 * 
 * @props
 * - tag: 태그 문자열
 * - selected: 선택 여부
 * - isPinned: 고정 여부
 * - isHidden: 숨김 여부
 * - sentiment: 감정 (positive/neutral/negative)
 * - onPress: 터치 콜백
 * - onLongPress: 롱프레스 콜백
 * - disabled: 비활성화 여부
 * - theme: 테마 객체
 */

import React, { memo } from "react";
import { Text, TouchableOpacity } from "react-native";

// Constants
import { SENTIMENT_COLORS, TAG_SENTIMENT } from "../../constants/tags";

// ═══════════════════════════════════════════════════════════════
// 📌 TagItem 컴포넌트
// ═══════════════════════════════════════════════════════════════

const TagItem = memo(({ 
  tag, 
  type, 
  types, // 🆕 복수 타입 표시용
  isPinned, 
  isHidden,
  sentiment, // 🆕 긍정/부정/중립
  isSelected, // 🆕 대량 선택 모드용
  onPress, 
  onLongPress, // 🆕 길게 눌러서 선택
  theme 
}) => {
  const C = theme;
  const isDark = C.bg !== "#F5F7FB"; // 다크모드 감지
  
  // 🆕 v3.4: 색상은 오직 sentiment만으로 결정 (타입 무관)
  const getStyle = () => {
    // 1. 숨김 상태 (최우선)
    if (isHidden) return { 
      bg: isDark ? "#374151" : "#f3f4f6", 
      text: isDark ? "#9ca3af" : "#9ca3af", 
      border: isDark ? "#4b5563" : "#d1d5db" 
    };
    
    // 2. 고정 상태
    if (isPinned) return { 
      bg: isDark ? "#78350f" : "#fef3c7", 
      text: isDark ? "#fcd34d" : "#92400e", 
      border: isDark ? "#f59e0b" : "#f59e0b" 
    };
    
    // 3. 감정 기반 색상 (타입과 무관하게 적용)
    if (sentiment === TAG_SENTIMENT.POSITIVE) {
      return { 
        bg: isDark ? "#14532d" : "#dcfce7", 
        text: isDark ? "#86efac" : "#166534", 
        border: isDark ? "#22c55e" : "#22c55e" 
      };
    }
    if (sentiment === TAG_SENTIMENT.NEGATIVE) {
      return { 
        bg: isDark ? "#7f1d1d" : "#fee2e2", 
        text: isDark ? "#fca5a5" : "#991b1b", 
        border: isDark ? "#ef4444" : "#ef4444" 
      };
    }
    
    // 4. 중립 (기본) - 모든 타입 동일
    return { bg: C.chip, text: C.text, border: C.line };
  };
  
  const style = getStyle();
  
  // 🆕 sentiment 아이콘
  const sentimentIcon = sentiment === TAG_SENTIMENT.POSITIVE ? "👍" : 
                        sentiment === TAG_SENTIMENT.NEGATIVE ? "👎" : "";
  
  // 🆕 복수 타입 표시 (예: 대장르+부장르)
  const typeIndicator = types && types.length > 1 ? `[${types.length}]` : "";
  
  return (
    <TouchableOpacity
      onPress={() => onPress(tag, type)}
      onLongPress={onLongPress ? () => onLongPress(tag, type) : undefined}
      style={{
        backgroundColor: isSelected ? (isDark ? "#1e3a5f" : "#bfdbfe") : style.bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: isSelected ? 2 : (isPinned ? 2 : 1),
        borderColor: isSelected ? "#2563eb" : style.border,
        opacity: isHidden ? 0.6 : 1,
      }}
    >
      <Text style={{ color: isSelected ? (isDark ? "#93c5fd" : "#1e40af") : style.text, fontWeight: "600", fontSize: 13 }}>
        {isSelected && "✓ "}{isPinned && "📌 "}{isHidden && "🚫 "}{sentimentIcon}{sentimentIcon && " "}{tag}{typeIndicator && ` ${typeIndicator}`}
      </Text>
    </TouchableOpacity>
  );
});

export default TagItem;
