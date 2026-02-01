/**
 * src/context/ThemeContext.js
 * React Context 기반 테마 시스템
 * 
 * v4.0 Step 32 - UI 컴포넌트 분리를 위한 테마 Context
 * 
 * 사용법:
 * // App.jsx에서
 * import { ThemeProvider } from './src/context/ThemeContext';
 * <ThemeProvider isDark={isDark}><App /></ThemeProvider>
 * 
 * // 컴포넌트에서
 * import { useTheme } from './src/context/ThemeContext';
 * const { theme, isDark } = useTheme();
 */

import React, { createContext, useContext, useMemo } from 'react';
import { LightTheme, DarkTheme } from '../constants';

// ═══════════════════════════════════════════════════════════════
// 🎨 Context 생성
// ═══════════════════════════════════════════════════════════════

const ThemeContext = createContext({
  theme: LightTheme,
  isDark: false,
});

// ═══════════════════════════════════════════════════════════════
// 🎨 Provider 컴포넌트
// ═══════════════════════════════════════════════════════════════

/**
 * 테마 Provider
 * @param {boolean} isDark - 다크모드 여부
 * @param {React.ReactNode} children - 자식 컴포넌트
 */
export function ThemeProvider({ isDark, children }) {
  const value = useMemo(() => ({
    theme: isDark ? DarkTheme : LightTheme,
    isDark,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎨 Hook
// ═══════════════════════════════════════════════════════════════

/**
 * 테마 훅
 * @returns {{ theme: Object, isDark: boolean }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn('[useTheme] ThemeContext not found, using default LightTheme');
    return { theme: LightTheme, isDark: false };
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════
// 🎨 HOC (Higher-Order Component) - 클래스 컴포넌트용
// ═══════════════════════════════════════════════════════════════

/**
 * 테마를 props로 주입하는 HOC
 * @param {React.Component} WrappedComponent - 래핑할 컴포넌트
 */
export function withTheme(WrappedComponent) {
  return function ThemedComponent(props) {
    const { theme, isDark } = useTheme();
    return <WrappedComponent {...props} theme={theme} isDark={isDark} />;
  };
}

export default ThemeContext;
