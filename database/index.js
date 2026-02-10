/**
 * 데이터베이스 모듈 진입점 (통합 1파일)
 * @module database
 */
export {
  openDb, resetDbConnection, safeDbOperation, getDb,
  exec, all, first, execBatch,
  columnExists, ensureColumn,
  getAppMeta, setAppMeta, initDb,
  setMatchQueueCallback, matchPairKey, isMatchPending,
  enqueueMatchTask, getQueueStatus, clearMatchQueue,
  migrateTagSystem, syncNovelTags,
} from './connection';
