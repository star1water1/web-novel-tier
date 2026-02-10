/**
 * 데이터 Context
 * @module contexts/DataContext
 * @version 6.1.2
 *
 * @bugfix v6.1.2
 * - [FIX] batchAddTag/batchRemoveTag/batchSetPlatforms/batchIncReadCount 파라미터 순서 수정
 *   → (ids, value) → (value, ids) 순서로 변경. BulkScreen에서 batchAddTag(bulkTag)처럼
 *     값만 전달하면 ids=selectedIds 기본값 사용. 기존엔 ids에 값이 들어가 동작 안 함
 *
 * @bugfix v6.1.1
 * - [FIX] importCoversFromGallery 호출 시 불필요한 첫번째 인자(setCoverLibrary) 제거
 * - [FIX] refreshDailyRecoHandler 호출 규약 수정 (forceNew: boolean) + 반환값으로 state 업데이트
 * - [FIX] loadMatchStatsHandler 호출 시 불필요한 novelList 인자 제거 (핸들러가 DB 직접 조회)
 * - [FIX] removeNovelHandler, batchDeleteNovelsHandler에 불필요한 rebuildAllFromMatches 콜백 제거
 *   (핸들러 내부에서 이미 호출)
 *
 * @description
 * 핵심 데이터(작품 목록, 예정 작품, 표지, 매칭 통계)와 CRUD를 관리.
 * AppContext.dbReady가 true가 되면 자동 로드.
 *
 * 제공 값:
 *  - list / loadList: 작품 목록 + 로드
 *  - addNovel / removeNovel / updateNovel: 작품 CRUD
 *  - batchAddTag / batchRemoveTag / batchSetPlatforms / batchIncReadCount / batchDeleteNovels
 *  - matchStats / loadMatchStats
 *  - plannedList / loadPlanned / addPlanned / removePlanned / updatePlanned / convertPlanned
 *  - coverLibrary / coverLibrarySize / loadCovers / importCovers / removeCover / removeUnusedCovers
 *  - recentChanges / addRecentChange / clearRecentChanges
 *  - undoStack / pushUndo / popUndo
 *  - weeklyReco / dailyReco / refreshDaily
 *  - reviewSearchQuery / reviewSelectedIds / selectedIds / toggleSelect
 *  - bulkTag / bulkPlats / bulkDelta + setters
 *  - coverLibraryLoading / coverLibraryProgress / coverLibraryFilter + setters
 *  - resetAll
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { Alert } from "react-native";
import { useApp } from "./AppContext";

// handlers (pure functions)
import {
  loadNovelList, addNovel as addNovelHandler, removeNovel as removeNovelHandler,
  updateNovel as updateNovelHandler,
  batchAddTag as batchAddTagHandler, batchRemoveTag as batchRemoveTagHandler,
  batchSetPlatforms as batchSetPlatformsHandler, batchIncReadCount as batchIncReadCountHandler,
  batchDeleteNovels as batchDeleteNovelsHandler,
  loadMatchStats as loadMatchStatsHandler,
  pickRandomUnseenPair, decideMatch, undoLastMatch, deleteMatch, flipMatchWinner,
  getNovelMatchLogs, getHeadToHead, resetAllMatches,
  loadPlannedList, addPlannedNovel, removePlannedNovel, updatePlannedNovel, convertPlannedToNovel,
  loadCoverLibrary as loadCoverLibraryHandler,
  importCoversFromGallery, removeCoverFromLibrary, removeAllUnusedCovers,
  refreshDailyRecommendation as refreshDailyRecoHandler,
  resetAll as resetAllHandler,
  saveTierHistory as saveTierHistoryHandler,
  pickImageFromGallery, checkTitleDuplicate,
} from "../handlers";
import { rebuildAllFromMatches } from "../services/eloService";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { dbReady, appSettings, setIsLoading } = useApp();

  // ── 작품 목록 ──
  const [list, setList] = useState([]);

  // ── 매칭 통계 ──
  const [matchStats, setMatchStats] = useState({ total: 0, done: 0, percent: 0 });

  // ── 예정 작품 ──
  const [plannedList, setPlannedList] = useState([]);

  // ── 표지 라이브러리 ──
  const [coverLibrary, setCoverLibrary] = useState([]);
  const [coverLibrarySize, setCoverLibrarySize] = useState(0);
  const [coverLibraryLoading, setCoverLibraryLoading] = useState(false);
  const [coverLibraryProgress, setCoverLibraryProgress] = useState({ current: 0, total: 0 });
  const [coverLibraryFilter, setCoverLibraryFilter] = useState("all");

  // ── 최근 변경 ──
  const [recentChanges, setRecentChanges] = useState([]);

  // ── 되돌리기 스택 ──
  const [undoStack, setUndoStack] = useState([]);

  // ── 추천 ──
  const [weeklyReco, setWeeklyReco] = useState(null);
  const [dailyReco, setDailyReco] = useState(null);

  // ── 검토/선택 ──
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewSelectedIds, setReviewSelectedIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTag, setBulkTag] = useState("");
  const [bulkPlats, setBulkPlats] = useState([]);
  const [bulkDelta, setBulkDelta] = useState("");

  // ── 티어 히스토리 ──
  const [tierHistory, setTierHistory] = useState([]);

  // ═══════════════════════════════════════════════════════════
  // 로드 함수
  // ═══════════════════════════════════════════════════════════

  const loadList = useCallback(async (sortKey = "rating", sortDir = "DESC") => {
    const novels = await loadNovelList(sortKey, sortDir);
    setList(novels || []);
  }, []);

  const loadMatchStatsData = useCallback(async () => {
    const stats = await loadMatchStatsHandler();
    setMatchStats(stats || { total: 0, done: 0, percent: 0 });
  }, []);

  const loadPlanned = useCallback(async () => {
    const data = await loadPlannedList();
    setPlannedList(data || []);
  }, []);

  const loadCovers = useCallback(async () => {
    const { covers, totalSize } = await loadCoverLibraryHandler();
    setCoverLibrary(covers || []);
    setCoverLibrarySize(totalSize || 0);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 초기 로드
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (!dbReady) return;
    (async () => {
      try {
        await loadList();
        await loadPlanned();
        await loadCovers();
      } catch (e) {
        console.error("DataContext 초기화 오류:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [dbReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // matchStats는 list가 바뀌면 재계산
  useEffect(() => {
    if (list.length > 0) loadMatchStatsData();
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════
  // 작품 CRUD (핸들러 래핑 + 자동 refresh)
  // ═══════════════════════════════════════════════════════════

  const addNovel = useCallback(async (novelData) => {
    const existing = list.find((n) => n.title === (novelData.title || "").trim());
    if (existing) { Alert.alert("오류", "이미 존재하는 제목입니다."); return { success: false }; }
    const result = await addNovelHandler(novelData);
    if (result.success) await loadList();
    return result;
  }, [list, loadList]);

  const removeNovel = useCallback(async (id) => {
    Alert.alert("삭제 확인", "이 작품을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
        await removeNovelHandler(id);
        await loadList();
      }},
    ]);
  }, [loadList]);

  const updateNovel = useCallback(async (novel) => {
    await updateNovelHandler(novel);
    await loadList();
  }, [loadList]);

  // ── 대량 편집 ──
  // ⚠️ BulkScreen에서 batchAddTag(bulkTag)처럼 값만 전달하므로
  //    첫 번째 인자=값, 두 번째 인자=ids(선택) 순서로 통일
  const batchAddTag = useCallback(async (tag, ids) => {
    if (!(tag || "").trim()) return;
    await batchAddTagHandler(ids || selectedIds, tag);
    await loadList();
  }, [selectedIds, loadList]);

  const batchRemoveTag = useCallback(async (tag, ids) => {
    if (!(tag || "").trim()) return;
    await batchRemoveTagHandler(ids || selectedIds, tag);
    await loadList();
  }, [selectedIds, loadList]);

  const batchSetPlatforms = useCallback(async (plats, ids) => {
    await batchSetPlatformsHandler(ids || selectedIds, plats || []);
    await loadList();
  }, [selectedIds, loadList]);

  const batchIncReadCount = useCallback(async (delta, ids) => {
    await batchIncReadCountHandler(ids || selectedIds, delta || 0);
    await loadList();
  }, [selectedIds, loadList]);

  const batchDeleteNovels = useCallback(async (ids) => {
    const targets = ids || selectedIds;
    Alert.alert("일괄 삭제", `선택한 ${targets.length}개 작품을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
        await batchDeleteNovelsHandler(targets);
        setSelectedIds([]);
        await loadList();
      }},
    ]);
  }, [selectedIds, loadList]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 매칭
  // ═══════════════════════════════════════════════════════════

  const handleResetMatches = useCallback(async () => {
    Alert.alert("초기화 확인", "모든 매칭 기록을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "초기화", style: "destructive", onPress: async () => {
        await resetAllMatches();
        await loadList();
      }},
    ]);
  }, [loadList]);

  // ═══════════════════════════════════════════════════════════
  // 예정 작품 CRUD
  // ═══════════════════════════════════════════════════════════

  const addPlanned = useCallback(async (data) => {
    const result = await addPlannedNovel(data);
    if (result.success) await loadPlanned();
    return result;
  }, [loadPlanned]);

  const removePlanned = useCallback(async (id) => {
    await removePlannedNovel(id);
    await loadPlanned();
  }, [loadPlanned]);

  const updatePlanned = useCallback(async (item) => {
    await updatePlannedNovel(item);
    await loadPlanned();
  }, [loadPlanned]);

  const convertPlanned = useCallback(async (planned) => {
    const result = await convertPlannedToNovel(planned);
    if (result.success) { await loadPlanned(); await loadList(); }
    return result;
  }, [loadPlanned, loadList]);

  // ═══════════════════════════════════════════════════════════
  // 표지
  // ═══════════════════════════════════════════════════════════

  const importCovers = useCallback(async () => {
    setCoverLibraryLoading(true);
    await importCoversFromGallery(setCoverLibraryProgress);
    setCoverLibraryLoading(false);
    await loadCovers();
  }, [loadCovers]);

  const removeCover = useCallback(async (id) => {
    await removeCoverFromLibrary(id);
    await loadCovers();
  }, [loadCovers]);

  const removeUnusedCovers = useCallback(async () => {
    await removeAllUnusedCovers();
    await loadCovers();
  }, [loadCovers]);

  // ═══════════════════════════════════════════════════════════
  // 추천
  // ═══════════════════════════════════════════════════════════

  const refreshDaily = useCallback(async (forceNew = false) => {
    const result = await refreshDailyRecoHandler(forceNew);
    if (result) setDailyReco(result);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 최근 변경/언두/초기화
  // ═══════════════════════════════════════════════════════════

  const addRecentChange = useCallback((change) => {
    setRecentChanges((prev) => [{ ...change, timestamp: Date.now() }, ...prev].slice(0, 200));
  }, []);

  const clearRecentChanges = useCallback(() => setRecentChanges([]), []);

  const pushUndo = useCallback((action) => {
    setUndoStack((prev) => [...prev, { ...action, at: Date.now() }].slice(-50));
  }, []);

  const popUndo = useCallback(() => {
    let action = null;
    setUndoStack((prev) => {
      action = prev[prev.length - 1] || null;
      return prev.slice(0, -1);
    });
    return action;
  }, []);

  const saveTierHistory = useCallback(async (items) => {
    await saveTierHistoryHandler(items);
  }, []);

  const resetAll = useCallback(async () => {
    Alert.alert("전체 초기화", "모든 데이터를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "초기화", style: "destructive", onPress: async () => {
        await resetAllHandler();
        setList([]); setPlannedList([]); setMatchStats({ total: 0, done: 0, percent: 0 });
      }},
    ]);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 유틸리티 (표지/갤러리)
  // ═══════════════════════════════════════════════════════════

  const pickImage = useCallback(async () => pickImageFromGallery(), []);
  const checkDuplicate = useCallback((title) => checkTitleDuplicate(title, list), [list]);

  // ═══════════════════════════════════════════════════════════

  const value = useMemo(() => ({
    // 작품 목록
    list, setList, loadList,
    addNovel, removeNovel, updateNovel,
    // 대량 편집
    batchAddTag, batchRemoveTag, batchSetPlatforms, batchIncReadCount, batchDeleteNovels,
    selectedIds, setSelectedIds, toggleSelect,
    bulkTag, setBulkTag, bulkPlats, setBulkPlats, bulkDelta, setBulkDelta,
    // 매칭
    matchStats, loadMatchStats: loadMatchStatsData,
    pickRandomUnseenPair, decideMatch, undoLastMatch, deleteMatch, flipMatchWinner,
    getNovelMatchLogs, getHeadToHead, resetAllMatches: handleResetMatches,
    rebuildAllFromMatches,
    // 예정 작품
    plannedList, setPlannedList, loadPlanned,
    addPlanned, removePlanned, updatePlanned, convertPlanned,
    // 표지
    coverLibrary, setCoverLibrary, coverLibrarySize,
    coverLibraryLoading, coverLibraryProgress, coverLibraryFilter, setCoverLibraryFilter,
    loadCovers, importCovers, removeCover, removeUnusedCovers,
    // 추천
    weeklyReco, setWeeklyReco, dailyReco, setDailyReco, refreshDaily,
    // 최근 변경
    recentChanges, addRecentChange, clearRecentChanges,
    // 언두
    undoStack, pushUndo, popUndo,
    // 검토
    reviewSearchQuery, setReviewSearchQuery, reviewSelectedIds, setReviewSelectedIds,
    // 티어 히스토리
    tierHistory, setTierHistory, saveTierHistory,
    // 유틸
    pickImage, checkDuplicate, resetAll,
  }), [
    list, matchStats, plannedList, coverLibrary, coverLibrarySize,
    coverLibraryLoading, coverLibraryProgress, coverLibraryFilter,
    recentChanges, undoStack, weeklyReco, dailyReco,
    reviewSearchQuery, reviewSelectedIds, selectedIds,
    bulkTag, bulkPlats, bulkDelta, tierHistory,
    loadList, addNovel, removeNovel, updateNovel,
    batchAddTag, batchRemoveTag, batchSetPlatforms, batchIncReadCount, batchDeleteNovels,
    toggleSelect, loadMatchStatsData, handleResetMatches,
    loadPlanned, addPlanned, removePlanned, updatePlanned, convertPlanned,
    loadCovers, importCovers, removeCover, removeUnusedCovers,
    refreshDaily, addRecentChange, clearRecentChanges,
    pushUndo, popUndo, saveTierHistory, pickImage, checkDuplicate, resetAll,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
