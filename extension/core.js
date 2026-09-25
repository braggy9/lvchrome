// Pure matching logic, shared by the service worker and the Node tests.
// No chrome.* calls in this file.

export const CORE_KEYS = ['gmail', 'calendar', 'matters', 'mission'];

export const CORE_LABELS = {
  gmail: 'Gmail',
  calendar: 'Calendar',
  matters: 'Matters Sheet',
  mission: 'Mission Control Doc',
};

export const DEFAULT_CONFIG = {
  accountIndex: 0,
  mattersSheetId: '',
  missionControlDocId: '',
  routeLinks: true,
  keepLoaded: true,
};

function parse(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Google puts the signed-in account in the path as /u/N/. Account 0 can also
// appear with no /u/ segment at all (e.g. mail.google.com/mail/).
function accountMatches(pathname, prefix, accountIndex) {
  const withIndex = new RegExp(`^${prefix}/u/(\\d+)(/|$)`).exec(pathname);
  if (withIndex) return Number(withIndex[1]) === Number(accountIndex);
  return Number(accountIndex) === 0 && new RegExp(`^${prefix}(/|$)`).test(pathname);
}

function docMatches(u, kind, id) {
  if (!id || u.hostname !== 'docs.google.com') return false;
  return new RegExp(`^/${kind}/(u/\\d+/)?d/${escapeRegExp(id)}(/|$)`).test(u.pathname);
}

export function matchesKey(key, url, config) {
  const u = parse(url);
  if (!u || u.protocol !== 'https:') return false;
  switch (key) {
    case 'gmail':
      return u.hostname === 'mail.google.com' && accountMatches(u.pathname, '/mail', config.accountIndex);
    case 'calendar':
      return u.hostname === 'calendar.google.com' && accountMatches(u.pathname, '/calendar', config.accountIndex);
    case 'matters':
      return docMatches(u, 'spreadsheets', config.mattersSheetId);
    case 'mission':
      return docMatches(u, 'document', config.missionControlDocId);
    default:
      return false;
  }
}

export function keyForUrl(url, config) {
  return CORE_KEYS.find((k) => matchesKey(k, url, config)) ?? null;
}

// URL used when a core tab is missing and has to be opened fresh.
export function coreUrl(key, config) {
  const n = Number(config.accountIndex) || 0;
  switch (key) {
    case 'gmail':
      return `https://mail.google.com/mail/u/${n}/#inbox`;
    case 'calendar':
      return `https://calendar.google.com/calendar/u/${n}/r`;
    case 'matters':
      return config.mattersSheetId ? `https://docs.google.com/spreadsheets/d/${config.mattersSheetId}/edit` : null;
    case 'mission':
      return config.missionControlDocId ? `https://docs.google.com/document/d/${config.missionControlDocId}/edit` : null;
    default:
      return null;
  }
}

// Tabs that should never be routed: blank/new-tab pages the user opened
// themselves (e.g. Cmd+T while a core tab was active).
export function isUserNewTab(url) {
  if (!url) return false;
  return /^(chrome|edge|about):\/\/?(newtab|blank)/.test(url) || url === 'about:blank' || url.startsWith('chrome://new-tab-page');
}

// Which Google account indexes are visible in a set of URLs. Used by the
// options page to help pick the work account; returns numbers only, never URLs.
export function accountIndexesIn(urls) {
  const found = new Set();
  for (const url of urls) {
    const u = parse(url);
    if (!u) continue;
    if (u.hostname !== 'mail.google.com' && u.hostname !== 'calendar.google.com') continue;
    const m = /^\/(mail|calendar)\/u\/(\d+)(\/|$)/.exec(u.pathname);
    if (m) found.add(Number(m[2]));
  }
  return [...found].sort((a, b) => a - b);
}
