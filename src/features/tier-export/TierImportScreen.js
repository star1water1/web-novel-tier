// 고친 티어표 엑셀을 가져오는 화면: 무엇이 바뀌는지 보여 주고, 확인을 받아 한 번에 적용한다.
// 이 화면은 Alert를 쓰지 않고 안내를 화면에 적는다 (자동매칭 중 Alert 금지).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal } from "../system-insets";
import * as fileAccess from "../file-access";
import { buildImportPlan, readTierTable } from "./importPlan";
import { applyImport, getLatestImport, loadSnapshot, revertImport } from "./store";
import { readXlsx } from "./xlsxReader";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_FILE_BYTES = 30 * 1024 * 1024;
const { CANCELLED } = fileAccess.FileAccessErrorCode;
const FIELD_LABEL = { place: "티어·순서", read: "읽은 화수", gaiden: "외전 화수" };

const pad = (n) => String(n).padStart(2, "0");
const dateLabel = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function Button({ C, title, onPress, primary, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: 46, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", justifyContent: "center",
        backgroundColor: primary ? C.primary : C.chip, opacity: disabled ? 0.5 : 1, marginTop: 8,
      }}
    >
      <Text style={{ color: primary ? "#fff" : C.text, fontWeight: "700", fontSize: 14 }}>{title}</Text>
    </TouchableOpacity>
  );
}

function changeText(change) {
  const parts = [];
  if (change.place) parts.push(`${change.place.fromTier} ${change.place.fromRank}위 → ${change.place.toTier} ${change.place.toRank}위`);
  if (change.read) parts.push(`화수 ${change.read.from} → ${change.read.to}`);
  if (change.gaiden) parts.push(`외전 ${change.gaiden.from} → ${change.gaiden.to}`);
  return parts.join(" · ");
}

function noticeLines(notices) {
  const lines = [];
  if (notices.noBaseline) lines.push("이 파일의 출력 기록을 찾지 못해 지금 앱 값과 비교했어요. 내보낸 뒤 앱에서 바꾼 값도 파일 값으로 덮일 수 있으니 잘 확인해 주세요.");
  if (notices.placementBlocked === "mode" && notices.placementIgnored > 0) lines.push(`티어와 순서는 직접 배정과 혼합 방식에서만 바꿀 수 있어요. 고친 ${notices.placementIgnored}개는 반영하지 않아요.`);
  if (notices.placementBlocked === "mode_changed" && notices.placementIgnored > 0) lines.push(`내보낸 뒤 티어 방식이 바뀌어 고친 티어와 순서 ${notices.placementIgnored}개를 반영하지 않아요.`);
  if (notices.tierConfigChanged) lines.push("내보낸 뒤 티어 구성이 바뀌었어요. 없어진 티어의 행은 건너뛸 수 있어요.");
  if (notices.manyMoved > 0) lines.push(`순서가 바뀐 작품이 ${notices.manyMoved}개로 많아요. 엑셀에서 표를 정렬했다면 원래 순서로 돌린 뒤 저장해 주세요.`);
  if (notices.rankMismatch > 0) lines.push(`순위 칸 숫자와 행 순서가 다른 행이 ${notices.rankMismatch}개예요. 순위 칸은 읽지 않고 행 순서를 따라요.`);
  if (notices.titleIgnored > 0) lines.push(`제목을 고친 행이 ${notices.titleIgnored}개 있지만 제목은 반영하지 않아요.`);
  if (notices.missingFromFile > 0) lines.push(`파일에 없는 작품 ${notices.missingFromFile}개는 그대로 둬요. 삭제하지 않아요.`);
  return lines;
}

/**
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {object} props.db { exec, all, first, execBatch, newId }
 * @param {() => Promise<{rows: object[], tierMode: string, tierOrder: string[], tierLabels: object}>} props.getWorks 순위 탭과 같은 순서의 표
 * @param {object} props.theme App.jsx의 색 C
 * @param {() => boolean} props.isBlocked true면 적용하지 않는다
 * @param {() => number} props.getSlotGeneration 슬롯이 바뀌면 달라지는 값
 * @param {() => Promise<void>} props.beforeRankWrite 쓰기 전에 매칭 큐를 비운다
 * @param {(result: {applyId: string, count: number}) => Promise<void>} props.onApplied
 * @param {(result: object) => Promise<void>} props.onReverted
 */
export function TierImportScreen({ onClose, db, getWorks, theme: C, isBlocked, getSlotGeneration, beforeRankWrite, onApplied, onReverted }) {
  const [latest, setLatest] = useState(null);
  const [source, setSource] = useState(null); // { name, table, baseline }
  const [current, setCurrent] = useState(null);
  const [useFile, setUseFile] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { applyId, count, name, warning, reverted, keptRead }
  const generationRef = useRef(getSlotGeneration());
  const mountedRef = useRef(true);

  useEffect(() => {
    getLatestImport(db).then((row) => { if (mountedRef.current) setLatest(row); }).catch(() => {});
    return () => { mountedRef.current = false; };
  }, []);

  const plan = useMemo(
    () => (source && current ? buildImportPlan({ table: source.table, current, baseline: source.baseline, useFile }) : null),
    [source, current, useFile]
  );
  const listItems = useMemo(() => {
    if (!plan) return [];
    return [
      ...plan.conflicts.map((item) => ({ type: "conflict", key: `c-${item.key}`, item })),
      ...plan.changes.map((item) => ({ type: "change", key: `n-${item.id}`, item })),
      ...plan.skipped.map((item, index) => ({ type: "skip", key: `s-${index}`, item })),
    ];
  }, [plan]);

  const slotChanged = () => generationRef.current !== getSlotGeneration();

  async function pick() {
    if (busy) return;
    if (isBlocked()) { setError("자동매칭이 끝난 뒤에 가져와 주세요."); return; }
    setError("");
    let file;
    try {
      file = await fileAccess.pickFile({ mimeType: XLSX_MIME });
    } catch (e) {
      if (e.code !== CANCELLED) setError(`파일을 열지 못했어요. ${e.message}`);
      return;
    }
    if (file.size && file.size > MAX_FILE_BYTES) { setError("파일이 너무 커요. 티어표 파일이 맞는지 확인해 주세요."); return; }
    setBusy(true);
    try {
      const table = readTierTable(readXlsx(await fileAccess.readBytes(file.uri)));
      if (!table) throw new Error("티어표 머리글을 찾지 못했어요. 이 앱에서 내보낸 파일을 골라 주세요.");
      const [works, baseline] = await Promise.all([getWorks(), table.exportId ? loadSnapshot(db, table.exportId) : null]);
      if (slotChanged()) throw new Error("슬롯이 바뀌었어요. 다시 열어 주세요.");
      if (!mountedRef.current) return;
      setUseFile(new Set());
      setCurrent(works);
      setSource({ name: file.name, table, baseline });
    } catch (e) {
      if (mountedRef.current) setError(`읽지 못했어요. ${e?.message || ""}`);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  function toggleConflict(key) {
    setUseFile((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  async function apply() {
    if (busy || !plan || plan.writes.length === 0) return;
    if (isBlocked()) { setError("자동매칭이 끝난 뒤에 적용해 주세요."); return; }
    if (slotChanged()) { setError("슬롯이 바뀌어 적용하지 않았어요. 다시 열어 주세요."); return; }
    setError("");
    setBusy(true);
    try {
      await beforeRankWrite();
      // 미리보기 뒤에 앱 값이 바뀌었으면 보여 준 것과 다른 내용을 쓰지 않는다.
      const fresh = await getWorks();
      const freshPlan = buildImportPlan({ table: source.table, current: fresh, baseline: source.baseline, useFile });
      if (freshPlan.signature !== plan.signature) {
        if (mountedRef.current) {
          setCurrent(fresh);
          setError("그 사이 앱의 표가 바뀌어 다시 비교했어요. 내용을 확인하고 다시 눌러 주세요.");
        }
        return;
      }
      const count = plan.changes.length;
      const { applyId } = await applyImport(db, { writes: plan.writes, fileName: source.name || "", itemCount: count });
      let warning = "";
      try {
        await onApplied({ applyId, count });
      } catch (e) {
        warning = `적용했지만 화면을 새로 고치지 못했어요. 앱을 다시 열어 확인해 주세요. ${e?.message || ""}`;
      }
      if (mountedRef.current) setDone({ applyId, count, name: source.name, warning });
    } catch (e) {
      if (mountedRef.current) setError(`적용하지 못했어요. 앱의 값은 그대로예요. ${e?.message || ""}`);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function revert(applyId) {
    if (busy) return;
    if (isBlocked()) { setError("자동매칭이 끝난 뒤에 되돌려 주세요."); return; }
    setError("");
    setBusy(true);
    try {
      await beforeRankWrite();
      const result = await revertImport(db, applyId);
      if (!result.ok) {
        if (mountedRef.current) setError("이미 되돌렸거나 그 뒤에 다시 가져온 결과예요.");
        return;
      }
      await onReverted(result);
      if (!mountedRef.current) return;
      setLatest(await getLatestImport(db));
      setDone((prev) => ({ ...(prev || {}), reverted: true, keptRead: result.keptRead }));
    } catch (e) {
      if (mountedRef.current) setError(`되돌리지 못했어요. ${e?.message || ""}`);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  const renderItem = ({ item: entry }) => {
    if (entry.type === "conflict") {
      const { item } = entry;
      return (
        <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ color: C.warn, fontSize: 12, fontWeight: "700" }}>양쪽에서 바뀜 · {FIELD_LABEL[item.field]}</Text>
          <Text style={{ color: C.text, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>앱 {item.app} · 파일 {item.file}</Text>
          <TouchableOpacity onPress={() => toggleConflict(item.key)} disabled={busy} style={{ alignSelf: "flex-start", marginTop: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: item.chosen ? C.primary : C.chip }}>
            <Text style={{ color: item.chosen ? "#fff" : C.text, fontSize: 12, fontWeight: "700" }}>{item.chosen ? "파일 값으로 적용" : "앱 값 유지"}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (entry.type === "change") {
      return (
        <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ color: C.text, fontSize: 13 }} numberOfLines={1}>{entry.item.title}</Text>
          <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{changeText(entry.item)}</Text>
        </View>
      );
    }
    return (
      <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <Text style={{ color: C.text, fontSize: 13 }} numberOfLines={1}>{entry.item.rowNumber}행 {entry.item.title}</Text>
        <Text style={{ color: C.warn, fontSize: 12, marginTop: 2 }}>{entry.item.reason}</Text>
      </View>
    );
  };

  const summary = plan && (
    <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ padding: 12, borderRadius: 10, backgroundColor: C.card }}>
        <Text style={{ color: C.text, fontSize: 14, fontWeight: "800" }} numberOfLines={1}>{source.name}</Text>
        <Text style={{ color: C.text, fontSize: 14, marginTop: 6 }}>바뀌는 작품 {plan.changes.length}개</Text>
        {plan.conflicts.length > 0 ? <Text style={{ color: C.warn, fontSize: 14, marginTop: 2 }}>양쪽에서 바뀐 값 {plan.conflicts.length}개 (기본은 앱 값 유지)</Text> : null}
        {plan.skipped.length > 0 ? <Text style={{ color: C.warn, fontSize: 14, marginTop: 2 }}>건너뛴 칸 {plan.skipped.length}개</Text> : null}
        {plan.writes.length === 0 && plan.conflicts.length === 0 && plan.skipped.length === 0 ? <Text style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>앱에 반영할 내용이 없어요.</Text> : null}
      </View>
      {noticeLines(plan.notices).map((line) => (
        <Text key={line} style={{ color: C.sub, fontSize: 12, marginTop: 8, lineHeight: 18 }}>{line}</Text>
      ))}
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ flex: 1, color: C.text, fontSize: 17, fontWeight: "800" }} numberOfLines={1}>📥 엑셀에서 가져오기</Text>
          <TouchableOpacity onPress={onClose} disabled={busy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: C.chip, opacity: busy ? 0.5 : 1 }}>
            <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>닫기</Text>
          </TouchableOpacity>
        </View>

        {done ? (
          <View style={{ flex: 1, padding: 14 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "800" }}>{done.reverted ? "되돌렸어요" : `작품 ${done.count}개에 적용했어요`}</Text>
            {done.keptRead > 0 ? <Text style={{ color: C.sub, fontSize: 13, marginTop: 8, lineHeight: 19 }}>가져온 뒤 앱에서 또 고친 화수 {done.keptRead}개는 그대로 뒀어요.</Text> : null}
            {done.warning ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8, lineHeight: 19 }}>{done.warning}</Text> : null}
            {error ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
            {!done.reverted && done.applyId ? <Button C={C} title={busy ? "되돌리는 중…" : "되돌리기"} disabled={busy} onPress={() => revert(done.applyId)} /> : null}
            <Button C={C} title="닫기" primary disabled={busy} onPress={onClose} />
          </View>
        ) : !plan ? (
          <View style={{ flex: 1, padding: 14 }}>
            <Text style={{ color: C.text, fontSize: 14, lineHeight: 21 }}>내보낸 엑셀에서 고친 티어, 순서, 읽은 화수를 앱에 반영해요. 적용하기 전에 바뀌는 내용을 보여 줘요.</Text>
            <Text style={{ color: C.sub, fontSize: 13, marginTop: 8, lineHeight: 19 }}>순서는 행 순서를 따라요. 티어와 순서는 직접 배정과 혼합 방식에서만 바뀌어요. 제목, 플랫폼, 대장르, 작가 칸은 읽지 않고, 작품을 추가하거나 삭제하지 않아요.</Text>
            {latest ? (
              <View style={{ marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: C.card }}>
                <Text style={{ color: C.sub, fontSize: 12 }}>지난 가져오기 · {dateLabel(latest.applied_at)} · {latest.item_count}개</Text>
                <Text style={{ color: C.text, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{latest.file_name}</Text>
                <Button C={C} title="지난 가져오기 되돌리기" disabled={busy} onPress={() => revert(latest.id)} />
              </View>
            ) : null}
            {error ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8, lineHeight: 19 }}>{error}</Text> : null}
            {busy ? <ActivityIndicator color={C.primary} style={{ marginTop: 12 }} /> : null}
            <Button C={C} title={busy ? "읽는 중…" : "파일 고르기"} primary disabled={busy} onPress={pick} />
          </View>
        ) : (
          <>
            <FlatList
              style={{ flex: 1 }}
              data={listItems}
              keyExtractor={(entry) => entry.key}
              ListHeaderComponent={summary}
              renderItem={renderItem}
              initialNumToRender={20}
              windowSize={7}
            />
            <View style={{ paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.line }}>
              {error ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8, lineHeight: 19 }}>{error}</Text> : null}
              <Button C={C} title="다른 파일 고르기" disabled={busy} onPress={pick} />
              <Button C={C} title={busy ? "적용 중…" : `작품 ${plan.changes.length}개에 적용`} primary disabled={busy || plan.writes.length === 0} onPress={apply} />
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
