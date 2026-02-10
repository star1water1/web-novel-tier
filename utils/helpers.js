/**
 * 순수 유틸 헬퍼 함수
 * @module utils/helpers
 * 
 * @source_origin 원본 App.jsx 다양한 위치
 * 
 * @description
 * 외부 의존성 없이 동작하는 순수 함수들
 * - uuid: 고유 ID 생성
 * - safeParseJSON: 안전한 JSON 파싱
 * - parsePlatforms: 플랫폼 JSON 파싱
 * - getWinRate: 승률 계산
 * - isNewNovel: 신규 작품 여부
 * - formatFileSize: 파일 크기 포맷
 * - pairKey: 페어 키 생성
 * - 기타 통계/분석 헬퍼 함수
 */

import { TIER_ORDER } from '../constants/config';

// ═══════════════════════════════════════════════════════════════
// 📌 ID 생성
// ═══════════════════════════════════════════════════════════════

// 🔧 v3.4.6: 타임스탬프 + 카운터로 중복 방지 강화
let uuidCounter = 0;

/**
 * UUID 생성 (중복 방지 강화)
 * @returns {string} 고유 ID
 */
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
// 📌 JSON 파싱
// ═══════════════════════════════════════════════════════════════

/**
 * 안전한 JSON 파싱
 * @param {string} str - JSON 문자열
 * @param {*} defaultValue - 파싱 실패 시 기본값
 * @returns {*} 파싱된 값 또는 기본값
 */
export function safeParseJSON(str, defaultValue = null) {
  if (!str) return defaultValue;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * 플랫폼 JSON 파싱
 * @param {string} p - 플랫폼 JSON 문자열
 * @returns {string[]} 플랫폼 배열
 */
export function parsePlatforms(p) {
  try {
    const arr = JSON.parse(p || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * 플랫폼 요약 표시 (첫 번째만 + 나머지 개수)
 * @param {string|string[]} platforms - 플랫폼
 * @returns {string} 요약 문자열
 */
export function formatPlatformShort(platforms) {
  const plats = typeof platforms === "string" ? parsePlatforms(platforms) : (platforms || []);
  if (!plats.length) return "-";
  if (plats.length === 1) return plats[0];
  return `${plats[0]} +${plats.length - 1}`;
}

/**
 * 플랫폼 텍스트 변환 (CSV용)
 * @param {string|string[]} p - 플랫폼
 * @returns {string} 쉼표로 구분된 문자열
 */
export function platformsToText(p) {
  if (!p) return "";
  try {
    const arr = JSON.parse(p);
    if (Array.isArray(arr)) return arr.join(", ");
  } catch {}
  if (Array.isArray(p)) return p.join(", ");
  return String(p);
}

/**
 * 장르 배열 파싱 (JSON 배열 또는 단일 문자열 → 배열)
 * @param {string|string[]} value - 장르 값
 * @returns {string[]} 장르 배열
 */
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

/**
 * 첫 번째 장르 가져오기 (카드 표시용)
 * @param {string|string[]} value - 장르 값
 * @returns {string} 첫 번째 장르 또는 빈 문자열
 */
export function getFirstGenre(value) {
  const arr = parseGenreArray(value);
  return arr.length > 0 ? arr[0] : "";
}

// ═══════════════════════════════════════════════════════════════
// 📌 통계/계산 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 승률 계산
 * @param {number} wins - 승수
 * @param {number} losses - 패수
 * @returns {string} 승률 (%) 또는 "-"
 */
export function getWinRate(wins, losses) {
  const total = (wins || 0) + (losses || 0);
  return total > 0 ? ((wins || 0) / total * 100).toFixed(1) : "-";
}

/**
 * 등록 후 한달 이내인지 확인
 * @param {number} createdAt - 생성 타임스탬프
 * @returns {boolean} 신규 여부
 */
export function isNewNovel(createdAt) {
  if (!createdAt) return false;
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return createdAt > oneMonthAgo;
}

/**
 * 읽은 비율 계산
 * @param {object} novel - 작품 객체
 * @returns {number} 0~1 사이 비율
 */
export function calculateReadRatio(novel) {
  const read = Number(novel.read_count) || 0;
  const total = Number(novel.total_episodes) || 0;
  if (total <= 0) return 0.5;  // 모르면 중립
  return Math.min(1, read / total);
}

/**
 * 레이팅 갭 버킷 생성
 * @param {number} gap - 레이팅 차이
 * @returns {string} 버킷 이름
 */
export function getGapBucket(gap) {
  if (gap < 50) return "tiny";      // 0-49
  if (gap < 100) return "small";    // 50-99
  if (gap < 200) return "medium";   // 100-199
  if (gap < 300) return "large";    // 200-299
  return "huge";                     // 300+
}

/**
 * 윌슨 신뢰구간 계산 (통계적 유의성)
 * @param {number} successes - 성공 횟수
 * @param {number} total - 전체 횟수
 * @param {number} confidence - 신뢰 수준 (기본: 0.95)
 * @returns {object} { lower, upper }
 */
export function wilsonConfidenceInterval(successes, total, confidence = 0.95) {
  if (total === 0) return { lower: 0, upper: 1 };
  
  const z = confidence === 0.95 ? 1.96 : 1.645;
  const p = successes / total;
  const n = total;
  
  const denominator = 1 + z * z / n;
  const center = p + z * z / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n);
  
  return {
    lower: Math.max(0, (center - spread) / denominator),
    upper: Math.min(1, (center + spread) / denominator),
  };
}

// ═══════════════════════════════════════════════════════════════
// 📌 티어 관련
// ═══════════════════════════════════════════════════════════════

/**
 * 티어 차이 계산 (양수면 A가 높음)
 * @param {string} tierA - 티어 A
 * @param {string} tierB - 티어 B
 * @returns {number} 차이 (양수: A가 높음, 음수: B가 높음)
 */
export function getTierDiff(tierA, tierB) {
  const idxA = TIER_ORDER.indexOf(tierA);
  const idxB = TIER_ORDER.indexOf(tierB);
  if (idxA === -1 || idxB === -1) return 0;
  return idxB - idxA;
}

/**
 * 티어가 더 높은지 확인
 * @param {string} tierA - 비교할 티어
 * @param {string} tierB - 기준 티어
 * @returns {boolean} tierA가 tierB보다 높으면 true
 */
export function isTierHigher(tierA, tierB) {
  return getTierDiff(tierA, tierB) > 0;
}

/**
 * 레이팅 기반 티어 계산
 * @param {number} r - 레이팅
 * @param {object} thresholds - 티어 임계값 객체
 * @returns {string} 티어 (S, A, B+, B, B-, C)
 */
export function tierFromRating(r, thresholds = { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 }) {
  if (r >= thresholds.S) return "S";
  if (r >= thresholds.A) return "A";
  if (r >= thresholds["B+"]) return "B+";
  if (r >= thresholds.B) return "B";
  if (r >= thresholds["B-"]) return "B-";
  return "C";
}

/**
 * 티어 순위 비교용 (S=0, A=1, ... C=5)
 * @param {string} tier - 티어
 * @returns {number} 순위 (낮을수록 높은 티어)
 */
export function tierRank(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? 5 : idx;
}

// ═══════════════════════════════════════════════════════════════
// 📌 키/ID 생성
// ═══════════════════════════════════════════════════════════════

/**
 * 페어 키 생성 (정렬된 형태로 일관성 유지)
 * @param {string} a - ID A
 * @param {string} b - ID B
 * @returns {string} 정렬된 페어 키
 */
export function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * 장르 매치업 키 생성 (알파벳 순 정렬로 일관성)
 * @param {string} genreA - 장르 A
 * @param {string} genreB - 장르 B
 * @returns {string|null} 매치업 키 또는 null
 */
export function createGenreMatchupKey(genreA, genreB) {
  if (!genreA || !genreB) return null;
  if (genreA === genreB) return null;
  const sorted = [genreA, genreB].sort();
  return `${sorted[0]}_vs_${sorted[1]}`;
}

/**
 * 공통 태그 찾기
 * @param {string[]} tagsA - 태그 배열 A
 * @param {string[]} tagsB - 태그 배열 B
 * @returns {string[]} 공통 태그 배열
 */
export function findSharedTags(tagsA, tagsB) {
  if (!tagsA || !tagsB) return [];
  const setB = new Set(tagsB.map(t => t.toLowerCase()));
  return tagsA.filter(t => setB.has(t.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════
// 📌 포맷팅
// ═══════════════════════════════════════════════════════════════

/**
 * 파일 크기 포맷팅
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 문자열
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

/**
 * CSV 이스케이프
 * @param {*} v - 값
 * @returns {string} 이스케이프된 문자열
 */
export function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const needQuote = /[",\r\n\t]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needQuote ? `"${escaped}"` : escaped;
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 * @param {number} timestamp - 타임스탬프
 * @returns {string} 포맷된 날짜
 */
export function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 상대 시간 포맷팅 (몇 분 전, 몇 시간 전 등)
 * @param {number} timestamp - 타임스탬프
 * @returns {string} 상대 시간
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return "-";
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

// ═══════════════════════════════════════════════════════════════
// 📌 신뢰도 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 신뢰도 계산
 * (읽은 회차수 / 전체 회차수) * (진행된 매칭수 / 해당 작품의 전체 가능 매칭수) * 100
 * @param {object} novel - 작품 객체
 * @param {number} totalNovelCount - 전체 작품 수
 * @returns {number} 신뢰도 (0~100)
 */
export function computeReliability(novel, totalNovelCount) {
  const totalEpisodes = Number(novel.total_episodes) || 0;
  const readCount = Number(novel.read_count) || 0;
  const matchCount = Number(novel.match_count) || 0;
  const maxMatchForNovel = Math.max(0, totalNovelCount - 1);

  if (totalEpisodes <= 0 || maxMatchForNovel <= 0) return 0;

  const readRatio = Math.min(1, readCount / totalEpisodes);
  const matchRatio = Math.min(1, matchCount / maxMatchForNovel);

  return readRatio * matchRatio * 100;
}

// ═══════════════════════════════════════════════════════════════
// 📌 배열/객체 유틸
// ═══════════════════════════════════════════════════════════════

/**
 * 배열 섞기 (Fisher-Yates 알고리즘)
 * @param {Array} array - 원본 배열
 * @returns {Array} 섞인 새 배열
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 배열에서 랜덤 요소 선택
 * @param {Array} array - 배열
 * @returns {*} 랜덤 요소
 */
export function randomPick(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 객체 깊은 복사
 * @param {object} obj - 원본 객체
 * @returns {object} 복사된 객체
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 두 객체 깊은 병합
 * @param {object} target - 대상 객체
 * @param {object} source - 소스 객체
 * @returns {object} 병합된 객체
 */
export function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// 📌 티어 관련 추가 함수들 (원본 14572-14644줄)
// ═══════════════════════════════════════════════════════════════

/**
 * 실제 표시 티어 계산 (manual_tier 고려)
 * S/A 티어는 검토를 통해서만 진입 가능
 */
export function getDisplayTier(novel, thresholds = { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 }) {
  const recommended = tierFromRating(novel.rating || 1500, thresholds);
  
  // S/A 수동 지정이 있으면 그것 사용
  if (novel.manual_tier === 'S' || novel.manual_tier === 'A') {
    return novel.manual_tier;
  }
  
  // 권장 티어가 S/A인데 수동 지정 없으면 B+ 이하 중 최고로 고정
  // (검토를 통해서만 S/A 진입 가능)
  if (recommended === 'S' || recommended === 'A') {
    return 'B+';
  }
  
  // B+ 이하는 점수 기반 자동
  return recommended;
}

/**
 * 검토 상태 확인
 * @returns {{ type: 'promote'|'demote', from: string, to: string } | null}
 */
export function getReviewStatus(novel, thresholds = { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 }) {
  const recommended = tierFromRating(novel.rating || 1500, thresholds);
  const actual = getDisplayTier(novel, thresholds);
  
  // 현재 S/A인데 권장이 더 낮음 → 강등 검토
  if ((actual === 'S' || actual === 'A') && tierRank(recommended) > tierRank(actual)) {
    return { type: 'demote', from: actual, to: recommended };
  }
  
  // 권장이 S/A인데 현재가 더 낮음 → 승급 검토
  if ((recommended === 'S' || recommended === 'A') && tierRank(actual) > tierRank(recommended)) {
    return { type: 'promote', from: actual, to: recommended };
  }
  
  return null; // 검토 불필요
}

/**
 * 태그 문자열에서 대장르 추출
 */
export function deriveMajorGenre(tagsStr) {
  const tags = (tagsStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (tags.length === 0) return "";
  
  const MAP = [
    ["무협", ["무협", "무림", "신무협", "패왕", "검술", "강호", "혈맹", "표국"]],
    ["선협", ["선협", "선계", "수련", "비급", "도법", "장생"]],
    ["현판", ["현판", "현대판타지", "헌터", "게이트", "던전", "각성", "레이드"]],
    ["현대", ["현대", "일상", "학원", "회사", "재벌", "범죄", "스포츠", "연예계"]],
    ["로판", ["로판", "로맨스판타지", "공작", "후작", "황자", "귀족", "궁정"]],
    ["로맨스", ["로맨스", "현로", "연애", "캠퍼스", "BL", "GL"]],
    ["판타지", ["판타지", "하이판타지", "마법", "용", "정령", "왕국", "모험"]],
    ["SF", ["SF", "사이버펑크", "우주", "로봇", "AI", "타임루프", "디스토피아"]],
  ];
  
  const tset = tags.map((t) => t.toLowerCase());
  for (const [label, keys] of MAP) {
    const hit = tset.some((t) =>
      keys.some((k) => t.includes(String(k).toLowerCase()))
    );
    if (hit) return label;
  }
  return "";
}

/**
 * 태그를 사용 횟수 기준으로 정렬
 * @param {string[]} tags - 태그 배열
 * @param {Object} usageCounts - 태그별 사용 횟수 맵
 * @returns {string[]} 정렬된 태그 배열
 */
export function sortTagsByUsage(tags, usageCounts) {
  return [...tags].sort((a, b) => {
    const countA = usageCounts[a] || 0;
    const countB = usageCounts[b] || 0;
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });
}
