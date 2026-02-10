/**
 * 작품 관련 컴포넌트 통합
 * @module components/novel/NovelCard
 * @merged NovelCard + CoverImage + AwardsRow
 *
 * @exports NovelCard, CoverImage, AwardsRow
 */
import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { getWinRate, isNewNovel, parsePlatforms, getFirstGenre } from "../../utils/helpers";
import { parseAwards, AWARD_META } from "../../constants/config";
import { ActualTierTag, StatusIcon, WorkStatusIcon, GaidenStatusIcon } from "../common/ui";


// ═══════════════════════════════════════════════════════════════
// 📌 CoverImage (표지 이미지)
// ═══════════════════════════════════════════════════════════════

export const CoverImage = memo(({ 
  uri, 
  platforms, 
  platformCovers = {}, 
  size = 50, 
  theme 
}) => {
  // 최종 URI 계산 (동기적으로 즉시)
  const finalUri = useMemo(() => {
    if (uri) return uri;
    if (platforms) {
      const plats = typeof platforms === "string" ? parsePlatforms(platforms) : platforms;
      for (const p of plats) {
        if (platformCovers[p]) return platformCovers[p];
      }
    }
    return null;
  }, [uri, platforms, platformCovers]);
  
  // 이미지 없으면 플레이스홀더
  if (!finalUri) {
    return (
      <View style={{ 
        width: size, 
        height: size * 1.4, 
        borderRadius: 6, 
        marginRight: 10,
        backgroundColor: theme?.line || '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ fontSize: size * 0.3, color: theme?.sub || '#9ca3af' }}>📖</Text>
      </View>
    );
  }
  
  return (
    <ExpoImage
      source={{ uri: finalUri }}
      style={{ width: size, height: size * 1.4, borderRadius: 6, marginRight: 10 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
    />
  );
});


// ═══════════════════════════════════════════════════════════════
// 📌 AwardsRow (수상 뱃지 행)
// ═══════════════════════════════════════════════════════════════

export const AwardsRow = memo(({ awardsJson, awardSystemSettings }) => {
  const items = parseAwards(awardsJson, awardSystemSettings);
  if (!items.length) return null;
  
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
      {items.map((a, idx) => {
        // 동적 설정에서 메타 찾기
        let meta = null;
        if (awardSystemSettings?.yearlyAwards?.[a.year]) {
          const found = awardSystemSettings.yearlyAwards[a.year].find(aw => aw.id === a.type);
          if (found) meta = { label: found.name, color: found.color, icon: found.icon };
        }
        // 없으면 레거시에서 찾기
        if (!meta) meta = AWARD_META[a.type];
        if (!meta) return null;
        
        return (
          <View
            key={`${a.year}-${a.type}-${idx}`}
            style={{
              backgroundColor: meta.color,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              marginRight: 6,
              marginBottom: 4,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {meta.icon && <Text style={{ marginRight: 3 }}>{meta.icon}</Text>}
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              {`${a.year} ${meta.label}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
});


// ═══════════════════════════════════════════════════════════════
// 📌 NovelCard (홈 화면 작품 카드)
// ═══════════════════════════════════════════════════════════════

export const NovelCard = memo(({ 
  item, 
  index, 
  onPress, 
  onLongPress,
  onTogglePin, 
  onLinkPress,
  compareMode, 
  isComparing, 
  platformCovers, 
  theme, 
  isDark,
  awardSystemSettings,
  getDisplayTier,
  tierFromRating,
  tierRank,
}) => {
  // 메모이제이션된 계산들
  const winRate = useMemo(() => getWinRate(item.wins, item.losses), [item.wins, item.losses]);
  const isNew = useMemo(() => isNewNovel(item.created_at), [item.created_at]);
  const plats = useMemo(() => parsePlatforms(item.platforms), [item.platforms]);
  
  const episodeText = useMemo(() => {
    const hasGaiden = item.gaiden_status && item.gaiden_status !== "none";
    if (hasGaiden) {
      const gaidenPart = item.gaiden_total_episodes > 0 
        ? `외전 ${item.gaiden_read_count || 0}/${item.gaiden_total_episodes}화`
        : `외전 ${item.gaiden_read_count || 0}화`;
      const mainPart = item.total_episodes > 0 ? `본편 ${item.total_episodes}화` : "";
      return mainPart ? `${gaidenPart} (${mainPart})` : gaidenPart;
    }
    return item.total_episodes > 0 
      ? `${item.read_count}/${item.total_episodes}화` 
      : `${item.read_count}화`;
  }, [item.gaiden_status, item.gaiden_read_count, item.gaiden_total_episodes, item.total_episodes, item.read_count]);

  const hasAwards = useMemo(() => item.awards && parseAwards(item.awards).length > 0, [item.awards]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
      style={{
        padding: 14,
        backgroundColor: isComparing ? (isDark ? "#1e3a5f" : "#e0f2fe") : theme.card,
        borderRadius: 14,
        borderWidth: isComparing ? 2 : (isNew ? 2 : 1),
        borderColor: isComparing ? theme.primary : (isNew ? "#fbbf24" : theme.line),
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* 표지 이미지 */}
        <CoverImage 
          uri={item.cover_image} 
          platforms={item.platforms} 
          platformCovers={platformCovers} 
          size={65} 
          theme={theme} 
        />
        
        <View style={{ flex: 1 }}>
          {/* 1줄: 순위 + 즐겨찾기 + NEW + 제목 + 티어 */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <TouchableOpacity 
              onPress={onTogglePin}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 16, color: item.pinned ? "#fbbf24" : theme.sub, marginRight: 4 }}>
                {item.pinned ? "★" : "☆"}
              </Text>
            </TouchableOpacity>
            {isNew && (
              <View style={{ backgroundColor: "#fbbf24", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginRight: 5 }}>
                <Text style={{ color: "#000", fontSize: 9, fontWeight: "800" }}>NEW</Text>
              </View>
            )}
            <Text style={{ fontWeight: "800", fontSize: 15, color: theme.text, flex: 1 }} numberOfLines={1}>
              {index + 1}. {item.title}
            </Text>
            <ActualTierTag 
              novel={item} 
              getDisplayTier={getDisplayTier}
              tierFromRating={tierFromRating}
              tierRank={tierRank}
            />
          </View>
          
          {/* 2줄: 작가 · 장르 + 우측 상태 아이콘 */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ color: theme.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
              {item.author || "작가 미상"}
              {getFirstGenre(item.major_genre) && <Text style={{ color: theme.sub }}> · {getFirstGenre(item.major_genre)}</Text>}
              {getFirstGenre(item.sub_genre) && <Text style={{ color: theme.sub }}> · {getFirstGenre(item.sub_genre)}</Text>}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
              <StatusIcon status={item.status} />
              <WorkStatusIcon workStatus={item.work_status} />
              <GaidenStatusIcon gaidenStatus={item.gaiden_status} />
            </View>
          </View>
          
          {/* 3줄: 레이팅 정보 */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ color: theme.sub, fontSize: 12 }}>
              <Text style={{ fontWeight: "700", color: theme.text }}>{item.rating.toFixed(1)}</Text>
              <Text> · W{item.wins}/L{item.losses} · 승률 </Text>
              <Text style={{ fontWeight: "600" }}>{winRate}%</Text>
              <Text> · RD {Math.round(item.rd)}</Text>
            </Text>
          </View>
          
          {/* 4줄: 읽은 회차 + 플랫폼 */}
          <Text style={{ color: theme.sub, fontSize: 12 }} numberOfLines={1}>
            📖 {episodeText} · {plats.length > 0 ? plats.join(", ") : "플랫폼 미지정"}
          </Text>
          
          {/* 수상 뱃지 */}
          {hasAwards && (
            <AwardsRow 
              awardsJson={item.awards} 
              awardSystemSettings={awardSystemSettings}
            />
          )}
        </View>
      </View>
      
      {/* 하단: 링크 버튼 */}
      {!compareMode && item.link && (
        <TouchableOpacity 
          onPress={onLinkPress}
          style={{ marginTop: 8, alignSelf: "flex-end" }}
        >
          <Text style={{ fontSize: 13, color: theme.primary }}>🔗 바로가기</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교: 필수 필드만 비교하여 불필요한 리렌더링 방지
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.rating === nextProps.item.rating &&
    prevProps.item.wins === nextProps.item.wins &&
    prevProps.item.losses === nextProps.item.losses &&
    prevProps.item.pinned === nextProps.item.pinned &&
    prevProps.item.cover_image === nextProps.item.cover_image &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.work_status === nextProps.item.work_status &&
    prevProps.item.read_count === nextProps.item.read_count &&
    prevProps.index === nextProps.index &&
    prevProps.isComparing === nextProps.isComparing &&
    prevProps.compareMode === nextProps.compareMode &&
    prevProps.isDark === nextProps.isDark
  );
});

export default NovelCard;
