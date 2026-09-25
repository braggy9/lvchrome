import { CORE_KEYS, DEFAULT_CONFIG, matchesKey, keyForUrl, coreUrl, isUserNewTab, accountIndexesIn } from './core.js';

// ---- State -----------------------------------------------------------------
// config  → chrome.storage.local  (survives restarts; only IDs and toggles)
// session → chrome.storage.session (tab/window IDs, which die with the browser)
//   bindings:  { [key]: tabId }
//   lastCore:  { [key]: url }      last URL at which the bound tab matched (for restore)
//   drifted:   { [key]: true }     bound tab has navigated away from its core page
//   workWindowId
//   log:       [{ t, event, key?, detail? }]  no URLs, ever

const LOG_LIMIT = 60;

async function getConfig() {
  const { config } = await chrome.storage.local.get('config');
  return { ...DEFAULT_CONFIG, ...(config || {}) };
}

async function getSession() {
  const s = await chrome.storage.session.get(['bindings', 'lastCore', 'drifted', 'workWindowId', 'log']);
  return {
    bindings: s.bindings || {},
    lastCore: s.lastCore || {},
    drifted: s.drifted || {},
    workWindowId: s.workWindowId ?? null,
    log: s.log || [],
  };
}

async function setSession(patch) {
  await chrome.storage.session.set(patch);
}

async function log(event, key, detail) {
  const { log: entries } = await getSession();
  entries.push({ t: new Date().toISOString(), event, ...(key ? { key } : {}), ...(detail ? { detail } : {}) });
  await setSession({ log: entries.slice(-LOG_LIMIT) });
}

async function tabExists(tabId) {
  if (tabId == null) return null;
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

async function windowType(windowId) {
  try {
    return (await chrome.windows.get(windowId)).type;
  } catch {
    return null;
  }
}

async function updateBadge() {
  const { drifted } = await getSession();
  const n = Object.values(drifted).filter(Boolean).length;
  await chrome.action.setBadgeText({ text: n ? '!' : '' });
  if (n) await chrome.action.setBadgeBackgroundColor({ color: '#b3261e' });
}

async function protect(tabId, config) {
  if (!config.keepLoaded) return;
  try {
    await chrome.tabs.update(tabId, { autoDiscardable: false });
  } catch {
    // tab may have closed between events; nothing to protect
  }
}

// ---- Binding ---------------------------------------------------------------

async function bind(key, tab, config) {
  const s = await getSession();
  s.bindings[key] = tab.id;
  s.lastCore[key] = tab.url;
  delete s.drifted[key];
  await setSession({ bindings: s.bindings, lastCore: s.lastCore, drifted: s.drifted });
  await protect(tab.id, config);
  await updateBadge();
  await log('bound', key);
}

// Pick the best existing tab for a key: normal windows only, prefer tabs
// outside the work window, then the most recently accessed.
async function findCandidate(key, config, workWindowId, excludeIds = new Set()) {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const matches = tabs.filter((t) => !excludeIds.has(t.id) && matchesKey(key, t.url || t.pendingUrl || '', config));
  matches.sort((a, b) => {
    const aw = a.windowId === workWindowId ? 1 : 0;
    const bw = b.windowId === workWindowId ? 1 : 0;
    if (aw !== bw) return aw - bw;
    return (b.lastAccessed || 0) - (a.lastAccessed || 0);
  });
  return matches[0] || null;
}

async function boundIds() {
  const { bindings } = await getSession();
  return new Set(Object.values(bindings));
}

// Returns the core tab for a key, binding one if needed. A bound tab that has
// drifted away is still returned: it is the core tab, and focusing it lets the
// user see the "Restore" prompt rather than silently spawning a duplicate.
async function resolve(key, config) {
  const s = await getSession();
  const existing = await tabExists(s.bindings[key]);
  if (existing) return existing;
  if (s.bindings[key] != null) {
    delete s.bindings[key];
    delete s.drifted[key];
    await setSession({ bindings: s.bindings, drifted: s.drifted });
  }
  const others = new Set(Object.values(s.bindings));
  const candidate = await findCandidate(key, config, s.workWindowId, others);
  if (candidate) await bind(key, candidate, config);
  return candidate;
}

async function scanAll() {
  const config = await getConfig();
  for (const key of CORE_KEYS) await resolve(key, config);
  await updateBadge();
}

// ---- Focus -----------------------------------------------------------------

async function focusCore(key) {
  const config = await getConfig();
  let tab = await resolve(key, config);
  if (!tab) {
    // Missing core tab → reopen it in the most recent normal, non-work window.
    const url = coreUrl(key, config);
    if (!url) {
      await log('focus-unconfigured', key);
      return { key, action: 'unconfigured' };
    }
    const { workWindowId } = await getSession();
    const wins = await chrome.windows.getAll({ windowTypes: ['normal'] });
    const target = wins.filter((w) => w.id !== workWindowId).sort((a, b) => (b.focused ? 1 : 0) - (a.focused ? 1 : 0))[0];
    if (target) {
      tab = await chrome.tabs.create({ windowId: target.id, url, active: true });
      await chrome.windows.update(target.id, { focused: true });
    } else {
      const w = await chrome.windows.create({ url, type: 'normal', focused: true });
      tab = w.tabs[0];
    }
    await bind(key, { ...tab, url }, config);
    await log('opened', key);
    return { key, action: 'opened' };
  }
  const wasDiscarded = !!tab.discarded;
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });
  await protect(tab.id, config);
  await log('focused', key, wasDiscarded ? 'was-discarded (will reload)' : 'live');
  return { key, action: 'focused', wasDiscarded };
}

async function restoreCore(key) {
  const config = await getConfig();
  const s = await getSession();
  const tab = await tabExists(s.bindings[key]);
  const url = s.lastCore[key] || coreUrl(key, config);
  if (!tab || !url) return { key, action: 'nothing-to-restore' };
  await chrome.tabs.update(tab.id, { url, active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  await log('restored', key);
  return { key, action: 'restored' };
}

// ---- Link routing ----------------------------------------------------------

async function ensureWorkWindowFor(tabId) {
  const s = await getSession();
  if (s.workWindowId != null && (await windowType(s.workWindowId)) === 'normal') {
    await chrome.tabs.move(tabId, { windowId: s.workWindowId, index: -1 });
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(s.workWindowId, { focused: true });
    return s.workWindowId;
  }
  const w = await chrome.windows.create({ tabId, type: 'normal', focused: true });
  await setSession({ workWindowId: w.id });
  await log('work-window-created');
  return w.id;
}

// Chrome can briefly refuse tab edits (e.g. mid-drag); retry a few times.
async function withRetry(fn, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
}

async function maybeRoute(tab) {
  const config = await getConfig();
  if (!config.routeLinks || tab.openerTabId == null) return;
  const s = await getSession();
  const openerKey = Object.keys(s.bindings).find((k) => s.bindings[k] === tab.openerTabId);
  if (!openerKey) return; // opened from Habitat or anything else: leave alone
  if (tab.windowId === s.workWindowId) return;
  if ((await windowType(tab.windowId)) !== 'normal') return; // Gmail pop-outs etc.
  if (isUserNewTab(tab.pendingUrl || tab.url)) return;
  try {
    await withRetry(() => ensureWorkWindowFor(tab.id));
    await log('routed', openerKey);
  } catch (e) {
    await log('route-failed', openerKey, String(e && e.message).slice(0, 120));
  }
}

// ---- Events ----------------------------------------------------------------

chrome.tabs.onCreated.addListener((tab) => {
  maybeRoute(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  const config = await getConfig();
  const s = await getSession();
  const boundKey = Object.keys(s.bindings).find((k) => s.bindings[k] === tabId);
  if (boundKey) {
    if (matchesKey(boundKey, changeInfo.url, config)) {
      s.lastCore[boundKey] = changeInfo.url;
      if (s.drifted[boundKey]) {
        delete s.drifted[boundKey];
        await log('back-on-core', boundKey);
      }
    } else if (!s.drifted[boundKey]) {
      s.drifted[boundKey] = true;
      await log('drifted', boundKey);
    }
    await setSession({ lastCore: s.lastCore, drifted: s.drifted });
    await updateBadge();
    return;
  }
  // Unbound tab arriving at a core page: bind it if that key has no live tab.
  const key = keyForUrl(changeInfo.url, config);
  if (key && !(await tabExists(s.bindings[key])) && (await windowType(tab.windowId)) === 'normal') {
    await bind(key, tab, config);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const s = await getSession();
  const key = Object.keys(s.bindings).find((k) => s.bindings[k] === tabId);
  if (!key) return;
  delete s.bindings[key];
  delete s.drifted[key];
  await setSession({ bindings: s.bindings, drifted: s.drifted });
  await updateBadge();
  await log('core-tab-closed', key);
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  const s = await getSession();
  const key = Object.keys(s.bindings).find((k) => s.bindings[k] === removedTabId);
  if (!key) return;
  s.bindings[key] = addedTabId;
  await setSession({ bindings: s.bindings });
  await log('tab-replaced', key);
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const s = await getSession();
  if (s.workWindowId === windowId) await setSession({ workWindowId: null });
});

chrome.commands.onCommand.addListener((command) => {
  const key = command.replace(/^focus-/, '');
  if (CORE_KEYS.includes(key)) focusCore(key);
});

async function seedConfigFromFile() {
  const { config } = await chrome.storage.local.get('config');
  if (config) return;
  try {
    const res = await fetch(chrome.runtime.getURL('config.local.json'));
    if (!res.ok) return;
    const fileConfig = await res.json();
    await chrome.storage.local.set({ config: { ...DEFAULT_CONFIG, ...fileConfig } });
    await log('config-seeded-from-file');
  } catch {
    // no local file; options page will be used instead
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await seedConfigFromFile();
  await scanAll();
});

chrome.runtime.onStartup.addListener(scanAll);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.config) {
    // Config changed: drop bindings that no longer match and rescan.
    (async () => {
      const config = await getConfig();
      const s = await getSession();
      for (const key of CORE_KEYS) {
        const tab = await tabExists(s.bindings[key]);
        if (!tab) continue;
        if (!s.drifted[key] && !matchesKey(key, tab.url || '', config)) {
          delete s.bindings[key];
          await chrome.tabs.update(tab.id, { autoDiscardable: true }).catch(() => {});
        } else if (!config.keepLoaded) {
          await chrome.tabs.update(tab.id, { autoDiscardable: true }).catch(() => {});
        }
      }
      await setSession({ bindings: s.bindings });
      await scanAll();
    })();
  }
});

// ---- Popup / options API ---------------------------------------------------

async function status() {
  const config = await getConfig();
  const s = await getSession();
  const rows = {};
  for (const key of CORE_KEYS) {
    const tab = await tabExists(s.bindings[key]);
    rows[key] = tab
      ? {
          state: s.drifted[key] ? 'drifted' : tab.discarded ? 'unloaded' : 'live',
          inWorkWindow: tab.windowId === s.workWindowId,
          autoDiscardable: tab.autoDiscardable,
        }
      : { state: coreUrl(key, config) ? 'missing' : 'unconfigured' };
  }
  return { rows, workWindowId: s.workWindowId, config };
}

async function setWorkWindow(windowId) {
  if ((await windowType(windowId)) !== 'normal') return { ok: false };
  const { bindings } = await getSession();
  const tabs = await chrome.tabs.query({ windowId });
  const holdsCore = tabs.some((t) => Object.values(bindings).includes(t.id));
  await setSession({ workWindowId: windowId });
  await log('work-window-set', null, holdsCore ? 'window holds a core tab' : undefined);
  return { ok: true, holdsCore };
}

async function diagnostics() {
  const s = await getSession();
  const st = await status();
  const manifest = chrome.runtime.getManifest();
  return {
    extensionVersion: manifest.version,
    userAgent: navigator.userAgent,
    routeLinks: st.config.routeLinks,
    keepLoaded: st.config.keepLoaded,
    accountIndex: st.config.accountIndex,
    sheetConfigured: !!st.config.mattersSheetId,
    docConfigured: !!st.config.missionControlDocId,
    rows: st.rows,
    hasWorkWindow: s.workWindowId != null,
    log: s.log,
  };
}

async function openAccountIndexes() {
  const tabs = await chrome.tabs.query({});
  return accountIndexesIn(tabs.map((t) => t.url || ''));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handlers = {
    status,
    focus: () => focusCore(msg.key),
    restore: () => restoreCore(msg.key),
    setWorkWindow: () => setWorkWindow(msg.windowId),
    diagnostics,
    rescan: scanAll,
    clearLog: () => setSession({ log: [] }),
    accountIndexes: openAccountIndexes,
  };
  const h = handlers[msg && msg.type];
  if (!h) return false;
  Promise.resolve(h())
    .then((r) => sendResponse({ ok: true, result: r }))
    .catch((e) => sendResponse({ ok: false, error: String(e && e.message) }));
  return true;
});

// Exposed for automated tests (service-worker evaluate) and devtools poking.
self.lvchrome = { focusCore, restoreCore, status, scanAll, setWorkWindow, diagnostics, getSession, getConfig };
