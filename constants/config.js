/**
 * 공유 상수 정의
 * @module constants/config
 */

/**
 * 티어 순서 (높은 순) - 레거시 폴백용
 * S > A > B+ > B > B- > C
 */
export const TIER_ORDER = ["S", "A", "B+", "B", "B-", "C"];

/**
 * 기본 티어 시스템 설정
 * - mode: "match" (매칭 기반) | "manual" (직접 배정) | "hybrid" (혼합)
 * - tiers: 티어 목록 (높은 순)
 *   - key: DB 저장용 식별자 (유니크, 안정적)
 *   - label: 화면 표시 이름
 *   - color: 배지 색상 (hex)
 *   - threshold: 레이팅 기준 (match/hybrid 모드에서 사용)
 *   - gated: 수동 승인 필요 여부 (match 모드에서만 적용)
 * - defaultTier: 등록 시 기본 티어 (match 모드)
 * - defaultRating: 등록 시 기본 레이팅
 * - allowRegistrationTier: 등록 시 티어 선택 허용 여부
 */
export const DEFAULT_TIER_SYSTEM_CONFIG = {
  mode: "match",
  tiers: [
    { key: "S",  label: "S",  color: "#8b5cf6", threshold: 1950, gated: true  },
    { key: "A",  label: "A",  color: "#3b82f6", threshold: 1850, gated: true  },
    { key: "B+", label: "B+", color: "#22c55e", threshold: 1700, gated: false },
    { key: "B",  label: "B",  color: "#a3e635", threshold: 1600, gated: false },
    { key: "B-", label: "B-", color: "#f59e0b", threshold: 1500, gated: false },
    { key: "C",  label: "C",  color: "#ef4444", threshold: 0,    gated: false },
  ],
  defaultTier: "C",
  defaultRating: 1500,
  allowRegistrationTier: false,
};

/**
 * 색상 프리셋 팔레트 (티어 색상 선택용)
 */
export const TIER_COLOR_PALETTE = [
  "#8b5cf6", "#7c3aed", "#6d28d9", // 보라
  "#3b82f6", "#2563eb", "#1d4ed8", // 파랑
  "#06b6d4", "#0891b2",             // 시안
  "#22c55e", "#16a34a",             // 초록
  "#a3e635", "#84cc16",             // 라임
  "#f59e0b", "#d97706",             // 황색
  "#f97316", "#ea580c",             // 주황
  "#ef4444", "#dc2626",             // 빨강
  "#ec4899", "#db2777",             // 핑크
  "#6b7280", "#374151",             // 회색
];
