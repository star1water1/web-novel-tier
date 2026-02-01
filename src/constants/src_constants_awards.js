/**
 * 수상 시스템 상수
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 5586-5596
 * 
 * 사용법:
 * import { AWARD_META, parseAwards, awardsToSearchText } from './src/constants';
 */

// ═══════════════════════════════════════════════════════════════
// 🏆 레거시 수상 메타데이터 (하위 호환)
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// 🏆 수상 파싱 (동적 상 지원)
// ═══════════════════════════════════════════════════════════════
export function parseAwards(json, awardSystemSettings = null) {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((a) => ({
        year: a.year,
        type: a.type,
      }))
      .filter((a) => {
        if (!a.year || !a.type) return false;
        // 동적 설정에서 찾기
        if (awardSystemSettings?.yearlyAwards?.[a.year]) {
          const found = awardSystemSettings.yearlyAwards[a.year].find(aw => aw.id === a.type);
          if (found) return true;
        }
        // 레거시 AWARD_META에서 찾기
        return !!AWARD_META[a.type];
      });
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 🏆 수상 정보 검색 텍스트 변환
// ═══════════════════════════════════════════════════════════════
export function awardsToSearchText(awardsJson) {
  const items = parseAwards(awardsJson);
  if (!items.length) return "";
  const parts = [];
  for (const a of items) {
    const meta = AWARD_META[a.type];
    if (!meta) continue;
    parts.push(String(a.year));
    parts.push(meta.label);
  }
  parts.push("수상");
  return parts.join(" ");
}

// ═══════════════════════════════════════════════════════════════
// 🏆 수상 정보 짧은 텍스트 (CSV용)
// ═══════════════════════════════════════════════════════════════
export function awardsToShortText(awardsJson) {
  const items = parseAwards(awardsJson);
  if (!items.length) return "";
  return items
    .map((a) => {
      const meta = AWARD_META[a.type];
      const label = meta ? meta.label : a.type;
      return `${a.year} ${label}`;
    })
    .join(" / ");
}
