# 파일 접근 모듈

기존 `App.jsx`와 분리된 파일 접근 기반이다. 기존 코드의 `expo-file-system/legacy` 사용은 그대로 두고, 새 기능만 이 모듈을 쓴다.

## 구조

| 위치 | 역할 |
|---|---|
| `index.js` | 공개 진입점. 외부에서는 여기만 import한다 |
| `fileAccessService.js` | 공개 함수, 입력 검증, 오류 통일 |
| `adapters/expoAdapter.js` | Expo API 구현 |
| `adapters/nativeAdapter.js` | Kotlin 모듈 호출 |
| `errors.js` | `FileAccessError`와 오류 코드 |
| `diagnostics.js` | 설정의 '파일 접근 모듈 점검' |
| `modules/file-access-native/` | Kotlin 로컬 Expo 모듈 (자동 연결) |

## 사용법

```js
import * as fileAccess from "./src/features/file-access";

try {
  const { uri: folder } = await fileAccess.pickDirectory();
  // folder를 저장해 두면 앱을 재시작해도 쓸 수 있다.
  const { uri } = await fileAccess.createFileInDirectory(folder, "backup.json", "application/json");
  await fileAccess.writeText(uri, json);
} catch (error) {
  if (error.code === fileAccess.FileAccessErrorCode.CANCELLED) return; // 사용자가 닫음
  if (error.code === fileAccess.FileAccessErrorCode.PERMISSION_LOST) { /* 폴더를 다시 선택받는다 */ }
  throw error;
}
```

## 주의사항

- **`content://` URI는 경로가 아니다.** 문자열로 조립하지 말고 API가 돌려준 값만 쓴다. `listDirectory`의 `name`도 URI에서 추정한 값이라 제공자에 따라 실제 이름과 다를 수 있다.
- **이름 변경 후에는 URI가 바뀔 수 있다.** `renameFile`의 반환값을 쓴다.
- **권한 확인은 `hasPersistedAccess`로 한다.** Expo 신규 API의 권한 검사는 `content://`에 항상 통과한다. 폴더 URI에만 쓸 수 있고, `pickFile`로 고른 개별 파일 URI는 별도 권한으로 등록된다.
- **유지 권한 개수에는 OS 상한이 있다.** 다 쓴 폴더는 `releaseDirectory`로 해제한다.
- **수 MB가 넘을 수 있는 텍스트는 `writeLargeText`, `readLargeText`, `hashFile`을 쓴다.** `readText`, `writeText`는 파일 전체를 Java 힙에 올려 큰 파일에서 OutOfMemoryError가 난다.
- **JS 문자열 한계:** Hermes는 약 256MB가 넘는 문자열을 만들지 못한다(`String length exceeds limit`). 백업 JSON도 이 한계를 넘으면 안내와 함께 실패한다. 복원은 파일 크기의 몇 배 메모리를 쓴다(200MB 파일에 약 1.5GB, RAM 8GB 환경 측정).
- **SAF가 낀 `copyFile`, `moveFile`은 파일 전체를 메모리에 올린다.** 큰 파일에 쓰기 전에 검증한다. SAF 문서끼리의 복사는 `NOT_SUPPORTED`다.
- **Android 정책:** 폴더 선택기에서 저장소 루트·`Download` 자체는 고를 수 없다. `MANAGE_EXTERNAL_STORAGE`를 쓰지 않는다.
- **DB 작업은 이 모듈 대상이 아니다.** 기존 `safeDbOperation`을 쓴다. SQLite 파일을 직접 복사·이동하지 않는다.
- **자동매칭 중 `Alert` 금지 규칙은 여기서도 유효하다.** `showFileAccessDiagnostics`에 `isBlocked`를 넘긴다.

## 기능 추가 규칙

1. Expo API로 되면 `expoAdapter`에만 추가한다.
2. 안 되면 이유와 Android API를 확인한 뒤 Kotlin 모듈과 `nativeAdapter`에 추가한다.
3. 공개 함수는 `fileAccessService`에 두고 `guarded`로 감싼다.
4. Kotlin을 고치면 APK를 다시 빌드해야 한다. OTA로는 반영되지 않는다.
5. 새 네이티브 호출은 `diagnostics.js`에 점검 단계를 추가한다.
