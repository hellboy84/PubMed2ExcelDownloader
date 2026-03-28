// background.js  ―  最小限の MV3 Service Worker
const ext = typeof browser !== 'undefined' ? browser : chrome;

ext.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('PubMed2ExcelDownloader installed');
  }
});
