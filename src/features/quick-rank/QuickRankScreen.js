// 최소 매칭 화면: 티어 칸 → 5개 중 1개 고르기 → 결과 미리보기와 적용.
// 고를 때마다 바로 저장하므로 언제 닫거나 앱이 꺼져도 이어서 할 수 있다.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { Modal } from "../system-insets";
import { computeResult, pickRound } from "./scoring";
import {
  applyResult,
  fillCellsFromCurrentTier,
  getLatestApply,
  loadState,
  resetSession,
  revertApply,
  savePick,
  setCell,
  undoLastPick,
} from "./store";

const PREVIEW_ROW_HEIGHT = 48;
const RECOMMEND_MIN = 3; // 작품 수의 배수. 가상 계산에서 나온 값이라 화면에도 그렇게 적는다.
const RECOMMEND_MAX = 5;

const format = (value) => Number(value).toLocaleString("ko-KR");

function Button({ C, title, onPress, primary, danger, disabled, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[{
        minHeight: 46, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", justifyContent: "center",
        backgroundColor: primary ? C.primary : C.chip, opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      <Text style={{ color: primary ? "#fff" : danger ? C.warn : C.text, fontWeight: "700", fontSize: 14, textAlign: "center" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function Header({ C, title, onClose }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <Text style={{ flex: 1, color: C.text, fontSize: 17, fontWeight: "800" }} numberOfLines={1}>{title}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: C.chip }}>
        <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
}

function Cover({ uri, width, height }) {
  if (!uri) return null;
  return <ExpoImage source={{ uri }} style={{ width, height, borderRadius: 6, marginRight: 10 }} contentFit="cover" cachePolicy="memory-disk" />;
}

function Frame({ C, title, onClose, error, children }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <Header C={C} title={title} onClose={onClose} />
        {error ? <Text style={{ color: C.warn, fontSize: 13, paddingHorizontal: 14, paddingTop: 8 }}>{error}</Text> : null}
        {children}
      </SafeAreaView>
    </Modal>
  );
}

export function QuickRankScreen({
  onClose,
  db,
  tierOrder,
  tierLabel,
  tierColor,
  theme: C,
  isBlocked,
  getSlotGeneration,
  beforeRankWrite,
  onApplied,
  onReverted,
}) {
  const [state, setState] = useState(null);
  const [latestApply, setLatestApply] = useState(null);
  const [started, setStarted] = useState(false);
  const [view, setView] = useState("work"); // work: 칸 또는 고르기, preview: 결과, done: 적용 직후
  const [round, setRound] = useState([]);
  const [redoWork, setRedoWork] = useState(null); // 칸 단계에서 '이전'으로 다시 고르는 작품
  const [cellHistory, setCellHistory] = useState([]);
  const [canUndoPick, setCanUndoPick] = useState(false);
  const [moveTiers, setMoveTiers] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const generationRef = useRef(getSlotGeneration());

  // 슬롯이 바뀌었으면 이전 슬롯의 내용을 새 슬롯에 쓰지 않는다. 모든 비동기 경로의 오류를 여기서 받는다.
  const run = useCallback(async (task) => {
    if (busyRef.current) return;
    if (getSlotGeneration() !== generationRef.current) { onClose(); return; }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      console.warn("[quick-rank] 오류:", e?.message);
      setError("저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [getSlotGeneration, onClose]);

  const confirm = useCallback((title, message, okText, onOk, destructive) => {
    if (isBlocked()) return;
    Alert.alert(title, message, [
      { text: "취소", style: "cancel" },
      { text: okText, style: destructive ? "destructive" : "default", onPress: onOk },
    ]);
  }, [isBlocked]);

  const reload = useCallback(async (shownIds = null) => {
    const next = await loadState(db, tierOrder);
    setState(next);
    setLatestApply(await getLatestApply(db));
    if (next.needCell.length === 0) {
      const shown = shownIds?.map((id) => next.entries.find((entry) => entry.id === id)).filter(Boolean);
      setRound(shown?.length >= 2 ? shown : pickRound(next.entries));
    }
    return next;
  }, [db, tierOrder]);

  useEffect(() => { run(reload); }, []); // 열 때 한 번만 읽는다

  const previewRows = useMemo(() => {
    if (view !== "preview" || !state || state.needCell.length > 0) return [];
    const info = new Map(state.entries.map((entry) => [entry.id, entry]));
    for (const work of state.held) info.set(work.id, work);
    return computeResult({ entries: state.entries, held: state.held, tierOrder, moveTiers })
      .map((row, index) => ({ ...row, rank: index + 1, title: info.get(row.id)?.title || "" }));
  }, [view, state, tierOrder, moveTiers]);

  const previewMoved = useMemo(() => previewRows.filter((row) => row.beforeTier !== row.afterTier).length, [previewRows]);

  const chooseCell = (tier) => run(async () => {
    const work = redoWork || state.needCell[0];
    await setCell(db, work.id, tier, tierOrder);
    setRedoWork(null);
    setCellHistory((history) => [...history, work]);
    await reload();
  });

  const goBackCell = () => {
    const last = cellHistory[cellHistory.length - 1];
    if (!last) return;
    setCellHistory(cellHistory.slice(0, -1));
    setRedoWork(last);
  };

  const fillFromCurrent = () => run(async () => {
    await fillCellsFromCurrentTier(db, state.needCell, tierOrder);
    setCellHistory([]);
    setStarted(true);
    await reload();
  });

  const choose = (winnerId) => run(async () => {
    const updated = await savePick(db, state.session.id, round, winnerId);
    const byId = new Map(updated.map((entry) => [entry.id, entry]));
    const entries = state.entries.map((entry) => byId.get(entry.id) || entry);
    setState({ ...state, entries, decisions: state.decisions + 1 });
    setRound(pickRound(entries));
    setCanUndoPick(true);
  });

  const undoPick = () => run(async () => {
    const shown = await undoLastPick(db, state.session.id);
    if (!shown) { setCanUndoPick(false); return; }
    await reload(shown);
  });

  const restart = () => confirm(
    "처음부터 다시 할까요?",
    "칸과 지금까지 고른 진행 상황을 지웁니다. 이미 적용한 순위와 비교 기록은 그대로 남습니다.",
    "지우기",
    () => run(async () => {
      await resetSession(db, state.session.id);
      setStarted(false);
      setCellHistory([]);
      setCanUndoPick(false);
      setView("work");
      await reload();
    }),
    true
  );

  const apply = () => confirm(
    "이 순위로 적용할까요?",
    `작품 ${format(previewRows.length)}개의 티어와 순서가 미리보기대로 바뀝니다. 그 사이 손으로 바꾼 자리도 덮어씁니다. 적용한 뒤에도 되돌릴 수 있어요.`,
    "적용",
    () => run(async () => {
      await beforeRankWrite();
      const fresh = await reload();
      if (fresh.needCell.length > 0) { setView("work"); return; }
      const { applyId, rows } = await applyResult(db, fresh, tierOrder, moveTiers);
      await onApplied({ applyId, count: rows.length });
      setLatestApply(await getLatestApply(db));
      setView("done");
    })
  );

  const revert = () => confirm(
    "적용을 되돌릴까요?",
    "마지막 적용 전의 티어와 순서로 돌아갑니다. 적용한 뒤에 손으로 옮긴 작품도 그때 자리로 돌아갑니다. 고른 진행 상황은 그대로예요.",
    "되돌리기",
    () => run(async () => {
      await beforeRankWrite();
      const result = await revertApply(db);
      if (!result.ok) { setLatestApply(null); return; }
      await onReverted(result);
      await reload();
      setView("work");
    }),
    true
  );

  const frame = { C, onClose, error };

  if (!state) {
    return (
      <Frame {...frame} title="최소 매칭">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={C.primary} /></View>
      </Frame>
    );
  }

  const count = state.workCount;
  const recommend = `${format(count * RECOMMEND_MIN)}~${format(count * RECOMMEND_MAX)}번`;

  // ── 시작 ──
  if (!state.session && !started) {
    return (
      <Frame {...frame} title="최소 매칭">
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ color: C.text, fontSize: 15, lineHeight: 23 }}>
            적은 횟수로 순위를 만드는 도구예요.{"\n"}
            1. 작품마다 티어 칸을 한 번 고릅니다.{"\n"}
            2. 앱이 내주는 5개 중 제일 좋은 작품을 고릅니다. 언제든 멈췄다 이어 할 수 있어요.{"\n"}
            3. 결과를 미리 보고 적용합니다. 적용해도 되돌릴 수 있어요.
          </Text>
          <Text style={{ color: C.sub, fontSize: 13, lineHeight: 20, marginTop: 12 }}>
            작품 {format(count)}개{state.held.length > 0 ? ` (매칭 제외 ${format(state.held.length)}개는 자리를 유지해요)` : ""}. 5개 고르기는 {recommend}쯤을 권합니다. 가상 계산으로 잡은 값이라 실제 정확도를 약속하지는 않아요. 전체 매칭 기록과 점수는 건드리지 않습니다.
          </Text>
          <View style={{ flex: 1 }} />
          {count < 2 ? <Text style={{ color: C.warn, fontSize: 14, marginBottom: 12 }}>비교하려면 작품이 2개 이상 필요해요.</Text> : null}
          {state.withTierCount > 0 ? (
            <Button C={C} primary disabled={busy || count < 2} onPress={fillFromCurrent} title={`지금 티어로 시작 (${format(state.withTierCount)}개는 칸 건너뜀)`} style={{ marginBottom: 10 }} />
          ) : null}
          <Button C={C} primary={state.withTierCount === 0} disabled={busy || count < 2} onPress={() => setStarted(true)} title="칸을 처음부터 정하기" />
          {latestApply ? <Button C={C} danger disabled={busy} onPress={revert} title="지난 적용 되돌리기" style={{ marginTop: 10 }} /> : null}
        </View>
      </Frame>
    );
  }

  // ── 칸 ──
  if (state.needCell.length > 0 || redoWork) {
    const work = redoWork || state.needCell[0];
    const done = count - state.needCell.length;
    return (
      <Frame {...frame} title="1단계: 티어 칸">
        <View style={{ flex: 1, padding: 14 }}>
          <Text style={{ color: C.sub, fontSize: 13 }}>{format(done)} / {format(count)}개</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 12 }}>
            <Cover uri={work.cover_image} width={48} height={68} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 19, fontWeight: "800" }} numberOfLines={2}>{work.title}</Text>
              {work.author ? <Text style={{ color: C.sub, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{work.author}</Text> : null}
            </View>
          </View>
          {/* 티어가 많으면 칸만 스크롤해 아래 버튼이 화면 밖으로 밀리지 않게 한다. */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {tierOrder.map((tier) => (
            <TouchableOpacity
              key={tier}
              disabled={busy}
              onPress={() => chooseCell(tier)}
              style={{ flex: 1, maxHeight: 72, minHeight: 36, marginBottom: 6, borderRadius: 10, borderWidth: 2, borderColor: tierColor(tier), backgroundColor: C.card, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: tierColor(tier), fontSize: 18, fontWeight: "800" }}>{tierLabel(tier)}</Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <Button C={C} disabled={busy || cellHistory.length === 0 || !!redoWork} onPress={goBackCell} title="← 이전 작품" style={{ flex: 1 }} />
            {state.withTierCount > 0 && !redoWork ? (
              <Button C={C} disabled={busy} onPress={fillFromCurrent} title={`나머지는 지금 티어로 (${format(state.withTierCount)}개)`} style={{ flex: 1.4, marginLeft: 8 }} />
            ) : null}
          </View>
        </View>
      </Frame>
    );
  }

  // ── 적용 직후 ──
  if (view === "done") {
    return (
      <Frame {...frame} title="적용했어요">
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ color: C.text, fontSize: 15, lineHeight: 23 }}>
            결과를 티어와 순위에 넣었어요. 순위 탭에서 확인해 보세요.{"\n"}
            더 고른 뒤 다시 적용해도 되고, 마음에 안 들면 되돌릴 수 있어요.
          </Text>
          <View style={{ flex: 1 }} />
          <Button C={C} primary disabled={busy} onPress={onClose} title="닫기" style={{ marginBottom: 10 }} />
          <Button C={C} disabled={busy} onPress={() => setView("work")} title="더 고르기" style={{ marginBottom: 10 }} />
          {latestApply ? <Button C={C} danger disabled={busy} onPress={revert} title="이번 적용 되돌리기" /> : null}
        </View>
      </Frame>
    );
  }

  // ── 미리보기 ──
  if (view === "preview") {
    const renderRow = ({ item }) => (
      <View style={{ height: PREVIEW_ROW_HEIGHT, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <Text style={{ width: 40, color: C.sub, fontSize: 12 }}>{item.rank}</Text>
        <Text style={{ width: 44, color: tierColor(item.afterTier), fontWeight: "800", fontSize: 14 }} numberOfLines={1}>{tierLabel(item.afterTier)}</Text>
        <Text style={{ flex: 1, color: C.text, fontSize: 14 }} numberOfLines={1}>{item.title}</Text>
        {item.beforeTier !== item.afterTier ? (
          <Text style={{ color: C.primary, fontSize: 12, fontWeight: "700", marginLeft: 6 }}>
            {item.beforeTier ? tierLabel(item.beforeTier) : "없음"} → {tierLabel(item.afterTier)}
          </Text>
        ) : null}
      </View>
    );
    return (
      <Frame {...frame} title="3단계: 결과 미리보기">
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ color: C.text, fontSize: 14 }}>
            {format(state.decisions)}번 골랐어요. 지금 티어와 달라지는 작품 {format(previewMoved)}개.
          </Text>
          {state.decisions < count ? (
            <Text style={{ color: C.warn, fontSize: 12, marginTop: 4 }}>아직 적게 골라서 칸 안 순서가 거의 정해지지 않았어요.</Text>
          ) : null}
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <Button C={C} primary={moveTiers} onPress={() => setMoveTiers(true)} title="티어도 옮기기" style={{ flex: 1, minHeight: 38 }} />
            <Button C={C} primary={!moveTiers} onPress={() => setMoveTiers(false)} title="티어는 칸 그대로" style={{ flex: 1, minHeight: 38, marginLeft: 8 }} />
          </View>
        </View>
        <FlatList
          style={{ flex: 1 }}
          data={previewRows}
          keyExtractor={(row) => String(row.id)}
          renderItem={renderRow}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={7}
          getItemLayout={(_, index) => ({ length: PREVIEW_ROW_HEIGHT, offset: PREVIEW_ROW_HEIGHT * index, index })}
        />
        <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: C.line }}>
          <Button C={C} disabled={busy} onPress={() => setView("work")} title="더 고르기" style={{ flex: 1 }} />
          <Button C={C} primary disabled={busy || previewRows.length === 0} onPress={apply} title="이 순위로 적용" style={{ flex: 1.4, marginLeft: 8 }} />
        </View>
      </Frame>
    );
  }

  // ── 고르기 ──
  const ratio = Math.min(1, state.decisions / Math.max(1, count * RECOMMEND_MAX));
  return (
    <Frame {...frame} title="2단계: 제일 좋은 작품 고르기">
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <Text style={{ color: C.sub, fontSize: 12 }}>{format(state.decisions)}번 골랐어요 · 권장 {recommend} (가상 계산 기준)</Text>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: C.line, marginTop: 5 }}>
          <View style={{ width: `${ratio * 100}%`, height: 4, borderRadius: 2, backgroundColor: C.primary }} />
        </View>
      </View>
      <View style={{ flex: 1, padding: 10 }}>
        {round.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            disabled={busy}
            onPress={() => choose(entry.id)}
            style={{ flex: 1, minHeight: 0, marginBottom: 7, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.card }}
          >
            <Cover uri={entry.coverImage} width={40} height={56} />
            <View style={{ flex: 1 }}>
              <Text maxFontSizeMultiplier={1.2} style={{ color: C.text, fontSize: 15, lineHeight: 20, fontWeight: "700" }} numberOfLines={2}>{entry.title}</Text>
              {entry.author ? <Text maxFontSizeMultiplier={1.2} style={{ color: C.sub, fontSize: 11, lineHeight: 15 }} numberOfLines={1}>{entry.author}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <Button C={C} disabled={busy || !canUndoPick} onPress={undoPick} title="↩ 방금 것 취소" style={{ flex: 1 }} />
          <Button C={C} primary disabled={busy} onPress={() => setView("preview")} title="결과 보기" style={{ flex: 1, marginLeft: 8 }} />
        </View>
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <Button C={C} danger disabled={busy} onPress={restart} title="처음부터" style={{ flex: 1, minHeight: 38 }} />
          {latestApply ? <Button C={C} danger disabled={busy} onPress={revert} title="적용 되돌리기" style={{ flex: 1, minHeight: 38, marginLeft: 8 }} /> : null}
        </View>
      </View>
    </Frame>
  );
}
