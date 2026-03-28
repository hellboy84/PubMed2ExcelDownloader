// popup.js  ―  PubMed2ExcelDownloader 拡張機能のポップアップ制御
'use strict';

const ext = typeof browser !== 'undefined' ? browser : chrome;

// ── DOM 参照 ───────────────────────────────────────────────────────────────
const statusArea       = document.getElementById('status-area');
const mainArea         = document.getElementById('main-area');
const scopeChecked     = document.getElementById('scope-checked');
const scopePage        = document.getElementById('scope-page');
const scopeCountInput  = document.getElementById('scope-count-input');
const labelAll         = document.getElementById('label-all');
const labelChecked     = document.getElementById('label-checked');
const labelPage        = document.getElementById('label-page');
const labelCheckedWrap = document.getElementById('label-checked-wrap');
const labelPageWrap    = document.getElementById('label-page-wrap');
const fieldsGrid       = document.getElementById('fields-grid');
const downloadBtn      = document.getElementById('download-btn');
const progressArea     = document.getElementById('progress-area');
const progressBar      = document.getElementById('progress-bar');
const progressText     = document.getElementById('progress-text');
const cancelBtn        = document.getElementById('cancel-btn');
const resultArea       = document.getElementById('result-area');
const encodingSelect   = document.getElementById('encoding');

// ── 状態 ───────────────────────────────────────────────────────────────────
let pageState = null;
let abortController = null;

// ── 初期化 ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  buildFieldsGrid();

  // アクティブタブを取得
  let tab;
  try {
    const tabs = await ext.tabs.query({ active: true, currentWindow: true });
    tab = tabs[0];
  } catch (e) {
    showStatus('error', 'タブ情報の取得に失敗しました。');
    return;
  }

  // PubMed 以外のページはエラー
  if (!tab || !tab.url || !tab.url.includes('pubmed.ncbi.nlm.nih.gov')) {
    showStatus('error', 'PubMedの検索結果ページでご利用ください。');
    return;
  }

  // content.js を注入してページ状態を取得
  let results;
  try {
    results = await ext.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  } catch (e) {
    showStatus('error', 'PubMedの検索結果ページでご利用ください。');
    return;
  }

  const state = results && results[0] && results[0].result;
  if (!state || !state.isSearchPage) {
    showStatus('error', 'PubMedの検索結果ページでご利用ください。');
    return;
  }
  if (state.totalCount === 0) {
    showStatus('error', '検索結果が0件です。');
    return;
  }

  pageState = state;
  initUI();
});

// ── UI 初期化 ────────────────────────────────────────────────────────────────
function initUI() {
  showStatus(null);

  const { totalCount, checkedPmids, currentPagePmids } = pageState;

  labelAll.textContent     = totalCount.toLocaleString() + '件';
  labelChecked.textContent = checkedPmids.length + '件';
  labelPage.textContent    = currentPagePmids.length + '件';

  if (checkedPmids.length === 0) {
    labelCheckedWrap.classList.add('disabled');
    scopeChecked.disabled = true;
  }
  if (currentPagePmids.length === 0) {
    labelPageWrap.classList.add('disabled');
    scopePage.disabled = true;
  }

  mainArea.style.display = 'block';
}

// ── ステータス表示 ───────────────────────────────────────────────────────────
function showStatus(type, message) {
  if (!type) {
    statusArea.style.display = 'none';
    return;
  }
  statusArea.className = type;
  statusArea.textContent = message;
  statusArea.style.display = 'block';
  mainArea.style.display = 'none';
}

// ── 結果メッセージ表示 ───────────────────────────────────────────────────────
function showResult(type, message) {
  resultArea.className = type;
  resultArea.textContent = message;
  resultArea.style.display = 'block';
}

// ── フィールドグリッド構築 ───────────────────────────────────────────────────
function buildFieldsGrid() {
  PubMedCore.FIELDS.forEach(f => {
    const label = document.createElement('label');
    label.className = 'field-toggle';
    const tag = f.filter ? f.tag + '[' + f.filter + ']' : f.tag;
    label.innerHTML =
      `<input type="checkbox" data-key="${f.key}" ${f.checked ? 'checked' : ''}> ` +
      `${f.label} <span class="field-tag">${tag}</span>`;
    fieldsGrid.appendChild(label);
  });
}

function getSelectedFields() {
  const selected = [];
  fieldsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.checked) {
      const f = PubMedCore.FIELDS.find(f => f.key === cb.dataset.key);
      if (f) selected.push(f);
    }
  });
  return selected;
}

// ── フィールド選択ボタン ─────────────────────────────────────────────────────
document.getElementById('select-all-btn').addEventListener('click', () => {
  fieldsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
});

document.getElementById('reset-default-btn').addEventListener('click', () => {
  fieldsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const f = PubMedCore.FIELDS.find(f => f.key === cb.dataset.key);
    cb.checked = f ? f.checked : false;
  });
});

// ── キャンセルボタン ─────────────────────────────────────────────────────────
cancelBtn.addEventListener('click', () => {
  if (abortController) abortController.abort();
});

// ── 進捗 UI 制御 ─────────────────────────────────────────────────────────────
function setFetchingUI(fetching) {
  downloadBtn.disabled = fetching;
  progressArea.style.display = fetching ? 'block' : 'none';
  if (!fetching) {
    progressBar.style.width = '0%';
    progressText.textContent = '';
  }
}

function updateProgress(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressText.textContent =
    '取得中... ' + done.toLocaleString() + ' / ' + total.toLocaleString() + '件';
}

// ── ダウンロードボタン ────────────────────────────────────────────────────────
downloadBtn.addEventListener('click', async () => {
  resultArea.style.display = 'none';

  const selected = getSelectedFields();
  if (selected.length === 0) {
    showResult('error', '少なくとも1つのフィールドを選択してください。');
    return;
  }

  const scope  = document.querySelector('input[name="scope"]:checked').value;
  const format = document.querySelector('input[name="format"]:checked').value;

  // 取得対象の決定
  let targetPmids = null;
  let targetCount = 0;

  if (scope === 'checked') {
    targetPmids = pageState.checkedPmids;
    targetCount = targetPmids.length;
  } else if (scope === 'page') {
    targetPmids = pageState.currentPagePmids;
    targetCount = targetPmids.length;
  } else if (scope === 'count') {
    const n = parseInt(scopeCountInput.value, 10);
    if (isNaN(n) || n < 1) {
      showResult('error', '件数に正の整数を入力してください。');
      return;
    }
    targetCount = Math.min(n, pageState.totalCount);
  } else {
    targetCount = pageState.totalCount;
  }

  if (targetCount === 0) {
    showResult('error', '取得対象が0件です。');
    return;
  }

  // 500件超の警告
  if (targetCount > 500) {
    const minEst = Math.ceil((targetCount / 500) * 0.334 / 60);
    const confirmed = window.confirm(
      targetCount.toLocaleString() + '件のデータを取得します。\n' +
      '取得に時間がかかります（目安: ' + minEst + '分以上）。\n' +
      '取得中はこのウィンドウを閉じないでください。\n\n続行しますか？'
    );
    if (!confirmed) return;
  }

  // 取得開始
  abortController = new AbortController();
  setFetchingUI(true);

  let records = [];
  let partialFailure = false;
  let totalRequested = targetCount;

  try {
    if (targetPmids) {
      records = await fetchByPmids(targetPmids, abortController.signal);
    } else {
      const result = await fetchBySearch(
        pageState.query, targetCount, abortController.signal
      );
      records        = result.records;
      partialFailure = result.partialFailure;
      totalRequested = result.totalRequested;
    }
  } catch (e) {
    setFetchingUI(false);
    if (e.name === 'AbortError') {
      showResult('warn', '取得をキャンセルしました。');
    } else {
      showResult('error', 'データの取得に失敗しました。しばらく待ってから再度お試しください。');
      console.error('[PubMed2ExcelDownloader]', e);
    }
    return;
  }

  setFetchingUI(false);

  if (records.length === 0) {
    showResult('error', 'データを取得できませんでした。しばらく待ってから再度お試しください。');
    return;
  }

  // エクスポート
  try {
    const prefix   = format === 'xlsx' ? 'p2e' : 'p2c';
    const filename = PubMedCore.generateFilename(prefix);

    if (format === 'xlsx') {
      const { truncatedCount } = PubMedCore.exportToXLSX(records, selected, filename);
      let msg = partialFailure
        ? totalRequested + '件中' + records.length + '件を取得しました。一部のレコードは取得できませんでした。'
        : '✓ ' + records.length + '件をExcelでダウンロードしました。';
      if (truncatedCount > 0) {
        msg += '（' + truncatedCount + '件のセルが30,000文字で切り詰められました。CSVでは全文取得可能です）';
      }
      showResult(partialFailure || truncatedCount > 0 ? 'warn' : 'success', msg);
    } else {
      const bom = encodingSelect.value === 'utf8bom';
      PubMedCore.exportToCSV(records, selected, filename, bom);
      const msg = partialFailure
        ? totalRequested + '件中' + records.length + '件を取得しました。一部のレコードは取得できませんでした。'
        : '✓ ' + records.length + '件をCSVでダウンロードしました。';
      showResult(partialFailure ? 'warn' : 'success', msg);
    }
  } catch (e) {
    showResult('error', 'ファイルの生成に失敗しました。');
    console.error('[PubMed2ExcelDownloader]', e);
  }
});

// ── API ユーティリティ ────────────────────────────────────────────────────────

function buildBaseParams() {
  return new URLSearchParams({
    db:    'pubmed',
    tool:  'pubmed2exceldownloader',
    email: '8voldenuit4@gmailcom',
  });
}

/**
 * タイムアウト付き fetch。
 * outerSignal（キャンセル用）と内部タイムアウトを両立する。
 */
async function fetchWithTimeout(url, timeoutMs, outerSignal) {
  const localCtrl = new AbortController();
  const timeoutId = setTimeout(
    () => localCtrl.abort(new DOMException('Timeout', 'TimeoutError')),
    timeoutMs
  );

  if (outerSignal) {
    if (outerSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    outerSignal.addEventListener('abort', () => localCtrl.abort(outerSignal.reason));
  }

  try {
    return await fetch(url, { signal: localCtrl.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseXmlTag(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '>([^<]+)</' + tag + '>'));
  return m ? m[1].trim() : null;
}

// ── PMID 直接指定フェッチ（チェック済 / 現在ページ）──────────────────────────
async function fetchByPmids(pmids, signal) {
  updateProgress(0, pmids.length);

  const params = buildBaseParams();
  params.set('id',      pmids.join(','));
  params.set('rettype', 'medline');
  params.set('retmode', 'text');

  const url  = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + params.toString();
  const resp = await fetchWithTimeout(url, 30000, signal);
  if (!resp.ok) throw new Error('HTTP ' + resp.status);

  const records = PubMedCore.parseNBIB(await resp.text());
  updateProgress(records.length, pmids.length);
  return records;
}

// ── ESearch + EFetch ループ（全件 / 件数指定）────────────────────────────────
async function fetchBySearch(query, targetCount, signal) {
  // 1. ESearch で WebEnv を取得
  const esParams = buildBaseParams();
  esParams.set('term',       query);
  esParams.set('usehistory', 'y');
  esParams.set('retmax',     '0');
  esParams.set('retmode',    'xml');

  const esUrl  = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?' + esParams.toString();
  const esResp = await fetchWithTimeout(esUrl, 30000, signal);
  if (!esResp.ok) throw new Error('HTTP ' + esResp.status);

  const esXml    = await esResp.text();
  const webEnv   = parseXmlTag(esXml, 'WebEnv');
  const queryKey = parseXmlTag(esXml, 'QueryKey');
  const countStr = parseXmlTag(esXml, 'Count');

  if (!webEnv || !queryKey) {
    throw new Error('ESearch のレスポンスを解析できませんでした。');
  }

  const fetchCount = Math.min(targetCount, parseInt(countStr || '0', 10));
  if (fetchCount === 0) throw new Error('検索結果が0件です。');

  // 2. EFetch ループ
  const batchSize   = 500;
  const allRecords  = [];
  let failedBatches = 0;

  updateProgress(0, fetchCount);

  for (let start = 0; start < fetchCount; start += batchSize) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const efParams = buildBaseParams();
    efParams.set('query_key', queryKey);
    efParams.set('WebEnv',    webEnv);
    efParams.set('rettype',   'medline');
    efParams.set('retmode',   'text');
    efParams.set('retstart',  String(start));
    efParams.set('retmax',    String(Math.min(batchSize, fetchCount - start)));

    const efUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?' + efParams.toString();

    try {
      const efResp = await fetchWithTimeout(efUrl, 30000, signal);
      if (!efResp.ok) throw new Error('HTTP ' + efResp.status);
      allRecords.push(...PubMedCore.parseNBIB(await efResp.text()));
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      failedBatches++;
      console.warn('[PubMed2ExcelDownloader] バッチ取得失敗 (start=' + start + '):', e);
    }

    updateProgress(Math.min(start + batchSize, fetchCount), fetchCount);

    if (start + batchSize < fetchCount) await sleep(334);
  }

  if (allRecords.length === 0) throw new Error('データの取得に失敗しました。');

  return {
    records:        allRecords,
    partialFailure: failedBatches > 0,
    totalRequested: fetchCount,
  };
}
