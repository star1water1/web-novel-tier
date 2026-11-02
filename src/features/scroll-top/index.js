// 긴 화면에서 탭 메뉴까지 바로 돌아가는 '맨 위로' 버튼.
// 보임 상태를 여기 두어 스크롤할 때 App 전체가 다시 그려지지 않게 한다.
import { forwardRef, useImperativeHandle, useState } from "react";
import { Dimensions, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** App.jsx: 메인 ScrollView의 onScroll에서 ref.current.setOffset(y)를 부른다. */
export const ScrollTopButton = forwardRef(function ScrollTopButton({ C, onPress }, ref) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets(); // 내비게이션 바에 걸리면 터치가 버튼에 오지 않는다.
  useImperativeHandle(ref, () => ({
    setOffset: (y) => setVisible(y > Dimensions.get("window").height),
  }), []);
  if (!visible) return null;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="맨 위로"
      onPress={onPress}
      style={{
        position: "absolute",
        right: 16,
        bottom: 24 + insets.bottom,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.line,
        elevation: 4,
      }}
    >
      <Text style={{ color: C.text, fontSize: 20, fontWeight: "800" }}>↑</Text>
    </TouchableOpacity>
  );
});
