/**
 * 예정 작품 화면
 * @module screens/PlannedScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @bugfix v6.1.2
 * - [FIX] "예정 작품 추가" 버튼이 폼 데이터를 전달하지 않던 버그 수정
 *   → handleAddPlanned 래퍼 추가, 폼 데이터 조립 후 전달 + 성공 시 폼 초기화
 * - [FIX] confirmConvert에서 convertPlannedToNovel(item.id)로 ID만 전달하던 버그 수정
 *   → item 전체 객체 전달 (핸들러가 planned.title, planned.author 등 사용)
 *
 * @description
 * 아직 읽지 않은 예정 작품 관리 화면
 * Context: useApp, useData, useModal, useTag
 * 로컬 상태: 등록 폼 필드, 검색/정렬 필드
 */

import React, { memo, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { H, Section, Label, Chip, PrimaryButton, OutlineButton } from "../components/common/ui";
import { CoverImage } from "../components/novel/NovelCard";
import { parsePlatforms, deriveMajorGenre } from "../utils/helpers";
import { PLATFORM_OPTIONS } from "../constants/config";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useModal } from "../contexts/ModalContext";
import { useTag } from "../contexts/TagContext";

// ═══════════════════════════════════════════════════════════════
// 📌 우선순위 옵션
// ═══════════════════════════════════════════════════════════════
const PRIORITY_OPTIONS = [
  { value: 3, label: "🔥 높음", color: "#ef4444" },
  { value: 2, label: "⭐ 보통", color: "#f59e0b" },
  { value: 1, label: "📋 낮음", color: "#6b7280" },
];

// ═══════════════════════════════════════════════════════════════
// 📌 PlannedScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const PlannedScreen = memo(() => {
  const { theme, isDark } = useApp();
  const {
    plannedList, addPlanned: addPlannedNovel, removePlanned: removePlannedNovel,
    convertPlanned: convertPlannedToNovel, pickImage, checkDuplicate,
  } = useData();
  const { openPlannedEdit, openUrl, openCoverSelect, openTagSelect } = useModal();
  const C = theme;

  // ── 등록 폼 로컬 상태 ──
  const [plannedTitle, setPlannedTitle] = useState("");
  const [plannedAuthor, setPlannedAuthor] = useState("");
  const [plannedTags, setPlannedTags] = useState("");
  const [plannedPlatforms, setPlannedPlatforms] = useState([]);
  const [plannedNote, setPlannedNote] = useState("");
  const [plannedTotalEpisodes, setPlannedTotalEpisodes] = useState("");
  const [plannedPriority, setPlannedPriority] = useState(2);
  const [plannedCoverImage, setPlannedCoverImage] = useState("");
  const [plannedTitleDuplicateInfo, setPlannedTitleDuplicateInfo] = useState(null);

  // ── 검색/정렬 로컬 상태 ──
  const [plannedQuery, setPlannedQuery] = useState("");
  const [plannedSortKey, setPlannedSortKey] = useState("priority");
  const [plannedSortDir, setPlannedSortDir] = useState("DESC");
  const [plannedFilterPlatform, setPlannedFilterPlatform] = useState("ALL");

  // ── 헬퍼 ──
  const openUrlModal = useCallback(() => openUrl(setPlannedCoverImage), [openUrl]);
  const pickImageFromGallery = useCallback(async () => {
    const uri = await pickImage();
    if (uri) setPlannedCoverImage(uri);
  }, [pickImage]);
  const openTagSelectForPlanned = useCallback(() => {
    openTagSelect((selected) => setPlannedTags(selected.join(",")));
  }, [openTagSelect]);

  // ─────────────────────────────────────────────────────────────
  // 플랫폼 토글
  // ─────────────────────────────────────────────────────────────
  const togglePlatform = useCallback((p) => {
    setPlannedPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }, [setPlannedPlatforms]);

  // ─────────────────────────────────────────────────────────────
  // 예정작 추가 핸들러 (폼 데이터 조립)
  // ─────────────────────────────────────────────────────────────
  const handleAddPlanned = useCallback(async () => {
    if (!(plannedTitle || "").trim()) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }
    const data = {
      title: plannedTitle.trim(),
      author: plannedAuthor.trim(),
      tags: plannedTags.trim(),
      platforms: plannedPlatforms,
      note: plannedNote.trim(),
      totalEpisodes: parseInt(plannedTotalEpisodes, 10) || 0,
      priority: plannedPriority,
      coverImage: plannedCoverImage,
    };
    const result = await addPlannedNovel(data);
    if (result && result.success) {
      // 폼 초기화
      setPlannedTitle(""); setPlannedAuthor(""); setPlannedTags("");
      setPlannedPlatforms([]); setPlannedNote("");
      setPlannedTotalEpisodes(""); setPlannedPriority(2); setPlannedCoverImage("");
      setPlannedTitleDuplicateInfo(null);
    }
  }, [plannedTitle, plannedAuthor, plannedTags, plannedPlatforms, plannedNote,
      plannedTotalEpisodes, plannedPriority, plannedCoverImage, addPlannedNovel]);

  // ─────────────────────────────────────────────────────────────
  // 필터링된 목록
  // ─────────────────────────────────────────────────────────────
  const filteredPlannedList = useMemo(() => {
    if (!plannedList || plannedList.length === 0) return [];
    
    let result = [...plannedList];
    
    // 검색 필터
    const q = (plannedQuery || "").toLowerCase().trim();
    if (q) {
      result = result.filter(n => {
        const bank = [
          n.title || "",
          n.author || "",
          n.tags || "",
          n.note || "",
        ].join(" ").toLowerCase();
        return bank.includes(q);
      });
    }
    
    // 플랫폼 필터
    if (plannedFilterPlatform && plannedFilterPlatform !== "ALL") {
      result = result.filter(n => {
        const plats = parsePlatforms(n.platforms);
        return plats.includes(plannedFilterPlatform);
      });
    }
    
    // 정렬
    result.sort((a, b) => {
      let cmp = 0;
      if (plannedSortKey === "priority") {
        cmp = (b.priority || 1) - (a.priority || 1);
      } else if (plannedSortKey === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else if (plannedSortKey === "created") {
        cmp = (a.created_at || 0) - (b.created_at || 0);
      }
      return plannedSortDir === "DESC" ? -cmp : cmp;
    });
    
    return result;
  }, [plannedList, plannedQuery, plannedFilterPlatform, plannedSortKey, plannedSortDir]);

  // ─────────────────────────────────────────────────────────────
  // 삭제 확인
  // ─────────────────────────────────────────────────────────────
  const confirmRemove = useCallback((item) => {
    Alert.alert(
      "예정 작품 삭제",
      `"${item.title}"을(를) 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: () => removePlannedNovel(item.id),
        },
      ]
    );
  }, [removePlannedNovel]);

  // ─────────────────────────────────────────────────────────────
  // 본 목록 전환 확인
  // ─────────────────────────────────────────────────────────────
  const confirmConvert = useCallback((item) => {
    Alert.alert(
      "본 목록으로 전환",
      `"${item.title}"을(를) 본 목록으로 이동할까요?\n\n기본 레이팅 1500으로 등록됩니다.`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "전환",
          onPress: () => convertPlannedToNovel(item),
        },
      ]
    );
  }, [convertPlannedToNovel]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>📋 예정 작품</H>
      
      {/* 안내 문구 */}
      <View style={{
        backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#8b5cf6",
      }}>
        <Text style={{ color: isDark ? "#93c5fd" : "#1e40af", fontSize: 13, lineHeight: 20 }}>
          📋 아직 읽지 않았지만 읽을 예정인 작품을 관리합니다.{"\n"}
          예정 작품은 홈, 매칭, 취향분석, 수상 등의 기능에서 제외됩니다.{"\n"}
          '등록전환' 버튼을 눌러 실제로 읽기 시작하면 본 목록으로 이동하세요.
        </Text>
      </View>
      
      {/* 예정 작품 등록 폼 */}
      <Section title="예정 작품 추가" theme={C}>
        <Label theme={C}>제목 *</Label>
        <TextInput
          value={plannedTitle}
          onChangeText={setPlannedTitle}
          placeholder="작품 제목"
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
        
        {/* 중복 체크 */}
        {plannedTitleDuplicateInfo && (
          <View style={{ 
            backgroundColor: plannedTitleDuplicateInfo.type?.startsWith("exact") ? "#fef2f2" : "#fffbeb", 
            padding: 10, 
            borderRadius: 8, 
            marginTop: 6,
            borderLeftWidth: 3,
            borderLeftColor: plannedTitleDuplicateInfo.type?.startsWith("exact") ? "#ef4444" : "#f59e0b",
          }}>
            <Text style={{ 
              color: plannedTitleDuplicateInfo.type?.startsWith("exact") ? "#dc2626" : "#d97706", 
              fontWeight: "700",
              fontSize: 13,
            }}>
              ⚠️ {plannedTitleDuplicateInfo.message}
            </Text>
          </View>
        )}
        
        <Label style={{ marginTop: 10 }} theme={C}>작가</Label>
        <TextInput
          value={plannedAuthor}
          onChangeText={setPlannedAuthor}
          placeholder="작가명"
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
        
        <Label style={{ marginTop: 10 }} theme={C}>태그</Label>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={plannedTags}
            onChangeText={setPlannedTags}
            placeholder="쉼표로 구분 (예: 무협, 회귀)"
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
            onPress={openTagSelectForPlanned}
            theme={C}
          />
        </View>
        
        <Label style={{ marginTop: 10 }} theme={C}>연재처</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {PLATFORM_OPTIONS.map(p => (
            <Chip
              key={p}
              label={p}
              active={plannedPlatforms.includes(p)}
              onPress={() => togglePlatform(p)}
              theme={C}
            />
          ))}
        </View>
        
        <Label style={{ marginTop: 10 }} theme={C}>우선순위</Label>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {PRIORITY_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={plannedPriority === opt.value}
              onPress={() => setPlannedPriority(opt.value)}
              theme={C}
            />
          ))}
        </View>
        
        <Label style={{ marginTop: 10 }} theme={C}>전체 회차 수</Label>
        <TextInput
          value={plannedTotalEpisodes}
          onChangeText={setPlannedTotalEpisodes}
          placeholder="예: 120 (모르면 비워두세요)"
          keyboardType="number-pad"
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
        
        <Label style={{ marginTop: 10 }} theme={C}>표지 이미지</Label>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {plannedCoverImage ? (
            <ExpoImage
              source={{ uri: plannedCoverImage }}
              style={{ width: 50, height: 70, borderRadius: 6 }}
              contentFit="cover"
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
            onPress={() => openCoverSelect("planned", setPlannedCoverImage)} 
            color={C.primary}
            style={{ minWidth: 90 }}
            theme={C}
          />
          {plannedCoverImage && (
            <OutlineButton 
              title="삭제" 
              onPress={() => setPlannedCoverImage("")} 
              color={C.warn}
              style={{ minWidth: 60 }}
              theme={C}
            />
          )}
        </View>
        
        <Label style={{ marginTop: 10 }} theme={C}>메모</Label>
        <TextInput
          value={plannedNote}
          onChangeText={setPlannedNote}
          placeholder="관심 갖게 된 이유, 추천받은 곳 등"
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
          title="예정 작품 추가"
          onPress={handleAddPlanned}
          disabled={!(plannedTitle || "").trim()}
          style={{ marginTop: 12 }}
          theme={C}
        />
      </Section>
      
      {/* 검색 및 정렬 */}
      <Section title="검색 / 정렬" theme={C}>
        <TextInput
          value={plannedQuery}
          onChangeText={setPlannedQuery}
          placeholder="제목/작가/태그/메모 검색"
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
            ["우선순위", "priority"],
            ["제목", "title"],
            ["등록순", "created"],
          ].map(([label, key]) => (
            <Chip
              key={key}
              label={label}
              active={plannedSortKey === key}
              onPress={() => setPlannedSortKey(key)}
              theme={C}
            />
          ))}
          <TouchableOpacity
            onPress={() => setPlannedSortDir(prev => prev === "DESC" ? "ASC" : "DESC")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <Text style={{ color: C.sub, fontWeight: "700" }}>
              {plannedSortDir === "DESC" ? "↓ 내림차순" : "↑ 오름차순"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 플랫폼 필터 */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <Chip
            label="전체"
            active={!plannedFilterPlatform || plannedFilterPlatform === "ALL"}
            onPress={() => setPlannedFilterPlatform("ALL")}
            theme={C}
          />
          {PLATFORM_OPTIONS.map(p => (
            <Chip
              key={p}
              label={p}
              active={plannedFilterPlatform === p}
              onPress={() => setPlannedFilterPlatform(p)}
              theme={C}
            />
          ))}
        </View>
      </Section>
      
      {/* 예정 작품 목록 */}
      <Section title={`예정 목록 (${filteredPlannedList.length})`} theme={C}>
        {filteredPlannedList.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: C.sub, textAlign: "center" }}>
              예정 작품이 없습니다.{"\n"}위에서 추가해보세요!
            </Text>
          </View>
        ) : (
          filteredPlannedList.map((item, index) => {
            const plats = parsePlatforms(item.platforms);
            const priorityOpt = PRIORITY_OPTIONS.find(o => o.value === item.priority) || PRIORITY_OPTIONS[2];
            const majorGenre = deriveMajorGenre(item.tags);
            
            return (
              <View
                key={item.id}
                style={{
                  padding: 14,
                  backgroundColor: C.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderLeftWidth: 4,
                  borderLeftColor: priorityOpt.color,
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
                      <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }} numberOfLines={1}>
                        {item.author || "-"} · {plats.join(", ") || "-"}
                      </Text>
                      {majorGenre && (
                        <Text style={{ color: C.sub, fontSize: 12 }}>
                          장르: {majorGenre}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ 
                    backgroundColor: priorityOpt.color, 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 999,
                    marginLeft: 8,
                  }}>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>
                      {priorityOpt.label}
                    </Text>
                  </View>
                </View>
                
                {item.note && (
                  <Text style={{ color: C.sub, marginTop: 8, fontSize: 12, fontStyle: "italic" }} numberOfLines={2}>
                    📝 {item.note}
                  </Text>
                )}
                
                <View style={{ flexDirection: "row", marginTop: 10, gap: 8, flexWrap: "wrap" }}>
                  <OutlineButton
                    title="수정"
                    onPress={() => openPlannedEdit(item)}
                    style={{ flex: 1 }}
                    theme={C}
                  />
                  <PrimaryButton
                    title="등록전환"
                    onPress={() => confirmConvert(item)}
                    style={{ flex: 1 }}
                    theme={C}
                  />
                  <OutlineButton
                    title="삭제"
                    onPress={() => confirmRemove(item)}
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

PlannedScreen.displayName = "PlannedScreen";

export default PlannedScreen;
