/**
 * 백업/복원 서비스
 * @module services/backupService
 * 
 * @source_origin 원본 App.jsx 20668-21204줄
 * 
 * @description
 * 초압축 백업 포맷 v11
 * - 사전 압축 (태그, 플랫폼, 작가)
 * - Elo 데이터 정수화
 * - 매칭 데이터 Base64 인코딩
 * - 확장 백업 (설정, 분석 데이터)
 * - 백업 검증
 */

// Constants
import { DEFAULT_SETTINGS } from '../constants/config';

// ═══════════════════════════════════════════════════════════════
// 📌 상수
// ═══════════════════════════════════════════════════════════════

// 기준 타임스탬프 (2024-01-01 00:00:00 UTC)
export const BASE_TIMESTAMP = 1704067200;

// 상태 매핑
export const STATUS_MAP = {
  reading: 0,
  completed: 1,
  pending: 2,
  dropped: 3,
};

export const STATUS_MAP_REVERSE = {
  0: "reading",
  1: "completed",
  2: "pending",
  3: "dropped",
};

export const WORK_STATUS_MAP = {
  ongoing: 0,
  completed: 1,
  hiatus: 2,
  dropped: 3,
  discontinued: 4,
};

export const WORK_STATUS_MAP_REVERSE = {
  0: "ongoing",
  1: "completed",
  2: "hiatus",
  3: "dropped",
  4: "discontinued",
};

// ═══════════════════════════════════════════════════════════════
// 📌 Base64 인코딩/디코딩
// ═══════════════════════════════════════════════════════════════

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * 바이트 배열 → Base64 문자열
 * @param {number[]} bytes
 * @returns {string}
 */
export function encodeBase64(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    
    result += BASE64_CHARS[b1 >> 2];
    result += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < bytes.length ? BASE64_CHARS[b3 & 63] : "=";
  }
  return result;
}

/**
 * Base64 문자열 → 바이트 배열
 * @param {string} str
 * @returns {number[]}
 */
export function decodeBase64(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i += 4) {
    const c1 = BASE64_CHARS.indexOf(str[i]);
    const c2 = BASE64_CHARS.indexOf(str[i + 1]);
    const c3 = str[i + 2] === "=" ? 0 : BASE64_CHARS.indexOf(str[i + 2]);
    const c4 = str[i + 3] === "=" ? 0 : BASE64_CHARS.indexOf(str[i + 3]);
    
    bytes.push((c1 << 2) | (c2 >> 4));
    if (str[i + 2] !== "=") bytes.push(((c2 & 15) << 4) | (c3 >> 2));
    if (str[i + 3] !== "=") bytes.push(((c3 & 3) << 6) | c4);
  }
  return bytes;
}

// ═══════════════════════════════════════════════════════════════
// 📌 백업 생성
// ═══════════════════════════════════════════════════════════════

/**
 * 초압축 백업 생성 (v11)
 * @param {Array} novels - 작품 배열
 * @param {Array} matches - 매칭 배열
 * @param {object|null} coverImages - 표지 이미지 매핑 (선택)
 * @returns {object} 백업 객체
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
    const statusNum = STATUS_MAP[n.status] ?? 0;
    const pinnedNum = n.pinned ? 1 : 0;
    const workStatusNum = WORK_STATUS_MAP[n.work_status] ?? 0;
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
    
    // 대장르/부장르
    const majorGenre = (n.major_genre || "").trim();
    const subGenre = (n.sub_genre || "").trim();
    if (majorGenre) opt.mg = majorGenre;
    if (subGenre) opt.sg = subGenre;
    
    // 외전 관련
    const gaidenStatus = n.gaiden_status || "none";
    const gaidenReadCount = Number(n.gaiden_read_count) || 0;
    const gaidenTotalEp = Number(n.gaiden_total_episodes) || 0;
    if (gaidenStatus !== "none") opt.gs = gaidenStatus === "ongoing" ? 1 : 2;
    if (gaidenReadCount) opt.gr = gaidenReadCount;
    if (gaidenTotalEp) opt.ge = gaidenTotalEp;
    
    // 수동 티어 지정
    if (n.manual_tier === 'S') opt.mt = 1;
    else if (n.manual_tier === 'A') opt.mt = 2;
    
    // 다회독 카운트
    const rereadCount = Math.max(1, Number(n.reread_count) || 1);
    if (rereadCount > 1) opt.rr = rereadCount;
    
    // 표지 이미지 (URL만)
    if (coverImages && coverImages[n.id]) {
      opt.i = coverImages[n.id];
    }
    
    // tag_data (JSON)
    const tagDataStr = (n.tag_data || "").trim();
    if (tagDataStr && tagDataStr !== "[]" && tagDataStr !== "") {
      opt.td = tagDataStr;
    }
    
    // aliases (JSON)
    const aliasesStr = (n.aliases || "").trim();
    if (aliasesStr && aliasesStr !== "[]" && aliasesStr !== "") {
      opt.al = aliasesStr;
    }
    
    // 인상깊은 문장
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
 * URL 이미지만 백업용으로 반환
 * @param {string} uri - 이미지 URI
 * @returns {string|null}
 */
export function getExportableImageUrl(uri) {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  return null;
}

/**
 * URL 표지 이미지들 수집 (백업용)
 * @param {Array} novels - 작품 배열
 * @returns {object} { novelId: url }
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
// 📌 백업 복원 파서
// ═══════════════════════════════════════════════════════════════

/**
 * 백업 버전 감지
 * @param {object} data - 파싱된 JSON
 * @returns {{ version: number, type: string }}
 */
export function detectBackupVersion(data) {
  if (!data || typeof data !== "object") {
    return { version: 0, type: "unknown" };
  }
  
  // v11 (최신)
  if (data.v >= 11 && data.N && data.M) {
    return { version: data.v, type: "ultra_compact_v11" };
  }
  
  // v5-10
  if (data.v >= 5 && data.N && data.M) {
    return { version: data.v, type: "ultra_compact" };
  }
  
  // 레거시 (novels 배열)
  if (Array.isArray(data.novels)) {
    return { version: 1, type: "legacy" };
  }
  
  return { version: 0, type: "unknown" };
}

/**
 * v11 백업에서 작품 데이터 파싱
 * @param {object} data - 백업 데이터
 * @returns {{ novels: Array, matches: Array }}
 */
export function parseV11Backup(data) {
  const tagDict = data.T || [];
  const platDict = data.P || [];
  const authorDict = data.A || [];
  const baseTs = data.b || BASE_TIMESTAMP;
  const byteMode = data.m || 1;
  
  const novels = [];
  const idList = [];
  
  // 작품 파싱
  for (const row of data.N || []) {
    const title = row[0] || "";
    const authorIdx = row[1];
    const tagIdxArr = row[2] || [];
    const platIdxArr = row[3] || [];
    const rating10 = row[4] || 15000;
    const rd = row[5] || 350;
    const wins = row[6] || 0;
    const losses = row[7] || 0;
    const matchCount = row[8] || 0;
    const opt = row[9] || {};
    
    const author = authorIdx >= 0 && authorIdx < authorDict.length ? authorDict[authorIdx] : "";
    const tags = tagIdxArr
      .filter(idx => idx >= 0 && idx < tagDict.length)
      .map(idx => tagDict[idx])
      .join(", ");
    const platforms = JSON.stringify(
      platIdxArr
        .filter(idx => idx >= 0 && idx < platDict.length)
        .map(idx => platDict[idx])
    );
    
    novels.push({
      title,
      author,
      tags,
      platforms,
      rating: rating10 / 10,
      rd,
      wins,
      losses,
      match_count: matchCount,
      read_count: opt.r || 0,
      total_episodes: opt.e || 0,
      status: STATUS_MAP_REVERSE[opt.s] || "reading",
      pinned: opt.p === 1 ? 1 : 0,
      work_status: WORK_STATUS_MAP_REVERSE[opt.w] || "ongoing",
      awards: opt.a || "",
      note: opt.n || "",
      link: opt.l || "",
      created_at: opt.c ? (opt.c + baseTs) * 1000 : Date.now(),
      read_count_updated_at: opt.u ? (opt.u + baseTs) * 1000 : Date.now(),
      major_genre: opt.mg || "",
      sub_genre: opt.sg || "",
      gaiden_status: opt.gs === 1 ? "ongoing" : opt.gs === 2 ? "completed" : "none",
      gaiden_read_count: opt.gr || 0,
      gaiden_total_episodes: opt.ge || 0,
      manual_tier: opt.mt === 1 ? "S" : opt.mt === 2 ? "A" : null,
      reread_count: opt.rr || 1,
      cover_image: opt.i || "",
      tag_data: opt.td || "",
      aliases: opt.al || "",
      memorable_quote: opt.mq || "",
    });
    
    idList.push(null); // ID는 import 시 생성
  }
  
  // 매칭 파싱
  const matchBytes = decodeBase64(data.M || "");
  const matches = [];
  const bytesPerMatch = byteMode === 2 ? 5 : 3;
  
  for (let i = 0; i + bytesPerMatch <= matchBytes.length; i += bytesPerMatch) {
    let idxA, idxB;
    if (byteMode === 2) {
      idxA = (matchBytes[i] << 8) | matchBytes[i + 1];
      idxB = (matchBytes[i + 2] << 8) | matchBytes[i + 3];
    } else {
      idxA = matchBytes[i];
      idxB = matchBytes[i + 1];
    }
    const f = matchBytes[byteMode === 2 ? i + 4 : i + 2];
    
    const isB = f & 1;
    const isAuto = f & 2;
    const winnerIdx = isB ? idxB : idxA;
    
    matches.push({
      a_idx: idxA,
      b_idx: idxB,
      winner_idx: winnerIdx,
      decided_by: isAuto ? "auto" : "user",
    });
  }
  
  return { novels, matches, idList };
}

/**
 * 백업 요약 정보
 * @param {object} data - 백업 데이터
 * @returns {{ novelCount: number, matchCount: number, version: number }}
 */
export function getBackupSummary(data) {
  const { version, type } = detectBackupVersion(data);
  
  if (type === "ultra_compact_v11" || type === "ultra_compact") {
    return {
      novelCount: (data.N || []).length,
      matchCount: Math.floor((decodeBase64(data.M || "").length) / (data.m === 2 ? 5 : 3)),
      version,
    };
  }
  
  if (type === "legacy") {
    return {
      novelCount: (data.novels || []).length,
      matchCount: (data.matches || []).length,
      version,
    };
  }
  
  return { novelCount: 0, matchCount: 0, version: 0 };
}

// ═══════════════════════════════════════════════════════════════
// 📌 확장 백업 (설정, 분석 데이터 포함)
// 원본 20823-20907줄
// ═══════════════════════════════════════════════════════════════

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
  
  // 🆕 v3.4: 예정탭 확장 필드 설정
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
  
  // 🎯 v3.0.4: 분석 데이터 포함
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
    
    // 📐 v3.2.0: 태그 좌표계
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
// 📌 백업 데이터 검증
// 원본 21084-21204줄
// ═══════════════════════════════════════════════════════════════

export function validateImportData(text) {
  const result = {
    valid: false,
    version: null,
    format: null,
    novelCount: 0,
    matchCount: 0,
    plannedCount: 0, // 📋 v3.3.0: 예정 작품 개수
    warnings: [],
    errors: [],
    features: {
      hasElo: false,
      hasAuthorDict: false,
      hasTimestamps: false,
      hasStatus: false,
      hasWorkStatus: false,
      hasCoverImage: false,
      hasLink: false,
      hasPinned: false,
      hasAnalysis: false, // 🎯 v3.0.4
      hasTierHistory: false,
      hasSettings: false,
      hasPlannedNovels: false, // 📋 v3.3.0
    },
    summary: "",
  };

  if (!text || !text.trim()) {
    result.errors.push("JSON 데이터가 비어있습니다.");
    return result;
  }

  let data;
  try {
    data = JSON.parse(text.trim());
  } catch (e) {
    result.errors.push("JSON 파싱 실패: " + e.message);
    return result;
  }

  // v9/v10/v11 극한 압축 포맷 (v10: tag_data, aliases / v11: 좌표계 포함)
  if (data && [9, 10, 11].includes(data.v) && Array.isArray(data.N) && typeof data.M === "string") {
    result.valid = true;
    result.version = data.v;
    result.format = data.v === 11 ? "v11 극한 압축 (좌표계 포함)" 
                  : data.v === 10 ? "v10 극한 압축 (태그 v5.0)" 
                  : "v9 극한 압축";
    result.novelCount = data.N.length;
    
    const byteMode = data.m || 1;
    const matchBytes = decodeBase64(data.M);
    const bytesPerMatch = byteMode === 2 ? 5 : 3;
    result.matchCount = Math.floor(matchBytes.length / bytesPerMatch);

    result.features.hasElo = true;
    result.features.hasAuthorDict = Array.isArray(data.A) && data.A.length > 0;
    result.features.hasTimestamps = true;
    result.features.hasStatus = true;
    result.features.hasWorkStatus = true;
    result.features.hasLink = true;
    result.features.hasPinned = true;
    
    // 📷 표지 이미지 확인 (v3.0.4)
    if (data.hasCovers || data.coverCount > 0) {
      result.features.hasCoverImage = true;
    } else {
      // opt.i가 있는 작품이 있는지 확인
      const hasCoverInData = data.N.some(row => {
        const opt = (row.length > 9 && typeof row[9] === "object") ? row[9] : {};
        return opt.i && opt.i.length > 0;
      });
      result.features.hasCoverImage = hasCoverInData;
    }
    
    // 🎯 분석 데이터 확인 (v3.0.4)
    if (data.AD && typeof data.AD === "object") {
      result.features.hasAnalysis = true;
    }
    
    // 설정/히스토리 확인
    result.features.hasSettings = data.S && typeof data.S === "object";
    result.features.hasTierHistory = data.H && Array.isArray(data.H) && data.H.length > 0;

    // 📋 v3.3.0: 예정 작품 확인
    if (Array.isArray(data.PL) && data.PL.length > 0) {
      result.features.hasPlannedNovels = true;
      result.plannedCount = data.PL.length;
    }

    // 요약 생성
    const extras = [];
    if (result.features.hasCoverImage) extras.push("표지 이미지");
    if (result.features.hasAnalysis) extras.push("분석 데이터");
    if (result.features.hasSettings) extras.push("설정");
    if (result.features.hasTierHistory) extras.push(`티어 히스토리 ${data.H.length}건`);
    if (result.features.hasPlannedNovels) extras.push(`예정 작품 ${result.plannedCount}개`);
    
    result.summary = `✅ v${data.v} 포맷\n• Elo 데이터 완전 복원\n• 재계산 불필요`;
    if (extras.length > 0) {
      result.summary += `\n• 포함: ${extras.join(", ")}`;
    }
    if (!result.features.hasCoverImage) {
      result.warnings.push("ℹ️ 표지 이미지 없음");
    }
    return result;
  }

  // 구버전 감지 (지원 중단)
  if (data && [5, 6, 7, 8].includes(data.v) && Array.isArray(data.N)) {
    result.errors.push(`v${data.v} 포맷은 더 이상 지원되지 않습니다.\n최신 앱에서 v9로 다시 내보내기 해주세요.`);
    return result;
  }

  if (data && data.novels && Array.isArray(data.novels)) {
    result.errors.push("레거시 포맷은 더 이상 지원되지 않습니다.\n최신 앱에서 v9로 다시 내보내기 해주세요.");
    return result;
  }

  result.errors.push("지원하지 않는 백업 형식입니다.\nv9~v11 형식만 지원됩니다.");
  return result;
}
