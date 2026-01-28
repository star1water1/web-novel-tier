/**
 * 옵션 상수 정의
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 5199-5226, 5413
 * 
 * 사용법:
 * import { STATUS_OPTIONS, PLATFORM_OPTIONS, ... } from './src/constants';
 */

// 📖 읽기 상태 (사용자의 독서 진행 상태)
export const STATUS_OPTIONS = [
  { key: "reading", label: "읽는 중", color: "#3b82f6" },  // 파랑
  { key: "completed", label: "완독", color: "#22c55e" },   // 초록
  { key: "dropped", label: "중단", color: "#ef4444" },     // 빨강
  { key: "planned", label: "예정", color: "#a855f7" },     // 보라
];
export const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.key, s]));

// 🆕 작품 연재 상태 (작품 자체의 상태)
export const WORK_STATUS_OPTIONS = [
  { key: "ongoing", label: "연재중", color: "#3b82f6" },    // 파란색
  { key: "completed", label: "완결", color: "#22c55e" },    // 초록색
  { key: "hiatus", label: "휴재", color: "#f59e0b" },       // 주황색
  { key: "dropped", label: "연중", color: "#ef4444" },      // 빨간색
  { key: "discontinued", label: "서비스종료", color: "#6b7280" }, // 회색
];
export const WORK_STATUS_MAP = Object.fromEntries(WORK_STATUS_OPTIONS.map(s => [s.key, s]));

// 📖 외전 상태 옵션
export const GAIDEN_STATUS_OPTIONS = [
  { key: "none", label: "외전없음", color: "#9ca3af" },      // 회색
  { key: "ongoing", label: "외전연재중", color: "#3b82f6" }, // 파란색
  { key: "completed", label: "외전완결", color: "#22c55e" }, // 초록색
];
export const GAIDEN_STATUS_MAP = Object.fromEntries(GAIDEN_STATUS_OPTIONS.map(s => [s.key, s]));

// 🎭 장르 옵션 (대분류)
export const GENRE_OPTIONS = ["무협", "선협", "현판", "현대", "로판", "로맨스", "판타지", "SF"];

// 📚 플랫폼 옵션
export const PLATFORM_OPTIONS = ["문피아", "리디", "카카페", "노벨피아", "시리즈"];
