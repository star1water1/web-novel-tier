/**
 * 표지 이미지 서비스 (v6.0)
 * @module services/coverService
 * 
 * @source_origin 원본 App.jsx 5272-5392줄 (121줄)
 * 
 * @description
 * 표지 이미지 로컬 저장 및 관리
 * 
 * 주요 기능:
 * - 표지 디렉토리 관리 (ensureCoverDir)
 * - 이미지 저장 및 압축 (saveCoverToLibrary)
 * - 이미지 삭제 (deleteCoverFromLibrary)
 * - 저장소 크기 계산 (getCoverLibrarySize)
 * 
 * @dependencies
 * - expo-file-system
 * - expo-image-manipulator (압축용)
 */

import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { uuid } from "../utils/helpers";

// ═══════════════════════════════════════════════════════════════
// 📌 상수
// ═══════════════════════════════════════════════════════════════

export const COVER_DIR = FileSystem.documentDirectory + "covers/";

// 압축 설정 맵
export const COMPRESSION_PRESETS = {
  original: { quality: 1.0, maxSize: null },        // 원본 유지
  light: { quality: 0.8, maxSize: 1200 },           // 가벼운 압축 (기본값)
  medium: { quality: 0.6, maxSize: 800 },           // 중간 압축
  heavy: { quality: 0.4, maxSize: 600 },            // 강한 압축
};

// ═══════════════════════════════════════════════════════════════
// 📌 표지 디렉토리 관리
// ═══════════════════════════════════════════════════════════════

async function ensureCoverDir() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(COVER_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(COVER_DIR, { intermediates: true });
    }
  } catch (e) {
    console.warn("ensureCoverDir error:", e);
  }
}

// 이미지를 표지 라이브러리에 저장 (레거시 API)
// 🔧 v3.5.1: content:// URI 지원 강화 - 여러 방법 시도
async function saveCoverToLibrary(sourceUri, compressionLevel = "light") {
  try {
    await ensureCoverDir();
    
    const id = uuid();
    const fileName = `${id}.jpg`;
    const destUri = COVER_DIR + fileName;
    
    // 🔧 v3.5.1: 여러 방법으로 시도
    // 방법 1: copyAsync (file:// URI에서 잘 작동)
    // 방법 2: downloadAsync (일부 content:// URI에서 작동)
    
    let success = false;
    
    // 방법 1: copyAsync 시도
    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destUri,
      });
      success = true;
    } catch (copyError) {
      console.warn("saveCoverToLibrary: copyAsync 실패, downloadAsync 시도:", copyError.message);
    }
    
    // 방법 2: downloadAsync 시도 (copyAsync 실패 시)
    if (!success) {
      try {
        const downloadResult = await FileSystem.downloadAsync(sourceUri, destUri);
        if (downloadResult.status === 200) {
          success = true;
        }
      } catch (downloadError) {
        console.warn("saveCoverToLibrary: downloadAsync도 실패:", downloadError.message);
      }
    }
    
    if (!success) {
      return null;
    }
    
    // 복사 후 대상 파일 정보 확인
    const destInfo = await FileSystem.getInfoAsync(destUri);
    if (!destInfo.exists) {
      console.warn("saveCoverToLibrary: 복사 후 대상 파일이 존재하지 않음");
      return null;
    }
    
    return {
      id,
      file_path: destUri,
      file_size: destInfo.size || 0,
    };
  } catch (e) {
    console.warn("saveCoverToLibrary error:", e.message);
    return null;
  }
}

// 표지 라이브러리에서 이미지 삭제 (레거시 API)
async function deleteCoverFromLibrary(filePath) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  } catch (e) {
    console.warn("deleteCoverFromLibrary error:", e);
  }
}

// 표지 라이브러리 전체 용량 계산 (레거시 API)
async function getCoverLibrarySize() {
  try {
    await ensureCoverDir();
    const dirInfo = await FileSystem.getInfoAsync(COVER_DIR);
    if (!dirInfo.exists) return 0;
    
    const files = await FileSystem.readDirectoryAsync(COVER_DIR);
    let totalSize = 0;
    
    for (const fileName of files) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(COVER_DIR + fileName);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      } catch (e) {
        // 개별 파일 오류는 무시
      }
    }
    return totalSize;
  } catch (e) {
    console.warn("getCoverLibrarySize error:", e);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// 📌 Export
// ═══════════════════════════════════════════════════════════════

export {
  ensureCoverDir,
  saveCoverToLibrary,
  deleteCoverFromLibrary,
  getCoverLibrarySize,
};
