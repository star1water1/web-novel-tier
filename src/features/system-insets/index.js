// 앱이 화면 전체를 쓰는(edge-to-edge) 동안 내비게이션 바와 키보드가 내용을 가리지 않게 한다.
// 이 모드에서는 키보드가 떠도 창이 줄지 않으므로 직접 여백을 둔다.
import React, { useEffect, useState } from "react";
import { Keyboard, Modal as RNModal, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BACKDROP = "rgba(0,0,0,0.5)";

function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const show = Keyboard.addListener("keyboardDidShow", (e) => setHeight(e?.endCoordinates?.height || 0));
    const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/** 루트 화면의 맨 아래에 둔다. 아래쪽 시스템 바는 SafeAreaView가 이미 비워 두므로 그만큼 뺀다. */
export function KeyboardSpacer() {
  const { bottom } = useSafeAreaInsets();
  const height = useKeyboardHeight();
  return height > 0 ? <View style={{ height: Math.max(0, height - bottom) }} /> : null;
}

/** React Native Modal 대신 쓴다. 내용을 내비게이션 바와 키보드 위까지만 그린다. */
export function Modal({ children, ...props }) {
  const { bottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const pad = Platform.OS === "android" ? Math.max(bottom, keyboard) : 0;
  const first = React.Children.toArray(children)[0];
  const contentColor = StyleSheet.flatten(first?.props?.style)?.backgroundColor;
  return (
    <RNModal {...props}>
      <View style={{ flex: 1, paddingBottom: pad, backgroundColor: props.transparent ? undefined : contentColor }} pointerEvents="box-none">
        {children}
        {props.transparent && pad > 0 ? (
          <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: pad, backgroundColor: BACKDROP }} />
        ) : null}
      </View>
    </RNModal>
  );
}
