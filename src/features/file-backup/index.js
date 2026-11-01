// 백업 JSON을 파일로 저장·복원한다. 텍스트 공유와 달리 크기 제한(Binder)을 받지 않는다.
// 내용 생성(exportJSON)과 복원(importJSON)은 App.jsx의 기존 함수를 그대로 쓰므로 백업 형식은 같다.
import { Alert } from "react-native";
import * as fileAccess from "../file-access";

const { CANCELLED } = fileAccess.FileAccessErrorCode;

function backupFileName(label, date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  const safeLabel = String(label || "").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 30);
  return `novel-tier-backup${safeLabel ? `-${safeLabel}` : ""}-${stamp}.json`;
}

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

const releaseQuietly = (uri) => fileAccess.releaseDirectory(uri).catch(() => {});

/**
 * @param {object} options
 * @param {() => Promise<string>} options.createBackupJson 현재 슬롯의 백업 JSON을 만든다
 * @param {string} [options.label] 파일 이름에 넣을 슬롯 이름
 * @param {(busy: boolean) => void} [options.setBusy]
 * @param {() => boolean} [options.isBlocked] true면 아무것도 하지 않는다 (자동매칭 중 Alert 금지)
 */
export async function saveBackupToFile({ createBackupJson, label, setBusy, isBlocked }) {
  if (isBlocked?.()) return;

  let directoryUri;
  try {
    directoryUri = (await fileAccess.pickDirectory()).uri;
  } catch (error) {
    if (error.code !== CANCELLED) Alert.alert("백업 실패", `폴더를 열지 못했어요.\n${error.message}`);
    return;
  }

  let fileUri = null;
  let keepGrantForShare = false;
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
    keepGrantForShare = true;
    const savedUri = fileUri;
    Alert.alert(
      "백업 완료",
      `${name}\n크기: ${formatSize(written.bytes)}\n\n현재 슬롯만 담겼어요. 다른 슬롯은 전환한 뒤 각각 백업하세요.\n사진 파일(직접 저장한 표지·갤러리)은 포함되지 않아요.\n\n폰을 잃어버려도 괜찮도록 드라이브나 메일로도 보내 두세요.`,
      [
        { text: "닫기", style: "cancel", onPress: () => releaseQuietly(directoryUri) },
        {
          text: "다른 앱으로 보내기",
          onPress: () => {
            fileAccess
              .shareFile(savedUri, { mimeType: "application/json", dialogTitle: name })
              .catch((error) => Alert.alert("보내기 실패", `파일은 폴더에 저장되어 있어요.\n${error.message}`))
              .finally(() => releaseQuietly(directoryUri));
          },
        },
      ],
      { onDismiss: () => releaseQuietly(directoryUri) }
    );
  } catch (error) {
    setBusy?.(false);
    if (fileUri) await fileAccess.deleteFile(fileUri).catch(() => {});
    Alert.alert("백업 실패", `백업 파일을 만들지 못했어요. 데이터는 그대로예요.\n${error.message}`);
  } finally {
    if (!keepGrantForShare) releaseQuietly(directoryUri);
  }
}

/**
 * @param {object} options
 * @param {(text: string) => Promise<void>} options.restore 검증·최종 확인·복원을 맡는다 (기존 importJSON)
 * @param {() => boolean} [options.isBlocked]
 */
export async function restoreBackupFromFile({ restore, isBlocked }) {
  if (isBlocked?.()) return;

  let fileUri;
  try {
    fileUri = (await fileAccess.pickFile()).uri;
  } catch (error) {
    if (error.code !== CANCELLED) Alert.alert("복원 실패", `파일을 열지 못했어요.\n${error.message}`);
    return;
  }

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
