/**
 * 태그 선택 모달 (v6.0)
 * @module components/modals/TagSelectModal
 * 
 * @source_origin 원본 App.jsx 6010-7346줄 (1,337줄 전체)
 * 
 * @bugfix v6.1.2
 * - [FIX] SENTIMENT_COLORS import 누락 → SentimentChip 렌더링 시 ReferenceError 수정
 * - [FIX] Chip, PrimaryButton, OutlineButton import 누락 → 장르/일반/조합 탭 크래시 수정
 * - [FIX] onConfirm이 selectedTags(일반태그)만 콜백에 전달 → 대장르/부장르 선택값 손실
 *   → 모든 선택(selectedMajor + selectedSub + selectedTags) 합쳐서 콜백 전달
 *
 * @description
 * 작품에 태그를 선택/지정하는 대형 모달 컴포넌트
 * 
 * 탭 구조:
 * 1. 장르 탭 - 대장르/부장르 선택
 * 2. 일반 탭 - 분위기/캐릭터/설정 등 일반 태그
 * 3. 평가 탭 - 감정별 태그 (긍정/중립/부정)
 * 4. 조합 탭 - 커스텀 조합 태그
 * 5. 농도 탭 - 태그별 강도 설정 (1-5)
 * 
 * 주요 기능:
 * - 사용 빈도 기반 태그 정렬
 * - 공동 출현 기반 태그 추천
 * - 빠른 입력 (쉼표 구분)
 * - 대량 선택 모드
 * - 태그 검색
 * - 최근 추가 태그 하이라이트
 * 
 * @props
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - onConfirm: 확인 콜백 (선택된 태그 전달)
 * - initialTags: 초기 선택 태그 배열
 * - initialMajor: 초기 대장르 배열
 * - initialSub: 초기 부장르 배열
 * - initialIntensities: 초기 태그 농도 객체
 * - customTags: 커스텀 태그 배열
 * - comboTags: 조합 태그 배열
 * - userMajorGenres: 사용자 추가 대장르
 * - userSubGenres: 사용자 추가 부장르
 * - tagUsageCounts: 태그 사용 횟수 객체
 * - tagCoOccurrences: 태그 공동 출현 통계
 * - tagSentiments: 태그 감정 매핑
 * - hiddenTags: 숨김 태그 배열
 * - pinnedTags: 고정 태그 배열
 * - onAddCustomTag: 커스텀 태그 추가 콜백
 * - theme: 테마 객체
 * 
 * @dependencies
 * - constants/tags: MAJOR_GENRES, SUB_GENRES, GENERAL_TAGS, TAG_SENTIMENT, normalizeTag
 * - utils/helpers: sortTagsByUsage
 */

import React, { memo, useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, FlatList } from "react-native";

// Constants
import { 
  MAJOR_GENRES, 
  SUB_GENRES, 
  GENERAL_TAGS, 
  TAG_SENTIMENT,
  normalizeTag,
  COMBO_TAG_TRAITS,
  COMBO_TAG_TARGETS,
  DEFAULT_TAG_SENTIMENTS,
  SENTIMENT_COLORS,
} from "../../constants/tags";

// Utils
import { sortTagsByUsage } from "../../utils/helpers";

// UI Components
import { Chip, PrimaryButton, OutlineButton } from "../common/ui";

// Context
import { useApp } from "../../contexts/AppContext";
import { useTag } from "../../contexts/TagContext";
import { useData } from "../../contexts/DataContext";
import { useModal } from "../../contexts/ModalContext";

// ═══════════════════════════════════════════════════════════════
// 📌 TagSelectModal 컴포넌트
// ═══════════════════════════════════════════════════════════════

const TagSelectModal = memo(() => {
  // Context 직접 소비
  const { theme } = useApp();
  const tagCtx = useTag();
  const { list } = useData();
  const { tagSelectOpen: visible, tagSelectCallback, closeTagSelect } = useModal();

  const onClose = closeTagSelect;
  // [FIX v6.1.3] 대장르/부장르/일반태그 모두 합쳐서 콜백 전달
  const onConfirm = useCallback(() => {
    if (tagSelectCallback) {
      const allSelected = [...selectedMajor, ...selectedSub, ...selectedTags];
      tagSelectCallback(allSelected);
    }
    closeTagSelect();
  }, [tagSelectCallback, closeTagSelect, selectedMajor, selectedSub, selectedTags]);

  // Context → 어댑터 매핑
  const customTags = tagCtx.customTags || [];
  const comboTags = tagCtx.comboTags || [];
  const userMajorGenres = tagCtx.userMajorGenres || [];
  const userSubGenres = tagCtx.userSubGenres || [];
  const pinnedTags = tagCtx.pinnedTags || [];
  const hiddenTags = tagCtx.hiddenTags || [];
  const tagSentiments = tagCtx.tagSentiments || {};
  const customComboTraits = tagCtx.customComboTraits || [];
  const customComboTargets = tagCtx.customComboTargets || [];

  // 초기값 (모달 오픈 시마다 리셋)
  const initialTags = tagCtx.selectedTags || [];
  const initialMajor = [];
  const initialSub = [];
  const initialTagData = [];
  const enableIntensity = false;

  // 사용 통계 계산
  const tagUsageCounts = useMemo(() => {
    const counts = {};
    (list || []).forEach(n => (n.tags || "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    }));
    return counts;
  }, [list]);

  const tagCoOccurrences = {};
  const tagRelationGroups = tagCtx.tagRelations?.groups || {};

  // 어댑터 콜백
  const onAddCustomTag = useCallback((tag) => tagCtx.addCustomTag(tag), [tagCtx]);
  const onAddComboTag = useCallback((tag) => tagCtx.addComboTag(tag), [tagCtx]);
  const onAddUserMajorGenre = useCallback((g) => tagCtx.setUserMajorGenres([...(tagCtx.userMajorGenres || []), g]), [tagCtx]);
  const onAddUserSubGenre = useCallback((g) => tagCtx.setUserSubGenres([...(tagCtx.userSubGenres || []), g]), [tagCtx]);
  const onSetTagSentiment = useCallback((tag, s) => tagCtx.saveTagSentiments({ ...tagCtx.tagSentiments, [tag]: s }), [tagCtx]);
  const onTogglePin = useCallback((tag) => {
    const next = pinnedTags.includes(tag) ? pinnedTags.filter(t => t !== tag) : [...pinnedTags, tag];
    tagCtx.savePinnedTags(next);
  }, [pinnedTags, tagCtx]);
  // 내부 상태 (App과 격리됨)
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [selectedMajor, setSelectedMajor] = useState(initialMajor);
  const [selectedSub, setSelectedSub] = useState(initialSub);
  const [customInput, setCustomInput] = useState("");
  const [newMajorInput, setNewMajorInput] = useState("");
  const [newSubInput, setNewSubInput] = useState("");
  
  // 🆕 v3.4: 태그 검색
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  
  // 🆕 v3.4.3: 빠른 입력 (쉼표 구분 다중 태그)
  const [quickInput, setQuickInput] = useState("");
  
  // 🆕 마지막으로 추가된 태그 (추천용)
  const [lastAddedTag, setLastAddedTag] = useState(null);
  
  // 🏷️ v5.0: 태그 농도 상태 {tag: intensity}
  const [tagIntensities, setTagIntensities] = useState({});
  // 🏷️ v5.0: 상세 모드 (농도 설정 UI 표시)
  const [detailMode, setDetailMode] = useState(enableIntensity);
  
  // 조합식 태그 생성용 상태
  const [comboTrait, setComboTrait] = useState("");
  const [comboTarget, setComboTarget] = useState("");
  
  // 🔗 v3.0.4: 기본 + 커스텀 조합 요소 합치기
  const allComboTraits = useMemo(() => {
    return [...COMBO_TAG_TRAITS, ...customComboTraits.filter(t => !COMBO_TAG_TRAITS.includes(t))];
  }, [customComboTraits]);
  
  const allComboTargets = useMemo(() => {
    return [...COMBO_TAG_TARGETS, ...customComboTargets.filter(t => !COMBO_TAG_TARGETS.includes(t))];
  }, [customComboTargets]);
  
  // 🆕 v2.8.1: 5탭 구조 (장르 / 일반 / 평가 / 조합 / 농도)
  const [activeTab, setActiveTab] = useState("genre");
  
  // 🎭 v2.8.1: 평가 탭 서브탭 (긍정/중립/부정)
  const [sentimentSubTab, setSentimentSubTab] = useState("positive");
  
  // 🎭 v2.8.1: 대량 선택 모드
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelectedTags, setBulkSelectedTags] = useState([]);

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (visible) {
      setSelectedTags(initialTags);
      setSelectedMajor(initialMajor);
      setSelectedSub(initialSub);
      setCustomInput("");
      setNewMajorInput("");
      setNewSubInput("");
      setComboTrait("");
      setComboTarget("");
      setBulkMode(false);
      setBulkSelectedTags([]);
      setDetailMode(enableIntensity);
      setLastAddedTag(null); // 🆕 마지막 추가 태그 리셋
      setTagSearchQuery(""); // 🆕 v3.4: 검색어 리셋
      setQuickInput(""); // 🆕 v3.4.3: 빠른 입력 리셋
      
      // 🏷️ v5.0: 농도 정보 초기화 (대장르/부장르 포함)
      const intensities = {};
      if (Array.isArray(initialTagData) && initialTagData.length > 0) {
        for (const td of initialTagData) {
          if (td && td.tag) {
            intensities[td.tag] = td.intensity || 3;
          }
        }
      }
      // 기존 태그 중 농도 정보 없는 것은 기본 3 (대장르/부장르/일반 모두 포함)
      const allInitialTags = [...initialTags, ...initialMajor, ...initialSub];
      for (const tag of allInitialTags) {
        if (!(tag in intensities)) {
          intensities[tag] = 3;
        }
      }
      setTagIntensities(intensities);
    }
  }, [visible, initialTags, initialMajor, initialSub, initialTagData, enableIntensity]);

  const C = theme;
  const isDark = C.bg !== "#F5F7FB"; // 다크모드 감지

  // 태그 감정 가져오기
  const getTagSentimentLocal = useCallback((tag) => {
    if (tagSentiments[tag]) return tagSentiments[tag];
    if (DEFAULT_TAG_SENTIMENTS[tag]) return DEFAULT_TAG_SENTIMENTS[tag];
    return TAG_SENTIMENT.NEUTRAL;
  }, [tagSentiments]);

  // 토글 함수들 - 🆕 추가 시 lastAddedTag 업데이트
  const toggleMajor = useCallback((g) => {
    setSelectedMajor(prev => {
      if (prev.includes(g)) {
        return prev.filter(x => x !== g);
      } else {
        setLastAddedTag(g); // 추가 시 기록
        return [...prev, g];
      }
    });
  }, []);

  const toggleSub = useCallback((g) => {
    setSelectedSub(prev => {
      if (prev.includes(g)) {
        return prev.filter(x => x !== g);
      } else {
        setLastAddedTag(g); // 추가 시 기록
        return [...prev, g];
      }
    });
  }, []);

  const toggleTag = useCallback((tag) => {
    if (bulkMode) {
      setBulkSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    } else {
      setSelectedTags(prev => {
        if (prev.includes(tag)) {
          // 태그 제거 시 농도 정보도 제거
          setTagIntensities(prevInt => {
            const newInt = { ...prevInt };
            delete newInt[tag];
            return newInt;
          });
          return prev.filter(t => t !== tag);
        } else {
          // 태그 추가 시 기본 농도 3 설정
          setTagIntensities(prevInt => ({ ...prevInt, [tag]: 3 }));
          setLastAddedTag(tag); // 추가 시 기록
          return [...prev, tag];
        }
      });
    }
  }, [bulkMode]);
  
  // 🏷️ v5.0: 태그 농도 변경
  const setTagIntensity = useCallback((tag, intensity) => {
    setTagIntensities(prev => ({ ...prev, [tag]: intensity }));
  }, []);

  // 🎭 대량 선택 태그 일괄 추가/제거
  const bulkAddTags = () => {
    setSelectedTags(prev => {
      const newSet = new Set([...prev, ...bulkSelectedTags]);
      return Array.from(newSet);
    });
    setBulkSelectedTags([]);
  };
  
  const bulkRemoveTags = () => {
    setSelectedTags(prev => prev.filter(t => !bulkSelectedTags.includes(t)));
    setBulkSelectedTags([]);
  };

  // 🆕 v3.4.3: 빠른 입력 처리 (쉼표 구분 다중 태그)
  const handleQuickAdd = useCallback(() => {
    if (!quickInput.trim()) return;
    
    // 쉼표로 분리하고 각 태그 정리
    const inputTags = quickInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (inputTags.length === 0) return;
    
    // 모든 기존 태그 목록 (대장르, 부장르, 일반, 커스텀, 조합)
    const allMajor = [...MAJOR_GENRES, ...userMajorGenres];
    const allSub = [...SUB_GENRES, ...userSubGenres];
    const allGeneral = Object.values(GENERAL_TAGS).flat();
    const allCombo = comboTags || [];
    const allCustom = customTags || [];
    
    const newCustomTags = [];
    const tagsToSelect = [];
    const majorsToSelect = [];
    const subsToSelect = [];
    
    for (const tag of inputTags) {
      const tagLower = tag.toLowerCase();
      
      // 1. 대장르에 있는지 확인
      const majorMatch = allMajor.find(m => m.toLowerCase() === tagLower);
      if (majorMatch) {
        if (!selectedMajor.includes(majorMatch)) {
          majorsToSelect.push(majorMatch);
        }
        continue;
      }
      
      // 2. 부장르에 있는지 확인
      const subMatch = allSub.find(s => s.toLowerCase() === tagLower);
      if (subMatch) {
        if (!selectedSub.includes(subMatch)) {
          subsToSelect.push(subMatch);
        }
        continue;
      }
      
      // 3. 일반 태그에 있는지 확인
      const generalMatch = allGeneral.find(g => g.toLowerCase() === tagLower);
      if (generalMatch) {
        if (!selectedTags.includes(generalMatch)) {
          tagsToSelect.push(generalMatch);
        }
        continue;
      }
      
      // 4. 조합 태그에 있는지 확인
      const comboMatch = allCombo.find(c => c.toLowerCase() === tagLower);
      if (comboMatch) {
        if (!selectedTags.includes(comboMatch)) {
          tagsToSelect.push(comboMatch);
        }
        continue;
      }
      
      // 5. 커스텀 태그에 있는지 확인
      const customMatch = allCustom.find(c => c.toLowerCase() === tagLower);
      if (customMatch) {
        if (!selectedTags.includes(customMatch)) {
          tagsToSelect.push(customMatch);
        }
        continue;
      }
      
      // 6. 어디에도 없으면 새 커스텀 태그로 추가
      newCustomTags.push(tag);
      tagsToSelect.push(tag);
    }
    
    // 새 커스텀 태그 추가 (콜백 호출)
    if (newCustomTags.length > 0 && onAddCustomTag) {
      for (const newTag of newCustomTags) {
        onAddCustomTag(newTag);
      }
    }
    
    // 선택 상태 업데이트
    if (majorsToSelect.length > 0) {
      setSelectedMajor(prev => [...prev, ...majorsToSelect]);
    }
    if (subsToSelect.length > 0) {
      setSelectedSub(prev => [...prev, ...subsToSelect]);
    }
    if (tagsToSelect.length > 0) {
      setSelectedTags(prev => {
        const newSet = new Set([...prev, ...tagsToSelect]);
        return Array.from(newSet);
      });
      // 농도 정보 추가
      setTagIntensities(prev => {
        const newInt = { ...prev };
        for (const tag of tagsToSelect) {
          if (!(tag in newInt)) {
            newInt[tag] = 3;
          }
        }
        return newInt;
      });
    }
    
    // 마지막 추가 태그 기록
    const allAdded = [...majorsToSelect, ...subsToSelect, ...tagsToSelect];
    if (allAdded.length > 0) {
      setLastAddedTag(allAdded[allAdded.length - 1]);
    }
    
    // 입력 필드 초기화
    setQuickInput("");
    
    // 결과 알림
    const addedCount = allAdded.length;
    const newCount = newCustomTags.length;
    if (addedCount > 0) {
      const msg = newCount > 0 
        ? `${addedCount}개 태그 선택됨 (신규 ${newCount}개 추가)`
        : `${addedCount}개 태그 선택됨`;
      Alert.alert("완료", msg);
    }
  }, [quickInput, selectedMajor, selectedSub, selectedTags, userMajorGenres, userSubGenres, comboTags, customTags, onAddCustomTag]);

  // 정렬된 목록 (내부에서 계산) + 숨김 태그 필터링
  // 🆕 v3.4: 검색어 기반 필터링 함수
  const filterBySearch = useCallback((tags) => {
    if (!tagSearchQuery.trim()) return tags;
    const q = tagSearchQuery.toLowerCase().trim();
    return tags.filter(t => t.toLowerCase().includes(q));
  }, [tagSearchQuery]);

  // 🔧 v3.4.4: 고정 태그를 상단에 배치하는 정렬 헬퍼
  const sortWithPinnedFirst = useCallback((tags) => {
    const pinned = tags.filter(t => pinnedTags.includes(t));
    const others = tags.filter(t => !pinnedTags.includes(t));
    return [...pinned, ...others];
  }, [pinnedTags]);

  const sortedMajor = useMemo(() => {
    const all = [...MAJOR_GENRES, ...userMajorGenres].filter(t => !hiddenTags.includes(t));
    const sorted = sortTagsByUsage(all, tagUsageCounts);
    const filtered = filterBySearch(sorted);
    return sortWithPinnedFirst(filtered); // 🔧 v3.4.4: 고정 태그 상단
  }, [userMajorGenres, tagUsageCounts, hiddenTags, filterBySearch, sortWithPinnedFirst]);
  
  const sortedSub = useMemo(() => {
    const all = [...SUB_GENRES, ...userSubGenres].filter(t => !hiddenTags.includes(t));
    const sorted = sortTagsByUsage(all, tagUsageCounts);
    const filtered = filterBySearch(sorted);
    return sortWithPinnedFirst(filtered); // 🔧 v3.4.4: 고정 태그 상단
  }, [userSubGenres, tagUsageCounts, hiddenTags, filterBySearch, sortWithPinnedFirst]);

  const sortedGeneralTags = useMemo(() => {
    const result = {};
    for (const [category, tagList] of Object.entries(GENERAL_TAGS)) {
      const filtered = tagList.filter(t => !hiddenTags.includes(t));
      const sorted = sortTagsByUsage(filtered, tagUsageCounts);
      const searched = filterBySearch(sorted);
      result[category] = sortWithPinnedFirst(searched); // 🔧 v3.4.4: 고정 태그 상단
    }
    return result;
  }, [tagUsageCounts, hiddenTags, filterBySearch, sortWithPinnedFirst]);

  // 🎭 v2.8.1: 감정별 태그 분류
  const sentimentTags = useMemo(() => {
    // 모든 태그 수집 (기본 + 커스텀 + 조합)
    const allTags = new Set();
    Object.values(GENERAL_TAGS).flat().forEach(t => allTags.add(t));
    customTags.forEach(t => allTags.add(t));
    comboTags.forEach(t => allTags.add(t));
    
    // 숨김 태그 제외
    const visibleTags = Array.from(allTags).filter(t => !hiddenTags.includes(t));
    
    // 감정별 분류
    const positive = [];
    const neutral = [];
    const negative = [];
    
    for (const tag of visibleTags) {
      const sentiment = getTagSentimentLocal(tag);
      if (sentiment === TAG_SENTIMENT.POSITIVE) positive.push(tag);
      else if (sentiment === TAG_SENTIMENT.NEGATIVE) negative.push(tag);
      else neutral.push(tag);
    }
    
    return {
      positive: filterBySearch(sortTagsByUsage(positive, tagUsageCounts)),
      neutral: filterBySearch(sortTagsByUsage(neutral, tagUsageCounts)),
      negative: filterBySearch(sortTagsByUsage(negative, tagUsageCounts)),
    };
  }, [customTags, comboTags, hiddenTags, tagUsageCounts, getTagSentimentLocal, filterBySearch]);

  // 🆕 v3.2.1: 공동 출현 기반 태그 추천 (마지막 추가 태그 우선)
  const coOccurringRecommendations = useMemo(() => {
    // 현재 선택된 모든 태그
    const allSelected = new Set([...selectedMajor, ...selectedSub, ...selectedTags]);
    if (allSelected.size === 0) return [];
    
    const candidates = new Map(); // tag -> score
    
    // 🆕 마지막 추가 태그가 있으면 그 태그 기준으로 추천
    const focusTag = lastAddedTag && allSelected.has(lastAddedTag) ? lastAddedTag : null;
    
    // 공동 출현 통계가 있으면 사용
    if (tagCoOccurrences && Object.keys(tagCoOccurrences).length > 0) {
      if (focusTag) {
        // 마지막 태그 기준 추천
        const coTags = tagCoOccurrences[focusTag];
        if (coTags) {
          for (const [otherTag, count] of Object.entries(coTags)) {
            if (allSelected.has(otherTag)) continue;
            if (hiddenTags.includes(otherTag)) continue;
            candidates.set(otherTag, count);
          }
        }
      }
      
      // 마지막 태그 기준으로 부족하면 전체 태그에서 보충
      if (candidates.size < 5) {
        for (const selectedTag of allSelected) {
          if (selectedTag === focusTag) continue; // 이미 처리함
          const coTags = tagCoOccurrences[selectedTag];
          if (!coTags) continue;
          
          for (const [otherTag, count] of Object.entries(coTags)) {
            if (allSelected.has(otherTag)) continue;
            if (hiddenTags.includes(otherTag)) continue;
            if (candidates.has(otherTag)) continue; // 이미 추가됨
            
            candidates.set(otherTag, count * 0.5); // 가중치 낮춤
          }
        }
      }
    } else {
      // 공동 출현 통계가 없으면 tagUsageCounts 기반으로 근사
      const allAvailableTags = new Set();
      Object.values(GENERAL_TAGS).flat().forEach(t => allAvailableTags.add(t));
      customTags.forEach(t => allAvailableTags.add(t));
      comboTags.forEach(t => allAvailableTags.add(t));
      [...MAJOR_GENRES, ...userMajorGenres].forEach(t => allAvailableTags.add(t));
      [...SUB_GENRES, ...userSubGenres].forEach(t => allAvailableTags.add(t));
      
      for (const tag of allAvailableTags) {
        if (allSelected.has(tag)) continue;
        if (hiddenTags.includes(tag)) continue;
        
        const usage = tagUsageCounts[tag] || 0;
        if (usage > 0) {
          candidates.set(tag, usage);
        }
      }
    }
    
    // 상위 5개 반환
    return Array.from(candidates.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [selectedMajor, selectedSub, selectedTags, lastAddedTag, tagCoOccurrences, tagUsageCounts, customTags, comboTags, userMajorGenres, userSubGenres, hiddenTags]);

  // 조합식 태그 생성 (v2.8: 공백으로 자연스럽게 연결)
  const handleCreateComboTag = () => {
    if (!comboTrait || !comboTarget) {
      Alert.alert("알림", "특성과 대상을 모두 선택해주세요.");
      return;
    }
    // v2.8: "+" 대신 공백으로 자연스러운 태그명 생성
    const newCombo = `${comboTrait} ${comboTarget}`;
    // 기존 "+" 형식도 체크
    const oldFormatCombo = `${comboTrait}+${comboTarget}`;
    if (selectedTags.includes(newCombo) || selectedTags.includes(oldFormatCombo)) {
      Alert.alert("알림", "이미 추가된 조합입니다.");
      return;
    }
    // 조합식 태그 저장 요청
    if (onAddComboTag) {
      onAddComboTag(newCombo);
    }
    // 선택된 태그에 추가
    setSelectedTags(prev => [...prev, newCombo]);
    // v2.8: 조합 추가 후 선택 자동 해제 (다음 조합 편의성)
    setComboTrait("");
    setComboTarget("");
  };

  // 🎭 태그 감정 변경 (길게 누르기)
  const handleLongPressTag = (tag) => {
    if (!onSetTagSentiment) return;
    
    const current = getTagSentimentLocal(tag);
    const options = [
      { text: "👍 긍정", value: TAG_SENTIMENT.POSITIVE },
      { text: "⚖️ 중립", value: TAG_SENTIMENT.NEUTRAL },
      { text: "👎 부정", value: TAG_SENTIMENT.NEGATIVE },
    ];
    
    Alert.alert(
      `태그 감정: ${tag}`,
      `현재: ${SENTIMENT_COLORS[current]?.label || "중립"}`,
      [
        ...options.map(opt => ({
          text: opt.text + (current === opt.value ? " ✓" : ""),
          onPress: () => onSetTagSentiment(tag, opt.value),
        })),
        { text: "취소", style: "cancel" },
      ]
    );
  };

  // 🎭 감정 태그 칩 (색상 표시)
  const SentimentChip = ({ tag, active, onPress }) => {
    const sentiment = getTagSentimentLocal(tag);
    const baseColors = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS[TAG_SENTIMENT.NEUTRAL];
    
    // 다크모드용 색상 조정
    const colors = isDark ? {
      bg: sentiment === TAG_SENTIMENT.POSITIVE ? "#14532d" :
          sentiment === TAG_SENTIMENT.NEGATIVE ? "#7f1d1d" : "#374151",
      text: sentiment === TAG_SENTIMENT.POSITIVE ? "#86efac" :
            sentiment === TAG_SENTIMENT.NEGATIVE ? "#fca5a5" : "#d1d5db",
      border: baseColors.border,
    } : baseColors;
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => handleLongPressTag(tag)}
        delayLongPress={400}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: active ? C.primary : colors.bg,
          borderWidth: active ? 0 : 1,
          borderColor: colors.border,
          marginRight: 8,
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {bulkMode && (
          <Text style={{ marginRight: 4 }}>
            {bulkSelectedTags.includes(tag) ? "☑️" : "☐"}
          </Text>
        )}
        <Text style={{ 
          color: active ? "#fff" : colors.text, 
          fontWeight: "600",
          fontSize: 13,
        }}>
          {tag}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  // 탭 정의 - 🏷️ v5.0: 농도 탭 추가
  const TABS = [
    { key: "genre", label: "🎭 장르" },
    { key: "general", label: "🏷️ 일반" },
    { key: "sentiment", label: "⭐ 평가" },
    { key: "combo", label: "🔗 조합" },
    { key: "intensity", label: "📊 농도" },
  ];
  
  // 🏷️ v5.0: 농도 레벨 정의
  const INTENSITY_LEVELS = [
    { value: 1, label: "1", desc: "희미함", color: "#94a3b8" },
    { value: 2, label: "2", desc: "약간", color: "#60a5fa" },
    { value: 3, label: "3", desc: "보통", color: "#22c55e" },
    { value: 4, label: "4", desc: "강함", color: "#f59e0b" },
    { value: 5, label: "5", desc: "핵심", color: "#ef4444" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.modal, justifyContent: "flex-end" }}>
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View 
          style={{ 
            backgroundColor: C.card, 
            borderTopLeftRadius: 16, 
            borderTopRightRadius: 16, 
            padding: 16, 
            maxHeight: "90%" 
          }}
        >
          {/* 헤더 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
              🏷️ 태그 선택
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* 대량 선택 모드 토글 */}
              <TouchableOpacity
                onPress={() => {
                  setBulkMode(!bulkMode);
                  setBulkSelectedTags([]);
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: bulkMode ? C.primary : C.chip,
                }}
              >
                <Text style={{ color: bulkMode ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>
                  {bulkMode ? "✓ 대량선택" : "대량선택"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 현재 선택된 태그 요약 */}
          <View style={{ backgroundColor: C.bg, padding: 10, borderRadius: 10, marginBottom: 12 }}>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              대장르: {selectedMajor.length}개 | 부장르: {selectedSub.length}개 | 태그: {selectedTags.length}개
            </Text>
            {bulkMode && bulkSelectedTags.length > 0 && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={bulkAddTags}
                  style={{ flex: 1, backgroundColor: "#22c55e", paddingVertical: 8, borderRadius: 8, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>선택 {bulkSelectedTags.length}개 추가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={bulkRemoveTags}
                  style={{ flex: 1, backgroundColor: "#ef4444", paddingVertical: 8, borderRadius: 8, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>선택 {bulkSelectedTags.length}개 제거</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* 🆕 v3.4.3: 빠른 입력 (쉼표 구분 다중 태그) */}
          <View style={{ marginBottom: 12, backgroundColor: isDark ? "#1e3a5f" : "#eff6ff", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: isDark ? "#3b82f6" : "#93c5fd" }}>
            <Text style={{ color: isDark ? "#93c5fd" : "#1d4ed8", fontSize: 11, fontWeight: "600", marginBottom: 6 }}>
              ⚡ 빠른 입력 (쉼표로 구분)
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={quickInput}
                onChangeText={setQuickInput}
                placeholder="무한회귀, 탑등반, 판타지..."
                placeholderTextColor={C.sub}
                style={{
                  flex: 1,
                  backgroundColor: C.card,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: C.text,
                }}
              />
              <TouchableOpacity
                onPress={handleQuickAdd}
                disabled={!quickInput.trim()}
                style={{
                  backgroundColor: quickInput.trim() ? "#3b82f6" : C.chip,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: quickInput.trim() ? "#fff" : C.sub, fontWeight: "700" }}>추가</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: isDark ? "#60a5fa" : "#3b82f6", fontSize: 10, marginTop: 4 }}>
              기존 태그는 자동 선택, 없는 태그는 새로 추가됩니다
            </Text>
          </View>
          
          {/* 🆕 v3.4: 태그 검색 */}
          <View style={{ marginBottom: 12 }}>
            <TextInput
              value={tagSearchQuery}
              onChangeText={setTagSearchQuery}
              placeholder="태그 검색..."
              placeholderTextColor={C.sub}
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: C.text,
              }}
            />
            {tagSearchQuery.trim() && (
              <TouchableOpacity 
                onPress={() => setTagSearchQuery("")}
                style={{ position: "absolute", right: 12, top: 10 }}
              >
                <Text style={{ color: C.sub, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* 탭 선택 */}
          <View style={{ flexDirection: "row", marginBottom: 12, gap: 4 }}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: activeTab === tab.key ? C.primary : C.chip,
                  alignItems: "center",
                }}
              >
                <Text style={{ 
                  color: activeTab === tab.key ? "#fff" : C.text, 
                  fontWeight: "700",
                  fontSize: 12,
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <ScrollView 
            style={{ maxHeight: "60%" }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {/* 🎭 장르 탭 */}
            {activeTab === "genre" && (
              <>
                {/* 🆕 v3.2.1: 공동 출현 기반 추천 (마지막 추가 태그 기준) */}
                {coOccurringRecommendations.length > 0 && (
                  <View style={{ 
                    backgroundColor: isDark ? "#78350f" : "#fef3c7", 
                    padding: 12, 
                    borderRadius: 12, 
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#f59e0b" : "#fcd34d",
                  }}>
                    <Text style={{ fontWeight: "700", color: isDark ? "#fcd34d" : "#92400e", marginBottom: 6 }}>
                      ⭐ 추천 태그 {lastAddedTag ? `(${lastAddedTag} 기준)` : ""}
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? "#fbbf24" : "#b45309", marginBottom: 8 }}>
                      {lastAddedTag ? `"${lastAddedTag}"와 자주 함께 쓰이는 태그` : "자주 함께 사용되는 태그들"}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {coOccurringRecommendations.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => toggleTag(tag)}
                          style={{
                            paddingVertical: 5,
                            paddingHorizontal: 10,
                            borderRadius: 999,
                            backgroundColor: selectedTags.includes(tag) ? "#f59e0b" : (isDark ? "#451a03" : "#fff"),
                            marginRight: 6,
                            marginBottom: 6,
                            borderWidth: 1,
                            borderColor: isDark ? "#f59e0b" : "#fcd34d",
                          }}
                        >
                          <Text style={{ 
                            color: selectedTags.includes(tag) ? "#fff" : (isDark ? "#fcd34d" : "#92400e"), 
                            fontWeight: "600", 
                            fontSize: 12 
                          }}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* 대장르 선택 */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  대장르 (작품 배경/세계관) - 복수 선택 가능
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
                  {sortedMajor.map((g) => (
                    <Chip key={g} label={g} active={selectedMajor.includes(g)} onPress={() => toggleMajor(g)} />
                  ))}
                </View>
                
                {/* 부장르 선택 */}
                <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>
                  부장르 (핵심 소재/클리셰) - 복수 선택 가능
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
                  {sortedSub.map((g) => (
                    <Chip key={g} label={g} active={selectedSub.includes(g)} onPress={() => toggleSub(g)} />
                  ))}
                </View>
                
                {/* 대장르/부장르 커스텀 추가 */}
                <View style={{ marginTop: 8, padding: 12, backgroundColor: C.bg, borderRadius: 12 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>대장르/부장르 직접 등록</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <TextInput
                      value={newMajorInput}
                      onChangeText={setNewMajorInput}
                      placeholder="새 대장르"
                      placeholderTextColor={C.sub}
                      style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text }}
                    />
                    <OutlineButton
                      title="추가"
                      onPress={() => {
                        if (newMajorInput.trim() && onAddUserMajorGenre) {
                          onAddUserMajorGenre(newMajorInput.trim());
                          setNewMajorInput("");
                        }
                      }}
                      style={{ paddingHorizontal: 12 }}
                    />
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      value={newSubInput}
                      onChangeText={setNewSubInput}
                      placeholder="새 부장르"
                      placeholderTextColor={C.sub}
                      style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text }}
                    />
                    <OutlineButton
                      title="추가"
                      onPress={() => {
                        if (newSubInput.trim() && onAddUserSubGenre) {
                          onAddUserSubGenre(newSubInput.trim());
                          setNewSubInput("");
                        }
                      }}
                      style={{ paddingHorizontal: 12 }}
                    />
                  </View>
                </View>
              </>
            )}
            
            {/* 🏷️ 일반 태그 탭 */}
            {activeTab === "general" && (
              <>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                  💡 태그를 길게 누르면 감정(긍정/중립/부정)을 변경할 수 있습니다
                </Text>
                
                {/* 🆕 v3.2.1: 공동 출현 기반 추천 */}
                {coOccurringRecommendations.length > 0 && (
                  <View style={{ 
                    backgroundColor: isDark ? "#78350f" : "#fef3c7", 
                    padding: 12, 
                    borderRadius: 12, 
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#f59e0b" : "#fcd34d",
                  }}>
                    <Text style={{ fontWeight: "700", color: isDark ? "#fcd34d" : "#92400e", marginBottom: 6 }}>
                      ⭐ 추천 태그
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? "#fbbf24" : "#b45309", marginBottom: 8 }}>
                      자주 함께 사용되는 태그들
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {coOccurringRecommendations.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => toggleTag(tag)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 999,
                            backgroundColor: selectedTags.includes(tag) ? "#f59e0b" : (isDark ? "#451a03" : "#fff"),
                            marginRight: 6,
                            marginBottom: 6,
                            borderWidth: 1,
                            borderColor: isDark ? "#f59e0b" : "#fcd34d",
                          }}
                        >
                          <Text style={{ 
                            color: selectedTags.includes(tag) ? "#fff" : (isDark ? "#fcd34d" : "#92400e"), 
                            fontWeight: "600", 
                            fontSize: 13 
                          }}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* 일반 태그 (카테고리별) - 유사 그룹 표시 */}
                {Object.entries(sortedGeneralTags).map(([category, tagList]) => (
                  <View key={category}>
                    <Text style={{ fontWeight: "700", color: C.text, marginTop: 8, marginBottom: 6 }}>
                      {category}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {tagList.map((tag) => (
                        <SentimentChip 
                          key={tag} 
                          tag={tag} 
                          active={selectedTags.includes(tag)} 
                          onPress={() => toggleTag(tag)} 
                        />
                      ))}
                    </View>
                  </View>
                ))}
                
                {/* 커스텀 태그 */}
                {customTags.length > 0 && (
                  <View>
                    <Text style={{ fontWeight: "700", color: C.text, marginTop: 12, marginBottom: 6 }}>
                      내 커스텀 태그
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {customTags.filter(t => !hiddenTags.includes(t)).map((tag) => (
                        <SentimentChip 
                          key={tag} 
                          tag={tag} 
                          active={selectedTags.includes(tag)} 
                          onPress={() => toggleTag(tag)} 
                        />
                      ))}
                    </View>
                  </View>
                )}
                
                {/* 조합식 태그 표시 */}
                {comboTags.length > 0 && (
                  <View>
                    <Text style={{ fontWeight: "700", color: C.text, marginTop: 12, marginBottom: 6 }}>
                      🔗 조합식 태그
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {comboTags.filter(t => !hiddenTags.includes(t)).map((tag) => (
                        <SentimentChip 
                          key={tag} 
                          tag={tag} 
                          active={selectedTags.includes(tag)} 
                          onPress={() => toggleTag(tag)} 
                        />
                      ))}
                    </View>
                  </View>
                )}
                
                {/* 🆕 v3.2.1: 유사 태그 그룹 (설정에서 지정한 그룹) */}
                {tagRelationGroups && Object.keys(tagRelationGroups).length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontWeight: "700", color: C.text, marginBottom: 8 }}>
                      🔗 유사 태그 그룹
                    </Text>
                    <Text style={{ fontSize: 11, color: C.sub, marginBottom: 10 }}>
                      비슷한 특성을 가진 태그들이 그룹으로 묶여 있습니다
                    </Text>
                    {Object.entries(tagRelationGroups)
                      .filter(([_, group]) => group.type === "similar")
                      .map(([groupId, group]) => {
                        const visibleTags = (group.tags || []).filter(t => !hiddenTags.includes(t));
                        if (visibleTags.length === 0) return null;
                        
                        return (
                          <View 
                            key={groupId} 
                            style={{ 
                              backgroundColor: "#dbeafe", 
                              padding: 10, 
                              borderRadius: 10, 
                              marginBottom: 8,
                              borderLeftWidth: 3,
                              borderLeftColor: "#3b82f6",
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1d4ed8", marginBottom: 6 }}>
                              {group.name || "유사 태그"}
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                              {visibleTags.map((tag) => (
                                <TouchableOpacity
                                  key={tag}
                                  onPress={() => toggleTag(tag)}
                                  style={{
                                    paddingVertical: 5,
                                    paddingHorizontal: 10,
                                    borderRadius: 999,
                                    backgroundColor: selectedTags.includes(tag) ? "#3b82f6" : "#fff",
                                    marginRight: 6,
                                    marginBottom: 4,
                                    borderWidth: 1,
                                    borderColor: "#93c5fd",
                                  }}
                                >
                                  <Text style={{ 
                                    color: selectedTags.includes(tag) ? "#fff" : "#1e40af", 
                                    fontWeight: "600", 
                                    fontSize: 12 
                                  }}>
                                    {tag}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                  </View>
                )}
                
                {/* 커스텀 태그 추가 */}
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>새 태그 추가</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      value={customInput}
                      onChangeText={setCustomInput}
                      placeholder="새 태그 입력"
                      placeholderTextColor={C.sub}
                      style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text }}
                    />
                    <PrimaryButton
                      title="추가"
                      onPress={() => {
                        if (customInput.trim() && onAddCustomTag) {
                          onAddCustomTag(customInput.trim());
                          setCustomInput("");
                        }
                      }}
                      style={{ paddingHorizontal: 16 }}
                    />
                  </View>
                </View>
              </>
            )}
            
            {/* ⭐ 평가 탭 (긍정/중립/부정) */}
            {activeTab === "sentiment" && (
              <>
                <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                  💡 감정별로 분류된 태그입니다. 길게 누르면 감정을 변경할 수 있습니다.
                </Text>
                
                {/* 서브탭 */}
                <View style={{ flexDirection: "row", marginBottom: 12, gap: 4 }}>
                  {[
                    { key: "positive", label: "👍 긍정", count: sentimentTags.positive.length, color: "#22c55e" },
                    { key: "neutral", label: "⚖️ 중립", count: sentimentTags.neutral.length, color: "#6b7280" },
                    { key: "negative", label: "👎 부정", count: sentimentTags.negative.length, color: "#ef4444" },
                  ].map(sub => (
                    <TouchableOpacity
                      key={sub.key}
                      onPress={() => setSentimentSubTab(sub.key)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: sentimentSubTab === sub.key ? sub.color : C.chip,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ 
                        color: sentimentSubTab === sub.key ? "#fff" : C.text, 
                        fontWeight: "700",
                        fontSize: 12,
                      }}>
                        {sub.label} ({sub.count})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 선택된 감정의 태그 목록 */}
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {sentimentTags[sentimentSubTab].map((tag) => (
                    <SentimentChip 
                      key={tag} 
                      tag={tag} 
                      active={selectedTags.includes(tag)} 
                      onPress={() => toggleTag(tag)} 
                    />
                  ))}
                </View>
                
                {sentimentTags[sentimentSubTab].length === 0 && (
                  <Text style={{ color: C.sub, textAlign: "center", marginTop: 20 }}>
                    이 감정에 해당하는 태그가 없습니다.
                  </Text>
                )}
              </>
            )}
            
            {/* 🔗 조합식 태그 탭 */}
            {activeTab === "combo" && (
              <>
                <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                  <Text style={{ color: C.text, fontWeight: "700", marginBottom: 8 }}>
                    🔗 조합식 태그 만들기
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
                    특성 + 대상을 조합하여 상세한 태그를 만들 수 있습니다.{"\n"}
                    예: "먼치킨 히로인", "똑똑한 주인공", "츤데레 악역"
                  </Text>
                  
                  {/* 특성 선택 */}
                  <Text style={{ fontWeight: "600", color: C.text, marginBottom: 6 }}>
                    1. 특성 선택 {comboTrait ? `(선택: ${comboTrait})` : ""} ({allComboTraits.length}개)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row" }}>
                      {allComboTraits.map((trait) => (
                        <Chip 
                          key={trait} 
                          label={trait} 
                          active={comboTrait === trait} 
                          onPress={() => setComboTrait(comboTrait === trait ? "" : trait)} 
                        />
                      ))}
                    </View>
                  </ScrollView>
                  
                  {/* 대상 선택 */}
                  <Text style={{ fontWeight: "600", color: C.text, marginBottom: 6 }}>
                    2. 대상 선택 {comboTarget ? `(선택: ${comboTarget})` : ""} ({allComboTargets.length}개)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row" }}>
                      {allComboTargets.map((target) => (
                        <Chip 
                          key={target} 
                          label={target} 
                          active={comboTarget === target} 
                          onPress={() => setComboTarget(comboTarget === target ? "" : target)} 
                        />
                      ))}
                    </View>
                  </ScrollView>
                  
                  {/* 결과 미리보기 및 생성 */}
                  <View style={{ backgroundColor: C.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.line }}>
                    <Text style={{ color: C.text, fontWeight: "700", marginBottom: 8 }}>
                      결과: {comboTrait && comboTarget ? `${comboTrait} ${comboTarget}` : "(선택 필요)"}
                    </Text>
                    <PrimaryButton
                      title="조합 태그 생성 & 추가"
                      onPress={handleCreateComboTag}
                    />
                  </View>
                </View>
                
                {/* 기존 조합식 태그 */}
                {comboTags.length > 0 && (
                  <View>
                    <Text style={{ fontWeight: "700", color: C.text, marginBottom: 6 }}>
                      내 조합식 태그 ({comboTags.length}개)
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {comboTags.filter(t => !hiddenTags.includes(t)).map((tag) => (
                        <SentimentChip 
                          key={tag} 
                          tag={tag} 
                          active={selectedTags.includes(tag)} 
                          onPress={() => toggleTag(tag)} 
                        />
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
            
            {/* 🏷️ v5.0: 농도 탭 */}
            {activeTab === "intensity" && (() => {
              // 모든 선택된 태그 합치기 (대장르 + 부장르 + 일반태그)
              const allSelected = [
                ...selectedMajor.map(t => ({ tag: t, category: "대장르" })),
                ...selectedSub.map(t => ({ tag: t, category: "부장르" })),
                ...selectedTags.map(t => ({ tag: t, category: "일반" })),
              ];
              
              return (
              <>
                <View style={{ backgroundColor: C.bg, padding: 12, borderRadius: 12, marginBottom: 12 }}>
                  <Text style={{ color: C.text, fontWeight: "700", marginBottom: 8 }}>
                    📊 태그 농도 설정
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
                    농도는 해당 태그가 작품을 얼마나 대표하는지를 나타냅니다.{"\n"}
                    • 1~2: 약간 해당 / 3: 보통 / 4~5: 강하게 해당
                  </Text>
                  
                  {/* 농도 레벨 범례 */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line }}>
                    {INTENSITY_LEVELS.map(level => (
                      <View key={level.value} style={{ alignItems: "center" }}>
                        <View style={{ 
                          width: 24, height: 24, borderRadius: 12, 
                          backgroundColor: level.color, 
                          justifyContent: "center", alignItems: "center" 
                        }}>
                          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{level.label}</Text>
                        </View>
                        <Text style={{ color: C.sub, fontSize: 10, marginTop: 2 }}>{level.desc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {allSelected.length === 0 ? (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={{ color: C.sub, textAlign: "center" }}>
                      선택된 태그가 없습니다.{"\n"}
                      다른 탭에서 태그를 먼저 선택해주세요.
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text style={{ fontWeight: "700", color: C.text, marginBottom: 12 }}>
                      선택된 태그 ({allSelected.length}개) - 대장르 {selectedMajor.length} / 부장르 {selectedSub.length} / 일반 {selectedTags.length}
                    </Text>
                    {allSelected.map(({ tag, category }) => {
                      const intensity = tagIntensities[tag] || 3;
                      const levelInfo = INTENSITY_LEVELS.find(l => l.value === intensity) || INTENSITY_LEVELS[2];
                      const categoryColor = category === "대장르" ? "#22c55e" : category === "부장르" ? "#3b82f6" : C.sub;
                      
                      return (
                        <View 
                          key={`${category}-${tag}`} 
                          style={{ 
                            backgroundColor: C.card, 
                            borderRadius: 12, 
                            padding: 12, 
                            marginBottom: 10,
                            borderWidth: 1,
                            borderColor: C.line,
                          }}
                        >
                          {/* 태그명 + 현재 농도 */}
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                              <Text style={{ color: categoryColor, fontWeight: "600", fontSize: 11, marginRight: 6 }}>
                                [{category}]
                              </Text>
                              <Text style={{ color: C.text, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                                {tag}
                              </Text>
                            </View>
                            <View style={{ 
                              backgroundColor: levelInfo.color, 
                              paddingHorizontal: 10, 
                              paddingVertical: 4, 
                              borderRadius: 999 
                            }}>
                              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                                {levelInfo.desc} ({intensity})
                              </Text>
                            </View>
                          </View>
                          
                          {/* 농도 선택 버튼들 */}
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            {INTENSITY_LEVELS.map(level => (
                              <TouchableOpacity
                                key={level.value}
                                onPress={() => setTagIntensity(tag, level.value)}
                                style={{
                                  flex: 1,
                                  marginHorizontal: 2,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  backgroundColor: intensity === level.value ? level.color : C.bg,
                                  borderWidth: 1,
                                  borderColor: intensity === level.value ? level.color : C.line,
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ 
                                  color: intensity === level.value ? "#fff" : C.sub, 
                                  fontWeight: "700",
                                  fontSize: 14,
                                }}>
                                  {level.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            );
            })()}
          </ScrollView>
          
          {/* 확인/취소 버튼 */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            <PrimaryButton
              title="확인"
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
            <OutlineButton
              title="취소"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}); 

export default TagSelectModal;
