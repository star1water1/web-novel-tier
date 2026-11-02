// 티어표 엑셀 내보내기 화면: 지난 출력본과의 변동을 보여 주고, 고른 폴더에 저장한다.
// 이 화면은 Alert를 쓰지 않고 안내를 화면에 적는다 (자동매칭 중 Alert 금지).
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal } from "../system-insets";
import * as fileAccess from "../file-access";
import { compareToBaseline } from "./diff";
import { EXPORT_COLORS, buildSheet } from "./sheet";
import { listSnapshots, loadSnapshot, saveSnapshot } from "./store";
import { buildXlsx } from "./xlsxWriter";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const NO_BASELINE = "none";
const { CANCELLED } = fileAccess.FileAccessErrorCode;

const pad = (n) => String(n).padStart(2, "0");
const fileStamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
const dateLabel = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const sameBytes = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const CHANGE_LABEL = { new: "신규", up: "상승", down: "하락" };
const CHANGE_FILL = { new: EXPORT_COLORS.new, up: EXPORT_COLORS.up, down: EXPORT_COLORS.down };

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

function Stat({ C, label, value, fill }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
      <View style={{ width: 14, height: 14, borderRadius: 3, marginRight: 8, backgroundColor: fill ? `#${fill}` : "transparent", borderWidth: fill ? 0 : 1, borderColor: C.line }} />
      <Text style={{ flex: 1, color: C.text, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 14, fontWeight: "700" }}>{value}개</Text>
    </View>
  );
}

function ChangedRow({ C, row, state }) {
  const fill = state.change ? CHANGE_FILL[state.change] : EXPORT_COLORS.read;
  const label = [state.change ? CHANGE_LABEL[state.change] : null, state.readChanged ? "화수" : null].filter(Boolean).join("·");
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: `#${fill}`, marginRight: 8 }}>
        <Text style={{ color: "#000", fontSize: 11, fontWeight: "700" }}>{label}</Text>
      </View>
      <Text style={{ color: C.sub, fontSize: 12, marginRight: 6 }}>{row.tierLabel} {row.rank}위</Text>
      <Text style={{ flex: 1, color: C.text, fontSize: 13 }} numberOfLines={1}>{row.title}</Text>
    </View>
  );
}

/**
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {object} props.db { exec, all, first, execBatch, newId }
 * @param {() => Promise<{rows: object[], tierMode: string, tierOrder: string[]}>} props.getWorks 순위 탭과 같은 순서의 표
 * @param {string} props.filePrefix 파일 이름 앞부분
 * @param {object} props.theme App.jsx의 색 C
 * @param {() => boolean} props.isBlocked true면 저장하지 않는다
 * @param {() => number} props.getSlotGeneration 슬롯이 바뀌면 달라지는 값
 */
export function TierExportScreen({ onClose, db, getWorks, filePrefix, theme: C, isBlocked, getSlotGeneration }) {
  const [table, setTable] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [baselineId, setBaselineId] = useState(NO_BASELINE);
  const [baseline, setBaseline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null); // { name, uri, directoryUri, warning }
  const generationRef = useRef(getSlotGeneration());
  const savedRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [works, list] = await Promise.all([getWorks(), listSnapshots(db)]);
        if (!alive) return;
        const latest = list?.[0]?.id;
        const snap = latest ? await loadSnapshot(db, latest) : null;
        if (!alive) return;
        setSnapshots(list || []);
        setBaselineId(snap ? latest : NO_BASELINE);
        setBaseline(snap);
        setTable(works);
      } catch (e) {
        if (alive) setError(`표를 읽지 못했어요. ${e?.message || ""}`);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 받는 앱은 보내기 때 읽기 권한을 따로 받으므로 화면을 닫으면 폴더 권한을 해제한다. 유지 권한 개수에는 OS 상한이 있다.
  useEffect(() => () => {
    mountedRef.current = false;
    const directoryUri = savedRef.current?.directoryUri;
    if (directoryUri) fileAccess.releaseDirectory(directoryUri).catch(() => {});
  }, []);

  const result = useMemo(() => (table ? compareToBaseline(table.rows, table, baseline) : null), [table, baseline]);
  const changedRows = useMemo(() => {
    if (!table || !result) return [];
    return table.rows.filter((row) => {
      const state = result.status.get(row.id);
      return state?.change || state?.readChanged;
    });
  }, [table, result]);

  async function chooseBaseline(id) {
    if (busy || id === baselineId) return;
    setError("");
    if (id === NO_BASELINE) {
      setBaselineId(id);
      setBaseline(null);
      return;
    }
    try {
      const snap = await loadSnapshot(db, id);
      if (!snap) { setError("이 출력본은 읽을 수 없어요. 다른 출력본을 골라 주세요."); return; }
      if (!mountedRef.current) return;
      setBaselineId(id);
      setBaseline(snap);
    } catch (e) {
      setError(`출력본을 읽지 못했어요. ${e?.message || ""}`);
    }
  }

  async function save() {
    if (busy || !table || !result) return;
    if (isBlocked()) { setError("자동매칭이 끝난 뒤에 저장해 주세요."); return; }
    setError("");
    let directoryUri;
    try {
      directoryUri = (await fileAccess.pickDirectory()).uri;
    } catch (e) {
      if (e.code !== CANCELLED) setError(`폴더를 열지 못했어요. ${e.message}`);
      return;
    }
    if (generationRef.current !== getSlotGeneration()) {
      fileAccess.releaseDirectory(directoryUri).catch(() => {});
      setError("슬롯이 바뀌어 저장하지 않았어요. 다시 열어 주세요.");
      return;
    }

    setBusy(true);
    let fileUri = null;
    let written = false;
    try {
      const now = new Date();
      const name = `${filePrefix}_${fileStamp(now)}.xlsx`;
      const bytes = buildXlsx(buildSheet(table.rows, result.status), now);
      fileUri = (await fileAccess.createFileInDirectory(directoryUri, name, XLSX_MIME)).uri;
      await fileAccess.writeBytes(fileUri, bytes);
      // 저장소 오류로 파일이 잘리는 경우를 잡기 위해 다시 읽어 비교한다. 작은 파일이라 전체를 읽어도 된다.
      if (!sameBytes(await fileAccess.readBytes(fileUri), bytes)) throw new Error("저장한 파일을 다시 읽어 보니 내용이 달라요.");
      written = true;

      let warning = "";
      try {
        await saveSnapshot(db, { fileName: name, tierMode: table.tierMode, tierOrder: table.tierOrder, rows: table.rows });
      } catch (e) {
        warning = `파일은 저장했지만 출력 기록을 남기지 못해, 다음 출력은 이번 표와 비교하지 못해요. ${e?.message || ""}`;
      }
      const next = { name, uri: fileUri, directoryUri, warning };
      savedRef.current = next;
      if (mountedRef.current) setSaved(next);
    } catch (e) {
      if (fileUri && !written) await fileAccess.deleteFile(fileUri).catch(() => {});
      fileAccess.releaseDirectory(directoryUri).catch(() => {});
      if (mountedRef.current) setError(`저장하지 못했어요. 지난 출력 기록은 그대로예요. ${e?.message || ""}`);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function share() {
    if (!saved) return;
    try {
      await fileAccess.shareDocument(saved.uri, XLSX_MIME, saved.name);
    } catch (e) {
      setError(`보내지 못했어요. 파일은 폴더에 저장되어 있어요. ${e.message}`);
    }
  }

  const header = result && (
    <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
      {snapshots.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: C.sub, fontSize: 12 }}>비교할 지난 출력본</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {snapshots.map((snap, index) => (
              <TouchableOpacity
                key={snap.id}
                onPress={() => chooseBaseline(snap.id)}
                style={{ paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, marginRight: 6, backgroundColor: baselineId === snap.id ? C.primary : C.chip }}
              >
                <Text style={{ color: baselineId === snap.id ? "#fff" : C.text, fontSize: 12, fontWeight: "700" }}>{index === 0 ? "직전 · " : ""}{dateLabel(snap.created_at)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => chooseBaseline(NO_BASELINE)}
              style={{ paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: baselineId === NO_BASELINE ? C.primary : C.chip }}
            >
              <Text style={{ color: baselineId === NO_BASELINE ? "#fff" : C.text, fontSize: 12, fontWeight: "700" }}>비교 안 함</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : null}

      <View style={{ padding: 12, borderRadius: 10, backgroundColor: C.card }}>
        <Text style={{ color: C.text, fontSize: 14, fontWeight: "800", marginBottom: 4 }}>총 {table.rows.length}작품</Text>
        {result.first ? (
          <Text style={{ color: C.sub, fontSize: 13, lineHeight: 19 }}>
            {snapshots.length === 0 ? "첫 출력이에요. " : ""}색 없이 저장해요. 다음 출력부터 이번 표와 비교해요.
          </Text>
        ) : (
          <>
            <Stat C={C} label="신규" value={result.counts.new} fill={EXPORT_COLORS.new} />
            <Stat C={C} label="순위 상승" value={result.counts.up} fill={EXPORT_COLORS.up} />
            <Stat C={C} label="순위 하락" value={result.counts.down} fill={EXPORT_COLORS.down} />
            <Stat C={C} label="읽은 화수 변화" value={result.counts.read} fill={EXPORT_COLORS.read} />
            <Stat C={C} label="삭제 (표에 없음)" value={result.counts.removed} />
          </>
        )}
      </View>

      {result.tierConfigChanged ? (
        <Text style={{ color: C.warn, fontSize: 13, marginTop: 8, lineHeight: 19 }}>지난 출력 뒤로 티어 구성이 바뀌었어요. 많은 작품이 칠해질 수 있어요.</Text>
      ) : null}
      {result.removed.length > 0 ? (
        <Text style={{ color: C.sub, fontSize: 12, marginTop: 8, lineHeight: 18 }} numberOfLines={4}>삭제: {result.removed.join(", ")}</Text>
      ) : null}
      {!result.first ? (
        <Text style={{ color: C.sub, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
          순서를 깬 작품만 주체로 보고 칠해요. 원인은 알 수 없어서, 맞바뀌거나 짧게 움직인 경우에는 실제와 다를 수 있어요.
        </Text>
      ) : null}
      {changedRows.length > 0 ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 12, marginBottom: 4 }}>칠해질 작품</Text> : null}
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ flex: 1, color: C.text, fontSize: 17, fontWeight: "800" }} numberOfLines={1}>📊 엑셀로 내보내기</Text>
          <TouchableOpacity onPress={onClose} disabled={busy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: C.chip, opacity: busy ? 0.5 : 1 }}>
            <Text style={{ color: C.text, fontWeight: "700", fontSize: 13 }}>닫기</Text>
          </TouchableOpacity>
        </View>

        {saved ? (
          <View style={{ flex: 1, padding: 14 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "800" }}>저장했어요</Text>
            <Text style={{ color: C.text, fontSize: 14, marginTop: 8 }}>{saved.name}</Text>
            {saved.warning
              ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8, lineHeight: 19 }}>{saved.warning}</Text>
              : <Text style={{ color: C.sub, fontSize: 13, marginTop: 8, lineHeight: 19 }}>다음 출력은 이번 표와 비교해요. 이번 표를 다시 뽑고 싶으면 비교할 출력본을 그 전 것으로 고르면 돼요.</Text>}
            {error ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
            <Button C={C} title="다른 앱으로 보내기" onPress={share} />
            <Button C={C} title="닫기" primary onPress={onClose} />
          </View>
        ) : !result ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 14 }}>
            {error ? <Text style={{ color: C.warn, fontSize: 14 }}>{error}</Text> : <ActivityIndicator color={C.primary} />}
          </View>
        ) : (
          <>
            <FlatList
              style={{ flex: 1 }}
              data={changedRows}
              keyExtractor={(row) => row.id}
              ListHeaderComponent={header}
              renderItem={({ item }) => <ChangedRow C={C} row={item} state={result.status.get(item.id)} />}
              initialNumToRender={20}
              windowSize={7}
            />
            <View style={{ paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.line }}>
              {error ? <Text style={{ color: C.warn, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
              <Button C={C} title={busy ? "저장 중…" : "폴더를 골라 저장"} primary disabled={busy || table.rows.length === 0} onPress={save} />
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
