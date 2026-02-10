/**
 * 웹소설 티어 앱 - 메인 컴포넌트
 * @version 6.1 (Context 아키텍처 - 모달 Context 직접 소비)
 *
 * @description
 * AllProviders로 Context를 래핑하고, AppShell에서 화면 라우팅 + 모달 렌더링.
 * 모든 상태는 Context에서 관리하므로 prop drilling 없음.
 * 스크린 + 모달 모두 props 0개 (Context 직접 소비).
 *
 * @changelog
 * v6.1 - 모달 15개 전부 Context 직접 소비로 전환
 *       - App.js 모달 핸들러 제거 (handleSaveEdit, handleUrlConfirm, etc.)
 *       - App.js에서 모달에 전달하던 props 전부 제거
 *
 * 아키텍처:
 *   AllProviders (App/Data/Tag/Filter/Modal)
 *     └─ AppShell
 *         ├─ Nav
 *         ├─ Screen (Context 소비)
 *         └─ Modals (Context 소비)
 */

import React from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AllProviders, useApp, useData, useFilter } from "./contexts";
import { Nav, LoadingOverlay } from "./components/navigation/Nav";
import {
  HomeScreen, RankScreen, MatchScreen, RecoScreen, BulkScreen,
  AnalysisScreen, TasteAnalysisScreen, AwardsScreen, SettingsScreen,
  PlannedScreen, RecentScreen, ReviewScreen, SupplementScreen, CoversScreen,
} from "./screens";
import {
  EditNovelModal, LogModal, ImportModal, ExportModal,
  TagSelectModal, TagManagerModal, CompareModal, PlannedEditModal,
  CoverSelectModal, UrlModal, SearchTagModal, TagEditModal,
  TagRelationModal, SupplementSettingsModal, CoordManageModal,
} from "./components/modals";

// ═══════════════════════════════════════════════════════════════
// 메인 앱 (Provider 래핑)
// ═══════════════════════════════════════════════════════════════

export default function App() {
  return (
    <AllProviders>
      <AppShell />
    </AllProviders>
  );
}

// ═══════════════════════════════════════════════════════════════
// AppShell - 실제 UI (Context 소비)
// ═══════════════════════════════════════════════════════════════

function AppShell() {
  const app = useApp();
  const data = useData();
  const filter = useFilter();

  const { screen, isLoading, isDark, theme } = app;
  const C = theme;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {isLoading && <LoadingOverlay isLoading={isLoading} theme={C} />}

      <View style={{ flex: 1, padding: 16 }}>
        {/* 네비게이션 */}
        <Nav
          screen={screen} setScreen={app.setScreen} theme={C}
          reviewCount={filter.reviewCount}
          supplementCount={filter.supplementList.length}
          recentChanges={data.recentChanges}
          plannedList={data.plannedList}
          appSettings={app.appSettings}
        />

        {/* ═══ 화면 라우터 (props 없음 - Context 소비) ═══ */}
        {screen === "home"       && <HomeScreen />}
        {screen === "rank"       && <RankScreen />}
        {screen === "match"      && <MatchScreen />}
        {screen === "reco"       && <RecoScreen />}
        {screen === "bulk"       && <BulkScreen />}
        {screen === "analysis"   && <AnalysisScreen />}
        {screen === "taste"      && <TasteAnalysisScreen />}
        {screen === "awards"     && <AwardsScreen />}
        {screen === "settings"   && <SettingsScreen />}
        {screen === "planned"    && <PlannedScreen />}
        {screen === "recent"     && <RecentScreen />}
        {screen === "review"     && <ReviewScreen />}
        {screen === "supplement" && <SupplementScreen />}
        {screen === "covers"     && <CoversScreen />}
      </View>

      {/* ═══ 모달 레이어 (props 없음 - Context 직접 소비) ═══ */}
      <EditNovelModal />
      <LogModal />
      <ImportModal />
      <ExportModal />
      <TagSelectModal />
      <TagManagerModal />
      <CompareModal />
      <PlannedEditModal />
      <CoverSelectModal />
      <UrlModal />
      <SearchTagModal />
      <TagEditModal />
      <TagRelationModal />
      <SupplementSettingsModal />
      <CoordManageModal />
    </SafeAreaView>
  );
}
