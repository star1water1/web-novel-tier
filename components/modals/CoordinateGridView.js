/**
 * 좌표계 그리드 뷰 (v6.0)
 * @module components/modals/CoordinateGridView
 * 
 * @source_origin 원본 App.jsx 8310-8580줄 (271줄)
 * 
 * @description
 * 태그 좌표계를 시각적으로 표시하는 그리드 컴포넌트
 * 
 * 기능:
 * - X축/Y축 라벨 표시
 * - 태그 위치를 점으로 표시
 * - 선택한 태그 하이라이트
 * - 터치로 태그 선택
 * 
 * @props
 * - system: 좌표계 정의 객체
 * - selectedTag: 현재 선택된 태그
 * - onSelectTag: 태그 선택 콜백
 * - highlightTags: 하이라이트할 태그 배열
 * - theme: 테마 객체
 */

import React, { memo, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";

// ═══════════════════════════════════════════════════════════════
// 📌 CoordinateGridView 컴포넌트
// ═══════════════════════════════════════════════════════════════

const CoordinateGridView = memo(({
  system, // { name, xAxis, yAxis, tags: { tagName: { x, y } } }
  selectedTag, // 현재 선택된 태그
  editingPosition, // 🆕 { tag, x, y } - 편집 중인 태그의 임시 위치
  onSelectTag, // (tagName) => void
  onUpdatePosition, // (tagName, x, y) => void
  onAddAtPosition, // (x, y) => void - 빈 공간 터치 시
  theme,
  gridSize = 280, // 그리드 크기 (정사각형)
}) => {
  const C = theme;
  const padding = 40; // 축 라벨용 패딩
  const totalSize = gridSize + padding * 2;
  
  if (!system) return null;
  
  const tags = system.tags || {};
  const tagEntries = Object.entries(tags);
  
  // 좌표 → 픽셀 변환
  const coordToPixel = (x, y) => ({
    px: padding + x * gridSize,
    py: padding + (1 - y) * gridSize, // Y축 반전 (위가 1.0)
  });
  
  // 픽셀 → 좌표 변환
  const pixelToCoord = (px, py) => ({
    x: Math.max(0, Math.min(1, (px - padding) / gridSize)),
    y: Math.max(0, Math.min(1, 1 - (py - padding) / gridSize)),
  });
  
  // 그리드 터치 이벤트
  const handleGridPress = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const { x, y } = pixelToCoord(locationX, locationY);
    
    // 터치 위치 근처에 태그가 있는지 확인
    const touchRadius = 20; // 터치 인식 반경 (픽셀)
    let foundTag = null;
    
    for (const [tagName, pos] of tagEntries) {
      const { px, py } = coordToPixel(pos.x, pos.y);
      const dist = Math.sqrt(Math.pow(locationX - px, 2) + Math.pow(locationY - py, 2));
      if (dist < touchRadius) {
        foundTag = tagName;
        break;
      }
    }
    
    if (foundTag) {
      onSelectTag?.(foundTag);
    } else {
      // 빈 공간 터치 - 새 태그 추가 위치
      onAddAtPosition?.(x, y);
    }
  };
  
  // 그리드 선 생성 (5x5 그리드)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    // 세로선
    gridLines.push(
      <View
        key={`v${i}`}
        style={{
          position: "absolute",
          left: padding + ratio * gridSize,
          top: padding,
          width: 1,
          height: gridSize,
          backgroundColor: i === 2 ? C.sub : C.line,
          opacity: i === 2 ? 0.5 : 0.3,
        }}
      />
    );
    // 가로선
    gridLines.push(
      <View
        key={`h${i}`}
        style={{
          position: "absolute",
          left: padding,
          top: padding + ratio * gridSize,
          width: gridSize,
          height: 1,
          backgroundColor: i === 2 ? C.sub : C.line,
          opacity: i === 2 ? 0.5 : 0.3,
        }}
      />
    );
  }
  
  // 🆕 편집 중인 태그의 표시 위치 계산
  const getDisplayPosition = (tagName) => {
    if (editingPosition && editingPosition.tag === tagName) {
      return { x: editingPosition.x, y: editingPosition.y };
    }
    return tags[tagName];
  };
  
  return (
    <View style={{ alignItems: "center", marginVertical: 12 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleGridPress}
        style={{
          width: totalSize,
          height: totalSize,
          backgroundColor: C.bg,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.line,
          position: "relative",
        }}
      >
        {/* 그리드 선 */}
        {gridLines}
        
        {/* 축 라벨 - X축 (상단/하단) */}
        <Text style={{
          position: "absolute",
          top: 8,
          left: padding + gridSize / 2,
          transform: [{ translateX: -30 }],
          fontSize: 10,
          color: C.sub,
          fontWeight: "600",
        }}>
          {system.xAxis?.positive || "→"}
        </Text>
        <Text style={{
          position: "absolute",
          bottom: 8,
          left: padding + gridSize / 2,
          transform: [{ translateX: -30 }],
          fontSize: 10,
          color: C.sub,
          fontWeight: "600",
        }}>
          {system.xAxis?.negative || "←"}
        </Text>
        
        {/* 축 라벨 - Y축 (좌측/우측) */}
        <Text style={{
          position: "absolute",
          left: 4,
          top: padding + gridSize / 2,
          transform: [{ translateY: -8 }],
          fontSize: 10,
          color: C.sub,
          fontWeight: "600",
          width: 32,
          textAlign: "center",
        }}>
          {system.yAxis?.negative || "↓"}
        </Text>
        <Text style={{
          position: "absolute",
          right: 4,
          top: padding + gridSize / 2,
          transform: [{ translateY: -8 }],
          fontSize: 10,
          color: C.sub,
          fontWeight: "600",
          width: 32,
          textAlign: "center",
        }}>
          {system.yAxis?.positive || "↑"}
        </Text>
        
        {/* 태그 점들 */}
        {tagEntries.map(([tagName, _]) => {
          const pos = getDisplayPosition(tagName);
          if (!pos) return null;
          
          const { px, py } = coordToPixel(pos.x, pos.y);
          const isSelected = selectedTag === tagName;
          const isEditing = editingPosition?.tag === tagName;
          
          return (
            <View
              key={tagName}
              style={{
                position: "absolute",
                left: px - 6,
                top: py - 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isEditing ? "#f59e0b" : isSelected ? C.primary : "#3b82f6",
                borderWidth: isSelected || isEditing ? 3 : 1,
                borderColor: isSelected || isEditing ? "#fff" : "rgba(255,255,255,0.5)",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              }}
            />
          );
        })}
        
        {/* 🆕 새 태그 추가 위치 표시 (편집 중이고 isNew인 경우) */}
        {editingPosition && editingPosition.isNew && (
          <View
            style={{
              position: "absolute",
              left: coordToPixel(editingPosition.x, editingPosition.y).px - 8,
              top: coordToPixel(editingPosition.x, editingPosition.y).py - 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#22c55e",
              borderWidth: 3,
              borderColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          />
        )}
        
        {/* 선택된 태그 라벨 */}
        {selectedTag && tags[selectedTag] && (
          (() => {
            const pos = getDisplayPosition(selectedTag);
            if (!pos) return null;
            const { px, py } = coordToPixel(pos.x, pos.y);
            return (
              <View
                style={{
                  position: "absolute",
                  left: px + 10,
                  top: py - 10,
                  backgroundColor: C.primary,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  maxWidth: 120,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }} numberOfLines={1}>
                  {selectedTag}
                </Text>
              </View>
            );
          })()
        )}
      </TouchableOpacity>
      
      {/* 범례 */}
      <View style={{ flexDirection: "row", marginTop: 8, gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#3b82f6" }} />
          <Text style={{ fontSize: 10, color: C.sub }}>태그</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f59e0b" }} />
          <Text style={{ fontSize: 10, color: C.sub }}>편집중</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" }} />
          <Text style={{ fontSize: 10, color: C.sub }}>추가위치</Text>
        </View>
      </View>
    </View>
  );
});

export default CoordinateGridView;
