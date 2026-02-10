/**
 * 차트 컴포넌트
 * @module components/charts
 * 
 * @source_origin 원본 App.jsx 12161-12276줄
 * 
 * @description
 * 취향 분석용 간소화된 차트 컴포넌트
 * - BarChart: 막대 차트
 * - RadarChartSimple: 레이더 차트 (막대로 표현)
 * - PieChartSimple: 파이 차트 (수평 분할)
 * - HeatmapRow: 히트맵 (상대전적용)
 */

import React, { memo } from "react";
import { View, Text } from "react-native";

// ═══════════════════════════════════════════════════════════════
// 📌 BarChart (막대 차트)
// ═══════════════════════════════════════════════════════════════

/**
 * 막대 차트 컴포넌트
 * @param {object} props
 * @param {Array<{label: string, value: number, displayValue?: string, color?: string}>} props.data
 * @param {number} props.maxValue - 최대값 (자동 계산 가능)
 * @param {string} props.color - 기본 색상
 * @param {number} props.height - 막대 높이
 * @param {boolean} props.showValue - 값 표시 여부
 */
export const BarChart = memo(({ data, maxValue, color = "#3b82f6", height = 20, showValue = true }) => {
  if (!data || data.length === 0) return null;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  
  return (
    <View>
      {data.map((item, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</Text>
            {showValue && <Text style={{ fontSize: 12, color: "#6b7280" }}>{item.displayValue || item.value}</Text>}
          </View>
          <View style={{ height, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
            <View style={{ 
              width: `${Math.min(100, (item.value / max) * 100)}%`, 
              height: "100%", 
              backgroundColor: item.color || color,
              borderRadius: 4,
            }} />
          </View>
        </View>
      ))}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 RadarChartSimple (레이더 차트 - 막대로 표현)
// ═══════════════════════════════════════════════════════════════

/**
 * 간소화된 레이더 차트 (막대로 표현)
 * @param {object} props
 * @param {Array<{label: string, value: number, color?: string}>} props.data
 * @param {number} props.maxValue - 최대값 (기본 100)
 * @param {object} props.theme - 테마 객체
 */
export const RadarChartSimple = memo(({ data, maxValue = 100, theme }) => {
  if (!data || data.length === 0) return null;
  const C = theme;
  
  return (
    <View style={{ padding: 10 }}>
      {data.map((item, i) => {
        const pct = Math.min(100, (item.value / maxValue) * 100);
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ width: 70, fontSize: 12, color: C?.sub || "#6b7280" }}>{item.label}</Text>
            <View style={{ flex: 1, height: 16, backgroundColor: C?.chip || "#EEF4FF", borderRadius: 8, overflow: "hidden" }}>
              <View style={{ width: `${pct}%`, height: "100%", backgroundColor: item.color || C?.primary || "#2D6AE3" }} />
            </View>
            <Text style={{ width: 45, textAlign: "right", fontSize: 12, color: C?.text || "#0B1220", fontWeight: "600" }}>
              {item.value.toFixed(0)}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 PieChartSimple (파이 차트 - 수평 분할)
// ═══════════════════════════════════════════════════════════════

const PIE_COLORS = ["#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

/**
 * 간소화된 파이 차트 (수평 분할로 표현)
 * @param {object} props
 * @param {Array<{label: string, value: number}>} props.data
 * @param {object} props.theme - 테마 객체
 */
export const PieChartSimple = memo(({ data, theme }) => {
  if (!data || data.length === 0) return null;
  const C = theme;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  
  return (
    <View>
      <View style={{ flexDirection: "row", height: 24, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
        {data.map((item, i) => (
          <View key={i} style={{ 
            flex: item.value, 
            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
          }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {data.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PIE_COLORS[i % PIE_COLORS.length], marginRight: 4 }} />
            <Text style={{ fontSize: 11, color: C?.sub || "#6b7280" }}>{item.label} ({((item.value / total) * 100).toFixed(0)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 HeatmapRow (히트맵 - 상대전적용)
// ═══════════════════════════════════════════════════════════════

/**
 * 히트맵 행 컴포넌트 (장르간 상대전적용)
 * @param {object} props
 * @param {Array<{matchup: string, winRate: number, wins: number, total: number}>} props.data
 * @param {object} props.theme - 테마 객체
 */
export const HeatmapRow = memo(({ data, theme }) => {
  if (!data || data.length === 0) return null;
  const C = theme;
  
  return (
    <View>
      {data.map((item, i) => {
        const color = item.winRate >= 0.6 ? "#22c55e" : item.winRate >= 0.4 ? "#f59e0b" : "#ef4444";
        return (
          <View key={i} style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            paddingVertical: 6,
            borderBottomWidth: i < data.length - 1 ? 1 : 0,
            borderBottomColor: C?.line || "#E7EEF6",
          }}>
            <Text style={{ flex: 1, fontSize: 13, color: C?.text || "#0B1220" }}>{item.matchup}</Text>
            <View style={{ 
              backgroundColor: color + "20",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 12, color, fontWeight: "700" }}>
                {(item.winRate * 100).toFixed(0)}% ({item.wins}/{item.total})
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 ProgressBar (진행 막대)
// ═══════════════════════════════════════════════════════════════

/**
 * 진행 막대 컴포넌트
 * @param {object} props
 * @param {number} props.value - 현재 값 (0-100)
 * @param {string} props.color - 색상
 * @param {number} props.height - 높이
 * @param {object} props.theme - 테마 객체
 */
export const ProgressBar = memo(({ value, color = "#3b82f6", height = 10, theme }) => {
  const percent = Math.min(100, Math.max(0, value || 0));
  return (
    <View style={{ 
      height, 
      backgroundColor: theme?.chip || "#EEF4FF", 
      borderRadius: height / 2, 
      overflow: "hidden" 
    }}>
      <View style={{ 
        width: `${percent}%`, 
        height: "100%", 
        backgroundColor: color 
      }} />
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// 📌 StatCard (통계 카드)
// ═══════════════════════════════════════════════════════════════

/**
 * 통계 카드 컴포넌트
 * @param {object} props
 * @param {string} props.label - 라벨
 * @param {string|number} props.value - 값
 * @param {string} props.subtext - 부가 텍스트
 * @param {string} props.color - 액센트 색상
 * @param {object} props.theme - 테마 객체
 */
export const StatCard = memo(({ label, value, subtext, color, theme }) => (
  <View style={{ 
    backgroundColor: theme?.card || "#fff", 
    borderRadius: 12, 
    padding: 12,
    borderWidth: 1,
    borderColor: theme?.line || "#E7EEF6",
    minWidth: 80,
  }}>
    <Text style={{ fontSize: 11, color: theme?.sub || "#6b7280", marginBottom: 4 }}>{label}</Text>
    <Text style={{ fontSize: 18, fontWeight: "800", color: color || theme?.text || "#0B1220" }}>{value}</Text>
    {subtext && <Text style={{ fontSize: 10, color: theme?.sub || "#6b7280", marginTop: 2 }}>{subtext}</Text>}
  </View>
));
