/**
 * 상수 모듈 진입점 (통합 2파일)
 * @module constants
 *
 * config.js: 테마, 옵션, 티어, 수상
 * tags.js:   태그 시스템
 */

// config.js (theme + options + awards + tiers 통합)
export {
  LightTheme, DarkTheme,
  PLATFORM_OPTIONS, PLATFORM_URLS,
  STATUS_OPTIONS, STATUS_MAP, WORK_STATUS_OPTIONS, WORK_STATUS_MAP,
  GAIDEN_STATUS_OPTIONS, GAIDEN_STATUS_MAP, GENRE_OPTIONS,
  TIER_ORDER, DEFAULT_TIER_THRESHOLDS, TIER_COLORS,
  DEFAULT_RATING, DEFAULT_RD, MIN_RD, DEFAULT_SETTINGS,
  DEFAULT_AWARD_TEMPLATE, DEFAULT_AWARD_SYSTEM_SETTINGS, AWARD_META,
  getAwardYears, getAwardMeta, buildAwardMetaMap, parseAwards,
  awardsToSearchText, awardsToShortText,
} from './config';

// tags.js
export {
  MAJOR_GENRES, SUB_GENRES, CHARACTER_CATEGORIES,
  COMBO_TAG_TARGETS, COMBO_TAG_TRAITS,
  TAG_SENTIMENT, DEFAULT_TAG_SENTIMENTS, SENTIMENT_COLORS,
  GENERAL_TAGS, ALL_GENERAL_TAGS, ALL_DEFAULT_TAGS,
  MAJOR_GENRE_COLORS, SUB_GENRE_COLORS,
  TAG_ALIASES, TAG_REVERSE_ALIASES,
  TAG_SPECTRUM_GROUPS, DEFAULT_COORDINATE_SYSTEMS, WORK_IDENTIFIERS,
  getTagSentiment, isTagMajor, isTagSub, getAllMajorTags, getAllSubTags,
  isComboTag, parseComboTag, createComboTag,
  deduplicateTags, getAllDefaultTagsDeduped,
  parseMajorSub, countTagUsage, sortTagsByUsage, detectGenres,
  normalizeTag, expandTagForSearch,
  parseTagData, tagDataToString, tagsStringToTagData,
  analyzeSpectrum, isWorkIdentifier, parseNovelAliases,
  calculateTagSimilarity, interpretCoordinate,
  categorizeRelation, getRelationLabel, getTagRelation,
  getTagFullInfo, analyzeCoordinatePreference,
} from './tags';

// 유틸리티 함수 re-export (handlers 호환)
export { deriveMajorGenre, computeReliability, tierFromRating } from '../utils/helpers';
export { tierBadge, getTierColor, TierTag } from '../components/common/ui';
