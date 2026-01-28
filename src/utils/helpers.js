/**
 * 유틸리티 함수 모음
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 여러 곳
 * 
 * 사용법:
 * import { uuid, pairKey, parsePlatforms, ... } from './src/utils';
 */

// ═══════════════════════════════════════════════════════════════
// 🔧 UUID 생성 (타임스탬프 + 카운터로 중복 방지)
// ═══════════════════════════════════════════════════════════════
let uuidCounter = 0;
export function uuid() {
  const timestamp = Date.now().toString(36);
  const counter = (uuidCounter++ % 1000).toString(36).padStart(3, '0');
  const random = "xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return `${timestamp}${counter}-${random}`;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 안전한 JSON 파싱
// ═══════════════════════════════════════════════════════════════
export function safeParseJSON(str, defaultValue = null) {
  if (!str) return defaultValue;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔧 매칭 페어 키 생성 (정렬된 조합)
// ═══════════════════════════════════════════════════════════════
export const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// ═══════════════════════════════════════════════════════════════
// 🔧 플랫폼 관련 헬퍼
// ═══════════════════════════════════════════════════════════════
export function parsePlatforms(p) {
  try { 
    const arr = JSON.parse(p || "[]"); 
    return Array.isArray(arr) ? arr : []; 
  } catch { 
    return []; 
  }
}

// 플랫폼 요약 표시 (첫 번째만 + 나머지 개수)
export function formatPlatformShort(platforms) {
  const plats = typeof platforms === "string" ? parsePlatforms(platforms) : (platforms || []);
  if (!plats.length) return "-";
  if (plats.length === 1) return plats[0];
  return `${plats[0]} +${plats.length - 1}`;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 승률 계산
// ═══════════════════════════════════════════════════════════════
export function getWinRate(wins, losses) {
  const total = (wins || 0) + (losses || 0);
  return total > 0 ? ((wins || 0) / total * 100).toFixed(1) : "-";
}

// ═══════════════════════════════════════════════════════════════
// 🔧 신규 작품 여부 (등록 후 한달 이내)
// ═══════════════════════════════════════════════════════════════
export function isNewNovel(createdAt) {
  if (!createdAt) return false;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return createdAt > oneMonthAgo;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 장르 파싱 헬퍼
// ═══════════════════════════════════════════════════════════════
// JSON 배열 또는 단일 문자열 → 배열
export function parseGenreArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return value ? [value] : [];
  }
}

// 장르 첫 번째 값 가져오기 (카드 표시용)
export function getFirstGenre(value) {
  const arr = parseGenreArray(value);
  return arr.length > 0 ? arr[0] : "";
}
