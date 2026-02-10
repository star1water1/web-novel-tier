/**
 * 티어별 순위 화면
 * @module screens/RankScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 티어별로 정렬된 작품 순위 화면
 * Context: useApp(theme, appSettings), useData(list), useFilter(rankQuery, rankTier)
 */

import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
} from "react-native";
import { H, Section, Chip } from "../components/common/ui";
import { TierTag, tierBadge } from "../components/common/ui";
import { AwardsRow, CoverImage } from "../components/novel/NovelCard";
import { 
  deriveMajorGenre, 
  computeReliability,
  parsePlatforms,
} from "../utils/helpers";
import { awardsToSearchText } from "../constants/config";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useFilter } from "../contexts/FilterContext";

// ═══════════════════════════════════════════════════════════════
// 📌 RankScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const RankScreen = memo(() => {
  const { theme, appSettings } = useApp();
  const { list } = useData();
  const { rankQuery, setRankQuery, rankTier, setRankTier } = useFilter();
  const C = theme;
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 순위 목록 계산
  // ─────────────────────────────────────────────────────────────
  const rankedEntries = useMemo(() => {
    if (!list || list.length === 0) return [];

    // 1) 레이팅 내림차순 + 등록 순 + 제목 순 정렬
    const sorted = [...list].sort((a, b) => {
      const rA = a.rating || 1500;
      const rB = b.rating || 1500;
      if (rB !== rA) return rB - rA;
      const ac = a.created_at || 0;
      const bc = b.created_at || 0;
      if (ac !== bc) return ac - bc;
      return (a.title || "").localeCompare(b.title || "");
    });

    const q = (rankQuery || "").toLowerCase().trim();
    let rank = 0;
    const result = [];

    for (const n of sorted) {
      rank += 1; // 전역 순위

      const { t } = tierBadge(n.rating || 1500, globalTierThresholds);
      if (rankTier !== "ALL" && t !== rankTier) continue;

      // 검색용 문자열 구성
      const plats = parsePlatforms(n.platforms);
      const awardText = awardsToSearchText(n.awards);

      const bank = [
        n.title,
        n.author,
        n.tags,
        n.note,
        awardText,
        ...(plats || []),
      ]
        .join(" ")
        .toLowerCase();

      if (q && !bank.includes(q)) continue;

      result.push({ item: n, rank, tier: t });
    }

    return result;
  }, [list, rankQuery, rankTier, globalTierThresholds]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>티어별 순위</H>

      <Section title="검색 / 필터" theme={C}>
        <TextInput
          value={rankQuery}
          onChangeText={setRankQuery}
          placeholder="제목/작가/태그/플랫폼/수상 검색"
          placeholderTextColor={C.sub}
          style={{
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: C.text,
          }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
          {[
            ["전체", "ALL"],
            ["S", "S"],
            ["A", "A"],
            ["B+", "B+"],
            ["B", "B"],
            ["B-", "B-"],
            ["C", "C"],
          ].map(([label, key]) => (
            <Chip
              key={key}
              label={label}
              active={rankTier === key}
              onPress={() => setRankTier(key)}
              theme={C}
            />
          ))}
        </View>
      </Section>

      <Section title={`순위 목록 (총 ${rankedEntries.length}작)`} theme={C}>
        {rankedEntries.map(({ item, rank, tier }) => {
          const plats = parsePlatforms(item.platforms);
          const majorGenre = deriveMajorGenre(item.tags);
          const { c } = tierBadge(item.rating || 1500, globalTierThresholds);
          const reliability = computeReliability(item, list.length);
          const reliabilityText = reliability > 0 ? `${Math.round(reliability)}%` : "-";

          return (
            <View
              key={item.id}
              style={{
                padding: 14,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: c,
                backgroundColor: C.card,
                marginBottom: 10,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              {/* 상단: 티어, 순위+제목, 점수+신뢰도 */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", flex: 1 }}>
                  {item.cover_image && (
                    <CoverImage 
                      uri={item.cover_image} 
                      size={50} 
                      style={{ marginRight: 10, borderRadius: 6 }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TierTag rating={item.rating} thresholds={globalTierThresholds} />
                      <Text style={{ fontSize: 16, fontWeight: "800", marginLeft: 8, flex: 1, color: C.text }} numberOfLines={1}>
                        #{rank} {item.title}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                  <Text style={{ fontWeight: "800", color: c }}>
                    {(item.rating || 1500).toFixed(1)}
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                    신뢰도 {reliabilityText}
                  </Text>
                </View>
              </View>

              {/* 수상 뱃지 */}
              <AwardsRow awardsJson={item.awards} />

              {/* 메타 정보 */}
              <Text style={{ color: C.sub, marginTop: 6 }} numberOfLines={2}>
                {(() => {
                  const authorText = (item.author || "").trim() || "-";
                  const platsText = plats && plats.length ? plats.join(", ") : "-";
                  const readText = item.read_count && item.read_count > 0 ? String(item.read_count) : "-";
                  const genreText = majorGenre || "-";
                  return `${authorText} · ${platsText} · ${genreText} · 읽음 ${readText}회`;
                })()}
              </Text>
            </View>
          );
        })}
      </Section>
    </>
  );
});

RankScreen.displayName = "RankScreen";

export default RankScreen;
