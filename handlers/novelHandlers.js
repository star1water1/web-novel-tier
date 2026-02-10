/**
 * 작품/표지/예정/유틸 핸들러 통합
 * @module handlers/novelHandlers
 * @merged novelHandlers + coverHandlers + plannedHandlers + utilHandlers
 * 
 * @bugfix v6.1.1
 * - [FIX] batchAddTag/batchRemoveTag/batchSetPlatforms/batchIncReadCount 매개변수 순서 수정
 *   → DataContext 호출 규약(novelIds, value)과 일치하도록 변경
 * - [FIX] addNovel, addPlannedNovel, convertPlannedToNovel 반환값을 { success, id } 형태로 통일
 *   → DataContext의 result.success 체크 패턴과 일치
 * - [FIX] loadCoverLibrary 반환 키 library → covers 로 변경
 *   → DataContext의 { covers, totalSize } 디스트럭처링과 일치
 *
 * @bugfix v6.1.5
 * - [FIX] updateNovel SQL에 rating, awards 필드 누락
 *   → EditNovelModal에서 수상/레이팅 변경 후 저장해도 DB에 반영 안 됨. SQL에 두 필드 추가
 * - [FIX] updateNovel SQL에 major_genre, sub_genre 필드 누락
 *   → 태그 변경 시 자동 감지된 장르가 DB에 저장 안 됨. SQL에 두 필드 추가
 * - [FIX] convertPlannedToNovel INSERT에 link, major_genre, sub_genre 필드 누락
 *   → 예정작 전환 시 해당 필드 소실. INSERT에 3필드 추가
 * - [FIX] updatePlannedNovel SQL에 link, major_genre, sub_genre 필드 누락
 *   → 예정작 편집 시 해당 필드가 기본값으로 초기화. UPDATE에 3필드 추가
 * - [FIX] addPlannedNovel INSERT에 link, major_genre, sub_genre 미포함
 *   → 예정작 추가 시 해당 필드 저장 안 됨. INSERT에 3필드 추가
 */
import { Share, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { exec, all, first, execBatch } from '../database';
import { rebuildAllFromMatches } from '../services/eloService';
import { tierBadge } from '../constants';


// ═══════════════════════════════════════════════════════════════
// 📌 novelHandlers
// ═══════════════════════════════════════════════════════════════



export async function loadNovelList(sortKey = "rating", sortDir = "DESC") {
  let orderBy = `rating ${sortDir}, created_at ASC`;
  if (sortKey === "title") {
    orderBy = `title COLLATE NOCASE ${sortDir}`;
  } else if (sortKey === "created") {
    orderBy = `created_at ${sortDir}`;
  } else if (sortKey === "read") {
    orderBy = `read_count ${sortDir}, rating DESC`;
  } else if (sortKey === "updated") {
    orderBy = `read_count_updated_at ${sortDir} NULLS LAST, rating DESC`;
  }
  
  const rows = await all(`SELECT * FROM novels ORDER BY ${orderBy};`);
  return rows || [];
}

export async function addNovel(data) {
  const {
    title,
    author = "",
    tags = "",
    platforms = [],
    note = "",
    memorableQuote = "",
    readCount = 0,
    totalEpisodes = 0,
    rereadCount = 1,
    status = "reading",
    workStatus = "ongoing",
    coverImage = "",
    link = "",
    gaidenStatus = "none",
    gaidenReadCount = 0,
    gaidenTotalEpisodes = 0,
  } = data;

  const t = (title || "").trim();
  if (!t) {
    throw new Error("제목은 필수입니다.");
  }

  // 중복 체크
  const dup = await first("SELECT id FROM novels WHERE title=?", [t]);
  if (dup) {
    throw new Error("같은 제목이 이미 있습니다.");
  }

  const id = uuid();
  const now = Date.now();
  
  await exec(
    `INSERT INTO novels (
      id, title, author, tags, platforms, note, memorable_quote,
      read_count, total_episodes, reread_count,
      rating, rd, wins, losses, match_count, tier,
      status, work_status, cover_image, link,
      gaiden_status, gaiden_read_count, gaiden_total_episodes,
      created_at, read_count_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      t,
      (author || "").trim(),
      (tags || "").trim(),
      JSON.stringify(platforms || []),
      (note || "").trim(),
      (memorableQuote || "").trim(),
      Number(readCount) || 0,
      Number(totalEpisodes) || 0,
      Number(rereadCount) || 1,
      1500,
      350,
      0,
      0,
      0,
      "C",
      status || "reading",
      workStatus || "ongoing",
      coverImage || "",
      link || "",
      gaidenStatus || "none",
      Number(gaidenReadCount) || 0,
      Number(gaidenTotalEpisodes) || 0,
      now,
      Number(readCount) > 0 ? now : null,
    ]
  );

  return { success: true, id };
}

export async function removeNovel(id) {
  await execBatch([
    { sql: "DELETE FROM matches WHERE a_id=? OR b_id=?", params: [id, id] },
    { sql: "DELETE FROM novels WHERE id=?", params: [id] },
  ]);
  await rebuildAllFromMatches();
}

export async function updateNovel(item, options = {}) {
  if (!item || !item.id) return;

  const {
    updateReadCountTimestamp = false,
    originalReadCount = 0,
  } = options;

  const title = (item.title || "").trim();
  if (!title) {
    throw new Error("제목은 비울 수 없습니다.");
  }

  // 중복 체크
  const dup = await first(
    "SELECT id FROM novels WHERE title=? AND id<>?",
    [title, item.id]
  );
  if (dup) {
    throw new Error("이미 존재하는 제목입니다.");
  }

  let platforms = [];
  try {
    platforms = JSON.parse(item.platforms || "[]");
  } catch {
    platforms = [];
  }

  // 읽은 회차가 변경되었으면 타임스탬프 업데이트
  const readCount = Number(item.read_count) || 0;
  const shouldUpdateTimestamp = updateReadCountTimestamp && readCount !== originalReadCount;
  const timestampValue = shouldUpdateTimestamp ? Date.now() : item.read_count_updated_at;

  await exec(
    `UPDATE novels SET
      title=?, author=?, tags=?, platforms=?, note=?, memorable_quote=?,
      read_count=?, total_episodes=?, reread_count=?,
      status=?, work_status=?, cover_image=?, link=?,
      gaiden_status=?, gaiden_read_count=?, gaiden_total_episodes=?,
      read_count_updated_at=?, rating=?, awards=?,
      major_genre=?, sub_genre=?
    WHERE id=?;`,
    [
      title,
      (item.author || "").trim(),
      (item.tags || "").trim(),
      JSON.stringify(platforms),
      (item.note || "").trim(),
      (item.memorable_quote || "").trim(),
      readCount,
      Number(item.total_episodes) || 0,
      Number(item.reread_count) || 1,
      item.status || "reading",
      item.work_status || "ongoing",
      item.cover_image || "",
      item.link || "",
      item.gaiden_status || "none",
      Number(item.gaiden_read_count) || 0,
      Number(item.gaiden_total_episodes) || 0,
      timestampValue,
      Number(item.rating) || 1500,
      item.awards || "",
      item.major_genre || "",                  // [FIX v6.1.5] 누락된 major_genre 추가
      item.sub_genre || "",                    // [FIX v6.1.5] 누락된 sub_genre 추가
      item.id,
    ]
  );
}

export async function updateNovelRating(id, rating) {
  await exec("UPDATE novels SET rating=? WHERE id=?", [rating, id]);
}

export async function updateNovelAwards(id, awards) {
  const awardsJson = awards && awards.length
    ? JSON.stringify(awards)
    : "";
  await exec("UPDATE novels SET awards=? WHERE id=?", [awardsJson, id]);
}

export async function batchAddTag(novelIds, tag) {
  const t = (tag || "").trim();
  if (!t || !novelIds || novelIds.length === 0) return;

  const placeholders = novelIds.map(() => "?").join(",");
  const rows = await all(
    `SELECT id, tags FROM novels WHERE id IN (${placeholders})`,
    novelIds
  );

  const queries = rows.map((row) => {
    const existing = new Set(
      (row.tags || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    );
    existing.add(t);
    return {
      sql: "UPDATE novels SET tags=? WHERE id=?",
      params: [Array.from(existing).join(", "), row.id],
    };
  });

  await execBatch(queries);
}

export async function batchRemoveTag(novelIds, tag) {
  const t = (tag || "").trim();
  if (!t || !novelIds || novelIds.length === 0) return;

  const placeholders = novelIds.map(() => "?").join(",");
  const rows = await all(
    `SELECT id, tags FROM novels WHERE id IN (${placeholders})`,
    novelIds
  );

  const queries = rows.map((row) => {
    const existing = new Set(
      (row.tags || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    );
    existing.delete(t);
    return {
      sql: "UPDATE novels SET tags=? WHERE id=?",
      params: [Array.from(existing).join(", "), row.id],
    };
  });

  await execBatch(queries);
}

export async function batchSetPlatforms(novelIds, platforms) {
  if (!novelIds || novelIds.length === 0) return;

  const queries = novelIds.map((id) => ({
    sql: "UPDATE novels SET platforms=? WHERE id=?",
    params: [JSON.stringify(platforms || []), id],
  }));

  await execBatch(queries);
}

export async function batchIncReadCount(novelIds, delta) {
  const d = Number(delta) || 0;
  if (!d || !novelIds || novelIds.length === 0) return;

  const queries = novelIds.map((id) => ({
    sql: "UPDATE novels SET read_count = MAX(0, read_count + ?) WHERE id=?",
    params: [d, id],
  }));

  await execBatch(queries);
}

export async function batchDeleteNovels(novelIds) {
  if (!novelIds || novelIds.length === 0) return;

  const queries = [];
  for (const id of novelIds) {
    queries.push({
      sql: "DELETE FROM matches WHERE a_id=? OR b_id=?",
      params: [id, id],
    });
    queries.push({
      sql: "DELETE FROM novels WHERE id=?",
      params: [id],
    });
  }

  await execBatch(queries);
  await rebuildAllFromMatches();
}

// UUID 생성
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ═══════════════════════════════════════════════════════════════
// 📌 coverHandlers
// ═══════════════════════════════════════════════════════════════



// 표지 저장 디렉토리
const COVER_DIR = FileSystem.documentDirectory + 'covers/';

async function ensureCoverDir() {
  const dirInfo = await FileSystem.getInfoAsync(COVER_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(COVER_DIR, { intermediates: true });
  }
}

export async function loadCoverLibrary() {
  await ensureCoverDir();
  
  const rows = await all("SELECT * FROM cover_library ORDER BY created_at DESC;");
  const library = [];
  let totalSize = 0;
  
  for (const row of rows || []) {
    const fileInfo = await FileSystem.getInfoAsync(row.file_path);
    if (fileInfo.exists) {
      library.push({
        ...row,
        size: fileInfo.size || 0,
      });
      totalSize += fileInfo.size || 0;
    }
  }
  
  return { covers: library, totalSize };
}

export async function importCoversFromGallery(onProgress) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("갤러리 접근 권한이 필요합니다.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { imported: 0 };
  }

  await ensureCoverDir();
  
  const total = result.assets.length;
  let imported = 0;
  
  for (let i = 0; i < result.assets.length; i++) {
    const asset = result.assets[i];
    
    try {
      const id = uuid();
      const ext = asset.uri.split('.').pop() || 'jpg';
      const fileName = `${id}.${ext}`;
      const destPath = COVER_DIR + fileName;
      
      await FileSystem.copyAsync({
        from: asset.uri,
        to: destPath,
      });
      
      await exec(
        `INSERT INTO cover_library (id, file_path, status, created_at) VALUES (?, ?, ?, ?);`,
        [id, destPath, 'unused', Date.now()]
      );
      
      imported++;
      
      if (onProgress) {
        onProgress({ current: i + 1, total });
      }
    } catch (e) {
      console.warn("표지 가져오기 실패:", e);
    }
  }
  
  return { imported };
}

export async function removeCoverFromLibrary(coverId) {
  const cover = await first("SELECT * FROM cover_library WHERE id=?", [coverId]);
  if (!cover) return;
  
  // 파일 삭제
  try {
    const fileInfo = await FileSystem.getInfoAsync(cover.file_path);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(cover.file_path);
    }
  } catch (e) {
    console.warn("파일 삭제 실패:", e);
  }
  
  // DB에서 삭제
  await exec("DELETE FROM cover_library WHERE id=?", [coverId]);
}

export async function removeAllUnusedCovers() {
  const unused = await all("SELECT * FROM cover_library WHERE status='unused';");
  
  for (const cover of unused || []) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(cover.file_path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cover.file_path);
      }
    } catch (e) {
      console.warn("파일 삭제 실패:", e);
    }
  }
  
  await exec("DELETE FROM cover_library WHERE status='unused';");
  
  return { removed: unused?.length || 0 };
}

export async function updateCoverStatus(filePath, novelId, status) {
  await exec(
    "UPDATE cover_library SET status=?, novel_id=? WHERE file_path=?",
    [status, novelId, filePath]
  );
}

export async function applyNovelCover(novelId, newCoverPath, oldCoverPath) {
  // 이전 표지가 있으면 unused로 변경
  if (oldCoverPath) {
    await updateCoverStatus(oldCoverPath, null, 'unused');
  }
  
  // 새 표지 적용
  if (newCoverPath) {
    await updateCoverStatus(newCoverPath, novelId, 'used');
  }
  
  // 작품 업데이트
  await exec("UPDATE novels SET cover_image=? WHERE id=?", [newCoverPath || '', novelId]);
}

export async function selectCoverFromLibrary(cover, targetNovelId, currentCoverPath) {
  if (!cover || !targetNovelId) return;
  
  // 현재 표지가 있으면 unused로 변경
  if (currentCoverPath) {
    await updateCoverStatus(currentCoverPath, null, 'unused');
  }
  
  // 새 표지 적용
  await updateCoverStatus(cover.file_path, targetNovelId, 'used');
  await exec("UPDATE novels SET cover_image=? WHERE id=?", [cover.file_path, targetNovelId]);
  
  return cover.file_path;
}

// ═══════════════════════════════════════════════════════════════
// 📌 plannedHandlers
// ═══════════════════════════════════════════════════════════════



export async function loadPlannedList(sortKey = "priority", sortDir = "DESC") {
  let orderBy = `priority ${sortDir}, created_at DESC`;
  if (sortKey === "title") {
    orderBy = `title COLLATE NOCASE ${sortDir}`;
  } else if (sortKey === "created") {
    orderBy = `created_at ${sortDir}`;
  } else if (sortKey === "expected_tier") {
    orderBy = `expected_tier ${sortDir}, priority DESC`;
  }
  
  const rows = await all(`SELECT * FROM planned_novels ORDER BY ${orderBy};`);
  return rows || [];
}

export async function addPlannedNovel(data) {
  const {
    title,
    author = "",
    tags = "",
    platforms = [],
    note = "",
    totalEpisodes = 0,
    priority = 2,
    coverImage = "",
    workStatus = "ongoing",
    expectedTier = "모름",
    link = "",           // [FIX v6.1.7] 누락 필드 추가
    majorGenre = "",     // [FIX v6.1.7]
    subGenre = "",       // [FIX v6.1.7]
  } = data;

  const t = (title || "").trim();
  if (!t) {
    throw new Error("제목은 필수입니다.");
  }

  // 중복 체크
  const dup = await first("SELECT id FROM planned_novels WHERE title=?", [t]);
  if (dup) {
    throw new Error("같은 제목의 예정 작품이 이미 있습니다.");
  }

  const id = uuid();
  await exec(
    `INSERT INTO planned_novels (id, title, author, tags, platforms, note, total_episodes, priority, cover_image, work_status, expected_tier, created_at, link, major_genre, sub_genre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      t,
      (author || "").trim(),
      (tags || "").trim(),
      JSON.stringify(platforms || []),
      (note || "").trim(),
      Number(totalEpisodes) || 0,
      Number(priority) || 2,
      coverImage || "",
      workStatus || "ongoing",
      expectedTier || "모름",
      Date.now(),
      link || "",           // [FIX v6.1.7]
      majorGenre || "",     // [FIX v6.1.7]
      subGenre || "",       // [FIX v6.1.7]
    ]
  );

  return { success: true, id };
}

export async function removePlannedNovel(id) {
  await exec("DELETE FROM planned_novels WHERE id=?", [id]);
}

export async function updatePlannedNovel(item) {
  if (!item || !item.id) return;

  const title = (item.title || "").trim();
  if (!title) {
    throw new Error("제목은 비울 수 없습니다.");
  }

  // 중복 체크
  const dup = await first(
    "SELECT id FROM planned_novels WHERE title=? AND id<>?",
    [title, item.id]
  );
  if (dup) {
    throw new Error("같은 제목의 예정 작품이 이미 있습니다.");
  }

  let platforms = [];
  try {
    platforms = JSON.parse(item.platforms || "[]");
  } catch {
    platforms = [];
  }

  await exec(
    `UPDATE planned_novels 
     SET title=?, author=?, tags=?, platforms=?, note=?, total_episodes=?, priority=?, cover_image=?, work_status=?, expected_tier=?, link=?, major_genre=?, sub_genre=?
     WHERE id=?;`,
    [
      title,
      (item.author || "").trim(),
      (item.tags || "").trim(),
      JSON.stringify(platforms),
      (item.note || "").trim(),
      Number(item.total_episodes) || 0,
      Number(item.priority) || 2,
      item.cover_image || "",
      item.work_status || "ongoing",
      item.expected_tier || "모름",
      item.link || "",                // [FIX v6.1.7] 누락된 link 추가
      item.major_genre || "",         // [FIX v6.1.7] 누락된 major_genre 추가
      item.sub_genre || "",           // [FIX v6.1.7] 누락된 sub_genre 추가
      item.id,
    ]
  );
}

export async function convertPlannedToNovel(planned) {
  if (!planned) return null;

  // 이미 같은 제목이 novels에 있는지 체크
  const existing = await first("SELECT id FROM novels WHERE title=?", [planned.title]);
  if (existing) {
    throw new Error("같은 제목의 작품이 이미 등록되어 있습니다.");
  }

  const id = uuid();
  await exec(
    `INSERT INTO novels (id, title, author, tags, platforms, note, read_count, rating, rd, wins, losses, match_count, tier, created_at, cover_image, work_status, total_episodes, status, link, major_genre, sub_genre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      planned.title,
      planned.author || "",
      planned.tags || "",
      planned.platforms || "[]",
      planned.note || "",
      0,
      1500,
      350,
      0,
      0,
      0,
      "C",
      Date.now(),
      planned.cover_image || "",
      planned.work_status || "ongoing",
      planned.total_episodes || 0,
      "reading",
      planned.link || "",              // [FIX v6.1.5] 누락된 link 추가
      planned.major_genre || "",       // [FIX v6.1.5] 누락된 major_genre 추가
      planned.sub_genre || "",         // [FIX v6.1.5] 누락된 sub_genre 추가
    ]
  );

  // 예정 목록에서 삭제
  await exec("DELETE FROM planned_novels WHERE id=?", [planned.id]);

  return { success: true, id };
}

// ═══════════════════════════════════════════════════════════════
// 📌 utilHandlers
// ═══════════════════════════════════════════════════════════════



export async function pickImageFromGallery() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

export async function shareTierText() {
  try {
    const novels = await all("SELECT * FROM novels ORDER BY rating DESC;");
    if (!novels || novels.length === 0) {
      Alert.alert("알림", "공유할 작품이 없습니다.");
      return;
    }

    const tiers = { S: [], A: [], "B+": [], B: [], "B-": [], C: [] };
    
    for (const n of novels) {
      const { t } = tierBadge(n.rating);
      tiers[t].push(n.title);
    }

    let text = "📚 내 웹소설 티어표\n\n";
    
    for (const [tier, titles] of Object.entries(tiers)) {
      if (titles.length > 0) {
        text += `【${tier}티어】\n`;
        titles.forEach((title, i) => {
          text += `${i + 1}. ${title}\n`;
        });
        text += "\n";
      }
    }

    await Share.share({
      title: "웹소설 티어표",
      message: text,
    });
  } catch (e) {
    console.warn("공유 실패:", e);
    Alert.alert("오류", "공유 중 오류가 발생했습니다.");
  }
}

export function advancedFilter(novels, options = {}) {
  const {
    includeTags = [],
    excludeTags = [],
    tierFilter = "ALL",
    platformFilter = "ALL",
    statusFilter = "ALL",
    workStatusFilter = "ALL",
    minRating,
    maxRating,
    minReadCount,
    maxReadCount,
  } = options;

  let result = [...novels];

  // 포함 태그 필터 (AND 조건)
  if (includeTags.length > 0) {
    result = result.filter((n) => {
      const novelTags = (n.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      return includeTags.every((tag) =>
        novelTags.includes(tag.toLowerCase())
      );
    });
  }

  // 제외 태그 필터
  if (excludeTags.length > 0) {
    result = result.filter((n) => {
      const novelTags = (n.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      return !excludeTags.some((tag) =>
        novelTags.includes(tag.toLowerCase())
      );
    });
  }

  // 티어 필터
  if (tierFilter && tierFilter !== "ALL") {
    result = result.filter((n) => {
      const { t } = tierBadge(n.rating);
      return t === tierFilter;
    });
  }

  // 플랫폼 필터
  if (platformFilter && platformFilter !== "ALL") {
    result = result.filter((n) => {
      let plats = [];
      try {
        plats = JSON.parse(n.platforms || "[]");
      } catch {
        plats = [];
      }
      return plats.includes(platformFilter);
    });
  }

  // 상태 필터
  if (statusFilter && statusFilter !== "ALL") {
    result = result.filter((n) => n.status === statusFilter);
  }

  // 작품 상태 필터
  if (workStatusFilter && workStatusFilter !== "ALL") {
    result = result.filter((n) => n.work_status === workStatusFilter);
  }

  // 레이팅 범위 필터
  if (minRating !== undefined) {
    result = result.filter((n) => n.rating >= minRating);
  }
  if (maxRating !== undefined) {
    result = result.filter((n) => n.rating <= maxRating);
  }

  // 읽은 회차 범위 필터
  if (minReadCount !== undefined) {
    result = result.filter((n) => (n.read_count || 0) >= minReadCount);
  }
  if (maxReadCount !== undefined) {
    result = result.filter((n) => (n.read_count || 0) <= maxReadCount);
  }

  return result;
}

export function updateTagUsageCounts(novels) {
  const counts = {};
  const coOccurrences = {};

  for (const n of novels || []) {
    const tags = (n.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    for (const tag of tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }

    // 동시 출현 계산
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = [tags[i], tags[j]].sort().join("|");
        coOccurrences[key] = (coOccurrences[key] || 0) + 1;
      }
    }
  }

  return { counts, coOccurrences };
}

export function checkTitleDuplicate(title, existingNovels, excludeId = null) {
  const t = (title || "").trim().toLowerCase();
  if (!t) return null;

  for (const n of existingNovels || []) {
    if (excludeId && n.id === excludeId) continue;
    if ((n.title || "").trim().toLowerCase() === t) {
      return n;
    }
  }

  return null;
}

export function getRecentlyEditedNovels(novels, limit = 5) {
  return [...(novels || [])]
    .filter((n) => n.read_count_updated_at)
    .sort((a, b) => (b.read_count_updated_at || 0) - (a.read_count_updated_at || 0))
    .slice(0, limit);
}
