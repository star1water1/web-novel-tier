// file:// 은 앱 전체와 같은 legacy API로, content:// 는 신규 API로 처리한다.
// legacy는 content:// 중 com.android.externalstorage 만 지원해 다운로드·드라이브 등이 준 URI를 읽지 못한다.
import { Directory, File } from "expo-file-system";
import * as LegacyFS from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { FileAccessError, FileAccessErrorCode } from "../errors";

// 공유 시트가 파일을 읽어 갈 시간을 준 뒤 임시 복사본을 지운다.
const SHARE_TEMP_CLEANUP_MS = 8000;

export const isContentUri = (uri) => typeof uri === "string" && uri.startsWith("content:");

// SAF URI에는 표시 이름 필드가 없어 문서 ID의 마지막 경로로 추정한다.
export function displayNameFromUri(uri) {
  const decoded = decodeURIComponent(uri.replace(/\/+$/, ""));
  return decoded.split("/").pop().split(":").pop();
}

export const appCacheDirectory = () => LegacyFS.cacheDirectory;

export async function readText(uri) {
  return isContentUri(uri) ? new File(uri).text() : LegacyFS.readAsStringAsync(uri);
}

export async function writeText(uri, text) {
  if (isContentUri(uri)) new File(uri).write(text);
  else await LegacyFS.writeAsStringAsync(uri, text);
}

export async function makeAppDirectory(uri) {
  await LegacyFS.makeDirectoryAsync(uri, { intermediates: true });
}

export async function copy(from, to) {
  if (isContentUri(from) && isContentUri(to)) {
    throw new FileAccessError(FileAccessErrorCode.NOT_SUPPORTED, "SAF 문서 간 복사는 아직 지원하지 않습니다.");
  }
  if (!isContentUri(from) && !isContentUri(to)) {
    await LegacyFS.copyAsync({ from, to });
    return;
  }
  // SAF가 낀 복사는 파일 전체를 메모리에 올린다. to가 content://면 대상 문서가 먼저 만들어져 있어야 한다.
  new File(to).write(await new File(from).bytes());
}

export async function move(from, to) {
  if (!isContentUri(from) && !isContentUri(to)) {
    await LegacyFS.moveAsync({ from, to });
    return;
  }
  await copy(from, to);
  await remove(from);
}

export async function remove(uri) {
  if (isContentUri(uri)) new File(uri).delete();
  else await LegacyFS.deleteAsync(uri, { idempotent: true });
}

export async function renameAppFile(uri, newName) {
  const parent = uri.slice(0, uri.replace(/\/+$/, "").lastIndexOf("/") + 1);
  const to = parent + newName;
  await LegacyFS.moveAsync({ from: uri, to });
  return to;
}

export async function listDirectory(uri) {
  if (isContentUri(uri)) {
    return new Directory(uri).list().map((entry) => {
      // 네이티브 목록은 파일 URI에도 끝에 "/"를 붙여 돌려준다.
      const entryUri = entry.uri.replace(/\/+$/, "");
      return { uri: entryUri, name: displayNameFromUri(entryUri), isDirectory: entry instanceof Directory };
    });
  }
  const base = uri.endsWith("/") ? uri : `${uri}/`;
  const names = await LegacyFS.readDirectoryAsync(base);
  return Promise.all(
    names.map(async (name) => {
      const info = await LegacyFS.getInfoAsync(base + name);
      return { uri: base + name, name, isDirectory: !!info.isDirectory };
    })
  );
}

export async function pickFile(mimeType) {
  const file = await File.pickFileAsync(undefined, mimeType);
  return { uri: file.uri, name: displayNameFromUri(file.uri), size: file.size ?? null, mimeType: file.type ?? null };
}

export async function pickDirectory(initialUri) {
  const directory = await Directory.pickDirectoryAsync(initialUri);
  return { uri: directory.uri.replace(/\/+$/, "") };
}

export function createFileInDirectory(directoryUri, name, mimeType) {
  return { uri: new Directory(directoryUri).createFile(name, mimeType).uri };
}

export async function shareFile(uri, options) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new FileAccessError(FileAccessErrorCode.NOT_SUPPORTED, "이 기기에서는 공유를 사용할 수 없습니다.");
  }
  if (!isContentUri(uri)) {
    await Sharing.shareAsync(uri, options);
    return;
  }
  // expo-sharing은 file:// 만 받는다.
  const temp = `${LegacyFS.cacheDirectory}share-${Date.now()}-${displayNameFromUri(uri)}`;
  await copy(uri, temp);
  try {
    await Sharing.shareAsync(temp, options);
  } finally {
    setTimeout(() => {
      LegacyFS.deleteAsync(temp, { idempotent: true }).catch(() => {});
    }, SHARE_TEMP_CLEANUP_MS);
  }
}

export async function saveImageToGallery(uri) {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new FileAccessError(FileAccessErrorCode.PERMISSION_LOST, "갤러리 저장 권한이 없습니다.");
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}
