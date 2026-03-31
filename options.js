'use strict';

const ext = typeof browser !== 'undefined' ? browser : chrome;

const emailInput  = document.getElementById('email');
const apikeyInput = document.getElementById('apikey');
const saveStatus  = document.getElementById('save-status');

// 保存済みの値を読み込む
document.addEventListener('DOMContentLoaded', () => {
  ext.storage.sync.get(['userEmail', 'apiKey'], (data) => {
    if (data.userEmail) emailInput.value  = data.userEmail;
    if (data.apiKey)    apikeyInput.value = data.apiKey;
  });
});

// 保存
document.getElementById('options-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const email  = emailInput.value.trim();
  const apiKey = apikeyInput.value.trim();

  if (!email) {
    showStatus('error', 'メールアドレスを入力してください。');
    emailInput.focus();
    return;
  }

  const toStore = { userEmail: email };
  if (apiKey) {
    toStore.apiKey = apiKey;
  } else {
    ext.storage.sync.remove('apiKey');
  }

  ext.storage.sync.set(toStore, () => {
    showStatus('success', '保存しました。');
    setTimeout(() => showStatus('', ''), 3000);
  });
});

function showStatus(type, message) {
  saveStatus.textContent = message;
  saveStatus.className   = type;
}
