// 최소한의 xlsx 읽기. 칸의 값만 읽고 서식은 보지 않는다. DB와 화면을 모른다.
// 엑셀이 다시 저장하면 ZIP이 압축되므로 inflate를 직접 둔다. 앱 환경에 TextDecoder와 DOMParser가 없어 UTF-8과 XML도 직접 푼다.
import { crc32 } from "./xlsxWriter";

const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
const NOT_XLSX = "xlsx 파일이 아니거나 암호가 걸려 있어요.";

const LENGTH_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LENGTH_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CODE_LENGTH_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

function huffman(lengths) {
  const count = new Uint16Array(16);
  for (let i = 0; i < lengths.length; i++) count[lengths[i]]++;
  count[0] = 0;
  const offsets = new Uint16Array(16);
  for (let i = 1; i < 15; i++) offsets[i + 1] = offsets[i] + count[i];
  const symbols = new Uint16Array(lengths.length);
  for (let i = 0; i < lengths.length; i++) if (lengths[i]) symbols[offsets[lengths[i]]++] = i;
  return { count, symbols };
}

/** raw DEFLATE를 푼다. size는 ZIP 목록에 적힌 풀린 크기다. */
export function inflate(input, size) {
  const out = new Uint8Array(size);
  let at = 0;
  let pos = 0;
  let bitBuffer = 0;
  let bitCount = 0;

  const bits = (need) => {
    while (bitCount < need) {
      if (pos >= input.length) throw new Error("압축 데이터가 잘렸어요.");
      bitBuffer |= input[pos++] << bitCount;
      bitCount += 8;
    }
    const value = bitBuffer & ((1 << need) - 1);
    bitBuffer >>>= need;
    bitCount -= need;
    return value;
  };
  const decode = ({ count, symbols }) => {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= 15; len++) {
      code |= bits(1);
      const n = count[len];
      if (code - n < first) return symbols[index + (code - first)];
      index += n;
      first = (first + n) << 1;
      code <<= 1;
    }
    throw new Error("압축 데이터가 깨졌어요.");
  };
  const put = (byte) => {
    if (at >= size) throw new Error("압축을 푼 크기가 목록과 달라요.");
    out[at++] = byte;
  };

  const fixedLengths = new Uint8Array(288);
  fixedLengths.fill(8, 0, 144);
  fixedLengths.fill(9, 144, 256);
  fixedLengths.fill(7, 256, 280);
  fixedLengths.fill(8, 280, 288);
  const fixedLit = huffman(fixedLengths);
  const fixedDist = huffman(new Uint8Array(30).fill(5));

  let last = 0;
  while (!last) {
    last = bits(1);
    const type = bits(2);
    if (type === 0) {
      bitBuffer = 0;
      bitCount = 0;
      if (pos + 4 > input.length) throw new Error("압축 데이터가 잘렸어요.");
      const len = input[pos] | (input[pos + 1] << 8);
      const nlen = input[pos + 2] | (input[pos + 3] << 8);
      if ((len ^ 0xffff) !== nlen) throw new Error("압축 데이터가 깨졌어요.");
      pos += 4;
      if (pos + len > input.length) throw new Error("압축 데이터가 잘렸어요.");
      for (let i = 0; i < len; i++) put(input[pos++]);
    } else if (type === 1 || type === 2) {
      let lit = fixedLit;
      let dist = fixedDist;
      if (type === 2) {
        const nlen = bits(5) + 257;
        const ndist = bits(5) + 1;
        const ncode = bits(4) + 4;
        const codeLengths = new Uint8Array(19);
        for (let i = 0; i < ncode; i++) codeLengths[CODE_LENGTH_ORDER[i]] = bits(3);
        const codeTable = huffman(codeLengths);
        const lengths = new Uint8Array(nlen + ndist);
        for (let i = 0; i < nlen + ndist;) {
          const symbol = decode(codeTable);
          if (symbol < 16) { lengths[i++] = symbol; continue; }
          let previous = 0;
          let repeat;
          if (symbol === 16) {
            if (i === 0) throw new Error("압축 데이터가 깨졌어요.");
            previous = lengths[i - 1];
            repeat = 3 + bits(2);
          } else repeat = symbol === 17 ? 3 + bits(3) : 11 + bits(7);
          if (i + repeat > nlen + ndist) throw new Error("압축 데이터가 깨졌어요.");
          while (repeat--) lengths[i++] = previous;
        }
        lit = huffman(lengths.subarray(0, nlen));
        dist = huffman(lengths.subarray(nlen));
      }
      for (;;) {
        const symbol = decode(lit);
        if (symbol < 256) { put(symbol); continue; }
        if (symbol === 256) break;
        const lengthIndex = symbol - 257;
        if (lengthIndex >= 29) throw new Error("압축 데이터가 깨졌어요.");
        const length = LENGTH_BASE[lengthIndex] + bits(LENGTH_EXTRA[lengthIndex]);
        const distIndex = decode(dist);
        if (distIndex >= 30) throw new Error("압축 데이터가 깨졌어요.");
        const distance = DIST_BASE[distIndex] + bits(DIST_EXTRA[distIndex]);
        if (distance > at) throw new Error("압축 데이터가 깨졌어요.");
        for (let i = 0; i < length; i++) put(out[at - distance]);
      }
    } else {
      throw new Error("압축 데이터가 깨졌어요.");
    }
  }
  if (at !== size) throw new Error("압축을 푼 크기가 목록과 달라요.");
  return out;
}

export function utf8Decode(bytes) {
  const parts = [];
  let chunk = [];
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++];
    let c = b;
    if (b >= 0xf0) c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else if (b >= 0xe0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else if (b >= 0xc0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    if (c >= 0x10000) {
      c -= 0x10000;
      chunk.push(0xd800 | (c >> 10), 0xdc00 | (c & 1023));
    } else chunk.push(c);
    if (chunk.length >= 4096) {
      parts.push(String.fromCharCode.apply(null, chunk));
      chunk = [];
    }
  }
  parts.push(String.fromCharCode.apply(null, chunk));
  return parts.join("");
}

/** ZIP 목록을 읽어 이름으로 파일을 꺼내는 함수를 돌려준다. 파일을 고른 순간이 아니라 꺼낼 때 CRC를 확인한다. */
export function openZip(bytes) {
  if (bytes.length < 22) throw new Error(NOT_XLSX);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i >= bytes.length - 22 - 65535; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(NOT_XLSX);
  const count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50) throw new Error(NOT_XLSX);
    const nameLength = view.getUint16(at + 28, true);
    const name = utf8Decode(bytes.subarray(at + 46, at + 46 + nameLength));
    entries.set(name, {
      flags: view.getUint16(at + 8, true),
      method: view.getUint16(at + 10, true),
      crc: view.getUint32(at + 16, true),
      compressedSize: view.getUint32(at + 20, true),
      size: view.getUint32(at + 24, true),
      local: view.getUint32(at + 42, true),
    });
    at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
  }
  return (name) => {
    const entry = entries.get(name);
    if (!entry) return null;
    if (entry.flags & 1) throw new Error(NOT_XLSX);
    if (entry.size > MAX_ENTRY_BYTES) throw new Error("파일이 너무 커요.");
    if (entry.local + 30 > bytes.length || view.getUint32(entry.local, true) !== 0x04034b50) throw new Error(NOT_XLSX);
    const dataAt = entry.local + 30 + view.getUint16(entry.local + 26, true) + view.getUint16(entry.local + 28, true);
    if (dataAt + entry.compressedSize > bytes.length) throw new Error("파일이 잘렸어요.");
    const raw = bytes.subarray(dataAt, dataAt + entry.compressedSize);
    let data;
    if (entry.method === 0) data = raw;
    else if (entry.method === 8) data = inflate(raw, entry.size);
    else throw new Error("지원하지 않는 압축 방식이에요.");
    if (crc32(data) !== entry.crc) throw new Error("파일이 깨졌어요.");
    return utf8Decode(data);
  };
}

const decodeXml = (text) =>
  text
    .replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|(amp|lt|gt|quot|apos));/g, (_, dec, hex, named) => {
      if (named) return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[named];
      const code = dec ? Number(dec) : parseInt(hex, 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/_x([0-9a-fA-F]{4})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

const attribute = (attrs, name) => {
  const match = attrs.match(new RegExp(`(?:^|\\s)(?:[\\w.-]+:)?${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
  if (!match) return null;
  return decodeXml(match[1] ?? match[2] ?? "");
};

// 태그 앞에 x: 같은 접두사를 붙이는 프로그램도 있다.
const elements = (xml, tag) => {
  const pattern = new RegExp(`<(?:[\\w.-]+:)?${tag}(?=[\\s/>])([^>]*?)(?:/>|>([\\s\\S]*?)</(?:[\\w.-]+:)?${tag}>)`, "g");
  const found = [];
  for (let m = pattern.exec(xml); m; m = pattern.exec(xml)) found.push({ attrs: m[1], body: m[2] ?? "" });
  return found;
};

const textOf = (xml) => elements(xml, "t").map((t) => decodeXml(t.body)).join("");

function parseSharedStrings(xml) {
  if (!xml) return [];
  // 후리가나(rPh)는 칸의 글자가 아니다.
  return elements(xml, "si").map((si) => textOf(si.body.replace(/<(?:[\w.-]+:)?rPh\b[\s\S]*?<\/(?:[\w.-]+:)?rPh>/g, "")));
}

const columnIndex = (ref) => {
  let index = 0;
  for (const ch of String(ref).toUpperCase()) {
    const code = ch.charCodeAt(0);
    if (code < 65 || code > 90) break;
    index = index * 26 + code - 64;
  }
  return index - 1;
};

function cellValue(cell, strings) {
  const type = attribute(cell.attrs, "t");
  if (type === "inlineStr") return textOf(cell.body);
  const raw = elements(cell.body, "v")[0]?.body;
  if (raw === undefined) return null;
  const text = decodeXml(raw);
  if (type === "s") return strings[Number(text)] ?? null;
  if (type === "str") return text;
  if (type === "e") return null;
  if (type === "b") return text === "1" ? "TRUE" : "FALSE";
  const number = Number(text);
  return text.trim() !== "" && Number.isFinite(number) ? number : text;
}

function parseSheet(xml, strings) {
  const rows = [];
  let lastRow = 0;
  for (const row of elements(xml, "row")) {
    const rowNumber = Number(attribute(row.attrs, "r")) || lastRow + 1;
    lastRow = rowNumber;
    const cells = [];
    let lastColumn = -1;
    for (const cell of elements(row.body, "c")) {
      const ref = attribute(cell.attrs, "r");
      const column = ref ? columnIndex(ref) : lastColumn + 1;
      lastColumn = column;
      if (column >= 0) cells[column] = cellValue(cell, strings);
    }
    rows.push({ rowNumber, cells });
  }
  return rows;
}

const sheetPath = (target) => {
  if (target.startsWith("/")) return target.slice(1);
  const parts = ["xl"];
  for (const part of target.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
};

/**
 * @param {Uint8Array} bytes
 * @returns {{sheets: Array<{name: string, rows: Array<{rowNumber: number, cells: Array<string|number|null|undefined>}>}>}}
 */
export function readXlsx(bytes) {
  const read = openZip(bytes);
  const workbook = read("xl/workbook.xml");
  const rels = read("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) throw new Error(NOT_XLSX);
  const strings = parseSharedStrings(read("xl/sharedStrings.xml"));
  const targets = new Map(elements(rels, "Relationship").map((rel) => [attribute(rel.attrs, "Id"), attribute(rel.attrs, "Target")]));
  const sheets = [];
  for (const sheet of elements(workbook, "sheet")) {
    const target = targets.get(attribute(sheet.attrs, "id"));
    const xml = target ? read(sheetPath(target)) : null;
    if (xml) sheets.push({ name: attribute(sheet.attrs, "name") || "", rows: parseSheet(xml, strings) });
  }
  return { sheets };
}
