/**
 * 모달 Context
 * @module contexts/ModalContext
 * @version 6.0
 *
 * @description
 * 모든 모달의 열림/닫힘 상태와 편집 폼 상태를 관리.
 * 여러 화면에서 모달을 열 수 있도록 openXxx() 함수 제공.
 *
 * 제공 값:
 *  - Edit modal: editOpen, editForm, openEdit(item), closeEdit, saveEdit
 *  - Log modal: logOpen, logTarget, openLogs(item), closeLogs
 *  - Compare: compareOpen, compareIds, openCompare(ids), closeCompare
 *  - Import/Export: importOpen/exportOpen + setters
 *  - TagSelect: tagSelectOpen, openTagSelect(callback, initialTags)
 *  - TagManager: tagManagerOpen + setter
 *  - PlannedEdit: plannedEditOpen, editingPlanned, openPlannedEdit(item)
 *  - CoverSelect: coverSelectOpen, coverSelectTarget, openCoverSelect(target)
 *  - UrlModal: urlOpen, openUrl(callback)
 *  - TagEdit: tagEditOpen, editingTag, openTagEdit(tag)
 *  - TagRelation: tagRelationOpen + setter
 *  - SupplementSettings: supplementSettingsOpen + setter
 *  - CoordManage: coordManageOpen + setter
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  // ── 편집 모달 + 폼 ──
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editCoverImage, setEditCoverImage] = useState("");
  const [editRating, setEditRating] = useState("");
  const [editStatus, setEditStatus] = useState("reading");
  const [editWorkStatus, setEditWorkStatus] = useState("ongoing");
  const [editGaidenStatus, setEditGaidenStatus] = useState("none");
  const [editGaidenReadCount, setEditGaidenReadCount] = useState("");
  const [editGaidenTotalEpisodes, setEditGaidenTotalEpisodes] = useState("");
  const [editRereadCount, setEditRereadCount] = useState("1");
  const [editMemorableQuote, setEditMemorableQuote] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editAwards, setEditAwards] = useState([]);
  const [awardYearInput, setAwardYearInput] = useState(String(new Date().getFullYear()));
  const [awardTypeInput, setAwardTypeInput] = useState("grand");

  const openEdit = useCallback((item) => {
    setEditItem(item);
    setEditCoverImage(item.cover_image || "");
    setEditRating(String(item.rating?.toFixed?.(1) || item.rating || "1500"));
    setEditStatus(item.status || "reading");
    setEditWorkStatus(item.work_status || "ongoing");
    setEditGaidenStatus(item.gaiden_status || "none");
    setEditGaidenReadCount(String(item.gaiden_read_count || ""));
    setEditGaidenTotalEpisodes(String(item.gaiden_total_episodes || ""));
    setEditRereadCount(String(item.reread_count || "1"));
    setEditMemorableQuote(item.memorable_quote || "");
    setEditLink(item.link || "");
    let awards = [];
    try {
      const raw = JSON.parse(item.awards || "[]");
      if (Array.isArray(raw)) awards = raw.filter((a) => a && a.year && a.type);
    } catch { awards = []; }
    setEditAwards(awards);
    setAwardYearInput(String(new Date().getFullYear()));
    setAwardTypeInput("grand");
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => { setEditOpen(false); setEditItem(null); }, []);

  const editForm = useMemo(() => ({
    editItem, setEditItem,
    editCoverImage, setEditCoverImage,
    editRating, setEditRating,
    editStatus, setEditStatus,
    editWorkStatus, setEditWorkStatus,
    editGaidenStatus, setEditGaidenStatus,
    editGaidenReadCount, setEditGaidenReadCount,
    editGaidenTotalEpisodes, setEditGaidenTotalEpisodes,
    editRereadCount, setEditRereadCount,
    editMemorableQuote, setEditMemorableQuote,
    editLink, setEditLink,
    editAwards, setEditAwards,
    awardYearInput, setAwardYearInput,
    awardTypeInput, setAwardTypeInput,
  }), [editItem, editCoverImage, editRating, editStatus, editWorkStatus,
       editGaidenStatus, editGaidenReadCount, editGaidenTotalEpisodes,
       editRereadCount, editMemorableQuote, editLink, editAwards,
       awardYearInput, awardTypeInput]);

  // ── 기록 모달 ──
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState(null);
  const openLogs = useCallback((item) => { setLogTarget(item); setLogOpen(true); }, []);
  const closeLogs = useCallback(() => { setLogOpen(false); setLogTarget(null); }, []);

  // ── 비교 모달 ──
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const openCompare = useCallback((ids) => { setCompareIds(ids); setCompareOpen(true); }, []);
  const closeCompare = useCallback(() => { setCompareOpen(false); setCompareIds([]); }, []);

  // ── Import/Export ──
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // ── 태그 선택 모달 ──
  const [tagSelectOpen, setTagSelectOpen] = useState(false);
  const [tagSelectCallback, setTagSelectCallback] = useState(null);
  const openTagSelect = useCallback((callback, initialTags = []) => {
    setTagSelectCallback(() => callback);
    setTagSelectOpen(true);
  }, []);
  const closeTagSelect = useCallback(() => { setTagSelectOpen(false); setTagSelectCallback(null); }, []);

  // ── 태그 매니저 ──
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  // ── 예정 작품 편집 ──
  const [plannedEditOpen, setPlannedEditOpen] = useState(false);
  const [editingPlanned, setEditingPlanned] = useState(null);
  const openPlannedEdit = useCallback((item) => { setEditingPlanned(item); setPlannedEditOpen(true); }, []);
  const closePlannedEdit = useCallback(() => { setPlannedEditOpen(false); setEditingPlanned(null); }, []);

  // ── 표지 선택 ──
  const [coverSelectOpen, setCoverSelectOpen] = useState(false);
  const [coverSelectTarget, setCoverSelectTarget] = useState(null); // "new" | "edit" | "planned" | "plannedEdit"
  const [coverSelectCallback, setCoverSelectCallback] = useState(null);
  const openCoverSelect = useCallback((target, callback = null) => {
    setCoverSelectTarget(target);
    if (callback) setCoverSelectCallback(() => callback);
    setCoverSelectOpen(true);
  }, []);
  const closeCoverSelect = useCallback(() => { setCoverSelectOpen(false); setCoverSelectTarget(null); setCoverSelectCallback(null); }, []);

  // ── URL 입력 모달 ──
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlCallback, setUrlCallback] = useState(null);
  const openUrl = useCallback((cb) => { setUrlCallback(() => cb); setUrlOpen(true); }, []);
  const closeUrl = useCallback(() => { setUrlOpen(false); setUrlCallback(null); }, []);

  // ── 태그 편집 ──
  const [tagEditOpen, setTagEditOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const openTagEdit = useCallback((tag) => { setEditingTag(tag); setTagEditOpen(true); }, []);
  const closeTagEdit = useCallback(() => { setTagEditOpen(false); setEditingTag(null); }, []);

  // ── 태그 관계 ──
  const [tagRelationOpen, setTagRelationOpen] = useState(false);

  // ── 보충 설정 ──
  const [supplementSettingsOpen, setSupplementSettingsOpen] = useState(false);

  // ── 좌표계 관리 ──
  const [coordManageOpen, setCoordManageOpen] = useState(false);

  const value = useMemo(() => ({
    // 편집
    editOpen, setEditOpen, editForm, openEdit, closeEdit,
    // 기록
    logOpen, setLogOpen, logTarget, openLogs, closeLogs,
    // 비교
    compareOpen, setCompareOpen, compareIds, openCompare, closeCompare,
    // Import/Export
    importOpen, setImportOpen, exportOpen, setExportOpen,
    // 태그 선택
    tagSelectOpen, setTagSelectOpen, tagSelectCallback, openTagSelect, closeTagSelect,
    // 태그 매니저
    tagManagerOpen, setTagManagerOpen,
    // 예정 편집
    plannedEditOpen, setPlannedEditOpen, editingPlanned, setEditingPlanned, openPlannedEdit, closePlannedEdit,
    // 표지
    coverSelectOpen, setCoverSelectOpen, coverSelectTarget, setCoverSelectTarget, coverSelectCallback, openCoverSelect, closeCoverSelect,
    // URL
    urlOpen, setUrlOpen, urlCallback, openUrl, closeUrl,
    // 태그 편집
    tagEditOpen, setTagEditOpen, editingTag, setEditingTag, openTagEdit, closeTagEdit,
    // 태그 관계
    tagRelationOpen, setTagRelationOpen,
    // 보충 설정
    supplementSettingsOpen, setSupplementSettingsOpen,
    // 좌표계
    coordManageOpen, setCoordManageOpen,
  }), [
    editOpen, editForm, logOpen, logTarget, compareOpen, compareIds,
    importOpen, exportOpen,
    tagSelectOpen, tagSelectCallback,
    tagManagerOpen,
    plannedEditOpen, editingPlanned,
    coverSelectOpen, coverSelectTarget,
    urlOpen, urlCallback,
    tagEditOpen, editingTag,
    tagRelationOpen, supplementSettingsOpen, coordManageOpen,
    openEdit, closeEdit, openLogs, closeLogs, openCompare, closeCompare,
    openTagSelect, closeTagSelect, openPlannedEdit, closePlannedEdit,
    openCoverSelect, closeCoverSelect, openUrl, closeUrl,
    openTagEdit, closeTagEdit,
  ]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
