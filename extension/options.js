import { DEFAULT_CONFIG } from './core.js';

const $ = (id) => document.getElementById(id);

// Accept either a bare file ID or a pasted Google Docs/Sheets link.
export function extractId(value) {
  const v = (value || '').trim();
  const m = /\/d\/([a-zA-Z0-9_-]+)/.exec(v);
  return m ? m[1] : v;
}

async function load() {
  const { config } = await chrome.storage.local.get('config');
  const c = { ...DEFAULT_CONFIG, ...(config || {}) };
  $('accountIndex').value = c.accountIndex;
  $('mattersSheetId').value = c.mattersSheetId;
  $('missionControlDocId').value = c.missionControlDocId;
  $('routeLinks').checked = c.routeLinks;
  $('keepLoaded').checked = c.keepLoaded;
  const r = await chrome.runtime.sendMessage({ type: 'accountIndexes' });
  const idx = (r && r.ok && r.result) || [];
  $('accounts').textContent = idx.length
    ? `Accounts seen in open Gmail/Calendar tabs: ${idx.map((n) => '/u/' + n).join(', ')}. Open the work inbox and check its address bar if unsure.`
    : 'No Gmail/Calendar tabs with an account index are open.';
}

$('save').onclick = async () => {
  const config = {
    accountIndex: Math.max(0, parseInt($('accountIndex').value, 10) || 0),
    mattersSheetId: extractId($('mattersSheetId').value),
    missionControlDocId: extractId($('missionControlDocId').value),
    routeLinks: $('routeLinks').checked,
    keepLoaded: $('keepLoaded').checked,
  };
  await chrome.storage.local.set({ config });
  $('mattersSheetId').value = config.mattersSheetId;
  $('missionControlDocId').value = config.missionControlDocId;
  $('msg').textContent = 'Saved.';
};

load();
