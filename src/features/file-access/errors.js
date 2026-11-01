export const FileAccessErrorCode = Object.freeze({
  CANCELLED: "CANCELLED", // 사용자가 선택 화면을 닫음 (오류로 안내할 필요 없음)
  PERMISSION_LOST: "PERMISSION_LOST", // 권한 없음·회수됨 → 폴더를 다시 선택받아야 함
  NOT_FOUND: "NOT_FOUND",
  NOT_SUPPORTED: "NOT_SUPPORTED", // 이 플랫폼·빌드·경로 조합에서 제공하지 않음
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
  FAILED: "FAILED",
});

export class FileAccessError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "FileAccessError";
    this.code = code;
    this.cause = cause;
  }
}

// 네이티브 코드·문구별 분류. 순서대로 먼저 맞는 항목을 쓴다.
const NATIVE_ERROR_RULES = [
  [/ERR_FILE_ACCESS_PERMISSION_LOST|SecurityException|permission/i, FileAccessErrorCode.PERMISSION_LOST],
  [/ERR_FILE_ACCESS_NOT_FOUND|FileNotFound|does not exist|not found/i, FileAccessErrorCode.NOT_FOUND],
  [/ERR_FILE_ACCESS_INVALID_URI/i, FileAccessErrorCode.INVALID_ARGUMENT],
  [/cancel/i, FileAccessErrorCode.CANCELLED],
];

export function toFileAccessError(error) {
  if (error instanceof FileAccessError) return error;
  const text = `${error?.code ?? ""} ${error?.message ?? error}`;
  const rule = NATIVE_ERROR_RULES.find(([pattern]) => pattern.test(text));
  return new FileAccessError(rule ? rule[1] : FileAccessErrorCode.FAILED, error?.message ?? String(error), error);
}
