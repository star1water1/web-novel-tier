/**
 * src/utils/database.js
 * SQLite 데이터베이스 연결 및 쿼리 헬퍼
 * 
 * 분리 날짜: 2025-01-29
 * v4.0 Step 24: 최초 분리
 * v4.0 Step 33: DB 안정성 강화 (2025-01-29)
 *   - WAL 모드 활성화 (동시성 + 크래시 복구)
 *   - 청크 단위 배치 처리 (execBatchChunked)
 *   - 작업 상태 추적 (setPendingOperation)
 *   - 연결 헬스체크 강화
 *   - SQLITE_BUSY/locked 에러 핸들링
 * 
 * 사용법:
 * import { openDb, exec, all, first, execBatch, execBatchChunked } from './src/utils';
 */

import * as SQLite from "expo-sqlite";

// ═══════════════════════════════════════════════════════════════
// 📊 모듈 레벨 상태
// ═══════════════════════════════════════════════════════════════
let db = null;
let dbOpenPromise = null;
let dbLastSuccessTime = 0;
let dbOperationState = null; // 현재 진행 중인 대규모 작업 상태

// ═══════════════════════════════════════════════════════════════
// 🔌 연결 관리
// ═══════════════════════════════════════════════════════════════

/**
 * 데이터베이스 열기 (강화된 재연결 로직 + WAL 모드)
 * - 이미 연결 중이면 해당 Promise 대기
 * - 기존 연결이 있고 최근 성공했으면 재사용
 * - 기존 연결 테스트 후 실패 시 새 연결
 * - WAL 모드로 크래시 복구 및 동시성 개선
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
    
    // 🔧 v4.0 Step 33: WAL 모드 활성화
    // - 읽기/쓰기 동시 가능
    // - 크래시 시 자동 복구
    // - 성능 향상
    try {
      await db.runAsync("PRAGMA journal_mode = WAL;");
      await db.runAsync("PRAGMA synchronous = NORMAL;"); // 성능과 안전성 균형
      await db.runAsync("PRAGMA cache_size = -2000;"); // 2MB 캐시
      await db.runAsync("PRAGMA busy_timeout = 5000;"); // 5초 대기 (락 충돌 시)
      console.log("DB WAL 모드 활성화됨");
    } catch (pragmaError) {
      console.warn("PRAGMA 설정 실패 (무시됨):", pragmaError.message);
    }
    
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
 * - AppState 변경 시 호출
 * - 연결 오류 복구 시 호출
 */
export function resetDbConnection() {
  console.log("DB 연결 리셋");
  db = null;
  dbOpenPromise = null;
  dbLastSuccessTime = 0;
}

/**
 * 🆕 v4.0 Step 33: 작업 상태 설정 (복원 등 대규모 작업 추적)
 * @param {Object|null} state - { type: "import", progress: 50, total: 100 } 또는 null
 */
export function setDbOperationState(state) {
  dbOperationState = state;
  if (state) {
    console.log(`[DB] 작업 상태: ${state.type} ${state.progress || 0}/${state.total || "?"}`);
  }
}

/**
 * 🆕 v4.0 Step 33: 작업 상태 조회
 */
export function getDbOperationState() {
  return dbOperationState;
}

/**
 * 안전한 DB 실행 래퍼 (자동 재연결 + 재시도)
 * - 최대 5회 재시도
 * - 연결 오류 시 자동 리셋 후 재연결
 * - 점진적 대기 시간 증가
 * - SQLITE_BUSY/locked 에러 특별 처리
 */
async function safeDbOperation(operation, operationName = "DB") {
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
      
      const isBusyError =
        errorMsg.includes("SQLITE_BUSY") ||
        errorMsg.includes("locked") ||
        errorMsg.includes("database is locked");
      
      console.warn(`${operationName} 오류 (시도 ${attempt + 1}/${maxRetries}):`, errorMsg);
      
      if (isConnectionError) {
        resetDbConnection();
      }
      
      if (attempt === maxRetries - 1) {
        throw e;
      }
      
      // 점진적 대기 (BUSY 에러는 더 긴 대기)
      const baseWait = isBusyError ? 500 : 300;
      const waitTime = baseWait * (attempt + 1);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 📝 쿼리 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 단일 쿼리 실행 (INSERT, UPDATE, DELETE 등)
 */
export async function exec(sql, params = []) {
  return safeDbOperation(
    (database) => database.runAsync(sql, params),
    "exec"
  );
}

/**
 * SELECT 결과 전체 반환
 */
export async function all(sql, params = []) {
  return safeDbOperation(
    (database) => database.getAllAsync(sql, params),
    "all"
  );
}

/**
 * SELECT 결과 첫 번째 행 반환
 */
export async function first(sql, params = []) {
  return safeDbOperation(
    (database) => database.getFirstAsync(sql, params),
    "first"
  );
}

/**
 * 트랜잭션 실행 (여러 쿼리를 원자적으로 실행)
 * ⚠️ 대량 작업(100개 이상)은 execBatchChunked 사용 권장
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

/**
 * 🆕 v4.0 Step 33: 청크 단위 배치 실행 (대량 작업용)
 * - 지정된 청크 크기로 분할하여 처리
 * - 각 청크마다 트랜잭션 커밋
 * - 중간에 실패해도 이전 청크는 저장됨
 * 
 * @param {Array} queries - { sql, params } 배열
 * @param {number} chunkSize - 청크 크기 (기본값: 100)
 * @param {Function} onProgress - 진행 콜백 (optional): (completed, total) => void
 * @returns {Promise<{ success: number, failed: number }>}
 */
export async function execBatchChunked(queries, chunkSize = 100, onProgress = null) {
  if (!queries || queries.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  const total = queries.length;
  let success = 0;
  let failed = 0;
  
  // 청크로 분할
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = queries.slice(i, Math.min(i + chunkSize, total));
    
    try {
      await execBatch(chunk);
      success += chunk.length;
      
      // 진행률 콜백
      if (onProgress) {
        onProgress(success, total);
      }
      
      // 청크 사이에 약간의 지연 (DB 부하 분산)
      if (i + chunkSize < total) {
        await new Promise(r => setTimeout(r, 50));
      }
    } catch (e) {
      console.error(`execBatchChunked 청크 실패 (${i}-${i + chunk.length}):`, e.message);
      failed += chunk.length;
      
      // 개별 쿼리로 재시도
      for (const query of chunk) {
        try {
          await exec(query.sql, query.params);
          success++;
          failed--;
        } catch (individualError) {
          console.warn("개별 쿼리 실패:", individualError.message);
        }
      }
    }
  }
  
  return { success, failed };
}

// ═══════════════════════════════════════════════════════════════
// 🔄 마이그레이션 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 테이블에 컬럼이 존재하는지 확인
 */
export async function columnExists(table, name) {
  const rows = await all(`PRAGMA table_info(${table});`);
  return rows.some((r) => r.name === name);
}

/**
 * 컬럼이 없으면 추가 (마이그레이션용)
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
// 📦 앱 메타데이터 (키-값 저장)
// ═══════════════════════════════════════════════════════════════

/**
 * 앱 메타데이터 조회
 */
export async function getAppMeta(key) {
  const row = await first("SELECT value FROM app_meta WHERE key=?", [key]);
  if (!row || row.value == null) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

/**
 * 앱 메타데이터 저장
 */
export async function setAppMeta(key, value) {
  const json = JSON.stringify(value ?? null);
  await exec("DELETE FROM app_meta WHERE key=?", [key]);
  await exec("INSERT INTO app_meta (key,value) VALUES (?,?);", [key, json]);
}

// ═══════════════════════════════════════════════════════════════
// 🔧 DB 상태 체크 유틸리티 (v4.0 Step 33)
// ═══════════════════════════════════════════════════════════════

/**
 * 🆕 v4.0 Step 33: DB 연결 상태 확인
 * @returns {Promise<{ connected: boolean, walMode: boolean, lastSuccess: number }>}
 */
export async function checkDbHealth() {
  try {
    const database = await openDb();
    
    // 기본 쿼리 테스트
    await database.getAllAsync("SELECT 1;");
    
    // WAL 모드 확인
    let walMode = false;
    try {
      const result = await database.getFirstAsync("PRAGMA journal_mode;");
      walMode = result?.journal_mode === "wal";
    } catch {}
    
    return {
      connected: true,
      walMode,
      lastSuccess: dbLastSuccessTime,
    };
  } catch (e) {
    return {
      connected: false,
      walMode: false,
      lastSuccess: dbLastSuccessTime,
      error: e.message,
    };
  }
}

/**
 * 🆕 v4.0 Step 33: 크래시 복구 상태 확인
 * - 이전에 중단된 작업이 있는지 확인
 * @returns {Promise<Object|null>} - 중단된 작업 정보 또는 null
 */
export async function checkPendingOperation() {
  try {
    const pending = await getAppMeta("pending_operation");
    return pending;
  } catch {
    return null;
  }
}

/**
 * 🆕 v4.0 Step 33: 대기 중인 작업 설정
 * @param {Object|null} operation - { type: "import", startedAt, ... } 또는 null (완료 시)
 */
export async function setPendingOperation(operation) {
  await setAppMeta("pending_operation", operation);
}

/**
 * 🆕 v4.0 Step 33: DB 무결성 체크
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function checkDbIntegrity() {
  try {
    const result = await first("PRAGMA integrity_check;");
    const ok = result?.integrity_check === "ok";
    return { ok, error: ok ? undefined : result?.integrity_check };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
