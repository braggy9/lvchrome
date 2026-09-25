import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesKey, keyForUrl, coreUrl, isUserNewTab, accountIndexesIn } from '../extension/core.js';

const cfg = { accountIndex: 1, mattersSheetId: 'SHEET_abc-123', missionControlDocId: 'DOC_xyz_789' };

test('Gmail matches only the configured account, including message URLs', () => {
  assert.ok(matchesKey('gmail', 'https://mail.google.com/mail/u/1/#inbox', cfg));
  assert.ok(matchesKey('gmail', 'https://mail.google.com/mail/u/1/#inbox/FMfcgzQXJWDsK', cfg));
  assert.ok(matchesKey('gmail', 'https://mail.google.com/mail/u/1/?ogbl#search/foo', cfg));
  assert.ok(!matchesKey('gmail', 'https://mail.google.com/mail/u/0/#inbox', cfg));
  assert.ok(!matchesKey('gmail', 'https://mail.google.com/mail/u/10/#inbox', cfg));
  assert.ok(!matchesKey('gmail', 'https://mail.google.com/mail/', cfg), 'bare /mail/ is account 0');
  assert.ok(matchesKey('gmail', 'https://mail.google.com/mail/', { ...cfg, accountIndex: 0 }));
  assert.ok(!matchesKey('gmail', 'http://mail.google.com/mail/u/1/', cfg));
  assert.ok(!matchesKey('gmail', 'https://mail.google.com.evil.test/mail/u/1/', cfg));
});

test('Calendar matches only the configured account', () => {
  assert.ok(matchesKey('calendar', 'https://calendar.google.com/calendar/u/1/r/week/2026/9/25', cfg));
  assert.ok(!matchesKey('calendar', 'https://calendar.google.com/calendar/u/0/r', cfg));
  assert.ok(matchesKey('calendar', 'https://calendar.google.com/calendar/r', { ...cfg, accountIndex: 0 }));
});

test('Sheet and Doc match by file ID, with or without /u/N/', () => {
  assert.ok(matchesKey('matters', 'https://docs.google.com/spreadsheets/d/SHEET_abc-123/edit#gid=0', cfg));
  assert.ok(matchesKey('matters', 'https://docs.google.com/spreadsheets/u/1/d/SHEET_abc-123/edit', cfg));
  assert.ok(matchesKey('matters', 'https://docs.google.com/spreadsheets/d/SHEET_abc-123', cfg));
  assert.ok(!matchesKey('matters', 'https://docs.google.com/spreadsheets/d/SHEET_abc-1234/edit', cfg));
  assert.ok(!matchesKey('matters', 'https://docs.google.com/document/d/SHEET_abc-123/edit', cfg));
  assert.ok(matchesKey('mission', 'https://docs.google.com/document/d/DOC_xyz_789/edit?tab=t.0', cfg));
  assert.ok(!matchesKey('mission', 'https://docs.google.com/document/d/OTHER/edit', cfg));
});

test('Unconfigured IDs never match', () => {
  const empty = { accountIndex: 0, mattersSheetId: '', missionControlDocId: '' };
  assert.ok(!matchesKey('matters', 'https://docs.google.com/spreadsheets/d/anything/edit', empty));
  assert.equal(coreUrl('matters', empty), null);
});

test('keyForUrl and coreUrl round-trip', () => {
  for (const key of ['gmail', 'calendar', 'matters', 'mission']) {
    assert.equal(keyForUrl(coreUrl(key, cfg), cfg), key);
  }
  assert.equal(keyForUrl('https://example.com/', cfg), null);
});

test('User-opened new tabs are recognised', () => {
  assert.ok(isUserNewTab('chrome://newtab/'));
  assert.ok(isUserNewTab('about:blank'));
  assert.ok(!isUserNewTab('https://www.google.com/url?q=x'));
  assert.ok(!isUserNewTab(''));
});

test('accountIndexesIn returns numbers only', () => {
  assert.deepEqual(
    accountIndexesIn(['https://mail.google.com/mail/u/0/#inbox', 'https://calendar.google.com/calendar/u/2/r', 'https://example.com/u/5/', 'junk']),
    [0, 2],
  );
});
