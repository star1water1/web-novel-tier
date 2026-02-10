/**
 * 태그 Context
 * @module contexts/TagContext
 * @version 6.1.1
 *
 * @bugfix v6.1.1
 * - [FIX] GENERAL_TAGS(object) → ALL_GENERAL_TAGS(flat array)로 변경
 *   → allTagsSorted 계산 시 object spread 대신 정상 배열 사용
 * - [FIX] addCustomTagHandler/removeCustomTagHandler/addComboTagHandler/removeComboTagHandler
 *   호출 시 현재 state(customTags/comboTags)를 2번째 인자로 전달
 *   → 핸들러 내부에서 undefined.includes() TypeError 방지
 *
 * @bugfix v6.1.5
 * - [FIX] loadTagSettings에서 custom_combo_traits/custom_combo_targets를 DB에서 로드하지 않음
 *   → 앱 재시작 시 커스텀 조합 특성/대상이 빈 배열로 초기화. 로드 추가
 *
 * @description
 * 모든 태그 관련 상태와 핸들러를 관리.
 * DB에서 태그 설정을 로드/저장하고 allTags를 계산.
 *
 * 제공 값:
 *  - customTags / comboTags / pinnedTags / hiddenTags / tagSentiments
 *  - tagRelations / coordinateSystems / userMajorGenres / userSubGenres
 *  - customComboTraits / customComboTargets
 *  - allTags: { allMajorGenres, allSubGenres, allTagsSorted }
 *  - selectedTags / setSelectedTags (태그 선택 모달용)
 *  - 모든 태그 CRUD 핸들러
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useApp } from "./AppContext";
import { getAppMeta, setAppMeta } from "../database";
import { MAJOR_GENRES, SUB_GENRES, ALL_GENERAL_TAGS } from "../constants";
import {
  addCustomTag as addCustomTagHandler,
  removeCustomTag as removeCustomTagHandler,
  addComboTag as addComboTagHandler,
  removeComboTag as removeComboTagHandler,
  savePinnedTags as savePinnedTagsHandler,
  saveHiddenTags as saveHiddenTagsHandler,
  saveTagSentiments as saveTagSentimentsHandler,
  saveTagRelations as saveTagRelationsHandler,
  saveCoordinateSystems as saveCoordHandler,
  getTagCoordinateSystems,
} from "../handlers";

const TagContext = createContext(null);

export function TagProvider({ children }) {
  const { dbReady } = useApp();

  // ── 상태 ──
  const [customTags, setCustomTags] = useState([]);
  const [comboTags, setComboTags] = useState([]);
  const [customComboTraits, setCustomComboTraits] = useState([]);
  const [customComboTargets, setCustomComboTargets] = useState([]);
  const [userMajorGenres, setUserMajorGenres] = useState([]);
  const [userSubGenres, setUserSubGenres] = useState([]);
  const [tagSentiments, setTagSentiments] = useState({});
  const [pinnedTags, setPinnedTags] = useState([]);
  const [hiddenTags, setHiddenTags] = useState([]);
  const [tagRelations, setTagRelations] = useState({ groups: {} });
  const [coordinateSystems, setCoordinateSystems] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);

  // ── DB 로드 ──
  const loadTagSettings = useCallback(async () => {
    try {
      const [ct, cb, pt, ht, ts, tr, cs, umg, usg, cct, cctar] = await Promise.all([
        getAppMeta("custom_tags"),
        getAppMeta("combo_tags"),
        getAppMeta("pinned_tags"),
        getAppMeta("hidden_tags"),
        getAppMeta("tag_sentiments"),
        getAppMeta("tag_relations"),
        getTagCoordinateSystems(),
        getAppMeta("user_major_genres"),
        getAppMeta("user_sub_genres"),
        getAppMeta("custom_combo_traits"),    // [FIX v6.1.5] 누락된 DB 로드 추가
        getAppMeta("custom_combo_targets"),   // [FIX v6.1.5] 누락된 DB 로드 추가
      ]);
      if (ct) setCustomTags(ct);
      if (cb) setComboTags(cb);
      if (pt) setPinnedTags(pt);
      if (ht) setHiddenTags(ht);
      if (ts) setTagSentiments(ts);
      if (tr) setTagRelations(tr);
      if (cs) setCoordinateSystems(cs);
      if (umg) setUserMajorGenres(umg);
      if (usg) setUserSubGenres(usg);
      if (cct) setCustomComboTraits(cct);     // [FIX v6.1.5]
      if (cctar) setCustomComboTargets(cctar); // [FIX v6.1.5]
    } catch (e) {
      console.warn("TagContext 태그 설정 로드 오류:", e);
    }
  }, []);

  useEffect(() => {
    if (dbReady) loadTagSettings();
  }, [dbReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 계산된 값 ──
  const allTags = useMemo(() => {
    const allMajorGenres = [...new Set([...MAJOR_GENRES, ...(userMajorGenres || [])])];
    const allSubGenres = [...new Set([...SUB_GENRES, ...(userSubGenres || [])])];
    const allTagsSorted = Array.from(new Set([
      ...(customTags || []), ...(comboTags || []),
      ...allMajorGenres, ...allSubGenres, ...(ALL_GENERAL_TAGS || []),
    ])).sort();
    return { allMajorGenres, allSubGenres, allTagsSorted };
  }, [customTags, comboTags, userMajorGenres, userSubGenres]);

  // ── 핸들러 (DB 저장 래핑) ──
  const addCustomTag = useCallback(async (tag) => {
    const result = await addCustomTagHandler(tag, customTags);
    if (result !== false && result?.success !== false) {
      setCustomTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    }
    return result;
  }, [customTags]);

  const removeCustomTag = useCallback(async (tag) => {
    await removeCustomTagHandler(tag, customTags);
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  }, [customTags]);

  const addComboTag = useCallback(async (tag) => {
    const result = await addComboTagHandler(tag, comboTags);
    if (result !== false && result?.success !== false) {
      setComboTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    }
    return result;
  }, [comboTags]);

  const removeComboTag = useCallback(async (tag) => {
    await removeComboTagHandler(tag, comboTags);
    setComboTags((prev) => prev.filter((t) => t !== tag));
  }, [comboTags]);

  const savePinnedTags = useCallback(async (tags) => {
    setPinnedTags(tags); await savePinnedTagsHandler(tags);
  }, []);

  const saveHiddenTags = useCallback(async (tags) => {
    setHiddenTags(tags); await saveHiddenTagsHandler(tags);
  }, []);

  const saveTagSentiments = useCallback(async (sents) => {
    setTagSentiments(sents); await saveTagSentimentsHandler(sents);
  }, []);

  const saveTagRelations = useCallback(async (rels) => {
    setTagRelations(rels); await saveTagRelationsHandler(rels);
  }, []);

  const saveCoordinateSystems = useCallback(async (sys) => {
    setCoordinateSystems(sys); await saveCoordHandler(sys);
  }, []);

  // ── 장르 저장 유틸 ──
  const saveUserMajorGenres = useCallback(async (genres) => {
    setUserMajorGenres(genres);
    await setAppMeta("user_major_genres", genres);
  }, []);

  const saveUserSubGenres = useCallback(async (genres) => {
    setUserSubGenres(genres);
    await setAppMeta("user_sub_genres", genres);
  }, []);

  const value = useMemo(() => ({
    customTags, setCustomTags,
    comboTags, setComboTags,
    customComboTraits, setCustomComboTraits,
    customComboTargets, setCustomComboTargets,
    userMajorGenres, setUserMajorGenres: saveUserMajorGenres,
    userSubGenres, setUserSubGenres: saveUserSubGenres,
    tagSentiments, setTagSentiments,
    pinnedTags, setPinnedTags,
    hiddenTags, setHiddenTags,
    tagRelations, setTagRelations,
    coordinateSystems, setCoordinateSystems,
    selectedTags, setSelectedTags,
    allTags,
    addCustomTag, removeCustomTag,
    addComboTag, removeComboTag,
    savePinnedTags, saveHiddenTags,
    saveTagSentiments, saveTagRelations,
    saveCoordinateSystems,
    loadTagSettings,
  }), [
    customTags, comboTags, customComboTraits, customComboTargets,
    userMajorGenres, userSubGenres, tagSentiments,
    pinnedTags, hiddenTags, tagRelations, coordinateSystems,
    selectedTags, allTags,
    addCustomTag, removeCustomTag, addComboTag, removeComboTag,
    savePinnedTags, saveHiddenTags, saveTagSentiments, saveTagRelations,
    saveCoordinateSystems, saveUserMajorGenres, saveUserSubGenres, loadTagSettings,
  ]);

  return <TagContext.Provider value={value}>{children}</TagContext.Provider>;
}

export function useTag() {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error("useTag must be used within TagProvider");
  return ctx;
}
