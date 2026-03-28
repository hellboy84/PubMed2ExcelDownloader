/**
 * pubmed-core.js  ―  PubMed2Excel 共通モジュール
 *
 * HTMLツール (PubMed2ExcelConverter) とブラウザ拡張機能 (PubMed2ExcelDownloader) の
 * 両方から読み込まれる共通ライブラリ。
 *
 * 使用方法:
 *   <script src="path/to/pubmed-core.js"></script>
 *   → グローバル変数 PubMedCore として公開される
 *
 * 依存:
 *   exportToXLSX を使用する場合は SheetJS (xlsx.full.min.js) が必要。
 */
(function (global) {
  'use strict';

  const EXCEL_CELL_LIMIT = 30000;

  // ── フィールド定義 ──────────────────────────────────────────────────────────
  const FIELDS = [
    { key: 'PMID', label: 'PMID',         tag: 'PMID', checked: true  },
    { key: 'LA',   label: '言語',          tag: 'LA',   checked: true  },
    { key: 'AU',   label: '著者(略称)',     tag: 'AU',   checked: true  },
    { key: 'FAU',  label: '著者(フル)',     tag: 'FAU',  checked: false },
    { key: 'TI',   label: '論題',          tag: 'TI',   checked: true  },
    { key: 'TA',   label: '雑誌名(略称)',   tag: 'TA',   checked: true  },
    { key: 'JT',   label: '雑誌名(フル)',   tag: 'JT',   checked: false },
    { key: 'DP',   label: '出版年',        tag: 'DP',   checked: true  },
    { key: 'VI',   label: '巻',            tag: 'VI',   checked: true  },
    { key: 'IP',   label: '号',            tag: 'IP',   checked: true  },
    { key: 'PG',   label: 'ページ',        tag: 'PG',   checked: true  },
    { key: 'PT',   label: '出版タイプ',     tag: 'PT',   checked: true  },
    { key: 'AB',   label: '抄録',          tag: 'AB',   checked: true  },
    { key: 'OT',   label: '著者キーワード', tag: 'OT',   checked: false },
    { key: 'MH',   label: 'MeSH用語',      tag: 'MH',   checked: false },
    { key: 'DOI',  label: 'DOI',           tag: 'AID',  checked: false, filter: 'doi' },
    { key: 'IS',   label: 'ISSN',          tag: 'IS',   checked: false },
    { key: 'AD',   label: '著者所属',       tag: 'AD',   checked: false },
  ];

  // ── NBIB/MEDLINE パーサー ───────────────────────────────────────────────────
  /**
   * MEDLINE/NBIB 形式のテキストを解析してレコード配列を返す。
   * @param {string} text - MEDLINE/NBIB フォーマットのテキスト
   * @returns {Object[]} レコードオブジェクトの配列
   */
  function parseNBIB(text) {
    const records = [];
    const blocks = text.split(/\n\n+/);
    let currentRecord = null;
    let currentTag = '';
    const multiTags = new Set(['AU', 'FAU', 'AD', 'MH', 'OT', 'PT', 'AID', 'IS', 'LA']);

    for (const block of blocks) {
      for (const line of block.split('\n')) {
        const tagMatch = line.match(/^([A-Z]{2,4})\s*-\s?(.*)/);
        const contMatch = line.match(/^\s{2,}(.*)/);

        if (tagMatch) {
          const tag = tagMatch[1].trim();
          const value = tagMatch[2].trim();

          if (tag === 'PMID') {
            if (currentRecord) records.push(currentRecord);
            currentRecord = {};
          }
          if (!currentRecord) continue;
          currentTag = tag;

          if (multiTags.has(tag)) {
            if (!currentRecord[tag]) currentRecord[tag] = [];
            currentRecord[tag].push(value);
          } else {
            currentRecord[tag] = value;
          }
        } else if (contMatch && currentRecord && currentTag) {
          const val = contMatch[1].trim();
          if (multiTags.has(currentTag) && Array.isArray(currentRecord[currentTag])) {
            currentRecord[currentTag][currentRecord[currentTag].length - 1] += ' ' + val;
          } else if (typeof currentRecord[currentTag] === 'string') {
            currentRecord[currentTag] += ' ' + val;
          }
        }
      }
    }
    if (currentRecord && currentRecord['PMID']) records.push(currentRecord);
    return records;
  }

  // ── フィールド値取得 ────────────────────────────────────────────────────────
  /**
   * レコードから指定フィールドの値を文字列として取得する。
   * @param {Object} record - parseNBIB が返したレコードオブジェクト
   * @param {Object} field  - FIELDS 配列の要素
   * @returns {string}
   */
  function getFieldValue(record, field) {
    if (field.key === 'DOI') {
      const aids = record['AID'] || [];
      const doi = aids.find(a => a.toLowerCase().includes('[doi]'));
      return doi ? doi.replace(/\s*\[doi\]\s*/i, '').trim() : '';
    }
    if (field.key === 'DP') {
      const dp = record['DP'] || '';
      const m = dp.match(/^\d{4}/);
      return m ? m[0] : dp;
    }
    const val = record[field.tag];
    if (!val) return '';
    return Array.isArray(val) ? val.join('; ') : val;
  }

  // ── データマトリクス構築 ────────────────────────────────────────────────────
  /**
   * ヘッダー行とデータ行の2次元配列を構築する。
   * @param {Object[]} records  - レコード配列
   * @param {Object[]} selected - 選択されたフィールドの配列
   * @returns {{ headers: string[], rows: string[][] }}
   */
  function buildDataMatrix(records, selected) {
    const headers = selected.map(f =>
      f.label === f.key ? f.label : f.label + '(' + f.key + ')'
    );
    const rows = records.map(rec => selected.map(f => getFieldValue(rec, f)));
    return { headers, rows };
  }

  // ── CSV エスケープ ──────────────────────────────────────────────────────────
  function csvEscape(val) {
    const s = String(val);
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  // ── ファイルダウンロード ────────────────────────────────────────────────────
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── ファイル名生成 ──────────────────────────────────────────────────────────
  /**
   * タイムスタンプ付きファイル名ベース文字列を生成する（拡張子なし）。
   * @param {string} prefix - 'p2e' または 'p2c'
   * @returns {string} 例: 'p2e_260328143022'
   */
  function generateFilename(prefix) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ts = String(now.getFullYear()).slice(2)
      + pad(now.getMonth() + 1)
      + pad(now.getDate())
      + pad(now.getHours())
      + pad(now.getMinutes())
      + pad(now.getSeconds());
    return prefix + '_' + ts;
  }

  // ── Excel (.xlsx) エクスポート ─────────────────────────────────────────────
  /**
   * レコードを Excel ファイルとしてダウンロードする。
   * SheetJS (XLSX グローバル変数) が必要。
   * @param {Object[]} records   - レコード配列
   * @param {Object[]} selected  - 選択されたフィールド配列
   * @param {string}   filename  - 拡張子なしファイル名
   * @returns {{ truncatedCount: number, truncatedPMIDs: string[] }}
   */
  function exportToXLSX(records, selected, filename) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJSライブラリが読み込まれていません。');
    }

    const { headers, rows } = buildDataMatrix(records, selected);
    const ws = {};
    const range = { s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: rows.length } };

    // ヘッダー行（文字列型として設定）
    headers.forEach((h, c) => {
      ws[XLSX.utils.encode_cell({ c, r: 0 })] = { t: 's', v: h };
    });

    // データ行（全セルを文字列型に強制、30,000 字で切り詰め）
    let truncatedCount = 0;
    const truncatedPMIDs = new Set();
    rows.forEach((row, r) => {
      row.forEach((val, c) => {
        let s = String(val);
        if (s.length > EXCEL_CELL_LIMIT) {
          s = s.substring(0, EXCEL_CELL_LIMIT) + '…[truncated]';
          truncatedCount++;
          const pmid = records[r]['PMID'];
          if (pmid) truncatedPMIDs.add(pmid);
        }
        ws[XLSX.utils.encode_cell({ c, r: r + 1 })] = { t: 's', v: s };
      });
    });

    ws['!ref'] = XLSX.utils.encode_range(range);

    // 列幅の自動設定（最大 60 文字）
    ws['!cols'] = headers.map((h, c) => {
      let maxLen = h.length;
      for (const row of rows) {
        const len = String(row[c]).length;
        if (len > maxLen) maxLen = len;
      }
      return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PubMed');
    XLSX.writeFile(wb, filename + '.xlsx');

    return { truncatedCount, truncatedPMIDs: [...truncatedPMIDs] };
  }

  // ── CSV エクスポート ────────────────────────────────────────────────────────
  /**
   * レコードを CSV ファイルとしてダウンロードする。
   * @param {Object[]} records   - レコード配列
   * @param {Object[]} selected  - 選択されたフィールド配列
   * @param {string}   filename  - 拡張子なしファイル名
   * @param {boolean}  [bom=true] - UTF-8 BOM を付与するか
   */
  function exportToCSV(records, selected, filename, bom = true) {
    const { headers, rows } = buildDataMatrix(records, selected);
    const csvLines = [
      headers.map(csvEscape).join(','),
      ...rows.map(row => row.map(csvEscape).join(','))
    ];
    const csvContent = csvLines.join('\n');

    let blob;
    if (bom) {
      blob = new Blob(
        [new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent],
        { type: 'text/csv;charset=utf-8' }
      );
    } else {
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    }
    downloadBlob(blob, filename + '.csv');
  }

  // ── 公開 API ───────────────────────────────────────────────────────────────
  global.PubMedCore = {
    FIELDS,
    EXCEL_CELL_LIMIT,
    parseNBIB,
    getFieldValue,
    buildDataMatrix,
    csvEscape,
    downloadBlob,
    generateFilename,
    exportToXLSX,
    exportToCSV,
  };

})(typeof globalThis !== 'undefined' ? globalThis : window);
