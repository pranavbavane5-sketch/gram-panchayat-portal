/**
 * JalMitra - Native OpenXML Excel (.xlsx) Generator
 * Built using Node.js built-in zlib. Generates standard Office OpenXML workbooks
 * compatible with Microsoft Excel, Google Sheets, LibreOffice, and Numbers.
 * Zero external dependencies.
 */

import zlib from "zlib";

// CRC32 implementation for ZIP archive headers
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function escapeXml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function numToColName(num) {
  let col = "";
  let n = num;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

/**
 * Builds a valid .xlsx buffer from sheet name, columns, and row objects.
 * @param {string} sheetName 
 * @param {Array<{key: string, title: string, width?: number}>} columns 
 * @param {Array<Object>} rows 
 * @returns {Buffer}
 */
export function buildExcelWorkbook(sheetName, columns, rows) {
  // 1. Build Worksheet XML
  let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  sheetXml += `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n`;
  
  // Column widths
  sheetXml += `  <cols>\n`;
  columns.forEach((col, idx) => {
    const width = col.width || 22;
    sheetXml += `    <col min="${idx + 1}" max="${idx + 1}" width="${width}" customWidth="1"/>\n`;
  });
  sheetXml += `  </cols>\n`;

  // Sheet Data
  sheetXml += `  <sheetData>\n`;

  // Header row (Row 1) - style 1 (Header Style)
  sheetXml += `    <row r="1" ht="28" customHeight="1">\n`;
  columns.forEach((col, idx) => {
    const cellRef = `${numToColName(idx + 1)}1`;
    sheetXml += `      <c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(col.title)}</t></is></c>\n`;
  });
  sheetXml += `    </row>\n`;

  // Data rows (Row 2 .. N+1)
  rows.forEach((row, rowIdx) => {
    const rNum = rowIdx + 2;
    const styleId = (rowIdx % 2 === 0) ? "2" : "3"; // alternate row striping
    sheetXml += `    <row r="${rNum}" ht="20" customHeight="1">\n`;
    columns.forEach((col, colIdx) => {
      const cellRef = `${numToColName(colIdx + 1)}${rNum}`;
      const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : "";
      sheetXml += `      <c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
    });
    sheetXml += `    </row>\n`;
  });

  sheetXml += `  </sheetData>\n`;
  sheetXml += `</worksheet>`;

  // 2. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  // 3. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // 4. xl/workbook.xml
  const safeSheetName = escapeXml(sheetName || "Sheet1");
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  // 5. xl/_rels/workbook.xml.rels
  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // 6. xl/styles.xml
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="10"/><name val="Segoe UI"/><color rgb="FF1F2937"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0284C7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  // Collect files to zip
  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypesXml, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rootRelsXml, "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbookXml, "utf8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(wbRelsXml, "utf8") },
    { name: "xl/styles.xml", data: Buffer.from(stylesXml, "utf8") },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheetXml, "utf8") }
  ];

  return createZipBuffer(files);
}

/**
 * Creates standard PKZIP buffer from files array
 */
function createZipBuffer(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  // DOS time/date for fixed timestamp
  const dosTime = 0x5678;
  const dosDate = 0x5cd0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.name, "utf8");
    const uncompressedData = file.data;
    const crc = crc32(uncompressedData);
    const uncompressedSize = uncompressedData.length;

    // Compress using DEFLATE
    const compressedData = zlib.deflateRawSync(uncompressedData, { level: 6 });
    const compressedSize = compressedData.length;

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034B50, 0); // signature
    localHeader.writeUInt16LE(20, 4);         // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6);     // flags (UTF-8 filename)
    localHeader.writeUInt16LE(8, 8);          // compression method (DEFLATE = 8)
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(filenameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);         // extra field length
    filenameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    // Central directory header (46 bytes + filename)
    const cdHeader = Buffer.alloc(46 + filenameBuf.length);
    cdHeader.writeUInt32LE(0x02014B50, 0);   // central dir signature
    cdHeader.writeUInt16LE(20, 4);           // version made by
    cdHeader.writeUInt16LE(20, 6);           // version needed
    cdHeader.writeUInt16LE(0x0800, 8);       // flags (UTF-8)
    cdHeader.writeUInt16LE(8, 10);           // method (8)
    cdHeader.writeUInt16LE(dosTime, 12);
    cdHeader.writeUInt16LE(dosDate, 14);
    cdHeader.writeUInt32LE(crc, 16);
    cdHeader.writeUInt32LE(compressedSize, 20);
    cdHeader.writeUInt32LE(uncompressedSize, 24);
    cdHeader.writeUInt16LE(filenameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);           // extra field len
    cdHeader.writeUInt16LE(0, 32);           // file comment len
    cdHeader.writeUInt16LE(0, 34);           // disk number start
    cdHeader.writeUInt16LE(0, 36);           // internal file attributes
    cdHeader.writeUInt32LE(0, 38);           // external file attributes
    cdHeader.writeUInt32LE(offset, 42);      // relative offset of local header
    filenameBuf.copy(cdHeader, 46);

    centralHeaders.push(cdHeader);
    offset += localHeader.length + compressedData.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  centralHeaders.forEach(ch => { centralDirSize += ch.length; });

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054B50, 0);
  eocd.writeUInt16LE(0, 4);                     // disk number
  eocd.writeUInt16LE(0, 6);                     // start disk
  eocd.writeUInt16LE(files.length, 8);          // entries on this disk
  eocd.writeUInt16LE(files.length, 10);         // total entries
  eocd.writeUInt32LE(centralDirSize, 12);       // size of central dir
  eocd.writeUInt32LE(centralDirOffset, 16);     // offset of central dir
  eocd.writeUInt16LE(0, 20);                    // comment len

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}
