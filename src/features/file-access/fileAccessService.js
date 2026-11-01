import * as expoAdapter from "./adapters/expoAdapter";
import * as nativeAdapter from "./adapters/nativeAdapter";
import { FileAccessError, FileAccessErrorCode, toFileAccessError } from "./errors";

// 모든 공개 함수의 실패를 FileAccessError로 통일한다.
const guarded = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    throw toFileAccessError(error);
  }
};

function assertUri(uri) {
  if (typeof uri !== "string" || !uri) {
    throw new FileAccessError(FileAccessErrorCode.INVALID_ARGUMENT, "URI가 필요합니다.");
  }
}

function assertFileName(name) {
  if (typeof name !== "string" || !name.trim() || /[\\/]/.test(name) || name === "." || name === "..") {
    throw new FileAccessError(FileAccessErrorCode.INVALID_ARGUMENT, `사용할 수 없는 파일 이름입니다: ${name}`);
  }
}

export const isNativeAvailable = nativeAdapter.isNativeAvailable;

/** @returns {string} 앱 캐시 디렉터리 (file://) */
export const getAppCacheDirectory = expoAdapter.appCacheDirectory;

/** @returns {Promise<string>} */
export const readText = guarded(async (uri) => {
  assertUri(uri);
  return expoAdapter.readText(uri);
});

export const writeText = guarded(async (uri, text) => {
  assertUri(uri);
  await expoAdapter.writeText(uri, text);
});

/** 조각으로 나눠 쓴다. readText·writeText가 Java 힙 한계에 걸리는 큰 파일용. @returns {Promise<{bytes: number, sha256: string}>} */
export const writeLargeText = guarded(async (uri, text) => {
  assertUri(uri);
  return nativeAdapter.writeLargeText(uri, text);
});

/** 조각으로 나눠 읽는다. @returns {Promise<string>} */
export const readLargeText = guarded(async (uri) => {
  assertUri(uri);
  return nativeAdapter.readLargeText(uri);
});

/** 파일 전체를 메모리에 올리지 않고 해시를 구한다. @returns {Promise<{bytes: number, sha256: string}>} */
export const hashFile = guarded(async (uri) => {
  assertUri(uri);
  return nativeAdapter.hashFile(uri);
});

/** 앱 저장공간(file://)에 폴더를 만든다. */
export const makeAppDirectory = guarded(async (uri) => {
  assertUri(uri);
  await expoAdapter.makeAppDirectory(uri);
});

/** 대상이 content:// 이면 createFileInDirectory로 먼저 만들어 두어야 한다. SAF가 낀 복사는 파일 전체를 메모리에 올린다. */
export const copyFile = guarded(async (from, to) => {
  assertUri(from);
  assertUri(to);
  await expoAdapter.copy(from, to);
});

export const moveFile = guarded(async (from, to) => {
  assertUri(from);
  assertUri(to);
  await expoAdapter.move(from, to);
});

export const deleteFile = guarded(async (uri) => {
  assertUri(uri);
  await expoAdapter.remove(uri);
});

/** @returns {Promise<string>} 이름 변경 후의 URI (이후 호출에는 이 값을 쓸 것) */
export const renameFile = guarded(async (uri, newName) => {
  assertUri(uri);
  assertFileName(newName);
  return expoAdapter.isContentUri(uri)
    ? nativeAdapter.renameDocument(uri, newName)
    : expoAdapter.renameAppFile(uri, newName);
});

/** @returns {Promise<{uri: string, name: string, isDirectory: boolean}[]>} content:// 의 name은 URI에서 추정한 값이다. */
export const listDirectory = guarded(async (uri) => {
  assertUri(uri);
  return expoAdapter.listDirectory(uri);
});

/** 취소 시 code가 CANCELLED인 FileAccessError를 던진다. */
export const pickFile = guarded(async ({ mimeType } = {}) => expoAdapter.pickFile(mimeType));

/** 선택한 폴더 권한은 앱을 재시작해도 유지된다. 반환된 uri를 저장해 재사용할 것. 취소 시 CANCELLED. */
export const pickDirectory = guarded(async ({ initialUri } = {}) => expoAdapter.pickDirectory(initialUri));

/** @returns {Promise<{uri: string}>} */
export const createFileInDirectory = guarded(async (directoryUri, name, mimeType = "text/plain") => {
  assertUri(directoryUri);
  assertFileName(name);
  return expoAdapter.createFileInDirectory(directoryUri, name, mimeType);
});

export const shareFile = guarded(async (uri, options) => {
  assertUri(uri);
  await expoAdapter.shareFile(uri, options);
});

export const saveImageToGallery = guarded(async (uri) => {
  assertUri(uri);
  await expoAdapter.saveImageToGallery(uri);
});

/** @returns {Promise<{uri: string, read: boolean, write: boolean, persistedTime: number}[]>} */
export const listPersistedDirectories = guarded(async () => nativeAdapter.listPersistedUris());

/** 저장해 둔 폴더 URI를 아직 쓸 수 있는지 확인한다. 권한이 회수되면 false. */
export const hasPersistedAccess = guarded(async (uri) => {
  assertUri(uri);
  const grants = await nativeAdapter.listPersistedUris();
  return grants.some((grant) => grant.uri === uri);
});

/** @returns {Promise<boolean>} 해제할 권한이 없었으면 false */
export const releaseDirectory = guarded(async (uri) => {
  assertUri(uri);
  return nativeAdapter.releasePersistedUri(uri);
});
