// content.js  ―  PubMedページの状態を取得して返す注入スクリプト
//
// popup.js から scripting.executeScript({ files: ['content.js'] }) で注入される。
// IIFE の戻り値が results[0].result として popup.js に返る。

(function extractPubMedState() {
  // PubMed 以外のページでは即時 false を返す
  if (!window.location.hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
    return { isSearchPage: false };
  }

  // ── 検索クエリの取得 ───────────────────────────────────────────────────
  // 優先1: URLパラメータ ?term=
  const params = new URLSearchParams(window.location.search);
  let query = params.get('term') || '';

  // 優先2: 検索ボックスの入力値
  if (!query) {
    const termInput = document.querySelector('#id_term');
    if (termInput) query = termInput.value || '';
  }

  // 優先3: meta タグ
  if (!query) {
    const metaQuery = document.querySelector('meta[name="log_userterm"]');
    if (metaQuery) query = metaQuery.getAttribute('content') || '';
  }

  // 検索クエリがない場合（記事詳細ページ等）は false を返す
  if (!query) {
    return { isSearchPage: false };
  }

  // 検索結果コンテナが存在するか確認（一覧ページの判定）
  const hasResults = document.querySelector(
    '#search-results, .search-results, article.full-docsum'
  );
  if (!hasResults) {
    return { isSearchPage: false };
  }

  // ── 総件数の取得 ───────────────────────────────────────────────────────
  // 優先1: <meta name="log_resultcount"> （最も信頼性が高い）
  let totalCount = 0;
  const metaCount = document.querySelector('meta[name="log_resultcount"]');
  if (metaCount) {
    const n = parseInt(metaCount.getAttribute('content'), 10);
    if (!isNaN(n) && n >= 0) totalCount = n;
  }

  // 優先2: search-results-chunk の data-results-amount 属性
  if (totalCount === 0) {
    const chunk = document.querySelector('.search-results-chunk[data-results-amount]');
    if (chunk) {
      const n = parseInt(chunk.getAttribute('data-results-amount'), 10);
      if (!isNaN(n) && n >= 0) totalCount = n;
    }
  }

  // 優先3: 画面上の件数表示テキスト
  if (totalCount === 0) {
    const countSelectors = [
      '.results-amount .value',
      '.results-amount-container .value',
      'div[class*="results-amount"] span.value',
      '#search-results .results-amount .value',
    ];
    for (const sel of countSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const n = parseInt(el.textContent.replace(/[,\s]/g, ''), 10);
        if (!isNaN(n) && n >= 0) { totalCount = n; break; }
      }
    }
  }

  // ── ページ上の PMID 一覧 ────────────────────────────────────────────────
  // 優先1: search-results-chunk の data-chunk-ids 属性（最も確実）
  // 例: data-chunk-ids="40897431,40650339,40425295,..."
  let currentPagePmids = [];
  const chunk = document.querySelector('.search-results-chunk[data-chunk-ids]');
  if (chunk) {
    currentPagePmids = chunk.getAttribute('data-chunk-ids')
      .split(',')
      .map(s => s.trim())
      .filter(v => /^\d+$/.test(v));
  }

  // 優先2: input.search-result-selector チェックボックスの value
  if (currentPagePmids.length === 0) {
    const checkboxSelectors = [
      'input.search-result-selector[value]',
      'input[name^="search-result-selector"][value]',
      'input.docsum-checkbox[value]',   // 旧バージョン対応
    ];
    let checkboxes = [];
    for (const sel of checkboxSelectors) {
      const found = Array.from(document.querySelectorAll(sel));
      if (found.length > 0) { checkboxes = found; break; }
    }
    currentPagePmids = checkboxes
      .map(cb => cb.value)
      .filter(v => /^\d+$/.test(v));
  }

  // 優先3: 記事タイトルリンクの href / data-article-id
  if (currentPagePmids.length === 0) {
    const links = Array.from(
      document.querySelectorAll('a.docsum-title[data-article-id], a.docsum-title[href]')
    );
    for (const link of links) {
      const id = link.getAttribute('data-article-id') ||
                 (link.getAttribute('href') || '').match(/\/(\d{6,})\/?/)?.[1];
      if (id && /^\d+$/.test(id) && !currentPagePmids.includes(id)) {
        currentPagePmids.push(id);
      }
    }
  }

  // ── チェック済み PMID ───────────────────────────────────────────────────
  // チェックボックスの checked プロパティをライブDOMから読み取る
  const checkboxes = Array.from(
    document.querySelectorAll(
      'input.search-result-selector[value], input[name^="search-result-selector"][value], input.docsum-checkbox[value]'
    )
  );
  const checkedPmids = checkboxes
    .filter(cb => cb.checked)
    .map(cb => cb.value)
    .filter(v => /^\d+$/.test(v));

  // ── ページサイズ・ページ番号 ────────────────────────────────────────────
  // 優先1: URL パラメータ
  let pageSize    = parseInt(params.get('size') || '0', 10);
  let currentPage = parseInt(params.get('page') || '0', 10);

  // 優先2: DOM要素
  if (!pageSize) {
    const sizeEl = document.querySelector('#id_size');
    if (sizeEl) pageSize = parseInt(sizeEl.value, 10) || 10;
    else pageSize = 10;
  }
  if (!currentPage) {
    const pageEl = document.querySelector('#page-number-input');
    if (pageEl) currentPage = parseInt(pageEl.value, 10) || 1;
    else currentPage = 1;
  }

  return {
    isSearchPage:    true,
    totalCount,
    query,
    pageSize,
    currentPage,
    currentPagePmids,
    checkedPmids,
  };
})();
