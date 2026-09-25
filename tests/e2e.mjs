// Automated smoke test in Linux Chromium (Playwright + xvfb), with Google pages
// replaced by local fakes. This checks the extension's logic; it is NOT a Mac
// test and says nothing about Spaces, sleep/wake or real Gmail behaviour.
//
//   npm run e2e
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const root = execSync('npm root -g').toString().trim();
    return createRequire(path.join(root, 'noop.js'))('playwright');
  }
}

const { chromium } = await loadPlaywright();
const EXT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../extension');
const profile = mkdtempSync(path.join(tmpdir(), 'lvchrome-e2e-'));

const CFG = { accountIndex: 1, mattersSheetId: 'SHEET1', missionControlDocId: 'DOC1', routeLinks: true, keepLoaded: true };
const URLS = {
  gmail: 'https://mail.google.com/mail/u/1/#inbox',
  calendar: 'https://calendar.google.com/calendar/u/1/r',
  matters: 'https://docs.google.com/spreadsheets/d/SHEET1/edit',
  mission: 'https://docs.google.com/document/d/DOC1/edit',
  personalGmail: 'https://mail.google.com/mail/u/0/#inbox',
  habitat: 'https://habitat.example.test/',
  other: 'https://other.example.test/',
};

const FAKE = `<!doctype html><title>fake</title>
<textarea id="draft"></textarea>
<a id="ext" target="_blank" href="https://links.example.test/opened">new-tab link</a>
<a id="same" href="https://links.example.test/away">same-tab link</a>`;

const results = [];
function record(id, name, pass, note = '') {
  results.push({ id, name, result: pass ? 'pass' : 'fail', note });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${name}${note ? '  — ' + note : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 5000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(100);
  }
  return fn();
}

const ctx = await chromium.launchPersistentContext(profile, {
  headless: false,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});

try {
  await ctx.route(/^https:\/\/[^/]*\.(google\.com|example\.test)\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: FAKE }),
  );

  let sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'));
  const extId = new URL(sw.url()).host;
  let restarts = 0;
  // MV3 service workers can be stopped by Chrome at any time. If ours goes,
  // wake it by opening an extension page and carry on: state must survive.
  async function wake() {
    restarts++;
    const waiter = ctx.waitForEvent('serviceworker', { timeout: 10000 });
    const p = await ctx.newPage();
    await p.goto(`chrome-extension://${extId}/popup.html`);
    sw = ctx.serviceWorkers()[0] || (await waiter);
    await p.close();
  }
  const ev = async (fn, arg) => {
    try {
      return await sw.evaluate(fn, arg);
    } catch (e) {
      if (!/closed/.test(String(e))) throw e;
      await wake();
      return sw.evaluate(fn, arg);
    }
  };

  await ev((cfg) => chrome.storage.local.set({ config: cfg }), CFG);

  // Tabs are created blank by the extension API (so window placement is exact),
  // then navigated by Playwright so its request routing applies to them.
  const blank = (k) => `about:blank#${k}`;
  // Window A: the four core tabs plus a personal-account Gmail tab.
  const winA = await ev(async () => {
    const w = await chrome.windows.create({ url: 'about:blank#gmail', type: 'normal' });
    for (const k of ['calendar', 'matters', 'mission', 'personalGmail']) await chrome.tabs.create({ windowId: w.id, url: `about:blank#${k}` });
    return w.id;
  });
  // Window B: stands in for Habitat. Window C: some other window, focused last.
  const winB = await ev(() => chrome.windows.create({ url: 'about:blank#habitat', type: 'normal' }).then((w) => w.id));
  const winC = await ev(() => chrome.windows.create({ url: 'about:blank#other', type: 'normal', focused: true }).then((w) => w.id));

  const pageFor = (url) => waitFor(() => ctx.pages().find((p) => p.url().toLowerCase() === url.toLowerCase()));
  const pages = {};
  for (const k of Object.keys(URLS)) {
    pages[k] = await pageFor(blank(k));
    if (!pages[k]) throw new Error(`blank page for ${k} not found: ${ctx.pages().map((p) => p.url())}`);
    await pages[k].goto(URLS[k]);
  }

  const status = () => ev(() => self.lvchrome.status());
  const session = () => ev(() => self.lvchrome.getSession());
  const tabOf = (id) => ev((i) => chrome.tabs.get(i), id);

  const allLive = await waitFor(async () => {
    const s = await status();
    return ['gmail', 'calendar', 'matters', 'mission'].every((k) => s.rows[k].state === 'live') && s;
  });
  record('A0', 'All four core tabs detected and bound', !!allLive);

  // Mark each core page and type a Gmail "draft", to detect reloads/disruption.
  for (const k of ['gmail', 'calendar', 'matters', 'mission']) await pages[k].evaluate((k) => (window.__marker = k), k);
  await pages.gmail.fill('#draft', 'half-written reply');

  const s0 = await session();
  const personalTab = (await ev(() => chrome.tabs.query({}))).find((t) => t.url === URLS.personalGmail);
  record('A1', 'Personal-account Gmail (/u/0) is not bound when work is /u/1', s0.bindings.gmail !== personalTab.id);

  const protectedAll = (await Promise.all(Object.values(s0.bindings).map(tabOf))).every((t) => t.autoDiscardable === false);
  record('A2', 'Core tabs marked autoDiscardable:false', protectedAll);

  // Focus each core tab from window C; check it becomes active and did not reload.
  let focusOk = true;
  let notes = [];
  for (const k of ['gmail', 'calendar', 'matters', 'mission']) {
    await ev((w) => chrome.windows.update(w, { focused: true }), winC);
    const r = await ev((k) => self.lvchrome.focusCore(k), k);
    const t = await tabOf(s0.bindings[k]);
    const marker = await pages[k].evaluate(() => window.__marker);
    const ok = r.action === 'focused' && t.active && marker === k;
    if (!ok) notes.push(`${k}: action=${r.action} active=${t.active} marker=${marker}`);
    focusOk &&= ok;
  }
  record('A3', 'focusCore activates each core tab without reloading it', focusOk, notes.join('; '));
  const lastFocused = await ev(() => chrome.windows.getLastFocused().then((w) => w.id));
  record('A4', 'Core tab window reported as focused (xvfb, no window manager)', lastFocused === winA, `lastFocused=${lastFocused === winA ? 'A' : lastFocused === winC ? 'C' : lastFocused}`);

  // Gmail message URL (hash change) stays "live" and is remembered for restore.
  await pages.gmail.evaluate(() => (location.hash = '#inbox/FMfcgMSG123'));
  const liveAfterHash = await waitFor(async () => (await status()).rows.gmail.state === 'live' && (await session()).lastCore.gmail.endsWith('#inbox/FMfcgMSG123'));
  record('A5', 'Gmail message URL keeps the tab bound and live', !!liveAfterHash);

  // Link routing: new-tab link from Gmail → work window.
  await pages.gmail.click('#ext');
  const routed = await waitFor(async () => {
    const s = await session();
    if (s.workWindowId == null) return null;
    const tabs = await ev((w) => chrome.tabs.query({ windowId: w }), s.workWindowId);
    return tabs.some((t) => (t.url || t.pendingUrl || '').startsWith('https://links.example.test/opened')) && s;
  });
  record('B1', 'New-tab link from Gmail lands in a separate work window', !!routed && routed.workWindowId !== winA);

  const gmailTab = await tabOf(s0.bindings.gmail);
  const draft = await pages.gmail.inputValue('#draft');
  const marker = await pages.gmail.evaluate(() => window.__marker);
  record('B2', 'Gmail core tab unchanged after routing (same window, URL, no reload, draft kept)',
    gmailTab.windowId === winA && gmailTab.url.endsWith('#inbox/FMfcgMSG123') && marker === 'gmail' && draft === 'half-written reply');

  // Second link from another core tab reuses the same work window.
  const windowsBefore = await ev(() => chrome.windows.getAll({ windowTypes: ['normal'] }).then((ws) => ws.length));
  await pages.mission.click('#ext');
  const reused = await waitFor(async () => {
    const tabs = await ev((w) => chrome.tabs.query({ windowId: w }), routed.workWindowId);
    return tabs.filter((t) => (t.url || t.pendingUrl || '').startsWith('https://links.example.test/opened')).length === 2;
  });
  const windowsNow = await ev(() => chrome.windows.getAll({ windowTypes: ['normal'] }).then((ws) => ws.length));
  record('B3', 'Link from Mission Control Doc reuses the same work window', !!reused && windowsNow === windowsBefore, `normal windows before=${windowsBefore} after=${windowsNow}`);

  // Habitat stand-in: its links are left alone.
  await pages.habitat.click('#ext');
  await sleep(800);
  const habitatTabs = await ev((w) => chrome.tabs.query({ windowId: w }), winB);
  record('B4', 'Link opened from Habitat window is not routed', habitatTabs.length === 2);

  // Gmail pop-out style window.open → popup window stays put.
  await pages.gmail.evaluate(() => window.open('https://links.example.test/popout', 'po', 'popup,width=400,height=400'));
  await sleep(800);
  const popups = await ev(() => chrome.windows.getAll({ populate: true, windowTypes: ['popup'] }).then((ws) => ws.length));
  record('B5', 'Popup windows opened from Gmail are not moved', popups === 1);

  // Cmd+T-style new tab with a core opener stays put.
  const nt = await ev(([id, w]) => chrome.tabs.create({ windowId: w, openerTabId: id, url: 'chrome://newtab/' }).then((t) => t.id), [s0.bindings.gmail, winA]);
  await sleep(800);
  record('B6', 'User-opened new tab next to a core tab is not moved', (await tabOf(nt)).windowId === winA);
  await ev((id) => chrome.tabs.remove(id), nt);

  // Same-tab navigation: detected, badge shown, restore returns to the message URL.
  await pages.gmail.click('#same');
  const drifted = await waitFor(async () => (await status()).rows.gmail.state === 'drifted');
  const badge = await ev(() => chrome.action.getBadgeText({}));
  record('C1', 'Same-tab navigation away from Gmail is detected (badge "!")', !!drifted && badge === '!');
  await ev(() => self.lvchrome.restoreCore('gmail'));
  const restored = await waitFor(async () => (await tabOf(s0.bindings.gmail)).url.endsWith('#inbox/FMfcgMSG123') && (await status()).rows.gmail.state === 'live');
  record('C2', 'Restore returns Gmail to the last core URL (message view) and clears the badge',
    !!restored && (await ev(() => chrome.action.getBadgeText({}))) === '');

  // Missing core tab: reopened, not in the work window.
  await ev((id) => chrome.tabs.remove(id), s0.bindings.calendar);
  await waitFor(async () => (await status()).rows.calendar.state === 'missing');
  const reopened = await ev(() => self.lvchrome.focusCore('calendar'));
  const s1 = await session();
  const calTab = await tabOf(s1.bindings.calendar);
  record('D2', 'Closed Calendar tab is reopened on Go, outside the work window',
    reopened.action === 'opened' && calTab.windowId !== s1.workWindowId && (calTab.url || calTab.pendingUrl || '').includes('/calendar/u/1/'));

  // Diagnostics never contain URLs.
  const diag = JSON.stringify(await ev(() => self.lvchrome.diagnostics()));
  record('E1', 'Diagnostics contain no URLs', !/https?:\/\//.test(diag));

  // Unconfigured Sheet: clearing its ID means it is never matched or opened.
  await ev((cfg) => chrome.storage.local.set({ config: { ...cfg, mattersSheetId: '' } }), CFG);
  const unconf = await waitFor(async () => (await status()).rows.matters.state === 'unconfigured');
  record('E2', 'Clearing the Sheet ID unbinds it and marks it "not set up"', !!unconf);
  // Popup and settings pages render without script errors.
  for (const [id, file, sel, n] of [['E3', 'popup.html', '#rows .row', 4], ['E4', 'options.html', '#accounts', 1]]) {
    const pg = await ctx.newPage();
    const errors = [];
    pg.on('pageerror', (e) => errors.push(String(e)));
    await pg.goto(`chrome-extension://${extId}/${file}`);
    const ok = await waitFor(async () => (await pg.locator(sel).count()) >= n && (sel !== '#accounts' || (await pg.locator(sel).innerText()).length > 0));
    const extra = file === 'options.html' ? ` accounts text: "${await pg.locator('#accounts').innerText()}"` : '';
    record(id, `${file} renders without script errors`, !!ok && errors.length === 0, errors.join('; ') + extra);
    await pg.close();
  }

  // Manually discarded tab. Kept last: in this harness, discarding a tab that
  // Playwright is attached to closes the whole browser, so it can't be
  // checked here. Real-world discard behaviour is a Mac test (Memory Saver).
  let d1Done = false;
  ctx.once('close', () => {
    if (!d1Done) {
      results.push({ id: 'D1', name: 'Focusing a discarded tab', result: 'untested', note: 'browser closed on tabs.discard (harness limitation)' });
      console.log('UNTESTED  D1  Focusing a discarded tab — browser closed on tabs.discard (harness limitation)');
    }
  });
  try {
    await ev((id) => chrome.tabs.discard(id), s0.bindings.matters);
    const disc = await ev(() => self.lvchrome.focusCore('matters'));
    d1Done = true;
    record('D1', 'Focusing an unloaded (discarded) tab works and is reported as reloading', disc.action === 'focused' && disc.wasDiscarded === true);
  } catch {
    // handled by the close listener
  }
  console.log(`service-worker restarts during run: ${restarts}`);
} catch (e) {
  record('X', 'Unexpected error', false, String(e && e.stack || e).slice(0, 400));
} finally {
  await ctx.close();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}

const failed = results.filter((r) => r.result === 'fail');
const passed = results.filter((r) => r.result === 'pass').length;
const untested = results.length - passed - failed.length;
console.log(`\n${passed} passed, ${failed.length} failed, ${untested} untested`);
process.exit(failed.length ? 1 : 0);
