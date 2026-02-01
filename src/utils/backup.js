/**
 * src/utils/backup.js
 * 백업/복원 관련 순수 함수 모듈
 * 
 * v4.0 Step 30 - 백업 로직 분리
 * 
 * 이 모듈은 DB나 UI에 의존하지 않는 순수 함수들만 포함합니다.
 * exportJSON, importJSON 등 Alert/Share/DB 의존 함수는 App.jsx에 유지됩니다.
 */

import { DEFAULT_SETTINGS } from '../constants/settings';

// ═══════════════════════════════════════════════════════════════
// 🔤 Base64 인코딩/디코딩 (순수 JS)
// ═══════════════════════════════════════════════════════════════

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * 바이트 배열을 Base64 문자열로 인코딩
 * @param {number[]} bytes - 바이트 배열
 * @returns {string} Base64 문자열
 */
export function encodeBase64(bytes) {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    result += B64_CHARS[b1 >> 2];
    result += B64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? B64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < len ? B64_CHARS[b3 & 63] : "=";
  }
  return result;
}

/**
 * Base64 문자열을 바이트 배열로 디코딩
 * @param {string} str - Base64 문자열
 * @returns {number[]} 바이트 배열
 */
export function decodeBase64(str) {
  const bytes = [];
  const len = str.length;
  for (let i = 0; i < len; i += 4) {
    const c1 = B64_CHARS.indexOf(str[i]);
    const c2 = B64_CHARS.indexOf(str[i + 1]);
    const c3 = str[i + 2] === "=" ? 0 : B64_CHARS.indexOf(str[i + 2]);
    const c4 = str[i + 3] === "=" ? 0 : B64_CHARS.indexOf(str[i + 3]);
    bytes.push((c1 << 2) | (c2 >> 4));
    if (str[i + 2] !== "=") bytes.push(((c2 & 15) << 4) | (c3 >> 2));
    if (str[i + 3] !== "=") bytes.push(((c3 & 3) << 6) | c4);
  }
  return bytes;
}

// ═══════════════════════════════════════════════════════════════
// 📊 백업용 상태 매핑 상수 (숫자 인덱스)
// ⚠️ constants/options.js의 STATUS_MAP(객체형)과 다름!
// ═══════════════════════════════════════════════════════════════

/** 읽기 상태 → 숫자 (백업용) */
export const BACKUP_STATUS_MAP = { 
  reading: 0, 
  completed: 1, 
  dropped: 2, 
  planned: 3, 
  onhold: 4 
};

/** 숫자 → 읽기 상태 (복원용) */
export const BACKUP_STATUS_REV = ["reading", "completed", "dropped", "planned", "onhold"];

/** 작품 연재 상태 → 숫자 (백업용) */
export const BACKUP_WORK_STATUS_MAP = { 
  ongoing: 0, 
  completed: 1, 
  hiatus: 2, 
  dropped: 3, 
  discontinued: 4 
};

/** 숫자 → 작품 연재 상태 (복원용) */
export const BACKUP_WORK_STATUS_REV = ["ongoing", "completed", "hiatus", "dropped", "discontinued"];

/** 기준 타임스탬프: 2024-01-01 00:00:00 UTC (초 단위) */
export const BASE_TIMESTAMP = 1704067200;

// ═══════════════════════════════════════════════════════════════
// 📷 표지 이미지 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * URL 이미지만 백업용으로 반환 (로컬 이미지, Base64 제외)
 * @param {string} uri - 이미지 URI
 * @returns {string|null} URL 또는 null
 */
export function getExportableImageUrl(uri) {
  if (!uri) return null;
  
  // URL인 경우만 반환
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  
  // Base64는 용량이 커서 백업에서 제외
  // 로컬 파일도 백업 불가
  return null;
}

/**
 * URL 표지 이미지들 수집 (백업용)
 * @param {Array} novels - 작품 배열
 * @returns {Object} { novelId: imageUrl }
 */
export function collectCoverImageUrls(novels) {
  const coverImages = {};
  
  for (const n of novels) {
    if (!n.cover_image) continue;
    
    const url = getExportableImageUrl(n.cover_image);
    if (url) {
      coverImages[n.id] = url;
    }
  }
  
  return coverImages;
}

// ═══════════════════════════════════════════════════════════════
// 📦 초압축 백업 생성
// ═══════════════════════════════════════════════════════════════

/**
 * 초압축 백업 데이터 생성
 * @param {Array} novels - 작품 배열
 * @param {Array} matches - 매칭 배열
 * @param {Object} [coverImages] - 표지 이미지 맵 (선택)
 * @returns {Object} 압축된 백업 데이터
 */
export function buildUltraCompactBackup(novels, matches, coverImages = null) {
  // 사전 구축
  const tagDict = [], tagIndex = new Map();
  const platDict = [], platIndex = new Map();
  const authorDict = [], authorIndex = new Map();

  const getIdx = (dict, index, value) => {
    if (!value) return -1;
    if (index.has(value)) return index.get(value);
    const idx = dict.length;
    dict.push(value);
    index.set(value, idx);
    return idx;
  };

  // novels: 내부 id → 인덱스 매핑
  const idToIdx = new Map();
  const N = [];

  for (let i = 0; i < novels.length; i++) {
    const n = novels[i];
    idToIdx.set(n.id, i);

    // 작가 인덱스
    const authorIdx = getIdx(authorDict, authorIndex, (n.author || "").trim());

    // 태그 인덱스 배열
    const tagTokens = (n.tags || "").split(",").map(s => s.trim()).filter(Boolean);
    const tagIdxArr = tagTokens.map(t => getIdx(tagDict, tagIndex, t));

    // 플랫폼 인덱스 배열
    let plats = [];
    try { plats = JSON.parse(n.platforms || "[]"); } catch { plats = []; }
    if (!Array.isArray(plats)) plats = [];
    const platIdxArr = plats.map(p => getIdx(platDict, platIndex, p));

    // Elo 데이터 (정수화: rating*10)
    const rating10 = Math.round((Number(n.rating) || 1500) * 10);
    const rd = Math.round(Number(n.rd) || 350);
    const wins = Number(n.wins) || 0;
    const losses = Number(n.losses) || 0;
    const matchCount = Number(n.match_count) || 0;

    // 옵션 객체 (기본값 아닌 것만)
    const opt = {};
    const readCount = Number(n.read_count) || 0;
    const totalEp = Number(n.total_episodes) || 0;
    const statusNum = BACKUP_STATUS_MAP[n.status] ?? 0;
    const pinnedNum = n.pinned ? 1 : 0;
    const workStatusNum = BACKUP_WORK_STATUS_MAP[n.work_status] ?? 0;
    const awards = n.awards || "";
    const note = (n.note || "").trim();
    const link = (n.link || "").trim();
    const createdSec = Math.floor((n.created_at || Date.now()) / 1000) - BASE_TIMESTAMP;
    const updatedSec = Math.floor((n.read_count_updated_at || Date.now()) / 1000) - BASE_TIMESTAMP;

    if (readCount) opt.r = readCount;
    if (totalEp) opt.e = totalEp;
    if (statusNum) opt.s = statusNum;
    if (pinnedNum) opt.p = 1;
    if (workStatusNum) opt.w = workStatusNum;
    if (awards && awards !== "[]") opt.a = awards;
    if (note) opt.n = note;
    if (link) opt.l = link;
    if (createdSec > 0) opt.c = createdSec;
    if (updatedSec > 0) opt.u = updatedSec;
    
    // 대장르/부장르 (JSON 배열 문자열)
    const majorGenre = (n.major_genre || "").trim();
    const subGenre = (n.sub_genre || "").trim();
    if (majorGenre) opt.mg = majorGenre;
    if (subGenre) opt.sg = subGenre;
    
    // 📖 외전 관련
    const gaidenStatus = n.gaiden_status || "none";
    const gaidenReadCount = Number(n.gaiden_read_count) || 0;
    const gaidenTotalEp = Number(n.gaiden_total_episodes) || 0;
    if (gaidenStatus !== "none") opt.gs = gaidenStatus === "ongoing" ? 1 : 2;
    if (gaidenReadCount) opt.gr = gaidenReadCount;
    if (gaidenTotalEp) opt.ge = gaidenTotalEp;
    
    // 🏆 수동 티어 지정
    if (n.manual_tier === 'S') opt.mt = 1;
    else if (n.manual_tier === 'A') opt.mt = 2;
    
    // 📚 다회독 카운트
    const rereadCount = Math.max(1, Number(n.reread_count) || 1);
    if (rereadCount > 1) opt.rr = rereadCount;
    
    // 📷 표지 이미지
    if (coverImages && coverImages[n.id]) {
      opt.i = coverImages[n.id];
    }
    
    // 🏷️ tag_data (JSON)
    const tagDataStr = (n.tag_data || "").trim();
    if (tagDataStr && tagDataStr !== "[]" && tagDataStr !== "") {
      opt.td = tagDataStr;
    }
    
    // 🏷️ aliases (JSON)
    const aliasesStr = (n.aliases || "").trim();
    if (aliasesStr && aliasesStr !== "[]" && aliasesStr !== "") {
      opt.al = aliasesStr;
    }
    
    // 💬 인상깊은 문장
    const memorableQuote = (n.memorable_quote || "").trim();
    if (memorableQuote) {
      opt.mq = memorableQuote;
    }

    // [title, authorIdx, tagIdx[], platIdx[], rating*10, rd, W, L, MC, opt?]
    const row = [n.title || "", authorIdx, tagIdxArr, platIdxArr, rating10, rd, wins, losses, matchCount];
    if (Object.keys(opt).length > 0) row.push(opt);
    N.push(row);
  }

  // 매칭 Base64 인코딩
  const novelCount = novels.length;
  const use2Bytes = novelCount >= 256;
  const matchBytes = [];

  for (const m of matches) {
    const idxA = idToIdx.has(m.a_id) ? idToIdx.get(m.a_id) : 65535;
    const idxB = idToIdx.has(m.b_id) ? idToIdx.get(m.b_id) : 65535;
    const idxW = m.winner_id && idToIdx.has(m.winner_id) ? idToIdx.get(m.winner_id) : -1;
    
    // f: 0=A승user, 1=B승user, 2=A승auto, 3=B승auto
    const isAuto = m.decided_by === "auto" ? 2 : 0;
    const isB = idxW === idxB ? 1 : 0;
    const f = isAuto + isB;

    if (use2Bytes) {
      matchBytes.push((idxA >> 8) & 255, idxA & 255);
      matchBytes.push((idxB >> 8) & 255, idxB & 255);
    } else {
      matchBytes.push(idxA & 255);
      matchBytes.push(idxB & 255);
    }
    matchBytes.push(f);
  }

  return {
    v: 11,
    b: BASE_TIMESTAMP,
    T: tagDict,
    P: platDict,
    A: authorDict,
    N,
    M: encodeBase64(matchBytes),
    m: use2Bytes ? 2 : 1,
  };
}

/**
 * 확장 백업 데이터 생성 (설정 및 히스토리 포함)
 * @param {Array} novels - 작품 배열
 * @param {Array} matches - 매칭 배열
 * @param {Object} settings - 앱 설정
 * @param {Array} tierHist - 티어 변경 히스토리
 * @param {Object} [coverImages] - 표지 이미지 맵
 * @param {Object} [analysisData] - 분석 데이터
 * @returns {Object} 확장된 백업 데이터
 */
export function buildExtendedBackup(novels, matches, settings, tierHist, coverImages = null, analysisData = null) {
  const base = buildUltraCompactBackup(novels, matches, coverImages);
  
  // 설정 추가 (기본값 아닌 것만)
  const settingsDiff = {};
  if (settings.tierThresholds) {
    const th = settings.tierThresholds;
    const def = DEFAULT_SETTINGS.tierThresholds;
    if (th.S !== def.S || th.A !== def.A || th["B+"] !== def["B+"] || th.B !== def.B || th["B-"] !== def["B-"]) {
      settingsDiff.th = th;
    }
  }
  if (settings.autoApproveEnabled) settingsDiff.aa = 1;
  if (settings.autoApproveMinWins !== DEFAULT_SETTINGS.autoApproveMinWins) settingsDiff.aw = settings.autoApproveMinWins;
  if (settings.autoApproveMaxLosses !== DEFAULT_SETTINGS.autoApproveMaxLosses) settingsDiff.al = settings.autoApproveMaxLosses;
  if (settings.autoApproveMinMatches !== DEFAULT_SETTINGS.autoApproveMinMatches) settingsDiff.am = settings.autoApproveMinMatches;
  if (settings.showReviewBanner === false) settingsDiff.rb = 0;
  if (settings.undoStackSize !== DEFAULT_SETTINGS.undoStackSize) settingsDiff.us = settings.undoStackSize;
  
  // 예정탭 확장 필드 설정
  if (settings.plannedFields) {
    const pf = settings.plannedFields;
    const defPf = DEFAULT_SETTINGS.plannedFields;
    const pfDiff = {};
    if (pf.showExpectedRating !== defPf.showExpectedRating) pfDiff.er = pf.showExpectedRating ? 1 : 0;
    if (pf.showScheduledStart !== defPf.showScheduledStart) pfDiff.ss = pf.showScheduledStart ? 1 : 0;
    if (pf.showSimilarNovels !== defPf.showSimilarNovels) pfDiff.sn = pf.showSimilarNovels ? 1 : 0;
    if (Object.keys(pfDiff).length > 0) settingsDiff.pf = pfDiff;
  }
  
  if (Object.keys(settingsDiff).length > 0) {
    base.S = settingsDiff;
  }
  
  // S/A 관련 티어 히스토리 추가 (최대 30개)
  if (tierHist && tierHist.length > 0) {
    const saHist = tierHist.filter(h => 
      h.from === 'S' || h.from === 'A' || h.to === 'S' || h.to === 'A'
    ).slice(0, 30).map(h => ({
      t: h.title,
      f: h.from,
      o: h.to,
      a: Math.floor(h.at / 1000) - BASE_TIMESTAMP
    }));
    if (saHist.length > 0) {
      base.H = saHist;
    }
  }
  
  // 분석 데이터 포함
  if (analysisData) {
    const AD = {};
    
    // 매칭 인사이트 (최근 100개만)
    if (analysisData.matchInsights && analysisData.matchInsights.length > 0) {
      AD.mi = analysisData.matchInsights.slice(-100);
    }
    
    // 이변 요인
    if (analysisData.upsetFactors && analysisData.upsetFactors.factors && analysisData.upsetFactors.factors.length > 0) {
      AD.uf = analysisData.upsetFactors;
    }
    
    // 태그 관계
    if (analysisData.tagRelations && Object.keys(analysisData.tagRelations.groups || {}).length > 0) {
      AD.tr = analysisData.tagRelations;
    }
    
    // 자동승패 설정
    if (analysisData.autoMatchSettings) {
      AD.am = analysisData.autoMatchSettings;
    }
    
    // 태그 좌표계
    if (analysisData.coordinateSystems && Object.keys(analysisData.coordinateSystems).length > 0) {
      AD.cs = analysisData.coordinateSystems;
    }
    
    if (Object.keys(AD).length > 0) {
      base.AD = AD;
    }
  }
  
  return base;
}

// ═══════════════════════════════════════════════════════════════
// 📥 백업 데이터 파싱 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 초압축 백업에서 매칭 데이터 파싱
 * @param {string} matchBase64 - Base64 인코딩된 매칭 데이터
 * @param {number} byteMode - 1 또는 2 (인덱스 바이트 크기)
 * @param {string[]} novelIds - 작품 ID 배열 (인덱스 순서)
 * @returns {Array} 매칭 배열
 */
export function parseMatchesFromBackup(matchBase64, byteMode, novelIds) {
  if (!matchBase64) return [];
  
  const bytes = decodeBase64(matchBase64);
  const matches = [];
  const bytesPerMatch = byteMode === 2 ? 5 : 3;
  
  for (let i = 0; i + bytesPerMatch <= bytes.length; i += bytesPerMatch) {
    let idxA, idxB;
    let flagIdx;
    
    if (byteMode === 2) {
      idxA = (bytes[i] << 8) | bytes[i + 1];
      idxB = (bytes[i + 2] << 8) | bytes[i + 3];
      flagIdx = i + 4;
    } else {
      idxA = bytes[i];
      idxB = bytes[i + 1];
      flagIdx = i + 2;
    }
    
    const f = bytes[flagIdx];
    const isAuto = f >= 2;
    const isBWin = (f % 2) === 1;
    
    if (idxA >= novelIds.length || idxB >= novelIds.length) continue;
    
    const a_id = novelIds[idxA];
    const b_id = novelIds[idxB];
    const winner_id = isBWin ? b_id : a_id;
    
    matches.push({
      a_id,
      b_id,
      winner_id,
      decided_by: isAuto ? "auto" : "user",
    });
  }
  
  return matches;
}

/**
 * 백업 버전 확인
 * @param {Object} data - 백업 데이터
 * @returns {{ version: number, isCompact: boolean, isLegacy: boolean }}
 */
export function detectBackupVersion(data) {
  if (!data || typeof data !== 'object') {
    return { version: 0, isCompact: false, isLegacy: false };
  }
  
  // 초압축 포맷 (v5~v11)
  if (data.v && typeof data.v === 'number' && Array.isArray(data.N)) {
    return { 
      version: data.v, 
      isCompact: true, 
      isLegacy: false 
    };
  }
  
  // 레거시 포맷 (novels/matches 배열)
  if (Array.isArray(data.novels)) {
    return { 
      version: 1, 
      isCompact: false, 
      isLegacy: true 
    };
  }
  
  return { version: 0, isCompact: false, isLegacy: false };
}
