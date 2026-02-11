/**
 * 진단용 App.js - 크래시 원인 추적
 * ErrorBoundary로 에러를 화면에 표시
 */

import React from "react";
import { View, Text, ScrollView, StatusBar } from "react-native";

// ═══════════════════════════════════════════════════════════════
// ErrorBoundary
// ═══════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 }}>
          <Text style={{ color: "#ff6b6b", fontSize: 20, fontWeight: "800", marginBottom: 10 }}>
            ❌ 크래시 감지!
          </Text>
          <Text style={{ color: "#ffd93d", fontSize: 14, fontWeight: "600", marginBottom: 5 }}>
            에러 메시지:
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, marginBottom: 15 }}>
            {String(this.state.error)}
          </Text>
          <Text style={{ color: "#ffd93d", fontSize: 14, fontWeight: "600", marginBottom: 5 }}>
            스택 트레이스:
          </Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ color: "#ccc", fontSize: 10 }}>
              {this.state.error?.stack || "No stack"}
            </Text>
            <Text style={{ color: "#888", fontSize: 10, marginTop: 10 }}>
              {this.state.errorInfo?.componentStack || "No component stack"}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════
// 단계별 진단 로드
// ═══════════════════════════════════════════════════════════════

let loadLog = [];
let loadError = null;

// Step 1: SafeAreaProvider
let SafeAreaProvider, SafeAreaView;
try {
  const sac = require("react-native-safe-area-context");
  SafeAreaProvider = sac.SafeAreaProvider;
  SafeAreaView = sac.SafeAreaView;
  loadLog.push("✅ react-native-safe-area-context");
} catch (e) {
  loadLog.push("❌ react-native-safe-area-context: " + e.message);
  loadError = e;
}

// Step 2: Constants
let constants;
try {
  constants = require("./constants");
  loadLog.push("✅ constants (" + Object.keys(constants).length + " exports)");
} catch (e) {
  loadLog.push("❌ constants: " + e.message);
  loadError = e;
}

// Step 3: Database
let database;
try {
  database = require("./database");
  loadLog.push("✅ database (" + Object.keys(database).length + " exports)");
} catch (e) {
  loadLog.push("❌ database: " + e.message);
  loadError = e;
}

// Step 4: Utils
let utils;
try {
  utils = require("./utils/helpers");
  loadLog.push("✅ utils/helpers (" + Object.keys(utils).length + " exports)");
} catch (e) {
  loadLog.push("❌ utils/helpers: " + e.message);
  loadError = e;
}

// Step 5: Common UI
let commonUI;
try {
  commonUI = require("./components/common/ui");
  loadLog.push("✅ components/common/ui (" + Object.keys(commonUI).length + " exports)");
} catch (e) {
  loadLog.push("❌ components/common/ui: " + e.message);
  loadError = e;
}

// Step 6: Charts
let charts;
try {
  charts = require("./components/charts");
  loadLog.push("✅ components/charts");
} catch (e) {
  loadLog.push("❌ components/charts: " + e.message);
  loadError = e;
}

// Step 7: Services
let eloService, backupService, analysisService;
try {
  eloService = require("./services/eloService");
  loadLog.push("✅ services/eloService");
} catch (e) {
  loadLog.push("❌ services/eloService: " + e.message);
  loadError = e;
}
try {
  backupService = require("./services/backupService");
  loadLog.push("✅ services/backupService");
} catch (e) {
  loadLog.push("❌ services/backupService: " + e.message);
  loadError = e;
}
try {
  analysisService = require("./services/analysisService");
  loadLog.push("✅ services/analysisService");
} catch (e) {
  loadLog.push("❌ services/analysisService: " + e.message);
  loadError = e;
}

// Step 8: Handlers
let handlers;
try {
  handlers = require("./handlers");
  loadLog.push("✅ handlers (" + Object.keys(handlers).length + " exports)");
} catch (e) {
  loadLog.push("❌ handlers: " + e.message);
  loadError = e;
}

// Step 9: Contexts
let contexts;
try {
  contexts = require("./contexts");
  loadLog.push("✅ contexts (" + Object.keys(contexts).length + " exports)");
} catch (e) {
  loadLog.push("❌ contexts: " + e.message);
  loadError = e;
}

// Step 10: Navigation
let Nav, LoadingOverlay;
try {
  const nav = require("./components/navigation/Nav");
  Nav = nav.Nav;
  LoadingOverlay = nav.LoadingOverlay;
  loadLog.push("✅ components/navigation/Nav");
} catch (e) {
  loadLog.push("❌ components/navigation/Nav: " + e.message);
  loadError = e;
}

// Step 11: Screens
let screens;
try {
  screens = require("./screens");
  loadLog.push("✅ screens (" + Object.keys(screens).length + " exports)");
} catch (e) {
  loadLog.push("❌ screens: " + e.message);
  loadError = e;
}

// Step 12: Modals
let modals;
try {
  modals = require("./components/modals");
  loadLog.push("✅ modals (" + Object.keys(modals).length + " exports)");
} catch (e) {
  loadLog.push("❌ modals: " + e.message);
  loadError = e;
}

// Step 13: expo-image
try {
  require("expo-image");
  loadLog.push("✅ expo-image");
} catch (e) {
  loadLog.push("❌ expo-image: " + e.message);
  loadError = e;
}

// Step 14: expo-sqlite
try {
  require("expo-sqlite");
  loadLog.push("✅ expo-sqlite");
} catch (e) {
  loadLog.push("❌ expo-sqlite: " + e.message);
  loadError = e;
}

// Step 15: expo-file-system
try {
  require("expo-file-system");
  loadLog.push("✅ expo-file-system");
} catch (e) {
  loadLog.push("❌ expo-file-system: " + e.message);
  loadError = e;
}

// Step 16: expo-image-picker
try {
  require("expo-image-picker");
  loadLog.push("✅ expo-image-picker");
} catch (e) {
  loadLog.push("❌ expo-image-picker: " + e.message);
  loadError = e;
}

// Step 17: expo-navigation-bar
try {
  require("expo-navigation-bar");
  loadLog.push("✅ expo-navigation-bar");
} catch (e) {
  loadLog.push("⚠️ expo-navigation-bar: " + e.message);
}

// Step 18: expo-image-manipulator
try {
  require("expo-image-manipulator");
  loadLog.push("✅ expo-image-manipulator");
} catch (e) {
  loadLog.push("⚠️ expo-image-manipulator: " + e.message);
}

// ═══════════════════════════════════════════════════════════════
// 진단 결과 화면
// ═══════════════════════════════════════════════════════════════

function DiagnosticScreen() {
  const [dbStatus, setDbStatus] = React.useState("testing...");
  const [contextStatus, setContextStatus] = React.useState("pending");

  React.useEffect(() => {
    (async () => {
      try {
        if (database && database.initDb) {
          await database.initDb();
          setDbStatus("✅ DB 초기화 성공");
        } else {
          setDbStatus("⚠️ database.initDb 없음");
        }
      } catch (e) {
        setDbStatus("❌ DB 초기화 실패: " + e.message);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0F1A", padding: 16, paddingTop: 50 }}>
      <StatusBar barStyle="light-content" />
      <Text style={{ color: "#4ade80", fontSize: 20, fontWeight: "800", marginBottom: 10 }}>
        🔍 Novel Tier 진단
      </Text>
      <Text style={{ color: "#fbbf24", fontSize: 14, fontWeight: "600", marginBottom: 5 }}>
        모듈 로드 결과:
      </Text>
      <ScrollView style={{ flex: 1 }}>
        {loadLog.map((log, i) => (
          <Text key={i} style={{ 
            color: log.startsWith("✅") ? "#4ade80" : log.startsWith("⚠️") ? "#fbbf24" : "#ef4444",
            fontSize: 11, 
            marginBottom: 3,
            fontFamily: "monospace",
          }}>
            {log}
          </Text>
        ))}
        <Text style={{ color: "#60a5fa", fontSize: 12, fontWeight: "600", marginTop: 10, marginBottom: 3 }}>
          DB 상태: {dbStatus}
        </Text>
        {loadError && (
          <>
            <Text style={{ color: "#ef4444", fontSize: 14, fontWeight: "600", marginTop: 10 }}>
              첫 에러 상세:
            </Text>
            <Text style={{ color: "#fca5a5", fontSize: 10, marginTop: 3 }}>
              {loadError.stack || loadError.message}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// 앱 (에러 없으면 실제 앱, 에러 있으면 진단 화면)
// ═══════════════════════════════════════════════════════════════

function RealApp() {
  if (!contexts || !contexts.AllProviders) {
    return <DiagnosticScreen />;
  }
  
  const { AllProviders } = contexts;
  
  return (
    <SafeAreaProvider>
      <AllProviders>
        <AppShell />
      </AllProviders>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const app = contexts.useApp();
  const data = contexts.useData();
  const filter = contexts.useFilter();

  const { screen, isLoading, isDark, theme } = app;
  const C = theme;

  const HomeScreen = screens?.HomeScreen;
  const RankScreen = screens?.RankScreen;
  const MatchScreen = screens?.MatchScreen;
  const RecoScreen = screens?.RecoScreen;
  const BulkScreen = screens?.BulkScreen;
  const AnalysisScreen = screens?.AnalysisScreen;
  const TasteAnalysisScreen = screens?.TasteAnalysisScreen;
  const AwardsScreen = screens?.AwardsScreen;
  const SettingsScreen = screens?.SettingsScreen;
  const PlannedScreen = screens?.PlannedScreen;
  const RecentScreen = screens?.RecentScreen;
  const ReviewScreen = screens?.ReviewScreen;
  const SupplementScreen = screens?.SupplementScreen;
  const CoversScreen = screens?.CoversScreen;

  const EditNovelModal = modals?.EditNovelModal;
  const LogModal = modals?.LogModal;
  const ImportModal = modals?.ImportModal;
  const ExportModal = modals?.ExportModal;
  const TagSelectModal = modals?.TagSelectModal;
  const TagManagerModal = modals?.TagManagerModal;
  const CompareModal = modals?.CompareModal;
  const PlannedEditModal = modals?.PlannedEditModal;
  const CoverSelectModal = modals?.CoverSelectModal;
  const UrlModal = modals?.UrlModal;
  const SearchTagModal = modals?.SearchTagModal;
  const TagEditModal = modals?.TagEditModal;
  const TagRelationModal = modals?.TagRelationModal;
  const SupplementSettingsModal = modals?.SupplementSettingsModal;
  const CoordManageModal = modals?.CoordManageModal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {isLoading && LoadingOverlay && <LoadingOverlay isLoading={isLoading} theme={C} />}

      <View style={{ flex: 1, padding: 16 }}>
        {Nav && (
          <Nav
            screen={screen} setScreen={app.setScreen} theme={C}
            reviewCount={filter.reviewCount}
            supplementCount={filter.supplementList.length}
            recentChanges={data.recentChanges}
            plannedList={data.plannedList}
            appSettings={app.appSettings}
          />
        )}

        {screen === "home"       && HomeScreen && <HomeScreen />}
        {screen === "rank"       && RankScreen && <RankScreen />}
        {screen === "match"      && MatchScreen && <MatchScreen />}
        {screen === "reco"       && RecoScreen && <RecoScreen />}
        {screen === "bulk"       && BulkScreen && <BulkScreen />}
        {screen === "analysis"   && AnalysisScreen && <AnalysisScreen />}
        {screen === "taste"      && TasteAnalysisScreen && <TasteAnalysisScreen />}
        {screen === "awards"     && AwardsScreen && <AwardsScreen />}
        {screen === "settings"   && SettingsScreen && <SettingsScreen />}
        {screen === "planned"    && PlannedScreen && <PlannedScreen />}
        {screen === "recent"     && RecentScreen && <RecentScreen />}
        {screen === "review"     && ReviewScreen && <ReviewScreen />}
        {screen === "supplement" && SupplementScreen && <SupplementScreen />}
        {screen === "covers"     && CoversScreen && <CoversScreen />}
      </View>

      {EditNovelModal && <EditNovelModal />}
      {LogModal && <LogModal />}
      {ImportModal && <ImportModal />}
      {ExportModal && <ExportModal />}
      {TagSelectModal && <TagSelectModal />}
      {TagManagerModal && <TagManagerModal />}
      {CompareModal && <CompareModal />}
      {PlannedEditModal && <PlannedEditModal />}
      {CoverSelectModal && <CoverSelectModal />}
      {UrlModal && <UrlModal />}
      {SearchTagModal && <SearchTagModal />}
      {TagEditModal && <TagEditModal />}
      {TagRelationModal && <TagRelationModal />}
      {SupplementSettingsModal && <SupplementSettingsModal />}
      {CoordManageModal && <CoordManageModal />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {loadError ? <DiagnosticScreen /> : <RealApp />}
    </ErrorBoundary>
  );
}
