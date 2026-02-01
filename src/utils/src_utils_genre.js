/**
 * 장르 판정 및 신뢰도 계산 함수
 * 
 * 분리 날짜: 2025-01-28
 * 원본 위치: App.jsx 라인 14409-14451
 * 
 * 사용법:
 * import { deriveMajorGenre, computeReliability } from './src/utils';
 */

// ═══════════════════════════════════════════════════════════════
// 🎯 대장르 자동 판정 (태그 기반)
// ═══════════════════════════════════════════════════════════════
export function deriveMajorGenre(tagsStr) {
  const tags = (tagsStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (tags.length === 0) return "";
  
  const MAP = [
    ["무협", ["무협", "무림", "신무협", "패왕", "검술", "강호", "혈맹", "표국"]],
    ["선협", ["선협", "선계", "수련", "비급", "도법", "장생"]],
    ["현판", ["현판", "현대판타지", "헌터", "게이트", "던전", "각성", "레이드"]],
    ["현대", ["현대", "일상", "학원", "회사", "재벌", "범죄", "스포츠", "연예계"]],
    ["로판", ["로판", "로맨스판타지", "공작", "후작", "황자", "귀족", "궁정"]],
    ["로맨스", ["로맨스", "현로", "연애", "캠퍼스", "BL", "GL"]],
    ["판타지", ["판타지", "하이판타지", "마법", "용", "정령", "왕국", "모험"]],
    ["SF", ["SF", "사이버펑크", "우주", "로봇", "AI", "타임루프", "디스토피아"]],
  ];
  
  const tset = tags.map((t) => t.toLowerCase());
  for (const [label, keys] of MAP) {
    const hit = tset.some((t) =>
      keys.some((k) => t.includes(String(k).toLowerCase()))
    );
    if (hit) return label;
  }
  return "";
}

// ═══════════════════════════════════════════════════════════════
// 📊 신뢰도 계산
// (읽은 회차수 / 전체 회차수) * (진행된 매칭수 / 전체 가능 매칭수) * 100
// ═══════════════════════════════════════════════════════════════
export function computeReliability(novel, totalNovelCount) {
  const totalEpisodes = Number(novel.total_episodes) || 0;
  const readCount = Number(novel.read_count) || 0;
  const matchCount = Number(novel.match_count) || 0;
  const maxMatchForNovel = Math.max(0, totalNovelCount - 1);

  if (totalEpisodes <= 0 || maxMatchForNovel <= 0) return 0;

  const readRatio = Math.min(1, readCount / totalEpisodes);
  const matchRatio = Math.min(1, matchCount / maxMatchForNovel);

  return readRatio * matchRatio * 100;
}
