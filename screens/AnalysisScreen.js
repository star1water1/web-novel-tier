/**
 * 분석 화면
 * @module screens/AnalysisScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 전체 작품 통계 분석 화면
 * Context: useApp(theme, appSettings), useData(list)
 */

import React, { memo, useMemo } from "react";
import {
  View,
  Text,
} from "react-native";
import { H, Section } from "../components/common/ui";
import { tierBadge, getTierColor } from "../components/common/ui";
import { 
  parsePlatforms,
  deriveMajorGenre,
  getDisplayTier,
} from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";

// ═══════════════════════════════════════════════════════════════
// 📌 AnalysisScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const AnalysisScreen = memo(() => {
  const { theme, appSettings } = useApp();
  const { list } = useData();
  const C = theme;
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 통계 계산
  // ─────────────────────────────────────────────────────────────
  const analysisStats = useMemo(() => {
    const total = list.length;
    const byTier = { S: 0, A: 0, "B+": 0, B: 0, "B-": 0, C: 0 };
    const byPlat = {};
    const byGenre = {};
    const byAuthor = {};
    let sum = 0;
    let totalReadCount = 0;
    let totalMatches = 0;

    for (const n of list) {
      // 레이팅 합계
      sum += n.rating || 1500;
      
      // 티어별
      const t = getDisplayTier(n, globalTierThresholds);
      byTier[t] = (byTier[t] || 0) + 1;
      
      // 플랫폼별
      const plats = parsePlatforms(n.platforms);
      for (const p of plats) {
        byPlat[p] = (byPlat[p] || 0) + 1;
      }
      
      // 장르별
      const genre = deriveMajorGenre(n.tags);
      if (genre) {
        byGenre[genre] = (byGenre[genre] || 0) + 1;
      }
      
      // 작가별
      const author = (n.author || "").trim();
      if (author) {
        byAuthor[author] = (byAuthor[author] || 0) + 1;
      }
      
      // 읽은 회차 합계
      totalReadCount += n.read_count || 0;
      
      // 매칭 수 합계
      totalMatches += n.match_count || 0;
    }

    const avg = total ? sum / total : 0;

    return {
      total,
      avg,
      byTier,
      byPlat,
      byGenre,
      byAuthor,
      totalReadCount,
      totalMatches,
    };
  }, [list, globalTierThresholds]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>분석</H>
      
      {/* 요약 */}
      <Section title={`요약 (총 ${analysisStats.total}작)`} theme={C}>
        <Text style={{ color: C.text, fontWeight: "700" }}>
          평균 레이팅: {analysisStats.avg.toFixed(1)}
        </Text>
        <View style={{ height: 8 }} />
        
        {/* 티어별 분포 */}
        {Object.entries(analysisStats.byTier).map(([t, n]) => {
          const r = analysisStats.total ? n / analysisStats.total : 0;
          const color = getTierColor(t);
          return (
            <View key={t} style={{ marginBottom: 8 }}>
              <Text style={{ color: C.sub, marginBottom: 4 }}>{t} · {n}작</Text>
              <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
                <View style={{ width: `${Math.round(r * 100)}%`, height: "100%", backgroundColor: color }} />
              </View>
            </View>
          );
        })}
      </Section>

      {/* 플랫폼별 */}
      <Section title="플랫폼별 분포" theme={C}>
        {Object.entries(analysisStats.byPlat).sort((a, b) => b[1] - a[1]).map(([p, cnt]) => (
          <View key={p} style={{ marginBottom: 8 }}>
            <Text style={{ color: C.sub, marginBottom: 4 }}>{p} · {cnt}작</Text>
            <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
              <View style={{ width: `${Math.round(cnt / (analysisStats.total || 1) * 100)}%`, height: "100%", backgroundColor: C.ok }} />
            </View>
          </View>
        ))}
        {Object.keys(analysisStats.byPlat).length === 0 && (
          <Text style={{ color: C.sub }}>플랫폼 정보가 없습니다.</Text>
        )}
      </Section>

      {/* 장르별 */}
      <Section title="장르별 분포" theme={C}>
        {Object.entries(analysisStats.byGenre).sort((a, b) => b[1] - a[1]).map(([g, cnt]) => (
          <View key={g} style={{ marginBottom: 8 }}>
            <Text style={{ color: C.sub, marginBottom: 4 }}>{g} · {cnt}작</Text>
            <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
              <View style={{ width: `${Math.round(cnt / (analysisStats.total || 1) * 100)}%`, height: "100%", backgroundColor: "#6366f1" }} />
            </View>
          </View>
        ))}
        {Object.keys(analysisStats.byGenre).length === 0 && (
          <Text style={{ color: C.sub }}>장르 정보가 없습니다.</Text>
        )}
      </Section>

      {/* 작가별 (상위 10명) */}
      <Section title="작가별 작품 수 (상위 10명)" theme={C}>
        {Object.entries(analysisStats.byAuthor)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([author, cnt]) => (
            <View key={author} style={{ marginBottom: 8 }}>
              <Text style={{ color: C.sub, marginBottom: 4 }}>{author} · {cnt}작</Text>
              <View style={{ height: 10, backgroundColor: C.chip, borderRadius: 8, overflow: "hidden" }}>
                <View style={{ width: `${Math.round(cnt / (analysisStats.total || 1) * 100)}%`, height: "100%", backgroundColor: "#ec4899" }} />
              </View>
            </View>
          ))}
        {Object.keys(analysisStats.byAuthor).length === 0 && (
          <Text style={{ color: C.sub }}>작가 정보가 없습니다.</Text>
        )}
      </Section>

      {/* 기타 통계 */}
      <Section title="기타 통계" theme={C}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: C.text, fontWeight: "800", fontSize: 18 }}>{analysisStats.totalReadCount.toLocaleString()}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>총 읽은 회차</Text>
          </View>
          <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: C.text, fontWeight: "800", fontSize: 18 }}>{analysisStats.totalMatches.toLocaleString()}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>총 매칭 수</Text>
          </View>
          <View style={{ backgroundColor: C.chip, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: C.text, fontWeight: "800", fontSize: 18 }}>{Object.keys(analysisStats.byAuthor).length}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>등록 작가 수</Text>
          </View>
        </View>
      </Section>
    </>
  );
});

AnalysisScreen.displayName = "AnalysisScreen";

export default AnalysisScreen;
