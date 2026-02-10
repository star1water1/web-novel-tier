/**
 * 태그 관리 모달 (v6.0)
 * @module components/modals/TagManagerModal
 * 
 * @bugfix v6.1.4
 * - [FIX] getTagSentiment import 누락 → 태그 감정 평가 시 ReferenceError 크래시
 * - [FIX] onCleanupDuplicates/onCleanupUnused에서 setCustomTags만 호출 → DB 미저장
 *   → setAppMeta("custom_tags", ...) 추가하여 앱 재시작 후에도 변경 유지
 *
 * @bugfix v6.1.6
 * - [FIX] 일괄 고정/숨김/속성변경: 루프 내 개별 save 호출 → stale closure로 마지막 태그만 저장
 *   → 전체 배열을 한 번에 구축 후 save 1회 호출로 변경
 *
 * @bugfix v6.1.7
 * - [FIX] 일괄 삭제: 루프 내 removeCustomTag/removeComboTag 개별 호출 → stale closure로 DB에 마지막 삭제만 반영
 *   → 타입별 분류 후 최종 배열 계산, setState + setAppMeta 각 1회 호출
 *
 * @source_origin 원본 App.jsx 9066-10404줄 (1,339줄 전체)
 * 
 * @description
 * 커스텀 태그, 조합 태그, 태그 관계 그룹을 관리하는 모달
 * 
 * 탭 구조:
 * 1. 커스텀 탭 - 사용자 정의 태그 추가/삭제
 * 2. 조합 탭 - 여러 태그를 묶은 조합 태그 관리
 * 3. 관계 탭 - 유사/상반 태그 그룹 관리
 * 4. 숨김 탭 - 태그 숨김/표시 설정
 * 5. 고정 탭 - 자주 쓰는 태그 상단 고정
 * 
 * @props
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - customTags: 커스텀 태그 배열
 * - comboTags: 조합 태그 배열
 * - userMajorGenres: 사용자 추가 대장르
 * - userSubGenres: 사용자 추가 부장르
 * - tagRelationGroups: 태그 관계 그룹
 * - hiddenTags: 숨김 태그 배열
 * - pinnedTags: 고정 태그 배열
 * - onAddCustomTag: 커스텀 태그 추가
 * - onRemoveCustomTag: 커스텀 태그 삭제
 * - onAddComboTag: 조합 태그 추가
 * - onRemoveComboTag: 조합 태그 삭제
 * - onAddUserMajor: 사용자 대장르 추가
 * - onAddUserSub: 사용자 부장르 추가
 * - onToggleHiddenTag: 태그 숨김 토글
 * - onTogglePinnedTag: 태그 고정 토글
 * - onUpdateTagRelations: 태그 관계 업데이트
 * - theme: 테마 객체
 */

import React, { memo, useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, SafeAreaView } from "react-native";

// Constants
import { MAJOR_GENRES, SUB_GENRES, GENERAL_TAGS, getTagSentiment } from "../../constants/tags";

// Database (for direct meta persist)
import { setAppMeta } from "../../database";

// Context
import { useApp } from "../../contexts/AppContext";
import { useTag } from "../../contexts/TagContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 TagManagerModal 컴포넌트
// ═══════════════════════════════════════════════════════════════

const TagManagerModal = memo(() => {
  // Context 직접 소비
  const { theme } = useApp();
  const tagCtx = useTag();
  const { list } = useData();
  const { tagManagerOpen: visible, setTagManagerOpen } = useModal();
  const C = theme;
  const onClose = useCallback(() => setTagManagerOpen(false), [setTagManagerOpen]);

  // Context → 어댑터 변수 매핑 (기존 JSX 호환)
  const customTags = tagCtx.customTags || [];
  const comboTags = tagCtx.comboTags || [];
  const userMajorGenres = tagCtx.userMajorGenres || [];
  const userSubGenres = tagCtx.userSubGenres || [];
  const pinnedTags = tagCtx.pinnedTags || [];
  const hiddenTags = tagCtx.hiddenTags || [];
  const sentiments = tagCtx.tagSentiments || {};
  const tagAttributes = {};

  // 어댑터 콜백 (기존 prop 인터페이스 호환)
  const onTogglePin = useCallback((tag) => {
    const next = pinnedTags.includes(tag) ? pinnedTags.filter(t => t !== tag) : [...pinnedTags, tag];
    tagCtx.savePinnedTags(next);
  }, [pinnedTags, tagCtx]);

  const onToggleHide = useCallback((tag) => {
    const next = hiddenTags.includes(tag) ? hiddenTags.filter(t => t !== tag) : [...hiddenTags, tag];
    tagCtx.saveHiddenTags(next);
  }, [hiddenTags, tagCtx]);

  const onPromoteToMajor = useCallback((tag) => {
    tagCtx.setUserMajorGenres([...(tagCtx.userMajorGenres || []), tag]);
  }, [tagCtx]);

  const onPromoteToSub = useCallback((tag) => {
    tagCtx.setUserSubGenres([...(tagCtx.userSubGenres || []), tag]);
  }, [tagCtx]);

  const onDemoteToCustom = useCallback((tag, fromType) => {
    if (fromType === "userMajor") tagCtx.setUserMajorGenres((tagCtx.userMajorGenres || []).filter(t => t !== tag));
    else if (fromType === "userSub") tagCtx.setUserSubGenres((tagCtx.userSubGenres || []).filter(t => t !== tag));
  }, [tagCtx]);

  const onComboToCustom = useCallback((tag) => {
    tagCtx.removeComboTag(tag); tagCtx.addCustomTag(tag);
  }, [tagCtx]);

  // [FIX v6.1.7] userMajor/userSub 타입 추가 (기존: custom/combo만 처리 → 사용자 장르 삭제 불가)
  const onDeleteTag = useCallback((tag, type) => {
    if (type === "custom") tagCtx.removeCustomTag(tag);
    else if (type === "combo") tagCtx.removeComboTag(tag);
    else if (type === "userMajor") tagCtx.setUserMajorGenres((tagCtx.userMajorGenres || []).filter(t => t !== tag));
    else if (type === "userSub") tagCtx.setUserSubGenres((tagCtx.userSubGenres || []).filter(t => t !== tag));
  }, [tagCtx]);

  const onDeleteGlobally = useCallback((tag) => {
    tagCtx.removeCustomTag(tag);
  }, [tagCtx]);

  const onAddCustomTag = useCallback((tag) => {
    tagCtx.addCustomTag(tag);
  }, [tagCtx]);

  const onChangeSentiment = useCallback((tag, s) => {
    tagCtx.saveTagSentiments({ ...tagCtx.tagSentiments, [tag]: s });
  }, [tagCtx]);

  const onBatchChangeSentiment = useCallback((tags, s) => {
    const next = { ...tagCtx.tagSentiments };
    tags.forEach(tag => { next[tag] = s; });
    tagCtx.saveTagSentiments(next);
  }, [tagCtx]);

  const onToggleMajorAttr = useCallback(() => {}, []);
  const onToggleSubAttr = useCallback(() => {}, []);

  const checkIsMajor = useCallback((tag) => {
    return [...(MAJOR_GENRES || []), ...(userMajorGenres || [])].some(m => m.toLowerCase() === tag.toLowerCase());
  }, [userMajorGenres]);

  const checkIsSub = useCallback((tag) => {
    return [...(SUB_GENRES || []), ...(userSubGenres || [])].some(s => s.toLowerCase() === tag.toLowerCase());
  }, [userSubGenres]);

  const onCleanupDuplicates = useCallback(() => {
    const unique = [...new Set(customTags)];
    tagCtx.setCustomTags(unique);
    // [FIX v6.1.4] DB에도 저장 (setCustomTags는 state만 업데이트)
    setAppMeta("custom_tags", unique);
    Alert.alert("완료", `중복 ${customTags.length - unique.length}개 제거됨`);
  }, [customTags, tagCtx]);

  const findUnusedTags = useCallback(() => {
    const usedTags = new Set();
    (list || []).forEach(n => (n.tags || "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => usedTags.add(t)));
    return customTags.filter(t => !usedTags.has(t));
  }, [customTags, list]);

  const onCleanupUnused = useCallback(() => {
    const unused = findUnusedTags();
    if (unused.length === 0) { Alert.alert("알림", "미사용 태그가 없습니다."); return; }
    Alert.alert("확인", `미사용 태그 ${unused.length}개를 삭제할까요?\n\n${unused.slice(0, 10).join(", ")}${unused.length > 10 ? "..." : ""}`, [
      { text: "취소" },
      { text: "삭제", style: "destructive", onPress: () => {
        const filtered = customTags.filter(t => !unused.includes(t));
        tagCtx.setCustomTags(filtered);
        // [FIX v6.1.4] DB에도 저장
        setAppMeta("custom_tags", filtered);
      }},
    ]);
  }, [findUnusedTags, customTags, tagCtx]);
  const isDark = C.bg !== "#F5F7FB"; // 다크모드 감지
  const [activeTab, setActiveTab] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [selectedTag, setSelectedTag] = useState(null); // { tag, type }
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  
  // 🆕 대량 선택 모드
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState(new Set());
  
  // 🆕 v3.4: 고급 필터 상태
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sentiments: [], // [] = 전체, ["positive"], ["negative"], ["neutral"] 등 다중 선택
    attributes: [], // ["major"], ["sub"], ["combo"], ["custom"], ["default"]
    states: [],     // ["pinned"], ["hidden"], ["normal"]
    excludeAttrs: [], // 제외할 속성
  });
  
  // 🆕 v3.4: 태그가 대장르인지 확인
  const isTagMajorLocal = useCallback((tag) => {
    if (checkIsMajor) return checkIsMajor(tag);
    return MAJOR_GENRES.includes(tag) || userMajorGenres.includes(tag);
  }, [checkIsMajor, userMajorGenres]);
  
  // 🆕 v3.4: 태그가 부장르인지 확인  
  const isTagSubLocal = useCallback((tag) => {
    if (checkIsSub) return checkIsSub(tag);
    return SUB_GENRES.includes(tag) || userSubGenres.includes(tag);
  }, [checkIsSub, userSubGenres]);
  
  // 🆕 태그의 실제 sentiment 가져오기
  const getTagSentimentValue = useCallback((tag) => {
    return getTagSentiment(tag, sentiments);
  }, [sentiments]);
  
  // 🆕 모든 태그를 sentiment로 분류 (중복 제거, 타입 병합, 속성 포함)
  const allTagsWithSentiment = useMemo(() => {
    // 태그별 정보를 Map으로 관리 (중복 방지)
    const tagMap = new Map(); // tag -> { tag, types: Set, sentiment, category }
    
    const addTag = (tag, type, category = null) => {
      const existing = tagMap.get(tag);
      if (existing) {
        // 이미 있으면 타입만 추가
        existing.types.add(type);
        if (category) existing.categories.add(category);
      } else {
        // 새로 추가
        const sent = getTagSentimentValue(tag);
        tagMap.set(tag, {
          tag,
          types: new Set([type]),
          categories: category ? new Set([category]) : new Set(),
          sentiment: sent,
        });
      }
    };
    
    // 모든 태그 수집 (순서: 커스텀 > 조합 > 사용자장르 > 기본장르 > 일반)
    customTags.forEach(t => addTag(t, "custom"));
    comboTags.forEach(t => addTag(t, "combo"));
    userMajorGenres.forEach(t => addTag(t, "userMajor"));
    userSubGenres.forEach(t => addTag(t, "userSub"));
    MAJOR_GENRES.forEach(t => addTag(t, "defaultMajor"));
    SUB_GENRES.forEach(t => addTag(t, "defaultSub"));
    
    // 일반 태그들
    for (const [cat, tags] of Object.entries(GENERAL_TAGS)) {
      for (const tag of tags) {
        addTag(tag, "defaultGeneral", cat);
      }
    }
    
    // Map을 배열로 변환하면서 types를 우선순위에 따라 대표 type 결정
    const TYPE_PRIORITY = ["custom", "combo", "userMajor", "userSub", "defaultMajor", "defaultSub", "defaultGeneral"];
    
    return Array.from(tagMap.values()).map(item => {
      // 가장 우선순위 높은 타입을 대표 타입으로
      let primaryType = "defaultGeneral";
      for (const t of TYPE_PRIORITY) {
        if (item.types.has(t)) {
          primaryType = t;
          break;
        }
      }
      
      // 🆕 v3.4: 속성 정보 추가
      const isMajor = isTagMajorLocal(item.tag);
      const isSub = isTagSubLocal(item.tag);
      const isCombo = comboTags.includes(item.tag);
      const isCustom = customTags.includes(item.tag);
      const isPinned = pinnedTags.includes(item.tag);
      const isHidden = hiddenTags.includes(item.tag);
      
      return {
        tag: item.tag,
        type: primaryType,
        types: Array.from(item.types), // 모든 타입 (표시용)
        sentiment: item.sentiment,
        category: item.categories.size > 0 ? Array.from(item.categories)[0] : null,
        // 🆕 v3.4: 속성
        isMajor,
        isSub,
        isCombo,
        isCustom,
        isPinned,
        isHidden,
      };
    });
  }, [customTags, comboTags, userMajorGenres, userSubGenres, pinnedTags, hiddenTags, getTagSentimentValue, isTagMajorLocal, isTagSubLocal]);
  
  // 🆕 v3.4: 필터 적용 함수
  const applyFilters = useCallback((tags) => {
    return tags.filter(item => {
      // 1. 감정 필터
      if (filters.sentiments.length > 0) {
        const sentimentKey = item.sentiment === TAG_SENTIMENT.POSITIVE ? "positive" :
                            item.sentiment === TAG_SENTIMENT.NEGATIVE ? "negative" : "neutral";
        if (!filters.sentiments.includes(sentimentKey)) return false;
      }
      
      // 2. 속성 필터 (OR 조건)
      if (filters.attributes.length > 0) {
        const matchesAny = filters.attributes.some(attr => {
          switch (attr) {
            case "major": return item.isMajor;
            case "sub": return item.isSub;
            case "combo": return item.isCombo;
            case "custom": return item.isCustom;
            case "default": return !item.isCombo && !item.isCustom;
            default: return false;
          }
        });
        if (!matchesAny) return false;
      }
      
      // 3. 상태 필터
      if (filters.states.length > 0) {
        const matchesAny = filters.states.some(state => {
          switch (state) {
            case "pinned": return item.isPinned;
            case "hidden": return item.isHidden;
            case "normal": return !item.isPinned && !item.isHidden;
            default: return false;
          }
        });
        if (!matchesAny) return false;
      }
      
      // 4. 제외 속성 필터
      if (filters.excludeAttrs.length > 0) {
        const shouldExclude = filters.excludeAttrs.some(attr => {
          switch (attr) {
            case "major": return item.isMajor;
            case "sub": return item.isSub;
            case "combo": return item.isCombo;
            case "custom": return item.isCustom;
            case "pinned": return item.isPinned;
            case "hidden": return item.isHidden;
            default: return false;
          }
        });
        if (shouldExclude) return false;
      }
      
      return true;
    });
  }, [filters]);
  
  // 카테고리별 태그 데이터
  const categories = useMemo(() => {
    // 🆕 sentiment별 태그 필터링
    const positiveTags = allTagsWithSentiment.filter(t => t.sentiment === TAG_SENTIMENT.POSITIVE);
    const negativeTags = allTagsWithSentiment.filter(t => t.sentiment === TAG_SENTIMENT.NEGATIVE);
    const neutralTags = allTagsWithSentiment.filter(t => t.sentiment === TAG_SENTIMENT.NEUTRAL);
    
    return {
      all: {
        label: "🏷️ 전체",
        count: allTagsWithSentiment.length,
        tags: allTagsWithSentiment,
      },
      positive: {
        label: "👍 긍정",
        count: positiveTags.length,
        tags: positiveTags,
      },
      negative: {
        label: "👎 부정",
        count: negativeTags.length,
        tags: negativeTags,
      },
      neutral: {
        label: "⚖️ 중립",
        count: neutralTags.length,
        tags: neutralTags,
      },
      pinned: {
        label: "📌 고정",
        count: pinnedTags.length,
        tags: pinnedTags.map(t => {
          let type = "custom";
          if (comboTags.includes(t)) type = "combo";
          else if (userMajorGenres.includes(t)) type = "userMajor";
          else if (userSubGenres.includes(t)) type = "userSub";
          else if (MAJOR_GENRES.includes(t)) type = "defaultMajor";
          else if (SUB_GENRES.includes(t)) type = "defaultSub";
          return { tag: t, type, sentiment: getTagSentimentValue(t) };
        }),
      },
      custom: {
        label: "✏️ 커스텀",
        count: customTags.length,
        tags: customTags.map(t => ({ tag: t, type: "custom", sentiment: getTagSentimentValue(t) })),
      },
      combo: {
        label: "🔗 조합",
        count: comboTags.length,
        tags: comboTags.map(t => ({ tag: t, type: "combo", sentiment: getTagSentimentValue(t) })),
      },
      userMajor: {
        label: "내 대장르",
        count: userMajorGenres.length,
        tags: userMajorGenres.map(t => ({ tag: t, type: "userMajor", sentiment: getTagSentimentValue(t) })),
      },
      userSub: {
        label: "내 부장르",
        count: userSubGenres.length,
        tags: userSubGenres.map(t => ({ tag: t, type: "userSub", sentiment: getTagSentimentValue(t) })),
      },
      // 일반 태그 카테고리별
      ...Object.entries(GENERAL_TAGS).reduce((acc, [cat, tags]) => {
        acc[`general_${cat}`] = {
          label: cat.replace(/^[📖🎭📝⚡💕👤🏙️🔞⭐📅]\s?/, ""),
          count: tags.length,
          tags: tags.map(t => ({ tag: t, type: "defaultGeneral", sentiment: getTagSentimentValue(t) })),
          isGeneral: true,
        };
        return acc;
      }, {}),
    };
  }, [customTags, comboTags, userMajorGenres, userSubGenres, pinnedTags, allTagsWithSentiment, getTagSentimentValue]);
  
  // 현재 탭의 태그들 (검색 + 고급 필터 적용)
  const currentTags = useMemo(() => {
    const cat = categories[activeTab];
    if (!cat) return [];
    
    // 1. 카테고리 태그 가져오기
    let tags = cat.tags;
    
    // 2. 텍스트 검색 필터
    const q = searchQ.toLowerCase().trim();
    if (q) {
      tags = tags.filter(item => item.tag.toLowerCase().includes(q));
    }
    
    // 3. 🆕 v3.4: 고급 필터 적용 (필터가 설정된 경우에만)
    const hasFilters = filters.sentiments.length > 0 || 
                       filters.attributes.length > 0 || 
                       filters.states.length > 0 || 
                       filters.excludeAttrs.length > 0;
    
    if (hasFilters) {
      // 기존 tags에 속성 정보 보강
      const enrichedTags = tags.map(item => {
        const fullInfo = allTagsWithSentiment.find(t => t.tag === item.tag);
        return fullInfo || { 
          ...item, 
          isMajor: isTagMajorLocal(item.tag),
          isSub: isTagSubLocal(item.tag),
          isCombo: comboTags.includes(item.tag),
          isCustom: customTags.includes(item.tag),
          isPinned: pinnedTags.includes(item.tag),
          isHidden: hiddenTags.includes(item.tag),
        };
      });
      tags = applyFilters(enrichedTags);
    }
    
    return tags;
  }, [activeTab, categories, searchQ, filters, allTagsWithSentiment, applyFilters, isTagMajorLocal, isTagSubLocal, comboTags, customTags, pinnedTags, hiddenTags]);
  
  // 탭 목록
  const tabs = useMemo(() => {
    const main = [
      { key: "all", label: "전체", count: categories.all?.count || 0 },
      { key: "positive", label: "👍 긍정", count: categories.positive?.count || 0 },
      { key: "negative", label: "👎 부정", count: categories.negative?.count || 0 },
      { key: "neutral", label: "⚖️ 중립", count: categories.neutral?.count || 0 },
      { key: "pinned", label: "📌 고정", count: pinnedTags.length },
      { key: "custom", label: "커스텀", count: customTags.length },
      { key: "combo", label: "조합", count: comboTags.length },
    ];
    
    // 일반 태그 카테고리들 (축약)
    const generalTabs = Object.keys(GENERAL_TAGS).slice(0, 5).map(cat => ({
      key: `general_${cat}`,
      label: cat.replace(/^[📖🎭📝⚡💕👤🏙️🔞⭐📅]\s?/, "").slice(0, 4),
      count: GENERAL_TAGS[cat].length,
      isGeneral: true,
    }));
    
    return [...main, ...generalTabs];
  }, [pinnedTags.length, customTags.length, comboTags.length, categories]);
  
  const handleTagPress = (tag, type) => {
    if (selectMode) {
      // 대량 선택 모드
      setSelectedTags(prev => {
        const next = new Set(prev);
        if (next.has(tag)) {
          next.delete(tag);
        } else {
          next.add(tag);
        }
        return next;
      });
    } else {
      setSelectedTag({ tag, type });
      setActionModalOpen(true);
    }
  };
  
  const handleTagLongPress = (tag, type) => {
    if (!selectMode) {
      setSelectMode(true);
      setSelectedTags(new Set([tag]));
    }
  };
  
  const handleAddCustomTag = () => {
    const t = newTagInput.trim();
    if (!t) return;
    onAddCustomTag(t);
    setNewTagInput("");
  };
  
  // 🆕 일괄 속성 변경
  const handleBatchSentimentChange = (newSentiment) => {
    if (selectedTags.size === 0) return;
    if (onBatchChangeSentiment) {
      onBatchChangeSentiment(Array.from(selectedTags), newSentiment);
    }
    setSelectedTags(new Set());
    setSelectMode(false);
  };
  
  // 🆕 일괄 속성 토글 (대장르/부장르 속성 추가/제거)
  // [FIX v6.1.6] 루프 내 onPromoteToMajor/onDemoteToCustom 개별 호출 → stale closure
  //   → 전체 배열을 한 번에 구축 후 save 1회 호출
  const handleBatchToggleAttribute = (attrType) => {
    if (selectedTags.size === 0) return;
    const tags = Array.from(selectedTags);
    
    const checkHasAttr = (tag) => {
      if (attrType === "major") {
        return userMajorGenres.includes(tag) || MAJOR_GENRES.includes(tag);
      } else if (attrType === "sub") {
        return userSubGenres.includes(tag) || SUB_GENRES.includes(tag);
      }
      return false;
    };
    
    const anyWithoutAttr = tags.some(t => !checkHasAttr(t));
    const attrLabel = attrType === "major" ? "대장르" : "부장르";
    const action = anyWithoutAttr ? "추가" : "제거";
    
    Alert.alert(
      `${attrLabel} 속성 ${action}`,
      `선택한 ${tags.length}개 태그에 ${attrLabel} 속성을 ${action}할까요?\n\n※ 태그는 여러 속성을 동시에 가질 수 있습니다.`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: action,
          onPress: () => {
            if (attrType === "major") {
              let next = [...(userMajorGenres || [])];
              if (anyWithoutAttr) {
                for (const tag of tags) {
                  if (!checkHasAttr(tag) && !next.includes(tag)) next.push(tag);
                }
              } else {
                next = next.filter(t => !tags.includes(t));
              }
              tagCtx.setUserMajorGenres(next);
            } else if (attrType === "sub") {
              let next = [...(userSubGenres || [])];
              if (anyWithoutAttr) {
                for (const tag of tags) {
                  if (!checkHasAttr(tag) && !next.includes(tag)) next.push(tag);
                }
              } else {
                next = next.filter(t => !tags.includes(t));
              }
              tagCtx.setUserSubGenres(next);
            }
            setSelectedTags(new Set());
            setSelectMode(false);
          }
        }
      ]
    );
  };
  
  // 🆕 일괄 고정 토글
  // [FIX v6.1.6] 루프 내 onTogglePin 개별 호출 → stale closure로 마지막 태그만 저장
  //   → 전체 배열을 한 번에 구축 후 savePinnedTags 1회 호출
  const handleBatchTogglePin = () => {
    if (selectedTags.size === 0) return;
    const tags = Array.from(selectedTags);
    const anyNotPinned = tags.some(t => !pinnedTags.includes(t));
    
    Alert.alert(
      anyNotPinned ? "태그 고정" : "고정 해제",
      `선택한 ${tags.length}개 태그를 ${anyNotPinned ? "고정" : "고정 해제"}할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: anyNotPinned ? "고정" : "해제",
          onPress: () => {
            let next = [...pinnedTags];
            if (anyNotPinned) {
              // 고정 안 된 태그만 추가
              for (const tag of tags) {
                if (!next.includes(tag)) next.push(tag);
              }
            } else {
              // 모두 해제
              next = next.filter(t => !tags.includes(t));
            }
            tagCtx.savePinnedTags(next);
            setSelectedTags(new Set());
            setSelectMode(false);
          }
        }
      ]
    );
  };
  
  // 🆕 일괄 숨김 토글
  // [FIX v6.1.6] 루프 내 onToggleHide 개별 호출 → stale closure로 마지막 태그만 저장
  const handleBatchToggleHide = () => {
    if (selectedTags.size === 0) return;
    const tags = Array.from(selectedTags);
    const anyNotHidden = tags.some(t => !hiddenTags.includes(t));
    
    Alert.alert(
      anyNotHidden ? "태그 숨김" : "숨김 해제",
      `선택한 ${tags.length}개 태그를 ${anyNotHidden ? "숨김" : "숨김 해제"}할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: anyNotHidden ? "숨김" : "해제",
          onPress: () => {
            let next = [...hiddenTags];
            if (anyNotHidden) {
              for (const tag of tags) {
                if (!next.includes(tag)) next.push(tag);
              }
            } else {
              next = next.filter(t => !tags.includes(t));
            }
            tagCtx.saveHiddenTags(next);
            setSelectedTags(new Set());
            setSelectMode(false);
          }
        }
      ]
    );
  };
  
  // 🆕 일괄 삭제
  // [FIX v6.1.7] 루프 내 onDeleteTag 개별 호출 → stale closure로 마지막 삭제만 DB 반영
  //   → 타입별로 분류 후 최종 배열 계산, setState + setAppMeta 각 1회 호출
  const handleBatchDelete = () => {
    if (selectedTags.size === 0) return;
    const tags = Array.from(selectedTags);
    
    Alert.alert(
      "태그 삭제",
      `선택한 ${tags.length}개 태그를 삭제할까요?\n(커스텀/조합/사용자 장르만 삭제 가능)`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            // 타입별 분류
            const customToDelete = new Set();
            const comboToDelete = new Set();
            const userMajorToDelete = new Set();
            const userSubToDelete = new Set();
            
            for (const tag of tags) {
              if (customTags.includes(tag)) customToDelete.add(tag);
              else if (comboTags.includes(tag)) comboToDelete.add(tag);
              else if (userMajorGenres.includes(tag)) userMajorToDelete.add(tag);
              else if (userSubGenres.includes(tag)) userSubToDelete.add(tag);
            }
            
            // 타입별 배치 삭제 (각각 state + DB 1회 저장)
            if (customToDelete.size > 0) {
              const next = (customTags || []).filter(t => !customToDelete.has(t));
              tagCtx.setCustomTags(next);
              await setAppMeta("custom_tags", next);
            }
            if (comboToDelete.size > 0) {
              const next = (comboTags || []).filter(t => !comboToDelete.has(t));
              tagCtx.setComboTags(next);
              await setAppMeta("combo_tags", next);
            }
            if (userMajorToDelete.size > 0) {
              const next = (userMajorGenres || []).filter(t => !userMajorToDelete.has(t));
              tagCtx.setUserMajorGenres(next); // saveUserMajorGenres: state + DB 동시
            }
            if (userSubToDelete.size > 0) {
              const next = (userSubGenres || []).filter(t => !userSubToDelete.has(t));
              tagCtx.setUserSubGenres(next); // saveUserSubGenres: state + DB 동시
            }
            
            setSelectedTags(new Set());
            setSelectMode(false);
          }
        }
      ]
    );
  };
  
  // 🆕 선택 모드 종료
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedTags(new Set());
  };
  
  // 🆕 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedTags.size === currentTags.length) {
      setSelectedTags(new Set());
    } else {
      setSelectedTags(new Set(currentTags.map(t => t.tag)));
    }
  };
  
  const renderTagItem = useCallback(({ item }) => (
    <TagItem
      tag={item.tag}
      type={item.type}
      types={item.types} // 🆕 복수 타입
      isPinned={pinnedTags.includes(item.tag)}
      isHidden={hiddenTags.includes(item.tag)}
      sentiment={item.sentiment}
      isSelected={selectedTags.has(item.tag)}
      onPress={handleTagPress}
      onLongPress={handleTagLongPress}
      theme={C}
    />
  ), [pinnedTags, hiddenTags, selectedTags, C, selectMode]);
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* 헤더 */}
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: C.line,
          backgroundColor: C.card,
        }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: C.text }}>🏷️ 태그 관리 v3.0</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 28, color: C.sub }}>×</Text>
          </TouchableOpacity>
        </View>
        
        {/* 🆕 대량 선택 모드 바 */}
        {selectMode && (
          <View style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "space-between",
            padding: 12, 
            backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#3b82f6" : "#93c5fd",
          }}>
            <Text style={{ color: isDark ? "#93c5fd" : "#1e40af", fontWeight: "700" }}>
              {selectedTags.size}개 선택됨
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity 
                onPress={toggleSelectAll}
                style={{ backgroundColor: isDark ? C.card : "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              >
                <Text style={{ color: isDark ? C.text : "#1e40af", fontWeight: "600", fontSize: 12 }}>
                  {selectedTags.size === currentTags.length ? "전체 해제" : "전체 선택"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={exitSelectMode}
                style={{ backgroundColor: isDark ? C.card : "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
              >
                <Text style={{ color: "#dc2626", fontWeight: "600", fontSize: 12 }}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* 🆕 대량 선택 시 작업 패널 (확장) */}
        {selectMode && selectedTags.size > 0 && (
          <View style={{ backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.line }}>
            {/* 감정 변경 */}
            <View style={{ 
              flexDirection: "row", 
              padding: 10, 
              gap: 6, 
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}>
              <Text style={{ color: C.sub, fontSize: 12, alignSelf: "center", marginRight: 4 }}>감정:</Text>
              <TouchableOpacity
                onPress={() => handleBatchSentimentChange(TAG_SENTIMENT.POSITIVE)}
                style={{ flex: 1, backgroundColor: isDark ? "#14532d" : "#dcfce7", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#86efac" : "#166534", fontWeight: "700", fontSize: 12 }}>👍 긍정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBatchSentimentChange(TAG_SENTIMENT.NEGATIVE)}
                style={{ flex: 1, backgroundColor: isDark ? "#7f1d1d" : "#fee2e2", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#fca5a5" : "#991b1b", fontWeight: "700", fontSize: 12 }}>👎 부정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBatchSentimentChange(TAG_SENTIMENT.NEUTRAL)}
                style={{ flex: 1, backgroundColor: isDark ? "#374151" : "#f3f4f6", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#d1d5db" : "#374151", fontWeight: "700", fontSize: 12 }}>⚖️ 중립</Text>
              </TouchableOpacity>
            </View>
            
            {/* 분류 속성 부여 */}
            <View style={{ 
              flexDirection: "row", 
              padding: 10, 
              gap: 6, 
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}>
              <Text style={{ color: C.sub, fontSize: 12, alignSelf: "center", marginRight: 4 }}>속성:</Text>
              <TouchableOpacity
                onPress={() => handleBatchToggleAttribute("major")}
                style={{ flex: 1, backgroundColor: isDark ? "#065f46" : "#d1fae5", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#6ee7b7" : "#065f46", fontWeight: "700", fontSize: 11 }}>🏷️ 대장르</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBatchToggleAttribute("sub")}
                style={{ flex: 1, backgroundColor: isDark ? "#1e3a8a" : "#dbeafe", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#93c5fd" : "#1e3a8a", fontWeight: "700", fontSize: 11 }}>🔖 부장르</Text>
              </TouchableOpacity>
            </View>
            
            {/* 기타 작업 */}
            <View style={{ 
              flexDirection: "row", 
              padding: 10, 
              gap: 6,
            }}>
              <TouchableOpacity
                onPress={handleBatchTogglePin}
                style={{ flex: 1, backgroundColor: isDark ? "#713f12" : "#fef3c7", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#fcd34d" : "#92400e", fontWeight: "700", fontSize: 11 }}>📌 고정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBatchToggleHide}
                style={{ flex: 1, backgroundColor: isDark ? "#374151" : "#f3f4f6", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#9ca3af" : "#6b7280", fontWeight: "700", fontSize: 11 }}>👁️ 숨김</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBatchDelete}
                style={{ flex: 1, backgroundColor: isDark ? "#7f1d1d" : "#fee2e2", padding: 10, borderRadius: 8, alignItems: "center" }}
              >
                <Text style={{ color: isDark ? "#fca5a5" : "#dc2626", fontWeight: "700", fontSize: 11 }}>🗑️ 삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* 검색 + 고급 필터 */}
        {!selectMode && (
          <View style={{ backgroundColor: C.card }}>
            {/* 검색 바 */}
            <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
              <TextInput
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder="태그 검색..."
                placeholderTextColor={C.sub}
                style={{
                  flex: 1,
                  backgroundColor: C.bg,
                  borderRadius: 12,
                  padding: 12,
                  color: C.text,
                  fontSize: 15,
                }}
              />
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={{
                  backgroundColor: showFilters ? C.primary : C.bg,
                  borderRadius: 12,
                  padding: 12,
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16, color: showFilters ? "#fff" : C.text }}>🔍</Text>
              </TouchableOpacity>
            </View>
            
            {/* 🆕 v3.4: 고급 필터 패널 */}
            {showFilters && (
              <View style={{ 
                padding: 12, 
                borderTopWidth: 1, 
                borderTopColor: C.line,
                backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              }}>
                {/* 필터 헤더 */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontWeight: "800", color: C.text, fontSize: 14 }}>🔍 고급 필터</Text>
                  <TouchableOpacity onPress={() => setFilters({ sentiments: [], attributes: [], states: [], excludeAttrs: [] })}>
                    <Text style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}>초기화</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 감정 필터 */}
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 4 }}>감정 (다중 선택)</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {[
                    { key: "positive", label: "👍 긍정", color: "#22c55e" },
                    { key: "negative", label: "👎 부정", color: "#ef4444" },
                    { key: "neutral", label: "⚖️ 중립", color: "#6b7280" },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          sentiments: prev.sentiments.includes(opt.key)
                            ? prev.sentiments.filter(s => s !== opt.key)
                            : [...prev.sentiments, opt.key]
                        }));
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: filters.sentiments.includes(opt.key) ? opt.color : C.chip,
                        borderWidth: 1,
                        borderColor: filters.sentiments.includes(opt.key) ? opt.color : C.line,
                      }}
                    >
                      <Text style={{ 
                        color: filters.sentiments.includes(opt.key) ? "#fff" : C.text, 
                        fontWeight: "600", 
                        fontSize: 12 
                      }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 속성 필터 (포함) */}
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 4 }}>속성 포함 (OR 조건)</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {[
                    { key: "major", label: "🏷️ 대장르", color: "#f59e0b" },
                    { key: "sub", label: "🔖 부장르", color: "#8b5cf6" },
                    { key: "combo", label: "🔗 조합", color: "#3b82f6" },
                    { key: "custom", label: "✏️ 커스텀", color: "#10b981" },
                    { key: "default", label: "📚 기본", color: "#6b7280" },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          attributes: prev.attributes.includes(opt.key)
                            ? prev.attributes.filter(s => s !== opt.key)
                            : [...prev.attributes, opt.key]
                        }));
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: filters.attributes.includes(opt.key) ? opt.color : C.chip,
                        borderWidth: 1,
                        borderColor: filters.attributes.includes(opt.key) ? opt.color : C.line,
                      }}
                    >
                      <Text style={{ 
                        color: filters.attributes.includes(opt.key) ? "#fff" : C.text, 
                        fontWeight: "600", 
                        fontSize: 12 
                      }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 상태 필터 */}
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 4 }}>상태</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {[
                    { key: "pinned", label: "📌 고정됨", color: "#f59e0b" },
                    { key: "hidden", label: "🚫 숨김", color: "#6b7280" },
                    { key: "normal", label: "✅ 일반", color: "#22c55e" },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          states: prev.states.includes(opt.key)
                            ? prev.states.filter(s => s !== opt.key)
                            : [...prev.states, opt.key]
                        }));
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: filters.states.includes(opt.key) ? opt.color : C.chip,
                        borderWidth: 1,
                        borderColor: filters.states.includes(opt.key) ? opt.color : C.line,
                      }}
                    >
                      <Text style={{ 
                        color: filters.states.includes(opt.key) ? "#fff" : C.text, 
                        fontWeight: "600", 
                        fontSize: 12 
                      }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 제외 필터 */}
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 4 }}>제외할 속성</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { key: "major", label: "🏷️ 대장르 제외" },
                    { key: "sub", label: "🔖 부장르 제외" },
                    { key: "combo", label: "🔗 조합 제외" },
                    { key: "custom", label: "✏️ 커스텀 제외" },
                    { key: "pinned", label: "📌 고정 제외" },
                    { key: "hidden", label: "🚫 숨김 제외" },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          excludeAttrs: prev.excludeAttrs.includes(opt.key)
                            ? prev.excludeAttrs.filter(s => s !== opt.key)
                            : [...prev.excludeAttrs, opt.key]
                        }));
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: filters.excludeAttrs.includes(opt.key) ? "#dc2626" : C.chip,
                        borderWidth: 1,
                        borderColor: filters.excludeAttrs.includes(opt.key) ? "#dc2626" : C.line,
                      }}
                    >
                      <Text style={{ 
                        color: filters.excludeAttrs.includes(opt.key) ? "#fff" : C.text, 
                        fontWeight: "600", 
                        fontSize: 12 
                      }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 활성 필터 요약 */}
                {(filters.sentiments.length > 0 || filters.attributes.length > 0 || filters.states.length > 0 || filters.excludeAttrs.length > 0) && (
                  <View style={{ marginTop: 10, padding: 8, backgroundColor: isDark ? "#334155" : "#e2e8f0", borderRadius: 8 }}>
                    <Text style={{ color: C.text, fontSize: 11 }}>
                      필터 적용 중: {currentTags.length}개 결과
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* 탭 (가로 스크롤) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 50, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.line }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: activeTab === tab.key ? C.primary : C.chip,
                marginRight: 8,
              }}
            >
              <Text style={{ 
                color: activeTab === tab.key ? "#fff" : C.text,
                fontWeight: "700",
                fontSize: 12,
              }}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* 유틸리티 버튼 (고정 탭일 때만) */}
        {activeTab === "pinned" && !selectMode && (
          <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: C.card }}>
            <TouchableOpacity
              onPress={onCleanupDuplicates}
              style={{ flex: 1, backgroundColor: C.chip, padding: 10, borderRadius: 10, alignItems: "center" }}
            >
              <Text style={{ color: C.text, fontWeight: "600", fontSize: 12 }}>🔄 중복 정리</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCleanupUnused}
              style={{ flex: 1, backgroundColor: "#fee2e2", padding: 10, borderRadius: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#dc2626", fontWeight: "600", fontSize: 12 }}>🗑️ 미사용 정리</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* 커스텀 태그 추가 (커스텀 탭일 때만) */}
        {activeTab === "custom" && !selectMode && (
          <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: C.card }}>
            <TextInput
              value={newTagInput}
              onChangeText={setNewTagInput}
              placeholder="새 태그 입력..."
              placeholderTextColor={C.sub}
              style={{
                flex: 1,
                backgroundColor: C.bg,
                borderRadius: 10,
                padding: 10,
                color: C.text,
              }}
            />
            <TouchableOpacity
              onPress={handleAddCustomTag}
              style={{ backgroundColor: C.primary, paddingHorizontal: 16, borderRadius: 10, justifyContent: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>추가</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* 태그 리스트 */}
        <View style={{ flex: 1, padding: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {currentTags.length}개 태그 · {selectMode ? "태그를 눌러 선택" : "태그를 눌러 관리 · 길게 눌러 다중 선택"}
            </Text>
            {!selectMode && (
              <TouchableOpacity onPress={() => setSelectMode(true)}>
                <Text style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}>다중 선택</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {currentTags.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: C.sub, fontSize: 16 }}>
                {searchQ ? "검색 결과가 없습니다" : "태그가 없습니다"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={currentTags}
              renderItem={renderTagItem}
              keyExtractor={(item, index) => `${item.tag}-${index}`}
              numColumns={1}
              contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap" }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            />
          )}
        </View>
        
        {/* 통계 */}
        <View style={{ padding: 12, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line }}>
          <Text style={{ color: C.sub, fontSize: 11, textAlign: "center" }}>
            👍 {categories.positive?.count || 0} · 👎 {categories.negative?.count || 0} · ⚖️ {categories.neutral?.count || 0} · 
            커스텀 {customTags.length} · 조합 {comboTags.length}
          </Text>
        </View>
        
        {/* 태그 액션 모달 */}
        <Modal
          visible={actionModalOpen}
          animationType="fade"
          onRequestClose={() => setActionModalOpen(false)}
          transparent
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity 
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} 
              activeOpacity={1} 
              onPress={() => setActionModalOpen(false)}
            />
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, width: "85%", maxWidth: 400 }}>
              {selectedTag && (
                <ScrollView style={{ maxHeight: 500 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 4 }}>
                    {selectedTag.tag}
                  </Text>
                  <Text style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
                    분류: {
                      selectedTag.type === "custom" ? "커스텀 태그" :
                      selectedTag.type === "combo" ? "조합식 태그" :
                      selectedTag.type === "userMajor" ? "내 대장르" :
                      selectedTag.type === "userSub" ? "내 부장르" :
                      selectedTag.type === "defaultMajor" ? "기본 대장르" :
                      selectedTag.type === "defaultSub" ? "기본 부장르" :
                      "기본 일반 태그"
                    } · 속성: {
                      getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.POSITIVE ? "👍 긍정" :
                      getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.NEGATIVE ? "👎 부정" :
                      "⚖️ 중립"
                    }
                  </Text>
                  
                  <View style={{ gap: 8 }}>
                    {/* 🆕 속성 변경 섹션 */}
                    <Text style={{ fontWeight: "700", color: C.text, marginTop: 8, marginBottom: 4 }}>속성 변경</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          onChangeSentiment && onChangeSentiment(selectedTag.tag, TAG_SENTIMENT.POSITIVE);
                          setActionModalOpen(false);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.POSITIVE ? "#86efac" : "#dcfce7",
                          padding: 12,
                          borderRadius: 10,
                          alignItems: "center",
                          borderWidth: getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.POSITIVE ? 2 : 0,
                          borderColor: "#22c55e",
                        }}
                      >
                        <Text style={{ color: "#166534", fontWeight: "700" }}>👍 긍정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          onChangeSentiment && onChangeSentiment(selectedTag.tag, TAG_SENTIMENT.NEGATIVE);
                          setActionModalOpen(false);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.NEGATIVE ? "#fca5a5" : "#fee2e2",
                          padding: 12,
                          borderRadius: 10,
                          alignItems: "center",
                          borderWidth: getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.NEGATIVE ? 2 : 0,
                          borderColor: "#ef4444",
                        }}
                      >
                        <Text style={{ color: "#991b1b", fontWeight: "700" }}>👎 부정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          onChangeSentiment && onChangeSentiment(selectedTag.tag, TAG_SENTIMENT.NEUTRAL);
                          setActionModalOpen(false);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.NEUTRAL ? "#d1d5db" : "#f3f4f6",
                          padding: 12,
                          borderRadius: 10,
                          alignItems: "center",
                          borderWidth: getTagSentimentValue(selectedTag.tag) === TAG_SENTIMENT.NEUTRAL ? 2 : 0,
                          borderColor: "#9ca3af",
                        }}
                      >
                        <Text style={{ color: "#374151", fontWeight: "700" }}>⚖️ 중립</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* 기타 액션들 */}
                    <Text style={{ fontWeight: "700", color: C.text, marginTop: 12, marginBottom: 4 }}>태그 관리</Text>
                    
                    {/* 상단 고정 */}
                    <TouchableOpacity
                      onPress={() => {
                        onTogglePin(selectedTag.tag);
                        setActionModalOpen(false);
                      }}
                      style={{
                        backgroundColor: pinnedTags.includes(selectedTag.tag) ? "#fef3c7" : C.chip,
                        padding: 14,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 10 }}>📌</Text>
                      <Text style={{ fontWeight: "700", color: C.text }}>
                        {pinnedTags.includes(selectedTag.tag) ? "고정 해제" : "상단 고정"}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* 숨기기 (기본 태그용) */}
                    {(selectedTag.type === "defaultMajor" || selectedTag.type === "defaultSub" || selectedTag.type === "defaultGeneral") && (
                      <TouchableOpacity
                        onPress={() => {
                          onToggleHide(selectedTag.tag);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: hiddenTags.includes(selectedTag.tag) ? "#fee2e2" : C.chip,
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>🚫</Text>
                        <View>
                          <Text style={{ fontWeight: "700", color: C.text }}>
                            {hiddenTags.includes(selectedTag.tag) ? "숨김 해제" : "목록에서 숨기기"}
                          </Text>
                          <Text style={{ fontSize: 11, color: C.sub }}>태그 선택 모달에서 숨김</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    
                    {/* 🆕 v3.4: 대장르 속성 토글 (모든 태그에 적용 가능) */}
                    {onToggleMajorAttr && checkIsMajor && (
                      <TouchableOpacity
                        onPress={() => {
                          onToggleMajorAttr(selectedTag.tag);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: checkIsMajor(selectedTag.tag) ? "#fef3c7" : (isDark ? "#374151" : "#f3f4f6"),
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>
                          {checkIsMajor(selectedTag.tag) ? "🏷️" : "➕"}
                        </Text>
                        <View>
                          <Text style={{ fontWeight: "700", color: checkIsMajor(selectedTag.tag) ? "#92400e" : C.text }}>
                            {checkIsMajor(selectedTag.tag) ? "대장르 속성 제거" : "대장르 속성 추가"}
                          </Text>
                          <Text style={{ fontSize: 11, color: C.sub }}>
                            {checkIsMajor(selectedTag.tag) ? "대장르 → 일반 태그" : "분석 시 대장르로 분류"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    
                    {/* 🆕 v3.4: 부장르 속성 토글 (모든 태그에 적용 가능) */}
                    {onToggleSubAttr && checkIsSub && (
                      <TouchableOpacity
                        onPress={() => {
                          onToggleSubAttr(selectedTag.tag);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: checkIsSub(selectedTag.tag) ? "#e0e7ff" : (isDark ? "#374151" : "#f3f4f6"),
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>
                          {checkIsSub(selectedTag.tag) ? "🔖" : "➕"}
                        </Text>
                        <View>
                          <Text style={{ fontWeight: "700", color: checkIsSub(selectedTag.tag) ? "#3730a3" : C.text }}>
                            {checkIsSub(selectedTag.tag) ? "부장르 속성 제거" : "부장르 속성 추가"}
                          </Text>
                          <Text style={{ fontSize: 11, color: C.sub }}>
                            {checkIsSub(selectedTag.tag) ? "부장르 → 일반 태그" : "분석 시 부장르로 분류"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    
                    {/* 일반 태그로 변환 */}
                    {selectedTag.type === "combo" && (
                      <TouchableOpacity
                        onPress={() => {
                          onComboToCustom(selectedTag.tag);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: C.chip,
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>🔄</Text>
                        <Text style={{ fontWeight: "700", color: C.text }}>일반 태그로 변환</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* 장르 속성 제거 */}
                    {(selectedTag.type === "userMajor" || selectedTag.type === "userSub") && (
                      <TouchableOpacity
                        onPress={() => {
                          onDemoteToCustom(selectedTag.tag, selectedTag.type);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: C.chip,
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>✖️</Text>
                        <Text style={{ fontWeight: "700", color: C.text }}>장르 속성 제거</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* 삭제 (사용자 정의만) */}
                    {(selectedTag.type === "custom" || selectedTag.type === "combo" || 
                      selectedTag.type === "userMajor" || selectedTag.type === "userSub") && (
                      <TouchableOpacity
                        onPress={() => {
                          onDeleteTag(selectedTag.tag, selectedTag.type);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: "#fef2f2",
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>🗑️</Text>
                        <Text style={{ fontWeight: "700", color: "#dc2626" }}>태그 삭제</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* 전체에서 삭제 */}
                    {(selectedTag.type === "custom" || selectedTag.type === "combo" || 
                      selectedTag.type === "userMajor" || selectedTag.type === "userSub") && (
                      <TouchableOpacity
                        onPress={() => {
                          onDeleteGlobally(selectedTag.tag);
                          setActionModalOpen(false);
                        }}
                        style={{
                          backgroundColor: "#fee2e2",
                          padding: 14,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 10 }}>💥</Text>
                        <View>
                          <Text style={{ fontWeight: "700", color: "#dc2626" }}>전체에서 삭제</Text>
                          <Text style={{ fontSize: 11, color: C.sub }}>모든 작품에서도 제거</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => setActionModalOpen(false)}
                    style={{
                      marginTop: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: C.line,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: C.sub, fontWeight: "700" }}>닫기</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
});

export default TagManagerModal;
