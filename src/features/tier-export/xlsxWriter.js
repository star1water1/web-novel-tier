// 최소한의 xlsx 생성기. 시트 하나, 문자열·숫자, 글꼴·채우기·테두리만 쓴다. DB와 화면을 모른다.
// ZIP은 압축 없이(stored) 담는다. 표 하나라 크기가 작고, 압축 라이브러리가 필요 없다.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function utf8Encode(text) {
  const out = [];
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

export function buildZip(files, date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const entries = files.map(({ name, data }) => {
    const bytes = typeof data === "string" ? utf8Encode(data) : data;
    return { name: utf8Encode(name), bytes, crc: crc32(bytes) };
  });
  const size = entries.reduce((sum, e) => sum + 30 + e.name.length + e.bytes.length + 46 + e.name.length, 22);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let at = 0;
  const u16 = (v) => { view.setUint16(at, v, true); at += 2; };
  const u32 = (v) => { view.setUint32(at, v, true); at += 4; };
  const put = (b) => { out.set(b, at); at += b.length; };
  const common = (e) => {
    u16(20); u16(0); u16(0); u16(time); u16(day);
    u32(e.crc); u32(e.bytes.length); u32(e.bytes.length); u16(e.name.length); u16(0);
  };
  for (const e of entries) {
    e.offset = at;
    u32(0x04034b50);
    common(e);
    put(e.name);
    put(e.bytes);
  }
  const centralAt = at;
  for (const e of entries) {
    u32(0x02014b50);
    u16(20);
    common(e);
    u16(0); u16(0); u16(0); u32(0); u32(e.offset);
    put(e.name);
  }
  const centralSize = at - centralAt;
  u32(0x06054b50);
  u16(0); u16(0); u16(entries.length); u16(entries.length);
  u32(centralSize); u32(centralAt); u16(0);
  return out;
}

const escapeXml = (value) =>
  String(value)
    // XML 1.0에 넣을 수 없는 제어 문자와 짝 없는 서로게이트를 뺀다. 제목은 외부에서 긁어 온 값일 수 있다.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])/g, "")
    .replace(/(^|[^\ud800-\udbff])[\udc00-\udfff]/g, "$1")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const columnName = (index) => {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
};

const argb = (rgb) => `FF${String(rgb).replace(/^#/, "").toUpperCase()}`;

function borderXml(border) {
  const side = (name) => {
    const value = border?.[name];
    if (!value) return `<${name}/>`;
    return `<${name} style="${value.style}"><color rgb="${argb(value.color)}"/></${name}>`;
  };
  return `<border>${side("left")}${side("right")}${side("top")}${side("bottom")}<diagonal/></border>`;
}

// 같은 값을 한 번만 등록하고 번호를 돌려준다.
function registry(initial = []) {
  const list = [...initial];
  const index = new Map(initial.map((xml, i) => [xml, i]));
  return {
    list,
    add(xml) {
      if (!index.has(xml)) { index.set(xml, list.length); list.push(xml); }
      return index.get(xml);
    },
  };
}

/**
 * @param {object} sheet
 * @param {string} sheet.name 시트 이름
 * @param {string} sheet.fontName
 * @param {number} sheet.fontSize
 * @param {number[]} sheet.columnWidths A열부터의 너비
 * @param {number[]} [sheet.hiddenColumns] 숨길 열 번호. A열이 0
 * @param {Array<Array<{value?: string|number|null, style?: object}|null>>} sheet.rows
 *   style: { bold, color, fill, border: { left, right, top, bottom: { style, color } } }. 색은 RRGGBB.
 * @param {Date} [date] 파일 안에 기록할 시각
 * @returns {Uint8Array}
 */
export function buildXlsx(sheet, date = new Date()) {
  const fontXml = (style) => {
    const color = style?.color ? `<color rgb="${argb(style.color)}"/>` : `<color rgb="FF000000"/>`;
    return `<font>${style?.bold ? "<b/>" : ""}<sz val="${sheet.fontSize}"/>${color}<name val="${escapeXml(sheet.fontName)}"/><family val="3"/><charset val="129"/></font>`;
  };
  const fillXml = (rgb) => `<fill><patternFill patternType="solid"><fgColor rgb="${argb(rgb)}"/><bgColor indexed="64"/></patternFill></fill>`;

  const fonts = registry([fontXml(null)]);
  const fills = registry(['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>']);
  const borders = registry([borderXml(null)]);
  const xfs = registry(['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']);
  const strings = registry();
  const stringXml = (value) => `<si><t xml:space="preserve">${escapeXml(value)}</t></si>`;
  let stringCount = 0;

  const styleIndex = (style) => {
    if (!style) return 0;
    const fontId = fonts.add(fontXml(style));
    const fillId = style.fill ? fills.add(fillXml(style.fill)) : 0;
    const borderId = style.border ? borders.add(borderXml(style.border)) : 0;
    return xfs.add(
      `<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0" applyFont="1"${fillId ? ' applyFill="1"' : ""}${borderId ? ' applyBorder="1"' : ""} applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>`
    );
  };

  const rowsXml = sheet.rows.map((cells, rowIndex) => {
    const cols = cells.map((cell, colIndex) => {
      if (!cell) return "";
      const ref = `${columnName(colIndex)}${rowIndex + 1}`;
      const s = styleIndex(cell.style);
      const value = cell.value;
      if (value === null || value === undefined || value === "") return `<c r="${ref}" s="${s}"/>`;
      if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${s}"><v>${value}</v></c>`;
      stringCount++;
      return `<c r="${ref}" s="${s}" t="s"><v>${strings.add(stringXml(value))}</v></c>`;
    });
    return `<row r="${rowIndex + 1}">${cols.join("")}</row>`;
  });

  const lastColumn = columnName(Math.max(0, sheet.columnWidths.length - 1));
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const pkgRel = "http://schemas.openxmlformats.org/package/2006/relationships";
  const contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml";

  return buildZip(
    [
      {
        name: "[Content_Types].xml",
        data: `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${contentType}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${contentType}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${contentType}.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="${contentType}.sharedStrings+xml"/></Types>`,
      },
      {
        name: "_rels/.rels",
        data: `${head}<Relationships xmlns="${pkgRel}"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      },
      {
        name: "xl/workbook.xml",
        data: `${head}<workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="${escapeXml(sheet.name)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      },
      {
        name: "xl/_rels/workbook.xml.rels",
        data: `${head}<Relationships xmlns="${pkgRel}"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/><Relationship Id="rId3" Type="${rel}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
      },
      {
        name: "xl/worksheets/sheet1.xml",
        data: `${head}<worksheet xmlns="${main}"><dimension ref="A1:${lastColumn}${Math.max(1, sheet.rows.length)}"/><sheetFormatPr defaultRowHeight="16.5"/><cols>${sheet.columnWidths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"${sheet.hiddenColumns?.includes(i) ? ' hidden="1"' : ""}/>`).join("")}</cols><sheetData>${rowsXml.join("")}</sheetData><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`,
      },
      {
        name: "xl/styles.xml",
        data: `${head}<styleSheet xmlns="${main}"><fonts count="${fonts.list.length}">${fonts.list.join("")}</fonts><fills count="${fills.list.length}">${fills.list.join("")}</fills><borders count="${borders.list.length}">${borders.list.join("")}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.list.length}">${xfs.list.join("")}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      },
      {
        name: "xl/sharedStrings.xml",
        data: `${head}<sst xmlns="${main}" count="${stringCount}" uniqueCount="${strings.list.length}">${strings.list.join("")}</sst>`,
      },
    ],
    date
  );
}
