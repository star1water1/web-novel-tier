/**
 * 티어 시스템 프리셋 정의
 * @module constants/tierPresets
 *
 * @description
 * 내장 프리셋 6개 + 사용자 커스텀 프리셋(최대 5개) 지원.
 * 각 프리셋은 완전한 tierSystemConfig 객체.
 */

/**
 * 내장 프리셋 목록
 * - id: 고유 식별자
 * - name: 한글 표시 이름
 * - description: 간단 설명
 * - config: tierSystemConfig 객체
 */
export const TIER_PRESETS = [
  {
    id: "default_6",
    name: "기본 (6티어)",
    description: "S/A/B+/B/B-/C 매칭 기반 시스템",
    config: {
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
    },
  },
  {
    id: "simple_3",
    name: "간단 (3티어)",
    description: "상/중/하 3단계 시스템",
    config: {
      mode: "match",
      tiers: [
        { key: "상", label: "상", color: "#8b5cf6", threshold: 1700, gated: true  },
        { key: "중", label: "중", color: "#3b82f6", threshold: 1500, gated: false },
        { key: "하", label: "하", color: "#ef4444", threshold: 0,    gated: false },
      ],
      defaultTier: "하",
      defaultRating: 1500,
      allowRegistrationTier: false,
    },
  },
  {
    id: "detailed_9",
    name: "상세 (9티어)",
    description: "S+/S/A+/A/B+/B/B-/C/D 세분화 시스템",
    config: {
      mode: "match",
      tiers: [
        { key: "S+", label: "S+", color: "#7c3aed", threshold: 2100, gated: true  },
        { key: "S",  label: "S",  color: "#8b5cf6", threshold: 1950, gated: true  },
        { key: "A+", label: "A+", color: "#2563eb", threshold: 1850, gated: true  },
        { key: "A",  label: "A",  color: "#3b82f6", threshold: 1750, gated: false },
        { key: "B+", label: "B+", color: "#22c55e", threshold: 1650, gated: false },
        { key: "B",  label: "B",  color: "#a3e635", threshold: 1550, gated: false },
        { key: "B-", label: "B-", color: "#f59e0b", threshold: 1450, gated: false },
        { key: "C",  label: "C",  color: "#ef4444", threshold: 1350, gated: false },
        { key: "D",  label: "D",  color: "#dc2626", threshold: 0,    gated: false },
      ],
      defaultTier: "D",
      defaultRating: 1500,
      allowRegistrationTier: false,
    },
  },
  {
    id: "letter_5",
    name: "알파벳 (5티어)",
    description: "A/B/C/D/F 학점형 시스템",
    config: {
      mode: "match",
      tiers: [
        { key: "A", label: "A", color: "#8b5cf6", threshold: 1800, gated: true  },
        { key: "B", label: "B", color: "#3b82f6", threshold: 1650, gated: false },
        { key: "C", label: "C", color: "#22c55e", threshold: 1500, gated: false },
        { key: "D", label: "D", color: "#f59e0b", threshold: 1350, gated: false },
        { key: "F", label: "F", color: "#ef4444", threshold: 0,    gated: false },
      ],
      defaultTier: "F",
      defaultRating: 1500,
      allowRegistrationTier: false,
    },
  },
  {
    id: "score_10",
    name: "점수형 (10티어)",
    description: "10점~1점 점수형 시스템",
    config: {
      mode: "match",
      tiers: [
        { key: "10", label: "10", color: "#7c3aed", threshold: 2100, gated: true },
        { key: "9",  label: "9",  color: "#8b5cf6", threshold: 1950, gated: true },
        { key: "8",  label: "8",  color: "#3b82f6", threshold: 1800, gated: false },
        { key: "7",  label: "7",  color: "#06b6d4", threshold: 1700, gated: false },
        { key: "6",  label: "6",  color: "#22c55e", threshold: 1600, gated: false },
        { key: "5",  label: "5",  color: "#a3e635", threshold: 1500, gated: false },
        { key: "4",  label: "4",  color: "#f59e0b", threshold: 1400, gated: false },
        { key: "3",  label: "3",  color: "#f97316", threshold: 1300, gated: false },
        { key: "2",  label: "2",  color: "#ef4444", threshold: 1200, gated: false },
        { key: "1",  label: "1",  color: "#dc2626", threshold: 0,    gated: false },
      ],
      defaultTier: "1",
      defaultRating: 1500,
      allowRegistrationTier: false,
    },
  },
  {
    id: "manual_simple",
    name: "직접 배정 (3티어)",
    description: "추천/보통/비추천 직접 배정 시스템",
    config: {
      mode: "manual",
      tiers: [
        { key: "추천",   label: "추천",   color: "#22c55e", threshold: 0, gated: false },
        { key: "보통",   label: "보통",   color: "#3b82f6", threshold: 0, gated: false },
        { key: "비추천", label: "비추천", color: "#ef4444", threshold: 0, gated: false },
      ],
      defaultTier: "보통",
      defaultRating: 1500,
      allowRegistrationTier: true,
    },
  },
];

/** 커스텀 프리셋 최대 개수 */
export const MAX_CUSTOM_PRESETS = 5;
