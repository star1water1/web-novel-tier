/**
 * SQLite 데이터베이스 연결 관리
 * @module database/connection
 * 
 * @source_origin 원본 App.jsx 1554-1694줄
 * 
 * @description
 * Expo SQLite SDK 54 호환 데이터베이스 연결 관리
 * - 자동 재연결 로직
 * - 안전한 DB 실행 래퍼
 * - 트랜잭션 지원
 * 
 * @bugfix v6.1.1
 * - [FIX] tagsStringToTagData, parseTagData, tagDataToString, isWorkIdentifier, parseNovelAliases
 *   import 누락 수정 → 태그 마이그레이션(migrateTagSystem) 시 ReferenceError 발생하던 문제 해결
 * 
 * @note
 * 이 모듈은 React Native 환경에서만 동작합니다.
 * expo-sqlite 패키지가 필요합니다.
 */

import * as SQLite from "expo-sqlite";
import {
  tagsStringToTagData, parseTagData, tagDataToString,
  isWorkIdentifier, parseNovelAliases,
} from "../constants/tags";

// ═══════════════════════════════════════════════════════════════
// 📌 DB 연결 상태
// ═══════════════════════════════════════════════════════════════

let db = null;
let dbOpenPromise = null;
let dbLastSuccessTime = 0;

// ═══════════════════════════════════════════════════════════════
// 📌 연결 관리
// ═══════════════════════════════════════════════════════════════

/**
 * 데이터베이스 열기 (강화된 재연결 로직)
 * @returns {Promise<SQLite.SQLiteDatabase>} 데이터베이스 인스턴스
 */
export async function openDb() {
  // 이미 연결 시도 중이면 해당 Promise를 기다림
  if (dbOpenPromise) {
    try {
      return await dbOpenPromise;
    } catch (e) {
      dbOpenPromise = null;
      db = null;
    }
  }
  
  // 기존 연결이 있고, 최근 성공했으면 재사용
  if (db && Date.now() - dbLastSuccessTime < 5000) {
    return db;
  }
  
  // 기존 연결이 있으면 테스트
  if (db) {
    try {
      await db.getAllAsync("SELECT 1;");
      dbLastSuccessTime = Date.now();
      return db;
    } catch (e) {
      console.warn("DB 연결 테스트 실패:", e.message);
      db = null;
    }
  }
  
  // 새 연결 생성
  dbOpenPromise = SQLite.openDatabaseAsync("novel_tiers.db");
  
  try {
    db = await dbOpenPromise;
    dbLastSuccessTime = Date.now();
    console.log("DB 연결 성공");
    return db;
  } catch (e) {
    console.error("DB 열기 실패:", e.message);
    db = null;
    throw e;
  } finally {
    dbOpenPromise = null;
  }
}

/**
 * DB 연결 강제 리셋
 */
export function resetDbConnection() {
  console.log("DB 연결 리셋");
  db = null;
  dbOpenPromise = null;
  dbLastSuccessTime = 0;
}

/**
 * 안전한 DB 실행 래퍼 (자동 재연결 + 재시도)
 * @param {Function} operation - 실행할 DB 작업
 * @param {string} operationName - 작업 이름 (로깅용)
 * @returns {Promise<*>} 작업 결과
 */
export async function safeDbOperation(operation, operationName = "DB") {
  const maxRetries = 5;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const database = await openDb();
      if (!database) {
        throw new Error("Database is null after openDb");
      }
      
      const result = await operation(database);
      dbLastSuccessTime = Date.now();
      return result;
    } catch (e) {
      const errorMsg = e.message || "";
      const isConnectionError = 
        errorMsg.includes("NullPointerException") ||
        errorMsg.includes("prepareAsync") ||
        errorMsg.includes("rejected") ||
        errorMsg.includes("database") ||
        errorMsg.includes("null") ||
        errorMsg.includes("closed");
      
      console.warn(`${operationName} 오류 (시도 ${attempt + 1}/${maxRetries}):`, errorMsg);
      
      if (isConnectionError || attempt > 0) {
        resetDbConnection();
      }
      
      if (attempt === maxRetries - 1) {
        throw e;
      }
      
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 기본 쿼리 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 단일 쿼리 실행 (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 파라미터
 * @returns {Promise<SQLite.SQLiteRunResult>} 실행 결과
 */
export async function exec(sql, params = []) {
  return safeDbOperation(
    (database) => database.runAsync(sql, params),
    "exec"
  );
}

/**
 * SELECT 전체 결과
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 파라미터
 * @returns {Promise<Array>} 결과 배열
 */
export async function all(sql, params = []) {
  return safeDbOperation(
    (database) => database.getAllAsync(sql, params),
    "all"
  );
}

/**
 * SELECT 첫 번째 결과
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 파라미터
 * @returns {Promise<Object|null>} 첫 번째 행 또는 null
 */
export async function first(sql, params = []) {
  return safeDbOperation(
    (database) => database.getFirstAsync(sql, params),
    "first"
  );
}

/**
 * 트랜잭션으로 여러 쿼리 실행
 * @param {Array<{sql: string, params?: Array}>} queries - 쿼리 배열
 * @returns {Promise<void>}
 */
export async function execBatch(queries) {
  if (!queries || queries.length === 0) return;
  
  return safeDbOperation(
    async (database) => {
      await database.withTransactionAsync(async () => {
        for (const { sql, params } of queries) {
          await database.runAsync(sql, params || []);
        }
      });
    },
    "execBatch"
  );
}

// ═══════════════════════════════════════════════════════════════
// 📌 마이그레이션 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 테이블에 컬럼이 존재하는지 확인
 * @param {string} table - 테이블 이름
 * @param {string} name - 컬럼 이름
 * @returns {Promise<boolean>}
 */
export async function columnExists(table, name) {
  const rows = await all(`PRAGMA table_info(${table});`);
  return rows.some((r) => r.name === name);
}

/**
 * 컬럼이 없으면 추가
 * @param {string} table - 테이블 이름
 * @param {string} name - 컬럼 이름
 * @param {string} type - 컬럼 타입
 * @param {string} defaultExpr - 기본값 표현식
 * @returns {Promise<void>}
 */
export async function ensureColumn(table, name, type, defaultExpr) {
  const exists = await columnExists(table, name);
  if (!exists) {
    await exec(
      `ALTER TABLE ${table} ADD COLUMN ${name} ${type}${
        defaultExpr ? " DEFAULT " + defaultExpr : ""
      };`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 앱 메타데이터 (키-값 저장)
// ═══════════════════════════════════════════════════════════════

/**
 * 앱 메타데이터 읽기
 * @param {string} key - 키
 * @returns {Promise<*>} 값 (JSON 파싱됨)
 */
export async function getAppMeta(key) {
  try {
    const row = await first("SELECT value FROM app_meta WHERE key=?", [key]);
    if (!row || row.value == null) return null;
    try {
      return JSON.parse(row.value);
    } catch {
      return null;
    }
  } catch (e) {
    console.warn("getAppMeta 오류:", e);
    return null;
  }
}

/**
 * 앱 메타데이터 저장
 * @param {string} key - 키
 * @param {*} value - 값 (JSON으로 직렬화됨)
 * @returns {Promise<void>}
 */
export async function setAppMeta(key, value) {
  try {
    const json = JSON.stringify(value ?? null);
    await exec("DELETE FROM app_meta WHERE key=?", [key]);
    await exec("INSERT INTO app_meta (key,value) VALUES (?,?);", [key, json]);
  } catch (e) {
    console.warn("setAppMeta 오류:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 내보내기용 DB 인스턴스 getter
// ═══════════════════════════════════════════════════════════════

/**
 * 현재 DB 인스턴스 가져오기 (직접 접근용)
 * @returns {SQLite.SQLiteDatabase|null}
 */
export function getDb() {
  return db;
}

// ═══════════════════════════════════════════════════════════════
// 📌 데이터베이스 초기화
// ═══════════════════════════════════════════════════════════════

/**
 * 데이터베이스 초기화 (테이블 생성 + 마이그레이션)
 * @returns {Promise<void>}
 */
export async function initDb() {
  // DB 연결 확보
  const database = await openDb();
  
  // ─────────────────────────────────────────────────────────────
  // 테이블 생성
  // ─────────────────────────────────────────────────────────────
  
  // novels 테이블
  await database.runAsync(`CREATE TABLE IF NOT EXISTS novels (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT UNIQUE NOT NULL,
    author TEXT,
    tags TEXT,
    platforms TEXT,
    note TEXT,
    read_count INTEGER,
    rating REAL,
    rd REAL,
    wins INTEGER,
    losses INTEGER,
    match_count INTEGER,
    tier TEXT,
    created_at INTEGER
  );`);
  
  // matches 테이블
  await database.runAsync(`CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY NOT NULL,
    a_id TEXT NOT NULL,
    b_id TEXT NOT NULL,
    winner_id TEXT,
    decided_by TEXT,
    gap_when_matched REAL,
    k_factor_used REAL,
    created_at INTEGER
  );`);

  // ─────────────────────────────────────────────────────────────
  // novels 테이블 마이그레이션
  // ─────────────────────────────────────────────────────────────
  const existingColumns = await all(`PRAGMA table_info(novels);`);
  const existingNames = new Set(existingColumns.map(r => r.name));
  
  const migrations = [
    ["author", "TEXT", "''"],
    ["tags", "TEXT", "''"],
    ["platforms", "TEXT", "''"],
    ["note", "TEXT", "''"],
    ["read_count", "INTEGER", "0"],
    ["rating", "REAL", "1500"],
    ["rd", "REAL", "350"],
    ["wins", "INTEGER", "0"],
    ["losses", "INTEGER", "0"],
    ["match_count", "INTEGER", "0"],
    ["tier", "TEXT", "'C'"],
    ["created_at", "INTEGER", String(Date.now())],
    ["awards", "TEXT", "''"],
    ["total_episodes", "INTEGER", "0"],
    ["status", "TEXT", "'reading'"],
    ["pinned", "INTEGER", "0"],
    ["cover_image", "TEXT", "''"],
    ["link", "TEXT", "''"],
    ["work_status", "TEXT", "'ongoing'"],
    ["read_count_updated_at", "INTEGER", "1737072000000"],
    ["major_genre", "TEXT", "''"],
    ["sub_genre", "TEXT", "''"],
    ["gaiden_status", "TEXT", "'none'"],
    ["gaiden_read_count", "INTEGER", "0"],
    ["gaiden_total_episodes", "INTEGER", "0"],
    ["manual_tier", "TEXT", "NULL"],
    ["reread_count", "INTEGER", "1"],
    ["tag_data", "TEXT", "''"],
    ["aliases", "TEXT", "''"],
    ["memorable_quote", "TEXT", "''"],
  ];
  
  for (const [name, type, defaultExpr] of migrations) {
    if (!existingNames.has(name)) {
      await database.runAsync(
        `ALTER TABLE novels ADD COLUMN ${name} ${type}${defaultExpr ? " DEFAULT " + defaultExpr : ""};`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // app_meta 테이블
  // ─────────────────────────────────────────────────────────────
  await database.runAsync(`CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );`);
  
  // ─────────────────────────────────────────────────────────────
  // planned_novels 테이블 (예정 작품)
  // ─────────────────────────────────────────────────────────────
  await database.runAsync(`CREATE TABLE IF NOT EXISTS planned_novels (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT UNIQUE NOT NULL,
    author TEXT,
    tags TEXT,
    platforms TEXT,
    note TEXT,
    total_episodes INTEGER,
    cover_image TEXT,
    link TEXT,
    work_status TEXT,
    major_genre TEXT,
    sub_genre TEXT,
    priority INTEGER,
    created_at INTEGER
  );`);
  
  // planned_novels 필드 확장
  await ensureColumn("planned_novels", "expected_rating", "REAL", "1500");
  await ensureColumn("planned_novels", "expected_tier", "TEXT", "''");
  await ensureColumn("planned_novels", "interest_level", "INTEGER", "3");
  await ensureColumn("planned_novels", "discovery_source", "TEXT", "''");
  await ensureColumn("planned_novels", "first_chapter_read", "INTEGER", "0");
  await ensureColumn("planned_novels", "scheduled_start_date", "INTEGER", "0");
  await ensureColumn("planned_novels", "similar_novels", "TEXT", "''");
  await ensureColumn("planned_novels", "why_interested", "TEXT", "''");
  await ensureColumn("planned_novels", "tag_data", "TEXT", "''");
  
  // ─────────────────────────────────────────────────────────────
  // cover_library 테이블 (표지 라이브러리)
  // ─────────────────────────────────────────────────────────────
  await database.runAsync(`CREATE TABLE IF NOT EXISTS cover_library (
    id TEXT PRIMARY KEY NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'unused',
    novel_id TEXT,
    original_name TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    created_at INTEGER
  );`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_cover_status ON cover_library(status);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_cover_novel ON cover_library(novel_id);`);
  
  // ─────────────────────────────────────────────────────────────
  // 성능 최적화 인덱스
  // ─────────────────────────────────────────────────────────────
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_novels_rating ON novels(rating DESC);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_novels_created ON novels(created_at DESC);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_novels_pinned ON novels(pinned DESC);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_novels_title ON novels(title COLLATE NOCASE);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at ASC);`);
  
  // ─────────────────────────────────────────────────────────────
  // 취향 발견 시스템 v3.5.0 테이블
  // ─────────────────────────────────────────────────────────────
  
  // choice_logs: 선택 기록
  await database.runAsync(`CREATE TABLE IF NOT EXISTS choice_logs (
    id TEXT PRIMARY KEY NOT NULL,
    match_id TEXT NOT NULL,
    winner_id TEXT NOT NULL,
    loser_id TEXT NOT NULL,
    predicted_winner_id TEXT,
    prediction_confidence REAL,
    prediction_factors TEXT,
    was_correct INTEGER,
    winner_snapshot TEXT,
    loser_snapshot TEXT,
    comparison TEXT,
    anomaly_score REAL DEFAULT 0,
    anomaly_factors TEXT,
    match_type TEXT DEFAULT 'manual',
    session_position INTEGER,
    created_at INTEGER NOT NULL
  );`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_cl_created ON choice_logs(created_at DESC);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_cl_type ON choice_logs(match_type);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_cl_winner ON choice_logs(winner_id);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_cl_anomaly ON choice_logs(anomaly_score DESC);`);
  
  // preference_patterns: 발견된 취향 패턴
  await database.runAsync(`CREATE TABLE IF NOT EXISTS preference_patterns (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    pattern_key TEXT NOT NULL,
    sample_size INTEGER DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    win_rate REAL,
    confidence_lower REAL,
    confidence_upper REAL,
    significance REAL,
    static_metric TEXT,
    static_value REAL,
    static_deviation REAL,
    details TEXT,
    is_notable INTEGER DEFAULT 0,
    insight_level TEXT,
    insight_title TEXT,
    insight_description TEXT,
    is_shown INTEGER DEFAULT 0,
    shown_at INTEGER,
    user_reaction TEXT,
    user_confirmed INTEGER DEFAULT 0,
    first_seen_at INTEGER NOT NULL,
    last_updated_at INTEGER NOT NULL
  );`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_pp_category ON preference_patterns(category);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_pp_notable ON preference_patterns(is_notable DESC, significance DESC);`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_pp_key ON preference_patterns(pattern_key);`);
  await database.runAsync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_pp_unique ON preference_patterns(category, pattern_key);`);
  
  // insight_queue: 인사이트 대기열
  await database.runAsync(`CREATE TABLE IF NOT EXISTS insight_queue (
    id TEXT PRIMARY KEY NOT NULL,
    source TEXT NOT NULL,
    pattern_id TEXT,
    insight_type TEXT NOT NULL,
    priority INTEGER DEFAULT 50,
    confidence REAL DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending',
    shown_at INTEGER,
    user_response TEXT,
    responded_at INTEGER,
    created_at INTEGER NOT NULL
  );`);
  await database.runAsync(`CREATE INDEX IF NOT EXISTS idx_iq_status ON insight_queue(status, priority DESC);`);
  
  // weight_config: 예측 가중치 버전 관리
  await database.runAsync(`CREATE TABLE IF NOT EXISTS weight_config (
    version INTEGER PRIMARY KEY AUTOINCREMENT,
    w_elo REAL DEFAULT 0.35,
    w_h2h REAL DEFAULT 0.20,
    w_overall_winrate REAL DEFAULT 0.10,
    w_reliability REAL DEFAULT 0.05,
    w_genre_matchup REAL DEFAULT 0.10,
    w_tag_power REAL DEFAULT 0.10,
    w_read_preference REAL DEFAULT 0.05,
    w_author_affinity REAL DEFAULT 0.03,
    w_coordinate_zone REAL DEFAULT 0.02,
    change_source TEXT,
    change_reason TEXT,
    changed_weights TEXT,
    accuracy_at_creation REAL,
    accuracy_current REAL,
    sample_size_for_accuracy INTEGER,
    is_active INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );`);
  
  // 기본 가중치 버전이 없으면 생성
  const activeWeight = await database.getFirstAsync(
    `SELECT version FROM weight_config WHERE is_active = 1`
  );
  if (!activeWeight) {
    await database.runAsync(
      `INSERT INTO weight_config (is_active, created_at) VALUES (1, ?)`,
      [Date.now()]
    );
  }
  
  // 추가 마이그레이션
  await ensureColumn("preference_patterns", "user_confirmed", "INTEGER", "0");
  await ensureColumn("insight_queue", "confidence", "REAL", "0");
  await ensureColumn("insight_queue", "content", "TEXT", "''");
  await ensureColumn("insight_queue", "responded_at", "INTEGER", "0");
  
  console.log("DB 초기화 완료");
}

// ═══════════════════════════════════════════════════════════════
// 📌 매칭 큐잉 시스템 (원본 matchQueue.js)
// ═══════════════════════════════════════════════════════════════

// 📌 큐 상태
// ═══════════════════════════════════════════════════════════════

const matchQueue = [];
let isProcessingMatchQueue = false;
let matchQueueUpdateCallback = null;
const pendingMatchPairs = new Set();

// ═══════════════════════════════════════════════════════════════
// 📌 큐 관리 함수
// ═══════════════════════════════════════════════════════════════

/**
 * 큐 상태 업데이트 콜백 등록
 * @param {Function} callback - 상태 변경 시 호출될 콜백
 */
export function setMatchQueueCallback(callback) {
  matchQueueUpdateCallback = callback;
}

/**
 * 큐 상태 알림
 */
function notifyQueueStatus() {
  if (matchQueueUpdateCallback) {
    matchQueueUpdateCallback({
      pending: matchQueue.length,
      processing: isProcessingMatchQueue
    });
  }
}

/**
 * 페어 키 생성 (중복 체크용)
 * @param {string} aId - A 작품 ID
 * @param {string} bId - B 작품 ID
 * @returns {string} 정렬된 페어 키
 */
export function matchPairKey(aId, bId) {
  return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
}

/**
 * 매치가 이미 큐에 있는지 확인
 * @param {string} aId - A 작품 ID
 * @param {string} bId - B 작품 ID
 * @returns {boolean} 대기 중이면 true
 */
export function isMatchPending(aId, bId) {
  return pendingMatchPairs.has(matchPairKey(aId, bId));
}

/**
 * 매칭 작업을 큐에 추가
 * @param {Function} task - 실행할 비동기 작업
 * @param {string} pairKey - 페어 키 (중복 방지용)
 * @returns {Promise<*>} 작업 결과
 */
export function enqueueMatchTask(task, pairKey = null) {
  return new Promise((resolve, reject) => {
    // 중복 방지: 이미 큐에 있으면 무시
    if (pairKey && pendingMatchPairs.has(pairKey)) {
      console.log("매치 큐: 이미 대기 중인 조합, 무시:", pairKey);
      resolve(null);
      return;
    }
    
    if (pairKey) {
      pendingMatchPairs.add(pairKey);
    }
    
    matchQueue.push({ task, resolve, reject, pairKey });
    notifyQueueStatus();
    processMatchQueue();
  });
}

/**
 * 큐 순차 처리
 */
async function processMatchQueue() {
  if (isProcessingMatchQueue) return;
  isProcessingMatchQueue = true;
  notifyQueueStatus();
  
  while (matchQueue.length > 0) {
    const { task, resolve, reject, pairKey } = matchQueue.shift();
    notifyQueueStatus();
    
    try {
      const result = await task();
      resolve(result);
    } catch (e) {
      console.warn("매칭 큐 처리 오류:", e.message);
      reject(e);
    } finally {
      // 처리 완료 후 pending에서 제거
      if (pairKey) {
        pendingMatchPairs.delete(pairKey);
      }
    }
    
    // 각 작업 사이에 약간의 딜레이 (DB 안정성)
    await new Promise(r => setTimeout(r, 50));
  }
  
  isProcessingMatchQueue = false;
  notifyQueueStatus();
}

/**
 * 큐 상태 조회
 * @returns {Object} { pending, processing }
 */
export function getQueueStatus() {
  return {
    pending: matchQueue.length,
    processing: isProcessingMatchQueue
  };
}

/**
 * 큐 초기화 (테스트용)
 */
export function clearMatchQueue() {
  matchQueue.length = 0;
  pendingMatchPairs.clear();
  isProcessingMatchQueue = false;
  notifyQueueStatus();
}

// ═══════════════════════════════════════════════════════════════
// 📌 태그 마이그레이션 (원본 tagMigration.js)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 📌 태그 시스템 마이그레이션
// ═══════════════════════════════════════════════════════════════

async function migrateTagSystem() {
  try {
    const version = await getAppMeta("tag_system_version") || 0;
    
    if (version < 1) {
      console.log("태그 시스템 v5.0 마이그레이션 Phase 1 시작...");
      
      // Phase 1: tags → tag_data 변환
      const novels = await all(
        "SELECT id, tags, tag_data FROM novels WHERE tag_data = '' OR tag_data IS NULL"
      );
      
      for (const novel of novels) {
        if (novel.tags) {
          const tagData = tagsStringToTagData(novel.tags, 3);
          await exec(
            "UPDATE novels SET tag_data = ? WHERE id = ?",
            [JSON.stringify(tagData), novel.id]
          );
        }
      }
      
      await setAppMeta("tag_system_version", 1);
      console.log(`태그 시스템 Phase 1 완료: ${novels.length}개 작품 변환`);
    }
    
    if (version < 2) {
      console.log("태그 시스템 v5.0 마이그레이션 Phase 2 시작...");
      
      // Phase 2: 작품 식별자를 aliases로 분리
      const novels = await all("SELECT id, tag_data, aliases FROM novels");
      let migratedCount = 0;
      
      for (const novel of novels) {
        const tagData = parseTagData(novel.tag_data);
        const existingAliases = parseNovelAliases(novel.aliases);
        
        const newAliases = [...existingAliases];
        const cleanedTagData = [];
        let changed = false;
        
        for (const t of tagData) {
          if (isWorkIdentifier(t.tag)) {
            if (!newAliases.includes(t.tag)) {
              newAliases.push(t.tag);
              changed = true;
            }
          } else {
            cleanedTagData.push(t);
          }
        }
        
        if (changed) {
          await exec(
            "UPDATE novels SET tag_data = ?, aliases = ? WHERE id = ?",
            [JSON.stringify(cleanedTagData), JSON.stringify(newAliases), novel.id]
          );
          migratedCount++;
        }
      }
      
      await setAppMeta("tag_system_version", 2);
      console.log(`태그 시스템 Phase 2 완료: ${migratedCount}개 작품 업데이트`);
    }
    
    // 🔧 v3.4.5 Phase 3: major_genre/sub_genre를 tags에 병합 (일관성 보장)
    if (version < 3) {
      console.log("태그 시스템 v3.4.5 마이그레이션 Phase 3 시작 (태그 동기화)...");
      
      const novels = await all("SELECT id, tags, major_genre, sub_genre FROM novels");
      let syncedCount = 0;
      
      for (const novel of novels) {
        // 현재 tags 파싱
        const currentTags = (novel.tags || "")
          .split(",")
          .map(t => t.trim())
          .filter(Boolean);
        
        // major_genre, sub_genre 파싱
        let majorGenres = [];
        let subGenres = [];
        try {
          if (novel.major_genre) {
            const parsed = JSON.parse(novel.major_genre);
            majorGenres = Array.isArray(parsed) ? parsed : [parsed];
          }
        } catch {}
        try {
          if (novel.sub_genre) {
            const parsed = JSON.parse(novel.sub_genre);
            subGenres = Array.isArray(parsed) ? parsed : [parsed];
          }
        } catch {}
        
        // 누락된 장르를 tags에 추가
        const tagsSet = new Set(currentTags.map(t => t.toLowerCase()));
        const missingTags = [];
        
        for (const g of majorGenres) {
          if (g && !tagsSet.has(g.toLowerCase())) {
            missingTags.push(g);
          }
        }
        for (const g of subGenres) {
          if (g && !tagsSet.has(g.toLowerCase())) {
            missingTags.push(g);
          }
        }
        
        if (missingTags.length > 0) {
          const newTags = [...missingTags, ...currentTags].join(", ");
          await exec(
            "UPDATE novels SET tags = ? WHERE id = ?",
            [newTags, novel.id]
          );
          syncedCount++;
        }
      }
      
      // 예정 작품도 동기화
      const plannedNovels = await all("SELECT id, tags, major_genre, sub_genre FROM planned_novels");
      let plannedSyncedCount = 0;
      
      for (const novel of plannedNovels) {
        const currentTags = (novel.tags || "")
          .split(",")
          .map(t => t.trim())
          .filter(Boolean);
        
        let majorGenres = [];
        let subGenres = [];
        try {
          if (novel.major_genre) {
            const parsed = JSON.parse(novel.major_genre);
            majorGenres = Array.isArray(parsed) ? parsed : [parsed];
          }
        } catch {}
        try {
          if (novel.sub_genre) {
            const parsed = JSON.parse(novel.sub_genre);
            subGenres = Array.isArray(parsed) ? parsed : [parsed];
          }
        } catch {}
        
        const tagsSet = new Set(currentTags.map(t => t.toLowerCase()));
        const missingTags = [];
        
        for (const g of majorGenres) {
          if (g && !tagsSet.has(g.toLowerCase())) {
            missingTags.push(g);
          }
        }
        for (const g of subGenres) {
          if (g && !tagsSet.has(g.toLowerCase())) {
            missingTags.push(g);
          }
        }
        
        if (missingTags.length > 0) {
          const newTags = [...missingTags, ...currentTags].join(", ");
          await exec(
            "UPDATE planned_novels SET tags = ? WHERE id = ?",
            [newTags, novel.id]
          );
          plannedSyncedCount++;
        }
      }
      
      await setAppMeta("tag_system_version", 3);
      console.log(`태그 시스템 Phase 3 완료: 본 목록 ${syncedCount}개, 예정 목록 ${plannedSyncedCount}개 동기화`);
    }
    
    return true;
  } catch (e) {
    console.warn("태그 시스템 마이그레이션 오류:", e);
    return false;
  }
}

/**
 * 단일 작품의 태그 동기화
 * tag_data를 마스터로, tags를 자동 갱신
 */

// ═══════════════════════════════════════════════════════════════
// 📌 태그 동기화
// ═══════════════════════════════════════════════════════════════

async function syncNovelTags(novelId, tagData) {
  const tagsString = tagDataToString(tagData);
  await exec(
    "UPDATE novels SET tags = ?, tag_data = ? WHERE id = ?",
    [tagsString, JSON.stringify(tagData), novelId]
  );
}

/* =========================================================================
 * 🧠 취향 발견 시스템 (Preference Discovery System) v3.5.0
 * =========================================================================
 *
 * 목표: "아는 나 + 모르는 나"를 모두 찾아주는 AI 취향 분석 시스템
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 아키텍처                                                            │
 * │                                                                     │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
 * │  │   수집층    │→ │   분석층    │→ │   발견층    │                │
 * │  │  Collector  │  │  Analyzer   │  │  Discoverer │                │
 * │  └─────────────┘  └─────────────┘  └─────────────┘                │
 * │         ↓                ↓                ↓                        │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
 * │  │ choice_logs │  │  patterns   │  │  insights   │                │
 * │  └─────────────┘  └─────────────┘  └─────────────┘                │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * 패턴 카테고리 (12개):
 * - 동적: genre_matchup, genre_affinity, tag_power, tag_combo, tag_aversion,
 *         author_loyalty, rating_behavior, read_preference
 * - 정적: static_genre_rating, static_tag_droprate, static_spectrum, static_author
 *
 * 인사이트 유형:
 * - 확인형: CORE_PREFERENCE, GENRE_STRENGTH, TAG_AFFINITY, AUTHOR_LOYALTY
 * - 발견형: HIDDEN_PATTERN, CROSS_MISMATCH, RATING_OVERRIDE, UNCONSCIOUS_BIAS
 * - 질문형: ANOMALY_QUESTION, PREFERENCE_CHECK
 * ========================================================================= */

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 안전한 JSON 파싱
 */

// ═══════════════════════════════════════════════════════════════
// 📌 Export
// ═══════════════════════════════════════════════════════════════

export {
  migrateTagSystem,
  syncNovelTags,
};
