/**
 * 필터 Context
 * @module contexts/FilterContext
 * @version 6.1.3
 *
 * @bugfix v6.1.3
 * - [FIX] supplementList 필터 키 불일치 수정
 *   → Modal 저장 키: noAuthor/noPlatform/noCover/noMajorGenre/noTotalEpisodes/minTags
 *   → 기존 읽기 키: checkAuthor/checkPlatform/checkCover/checkMajorGenre/checkTotalEpisodes/minTagCount
 *   → 결과: 보충 설정을 변경해도 필터에 반영되지 않아 보충 기능 완전 작동불능
 *
 * @bugfix v6.1.2
 * - [FIX] homeFiltered useMemo에 homeSortKey/homeSortDir 기반 정렬 로직 누락 수정
 *   → rating/title/created/read 4가지 정렬 + ASC/DESC 방향 적용
 *   → dependency array에 homeSortKey, homeSortDir 추가
 *
 * @bugfix v6.1.5
 * - [FIX] homeFiltered에서 let result = list (원본 참조) 후 .sort() → React state 직접 변이
 *   → [...(list || [])]로 복사본 생성 후 정렬
 *
 * @description
 * 필터/정렬 상태와 계산된 필터링 결과를 관리.
 * DataContext의 list를 소비하여 homeFiltered, bulkFiltered, rankedEntries 등을 계산.
 *
 * 제공 값:
 *  - homeQuery / homeSortKey / homeSortDir + setters
 *  - filterTier / filterPlatform / filterGenre / filterStatus + setters
 *  - searchIncludeTags / searchExcludeTags / searchExcludeStatus / searchExcludeWorkStatus + setters
 *  - searchTagModalOpen / searchTagModalMode + setters
 *  - rankQuery / rankTier + setters
 *  - bulkSortKey + setter
 *  - homeFiltered / bulkFiltered / rankedEntries (computed)
 *  - reviewCount / supplementList (computed)
 *  - resetFilters / toggleSortDir
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useData } from "./DataContext";
import { useApp } from "./AppContext";
import { deriveMajorGenre } from "../utils/helpers";
import { tierBadge } from "../components/common/ui";

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const { list } = useData();
  const { appSettings } = useApp();

  // ── 홈 검색/정렬 ──
  const [homeQuery, setHomeQuery] = useState("");
  const [homeSortKey, setHomeSortKey] = useState("rating");
  const [homeSortDir, setHomeSortDir] = useState("DESC");

  // ── 고급 필터 ──
  const [filterTier, setFilterTier] = useState("ALL");
  const [filterPlatform, setFilterPlatform] = useState("ALL");
  const [filterGenre, setFilterGenre] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ── 태그 검색 ──
  const [searchIncludeTags, setSearchIncludeTags] = useState([]);
  const [searchExcludeTags, setSearchExcludeTags] = useState([]);
  const [searchExcludeStatus, setSearchExcludeStatus] = useState([]);
  const [searchExcludeWorkStatus, setSearchExcludeWorkStatus] = useState([]);
  const [searchTagModalOpen, setSearchTagModalOpen] = useState(false);
  const [searchTagModalMode, setSearchTagModalMode] = useState("include");

  // ── 순위 ──
  const [rankQuery, setRankQuery] = useState("");
  const [rankTier, setRankTier] = useState("ALL");

  // ── 대량 편집 정렬 ──
  const [bulkSortKey, setBulkSortKey] = useState("rating");

  // ── 유틸 ──
  const resetFilters = useCallback(() => {
    setFilterTier("ALL"); setFilterPlatform("ALL");
    setFilterGenre("ALL"); setFilterStatus("ALL");
    setSearchIncludeTags([]); setSearchExcludeTags([]);
    setSearchExcludeStatus([]); setSearchExcludeWorkStatus([]);
  }, []);

  const toggleSortDir = useCallback(() => {
    setHomeSortDir((prev) => (prev === "DESC" ? "ASC" : "DESC"));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 계산된 값
  // ═══════════════════════════════════════════════════════════

  const homeFiltered = useMemo(() => {
    const q = (homeQuery || "").toLowerCase().trim();
    let result = [...(list || [])]; // [FIX v6.1.5] 원본 state 배열 직접 sort 방지 → 복사본 사용

    if (searchIncludeTags.length > 0) {
      result = result.filter((n) => {
        const nt = (n.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        return searchIncludeTags.every((tag) => nt.includes(tag.toLowerCase()));
      });
    }
    if (searchExcludeTags.length > 0) {
      result = result.filter((n) => {
        const nt = (n.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        return !searchExcludeTags.some((tag) => nt.includes(tag.toLowerCase()));
      });
    }
    if (q) {
      result = result.filter((n) => {
        const plats = safeParsePlats(n.platforms);
        return [n.title, n.author, n.tags, n.note, ...(plats || [])].join(" ").toLowerCase().includes(q);
      });
    }
    if (filterTier !== "ALL") result = result.filter((n) => tierBadge(n.rating).t === filterTier);
    if (filterPlatform !== "ALL") result = result.filter((n) => safeParsePlats(n.platforms).includes(filterPlatform));
    if (filterGenre !== "ALL") result = result.filter((n) => deriveMajorGenre(n.tags) === filterGenre);
    if (filterStatus !== "ALL") result = result.filter((n) => n.status === filterStatus);
    if (searchExcludeStatus.length > 0) result = result.filter((n) => !searchExcludeStatus.includes(n.status));
    if (searchExcludeWorkStatus.length > 0) result = result.filter((n) => !searchExcludeWorkStatus.includes(n.work_status));

    // ── 정렬 적용 ──
    const dir = homeSortDir === "ASC" ? 1 : -1;
    if (homeSortKey === "rating") {
      result.sort((a, b) => dir * (b.rating - a.rating));
    } else if (homeSortKey === "title") {
      result.sort((a, b) => dir * (a.title || "").localeCompare(b.title || ""));
    } else if (homeSortKey === "created") {
      result.sort((a, b) => dir * ((b.created_at || 0) - (a.created_at || 0)));
    } else if (homeSortKey === "read") {
      result.sort((a, b) => {
        const diff = (b.read_count || 0) - (a.read_count || 0);
        return dir * (diff !== 0 ? diff : b.rating - a.rating);
      });
    }

    return result;
  }, [list, homeQuery, homeSortKey, homeSortDir, searchIncludeTags, searchExcludeTags, filterTier, filterPlatform, filterGenre, filterStatus, searchExcludeStatus, searchExcludeWorkStatus]);

  const bulkFiltered = useMemo(() => {
    const result = [...(homeFiltered || [])];
    if (bulkSortKey === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (bulkSortKey === "title") result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (bulkSortKey === "created") result.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
    else if (bulkSortKey === "read") result.sort((a, b) => (b.read_count || 0) !== (a.read_count || 0) ? (b.read_count || 0) - (a.read_count || 0) : b.rating - a.rating);
    return result;
  }, [homeFiltered, bulkSortKey]);

  const rankedEntries = useMemo(() => {
    if (!list || list.length === 0) return [];
    const sorted = [...list].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if ((a.created_at || 0) !== (b.created_at || 0)) return (a.created_at || 0) - (b.created_at || 0);
      return (a.title || "").localeCompare(b.title || "");
    });
    const q = (rankQuery || "").toLowerCase().trim();
    let rank = 0;
    const result = [];
    for (const n of sorted) {
      rank++;
      const { t } = tierBadge(n.rating);
      if (rankTier !== "ALL" && t !== rankTier) continue;
      if (q) {
        const plats = safeParsePlats(n.platforms);
        if (![n.title, n.author, n.tags, n.note, ...(plats || [])].join(" ").toLowerCase().includes(q)) continue;
      }
      result.push({ item: n, rank, tier: t });
    }
    return result;
  }, [list, rankQuery, rankTier]);

  const reviewCount = useMemo(() => {
    return (list || []).filter((n) => {
      const rd = n.rd || 350;
      if (rd >= 200) return true;
      const { t } = tierBadge(n.rating);
      if (t === "C" && (n.match_count || 0) >= 5) return true;
      return false;
    }).length;
  }, [list]);

  const supplementList = useMemo(() => {
    const s = appSettings?.supplement || {};
    return (list || []).filter((n) => {
      // [FIX v6.1.3] 키 이름을 SupplementSettingsModal 저장 키와 일치시킴
      if (s.noAuthor && !(n.author || "").trim()) return true;
      if (s.noPlatform) { const p = safeParsePlats(n.platforms); if (!p || p.length === 0) return true; }
      if (s.noCover && !(n.cover_image || "").trim()) return true;
      if (s.noMajorGenre && !deriveMajorGenre(n.tags)) return true;
      if (s.noTotalEpisodes && !(n.total_episodes > 0)) return true;
      const minTags = s.minTags || 0;
      if (minTags > 0 && (n.tags || "").split(",").filter((t) => t.trim()).length < minTags) return true;
      const minRead = s.minReadCount || 0;
      if (minRead > 0 && (n.read_count || 0) < minRead) return true;
      return false;
    });
  }, [list, appSettings?.supplement]);

  const value = useMemo(() => ({
    homeQuery, setHomeQuery,
    homeSortKey, setHomeSortKey,
    homeSortDir, setHomeSortDir,
    filterTier, setFilterTier,
    filterPlatform, setFilterPlatform,
    filterGenre, setFilterGenre,
    filterStatus, setFilterStatus,
    searchIncludeTags, setSearchIncludeTags,
    searchExcludeTags, setSearchExcludeTags,
    searchExcludeStatus, setSearchExcludeStatus,
    searchExcludeWorkStatus, setSearchExcludeWorkStatus,
    searchTagModalOpen, setSearchTagModalOpen,
    searchTagModalMode, setSearchTagModalMode,
    rankQuery, setRankQuery,
    rankTier, setRankTier,
    bulkSortKey, setBulkSortKey,
    homeFiltered, bulkFiltered, rankedEntries,
    reviewCount, supplementList,
    resetFilters, toggleSortDir,
  }), [
    homeQuery, homeSortKey, homeSortDir,
    filterTier, filterPlatform, filterGenre, filterStatus,
    searchIncludeTags, searchExcludeTags, searchExcludeStatus, searchExcludeWorkStatus,
    searchTagModalOpen, searchTagModalMode,
    rankQuery, rankTier, bulkSortKey,
    homeFiltered, bulkFiltered, rankedEntries,
    reviewCount, supplementList,
    resetFilters, toggleSortDir,
  ]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within FilterProvider");
  return ctx;
}

// 유틸
function safeParsePlats(platforms) {
  if (!platforms) return [];
  try { const a = JSON.parse(platforms); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
