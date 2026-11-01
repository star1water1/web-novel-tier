import { Alert } from "react-native";
import * as fileAccess from "./fileAccessService";
import { FileAccessErrorCode } from "./errors";

const LOG_TAG = "[FileAccessDiag]";

async function runStep(results, label, fn) {
  try {
    const detail = await fn();
    results.push(`✅ ${label}${detail ? ` (${detail})` : ""}`);
    return true;
  } catch (error) {
    results.push(`❌ ${label}: [${error?.code ?? "?"}] ${error?.message ?? error}`);
    return false;
  }
}

function assertEqual(actual, expected, what) {
  if (actual !== expected) throw new Error(`${what}: ${actual} ≠ ${expected}`);
}

// 앱 캐시의 전용 폴더만 쓰고 지운다. DB·이미지 폴더는 건드리지 않는다.
async function runBasicChecks(results) {
  const text = `novel-tier-${Date.now()}`;
  const dir = `${fileAccess.getAppCacheDirectory()}file-access-diag-${Date.now()}/`;
  const a = `${dir}a.txt`;
  const b = `${dir}b.txt`;
  let renamed = null;

  await runStep(results, "네이티브 모듈 연결", async () => {
    if (!fileAccess.isNativeAvailable()) throw new Error("모듈 없음");
  });
  await runStep(results, "Kotlin 호출 (권한 조회)", async () => {
    const grants = await fileAccess.listPersistedDirectories();
    return `${grants.length}건`;
  });
  await runStep(results, "앱 저장공간 쓰기·읽기", async () => {
    await fileAccess.makeAppDirectory(dir);
    await fileAccess.writeText(a, text);
    assertEqual(await fileAccess.readText(a), text, "내용");
  });
  await runStep(results, "앱 저장공간 복사", async () => {
    await fileAccess.copyFile(a, b);
    assertEqual(await fileAccess.readText(b), text, "내용");
  });
  await runStep(results, "앱 저장공간 이름 변경", async () => {
    renamed = await fileAccess.renameFile(b, "c.txt");
    assertEqual(await fileAccess.readText(renamed), text, "내용");
  });
  await runStep(results, "앱 저장공간 목록", async () => {
    const names = (await fileAccess.listDirectory(dir)).map((entry) => entry.name).sort();
    assertEqual(names.join(","), "a.txt,c.txt", "목록");
  });
  await runStep(results, "오류 코드 변환", async () => {
    let code = null;
    try {
      await fileAccess.renameFile(a, "bad/name");
    } catch (error) {
      code = error.code;
    }
    assertEqual(code, FileAccessErrorCode.INVALID_ARGUMENT, "code");
  });
  await runStep(results, "앱 저장공간 삭제", async () => {
    await fileAccess.deleteFile(dir);
  });
}

// 사용자가 고른 폴더에 임시 파일 하나를 만들고 지운 뒤 폴더 권한을 해제한다.
async function runFolderChecks(results) {
  let directoryUri;
  try {
    directoryUri = (await fileAccess.pickDirectory()).uri;
  } catch (error) {
    results.push(error.code === FileAccessErrorCode.CANCELLED ? "➖ 폴더 선택 취소" : `❌ 폴더 선택: [${error.code}] ${error.message}`);
    return;
  }
  results.push("✅ 폴더 선택");

  const text = `novel-tier-${Date.now()}`;
  const baseName = `novel-tier-diag-${Date.now()}`;
  let fileUri = null;

  await runStep(results, "권한 유지 등록", async () => {
    if (!(await fileAccess.hasPersistedAccess(directoryUri))) throw new Error("권한 목록에 없음");
  });
  const created = await runStep(results, "폴더에 파일 생성·쓰기·읽기", async () => {
    fileUri = (await fileAccess.createFileInDirectory(directoryUri, `${baseName}.txt`)).uri;
    await fileAccess.writeText(fileUri, text);
    assertEqual(await fileAccess.readText(fileUri), text, "내용");
  });
  if (created) {
    await runStep(results, "SAF 이름 변경 (Kotlin)", async () => {
      fileUri = await fileAccess.renameFile(fileUri, `${baseName}-renamed.txt`);
      assertEqual(await fileAccess.readText(fileUri), text, "내용");
    });
    await runStep(results, "폴더 목록", async () => {
      const entries = await fileAccess.listDirectory(directoryUri);
      if (!entries.some((entry) => entry.name === `${baseName}-renamed.txt`)) throw new Error(`없음: ${entries.length}건 중`);
      return `${entries.length}건`;
    });
    await runStep(results, "SAF → 앱 저장공간 복사", async () => {
      const temp = `${fileAccess.getAppCacheDirectory()}${baseName}.txt`;
      await fileAccess.copyFile(fileUri, temp);
      assertEqual(await fileAccess.readText(temp), text, "내용");
      await fileAccess.deleteFile(temp);
    });
    await runStep(results, "폴더 임시 파일 삭제", async () => {
      await fileAccess.deleteFile(fileUri);
    });
  }
  await runStep(results, "폴더 권한 해제 (Kotlin)", async () => {
    assertEqual(await fileAccess.releaseDirectory(directoryUri), true, "해제");
    assertEqual(await fileAccess.hasPersistedAccess(directoryUri), false, "권한 잔존");
  });
}

async function run(withFolder) {
  const results = [];
  await runBasicChecks(results);
  if (withFolder) await runFolderChecks(results);
  results.forEach((line) => console.log(`${LOG_TAG} ${line}`));
  console.log(`${LOG_TAG} DONE`);
  Alert.alert("파일 접근 모듈 점검", results.join("\n"));
}

/** @param {{isBlocked?: () => boolean}} options isBlocked가 true면 아무것도 하지 않는다 (자동매칭 중 Alert 금지). */
export function showFileAccessDiagnostics({ isBlocked } = {}) {
  if (isBlocked?.()) return;
  Alert.alert("파일 접근 모듈 점검", "앱 데이터는 변경하지 않아요. 폴더 점검은 고른 폴더에 임시 파일을 만들었다가 지워요.", [
    { text: "닫기", style: "cancel" },
    { text: "기본 점검", onPress: () => run(false) },
    { text: "폴더 포함", onPress: () => run(true) },
  ]);
}
