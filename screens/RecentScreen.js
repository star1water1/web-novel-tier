/**
 * 최신 변화 화면
 * @module screens/RecentScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 최근 변경사항 기록 표시 화면
 * Context: useApp(theme, setScreen), useData(recentChanges, clearRecentChanges, list)
 */

import React, { memo, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { H, Section, OutlineButton } from "../components/common/ui";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";

// ═══════════════════════════════════════════════════════════════
// 📌 변경 타입별 라벨
// ═══════════════════════════════════════════════════════════════
const CHANGE_TYPE_LABELS = {
  new: { icon: "📝", label: "신규 등록", color: "#22c55e" },
  award: { icon: "🏆", label: "수상", color: "#f59e0b" },
  tier_change: { icon: "📈", label: "티어 변동", color: "#8b5cf6" },
  tier_review: { icon: "⚖️", label: "티어 검토", color: "#3b82f6" },
  read_count: { icon: "📖", label: "읽은 회차", color: "#6366f1" },
  title_change: { icon: "✏️", label: "제목 변경", color: "#ec4899" },
  auto_tier: { icon: "🤖", label: "자동 티어", color: "#14b8a6" },
  delete: { icon: "🗑️", label: "삭제", color: "#ef4444" },
  edit: { icon: "📝", label: "수정", color: "#6b7280" },
};

// ═══════════════════════════════════════════════════════════════
// 📌 RecentScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const RecentScreen = memo(() => {
  const { theme, setScreen } = useApp();
  const { recentChanges, clearRecentChanges, list } = useData();
  const C = theme;

  // ─────────────────────────────────────────────────────────────
  // 날짜별 그룹화
  // ─────────────────────────────────────────────────────────────
  const groupedByDate = useMemo(() => {
    if (!recentChanges || recentChanges.length === 0) return {};
    
    const groups = {};
    for (const change of recentChanges) {
      const date = new Date(change.timestamp);
      const dateKey = date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(change);
    }
    return groups;
  }, [recentChanges]);

  // ─────────────────────────────────────────────────────────────
  // 변경 상세 설명 생성
  // ─────────────────────────────────────────────────────────────
  const getChangeDescription = useCallback((change) => {
    const { type, details } = change;
    
    switch (type) {
      case "new":
        return "작품이 등록되었습니다.";
      case "award":
        return `${details?.awardName || "수상"} - ${details?.year || ""}`;
      case "tier_change":
      case "tier_review":
        return `${details?.from || "?"} → ${details?.to || "?"}`;
      case "read_count":
        const delta = details?.delta || 0;
        return delta > 0 ? `+${delta}화 읽음` : `${delta}화`;
      case "title_change":
        return `"${details?.from || "?"}" → "${details?.to || "?"}"`;
      case "auto_tier":
        return `자동 ${details?.from || "?"} → ${details?.to || "?"}`;
      case "delete":
        return "작품이 삭제되었습니다.";
      case "edit":
        return "작품 정보가 수정되었습니다.";
      default:
        return "";
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 작품명으로 이동
  // ─────────────────────────────────────────────────────────────
  const goToNovel = useCallback((novelId) => {
    const novel = list?.find(n => n.id === novelId);
    if (novel) {
      // 홈 화면으로 이동 (검색 기능은 별도 구현 필요)
      setScreen("home");
    }
  }, [list, setScreen]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>📰 최신 변화</H>
      
      {/* 설정 및 삭제 */}
      <Section title="⚙️ 설정" theme={C}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <OutlineButton
            title="전체 삭제"
            onPress={clearRecentChanges}
            color={C.warn}
            theme={C}
          />
        </View>
      </Section>

      {/* 변경 기록 */}
      {(!recentChanges || recentChanges.length === 0) ? (
        <Section title="기록" theme={C}>
          <Text style={{ color: C.sub, textAlign: "center", paddingVertical: 20 }}>
            아직 기록된 변경사항이 없습니다.
          </Text>
        </Section>
      ) : (
        Object.entries(groupedByDate).map(([dateKey, changes]) => (
          <Section key={dateKey} title={dateKey} theme={C}>
            {changes.map((change, idx) => {
              const typeInfo = CHANGE_TYPE_LABELS[change.type] || { 
                icon: "📌", 
                label: change.type, 
                color: C.sub 
              };
              const time = new Date(change.timestamp).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              
              return (
                <TouchableOpacity
                  key={change.id || idx}
                  onPress={() => change.novelId && goToNovel(change.novelId)}
                  style={{
                    padding: 12,
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.line,
                    borderLeftWidth: 4,
                    borderLeftColor: typeInfo.color,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{typeInfo.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontWeight: "700", color: C.text, flex: 1 }} numberOfLines={1}>
                          {change.novelTitle || "알 수 없는 작품"}
                        </Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>{time}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <View style={{
                          backgroundColor: typeInfo.color,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginRight: 8,
                        }}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                            {typeInfo.label}
                          </Text>
                        </View>
                        <Text style={{ color: C.sub, fontSize: 13, flex: 1 }} numberOfLines={1}>
                          {getChangeDescription(change)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Section>
        ))
      )}

      {/* 통계 */}
      {recentChanges && recentChanges.length > 0 && (
        <Section title="📊 통계" theme={C}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(
              recentChanges.reduce((acc, change) => {
                acc[change.type] = (acc[change.type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => {
              const typeInfo = CHANGE_TYPE_LABELS[type] || { icon: "📌", label: type, color: C.sub };
              return (
                <View
                  key={type}
                  style={{
                    backgroundColor: typeInfo.color,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {typeInfo.icon} {typeInfo.label}: {count}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={{ color: C.sub, marginTop: 12, fontSize: 13 }}>
            총 {recentChanges.length}건의 기록
          </Text>
        </Section>
      )}
    </>
  );
});

RecentScreen.displayName = "RecentScreen";

export default RecentScreen;
