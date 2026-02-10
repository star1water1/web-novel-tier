/**
 * 태그/태그편집/태그관계 핸들러 통합
 * @module handlers/tagHandlers
 * @merged tagHandlers + tagEditHandlers + tagRelationHandlers
 * 
 * @bugfix v6.1.1
 * - [FIX] execBatch import 누락 수정 → deleteTagGlobally() 호출 시 ReferenceError 해결
 */
import { getAppMeta, setAppMeta, execBatch } from '../database';
import { MAJOR_GENRES, SUB_GENRES } from '../constants';


// ═══════════════════════════════════════════════════════════════
// 📌 tagHandlers
// ═══════════════════════════════════════════════════════════════



export async function addCustomTag(tag, customTags) {
  const t = (tag || "").trim();
  if (!t) return { success: false, error: "태그를 입력하세요" };
  if (customTags.includes(t)) return { success: false, error: "이미 존재하는 태그입니다" };

  const updated = [...customTags, t];
  await setAppMeta("custom_tags", updated);
  return { success: true, tags: updated };
}

export async function removeCustomTag(tag, customTags) {
  const updated = customTags.filter(t => t !== tag);
  await setAppMeta("custom_tags", updated);
  return updated;
}

export async function addComboTag(comboTag, comboTags) {
  const t = (comboTag || "").trim();
  if (!t) return { success: false, error: "태그를 입력하세요" };
  if (comboTags.includes(t)) return { success: false, error: "이미 존재하는 조합 태그입니다" };

  const updated = [...comboTags, t];
  await setAppMeta("combo_tags", updated);
  return { success: true, tags: updated };
}

export async function removeComboTag(comboTag, comboTags) {
  const updated = comboTags.filter(t => t !== comboTag);
  await setAppMeta("combo_tags", updated);
  return updated;
}

export async function addCustomComboTrait(trait, customComboTraits) {
  const t = (trait || "").trim();
  if (!t) return { success: false, error: "특성을 입력하세요" };
  if (customComboTraits.includes(t)) return { success: false, error: "이미 존재합니다" };

  const updated = [...customComboTraits, t];
  await setAppMeta("custom_combo_traits", updated);
  return { success: true, traits: updated };
}

export async function removeCustomComboTrait(trait, customComboTraits) {
  const updated = customComboTraits.filter(t => t !== trait);
  await setAppMeta("custom_combo_traits", updated);
  return updated;
}

export async function addCustomComboTarget(target, customComboTargets) {
  const t = (target || "").trim();
  if (!t) return { success: false, error: "대상을 입력하세요" };
  if (customComboTargets.includes(t)) return { success: false, error: "이미 존재합니다" };

  const updated = [...customComboTargets, t];
  await setAppMeta("custom_combo_targets", updated);
  return { success: true, targets: updated };
}

export async function removeCustomComboTarget(target, customComboTargets) {
  const updated = customComboTargets.filter(t => t !== target);
  await setAppMeta("custom_combo_targets", updated);
  return updated;
}

export async function addUserMajorGenre(genre, userMajorGenres) {
  const g = (genre || "").trim();
  if (!g) return { success: false, error: "장르를 입력하세요" };
  if (userMajorGenres.includes(g)) return { success: false, error: "이미 존재합니다" };

  const updated = [...userMajorGenres, g];
  await setAppMeta("user_major_genres", updated);
  return { success: true, genres: updated };
}

export async function removeUserMajorGenre(genre, userMajorGenres) {
  const updated = userMajorGenres.filter(g => g !== genre);
  await setAppMeta("user_major_genres", updated);
  return updated;
}

export async function addUserSubGenre(genre, userSubGenres) {
  const g = (genre || "").trim();
  if (!g) return { success: false, error: "장르를 입력하세요" };
  if (userSubGenres.includes(g)) return { success: false, error: "이미 존재합니다" };

  const updated = [...userSubGenres, g];
  await setAppMeta("user_sub_genres", updated);
  return { success: true, genres: updated };
}

export async function removeUserSubGenre(genre, userSubGenres) {
  const updated = userSubGenres.filter(g => g !== genre);
  await setAppMeta("user_sub_genres", updated);
  return updated;
}

export async function savePinnedTags(tags) {
  await setAppMeta("pinned_tags", tags);
}

export async function saveHiddenTags(tags) {
  await setAppMeta("hidden_tags", tags);
}

export async function saveTagSentiments(sentiments) {
  await setAppMeta("tag_sentiments", sentiments);
}

export async function setTagSentiment(tag, sentiment, currentSentiments) {
  const updated = { ...currentSentiments };
  if (sentiment === "neutral" || !sentiment) {
    delete updated[tag];
  } else {
    updated[tag] = sentiment;
  }
  await setAppMeta("tag_sentiments", updated);
  return updated;
}

export async function saveTagRelations(relations) {
  await setAppMeta("tag_relations", relations);
}

export async function saveCoordinateSystems(systems) {
  await setAppMeta("coordinate_systems", systems);
}

export async function cleanupDuplicateTags(customTags, comboTags) {
  const uniqueCustom = [...new Set(customTags)];
  const uniqueCombo = [...new Set(comboTags)];
  
  await setAppMeta("custom_tags", uniqueCustom);
  await setAppMeta("combo_tags", uniqueCombo);
  
  return {
    customTags: uniqueCustom,
    comboTags: uniqueCombo,
    removedCustom: customTags.length - uniqueCustom.length,
    removedCombo: comboTags.length - uniqueCombo.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// 추가 태그 관리 함수들 (검증 시 발견된 누락분)
// ═══════════════════════════════════════════════════════════════

export async function addCustomTagDirect(tag, customTags, setCustomTags) {
  const t = (tag || "").trim();
  if (!t) return;
  if ((customTags || []).includes(t)) return;
  
  const updated = [...(customTags || []), t];
  setCustomTags(updated);
  await setAppMeta("custom_tags", updated);
}

export async function comboToCustomTag(comboTag, comboTags, setComboTags, customTags, setCustomTags) {
  if (!comboTag) return;
  
  // 조합태그에서 제거
  const updatedCombo = (comboTags || []).filter(t => t !== comboTag);
  setComboTags(updatedCombo);
  await setAppMeta("combo_tags", updatedCombo);
  
  // 커스텀태그에 추가
  if (!(customTags || []).includes(comboTag)) {
    const updatedCustom = [...(customTags || []), comboTag];
    setCustomTags(updatedCustom);
    await setAppMeta("custom_tags", updatedCustom);
  }
}

export async function demoteMajorToCustom(genre, userMajorGenres, setUserMajorGenres, customTags, setCustomTags) {
  // 사용자 대장르에서 제거
  const updated = (userMajorGenres || []).filter(g => g !== genre);
  setUserMajorGenres(updated);
  await setAppMeta("user_major_genres", updated);
  
  // 커스텀태그에 추가
  if (!(customTags || []).includes(genre)) {
    const updatedCustom = [...(customTags || []), genre];
    setCustomTags(updatedCustom);
    await setAppMeta("custom_tags", updatedCustom);
  }
}

export async function demoteSubToCustom(genre, userSubGenres, setUserSubGenres, customTags, setCustomTags) {
  const updated = (userSubGenres || []).filter(g => g !== genre);
  setUserSubGenres(updated);
  await setAppMeta("user_sub_genres", updated);
  
  if (!(customTags || []).includes(genre)) {
    const updatedCustom = [...(customTags || []), genre];
    setCustomTags(updatedCustom);
    await setAppMeta("custom_tags", updatedCustom);
  }
}

export async function cleanupUnusedTags(novels, customTags, setCustomTags) {
  const usedTags = new Set();
  
  for (const n of novels || []) {
    const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    tags.forEach(t => usedTags.add(t));
  }
  
  const updated = (customTags || []).filter(t => usedTags.has(t));
  setCustomTags(updated);
  await setAppMeta("custom_tags", updated);
  
  return { removed: (customTags || []).length - updated.length };
}

export async function deleteTagGlobally(tag, novels, customTags, setCustomTags, comboTags, setComboTags) {
  const t = (tag || "").trim();
  if (!t) return;
  
  // 모든 작품에서 태그 제거
  const queries = [];
  for (const n of novels || []) {
    const tags = (n.tags || "").split(",").map(s => s.trim()).filter(Boolean);
    if (tags.includes(t)) {
      const newTags = tags.filter(x => x !== t).join(", ");
      queries.push({
        sql: "UPDATE novels SET tags=? WHERE id=?",
        params: [newTags, n.id],
      });
    }
  }
  
  if (queries.length > 0) {
    await execBatch(queries);
  }
  
  // 커스텀태그에서 제거
  if ((customTags || []).includes(t)) {
    const updatedCustom = customTags.filter(x => x !== t);
    setCustomTags(updatedCustom);
    await setAppMeta("custom_tags", updatedCustom);
  }
  
  // 조합태그에서 제거
  if ((comboTags || []).includes(t)) {
    const updatedCombo = comboTags.filter(x => x !== t);
    setComboTags(updatedCombo);
    await setAppMeta("combo_tags", updatedCombo);
  }
  
  return { affectedNovels: queries.length };
}

export async function syncCustomTagsFromNovels(novels, customTags, setCustomTags, knownTags) {
  const usedTags = new Set();
  
  for (const n of novels || []) {
    const tags = (n.tags || "").split(",").map(t => t.trim()).filter(Boolean);
    tags.forEach(t => usedTags.add(t));
  }
  
  // 알려진 태그(대장르, 소장르, 일반태그)는 제외
  const known = new Set(knownTags || []);
  const newCustom = [...usedTags].filter(t => !known.has(t) && !(customTags || []).includes(t));
  
  if (newCustom.length > 0) {
    const updated = [...(customTags || []), ...newCustom];
    setCustomTags(updated);
    await setAppMeta("custom_tags", updated);
  }
  
  return { added: newCustom.length };
}

export async function getTagCoordinateSystems() {
  return await getAppMeta("coordinate_systems") || {};
}

// ═══════════════════════════════════════════════════════════════
// 📌 tagEditHandlers
// ═══════════════════════════════════════════════════════════════



export async function saveTagAttributes(attrs) {
  await setAppMeta("tag_attributes", attrs);
}

export async function toggleTagMajor(tag, userMajorGenres, setUserMajorGenres) {
  const isMajor = [...MAJOR_GENRES, ...(userMajorGenres || [])].includes(tag);
  
  if (isMajor) {
    // 제거
    const updated = (userMajorGenres || []).filter(g => g !== tag);
    setUserMajorGenres(updated);
    await setAppMeta("user_major_genres", updated);
  } else {
    // 추가
    const updated = [...(userMajorGenres || []), tag];
    setUserMajorGenres(updated);
    await setAppMeta("user_major_genres", updated);
  }
}

export async function toggleTagSub(tag, userSubGenres, setUserSubGenres) {
  const isSub = [...SUB_GENRES, ...(userSubGenres || [])].includes(tag);
  
  if (isSub) {
    const updated = (userSubGenres || []).filter(g => g !== tag);
    setUserSubGenres(updated);
    await setAppMeta("user_sub_genres", updated);
  } else {
    const updated = [...(userSubGenres || []), tag];
    setUserSubGenres(updated);
    await setAppMeta("user_sub_genres", updated);
  }
}

export function checkIsTagMajor(tag, userMajorGenres) {
  return [...MAJOR_GENRES, ...(userMajorGenres || [])].includes(tag);
}

export function checkIsTagSub(tag, userSubGenres) {
  return [...SUB_GENRES, ...(userSubGenres || [])].includes(tag);
}

export async function toggleHideTag(tag, hiddenTags, setHiddenTags) {
  const isHidden = (hiddenTags || []).includes(tag);
  
  if (isHidden) {
    const updated = (hiddenTags || []).filter(t => t !== tag);
    setHiddenTags(updated);
    await setAppMeta("hidden_tags", updated);
  } else {
    const updated = [...(hiddenTags || []), tag];
    setHiddenTags(updated);
    await setAppMeta("hidden_tags", updated);
  }
}

export async function togglePinTag(tag, pinnedTags, setPinnedTags, hiddenTags, setHiddenTags) {
  const isPinned = (pinnedTags || []).includes(tag);
  
  if (isPinned) {
    const updated = (pinnedTags || []).filter(t => t !== tag);
    setPinnedTags(updated);
    await setAppMeta("pinned_tags", updated);
  } else {
    // 숨김에서 제거하고 고정에 추가
    if ((hiddenTags || []).includes(tag)) {
      const updatedHidden = (hiddenTags || []).filter(t => t !== tag);
      setHiddenTags(updatedHidden);
      await setAppMeta("hidden_tags", updatedHidden);
    }
    
    const updated = [...(pinnedTags || []), tag];
    setPinnedTags(updated);
    await setAppMeta("pinned_tags", updated);
  }
}

export function getTagUsageStats(tag, list) {
  if (!tag || !list || list.length === 0) {
    return { count: 0, avgRating: 0, novels: [] };
  }

  const novelsWithTag = list.filter(n => {
    const tags = (n.tags || "").split(",").map(t => t.trim().toLowerCase());
    return tags.includes(tag.toLowerCase());
  });

  if (novelsWithTag.length === 0) {
    return { count: 0, avgRating: 0, novels: [] };
  }

  const avgRating = novelsWithTag.reduce((sum, n) => sum + (n.rating || 1500), 0) / novelsWithTag.length;

  return {
    count: novelsWithTag.length,
    avgRating: avgRating.toFixed(1),
    novels: novelsWithTag.slice(0, 10), // 최대 10개
  };
}

export async function handleTagEditModalSave(tag, changes, currentState, setters) {
  const {
    tagSentiments,
    pinnedTags,
    hiddenTags,
    userMajorGenres,
    userSubGenres,
  } = currentState;

  const {
    setTagSentiments,
    setPinnedTags,
    setHiddenTags,
    setUserMajorGenres,
    setUserSubGenres,
  } = setters;

  // 감정 변경
  if (changes.sentiment !== undefined) {
    const updated = { ...(tagSentiments || {}), [tag]: changes.sentiment };
    setTagSentiments(updated);
    await setAppMeta("tag_sentiments", updated);
  }

  // 고정 변경
  if (changes.pinned !== undefined) {
    if (changes.pinned) {
      await togglePinTag(tag, pinnedTags, setPinnedTags, hiddenTags, setHiddenTags);
    } else if ((pinnedTags || []).includes(tag)) {
      await togglePinTag(tag, pinnedTags, setPinnedTags, hiddenTags, setHiddenTags);
    }
  }

  // 숨김 변경
  if (changes.hidden !== undefined) {
    if (changes.hidden !== (hiddenTags || []).includes(tag)) {
      await toggleHideTag(tag, hiddenTags, setHiddenTags);
    }
  }

  // 대장르 승격
  if (changes.promoteToMajor) {
    await toggleTagMajor(tag, userMajorGenres, setUserMajorGenres);
  }

  // 소장르 승격
  if (changes.promoteToSub) {
    await toggleTagSub(tag, userSubGenres, setUserSubGenres);
  }
}

export async function handleEditCoordinate(tag, systemId, value, coordinateSystems, setCoordinateSystems) {
  const systems = { ...(coordinateSystems || {}) };
  
  if (!systems[systemId]) {
    systems[systemId] = { values: {} };
  }
  
  systems[systemId].values[tag] = value;
  
  setCoordinateSystems(systems);
  await setAppMeta("coordinate_systems", systems);
}

export async function promoteToMajorGenre(tag, userMajorGenres, setUserMajorGenres) {
  if ([...MAJOR_GENRES, ...(userMajorGenres || [])].includes(tag)) {
    return; // 이미 대장르
  }
  
  const updated = [...(userMajorGenres || []), tag];
  setUserMajorGenres(updated);
  await setAppMeta("user_major_genres", updated);
}

export async function promoteToSubGenre(tag, userSubGenres, setUserSubGenres) {
  if ([...SUB_GENRES, ...(userSubGenres || [])].includes(tag)) {
    return; // 이미 소장르
  }
  
  const updated = [...(userSubGenres || []), tag];
  setUserSubGenres(updated);
  await setAppMeta("user_sub_genres", updated);
}

export function getActualTagSentiment(tag, tagSentiments, tagRelations) {
  // 직접 설정된 감정이 있으면 반환
  if (tagSentiments && tagSentiments[tag] !== undefined) {
    return tagSentiments[tag];
  }

  // 부모 그룹의 감정 확인
  const groups = tagRelations?.groups || {};
  for (const group of Object.values(groups)) {
    if (group.tags?.includes(tag) && tagSentiments?.[group.name] !== undefined) {
      return tagSentiments[group.name];
    }
  }

  return 0; // 기본값 (중립)
}

// ═══════════════════════════════════════════════════════════════
// 📌 tagRelationHandlers
// ═══════════════════════════════════════════════════════════════



export function getTagGroupInfo(tag, tagRelations) {
  const groups = tagRelations?.groups || {};
  for (const [groupId, group] of Object.entries(groups)) {
    if (group.tags?.includes(tag)) {
      return { groupId, group };
    }
  }
  return null;
}

export function getSimilarTags(tag, tagRelations) {
  const info = getTagGroupInfo(tag, tagRelations);
  if (!info || info.group.type !== 'similar') return [];
  return info.group.tags.filter(t => t !== tag);
}

export function getOppositeTags(tag, tagRelations) {
  const info = getTagGroupInfo(tag, tagRelations);
  if (!info) return [];
  
  const groups = tagRelations?.groups || {};
  
  // similar 그룹이면 연결된 opposite 그룹의 태그들 반환
  if (info.group.type === 'similar' && info.group.oppositeGroupId) {
    const oppositeGroup = groups[info.group.oppositeGroupId];
    return oppositeGroup?.tags || [];
  }
  
  // opposite 그룹이면 연결된 similar 그룹의 태그들 반환
  if (info.group.type === 'opposite' && info.group.relatedGroupId) {
    const relatedGroup = groups[info.group.relatedGroupId];
    return relatedGroup?.tags || [];
  }
  
  return [];
}

export function findSimilarGroupKey(tag, tagRelations) {
  const groups = tagRelations?.groups || {};
  for (const [key, group] of Object.entries(groups)) {
    if (group.type === 'similar' && group.tags?.includes(tag)) {
      return key;
    }
  }
  return null;
}

export async function createTagGroup(name, type, tags, relatedGroupId, tagRelations) {
  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newGroup = {
    name,
    type,
    tags: tags || [],
    createdAt: Date.now(),
  };
  
  if (type === 'opposite' && relatedGroupId) {
    newGroup.relatedGroupId = relatedGroupId;
  }
  
  const updated = {
    ...tagRelations,
    groups: {
      ...(tagRelations?.groups || {}),
      [groupId]: newGroup,
    },
  };
  
  // opposite 그룹을 생성했으면 related similar 그룹에도 연결
  if (type === 'opposite' && relatedGroupId && updated.groups[relatedGroupId]) {
    updated.groups[relatedGroupId].oppositeGroupId = groupId;
  }
  
  await setAppMeta("tag_relations", updated);
  return { groupId, updated };
}

export async function addTagToGroup(groupId, tag, tagRelations) {
  const groups = tagRelations?.groups || {};
  const group = groups[groupId];
  
  if (!group) {
    throw new Error("그룹을 찾을 수 없습니다.");
  }
  
  if (group.tags?.includes(tag)) {
    return tagRelations; // 이미 존재
  }
  
  // 다른 그룹에서 먼저 제거
  const updated = { ...tagRelations, groups: { ...groups } };
  for (const [gid, g] of Object.entries(updated.groups)) {
    if (g.tags?.includes(tag)) {
      updated.groups[gid] = {
        ...g,
        tags: g.tags.filter(t => t !== tag),
      };
    }
  }
  
  // 대상 그룹에 추가
  updated.groups[groupId] = {
    ...group,
    tags: [...(group.tags || []), tag],
  };
  
  await setAppMeta("tag_relations", updated);
  return updated;
}

export async function removeTagFromGroup(groupId, tag, tagRelations) {
  const groups = tagRelations?.groups || {};
  const group = groups[groupId];
  
  if (!group) return tagRelations;
  
  const updated = {
    ...tagRelations,
    groups: {
      ...groups,
      [groupId]: {
        ...group,
        tags: (group.tags || []).filter(t => t !== tag),
      },
    },
  };
  
  await setAppMeta("tag_relations", updated);
  return updated;
}

export async function deleteTagGroup(groupId, tagRelations) {
  const groups = { ...(tagRelations?.groups || {}) };
  const group = groups[groupId];
  
  if (!group) return tagRelations;
  
  // opposite 그룹이면 연결된 similar 그룹에서 참조 제거
  if (group.relatedGroupId && groups[group.relatedGroupId]) {
    delete groups[group.relatedGroupId].oppositeGroupId;
  }
  
  // similar 그룹이면 연결된 opposite 그룹도 삭제
  if (group.oppositeGroupId && groups[group.oppositeGroupId]) {
    delete groups[group.oppositeGroupId];
  }
  
  delete groups[groupId];
  
  const updated = { ...tagRelations, groups };
  await setAppMeta("tag_relations", updated);
  return updated;
}

export function analyzeUpsetCauses(winner, loser, tagRelations) {
  const causes = [];
  
  const winnerTags = (winner.tags || "").split(",").map(t => t.trim()).filter(Boolean);
  const loserTags = (loser.tags || "").split(",").map(t => t.trim()).filter(Boolean);
  
  // 1) 태그 관계 기반 분석
  for (const wTag of winnerTags) {
    const opposites = getOppositeTags(wTag, tagRelations);
    for (const lTag of loserTags) {
      if (opposites.includes(lTag)) {
        causes.push({
          type: 'opposite_tags',
          winnerTag: wTag,
          loserTag: lTag,
          description: `${wTag}(승) vs ${lTag}(패) 상반된 태그`,
        });
      }
    }
  }
  
  // 2) 작가 선호도 분석
  if (winner.author && winner.author === loser.author) {
    causes.push({
      type: 'same_author',
      author: winner.author,
      description: `같은 작가(${winner.author}) 내 선호도 차이`,
    });
  }
  
  return causes;
}

export async function updateUpsetFactors(causes, insight, currentFactors) {
  const factors = { ...currentFactors };
  
  for (const cause of causes) {
    if (cause.type === 'opposite_tags') {
      factors.oppositeTagMatches = (factors.oppositeTagMatches || 0) + 1;
    } else if (cause.type === 'same_author') {
      factors.sameAuthorUpsets = (factors.sameAuthorUpsets || 0) + 1;
    }
  }
  
  if (insight) {
    factors.lastInsight = insight;
    factors.insightCount = (factors.insightCount || 0) + 1;
  }
  
  await setAppMeta("upset_factors", factors);
  return factors;
}
