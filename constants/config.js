/**
 * 앱 설정 통합 상수
 * @module constants/config
 * @merged theme.js + options.js + awards.js + tiers.js
 *
 * @exports 테마: LightTheme, DarkTheme
 * @exports 옵션: PLATFORM_OPTIONS, PLATFORM_URLS, STATUS_OPTIONS, STATUS_MAP,
 *   WORK_STATUS_OPTIONS, WORK_STATUS_MAP, GAIDEN_STATUS_OPTIONS, GAIDEN_STATUS_MAP, GENRE_OPTIONS
 * @exports 티어: TIER_ORDER, DEFAULT_TIER_THRESHOLDS, TIER_COLORS,
 *   DEFAULT_RATING, DEFAULT_RD, MIN_RD, DEFAULT_SETTINGS
 * @exports 수상: DEFAULT_AWARD_TEMPLATE, DEFAULT_AWARD_SYSTEM_SETTINGS, AWARD_META,
 *   getAwardYears, getAwardMeta, buildAwardMetaMap, parseAwards,
 *   awardsToSearchText, awardsToShortText
 */

// ═══════════════════════════════════════════════════════════════
// 📌 테마 (원본 theme.js)
// ═══════════════════════════════════════════════════════════════

export const LightTheme = {
  bg: "#F5F7FB",
  card: "#fff",
  line: "#E7EEF6",
  text: "#0B1220",
  sub: "#6B7A90",
  primary: "#2D6AE3",
  warn: "#E05252",
  ok: "#0AA06E",
  chip: "#EEF4FF",
  s: "#8b5cf6",
  a: "#3b82f6",
  bp: "#22c55e",
  b: "#a3e635",
  bm: "#f59e0b",
  c: "#ef4444",
  overlay: "rgba(255,255,255,0.85)",
  modal: "rgba(0,0,0,0.4)",
};

export const DarkTheme = {
  bg: "#0f172a",
  card: "#1e293b",
  line: "#334155",
  text: "#f1f5f9",
  sub: "#94a3b8",
  primary: "#3b82f6",
  warn: "#ef4444",
  ok: "#22c55e",
  chip: "#334155",
  s: "#a78bfa",
  a: "#60a5fa",
  bp: "#4ade80",
  b: "#bef264",
  bm: "#fbbf24",
  c: "#f87171",
  overlay: "rgba(15,23,42,0.85)",
  modal: "rgba(0,0,0,0.6)",
};

// ═══════════════════════════════════════════════════════════════
// 📌 플랫폼 및 상태 옵션 (원본 options.js)
// ═══════════════════════════════════════════════════════════════

export const PLATFORM_OPTIONS = ["문피아", "리디", "카카페", "노벨피아", "시리즈"];

export const PLATFORM_URLS = {
  "문피아": "https://www.munpia.com",
  "리디": "https://ridibooks.com",
  "카카페": "https://page.kakao.com",
  "노벨피아": "https://novelpia.com",
  "시리즈": "https://series.naver.com",
};

export const STATUS_OPTIONS = [
  { key: "reading", label: "읽는 중", color: "#3b82f6" },
  { key: "completed", label: "완독", color: "#22c55e" },
  { key: "dropped", label: "중단", color: "#ef4444" },
  { key: "planned", label: "예정", color: "#a855f7" },
];
export const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.key, s]));

export const WORK_STATUS_OPTIONS = [
  { key: "ongoing", label: "연재중", color: "#3b82f6" },
  { key: "completed", label: "완결", color: "#22c55e" },
  { key: "hiatus", label: "휴재", color: "#f59e0b" },
  { key: "dropped", label: "연중", color: "#ef4444" },
  { key: "discontinued", label: "서비스종료", color: "#6b7280" },
];
export const WORK_STATUS_MAP = Object.fromEntries(WORK_STATUS_OPTIONS.map(s => [s.key, s]));

export const GAIDEN_STATUS_OPTIONS = [
  { key: "none", label: "외전없음", color: "#9ca3af" },
  { key: "ongoing", label: "외전연재중", color: "#3b82f6" },
  { key: "completed", label: "외전완결", color: "#22c55e" },
];
export const GAIDEN_STATUS_MAP = Object.fromEntries(GAIDEN_STATUS_OPTIONS.map(s => [s.key, s]));

export const GENRE_OPTIONS = ["무협", "선협", "현판", "현대", "로판", "로맨스", "판타지", "SF"];

// ═══════════════════════════════════════════════════════════════
// 📌 티어 시스템 (원본 tiers.js)
// ═══════════════════════════════════════════════════════════════

export const TIER_ORDER = ["S", "A", "B+", "B", "B-", "C"];

export const DEFAULT_TIER_THRESHOLDS = {
  S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500,
};

export const TIER_COLORS = {
  S: "#8b5cf6", A: "#3b82f6", "B+": "#22c55e",
  B: "#a3e635", "B-": "#f59e0b", C: "#ef4444",
};

export const DEFAULT_RATING = 1500;
export const DEFAULT_RD = 350;
export const MIN_RD = 60;

export const DEFAULT_SETTINGS = {
  tierThresholds: { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 },
  autoApproveEnabled: false,
  autoApproveMinWins: 10,
  autoApproveMaxLosses: 3,
  autoApproveMinMatches: 15,
  showReviewBanner: true,
  undoStackSize: 30,
  fullscreenMode: false,
  supplement: {
    enabled: true, minTags: 5, requireAuthor: true, requireTotalEpisodes: true,
    requireReadCount: true, requireMajorGenre: true, requireSubGenre: false,
    requirePlatform: true, excludeNegativeTagCount: 2, excludeTags: ["취향아님"],
  },
  recentChanges: {
    retentionDays: 30, showNewRegistration: true, showAward: true,
    showTierChange: true, showTierReview: true, showReadCountIncrease: true,
  },
  plannedFields: {
    showExpectedRating: false, showScheduledStart: true, showSimilarNovels: false,
  },
  coverLibrary: { compressionLevel: "light" },
};

// ═══════════════════════════════════════════════════════════════
// 📌 수상 시스템 (원본 awards.js)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_AWARD_TEMPLATE = [
  { id: "grand", name: "대상", count: 1, tierMin: "S", matchTags: [], color: "#f97316", icon: "🏆" },
  { id: "best_fantasy", name: "베스트 판타지", count: 1, tierMin: null, matchTags: ["판타지", "하이판타지", "마법", "정령"], color: "#6366f1", icon: "🐉" },
  { id: "best_modern", name: "베스트 현판", count: 1, tierMin: null, matchTags: ["현판", "현대판타지", "헌터", "던전", "게이트"], color: "#0ea5e9", icon: "⚡" },
  { id: "best_murim", name: "베스트 무협", count: 1, tierMin: null, matchTags: ["무협", "신무협", "무림", "강호"], color: "#dc2626", icon: "⚔️" },
  { id: "best_romance", name: "베스트 로맨스", count: 1, tierMin: null, matchTags: ["로판", "로맨스", "현로", "BL", "GL"], color: "#ec4899", icon: "💕" },
  { id: "best_sf", name: "베스트 SF", count: 1, tierMin: null, matchTags: ["SF", "사이버펑크", "우주", "타임루프"], color: "#14b8a6", icon: "🚀" },
  { id: "complete", name: "완결작 상", count: 1, tierMin: null, matchTags: [], color: "#22c55e", icon: "📚" },
  { id: "rising", name: "신인상", count: 1, tierMin: null, matchTags: [], color: "#8b5cf6", icon: "🌟" },
  { id: "pick", name: "내 취향픽", count: 3, tierMin: null, matchTags: [], color: "#f43f5e", icon: "❤️" },
];

export const DEFAULT_AWARD_SYSTEM_SETTINGS = {
  yearlyAwards: { "2024": DEFAULT_AWARD_TEMPLATE.map(a => ({ ...a })) },
  candidateInfo: "해당 연도에 완결되었거나 연재 시작한 작품"
};

export const AWARD_META = {
  grand: { label: "대상", color: "#f97316" },
  best_fantasy: { label: "베스트 판타지", color: "#6366f1" },
  best_modern: { label: "베스트 현대", color: "#0ea5e9" },
  best_sf: { label: "베스트 SF", color: "#14b8a6" },
  complete: { label: "완결작 상", color: "#22c55e" },
  pick: { label: "내 취향 추천픽", color: "#ec4899" },
  best_murim: { label: "베스트 무협", color: "#dc2626" },
  best_romance: { label: "베스트 로맨스", color: "#ec4899" },
  rising: { label: "신인상", color: "#8b5cf6" },
};

export function getAwardYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) years.push(String(y));
  return years;
}

export function getAwardMeta(awardSystemSettings, year, awardId) {
  const yearSettings = awardSystemSettings?.yearlyAwards?.[year];
  if (!yearSettings) return null;
  return yearSettings.find(a => a.id === awardId);
}

export function buildAwardMetaMap(awardSystemSettings) {
  const map = {};
  if (!awardSystemSettings?.yearlyAwards) return map;
  for (const [year, awards] of Object.entries(awardSystemSettings.yearlyAwards)) {
    for (const award of awards) {
      if (!map[award.id]) map[award.id] = { label: award.name, color: award.color, icon: award.icon };
    }
  }
  return map;
}

export function parseAwards(json, awardSystemSettings = null) {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((a) => ({ year: a.year, type: a.type }))
      .filter((a) => {
        if (!a.year || !a.type) return false;
        if (awardSystemSettings?.yearlyAwards?.[a.year]) {
          const found = awardSystemSettings.yearlyAwards[a.year].find(aw => aw.id === a.type);
          if (found) return true;
        }
        return !!AWARD_META[a.type];
      });
  } catch { return []; }
}

export function awardsToSearchText(awardsJson, awardSystemSettings = null) {
  const items = parseAwards(awardsJson, awardSystemSettings);
  if (!items.length) return "";
  const parts = [];
  for (const a of items) {
    let meta = null;
    if (awardSystemSettings?.yearlyAwards?.[a.year]) {
      const found = awardSystemSettings.yearlyAwards[a.year].find(aw => aw.id === a.type);
      if (found) meta = { label: found.name };
    }
    if (!meta) meta = AWARD_META[a.type];
    if (!meta) continue;
    parts.push(String(a.year));
    parts.push(meta.label);
  }
  parts.push("수상");
  return parts.join(" ");
}

export function awardsToShortText(awardsJson, awardSystemSettings = null) {
  const items = parseAwards(awardsJson, awardSystemSettings);
  if (!items.length) return "";
  return items
    .map((a) => {
      let meta = null;
      if (awardSystemSettings?.yearlyAwards?.[a.year]) {
        const found = awardSystemSettings.yearlyAwards[a.year].find(aw => aw.id === a.type);
        if (found) meta = { label: found.name };
      }
      if (!meta) meta = AWARD_META[a.type];
      const label = meta ? meta.label : a.type;
      return `${a.year} ${label}`;
    })
    .join(" / ");
}
