// 직접 저장한 작품 표지와 표지 라이브러리는 기존 백업 JSON에 경로가 없어 복원하면 연결이 끊긴다.
// 파일 백업 JSON에 선택 항목 CL로 담아 복원 뒤 다시 연결한다. 기존 복원 코드는 CL을 읽지 않는다.
import * as LegacyFS from "expo-file-system/legacy";

const SEPARATOR = "|||";

// 앱 설치 경로가 기기마다 다를 수 있어 앱 폴더 기준 경로로 저장한다.
function relativeCoverPath(uri) {
  const match = /\/(covers\/[^?#]+)$/.exec(String(uri || ""));
  return match ? match[1] : null;
}

/** @returns {{links: Record<string, string>, library: Array}} */
export function buildCoverLinks(novels, libraryRows) {
  const links = {};
  for (const novel of novels) {
    const rel = relativeCoverPath(novel.cover_image);
    if (rel) links[`${novel.title}${SEPARATOR}${(novel.author || "").trim()}`] = rel;
  }
  const library = [];
  for (const row of libraryRows) {
    const rel = relativeCoverPath(row.file_path);
    if (rel) library.push([rel, row.original_name ?? null, row.width ?? null, row.height ?? null, row.file_size ?? null, row.created_at ?? null]);
  }
  return { links, library };
}

async function fileExists(uri) {
  try {
    return (await LegacyFS.getInfoAsync(uri)).exists;
  } catch {
    return false;
  }
}

/**
 * 복원 직후 호출한다. 파일이 없는 항목은 건너뛰므로 사진을 나중에 복원해도 안전하지만 그 표지는 연결되지 않는다.
 * @param {string} backupText 복원한 백업 JSON
 * @param {{all: Function, execBatch: Function, newId: () => string}} db
 * @returns {Promise<{linked: number, missing: number, libraryAdded: number}>}
 */
export async function applyCoverLinks(backupText, { all, execBatch, newId }) {
  const empty = { linked: 0, missing: 0, libraryAdded: 0 };
  if (!backupText.includes('"CL":')) return empty; // 이전 백업 파일
  const cl = JSON.parse(backupText).CL;
  if (!cl || typeof cl !== "object") return empty;

  const root = LegacyFS.documentDirectory;
  const queries = [];
  const result = { ...empty };

  for (const [key, rel] of Object.entries(cl.links || {})) {
    const uri = root + rel;
    if (!(await fileExists(uri))) {
      result.missing += 1;
      continue;
    }
    const at = key.lastIndexOf(SEPARATOR);
    const title = key.slice(0, at);
    const author = key.slice(at + SEPARATOR.length);
    queries.push({
      sql: "UPDATE novels SET cover_image = ? WHERE title = ? AND TRIM(COALESCE(author, '')) = ? AND (cover_image IS NULL OR cover_image = '');",
      params: [uri, title, author],
    });
    result.linked += 1;
  }

  const known = new Set((await all("SELECT file_path FROM cover_library;")).map((row) => row.file_path));
  for (const [rel, name, width, height, size, createdAt] of cl.library || []) {
    const uri = root + rel;
    if (known.has(uri) || !(await fileExists(uri))) continue;
    queries.push({
      sql: "INSERT INTO cover_library (id, file_path, status, novel_id, original_name, width, height, file_size, created_at) VALUES (?, ?, 'unused', NULL, ?, ?, ?, ?, ?);",
      params: [newId(), uri, name, width, height, size, createdAt ?? Date.now()],
    });
    result.libraryAdded += 1;
  }

  // 복원 중 재조정은 표지 연결 전에 돌아 쓰는 표지까지 unused로 만든다. 연결 뒤 같은 기준으로 다시 맞춘다.
  const referenced = "(SELECT cover_image FROM novels WHERE cover_image IS NOT NULL UNION SELECT cover_image FROM planned_novels WHERE cover_image IS NOT NULL)";
  queries.push({ sql: `UPDATE cover_library SET status = 'used' WHERE file_path IN ${referenced};`, params: [] });
  queries.push({
    sql: "UPDATE cover_library SET novel_id = (SELECT id FROM novels WHERE novels.cover_image = cover_library.file_path LIMIT 1) WHERE status = 'used' AND novel_id IS NULL;",
    params: [],
  });

  await execBatch(queries);
  return result;
}
