/**
 * 핸들러 진입점 (통합 3파일)
 * @module handlers
 *
 * novelHandlers: 작품/표지/예정/유틸
 * matchHandlers: 매칭/분석/인사이트/추천
 * tagHandlers:   태그/태그편집/태그관계
 */

export {
  loadNovelList, addNovel, removeNovel, updateNovel, updateNovelRating, updateNovelAwards,
  checkTitleDuplicate, advancedFilter, getRecentlyEditedNovels, updateTagUsageCounts,
  loadCoverLibrary, importCoversFromGallery, removeCoverFromLibrary, removeAllUnusedCovers,
  updateCoverStatus, selectCoverFromLibrary, applyNovelCover, pickImageFromGallery,
  loadPlannedList, addPlannedNovel, removePlannedNovel, updatePlannedNovel, convertPlannedToNovel,
  shareTierText, batchAddTag, batchRemoveTag, batchSetPlatforms, batchIncReadCount, batchDeleteNovels,
} from './novelHandlers';

export {
  pickRandomUnseenPair, decideMatch, undoLastMatch, deleteMatch, flipMatchWinner,
  getNovelMatchLogs, getHeadToHead, performUndo, checkAutoApprove,
  resetAllMatches, resetAll, loadMatchStats, saveTierHistory,
  generateMatchPrediction, analyzeMatchPrediction, analyzeMatchResult, analyzeGenreMatchup,
  loadMatchInsights, saveMatchInsight,
  loadInsights, handleInsightResponse, recordInsightFeedback,
  loadPreferencePatterns, adjustWeightsFromFeedback,
  refreshDailyRecommendation, loadRecoHistory, addToRecoHistory,
} from './matchHandlers';

export {
  savePinnedTags, saveHiddenTags, saveTagSentiments, saveTagRelations,
  saveCoordinateSystems, saveTagAttributes, setTagSentiment,
  togglePinTag, toggleHideTag, toggleTagMajor, toggleTagSub,
  addCustomTag, removeCustomTag, addCustomTagDirect,
  addComboTag, removeComboTag,
  addCustomComboTrait, removeCustomComboTrait, addCustomComboTarget, removeCustomComboTarget,
  addUserMajorGenre, removeUserMajorGenre, addUserSubGenre, removeUserSubGenre,
  cleanupDuplicateTags,
  handleTagEditModalSave, handleEditCoordinate,
  promoteToMajorGenre, promoteToSubGenre, demoteMajorToCustom, demoteSubToCustom,
  comboToCustomTag, deleteTagGlobally, cleanupUnusedTags, syncCustomTagsFromNovels,
  checkIsTagMajor, checkIsTagSub, getTagUsageStats, getTagCoordinateSystems,
  createTagGroup, deleteTagGroup, addTagToGroup, removeTagFromGroup,
  getSimilarTags, getOppositeTags, findSimilarGroupKey, getTagGroupInfo,
  getActualTagSentiment, analyzeUpsetCauses, updateUpsetFactors,
} from './tagHandlers';
