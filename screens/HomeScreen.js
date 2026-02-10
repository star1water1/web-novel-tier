/**
 * 홈 화면
 * @module screens/HomeScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @bugfix v6.1.2
 * - [FIX] "작품 추가" 버튼이 폼 데이터를 addNovel에 전달하지 않던 버그 수정
 *   → handleAddNovel 래퍼 추가, 폼 데이터 조립 후 전달 + 성공 시 폼 초기화
 *
 * @description
 * 작품 등록 및 목록 관리 메인 화면
 * Context: useApp, useData, useFilter, useModal, useTag
 * 로컬 상태: 등록 폼 필드 (title, author, tags, platforms, note, readCount, totalEpisodes, newCoverImage)
 */

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { H, Section, Label, Chip, PrimaryButton, OutlineButton } from "../components/common/ui";
import { TierTag, tierBadge } from "../components/common/ui";
import { AwardsRow, CoverImage } from "../components/novel/NovelCard";
import { parsePlatforms, deriveMajorGenre, getDisplayTier } from "../utils/helpers";
import { PLATFORM_OPTIONS, STATUS_OPTIONS, GENRE_OPTIONS } from "../constants/config";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useFilter } from "../contexts/FilterContext";
import { useModal } from "../contexts/ModalContext";
import { useTag } from "../contexts/TagContext";

// ═══════════════════════════════════════════════════════════════
// 📌 HomeScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const HomeScreen = memo(() => {
  const { theme, isDark, appSettings, setScreen } = useApp();
  const { list, addNovel, removeNovel, pickImage } = useData();
  const {
    homeFiltered, homeQuery, setHomeQuery,
    homeSortKey, setHomeSortKey, homeSortDir, setHomeSortDir,
    filterTier, setFilterTier, filterPlatform, setFilterPlatform,
    filterGenre, setFilterGenre, filterStatus, setFilterStatus,
    reviewCount, searchIncludeTags, searchExcludeTags,
    setSearchTagModalOpen, setSearchTagModalMode,
  } = useFilter();
  const { openEdit, openLogs, openUrl, openCoverSelect, openTagSelect } = useModal();
  const { allTags } = useTag();
  const C = theme;

  // ── 등록 폼 로컬 상태 ──
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [note, setNote] = useState("");
  const [readCount, setReadCount] = useState("");
  const [totalEpisodes, setTotalEpisodes] = useState("");
  const [newCoverImage, setNewCoverImage] = useState("");

  // ── 표지/태그 관련 헬퍼 ──
  const openUrlModal = useCallback(() => openUrl(setNewCoverImage), [openUrl]);
  const pickImageFromGallery = useCallback(async () => {
    const uri = await pickImage();
    if (uri) setNewCoverImage(uri);
  }, [pickImage]);
  const setCoverSelectTarget = useCallback(() => openCoverSelect("new", setNewCoverImage), [openCoverSelect, setNewCoverImage]);
  const openTagSelectForNew = useCallback(() => {
    openTagSelect((selected) => setTags(selected.join(",")));
  }, [openTagSelect]);

  // ── 작품 추가 핸들러 (폼 데이터 조립) ──
  const handleAddNovel = useCallback(async () => {
    if (!(title || "").trim()) {
      return;
    }
    const novelData = {
      title: title.trim(),
      author: author.trim(),
      tags: tags.trim(),
      platforms,
      note: note.trim(),
      readCount: parseInt(readCount, 10) || 0,
      totalEpisodes: parseInt(totalEpisodes, 10) || 0,
      coverImage: newCoverImage,
    };
    const result = await addNovel(novelData);
    if (result && result.success) {
      // 폼 초기화
      setTitle(""); setAuthor(""); setTags(""); setPlatforms([]);
      setNote(""); setReadCount(""); setTotalEpisodes(""); setNewCoverImage("");
    }
  }, [title, author, tags, platforms, note, readCount, totalEpisodes, newCoverImage, addNovel]);

  // ── 최근 읽은 작품 (빠른 접근) ──
  const quickAccessRecent = useMemo(() => {
    if (!list || list.length === 0) return [];
    return [...list]
      .filter((n) => n.read_count_updated_at)
      .sort((a, b) => (b.read_count_updated_at || 0) - (a.read_count_updated_at || 0))
      .slice(0, 5);
  }, [list]);
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 플랫폼 토글
  // ─────────────────────────────────────────────────────────────
  const togglePlatform = useCallback((p) => {
    setPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }, [setPlatforms]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* 🏆 검토 대기 알림 배너 */}
      {reviewCount > 0 && appSettings?.showReviewBanner !== false && (
        <TouchableOpacity
          onPress={() => setScreen("review")}
          style={{
            backgroundColor: "#fef3c7",
            borderWidth: 1,
            borderColor: "#f59e0b",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🏆</Text>
            <View>
              <Text style={{ fontWeight: "700", color: "#92400e" }}>
                티어 검토 대기 {reviewCount}건
              </Text>
              <Text style={{ fontSize: 12, color: "#b45309" }}>
                S/A 승급/강등 검토가 필요합니다
              </Text>
            </View>
          </View>
          <Text style={{ color: "#92400e", fontWeight: "700" }}>검토 →</Text>
        </TouchableOpacity>
      )}
      
      <H theme={C}>작품 등록</H>
      
      <Section title="기본 정보" theme={C}>
        {/* 표지 이미지 */}
        <Label theme={C}>표지 이미지</Label>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
          {newCoverImage ? (
            <ExpoImage 
              source={{ uri: newCoverImage }} 
              style={{ width: 50, height: 70, borderRadius: 6 }} 
              contentFit="cover" 
              cachePolicy="memory-disk" 
            />
          ) : (
            <View style={{ width: 50, height: 70, borderRadius: 6, backgroundColor: C.line, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: C.sub, fontSize: 10 }}>없음</Text>
            </View>
          )}
          <OutlineButton title="URL" onPress={openUrlModal} style={{ minWidth: 60 }} theme={C} />
          <OutlineButton title="갤러리" onPress={pickImageFromGallery} style={{ minWidth: 70 }} theme={C} />
          <OutlineButton 
            title="라이브러리" 
            onPress={() => openCoverSelect("new", setNewCoverImage)} 
            color={C.primary}
            style={{ minWidth: 90 }}
            theme={C}
          />
          {newCoverImage && (
            <OutlineButton 
              title="삭제" 
              onPress={() => setNewCoverImage("")} 
              color={C.warn}
              style={{ minWidth: 60 }}
              theme={C}
            />
          )}
        </View>
        
        <Label theme={C}>제목</Label>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="제목"
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
        
        <Label style={{ marginTop: 10 }} theme={C}>작가 (선택)</Label>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="작가"
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
        
        <Label style={{ marginTop: 10 }} theme={C}>태그 (쉼표 구분)</Label>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="예: 무협, 현판, 헌터"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
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
          <OutlineButton
            title="태그 선택"
            onPress={openTagSelectForNew}
            theme={C}
          />
        </View>
        
        <Label style={{ marginTop: 10 }} theme={C}>연재처 (복수 선택 가능)</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {PLATFORM_OPTIONS.map((p) => (
            <Chip
              key={p}
              label={p}
              active={platforms.includes(p)}
              onPress={() => togglePlatform(p)}
              theme={C}
            />
          ))}
        </View>
        
        <Label style={{ marginTop: 10 }} theme={C}>읽은 회차 수 (숫자)</Label>
        <TextInput
          value={readCount}
          onChangeText={setReadCount}
          keyboardType="number-pad"
          placeholder="예: 37"
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
        
        <Label style={{ marginTop: 10 }} theme={C}>전체 회차 수 (선택)</Label>
        <TextInput
          value={totalEpisodes}
          onChangeText={setTotalEpisodes}
          keyboardType="number-pad"
          placeholder="예: 120"
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
        
        <Label style={{ marginTop: 10 }} theme={C}>메모</Label>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="메모"
          multiline
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
            minHeight: 80,
          }}
        />
        
        <PrimaryButton
          title="작품 추가"
          onPress={handleAddNovel}
          disabled={!(title || "").trim()}
          style={{ marginTop: 12 }}
          theme={C}
        />
      </Section>
      
      <H theme={C}>작품 목록</H>
      
      {/* 최근 읽은 작품 (빠른 접근) */}
      {quickAccessRecent && quickAccessRecent.length > 0 && (
        <Section title="📖 최근 읽은 작품" theme={C}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {quickAccessRecent.slice(0, 5).map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => openEdit(n)}
                  style={{
                    width: 120,
                    padding: 10,
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.line,
                  }}
                >
                  {n.cover_image && (
                    <CoverImage
                      uri={n.cover_image}
                      size={100}
                      style={{ borderRadius: 8, marginBottom: 8 }}
                    />
                  )}
                  <Text style={{ fontWeight: "700", color: C.text, fontSize: 13 }} numberOfLines={2}>
                    {n.title}
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                    {n.author || "작가 미상"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <TierTag rating={n.rating} thresholds={globalTierThresholds} />
                    <Text style={{ color: C.sub, fontSize: 10, marginLeft: 6 }}>
                      {n.read_count}화
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Section>
      )}
      
      {/* 검색 / 정렬 */}
      <Section title="검색 / 정렬" theme={C}>
        <TextInput
          value={homeQuery}
          onChangeText={setHomeQuery}
          placeholder="제목/작가/태그/메모/플랫폼 검색"
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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
          {[
            ["레이팅", "rating"],
            ["제목", "title"],
            ["등록순", "created"],
            ["읽은 회차", "read"],
          ].map(([label, key]) => (
            <Chip
              key={key}
              label={label}
              active={homeSortKey === key}
              onPress={() => setHomeSortKey(key)}
              theme={C}
            />
          ))}
          <TouchableOpacity
            onPress={() => setHomeSortDir(prev => prev === "DESC" ? "ASC" : "DESC")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <Text style={{ color: C.sub, fontWeight: "700" }}>
              {homeSortDir === "DESC" ? "↓ 내림차순" : "↑ 오름차순"}
            </Text>
          </TouchableOpacity>
        </View>
      </Section>
      
      {/* 고급 필터 */}
      <Section title="고급 필터" theme={C}>
        <Label theme={C}>티어</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {["ALL", "S", "A", "B+", "B", "B-", "C"].map((t) => (
            <Chip key={t} label={t === "ALL" ? "전체" : t} active={filterTier === t} onPress={() => setFilterTier(t)} theme={C} />
          ))}
        </View>
        <Label style={{ marginTop: 8 }} theme={C}>플랫폼</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="전체" active={filterPlatform === "ALL"} onPress={() => setFilterPlatform("ALL")} theme={C} />
          {PLATFORM_OPTIONS.map((p) => (
            <Chip key={p} label={p} active={filterPlatform === p} onPress={() => setFilterPlatform(p)} theme={C} />
          ))}
        </View>
        <Label style={{ marginTop: 8 }} theme={C}>장르</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="전체" active={filterGenre === "ALL"} onPress={() => setFilterGenre("ALL")} theme={C} />
          {GENRE_OPTIONS.map((g) => (
            <Chip key={g} label={g} active={filterGenre === g} onPress={() => setFilterGenre(g)} theme={C} />
          ))}
        </View>
        <Label style={{ marginTop: 8 }} theme={C}>읽기 상태</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="전체" active={filterStatus === "ALL"} onPress={() => setFilterStatus("ALL")} theme={C} />
          {STATUS_OPTIONS.map((s) => (
            <Chip key={s.key} label={s.label} active={filterStatus === s.key} onPress={() => setFilterStatus(s.key)} theme={C} />
          ))}
        </View>
      </Section>
      
      {/* 현재 순위 */}
      <Section title={`현재 순위 (${homeFiltered.length})`} theme={C}>
        {homeFiltered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📚</Text>
            <Text style={{ color: C.sub, textAlign: "center" }}>
              작품이 없습니다.{"\n"}위에서 추가해보세요!
            </Text>
          </View>
        ) : (
          homeFiltered.map((item, index) => {
            const plats = parsePlatforms(item.platforms);
            const majorGenre = deriveMajorGenre(item.tags);
            const { c } = tierBadge(item.rating || 1500, globalTierThresholds);
            
            return (
              <View
                key={item.id}
                style={{
                  padding: 14,
                  backgroundColor: C.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.line,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flexDirection: "row", flex: 1 }}>
                    {item.cover_image && (
                      <CoverImage
                        uri={item.cover_image}
                        size={60}
                        style={{ marginRight: 12, borderRadius: 6 }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }} numberOfLines={1}>
                        {index + 1}. {item.title}
                      </Text>
                      <AwardsRow awardsJson={item.awards} />
                      <Text style={{ color: C.sub, marginTop: 6 }} numberOfLines={2}>
                        {item.author || "-"} · R {(item.rating || 1500).toFixed(1)} · 
                        RD {Math.round(item.rd || 350)} · 
                        W{item.wins}/L{item.losses} · 
                        읽음 {item.read_count} · 
                        {plats.join(", ") || "-"}
                      </Text>
                    </View>
                  </View>
                  <TierTag rating={item.rating} thresholds={globalTierThresholds} />
                </View>
                
                <View style={{ flexDirection: "row", marginTop: 10, gap: 8, flexWrap: "wrap" }}>
                  <OutlineButton
                    title="수정"
                    onPress={() => openEdit(item)}
                    style={{ flex: 1 }}
                    theme={C}
                  />
                  <OutlineButton
                    title="기록"
                    onPress={() => openLogs(item)}
                    style={{ flex: 1 }}
                    theme={C}
                  />
                  <OutlineButton
                    title="삭제"
                    onPress={() => removeNovel(item.id)}
                    color={C.warn}
                    style={{ flex: 1 }}
                    theme={C}
                  />
                </View>
              </View>
            );
          })
        )}
      </Section>
    </>
  );
});

HomeScreen.displayName = "HomeScreen";

export default HomeScreen;
