/**
 * 설정 화면
 * @module screens/SettingsScreen
 * @version 6.1.4 (Context 아키텍처)
 *
 * @bugfix v6.1.4
 * - [FIX] 커스텀 태그 추가/삭제 시 setCustomTags(raw state setter) 직접 호출 → DB 미저장
 *   → addCustomTag/removeCustomTag 사용으로 변경 (DB 저장 보장)
 *
 * @bugfix v6.1.5
 * - [FIX] customComboTraits/customComboTargets 추가/삭제 시 raw setter만 호출 → DB 미저장
 *   → setAppMeta로 DB 직접 저장 추가 (4곳)
 *
 * @description
 * 앱 설정 관리 화면 (4개 서브탭)
 * Context: useApp(theme, isDark, darkMode, setDarkMode, appSettings, saveSettings, settingsSubTab, setSettingsSubTab)
 *          useData(rebuildAllFromMatches, resetAllMatches, resetAll)
 *          useTag(customTags, comboTags, tagSentiments, tagRelations, coordinateSystems, userMajorGenres, userSubGenres, ...)
 *          useModal(setImportOpen, setExportOpen, setTagRelationOpen, setCoordManageOpen)
 *
 * 서브탭:
 * - app: 테마, 표지, 티어 임계값 등
 * - tags: 태그 관리, 조합 요소, 관계도
 * - analysis: 패턴 학습, 장르 관리
 * - backup: 백업/복원, 유틸리티
 */

import React, { memo, useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { H, Section, Label, Chip, PrimaryButton, OutlineButton } from "../components/common/ui";
import { PLATFORM_OPTIONS } from "../constants/config";
import { 
  COMBO_TAG_TRAITS, 
  COMBO_TAG_TARGETS,
  MAJOR_GENRES,
  SUB_GENRES,
  DEFAULT_COORDINATE_SYSTEMS,
} from "../constants/tags";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";
import { useTag } from "../contexts/TagContext";
import { useModal } from "../contexts/ModalContext";
import { setAppMeta } from "../database"; // [FIX v6.1.5] combo traits/targets DB 저장용

// NavigationBar는 선택적 import (Android 전용)
let NavigationBar = null;
try {
  NavigationBar = require("expo-navigation-bar");
} catch (e) {
  // expo-navigation-bar 없으면 무시
}

// ═══════════════════════════════════════════════════════════════
// 📌 SettingsScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const SettingsScreen = memo(() => {
  const { theme, isDark, darkMode, setDarkMode, appSettings, saveSettings: saveAppSettings, settingsSubTab, setSettingsSubTab } = useApp();
  const { rebuildAllFromMatches, resetAllMatches: resetMatches, resetAll } = useData();
  const {
    customTags, setCustomTags,
    comboTags, setComboTags,
    customComboTraits, setCustomComboTraits,
    customComboTargets, setCustomComboTargets,
    tagSentiments, saveTagSentiments,
    tagRelations,
    coordinateSystems, setCoordinateSystems, saveCoordinateSystems: saveTagCoordinateSystems,
    userMajorGenres, setUserMajorGenres,
    userSubGenres, setUserSubGenres,
    addCustomTag, removeCustomTag,
  } = useTag();
  const {
    setImportOpen, setExportOpen, setTagManagerOpen,
    setTagRelationOpen: setTagRelationsOpen,
    setCoordManageOpen: openCoordManager,
  } = useModal();
  const C = theme;

  // 패턴 학습 (로컬 상태 스텁)
  const [patternLearningEnabled, setPatternLearningEnabled] = useState(false);
  const [learnedPatterns] = useState({});
  const clearLearnedPatterns = useCallback(() => {}, []);

  // 로컬 상태
  const [newCustomTag, setNewCustomTag] = useState("");
  const [newComboTrait, setNewComboTrait] = useState("");
  const [newComboTarget, setNewComboTarget] = useState("");
  const [newMajorGenre, setNewMajorGenre] = useState("");
  const [newSubGenre, setNewSubGenre] = useState("");

  // ─────────────────────────────────────────────────────────────
  // 앱 설정 서브탭
  // ─────────────────────────────────────────────────────────────
  const renderAppTab = () => (
    <>
      {/* 테마 */}
      <Section title="테마" theme={C}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: C.text, fontWeight: "700" }}>다크 모드</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Chip label="시스템" active={darkMode === null} onPress={() => setDarkMode(null)} theme={C} />
            <Chip label="라이트" active={darkMode === false} onPress={() => setDarkMode(false)} theme={C} />
            <Chip label="다크" active={darkMode === true} onPress={() => setDarkMode(true)} theme={C} />
          </View>
        </View>
        
        {/* 전체 화면 모드 */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: "700" }}>전체 화면 모드</Text>
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
              상단 상태바와 하단 네비게이션 바를 숨깁니다 (Android)
            </Text>
          </View>
          <Switch
            value={appSettings?.fullscreenMode === true}
            onValueChange={(v) => {
              saveAppSettings({ fullscreenMode: v });
              if (Platform.OS === "android" && NavigationBar) {
                try {
                  if (v) {
                    NavigationBar.setVisibilityAsync("hidden");
                    NavigationBar.setBehaviorAsync("overlay-swipe");
                  } else {
                    NavigationBar.setVisibilityAsync("visible");
                  }
                } catch (e) {
                  console.warn("NavigationBar error:", e);
                }
              }
            }}
          />
        </View>
      </Section>

      {/* 표지 라이브러리 설정 */}
      <Section title="🖼️ 표지 라이브러리" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          갤러리에서 이미지를 가져올 때 적용되는 압축 설정입니다.
        </Text>
        
        <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>이미지 압축 수준</Text>
        <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12 }}>
          {[
            { key: "original", label: "원본 유지", desc: "압축 없음 (1~5MB/장)" },
            { key: "high", label: "고품질", desc: "약간 압축 (300~800KB/장)" },
            { key: "medium", label: "중간", desc: "적당한 압축 (100~300KB/장)" },
            { key: "low", label: "저용량", desc: "강한 압축 (50~100KB/장)" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => saveAppSettings({ coverCompressionLevel: opt.key })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: opt.key !== "low" ? 1 : 0,
                borderBottomColor: C.line,
              }}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: appSettings?.coverCompressionLevel === opt.key ? C.primary : C.line,
                marginRight: 12,
                alignItems: "center",
                justifyContent: "center",
              }}>
                {appSettings?.coverCompressionLevel === opt.key && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: C.text }}>{opt.label}</Text>
                <Text style={{ fontSize: 12, color: C.sub }}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* 티어 임계값 */}
      <Section title="🎯 티어 임계값" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          각 티어의 레이팅 기준점을 설정합니다. 기본값은 S:1950, A:1850, B+:1700, B:1600, B-:1500입니다.
        </Text>
        
        {["S", "A", "B+", "B", "B-"].map((tier) => {
          const thresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };
          return (
            <View key={tier} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ width: 40, fontWeight: "700", color: C.text }}>{tier}</Text>
              <TextInput
                value={String(thresholds[tier] || "")}
                onChangeText={(v) => {
                  const newThresholds = { ...thresholds, [tier]: Number(v) || 0 };
                  saveAppSettings({ autoTierThresholds: newThresholds });
                }}
                keyboardType="number-pad"
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: C.text,
                }}
              />
            </View>
          );
        })}
        
        <OutlineButton
          title="기본값으로 초기화"
          onPress={() => {
            saveAppSettings({ autoTierThresholds: { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 } });
          }}
          style={{ marginTop: 8 }}
          theme={C}
        />
      </Section>

      {/* 검토 배너 */}
      <Section title="🏆 검토 알림" theme={C}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: "700" }}>홈 화면 검토 배너</Text>
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
              티어 검토 대기가 있을 때 홈 화면에 배너를 표시합니다
            </Text>
          </View>
          <Switch
            value={appSettings?.showReviewBanner !== false}
            onValueChange={(v) => saveAppSettings({ showReviewBanner: v })}
          />
        </View>
      </Section>
    </>
  );

  // ─────────────────────────────────────────────────────────────
  // 태그 설정 서브탭
  // ─────────────────────────────────────────────────────────────
  const renderTagsTab = () => (
    <>
      {/* 커스텀 태그 */}
      <Section title="🏷️ 커스텀 태그 관리" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          자주 사용하는 태그를 등록하면 태그 선택 시 빠르게 사용할 수 있습니다.
        </Text>
        
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            value={newCustomTag}
            onChangeText={setNewCustomTag}
            placeholder="새 태그 입력"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="추가"
            onPress={() => {
              const tag = newCustomTag.trim();
              if (!tag) return;
              if (customTags?.includes(tag)) {
                Alert.alert("알림", "이미 등록된 태그입니다.");
                return;
              }
              // [FIX v6.1.4] addCustomTag 사용 → DB 저장 보장
              addCustomTag(tag);
              setNewCustomTag("");
            }}
            theme={C}
          />
        </View>
        
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(customTags || []).map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              onLongPress={() => {
                Alert.alert("태그 삭제", `"${tag}" 태그를 삭제할까요?`, [
                  { text: "취소" },
                  { text: "삭제", style: "destructive", onPress: () => {
                    // [FIX v6.1.4] removeCustomTag 사용 → DB 저장 보장
                    removeCustomTag(tag);
                  }},
                ]);
              }}
              style={{
                backgroundColor: C.chip,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: C.text, fontWeight: "600" }}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {(customTags || []).length > 0 && (
          <Text style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>
            ※ 길게 눌러 삭제
          </Text>
        )}
      </Section>

      {/* 태그 감정 관리 */}
      <Section title="😊 태그 감정 설정" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          태그별로 긍정/부정/중립을 설정하여 취향 분석에 활용합니다.
        </Text>
        
        <PrimaryButton
          title="🏷️ 전체 태그 관리 열기"
          onPress={() => setTagManagerOpen(true)}
          theme={C}
        />
        
        {Object.keys(tagSentiments || {}).length > 0 && (
          <OutlineButton
            title="🔄 모든 태그 감정 초기화"
            onPress={() => {
              Alert.alert(
                "태그 감정 초기화",
                "모든 태그의 감정을 기본값으로 되돌립니다.",
                [
                  { text: "취소" },
                  { text: "초기화", style: "destructive", onPress: () => saveTagSentiments({}) },
                ]
              );
            }}
            color={C.warn}
            style={{ marginTop: 8 }}
            theme={C}
          />
        )}
      </Section>

      {/* 조합 요소 관리 */}
      <Section title="🔗 조합식 태그 요소" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          조합식 태그의 특성(예: 먼치킨)과 대상(예: 주인공)을 관리합니다.
        </Text>
        
        {/* 특성 추가 */}
        <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>특성 추가</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            value={newComboTrait}
            onChangeText={setNewComboTrait}
            placeholder="새 특성 (예: 천재적인)"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="추가"
            onPress={() => {
              const trait = newComboTrait.trim();
              if (!trait) return;
              if ([...COMBO_TAG_TRAITS, ...(customComboTraits || [])].includes(trait)) {
                Alert.alert("알림", "이미 등록된 특성입니다.");
                return;
              }
              setCustomComboTraits([...(customComboTraits || []), trait]);
              setAppMeta("custom_combo_traits", [...(customComboTraits || []), trait]); // [FIX v6.1.5] DB 저장
              setNewComboTrait("");
            }}
            theme={C}
          />
        </View>
        
        {/* 대상 추가 */}
        <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>대상 추가</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            value={newComboTarget}
            onChangeText={setNewComboTarget}
            placeholder="새 대상 (예: 사부)"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="추가"
            onPress={() => {
              const target = newComboTarget.trim();
              if (!target) return;
              if ([...COMBO_TAG_TARGETS, ...(customComboTargets || [])].includes(target)) {
                Alert.alert("알림", "이미 등록된 대상입니다.");
                return;
              }
              setCustomComboTargets([...(customComboTargets || []), target]);
              setAppMeta("custom_combo_targets", [...(customComboTargets || []), target]); // [FIX v6.1.5] DB 저장
              setNewComboTarget("");
            }}
            theme={C}
          />
        </View>
        
        {/* 커스텀 요소 목록 */}
        {((customComboTraits || []).length > 0 || (customComboTargets || []).length > 0) && (
          <View style={{ backgroundColor: C.chip, padding: 12, borderRadius: 12 }}>
            {(customComboTraits || []).length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>커스텀 특성:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {customComboTraits.map((t, i) => (
                    <TouchableOpacity
                      key={i}
                      onLongPress={() => {
                        Alert.alert("특성 삭제", `"${t}"를 삭제할까요?`, [
                          { text: "취소" },
                          { text: "삭제", style: "destructive", onPress: () => {
                            const updated = customComboTraits.filter((_, j) => j !== i);
                            setCustomComboTraits(updated);
                            setAppMeta("custom_combo_traits", updated); // [FIX v6.1.5] DB 저장
                          }},
                        ]);
                      }}
                      style={{ backgroundColor: "#e0e7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                    >
                      <Text style={{ color: "#3730a3", fontSize: 12 }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {(customComboTargets || []).length > 0 && (
              <View>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>커스텀 대상:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {customComboTargets.map((t, i) => (
                    <TouchableOpacity
                      key={i}
                      onLongPress={() => {
                        Alert.alert("대상 삭제", `"${t}"를 삭제할까요?`, [
                          { text: "취소" },
                          { text: "삭제", style: "destructive", onPress: () => {
                            const updated = customComboTargets.filter((_, j) => j !== i);
                            setCustomComboTargets(updated);
                            setAppMeta("custom_combo_targets", updated); // [FIX v6.1.5] DB 저장
                          }},
                        ]);
                      }}
                      style={{ backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                    >
                      <Text style={{ color: "#92400e", fontSize: 12 }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>※ 길게 눌러 삭제</Text>
          </View>
        )}
      </Section>

      {/* 태그 관계도 */}
      <Section title="🔗 태그 관계도" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          유사한 태그들을 그룹으로 묶거나 상반되는 관계를 설정합니다.
        </Text>
        
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#dbeafe", padding: 12, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#1d4ed8" }}>
              {Object.values(tagRelations?.groups || {}).filter(g => g.type === "similar").length}
            </Text>
            <Text style={{ fontSize: 11, color: "#1d4ed8" }}>유사 그룹</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#fef3c7", padding: 12, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#92400e" }}>
              {Object.values(tagRelations?.groups || {}).filter(g => g.type === "opposite").length}
            </Text>
            <Text style={{ fontSize: 11, color: "#92400e" }}>상반 관계</Text>
          </View>
        </View>
        
        <PrimaryButton
          title="🔗 태그 관계 관리 열기"
          onPress={() => setTagRelationsOpen(true)}
          theme={C}
        />
      </Section>
    </>
  );

  // ─────────────────────────────────────────────────────────────
  // 분석 설정 서브탭
  // ─────────────────────────────────────────────────────────────
  const renderAnalysisTab = () => (
    <>
      {/* 패턴 학습 */}
      <Section title="🧠 패턴 학습" theme={C}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: "700" }}>패턴 학습 활성화</Text>
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
              매칭 결과를 분석하여 취향 패턴을 학습합니다
            </Text>
          </View>
          <Switch
            value={patternLearningEnabled}
            onValueChange={setPatternLearningEnabled}
          />
        </View>
        
        {learnedPatterns && Object.keys(learnedPatterns).length > 0 && (
          <>
            <View style={{ backgroundColor: C.chip, padding: 12, borderRadius: 12, marginBottom: 8 }}>
              <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>학습된 패턴</Text>
              <Text style={{ color: C.sub, fontSize: 12 }}>
                총 {Object.keys(learnedPatterns).length}개의 패턴이 학습되었습니다
              </Text>
            </View>
            
            <OutlineButton
              title="🗑️ 학습 데이터 초기화"
              onPress={() => {
                Alert.alert(
                  "학습 데이터 초기화",
                  "모든 학습된 패턴을 삭제합니다. 계속할까요?",
                  [
                    { text: "취소" },
                    { text: "초기화", style: "destructive", onPress: clearLearnedPatterns },
                  ]
                );
              }}
              color={C.warn}
              theme={C}
            />
          </>
        )}
      </Section>

      {/* 장르 관리 */}
      <Section title="📚 장르 관리" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          대장르와 부장르를 커스텀으로 추가할 수 있습니다.
        </Text>
        
        {/* 대장르 추가 */}
        <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>대장르 추가</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            value={newMajorGenre}
            onChangeText={setNewMajorGenre}
            placeholder="새 대장르"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="추가"
            onPress={() => {
              const genre = newMajorGenre.trim();
              if (!genre) return;
              if ([...MAJOR_GENRES, ...(userMajorGenres || [])].includes(genre)) {
                Alert.alert("알림", "이미 등록된 장르입니다.");
                return;
              }
              setUserMajorGenres([...(userMajorGenres || []), genre]);
              setNewMajorGenre("");
            }}
            theme={C}
          />
        </View>
        
        {/* 부장르 추가 */}
        <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>부장르 추가</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput
            value={newSubGenre}
            onChangeText={setNewSubGenre}
            placeholder="새 부장르"
            placeholderTextColor={C.sub}
            style={{
              flex: 1,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: C.text,
            }}
          />
          <PrimaryButton
            title="추가"
            onPress={() => {
              const genre = newSubGenre.trim();
              if (!genre) return;
              if ([...SUB_GENRES, ...(userSubGenres || [])].includes(genre)) {
                Alert.alert("알림", "이미 등록된 장르입니다.");
                return;
              }
              setUserSubGenres([...(userSubGenres || []), genre]);
              setNewSubGenre("");
            }}
            theme={C}
          />
        </View>
        
        {/* 커스텀 장르 목록 */}
        {((userMajorGenres || []).length > 0 || (userSubGenres || []).length > 0) && (
          <View style={{ backgroundColor: C.chip, padding: 12, borderRadius: 12 }}>
            {(userMajorGenres || []).length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>커스텀 대장르:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {userMajorGenres.map((g, i) => (
                    <TouchableOpacity
                      key={i}
                      onLongPress={() => {
                        Alert.alert("장르 삭제", `"${g}"를 삭제할까요?`, [
                          { text: "취소" },
                          { text: "삭제", style: "destructive", onPress: () => {
                            setUserMajorGenres(userMajorGenres.filter((_, j) => j !== i));
                          }},
                        ]);
                      }}
                      style={{ backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                    >
                      <Text style={{ color: "#166534", fontSize: 12 }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {(userSubGenres || []).length > 0 && (
              <View>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>커스텀 부장르:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {userSubGenres.map((g, i) => (
                    <TouchableOpacity
                      key={i}
                      onLongPress={() => {
                        Alert.alert("장르 삭제", `"${g}"를 삭제할까요?`, [
                          { text: "취소" },
                          { text: "삭제", style: "destructive", onPress: () => {
                            setUserSubGenres(userSubGenres.filter((_, j) => j !== i));
                          }},
                        ]);
                      }}
                      style={{ backgroundColor: "#e0e7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                    >
                      <Text style={{ color: "#3730a3", fontSize: 12 }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>※ 길게 눌러 삭제</Text>
          </View>
        )}
      </Section>

      {/* 좌표계 관리 */}
      <Section title="📐 좌표계 관리" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          취향 분석에 사용되는 좌표계를 관리합니다.
        </Text>
        
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: C.chip, padding: 12, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>
              {Object.keys(coordinateSystems || {}).length}
            </Text>
            <Text style={{ fontSize: 11, color: C.sub }}>등록된 좌표계</Text>
          </View>
        </View>
        
        <OutlineButton
          title="🔄 기본 좌표계 초기화"
          onPress={() => {
            Alert.alert(
              "기본 좌표계 초기화",
              "기본 좌표계 4종을 초기화합니다.\n기존 커스텀 좌표계는 유지됩니다.",
              [
                { text: "취소" },
                {
                  text: "초기화",
                  onPress: async () => {
                    const current = coordinateSystems || {};
                    const merged = { ...current };
                    for (const [id, sys] of Object.entries(DEFAULT_COORDINATE_SYSTEMS)) {
                      merged[id] = { ...sys };
                    }
                    setCoordinateSystems(merged);
                    await saveTagCoordinateSystems(merged);
                    Alert.alert("완료", "기본 좌표계가 초기화되었습니다.");
                  },
                },
              ]
            );
          }}
          style={{ marginTop: 12 }}
          theme={C}
        />
      </Section>
    </>
  );

  // ─────────────────────────────────────────────────────────────
  // 백업 설정 서브탭
  // ─────────────────────────────────────────────────────────────
  const renderBackupTab = () => (
    <>
      {/* 데이터 백업 */}
      <Section title="💾 데이터 백업" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 12 }}>
          작품과 대진 기록을 JSON으로 내보내거나 가져올 수 있습니다.
        </Text>
        
        <PrimaryButton
          title="📤 JSON 내보내기 (백업)"
          onPress={() => setExportOpen(true)}
          theme={C}
        />
        
        <OutlineButton
          title="📥 JSON 가져오기 (복원)"
          onPress={() => setImportOpen(true)}
          style={{ marginTop: 8 }}
          theme={C}
        />
      </Section>

      {/* 유틸리티 */}
      <Section title="🔧 유틸리티" theme={C}>
        <PrimaryButton
          title="🔄 매치 로그 기준 Elo 재계산"
          onPress={async () => {
            await rebuildAllFromMatches();
            Alert.alert("완료", "Elo 재계산이 완료되었습니다.");
          }}
          theme={C}
        />
        
        <OutlineButton
          title="🗑️ 대진 로그 전체 삭제"
          onPress={() => {
            Alert.alert(
              "대진 로그 삭제",
              "모든 대진 기록을 삭제하고 레이팅을 초기화합니다.",
              [
                { text: "취소" },
                { text: "삭제", style: "destructive", onPress: resetMatches },
              ]
            );
          }}
          color={C.warn}
          style={{ marginTop: 8 }}
          theme={C}
        />
      </Section>
    </>
  );

  // ─────────────────────────────────────────────────────────────
  // 메인 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>설정</H>
      
      {/* 서브탭 네비게이션 */}
      <View style={{ 
        flexDirection: "row", 
        backgroundColor: C.card, 
        borderRadius: 12, 
        padding: 4, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.line,
      }}>
        {[
          { key: "app", label: "🎯 앱 설정" },
          { key: "tags", label: "🏷️ 태그" },
          { key: "analysis", label: "📊 분석" },
          { key: "backup", label: "💾 백업" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setSettingsSubTab(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 4,
              borderRadius: 10,
              backgroundColor: settingsSubTab === tab.key ? C.primary : "transparent",
              alignItems: "center",
            }}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: "700", 
              color: settingsSubTab === tab.key ? "#fff" : C.sub,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 서브탭 컨텐츠 */}
      {settingsSubTab === "app" && renderAppTab()}
      {settingsSubTab === "tags" && renderTagsTab()}
      {settingsSubTab === "analysis" && renderAnalysisTab()}
      {settingsSubTab === "backup" && renderBackupTab()}
    </>
  );
});

SettingsScreen.displayName = "SettingsScreen";

export default SettingsScreen;
