/**
 * 매칭 화면
 * @module screens/MatchScreen
 * @version 6.0 (Context 아키텍처)
 *
 * @description
 * 작품 간 ELO 매칭 화면
 * Context: useApp(theme, appSettings), useData(list, matchStats, pickRandomUnseenPair, decideMatch, undoLastMatch, resetAllMatches, loadList)
 * 로컬 상태: pair, autoEnabled, autoMatchSettings, autoSettingsExpanded, focusMatchNovel/Query, matchAnalysis
 *
 * 주요 기능:
 * - 매칭 진행도 표시
 * - 자동 승패 설정
 * - 특정 작품 고정 매칭
 * - 승부 예측 분석
 */

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { H, Section, Label, PrimaryButton, OutlineButton, Chip } from "../components/common/ui";
import { TierTag, ActualTierTag } from "../components/common/ui";
import { CoverImage } from "../components/novel/NovelCard";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";

// ═══════════════════════════════════════════════════════════════
// 📌 MatchScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const MatchScreen = memo(() => {
  const { theme, appSettings } = useApp();
  const { list, matchStats, pickRandomUnseenPair, decideMatch, undoLastMatch, resetAllMatches: resetMatches, loadList } = useData();
  const C = theme;

  // ── 매칭 로컬 상태 ──
  const [pair, setPair] = useState(null);
  const [lastMatchId, setLastMatchId] = useState(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoMatchSettings, setAutoMatchSettings] = useState({ criteria: {} });
  const [autoSettingsExpanded, setAutoSettingsExpanded] = useState(false);
  const [focusMatchNovel, setFocusMatchNovel] = useState(null);
  const [focusMatchQuery, setFocusMatchQuery] = useState("");
  const [matchAnalysis, setMatchAnalysis] = useState(null);

  // ── 포커스 매칭 후보 계산 ──
  const focusMatchCandidates = useMemo(() => {
    if (!focusMatchQuery || focusMatchQuery.length < 1) return [];
    const q = focusMatchQuery.toLowerCase();
    return (list || []).filter((n) => (n.title || "").toLowerCase().includes(q)).slice(0, 10);
  }, [list, focusMatchQuery]);

  // ── 매칭 큐 상태 (간이 계산) ──
  const matchQueueStatus = useMemo(() => ({
    total: matchStats.total,
    done: matchStats.done,
    percent: matchStats.percent,
  }), [matchStats]);

  // ── 다음 매칭 로드 래퍼 (BUG#2 수정: handler 반환값 → setPair) ──
  const pickNext = useCallback(async () => {
    try {
      const result = await pickRandomUnseenPair(focusMatchNovel?.id || null);
      if (result?.pair) {
        setPair(result.pair);
        setMatchAnalysis(null);
      } else {
        setPair(null);
        if (result?.error) Alert.alert("알림", result.error);
      }
    } catch (e) {
      console.warn("pickNext 오류:", e);
      setPair(null);
    }
  }, [pickRandomUnseenPair, focusMatchNovel]);

  // ── 매칭 판정 래퍼 (BUG#1 수정: pair를 첫 번째 인수로 전달) ──
  const decide = useCallback(async (winnerId, source = "user") => {
    if (!pair) return;
    // 다음 매칭 먼저 로드 (UI 반응성)
    pickNext();
    // 매칭 결과 저장
    const result = await decideMatch(pair, winnerId, source);
    if (result?.matchId) setLastMatchId(result.matchId);
    await loadList();
  }, [pair, decideMatch, loadList, pickNext]);

  // ── 되돌리기 래퍼 (BUG#3 수정: lastMatchId 전달) ──
  const handleUndo = useCallback(async () => {
    if (!lastMatchId) {
      Alert.alert("알림", "되돌릴 최근 매칭이 없습니다.");
      return;
    }
    Alert.alert("확인", "최근 매칭 1건을 되돌릴까요?", [
      { text: "취소" },
      { text: "되돌리기", style: "destructive", onPress: async () => {
        await undoLastMatch(lastMatchId);
        setLastMatchId(null);
        await loadList();
      }},
    ]);
  }, [lastMatchId, undoLastMatch, loadList]);

  // ── 자동 매칭 평가 (스텁 - 향후 확장) ──
  const evaluateAutoMatch = useCallback(() => {
    if (!pair || !autoEnabled) return null;
    return null; // 자동 매칭 로직은 서비스에서 처리
  }, [pair, autoEnabled]);
  const globalTierThresholds = appSettings?.autoTierThresholds || { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 };

  // ─────────────────────────────────────────────────────────────
  // 자동 승패 설정 저장
  // ─────────────────────────────────────────────────────────────
  const saveAutoMatchSettings = useCallback(async (newSettings) => {
    setAutoMatchSettings(newSettings);
  }, [setAutoMatchSettings]);

  // ─────────────────────────────────────────────────────────────
  // 자동 승패 기준 토글
  // ─────────────────────────────────────────────────────────────
  const toggleAutoCriterion = useCallback((key) => {
    const updated = {
      ...autoMatchSettings,
      criteria: {
        ...autoMatchSettings.criteria,
        [key]: {
          ...autoMatchSettings.criteria[key],
          enabled: !autoMatchSettings.criteria[key].enabled,
        },
      },
    };
    saveAutoMatchSettings(updated);
  }, [autoMatchSettings, saveAutoMatchSettings]);

  // ─────────────────────────────────────────────────────────────
  // 자동 승패 임계값 설정
  // ─────────────────────────────────────────────────────────────
  const setAutoCriterionThreshold = useCallback((key, value) => {
    const numVal = Number(value) || 0;
    const updated = {
      ...autoMatchSettings,
      criteria: {
        ...autoMatchSettings.criteria,
        [key]: {
          ...autoMatchSettings.criteria[key],
          threshold: numVal,
        },
      },
    };
    saveAutoMatchSettings(updated);
  }, [autoMatchSettings, saveAutoMatchSettings]);

  // ─────────────────────────────────────────────────────────────
  // 헬퍼 함수들
  // ─────────────────────────────────────────────────────────────
  const getWinRate = (n) => {
    const wins = n?.wins || 0;
    const total = wins + (n?.losses || 0);
    return total > 0 ? ((wins / total) * 100).toFixed(0) : "-";
  };

  const getFirstGenre = (n) => {
    try {
      const majors = JSON.parse(n?.major_genre || "[]");
      return majors[0] || "";
    } catch {
      return "";
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>자동 매칭(미대전 우선 · 랜덤)</H>

      {/* 매칭 진행도 */}
      <Section title="매칭 진행도" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 6 }}>
          {matchStats.total === 0
            ? "매칭 가능한 조합이 없습니다. 작품을 2개 이상 등록하세요."
            : `${matchStats.done} / ${matchStats.total} 조합 매칭 (${matchStats.percent}%)`}
        </Text>
        <View
          style={{
            height: 10,
            backgroundColor: "#eef2ff",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${matchStats.percent}%`,
              height: "100%",
              backgroundColor: C.primary,
            }}
          />
        </View>
        
        {/* 매칭 큐 처리 중 표시 */}
        {(matchQueueStatus?.processing || matchQueueStatus?.pending > 0) && (
          <View style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            marginTop: 10,
            backgroundColor: "#fef3c7",
            padding: 8,
            borderRadius: 8,
          }}>
            <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 8 }} />
            <Text style={{ color: "#92400e", fontWeight: "600" }}>
              매칭 처리 중... {matchQueueStatus?.pending > 0 ? `(대기: ${matchQueueStatus.pending}건)` : ""}
            </Text>
          </View>
        )}
      </Section>

      {/* 옵션 */}
      <Section title="옵션" theme={C}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Text style={{ fontWeight: "700", color: C.text }}>자동 승패</Text>
          <Switch value={autoEnabled} onValueChange={setAutoEnabled} />
        </View>
        
        {/* 자동 승패 상세 설정 */}
        {autoEnabled && (
          <TouchableOpacity
            onPress={() => setAutoSettingsExpanded(!autoSettingsExpanded)}
            style={{
              backgroundColor: C.chip,
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: "700", color: C.text }}>
              {autoSettingsExpanded ? "▼ 상세 설정 접기" : "▶ 상세 설정 펼치기"}
            </Text>
          </TouchableOpacity>
        )}
        
        {autoEnabled && autoSettingsExpanded && (
          <View style={{ backgroundColor: C.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line }}>
            <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>조건 모드</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {[
                { key: "any", label: "하나라도" },
                { key: "all", label: "모두" },
              ].map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  active={autoMatchSettings.mode === key}
                  onPress={() => saveAutoMatchSettings({ ...autoMatchSettings, mode: key })}
                  theme={C}
                />
              ))}
            </View>
            
            <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>조건 선택</Text>
            {Object.entries(autoMatchSettings.criteria).map(([key, criterion]) => (
              <View 
                key={key} 
                style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Switch
                    value={criterion.enabled}
                    onValueChange={() => toggleAutoCriterion(key)}
                  />
                  <Text style={{ color: C.text, flex: 1 }}>{criterion.desc}</Text>
                </View>
                {criterion.enabled && (
                  <TextInput
                    value={String(criterion.threshold)}
                    onChangeText={(v) => setAutoCriterionThreshold(key, v)}
                    keyboardType="number-pad"
                    style={{
                      backgroundColor: C.bg,
                      borderWidth: 1,
                      borderColor: C.line,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      width: 70,
                      textAlign: "center",
                      color: C.text,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        <OutlineButton
          title="매칭 초기화 (모든 대진 로그 삭제)"
          onPress={resetMatches}
          color={C.warn}
          theme={C}
        />
        <OutlineButton
          title="마지막 매칭 되돌리기"
          onPress={handleUndo}
          style={{ marginTop: 8 }}
          theme={C}
        />
      </Section>

      {/* 특정 작품 고정 매칭 */}
      <Section title="특정 작품 고정 매칭 (선택)" theme={C}>
        <Text style={{ color: C.sub, marginBottom: 6 }}>
          아래에서 작품을 선택하면, 해당 작품이 포함된 미대전 매칭만 생성됩니다.
        </Text>
        {focusMatchNovel ? (
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.line,
              backgroundColor: C.card,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
              고정: {focusMatchNovel.title}
            </Text>
            <Text style={{ color: C.sub, marginTop: 2 }} numberOfLines={1}>
              {focusMatchNovel.author || "-"}
            </Text>
            <OutlineButton
              title="선택 해제"
              onPress={() => setFocusMatchNovel(null)}
              style={{ marginTop: 6 }}
              theme={C}
            />
          </View>
        ) : (
          <Text style={{ color: C.sub, marginBottom: 8 }}>
            현재 고정된 작품이 없습니다.
          </Text>
        )}

        <Label theme={C}>작품 검색</Label>
        <TextInput
          value={focusMatchQuery}
          onChangeText={setFocusMatchQuery}
          placeholder="제목/작가 일부를 입력하세요"
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
        {focusMatchQuery.trim().length > 0 && (
          <View style={{ marginTop: 8 }}>
            {focusMatchCandidates?.length === 0 ? (
              <Text style={{ color: C.sub }}>검색 결과가 없습니다.</Text>
            ) : (
              focusMatchCandidates?.slice(0, 10).map((n) => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => {
                    setFocusMatchNovel(n);
                    setFocusMatchQuery("");
                  }}
                  style={{
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: C.line,
                  }}
                >
                  <Text style={{ fontWeight: "700", color: C.text }} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12 }} numberOfLines={1}>
                    {n.author || "-"}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </Section>

      {/* 매칭 */}
      <Section title="매칭" theme={C}>
        {!pair ? (
          <PrimaryButton
            title="다음 매칭"
            onPress={pickNext}
            theme={C}
          />
        ) : (
          <>
            {/* 매칭 분석 결과 */}
            {matchAnalysis && appSettings?.showMatchInsights && (
              <View style={{
                backgroundColor: C.chip,
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
              }}>
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  🔮 승부 예측
                </Text>
                <Text style={{ color: C.sub, fontSize: 13 }}>
                  {matchAnalysis.prediction?.favoredId === pair.A.id 
                    ? `${pair.A.title} 우세 (${matchAnalysis.prediction?.confidence || 50}%)`
                    : `${pair.B.title} 우세 (${matchAnalysis.prediction?.confidence || 50}%)`
                  }
                </Text>
                {matchAnalysis.factors && matchAnalysis.factors.length > 0 && (
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>
                    요인: {matchAnalysis.factors.slice(0, 2).join(", ")}
                  </Text>
                )}
              </View>
            )}

            {/* A 카드 */}
            <TouchableOpacity
              onPress={() => decide(pair.A.id, "user")}
              style={{
                borderWidth: 2,
                borderColor: C.ok,
                backgroundColor: C.card,
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {pair.A.cover_image && (
                  <CoverImage 
                    uri={pair.A.cover_image} 
                    size={60} 
                    style={{ marginRight: 12, borderRadius: 8 }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: C.text, flex: 1 }} numberOfLines={1}>
                      {pair.A.title}
                    </Text>
                    <TierTag rating={pair.A.rating} thresholds={globalTierThresholds} />
                  </View>
                  <Text style={{ color: C.sub, marginTop: 6 }}>
                    R {(pair.A.rating || 1500).toFixed(1)} · W{pair.A.wins || 0}/L{pair.A.losses || 0} · 승률 {getWinRate(pair.A)}%
                  </Text>
                  {getFirstGenre(pair.A) && (
                    <Text style={{ color: C.sub, fontSize: 12 }}>{getFirstGenre(pair.A)}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginVertical: 4 }}>
              <Text style={{ color: C.sub, fontWeight: "800", fontSize: 16 }}>VS</Text>
            </View>

            {/* B 카드 */}
            <TouchableOpacity
              onPress={() => decide(pair.B.id, "user")}
              style={{
                borderWidth: 2,
                borderColor: C.warn,
                backgroundColor: C.card,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {pair.B.cover_image && (
                  <CoverImage 
                    uri={pair.B.cover_image} 
                    size={60} 
                    style={{ marginRight: 12, borderRadius: 8 }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: C.text, flex: 1 }} numberOfLines={1}>
                      {pair.B.title}
                    </Text>
                    <TierTag rating={pair.B.rating} thresholds={globalTierThresholds} />
                  </View>
                  <Text style={{ color: C.sub, marginTop: 6 }}>
                    R {(pair.B.rating || 1500).toFixed(1)} · W{pair.B.wins || 0}/L{pair.B.losses || 0} · 승률 {getWinRate(pair.B)}%
                  </Text>
                  {getFirstGenre(pair.B) && (
                    <Text style={{ color: C.sub, fontSize: 12 }}>{getFirstGenre(pair.B)}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <OutlineButton
                title="건너뛰기"
                onPress={() => {
                  setPair(null);
                  pickNext();
                }}
                style={{ flex: 1 }}
                theme={C}
              />
              <PrimaryButton
                title="다음 매칭"
                onPress={pickNext}
                style={{ flex: 1 }}
                theme={C}
              />
            </View>
          </>
        )}
      </Section>
    </>
  );
});

MatchScreen.displayName = "MatchScreen";

export default MatchScreen;
