/**
 * src/utils/matchQueue.js
 * 매칭 큐잉 시스템 (v3.4.6)
 * 
 * v4.0 리팩토링 - App.jsx에서 분리
 * 
 * 기능:
 * - 빠른 연타에도 DB 트랜잭션 충돌 방지
 * - UI는 즉시 응답, DB는 순차 처리
 * - pending 매치 추적으로 중복 방지
 */

// ═══════════════════════════════════════════════════════════════
// 📊 상태 변수 (모듈 레벨 싱글톤)
// ═══════════════════════════════════════════════════════════════
const matchQueue = [];
let isProcessingMatchQueue = false;
let matchQueueUpdateCallback = null;
const pendingMatchPairs = new Set();

// ═══════════════════════════════════════════════════════════════
// 🔧 콜백 등록
// ═══════════════════════════════════════════════════════════════

/**
 * 큐 상태 업데이트 콜백 등록
 * @param {Function} callback - { pending, processing } 객체를 받는 콜백
 */
export function setMatchQueueCallback(callback) {
  matchQueueUpdateCallback = callback;
}

/**
 * 큐 상태 알림 (내부용)
 */
function notifyQueueStatus() {
  if (matchQueueUpdateCallback) {
    matchQueueUpdateCallback({
      pending: matchQueue.length,
      processing: isProcessingMatchQueue
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔑 키 생성 및 중복 체크
// ═══════════════════════════════════════════════════════════════

/**
 * pair 키 생성 헬퍼 (중복 체크용)
 * @param {string} aId - 작품 A의 ID
 * @param {string} bId - 작품 B의 ID
 * @returns {string} 정렬된 pair 키
 */
export function matchPairKey(aId, bId) {
  return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
}

/**
 * 매치가 이미 큐에 있는지 확인
 * @param {string} aId - 작품 A의 ID
 * @param {string} bId - 작품 B의 ID
 * @returns {boolean} 큐에 존재 여부
 */
export function isMatchPending(aId, bId) {
  return pendingMatchPairs.has(matchPairKey(aId, bId));
}

// ═══════════════════════════════════════════════════════════════
// 📥 큐 관리
// ═══════════════════════════════════════════════════════════════

/**
 * 매칭 작업을 큐에 추가
 * @param {Function} task - 실행할 비동기 작업
 * @param {string|null} pairKey - 중복 방지용 키 (optional)
 * @returns {Promise} 작업 완료 Promise
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
 * 큐 순차 처리 (내부용)
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

// ═══════════════════════════════════════════════════════════════
// 📊 상태 조회
// ═══════════════════════════════════════════════════════════════

/**
 * 현재 큐 상태 조회
 * @returns {{ pending: number, processing: boolean }}
 */
export function getMatchQueueStatus() {
  return {
    pending: matchQueue.length,
    processing: isProcessingMatchQueue
  };
}

/**
 * 큐 비우기 (앱 종료 시 등)
 */
export function clearMatchQueue() {
  matchQueue.length = 0;
  pendingMatchPairs.clear();
  isProcessingMatchQueue = false;
  notifyQueueStatus();
}
