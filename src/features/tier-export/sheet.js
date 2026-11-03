// 앱 작품 데이터를 티어표 행으로 가공하고, 변동 결과에 맞춰 시트 모양을 만든다. DB와 화면을 모른다.

export const EXPORT_COLORS = {
  new: "FFF7CC",
  up: "ECF8D4",
  down: "FDEADB",
  read: "ECF8D4",
  readOnUp: "CDE8A5", // 상승 행은 이미 연두색이라 화수 변화가 보이도록 조금 진하게 칠한다.
};

const HEADERS = ["Tier", "순위", "제목", "읽은 화수", "플랫폼", "대장르", "작가"];
const MIN_WIDTHS = [7.1, 7, 7, 40.75, 10.2, 13.5, 13.5, 13.75];
const MAX_WIDTH = 70;
// 숨긴 열. 머리글에 출력본 ID를, 행마다 작품 ID를 넣어 가져올 때 알아본다.
export const ID_HEADER = "작품ID";
const ID_COLUMN = HEADERS.length + 1;
const ID_WIDTH = 10;
const BLACK = "000000";
const GRAY = "D9D9D9";
const medium = { style: "medium", color: BLACK };
const thin = { style: "thin", color: GRAY };

// 티어 첫 글자로 정한 색. 그 밖의 커스텀 티어는 앱에서 정한 티어 색을 쓴다.
const TIER_LETTER_COLORS = { S: "FF0000", A: "F79646", B: "8064A2", C: "00B050" };

function parseList(value) {
  if (Array.isArray(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return text.split(",");
}

const cleanList = (value) => parseList(value).map((item) => String(item ?? "").trim()).filter(Boolean);

/** 읽은 화수 표기. 숫자는 숫자 칸으로, 나머지는 글자 칸으로 들어간다. */
export function formatRead(work) {
  const read = Number(work.read_count) || 0;
  const gaidenRead = Number(work.gaiden_read_count) || 0;
  const hasGaiden = work.gaiden_status && work.gaiden_status !== "none";
  if (hasGaiden && gaidenRead > 0) return `외전 ${gaidenRead}`;
  const total = Number(work.total_episodes) || 0;
  if (work.work_status === "completed" && total > 0 && read >= total) return `${read}(完)`;
  return read;
}

/**
 * 순위 탭과 같은 순서로 정렬된 작품을 행으로 바꾼다. 순위는 티어마다 1부터 센다.
 * @param {object[]} works 티어 순서 → 티어 안 순서로 정렬된 작품
 * @param {{getTier: (work) => string, tierLabel: (tier) => string, tierColor: (tier) => string}} helpers
 */
export function buildRows(works, { getTier, tierLabel, tierColor }) {
  const seen = new Map();
  return works.map((work) => {
    const tier = getTier(work);
    const rank = (seen.get(tier) || 0) + 1;
    seen.set(tier, rank);
    return {
      id: work.id,
      title: work.title || "",
      tier,
      tierLabel: tierLabel(tier) || tier,
      tierColor: tierColor(tier),
      rank,
      read: Number(work.read_count) || 0,
      gaidenRead: Number(work.gaiden_read_count) || 0,
      readText: formatRead(work),
      platform: cleanList(work.platforms).join(", "),
      genre: cleanList(work.major_genre)[0] || "",
      author: String(work.author || "").trim(),
      rating: Number(work.rating) || 0,
      hasGaiden: Boolean(work.gaiden_status && work.gaiden_status !== "none"),
      manualTier: work.manual_tier || null,
      manualOrder: Number(work.manual_order) || 0,
      readUpdatedAt: work.read_count_updated_at ?? null,
    };
  });
}

function fontColorOf(row) {
  const letter = String(row.tierLabel).charAt(0).toUpperCase();
  return TIER_LETTER_COLORS[letter] || String(row.tierColor || BLACK).replace(/^#/, "");
}

// 영문·숫자는 1칸, 한글 등은 2칸으로 어림한다.
function estimateWidth(value) {
  let width = 0;
  for (const ch of String(value ?? "")) width += ch.codePointAt(0) < 0x2e80 ? 1 : 2;
  return width + 2;
}

function fillsOf(state) {
  const change = state?.change;
  const rowFill = change === "new" ? EXPORT_COLORS.new : change === "up" ? EXPORT_COLORS.up : change === "down" ? EXPORT_COLORS.down : null;
  let readFill = rowFill;
  if (state?.readChanged) readFill = change === "up" ? EXPORT_COLORS.readOnUp : EXPORT_COLORS.read;
  return { rowFill, readFill };
}

/**
 * @param {ReturnType<typeof buildRows>} rows
 * @param {Map<string, {change: string|null, readChanged: boolean}>} status
 * @param {string} [exportId] 이 파일의 출력 기록 ID
 * @returns xlsxWriter의 buildXlsx에 넘길 시트. A열은 비워 둔다.
 */
export function buildSheet(rows, status, exportId = "") {
  const lastCol = HEADERS.length - 1;
  const headerCells = HEADERS.map((value, col) => ({
    value,
    style: {
      bold: true,
      border: {
        left: col === 0 ? medium : thin,
        right: col === lastCol ? medium : thin,
        top: medium,
        bottom: medium,
      },
    },
  }));

  const bodyRows = rows.map((row, rowIndex) => {
    const { rowFill, readFill } = fillsOf(status?.get(row.id));
    const bottom = rowIndex === rows.length - 1 ? medium : thin;
    const values = [row.tierLabel, row.rank, row.title, row.readText, row.platform, row.genre, row.author];
    return [
      null,
      ...values.map((value, col) => ({
        value,
        style: {
          bold: col === 0,
          color: col === 0 ? fontColorOf(row) : null,
          fill: col === 3 ? readFill : rowFill,
          border: { left: col === 0 ? medium : thin, right: col === lastCol ? medium : thin, top: thin, bottom },
        },
      })),
      { value: row.id },
    ];
  });

  const columnWidths = MIN_WIDTHS.map((min, col) => {
    if (col === 0) return min;
    const widest = rows.reduce((max, row) => {
      const values = [row.tierLabel, row.rank, row.title, row.readText, row.platform, row.genre, row.author];
      return Math.max(max, estimateWidth(values[col - 1]));
    }, estimateWidth(HEADERS[col - 1]));
    return Math.min(MAX_WIDTH, Math.max(min, widest));
  });

  return {
    name: "티어표",
    fontName: "맑은 고딕",
    fontSize: 11,
    columnWidths: [...columnWidths, ID_WIDTH],
    hiddenColumns: [ID_COLUMN],
    rows: [[null, ...headerCells, { value: exportId ? `${ID_HEADER}:${exportId}` : ID_HEADER }], ...bodyRows],
  };
}
