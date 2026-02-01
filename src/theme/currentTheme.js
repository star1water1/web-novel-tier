/**
 * src/theme/currentTheme.js
 * 모듈 스코프 테마 상태 공유
 * 
 * v4.0 Step 32
 * 
 * ⚠️ 주의: 이 방식은 React 권장 패턴이 아니지만,
 * 기존 코드 호환성을 위해 점진적 마이그레이션 과정에서 사용됩니다.
 * 
 * 향후 완전한 Context 마이그레이션 후 제거 예정입니다.
 * 
 * 사용법:
 * // App.jsx에서 (렌더링 시)
 * import { setCurrentTheme } from './src/theme/currentTheme';
 * setCurrentTheme(isDark);
 * 
 * // UI 컴포넌트에서
 * import { getCurrentTheme } from './src/theme/currentTheme';
 * const C = getCurrentTheme();
 */

import { LightTheme, DarkTheme } from '../constants';

// 모듈 스코프 테마 상태
let _currentTheme = LightTheme;
let _isDark = false;

/**
 * 현재 테마 가져오기
 * @returns {Object} 현재 테마 객체
 */
export function getCurrentTheme() {
  return _currentTheme;
}

/**
 * 다크모드 여부 가져오기
 * @returns {boolean}
 */
export function getIsDark() {
  return _isDark;
}

/**
 * 테마 설정
 * @param {boolean} isDark - 다크모드 여부
 */
export function setCurrentTheme(isDark) {
  _isDark = isDark;
  _currentTheme = isDark ? DarkTheme : LightTheme;
}

/**
 * 테마 직접 설정 (커스텀 테마용)
 * @param {Object} theme - 테마 객체
 */
export function setThemeObject(theme) {
  _currentTheme = theme;
}
