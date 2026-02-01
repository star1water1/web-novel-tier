/**
 * src/utils/schedulerManager.js
 * 비동기 스케줄러 중앙 관리 모듈
 * 
 * v4.0 Step 28 - 비동기 타이밍 버그 방지
 * 
 * ⚠️ 중요: 이 모듈은 앱의 모든 배치 처리 스케줄러를 중앙 관리하여
 *    - 앱 백그라운드 전환 시 타이머 정리 및 데이터 보존
 *    - 포그라운드 복귀 시 pending 작업 재개
 *    - 앱 종료 전 긴급 flush 가능
 *    - 스케줄러 상태 모니터링 및 디버깅
 * 
 * 사용법:
 * import { 
 *   registerScheduler, flushAllSchedulers, pauseAllSchedulers, resumeAllSchedulers,
 *   getSchedulerStatus
 * } from './src/utils';
 */

// ═══════════════════════════════════════════════════════════════
// 📊 스케줄러 레지스트리
// ═══════════════════════════════════════════════════════════════

/**
 * 등록된 스케줄러들
 * @type {Map<string, SchedulerConfig>}
 */
const _schedulers = new Map();

/**
 * 전체 일시정지 상태
 */
let _isPaused = false;

/**
 * 디버그 모드
 */
let _debugMode = false;

// ═══════════════════════════════════════════════════════════════
// 🔧 스케줄러 등록/관리
// ═══════════════════════════════════════════════════════════════

/**
 * 스케줄러 등록
 * @param {string} name - 스케줄러 이름 (고유)
 * @param {Object} config - 설정
 * @param {Function} config.onFlush - flush 시 호출될 비동기 함수 (batch) => Promise
 * @param {number} [config.delay=1000] - 스케줄 지연 시간 (ms)
 * @param {number} [config.maxBatchSize=50] - 즉시 flush 트리거 배치 크기
 * @param {boolean} [config.flushOnPause=true] - 일시정지 시 flush 여부
 */
export function registerScheduler(name, config) {
  if (_schedulers.has(name)) {
    console.warn(`[SchedulerManager] Scheduler "${name}" already registered, replacing...`);
  }
  
  _schedulers.set(name, {
    name,
    onFlush: config.onFlush,
    delay: config.delay || 1000,
    maxBatchSize: config.maxBatchSize || 50,
    flushOnPause: config.flushOnPause !== false,
    // 상태
    batch: [],
    timer: null,
    isScheduled: false,
    lastFlushTime: null,
    totalFlushed: 0,
    flushCount: 0,
  });
  
  if (_debugMode) {
    console.log(`[SchedulerManager] Registered: ${name}`);
  }
}

/**
 * 스케줄러 등록 해제
 * @param {string} name - 스케줄러 이름
 * @param {boolean} [flush=true] - 해제 전 flush 여부
 */
export async function unregisterScheduler(name, flush = true) {
  const scheduler = _schedulers.get(name);
  if (!scheduler) return;
  
  if (flush && scheduler.batch.length > 0) {
    await _flushScheduler(scheduler);
  }
  
  if (scheduler.timer) {
    clearTimeout(scheduler.timer);
  }
  
  _schedulers.delete(name);
  
  if (_debugMode) {
    console.log(`[SchedulerManager] Unregistered: ${name}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📥 배치 추가
// ═══════════════════════════════════════════════════════════════

/**
 * 배치에 아이템 추가
 * @param {string} schedulerName - 스케줄러 이름
 * @param {*} item - 추가할 아이템 (또는 배열)
 */
export function addToBatch(schedulerName, item) {
  const scheduler = _schedulers.get(schedulerName);
  if (!scheduler) {
    console.warn(`[SchedulerManager] Unknown scheduler: ${schedulerName}`);
    return;
  }
  
  // 배열이면 전체 추가, 아니면 단일 추가
  if (Array.isArray(item)) {
    scheduler.batch.push(...item);
  } else {
    scheduler.batch.push(item);
  }
  
  // 최대 크기 도달 시 즉시 flush
  if (scheduler.batch.length >= scheduler.maxBatchSize) {
    _flushScheduler(scheduler);
    return;
  }
  
  // 스케줄 (일시정지 상태가 아닐 때만)
  if (!_isPaused && !scheduler.isScheduled) {
    _scheduleFlush(scheduler);
  }
}

/**
 * 특정 스케줄러의 현재 배치 크기
 * @param {string} schedulerName 
 * @returns {number}
 */
export function getBatchSize(schedulerName) {
  const scheduler = _schedulers.get(schedulerName);
  return scheduler ? scheduler.batch.length : 0;
}

// ═══════════════════════════════════════════════════════════════
// ⏰ 스케줄 관리 (내부)
// ═══════════════════════════════════════════════════════════════

/**
 * flush 스케줄 (내부)
 */
function _scheduleFlush(scheduler) {
  if (scheduler.isScheduled || _isPaused) return;
  
  scheduler.isScheduled = true;
  scheduler.timer = setTimeout(async () => {
    scheduler.timer = null;
    scheduler.isScheduled = false;
    
    if (scheduler.batch.length > 0) {
      await _flushScheduler(scheduler);
    }
  }, scheduler.delay);
}

/**
 * 스케줄러 flush (내부)
 */
async function _flushScheduler(scheduler) {
  // 타이머 정리
  if (scheduler.timer) {
    clearTimeout(scheduler.timer);
    scheduler.timer = null;
  }
  scheduler.isScheduled = false;
  
  // 배치가 비어있으면 스킵
  if (scheduler.batch.length === 0) return;
  
  // 배치 추출 (원자적)
  const batch = scheduler.batch.splice(0);
  
  try {
    if (_debugMode) {
      console.log(`[SchedulerManager] Flushing ${scheduler.name}: ${batch.length} items`);
    }
    
    await scheduler.onFlush(batch);
    
    // 통계 업데이트
    scheduler.lastFlushTime = Date.now();
    scheduler.totalFlushed += batch.length;
    scheduler.flushCount += 1;
    
  } catch (e) {
    console.error(`[SchedulerManager] Flush error in ${scheduler.name}:`, e);
    // 실패한 배치는 복구하지 않음 (무한 루프 방지)
    // 필요시 에러 콜백 추가 가능
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎮 전역 제어
// ═══════════════════════════════════════════════════════════════

/**
 * 모든 스케줄러 flush
 * @param {boolean} [force=false] - true면 flushOnPause=false인 것도 flush
 */
export async function flushAllSchedulers(force = false) {
  const promises = [];
  
  for (const scheduler of _schedulers.values()) {
    if (force || scheduler.flushOnPause) {
      promises.push(_flushScheduler(scheduler));
    }
  }
  
  await Promise.all(promises);
  
  if (_debugMode) {
    console.log(`[SchedulerManager] All schedulers flushed`);
  }
}

/**
 * 특정 스케줄러 flush
 * @param {string} schedulerName 
 */
export async function flushScheduler(schedulerName) {
  const scheduler = _schedulers.get(schedulerName);
  if (scheduler) {
    await _flushScheduler(scheduler);
  }
}

/**
 * 모든 스케줄러 일시정지 (백그라운드 전환 시)
 * @param {boolean} [flush=true] - 정지 전 flush 여부
 */
export async function pauseAllSchedulers(flush = true) {
  if (_isPaused) return;
  _isPaused = true;
  
  // 모든 타이머 정지
  for (const scheduler of _schedulers.values()) {
    if (scheduler.timer) {
      clearTimeout(scheduler.timer);
      scheduler.timer = null;
    }
    scheduler.isScheduled = false;
  }
  
  // flush
  if (flush) {
    await flushAllSchedulers(false);
  }
  
  if (_debugMode) {
    console.log(`[SchedulerManager] All schedulers paused`);
  }
}

/**
 * 모든 스케줄러 재개 (포그라운드 복귀 시)
 */
export function resumeAllSchedulers() {
  if (!_isPaused) return;
  _isPaused = false;
  
  // pending batch가 있는 스케줄러는 다시 스케줄
  for (const scheduler of _schedulers.values()) {
    if (scheduler.batch.length > 0 && !scheduler.isScheduled) {
      _scheduleFlush(scheduler);
    }
  }
  
  if (_debugMode) {
    console.log(`[SchedulerManager] All schedulers resumed`);
  }
}

/**
 * 일시정지 상태 확인
 */
export function isPaused() {
  return _isPaused;
}

// ═══════════════════════════════════════════════════════════════
// 📊 상태 조회
// ═══════════════════════════════════════════════════════════════

/**
 * 특정 스케줄러 상태 조회
 * @param {string} schedulerName 
 */
export function getSchedulerStatus(schedulerName) {
  const scheduler = _schedulers.get(schedulerName);
  if (!scheduler) return null;
  
  return {
    name: scheduler.name,
    pendingCount: scheduler.batch.length,
    isScheduled: scheduler.isScheduled,
    lastFlushTime: scheduler.lastFlushTime,
    totalFlushed: scheduler.totalFlushed,
    flushCount: scheduler.flushCount,
  };
}

/**
 * 전체 스케줄러 상태 조회
 */
export function getAllSchedulerStatus() {
  const status = {
    isPaused: _isPaused,
    schedulers: {},
  };
  
  for (const [name, scheduler] of _schedulers) {
    status.schedulers[name] = {
      pendingCount: scheduler.batch.length,
      isScheduled: scheduler.isScheduled,
      lastFlushTime: scheduler.lastFlushTime,
      totalFlushed: scheduler.totalFlushed,
      flushCount: scheduler.flushCount,
    };
  }
  
  return status;
}

/**
 * 등록된 스케줄러 이름 목록
 */
export function getSchedulerNames() {
  return Array.from(_schedulers.keys());
}

// ═══════════════════════════════════════════════════════════════
// 🔧 유틸리티
// ═══════════════════════════════════════════════════════════════

/**
 * 디버그 모드 설정
 */
export function setDebugMode(enabled) {
  _debugMode = enabled;
}

/**
 * 전체 초기화 (테스트용)
 */
export async function resetSchedulerManager() {
  await flushAllSchedulers(true);
  _schedulers.clear();
  _isPaused = false;
}

// ═══════════════════════════════════════════════════════════════
// 📱 AppState 통합 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * AppState 변화 핸들러 (React Native용)
 * 
 * 사용법:
 * useEffect(() => {
 *   const sub = AppState.addEventListener('change', handleAppStateChange);
 *   return () => sub.remove();
 * }, []);
 * 
 * @param {string} nextState - 'active' | 'background' | 'inactive'
 */
export async function handleAppStateChange(nextState) {
  if (nextState === 'active') {
    resumeAllSchedulers();
  } else if (nextState === 'background' || nextState === 'inactive') {
    await pauseAllSchedulers(true);
  }
}
