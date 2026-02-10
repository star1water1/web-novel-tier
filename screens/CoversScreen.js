/**
 * 표지 라이브러리 화면
 * @module screens/CoversScreen
 * @version 6.1.4 (Context 아키텍처)
 *
 * @bugfix v6.1.4
 * - [FIX] CoverImage에 item.uri 전달 → DB 컬럼은 file_path이므로 undefined
 *   → item.file_path로 수정. 표지 라이브러리에서 모든 이미지가 표시되지 않던 문제 해소
 *
 * @description
 * 표지 이미지 라이브러리 관리 화면
 * Context: useApp(theme), useData(coverLibrary, coverLibrarySize, importCovers, removeCover, removeUnusedCovers...)
 */

import React, { memo, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { H, Section, Chip, PrimaryButton, OutlineButton } from "../components/common/ui";
import { CoverImage } from "../components/novel/NovelCard";
import { formatFileSize } from "../utils/helpers";
import { useApp } from "../contexts/AppContext";
import { useData } from "../contexts/DataContext";

// ═══════════════════════════════════════════════════════════════
// 📌 CoversScreen 컴포넌트
// ═══════════════════════════════════════════════════════════════

const CoversScreen = memo(() => {
  const { theme } = useApp();
  const {
    coverLibrary, coverLibrarySize,
    coverLibraryLoading, coverLibraryProgress,
    coverLibraryFilter, setCoverLibraryFilter,
    importCovers: importCoversFromGallery,
    removeCover: removeCoverFromLibrary,
    removeUnusedCovers: clearUnusedCovers,
  } = useData();
  const C = theme;

  // ─────────────────────────────────────────────────────────────
  // 필터링된 표지 목록
  // ─────────────────────────────────────────────────────────────
  const filteredCovers = useMemo(() => {
    if (!coverLibrary || coverLibrary.length === 0) return [];
    
    if (coverLibraryFilter === "unused") {
      return coverLibrary.filter(c => c.status === "unused");
    }
    if (coverLibraryFilter === "used") {
      return coverLibrary.filter(c => c.status === "used");
    }
    return coverLibrary;
  }, [coverLibrary, coverLibraryFilter]);

  // ─────────────────────────────────────────────────────────────
  // 통계 계산
  // ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = coverLibrary?.length || 0;
    const used = coverLibrary?.filter(c => c.status === "used").length || 0;
    const unused = coverLibrary?.filter(c => c.status === "unused").length || 0;
    return { total, used, unused };
  }, [coverLibrary]);

  // ─────────────────────────────────────────────────────────────
  // 삭제 확인
  // ─────────────────────────────────────────────────────────────
  const confirmRemove = useCallback((item) => {
    Alert.alert(
      "표지 삭제",
      "이 표지를 라이브러리에서 삭제할까요?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: () => removeCoverFromLibrary(item.id),
        },
      ]
    );
  }, [removeCoverFromLibrary]);

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <H theme={C}>표지 라이브러리</H>

      {/* 통계 및 로딩 */}
      <Section title="📊 라이브러리 현황" theme={C}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: C.text, fontWeight: "700" }}>
              총 {stats.total}장
            </Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              사용 중: {stats.used}장 · 미사용: {stats.unused}장
            </Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              용량: {formatFileSize(coverLibrarySize || 0)}
            </Text>
          </View>
          <PrimaryButton
            title="📷 갤러리에서 추가"
            onPress={importCoversFromGallery}
            style={{ paddingHorizontal: 16 }}
            theme={C}
          />
        </View>
        
        {coverLibraryLoading && (
          <View style={{ marginTop: 12, padding: 12, backgroundColor: C.chip, borderRadius: 8 }}>
            <Text style={{ color: C.text, fontWeight: "600", marginBottom: 4 }}>
              이미지 처리 중... ({coverLibraryProgress?.current || 0}/{coverLibraryProgress?.total || 0})
            </Text>
            <View style={{ height: 6, backgroundColor: C.line, borderRadius: 3, overflow: "hidden" }}>
              <View style={{
                width: `${coverLibraryProgress?.total > 0 ? (coverLibraryProgress.current / coverLibraryProgress.total * 100) : 0}%`,
                height: "100%",
                backgroundColor: C.primary,
              }} />
            </View>
          </View>
        )}
      </Section>

      {/* 필터 */}
      <Section title="🔍 필터" theme={C}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "all", label: `전체 (${stats.total})` },
            { key: "unused", label: `미사용 (${stats.unused})` },
            { key: "used", label: `사용 중 (${stats.used})` },
          ].map(opt => (
            <Chip
              key={opt.key}
              label={opt.label}
              active={coverLibraryFilter === opt.key}
              onPress={() => setCoverLibraryFilter(opt.key)}
              theme={C}
            />
          ))}
        </View>
      </Section>

      {/* 관리 */}
      <Section title="🗑️ 관리" theme={C}>
        <OutlineButton
          title={`미사용 표지 정리 (${stats.unused}장)`}
          onPress={clearUnusedCovers}
          disabled={stats.unused === 0}
          color={C.warn}
          theme={C}
        />
        <Text style={{ color: C.sub, fontSize: 11, marginTop: 6 }}>
          ※ 작품에 연결되지 않은 표지를 일괄 삭제합니다
        </Text>
      </Section>

      {/* 표지 목록 */}
      <Section title={`📚 표지 목록 (${filteredCovers.length}장)`} theme={C}>
        {filteredCovers.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🖼️</Text>
            <Text style={{ color: C.sub, textAlign: "center" }}>
              {coverLibraryFilter === "unused" 
                ? "미사용 표지가 없습니다" 
                : coverLibraryFilter === "used"
                ? "사용 중인 표지가 없습니다"
                : "표지가 없습니다. 갤러리에서 추가해보세요!"}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {filteredCovers.map((item) => {
              const isUsed = item.status === "used";
              return (
                <View 
                  key={item.id}
                  style={{
                    width: 100,
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    onLongPress={() => confirmRemove(item)}
                    style={{
                      borderWidth: 2,
                      borderColor: isUsed ? C.ok : C.line,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <CoverImage
                      uri={item.file_path}
                      size={90}
                      style={{ borderRadius: 6 }}
                    />
                  </TouchableOpacity>
                  <Text 
                    style={{ 
                      color: isUsed ? C.ok : C.sub, 
                      fontSize: 10, 
                      marginTop: 4,
                      fontWeight: isUsed ? "700" : "400",
                    }}
                  >
                    {isUsed ? "사용 중" : "미사용"}
                  </Text>
                  {item.novel && (
                    <Text 
                      style={{ color: C.sub, fontSize: 9 }}
                      numberOfLines={1}
                    >
                      {item.novel}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
        
        <Text style={{ color: C.sub, fontSize: 11, marginTop: 12, textAlign: "center" }}>
          ※ 길게 눌러 삭제
        </Text>
      </Section>
    </>
  );
});

CoversScreen.displayName = "CoversScreen";

export default CoversScreen;
