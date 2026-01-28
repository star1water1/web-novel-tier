/**
 * 기본 설정값 상수
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 14341-14386
 * 
 * 사용법:
 * import { DEFAULT_SETTINGS, DEFAULT_TIER_THRESHOLDS } from './src/constants';
 */

// ═══════════════════════════════════════════════════════════════
// ⚙️ 기본 티어 임계값
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_TIER_THRESHOLDS = { 
  S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 
};

// ═══════════════════════════════════════════════════════════════
// ⚙️ 기본 설정값
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_SETTINGS = {
  tierThresholds: { S: 1950, A: 1850, "B+": 1700, B: 1600, "B-": 1500 },
  autoApproveEnabled: false,        // 자동 승인 활성화
  autoApproveMinWins: 10,           // 자동 승인 최소 승수
  autoApproveMaxLosses: 3,          // 자동 승인 최대 패수
  autoApproveMinMatches: 15,        // 자동 승인 최소 매칭 수
  showReviewBanner: true,           // 홈 화면 검토 배너 표시
  undoStackSize: 30,                // 되돌리기 스택 크기
  fullscreenMode: false,            // 🆕 v3.4.4: 전체 화면 모드 (상태바 숨김)
  // 📝 보충 탭 기준 (v2.8)
  supplement: {
    enabled: true,                   // 보충 탭 활성화
    minTags: 5,                      // 최소 태그 수 (이하면 보충 대상)
    requireAuthor: true,             // 작가 필수
    requireTotalEpisodes: true,      // 전체 회차 필수
    requireReadCount: true,          // 읽은 회차 필수
    requireMajorGenre: true,         // 대장르 필수
    requireSubGenre: false,          // 부장르 필수
    requirePlatform: true,           // 플랫폼 필수
    excludeNegativeTagCount: 2,      // 부정 태그 N개 이상이면 제외 (취향아님 포함)
    excludeTags: ["취향아님"],        // 제외 기준에 반드시 포함되는 태그
  },
  // 📰 최신 탭 설정 (v3.0)
  recentChanges: {
    retentionDays: 30,               // 기록 유지 기간 (일)
    showNewRegistration: true,       // 신규 등록 표시
    showAward: true,                 // 수상 표시
    showTierChange: true,            // 티어 변화 표시
    showTierReview: true,            // 티어 심사 통과 표시
    showReadCountIncrease: true,     // 읽은 회차 증가 표시
  },
  // 📋 예정탭 확장 필드 설정 (v3.4)
  plannedFields: {
    showExpectedRating: false,       // 예상 레이팅 (숫자 입력)
    showScheduledStart: true,        // 읽기 시작 예정일
    showSimilarNovels: false,        // 비슷한 작품 (고급)
  },
  // 🖼️ 표지 라이브러리 설정 (v3.4.5)
  coverLibrary: {
    compressionLevel: "light",       // "original" | "light" | "medium" | "heavy"
    // original: 원본 유지 (1~5MB)
    // light: 가벼운 압축 - 80% quality, 최대 1200px (기본값)
    // medium: 중간 압축 - 60% quality, 최대 800px
    // heavy: 강한 압축 - 40% quality, 최대 600px
  },
};
