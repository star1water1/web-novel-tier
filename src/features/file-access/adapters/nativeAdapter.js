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

export const hashFile = (uri) => requireNative("hashFile").hashFile(uri);

export const exportMediaZip = (uri) => requireNative("exportMediaZip").exportMediaZip(uri);

export const inspectMediaZip = (uri) => requireNative("inspectMediaZip").inspectMediaZip(uri);

export const importMediaZip = (uri) => requireNative("importMediaZip").importMediaZip(uri);

export const shareDocument = (uri, mimeType, title) => requireNative("shareDocument").shareDocument(uri, mimeType, title);

// 조각 크기(문자 수). Java 힙에 한 번에 올라가는 양을 이 크기로 제한한다.
const CHUNK_CHARS = 1024 * 1024;

const isHighSurrogate = (code) => code >= 0xd800 && code <= 0xdbff;

export async function writeLargeText(uri, text) {
  const native = requireNative("writeLargeText");
  const id = await native.openTextWriter(uri);
  try {
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + CHUNK_CHARS, text.length);
      // 이모지(서로게이트 쌍)를 가르면 UTF-8 인코딩에서 깨진다.
      if (end < text.length && isHighSurrogate(text.charCodeAt(end - 1))) end += 1;
      await native.writeTextChunk(id, text.slice(start, end));
      start = end;
    }
    return await native.closeTextWriter(id);
  } catch (error) {
    await native.abortTextWriter(id).catch(() => {});
    throw error;
  }
}

export async function readLargeText(uri) {
  const native = requireNative("readLargeText");
  const id = await native.openTextReader(uri);
  try {
    const chunks = [];
    for (;;) {
      const chunk = await native.readTextChunk(id, CHUNK_CHARS);
      if (chunk == null) return chunks.join("");
      chunks.push(chunk);
    }
  } finally {
    await native.closeTextReader(id).catch(() => {});
  }
}
