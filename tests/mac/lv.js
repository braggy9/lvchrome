// JXA helper for the Mac tests: osascript -l JavaScript lv.js <command> [arg]
// Run only via lv.sh, which calls guard.sh first (throwaway Chrome only).
//
// Privacy: prints tab *kinds* only (gmail/u0, calendar/u0, sheet, doc, other),
// never URLs, titles or page text. Page JavaScript returns only a marker,
// performance.timeOrigin, or true/false for the test draft string.
ObjC.import('Foundation');

const EXT_ID = 'dkgmkailhjljhnnfkhkcbcejdgmkplia';
const EXT = `chrome-extension://${EXT_ID}/`;
const DRAFT = 'lvchrome draft test';
const env = $.NSProcessInfo.processInfo.environment;
const MARKS = ObjC.unwrap(env.objectForKey('LV_MARKS')) || '/tmp/lvchrome-marks.json';

const Chrome = Application('Google Chrome');

function readJson(path) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
  return s.isNil() ? {} : JSON.parse(ObjC.unwrap(s));
}
function writeJson(path, obj) {
  $(JSON.stringify(obj, null, 2)).writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null);
}
const sleep = (s) => delay(s);

function classify(url) {
  let m;
  if ((m = /^https:\/\/mail\.google\.com\/mail\/(?:u\/(\d+))?/.exec(url))) {
    // Gmail appends ?compose=… to the hash while a compose box is open.
    const hash = (url.split('#')[1] || '').split('?')[0];
    const view = /\/[A-Za-z0-9]{16,}$/.test(hash) ? 'message' : 'list';
    return { kind: 'gmail', label: `gmail/u${m[1] || 0} (${view})` };
  }
  if ((m = /^https:\/\/calendar\.google\.com\/calendar\/(?:u\/(\d+))?/.exec(url))) return { kind: 'calendar', label: `calendar/u${m[1] || 0}` };
  if (/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) return { kind: 'sheet', label: 'sheet' };
  if (/^https:\/\/docs\.google\.com\/document\//.test(url)) return { kind: 'doc', label: 'doc' };
  if (url.startsWith(EXT + 'popup.html')) return { kind: 'popup', label: 'lvchrome popup page' };
  if (url.startsWith(EXT + 'options.html')) return { kind: 'options', label: 'lvchrome settings' };
  if (/^https:\/\/accounts\.google\.com\//.test(url)) return { kind: 'signin', label: 'google sign-in' };
  if ((m = /^chrome:\/\/([^/]+)/.exec(url))) return { kind: 'chrome', label: `chrome://${m[1]}` };
  if (!url || url === 'about:blank') return { kind: 'blank', label: 'blank' };
  return { kind: 'other', label: 'other site' };
}

function allTabs() {
  const out = [];
  Chrome.windows().forEach((w, wi) => {
    const active = w.activeTab().id();
    w.tabs().forEach((t, ti) => {
      const url = t.url();
      out.push({ w, t, windowId: w.id(), windowIndex: wi + 1, tabIndex: ti + 1, tabId: t.id(), active: t.id() === active, url, ...classify(url) });
    });
  });
  return out;
}
function find(kind) {
  const hits = allTabs().filter((x) => x.kind === kind);
  if (hits.length > 1) console.log(`note: ${hits.length} ${kind} tabs open; using the first`);
  return hits[0] || null;
}
function exec(tab, js) {
  return tab.execute({ javascript: js });
}
// Vertical scroll offset of the Sheets grid (a number only).
function sheetScroll(tab) {
  return String(exec(tab, `(() => { const s = document.querySelector('.native-scrollbar-y'); return s ? String(s.scrollTop) : 'n/a'; })()`));
}

// Apple Events JavaScript runs in an isolated world: it shares the page's DOM
// but not chrome.runtime. So the extension is driven the way a person would:
// by reading and clicking its popup and settings pages.
function popupTab() {
  const p = find('popup') || find('options');
  if (!p) throw new Error('lvchrome control window not open (run: lv.sh control)');
  return p;
}
function loadPage(page) {
  const p = popupTab();
  p.t.url = EXT + page;
  for (let i = 0; i < 30; i++) {
    sleep(0.2);
    try {
      if (exec(p.t, `document.readyState === 'complete' && !!document.getElementById('${page === 'popup.html' ? 'diag' : 'save'}')`)) break;
    } catch (e) {}
  }
  sleep(0.6); // let the module script render
  return p;
}
function popupRows() {
  const p = loadPage('popup.html');
  const json = exec(p.t, `JSON.stringify([...document.querySelectorAll('#rows .row')].map(r => ({ text: r.querySelector('.name').textContent, buttons: [...r.querySelectorAll('button')].map(b => b.textContent) })))`);
  return { p, rows: JSON.parse(json) };
}

const cmds = {
  // ★ = one of the marked core tabs (tab IDs from the last `mark`).
  state() {
    const core = readJson(MARKS);
    console.log(`Chrome frontmost: ${Chrome.frontmost() ? 'yes' : 'no'}`);
    Chrome.windows().forEach((w, wi) => {
      const active = w.activeTab().id();
      const tabs = w.tabs().map((t) => (t.id() === active ? '[*' : '') + (core[t.id()] ? '★' : '') + classify(t.url()).label + (t.id() === active ? ']' : ''));
      console.log(`Window ${wi + 1}${wi === 0 ? ' (front)' : ''} id=${w.id()} ${w.mode()}${w.minimized() ? ' minimised' : ''}: ${tabs.join(' | ')}`);
    });
  },

  // Put a marker in each core tab. If the page reloads, the marker is lost and
  // performance.timeOrigin changes.
  mark() {
    const marks = {};
    for (const x of allTabs().filter((x) => ['gmail', 'calendar', 'sheet', 'doc'].includes(x.kind))) {
      const m = 'lv' + Math.random().toString(36).slice(2, 10);
      const r = exec(x.t, `(window.__lvMark = window.__lvMark || '${m}') + '|' + performance.timeOrigin`);
      const [mark, origin] = String(r).split('|');
      marks[x.tabId] = { label: x.kind, mark, origin, windowId: x.windowId, scroll: x.kind === 'sheet' ? sheetScroll(x.t) : undefined };
    }
    writeJson(MARKS, marks);
    console.log(`marked: ${Object.values(marks).map((v) => v.label).join(', ') || 'nothing'}`);
  },

  // New markers and scroll baseline for the already-marked core tabs, keeping
  // their original window as the baseline (for M15).
  remark() {
    const marks = readJson(MARKS);
    const tabs = allTabs();
    for (const [id, v] of Object.entries(marks)) {
      const x = tabs.find((t) => String(t.tabId) === id);
      if (!x) continue;
      const m = 'lv' + Math.random().toString(36).slice(2, 10);
      const [mark, origin] = String(exec(x.t, `(window.__lvMark = '${m}') + '|' + performance.timeOrigin`)).split('|');
      Object.assign(v, { mark, origin, scroll: x.kind === 'sheet' ? sheetScroll(x.t) : undefined });
    }
    writeJson(MARKS, marks);
    console.log(`re-marked: ${Object.values(marks).map((v) => v.label).join(', ')}`);
  },

  check() {
    const marks = readJson(MARKS);
    const tabs = allTabs();
    for (const [id, want] of Object.entries(marks)) {
      const x = tabs.find((t) => String(t.tabId) === id);
      if (!x) { console.log(`${want.label}: tab gone (closed or replaced)`); continue; }
      let line;
      try {
        const [mark, origin] = String(exec(x.t, `(window.__lvMark || 'none') + '|' + performance.timeOrigin`)).split('|');
        line = mark === want.mark && origin === want.origin ? 'no reload' : 'RELOADED (marker lost)';
      } catch (e) {
        line = `could not check (${String(e.message).slice(0, 60)})`;
      }
      const moved = x.windowId !== want.windowId ? ' · MOVED to another window' : ' · same window';
      if (x.kind === 'sheet') {
        const now = sheetScroll(x.t);
        line += ` · scroll ${now === want.scroll ? 'unchanged' : `CHANGED`} (${want.scroll} → ${now})`;
      }
      let draft = '';
      if (x.kind === 'gmail') {
        const has = exec(x.t, `String([...document.querySelectorAll('[contenteditable="true"]')].some(e => e.innerText.includes('${DRAFT}')))`);
        draft = ` · test draft present: ${has}`;
      }
      console.log(`${x.label}: ${line}${moved}${draft}`);
    }
  },

  // A normal window holding the lvchrome popup page. Acts as "another window"
  // for the focus tests and as the way to read diagnostics.
  control() {
    let p = find('popup');
    if (!p) {
      // Right after make(), Chrome.windows[0] can still be the old front window
      // (run 2: the popup page replaced the Doc), so find the new window by id.
      const before = new Set(Chrome.windows().map((w) => w.id()));
      Chrome.Window().make();
      let w = null;
      for (let i = 0; i < 30 && !w; i++) {
        sleep(0.1);
        w = Chrome.windows().find((x) => !before.has(x.id())) || null;
      }
      if (!w) throw new Error('new window did not appear; nothing navigated');
      w.activeTab.url = EXT + 'popup.html';
      sleep(1);
      p = find('popup');
    }
    p.w.index = 1;
    Chrome.activate();
    console.log('control window in front');
  },

  // Clicks "Copy diagnostics" and prints the clipboard. The clipboard is first
  // set to a sentinel so a failed copy can't print whatever was there before.
  diag() {
    const app = Application.currentApplication();
    app.includeStandardAdditions = true;
    app.setTheClipboardTo('lv-sentinel');
    const p = loadPage('popup.html');
    p.w.index = 1;
    Chrome.activate();
    sleep(0.4);
    exec(p.t, `document.getElementById('diag').click(); 1`);
    sleep(1);
    const clip = app.theClipboard();
    if (clip === 'lv-sentinel') {
      console.log(`copy failed; popup says: ${exec(p.t, "document.getElementById('diagMsg').textContent")}`);
      return;
    }
    console.log(clip);
  },

  // The popup's row text, e.g. "Gmail open → Go".
  status() {
    popupRows().rows.forEach((r) => console.log(`${r.text} → ${r.buttons.join(', ') || '(no buttons)'}`));
  },

  // Save settings via the Settings page, taking the IDs from the open Sheet/Doc
  // tabs. IDs go straight into the form, never printed.
  config(accountIndex) {
    const idOf = (kind) => {
      const x = find(kind);
      const m = x && /\/d\/([a-zA-Z0-9_-]+)/.exec(x.url);
      return m ? m[1] : '';
    };
    const sheet = idOf('sheet');
    const doc = idOf('doc');
    const p = loadPage('options.html');
    const seen = exec(p.t, "document.getElementById('accounts').textContent");
    exec(p.t, `document.getElementById('accountIndex').value = '${Number(accountIndex) || 0}';
      document.getElementById('mattersSheetId').value = '${sheet}';
      document.getElementById('missionControlDocId').value = '${doc}';
      document.getElementById('routeLinks').checked = true;
      document.getElementById('keepLoaded').checked = true;
      document.getElementById('save').click(); 1`);
    sleep(0.8);
    const msg = exec(p.t, "document.getElementById('msg').textContent");
    console.log(`settings page says: "${seen}"`);
    console.log(`save: "${msg}" · account /u/${Number(accountIndex) || 0} · sheet id ${sheet ? 'set' : 'MISSING'} · doc id ${doc ? 'set' : 'MISSING'}`);
    loadPage('popup.html');
  },

  // Click "Restore" on a row of the popup (label e.g. "Mission Control Doc").
  restore(label) {
    const p = loadPage('popup.html');
    const r = exec(p.t, `(() => { const row = [...document.querySelectorAll('#rows .row')].find(r => r.querySelector('.name').textContent.startsWith(${JSON.stringify(label)}));
      const b = row && [...row.querySelectorAll('button')].find(b => b.textContent === 'Restore');
      if (!b) return 'no Restore button'; b.click(); return 'clicked Restore'; })()`);
    console.log(r);
  },

  // Click "Go" on a row of the popup.
  go(label) {
    const p = loadPage('popup.html');
    const r = exec(p.t, `(() => { const row = [...document.querySelectorAll('#rows .row')].find(r => r.querySelector('.name').textContent.startsWith(${JSON.stringify(label)}));
      const b = row && [...row.querySelectorAll('button')].find(b => b.textContent === 'Go');
      if (!b) return 'no Go button'; b.click(); return 'clicked Go'; })()`);
    console.log(r);
  },

  // Same-tab navigation for M14: send the given core tab to another site.
  navaway(kind) {
    const x = find(kind);
    x.t.url = 'https://example.com/';
    console.log(`${kind} tab navigated to example.com in the same tab`);
  },

  close(kind) {
    const x = find(kind);
    Chrome.windows.byId(x.windowId).tabs.byId(x.tabId).close();
    console.log(`${kind} tab closed`);
  },

  // Bring a specific window forward (e.g. to press a shortcut "from" it).
  front(kind) {
    const x = find(kind);
    x.w.index = 1;
    Chrome.activate();
    console.log(`window holding ${kind} in front`);
  },
};

function run(argv) {
  const [cmd, arg] = argv;
  if (!cmds[cmd]) return `commands: ${Object.keys(cmds).join(' ')}`;
  cmds[cmd](arg);
}
