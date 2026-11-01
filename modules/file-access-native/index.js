import { requireOptionalNativeModule } from "expo";

// Android 외 플랫폼이나 네이티브 재빌드 전(OTA만 받은 구버전 APK 등)에는 null이다.
// 직접 쓰지 말고 src/features/file-access를 거칠 것.
export default requireOptionalNativeModule("FileAccessNative");
