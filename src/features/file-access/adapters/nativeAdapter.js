import FileAccessNative from "../../../../modules/file-access-native";
import { FileAccessError, FileAccessErrorCode } from "../errors";

function requireNative(feature) {
  if (!FileAccessNative) {
    throw new FileAccessError(
      FileAccessErrorCode.NOT_SUPPORTED,
      `${feature}: 네이티브 모듈이 없습니다 (Android APK 재빌드 필요).`
    );
  }
  return FileAccessNative;
}

export const isNativeAvailable = () => FileAccessNative != null;

export const listPersistedUris = () => requireNative("listPersistedUris").listPersistedUris();

export const releasePersistedUri = (uri) => requireNative("releasePersistedUri").releasePersistedUri(uri);

export const renameDocument = (uri, displayName) => requireNative("renameDocument").renameDocument(uri, displayName);
