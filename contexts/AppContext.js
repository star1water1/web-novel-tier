/**
 * 앱 전역 Context
 * @module contexts/AppContext
 * @version 6.0
 *
 * @description
 * 네비게이션, 테마, 설정, 로딩 상태를 관리하는 최상위 Context.
 * DB 초기화를 담당하며, dbReady 플래그로 하위 Context 초기화를 트리거.
 *
 * 제공 값:
 *  - screen / setScreen: 현재 화면
 *  - isLoading / setIsLoading: 전역 로딩
 *  - darkMode / setDarkMode: 다크모드 (null=시스템)
 *  - isDark: 최종 다크 여부
 *  - theme (C): 현재 테마 색상 객체
 *  - appSettings / saveSettings: 앱 설정 CRUD
 *  - settingsSubTab / setSettingsSubTab
 *  - dbReady: DB 초기화 완료 플래그
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useColorScheme } from "react-native";
import { LightTheme, DarkTheme, DEFAULT_SETTINGS } from "../constants";
import { initDb, getAppMeta, setAppMeta } from "../database";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const systemScheme = useColorScheme();

  // ── DB 상태 ──
  const [dbReady, setDbReady] = useState(false);

  // ── 네비게이션 ──
  const [screen, setScreen] = useState("home");
  const [settingsSubTab, setSettingsSubTab] = useState("app");

  // ── 로딩 ──
  const [isLoading, setIsLoading] = useState(true);

  // ── 테마 ──
  const [darkMode, setDarkModeRaw] = useState(null);
  const isDark = useMemo(() => (darkMode === null ? systemScheme === "dark" : darkMode), [darkMode, systemScheme]);
  const theme = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

  // ── 설정 ──
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);

  // ── DB 초기화 + 설정 로드 ──
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const savedDark = await getAppMeta("settings_darkMode");
        if (savedDark !== null) setDarkModeRaw(savedDark);
        const savedSettings = await getAppMeta("app_settings");
        if (savedSettings) setAppSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
        setDbReady(true);
      } catch (e) {
        console.error("AppContext 초기화 오류:", e);
        setDbReady(true); // 실패해도 앱은 실행
      }
    })();
  }, []);

  // ── 다크모드 변경 (DB 저장) ──
  const setDarkMode = useCallback(async (v) => {
    setDarkModeRaw(v);
    try { await setAppMeta("settings_darkMode", v); } catch (e) { console.warn("다크모드 저장 실패:", e); }
  }, []);

  // ── 설정 저장 (DB 저장) ──
  const saveSettings = useCallback(async (updates) => {
    setAppSettings((prev) => {
      const merged = { ...prev, ...updates };
      setAppMeta("app_settings", merged).catch((e) => console.warn("설정 저장 실패:", e));
      return merged;
    });
  }, []);

  const value = useMemo(() => ({
    screen, setScreen,
    settingsSubTab, setSettingsSubTab,
    isLoading, setIsLoading,
    darkMode, setDarkMode, isDark, theme,
    appSettings, setAppSettings, saveSettings,
    dbReady,
  }), [screen, settingsSubTab, isLoading, darkMode, isDark, theme, appSettings, dbReady, setDarkMode, saveSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
