// 백업 JSON과 사진을 파일로 저장·복원한다. 텍스트 공유와 달리 크기 제한(Binder)을 받지 않는다.
// JSON 내용 생성(exportJSON)과 복원(importJSON)은 App.jsx의 기존 함수를 그대로 쓰므로 형식이 같다.
import { Alert } from "react-native";
import * as fileAccess from "../file-access";

const { CANCELLED, INVALID_ARGUMENT } = fileAccess.FileAccessErrorCode;

function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function backupFileName(label) {
  const safeLabel = String(label || "").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 30);
  return `novel-tier-backup${safeLabel ? `-${safeLabel}` : ""}-${timestamp()}.json`;
}

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

const releaseQuietly = (uri) => fileAccess.releaseDirectory(uri).catch(() => {});

async function pickBackupDirectory(failureTitle) {
  try {
    return (await fileAccess.pickDirectory()).uri;
  } catch (error) {
    if (error.code !== CANCELLED) Alert.alert(failureTitle, `폴더를 열지 못했어요.\n${error.message}`);
    return null;
  }
}

async function pickBackupFile(failureTitle) {
  try {
    return (await fileAccess.pickFile()).uri;
  } catch (error) {
    if (error.code !== CANCELLED) Alert.alert(failureTitle, `파일을 열지 못했어요.\n${error.message}`);
    return null;
  }
}

// 받는 앱이 파일을 읽는 동안 필요하므로, 보내기를 고르면 폴더 권한을 해제하지 않는다.
function showSavedAlert({ title, message, name, fileUri, directoryUri, mimeType }) {
  Alert.alert(
    title,
    message,
    [
      { text: "닫기", style: "cancel", onPress: () => releaseQuietly(directoryUri) },
      {
        text: "다른 앱으로 보내기",
        onPress: () => {
          fileAccess.shareDocument(fileUri, mimeType, name).catch((error) => {
            Alert.alert("보내기 실패", `파일은 폴더에 저장되어 있어요.\n${error.message}`);
          });
        },
      },
    ],
    { onDismiss: () => releaseQuietly(directoryUri) }
  );
}

/**
 * @param {object} options
 * @param {() => Promise<string>} options.createBackupJson 현재 슬롯의 백업 JSON을 만든다
 * @param {string} [options.label] 파일 이름에 넣을 슬롯 이름
 * @param {(busy: boolean) => void} [options.setBusy]
 * @param {() => boolean} [options.isBlocked] true면 아무것도 하지 않는다 (자동매칭 중 Alert 금지)
 */
export async function saveBackupToFile({ createBackupJson, label, setBusy, isBlocked }) {
  if (isBlocked?.()) return;

  const directoryUri = await pickBackupDirectory("백업 실패");
  if (!directoryUri) return;

  let fileUri = null;
  let saved = false;
  try {
    setBusy?.(true);
    const json = await createBackupJson();
    if (typeof json !== "string" || !json) throw new Error("백업 데이터를 만들지 못했어요.");

    const name = backupFileName(label);
    fileUri = (await fileAccess.createFileInDirectory(directoryUri, name, "application/json")).uri;
    const written = await fileAccess.writeLargeText(fileUri, json);

    // 저장소 오류로 파일이 잘리는 경우를 잡기 위해 저장된 파일을 다시 읽어 해시를 비교한다.
    const stored = await fileAccess.hashFile(fileUri);
    if (stored.sha256 !== written.sha256) throw new Error("저장한 파일을 다시 읽어 보니 내용이 달라요.");

    setBusy?.(false);
    saved = true;
    showSavedAlert({
      title: "백업 완료",
      message: `${name}\n크기: ${formatSize(written.bytes)}\n\n현재 슬롯만 담겼어요. 다른 슬롯은 전환한 뒤 각각 백업하세요.\n직접 저장한 표지·갤러리와 일부 인용구 사진은 '사진 백업'으로 따로 받으세요.\n\n폰을 잃어버려도 괜찮도록 드라이브나 메일로도 보내 두세요.`,
      name,
      fileUri,
      directoryUri,
      mimeType: "application/json",
    });
  } catch (error) {
    setBusy?.(false);
    if (fileUri) await fileAccess.deleteFile(fileUri).catch(() => {});
    Alert.alert("백업 실패", `백업 파일을 만들지 못했어요. 데이터는 그대로예요.\n${error.message}`);
  } finally {
    if (!saved) releaseQuietly(directoryUri);
  }
}

/**
 * @param {object} options
 * @param {(text: string) => Promise<void>} options.restore 검증·최종 확인·복원을 맡는다 (기존 importJSON)
 * @param {() => boolean} [options.isBlocked]
 */
export async function restoreBackupFromFile({ restore, isBlocked }) {
  if (isBlocked?.()) return;

  const fileUri = await pickBackupFile("복원 실패");
  if (!fileUri) return;

  let text;
  try {
    text = await fileAccess.readLargeText(fileUri);
  } catch (error) {
    Alert.alert("복원 실패", `파일을 읽지 못했어요. 데이터는 그대로예요.\n${error.message}`);
    return;
  } finally {
    releaseQuietly(fileUri);
  }

  try {
    await restore(text);
  } catch (error) {
    Alert.alert("복원 실패", `복원하지 못했어요.\n${error.message}`);
  }
}

/**
 * 표지·갤러리·인용구 사진 파일을 ZIP 하나로 저장한다. 모든 슬롯의 사진이 함께 담긴다.
 * @param {{setBusy?: (busy: boolean) => void, isBlocked?: () => boolean}} options
 */
export async function saveMediaToFile({ setBusy, isBlocked }) {
  if (isBlocked?.()) return;

  const directoryUri = await pickBackupDirectory("사진 백업 실패");
  if (!directoryUri) return;

  let fileUri = null;
  let saved = false;
  try {
    setBusy?.(true);
    const name = `novel-tier-photos-${timestamp()}.zip`;
    fileUri = (await fileAccess.createFileInDirectory(directoryUri, name, "application/zip")).uri;
    const written = await fileAccess.exportMediaZip(fileUri);

    const stored = await fileAccess.hashFile(fileUri);
    if (stored.sha256 !== written.sha256) throw new Error("저장한 파일을 다시 읽어 보니 내용이 달라요.");
    const inspected = await fileAccess.inspectMediaZip(fileUri);
    if (inspected.files !== written.files) throw new Error("저장한 파일의 사진 수가 맞지 않아요.");

    setBusy?.(false);
    saved = true;
    showSavedAlert({
      title: "사진 백업 완료",
      message: `${name}\n사진 ${written.files}장 · ${formatSize(written.bytes)}\n\n모든 슬롯의 사진이 담겼어요. 작품 데이터는 '파일로 백업'으로 따로 받으세요.\n\n폰을 잃어버려도 괜찮도록 드라이브에도 보내 두세요.`,
      name,
      fileUri,
      directoryUri,
      mimeType: "application/zip",
    });
  } catch (error) {
    setBusy?.(false);
    if (fileUri) await fileAccess.deleteFile(fileUri).catch(() => {});
    Alert.alert("사진 백업 실패", `사진 백업을 만들지 못했어요. 사진과 데이터는 그대로예요.\n${error.message}`);
  } finally {
    if (!saved) releaseQuietly(directoryUri);
  }
}

/**
 * 사진 ZIP을 앱 폴더로 푼다. 이미 있는 사진은 덮어쓰지 않으므로 작품 데이터와 기존 사진은 그대로다.
 * @param {{setBusy?: (busy: boolean) => void, isBlocked?: () => boolean, onRestored?: () => void}} options
 */
export async function restoreMediaFromFile({ setBusy, isBlocked, onRestored }) {
  if (isBlocked?.()) return;

  const fileUri = await pickBackupFile("사진 복원 실패");
  if (!fileUri) return;

  try {
    setBusy?.(true);
    const result = await fileAccess.importMediaZip(fileUri);
    setBusy?.(false);
    onRestored?.();
    Alert.alert(
      "사진 복원 완료",
      `새로 복원: ${result.restored}장\n이미 있어서 건너뜀: ${result.skipped}장\n\n새 기기라면 이어서 '파일에서 복원'으로 작품 데이터를 복원하세요. 복원 순서는 사진 먼저, 작품 데이터 나중이에요.`
    );
  } catch (error) {
    setBusy?.(false);
    const message = error.code === INVALID_ARGUMENT ? "사진 백업 파일이 아니거나 파일이 손상됐어요." : error.message;
    Alert.alert("사진 복원 실패", `${message}\n기존 사진과 데이터는 그대로예요.`);
  } finally {
    releaseQuietly(fileUri);
  }
}
