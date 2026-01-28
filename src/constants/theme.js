/**
 * 테마 색상 정의
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 5191-5205
 * 
 * 사용법:
 * import { LightTheme, DarkTheme } from './src/constants/theme';
 */

// 라이트 모드 색상
export const LightTheme = {
  bg: "#F5F7FB",
  card: "#fff",
  line: "#E7EEF6",
  text: "#0B1220",
  sub: "#6B7A90",
  primary: "#2D6AE3",
  warn: "#E05252",
  ok: "#0AA06E",
  chip: "#EEF4FF",
  // 티어 색상
  s: "#8b5cf6",
  a: "#3b82f6",
  bp: "#22c55e",
  b: "#a3e635",
  bm: "#f59e0b",
  c: "#ef4444",
  // 오버레이
  overlay: "rgba(255,255,255,0.85)",
  modal: "rgba(0,0,0,0.4)",
};

// 다크 모드 색상
export const DarkTheme = {
  bg: "#0f172a",
  card: "#1e293b",
  line: "#334155",
  text: "#f1f5f9",
  sub: "#94a3b8",
  primary: "#3b82f6",
  warn: "#ef4444",
  ok: "#22c55e",
  chip: "#334155",
  // 티어 색상
  s: "#a78bfa",
  a: "#60a5fa",
  bp: "#4ade80",
  b: "#bef264",
  bm: "#fbbf24",
  c: "#f87171",
  // 오버레이
  overlay: "rgba(15,23,42,0.85)",
  modal: "rgba(0,0,0,0.6)",
};

// 플랫폼 URL (표지 연동용)
export const PLATFORM_URLS = {
  "문피아": "https://www.munpia.com",
  "리디": "https://ridibooks.com",
  "카카페": "https://page.kakao.com",
  "노벨피아": "https://novelpia.com",
  "시리즈": "https://series.naver.com",
};
