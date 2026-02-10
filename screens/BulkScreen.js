/**
 * 대량 편집 화면
 * @module screens/BulkScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 여러 작품을 한 번에 편집하는 화면
 * Context: useApp(theme, appSettings), useData(selectedIds, toggleSelect, batch*), useFilter(bulkFiltered, bulkSortKey)
 */

import React, { memo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { H, Section, Chip, PrimaryButton, OutlineButton } from "../components/common/ui";
import { TierTag } from "../components/common/ui";
import { AwardsRow } from "../components/novel/NovelCard";
import { parsePlatforms } from "../utils/helpers";
import { PLATFORM_OPTIONS } from "../constants/config";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useFilter } from "../contexts/FilterContext";
import { useModal } from "../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 BulkScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const BulkScreen = memo(() => {
  const { theme, appSettings } = useApp();
  const {
    selectedIds, setSelectedIds, toggleSelect,
    bulkTag, setBulkTag, bulkPlats, setBulkPlats, bulkDelta, setBulkDelta,
    batchAddTag, batchRemoveTag, batchSetPlatforms, batchIncReadCount, batchDeleteNovels: batchDelete,
  } = useData();
  const { bulkFiltered, bulkSortKey, setBulkSortKey } = useFilter();
  const { openEdit } = useModal();
  const C = theme;
  // 대량편집 전용 검색 (로컬)
  const [query, setQuery] = useState("");
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 전체 선택/해제
  // ─────────────────────────────────────────────────────────────
  const selectAll = useCallback(() => {
    const allIds = bulkFiltered.map(n => n.id);
    setSelectedIds(allIds);
  }, [bulkFiltered, setSelectedIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>🔧 대량 편집 모드</H>
      
      {/* 선택/검색 */}
      <Section title="선택 / 검색" theme={C}>
        <TextInput
          value={query}
          onChangeText={setQuery}
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
        <Text style={{ 
          color: selectedIds.length > 0 ? C.primary : C.sub, 
          marginTop: 6, 
          fontWeight: selectedIds.length > 0 ? "800" : "400", 
          fontSize: selectedIds.length > 0 ? 16 : 14 
        }}>
          {selectedIds.length > 0 ? `✓ ${selectedIds.length}개 선택됨` : "선택된 작품 없음"} / 총 {bulkFiltered.length}
        </Text>
        
        {/* 전체 선택/해제 버튼 */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <OutlineButton
            title="전체 선택"
            onPress={selectAll}
            style={{ flex: 1 }}
            theme={C}
          />
          <OutlineButton
            title="전체 해제"
            onPress={deselectAll}
            style={{ flex: 1 }}
            theme={C}
          />
        </View>
      </Section>

      {/* 정렬 */}
      <Section title="정렬" theme={C}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            ["레이팅", "rating"],
            ["제목", "title"],
            ["등록순", "created"],
            ["읽은 회차", "read"],
          ].map(([label, key]) => (
            <Chip
              key={key}
              label={label}
              active={bulkSortKey === key}
              onPress={() => setBulkSortKey(key)}
              theme={C}
            />
          ))}
        </View>
      </Section>

      {/* 작업 */}
      <Section title="작업" theme={C}>
        {/* 태그 추가/삭제 */}
        <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
          태그 추가/삭제
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            placeholder="태그 입력"
            value={bulkTag}
            onChangeText={setBulkTag}
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 16,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="추가"
            onPress={() => batchAddTag(bulkTag)}
            disabled={selectedIds.length === 0}
            theme={C}
          />
          <OutlineButton
            title="삭제"
            onPress={() => batchRemoveTag(bulkTag)}
            disabled={selectedIds.length === 0}
            theme={C}
          />
        </View>

        {/* 플랫폼 일괄 설정 */}
        <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
          플랫폼 일괄 설정
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
          {PLATFORM_OPTIONS.map((p) => (
            <Chip
              key={p}
              label={p}
              active={bulkPlats.includes(p)}
              onPress={() => {
                setBulkPlats((prev) =>
                  prev.includes(p)
                    ? prev.filter((x) => x !== p)
                    : [...prev, p]
                );
              }}
              theme={C}
            />
          ))}
        </View>
        <OutlineButton
          title="플랫폼 적용"
          onPress={() => batchSetPlatforms(bulkPlats)}
          disabled={selectedIds.length === 0}
          style={{ marginBottom: 12 }}
          theme={C}
        />

        {/* 읽은 회차 수 증감 */}
        <Text style={{ fontWeight: "700", marginBottom: 6, color: C.text }}>
          읽은 회차 수 증감
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            placeholder="±숫자 (예: 10, -3)"
            value={bulkDelta}
            onChangeText={setBulkDelta}
            keyboardType="number-pad"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 16,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="적용"
            onPress={() => batchIncReadCount(bulkDelta)}
            disabled={selectedIds.length === 0}
            theme={C}
          />
        </View>

        {/* 삭제/해제 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <OutlineButton
            title="선택 삭제"
            color={C.warn}
            onPress={batchDelete}
            disabled={selectedIds.length === 0}
            style={{ flex: 1 }}
            theme={C}
          />
          <OutlineButton
            title="선택 전체 취소"
            onPress={deselectAll}
            style={{ flex: 1 }}
            theme={C}
          />
        </View>
      </Section>

      {/* 목록 */}
      <Section title={`목록 (${bulkFiltered.length})`} theme={C}>
        {bulkFiltered.map((item) => {
          const checked = selectedIds.includes(item.id);
          const plats = parsePlatforms(item.platforms);
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleSelect(item.id)}
              style={{
                borderWidth: 2,
                borderColor: checked ? C.primary : C.line,
                backgroundColor: checked ? (C.chip || "#EEF4FF") : C.card,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontWeight: "800", color: C.text }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <AwardsRow awardsJson={item.awards} />
                  <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }} numberOfLines={2}>
                    {item.author || "-"} · R {(item.rating || 1500).toFixed(1)} · 
                    태그 {item.tags || "-"} · 
                    플랫폼 {plats.join(", ") || "-"}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <TierTag rating={item.rating} thresholds={globalTierThresholds} />
                  {checked && (
                    <Text style={{ color: C.primary, fontWeight: "800", fontSize: 12, marginTop: 4 }}>
                      ✓
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </Section>
    </>
  );
});

BulkScreen.displayName = "BulkScreen";

export default BulkScreen;
