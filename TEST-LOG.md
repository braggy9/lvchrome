# Test log

Two kinds of result, kept apart on purpose:

- **Mac results** come from the real Mac: either Tom by hand or a Claude Code session running **on** the Mac. Each row says who checked it. Default is `untested`.
- **Automated results** come from `npm run e2e`: Chromium with **fake** Google pages. They check the extension's logic. They say nothing about macOS Spaces, sleep/wake, Memory Saver or real Gmail.

## Mac results

**Run 1: 2026-09-28**, about 10:40–11:45 AEST. macOS 27.0 (Apple silicon, Kandji-managed) · Chrome 154.0.8037.58 · lvchrome 0.1.0 · **throwaway profile**: a separate Chrome folder, signed in to the work Google account only, with sync declined. Memory Saver was off at first and turned on partway through (see M5). Steps for each ID are in `README.md` → *Mac test script*. How the checks were done is under *Method* below.

"Claude" means checked by script on the Mac. "Tom" means Tom looked or reported.

| ID | Area | Test | Result | Checked by | Notes |
|---|---|---|---|---|---|
| M0 | Setup | Unpacked extension loads (Developer mode available, no blocking policy) | **pass** | Tom (Developer mode on), Claude (loads and works) | Loaded unpacked, and all four core tabs were bound. The red "Errors" button wasn't explicitly checked. After work sign-in, Workspace policy force-installed 4 extensions into the profile, but none of them blocked lvchrome. |
| M1 | Setup | Shortcuts Option+Shift+1–4 bound (none blank in chrome://extensions/shortcuts) | **fail** (workaround works) | Claude, Tom | Chrome **did not assign** the manifest's suggested shortcuts: there were no lvchrome entries in the profile's registered commands, key presses did nothing, and nothing was logged. Tom set them by hand in `chrome://extensions/shortcuts`, and they then registered and worked. **Cause unknown.** Tom's choices: 3 = Doc, 4 = Sheet, plus Option+Shift+0 for the popup. |
| M2 | Focus | Each shortcut focuses its tab from another window on the same Space | **pass for 1, 3, 4**; 2 not cleanly isolated | Claude | With the shortcuts set by hand, each key brought the core window forward with the right tab active, and nothing reloaded. Option+Shift+2 worked (M3, M9) but was never pressed cleanly from *another* window. The popup's **Go** worked for all four from another window. |
| M3 | Spaces | Each shortcut focuses its tab when its window is on a different Space | **pass for 1, 3, 4**; 2 not cleanly isolated | Tom (how), Claude (which tab) | With the core window on Desktop 2, pressing a shortcut on Desktop 1 **slid the screen to Desktop 2**, with the right tab active and no reload. Clean runs for 1, 3 and 4. Calendar was focused during this block (01:08:34) but isn't recorded as a clean run. **Narrowed from pass 2026-09-28 (Tom, PR review).** |
| M4 | Reload | Focused tabs don't reload (scroll position and half-typed text kept) | **pass** | Claude | Across every focus and routing step: no core tab lost its in-page marker or changed `performance.timeOrigin`, the Sheet stayed at scroll offset 550, and the Gmail compose text was still present. The Doc reloaded only when M14's Restore sent it back, which is expected. |
| M5 | Memory Saver | M3–M4 with Memory Saver on, after 30+ min idle | untested | | Memory Saver confirmed on in the throwaway profile (`high_efficiency_mode.state: 2`). The 30-minute idle wasn't run, because Tom needed Chrome back. Whether it's managed by work policy is unknown. |
| M6 | Sleep/wake | After sleep/wake, all four found and focused without reload | untested | | |
| M7 | Gmail URLs | Open a message, switch away, shortcut back: same message still open | untested | | At check time, Gmail's address showed the inbox with compose open, not a message. |
| M8 | Accounts | Personal-account Gmail/Calendar never picked | untested | | Work account only in the throwaway profile (Tom's choice). Automated check A1 covers the logic. |
| M9 | Missing | Close Calendar, press its shortcut: reopens in a normal window | **pass, with an anomaly** | Claude | Reopened in the core window (normal, not the work window) and bound. But **two** Calendar tabs appeared, and only one "opened" was logged. A possible cause is a doubled command combined with log writes overwriting each other. 0.1.1 guards against both; not yet re-tested. |
| M10 | Habitat | Habitat tabs and windows untouched throughout | untested | | Not confirmed that Habitat was open in the throwaway profile. For context: **Habitat Connect** is a force-installed work extension. The log shows lvchrome acted only on core tabs and tabs opened from them. |
| M11 | Routing | Link clicked in an email opens in the work window | **inconsistent** | Claude, Tom | Round 3: routed to the work window ("routed gmail"). Round 2: Tom clicked an email link and **nothing was logged**, neither routed nor failed. 0.1.0 doesn't log why it skips a tab; 0.1.1 does. |
| M12 | Routing | Same from Calendar (event link), Sheet and Doc | **Calendar pass; Sheet and Doc unconfirmed** | Claude, Tom | The Calendar link created the work window. Nothing was logged for the Sheet and Doc links, and no leftover tabs remained to check. Tom reported "all worked fine", so the log and Tom's report disagree. Needs a retest on 0.1.1. |
| M13 | Drafts | Half-typed Gmail draft survives M11–M12 | **pass** | Claude | Compose text still present after all routing and focus steps. |
| M14 | Same-tab | A core tab navigated away shows "!" badge; Restore brings it back | **partial** | Claude, Tom | Drift detected and logged, the popup showed "navigated away" with **Restore**, and Restore brought the Doc back. Tom **didn't see the "!"**; lvchrome was probably not pinned. The badge itself is unconfirmed. |
| M15 | Core tabs | No core tab replaced or closed by routing | **pass** | Claude | Gmail, Sheet and Doc stayed in their original window throughout. Calendar was back in the same window after M9. No routed tab replaced a core tab. |
| M16 | Feel | Cmd+click jumping to the work window: acceptable or annoying? | **acceptable** | Tom | Tom: "all worked fine" (answered alongside other round-2 questions). |

### Diagnostics excerpts (run 1, no URLs)

After setup (Copy diagnostics, trimmed):

```json
{ "extensionVersion": "0.1.0", "routeLinks": true, "keepLoaded": true, "accountIndex": 0,
  "sheetConfigured": true, "docConfigured": true,
  "rows": { "gmail":    { "state": "live", "inWorkWindow": false, "autoDiscardable": false },
            "calendar": { "state": "live", "inWorkWindow": false, "autoDiscardable": false },
            "matters":  { "state": "live", "inWorkWindow": false, "autoDiscardable": false },
            "mission":  { "state": "live", "inWorkWindow": false, "autoDiscardable": false } },
  "hasWorkWindow": false }
```

Event log (UTC). Setup, the Go clicks and M14 are omitted; the shortcut presses before M1's manual fix produced **no entries**:

```
01:05:32 work-window-created          ← round 2 link clicks (Gmail, Calendar, Sheet, Doc): only one routed entry
01:05:32 routed calendar
01:08:34 focused calendar (live)      ← M3 shortcuts from Desktop 1
01:08:44 focused mission (live)
01:08:55 focused matters (live)
01:14:24 focused gmail (live)
01:14:37 focused calendar (live)
01:41:51 drifted mission              ← M14 badge check
01:43:24 routed gmail                 ← round 3 email link
01:44:22 core-tab-closed calendar     ← M9
01:44:26 bound calendar
01:44:26 opened calendar              ← two Calendar tabs appeared; one "opened"
```

### Method (run 1)

- **Throwaway Chrome:** Tom quit his normal Chrome. `tests/mac/launch.sh` started Chrome on its own folder (`~/Code/lvchrome-throwaway-profile`), with no debug or extension-loading switches. `tests/mac/guard.sh` stops every script unless that is the only Chrome running, so no script can reach the live profile.
- **State:** AppleScript (`tests/mac/lv.js`) reads windows and tabs and prints tab *kinds* only (gmail/u0, sheet, doc, other). It never prints URLs, titles or page text.
- **No-reload check:** "Allow JavaScript from Apple Events" was on in the throwaway profile only. A random marker plus `performance.timeOrigin` was stored in each core tab, and a reload loses both. The draft check returns only true or false for the test string. The Sheet check reads a scroll number only.
- **Shortcuts:** System Events keystrokes (Accessibility granted to Claude), sent only after checking that Chrome is the frontmost app.
- **Extension state:** by reading and clicking the extension's own popup and Settings pages. AppleScript JavaScript runs in an isolated world without `chrome.runtime`. Copy diagnostics was read from the clipboard.
- **No screenshots** were taken by Claude.

---

**Run 2: 2026-09-29**, about 10:04–10:19 AEST. Same Mac, macOS 27.0 · Chrome 154.0.8037.58 · **lvchrome 0.1.1** (Reload on the card; it loads from `~/Code/lvchrome/extension`) · same throwaway profile, work account only · Memory Saver on (`high_efficiency_mode.state: 2`). Only the tests below were run; Tom stopped early, so M5 and M6 are still open. Rows not listed keep their run 1 result.

| ID | Test | Result | Checked by | Notes |
|---|---|---|---|---|
| M0 | Extension loads, no red "Errors" button | **pass** | Tom (Reload, card shows 0.1.1), Claude (Errors button) | Read from the `chrome://extensions` page: lvchrome card present, Developer mode on, **no Errors button** on the card. The red text Tom saw was the popup's "not open — Go will open it" rows, not the Errors button. The selector (`#errors-button`) is assumed from Chrome's page structure; the card's `#dev-reload-button` was found the same way, so the naming looks current, but it is not otherwise verified on 154. |
| M1 | Shortcuts bound | **fail** (manual workaround still holds) | Claude | Unchanged from run 1's manual setup: Option+Shift+1 Gmail, 2 Calendar, 3 Mission Control Doc, 4 Matters Sheet, 0 popup. Read from the profile's registered commands (`Preferences` → `extensions.commands`), not from the `chrome://extensions/shortcuts` page. |
| M3 | Option+Shift+2 across Spaces | **pass** | Tom (how), Claude (which tab) | Core window on Desktop 2, Option+Shift+2 pressed from the control window on Desktop 1: Tom saw the screen **jump across to Desktop 2**. Log: `shortcut calendar` → `focused calendar (live)`. Calendar was the active tab in the core window, and no core tab reloaded. With run 1, all four shortcuts now pass M3. |
| M5 | Memory Saver, 30+ min idle | untested | | Not run (time). |
| M6 | Sleep/wake | untested | | Not run (time). |
| M7 | Open email survives switch away + Option+Shift+1 | **pass** | Tom (opened the email), Claude | From the control window, Option+Shift+1 focused Gmail (`shortcut gmail` → `focused gmail (live)`), no reload. An open message was on the page before and after (true/false DOM check), and the Gmail address was identical before and after (compared as a fingerprint, never printed). The helper's own label said "list": see finding 4. |
| M9 | Close Calendar, Option+Shift+2 reopens it | **pass** | Claude | Exactly **one** Calendar tab reopened, in the core window, with one `shortcut calendar` and one `opened calendar`. Run 1's doubled tab did not recur. Gmail, Sheet and Doc did not reload. Also seen: the Doc, closed by a test-helper mishap (finding 1), was reopened in the core window by Option+Shift+3. |
| M11 | Link in an email opens in the work window | **pass** (one link) | Tom (clicked), Claude (log, windows) | `work-window-created` + `routed gmail`. The new tab was in a separate work window. Gmail didn't reload or move. No half-typed draft this run, so the M13 part wasn't retested. |
| M12 | Links from Calendar, Sheet, Doc go to the same work window | **Sheet pass; Calendar not routed (Habitat link); Doc untested** | Tom (clicked), Claude (log, windows) | Sheet: `routed matters`, into the same work window as M11. Calendar: Tom clicked a link **to Habitat**. lvchrome logged nothing (not `routed`, `not-routed` or `new-tab-no-opener`) and no new tab appeared in any Chrome window the helper could see. Where the link went, if anywhere, wasn't checked; a force-installed work extension (e.g. Habitat Connect) handling it is a guess, not verified. Leaving Habitat links alone fits the spec. Doc: not clicked (Tom's call, time). |
| M14 | Same-tab navigation away → "!" and Restore | **partial** (incidental) | Claude | Not run as a test. The test helper navigated the Doc tab to the popup page (finding 1): lvchrome logged `drifted mission` and the popup showed "navigated away → Restore, Go". Restore was sent (`restored mission`), but the popup page was running in that same tab and closed it (finding 2). Badge not checked (no screenshots). |
| M15 | Core tabs stay in their window | **pass** | Claude | Across M9, M11, M12 and M7, all four core tabs stayed in the core window. Routed tabs went only to the work window. Every no-reload check passed, and the Sheet's scroll offset was unchanged (it was at 0, so this says little about scroll). |

### Findings (run 2)

1. **Test-helper bug, fixed:** `lv.sh control` made a new window, then set the URL of `Chrome.windows[0]`'s active tab, which was still the **old** front window. The Doc tab became the popup page. `tests/mac/lv.js` now finds the new window by id and navigates nothing if it doesn't appear.
2. **The popup closes itself after Go or Restore** (`popup.js` calls `window.close()`). In a real popup that's right. When the popup page runs in a tab, as the helpers use it, the tab closes too. So `lv.sh go` and `lv.sh restore` close the control tab (run `lv.sh control` again), and Restore on a tab that *is* the popup page closes that tab.
3. **Log noise:** when lvchrome opens a core tab itself (Go, or a shortcut for a missing tab), 0.1.1 also logs `new-tab-no-opener (in a core-tab window)`. That was 5 of 30 entries this run.
4. **The helper's Gmail view label is unreliable.** An open email whose address had the form `#inbox?…` was labelled "list", because `lv.js` only recognises a message by an ID at the end of the hash. Run 1's M7 note ("inbox with compose open") may be the same misreading.
5. **Tabs weren't restored** when the throwaway Chrome started. Tom reopened the four core tabs with the popup's Go (the `opened` entries at 00:05).

### Diagnostics excerpt (run 2, no URLs)

Row states at the end: all four `live`, none in the work window, all `autoDiscardable: false`; `hasWorkWindow: true`. Event log (UTC):

```
00:05:45 bound/opened gmail            ← Tom reopens the four core tabs via Go
00:05:47 bound/opened calendar           (each also logs new-tab-no-opener: finding 3)
00:05:54 bound/opened matters
00:05:57 bound/opened mission
00:08:11 drifted mission               ← helper bug put the popup page in the Doc tab (finding 1)
00:08:51 restored mission
00:08:51 core-tab-closed mission       ← popup page closed its own tab (finding 2)
00:09:32 shortcut mission              ← Option+Shift+3 from the core window
00:09:32 bound/opened mission
00:10:34 core-tab-closed calendar      ← M9
00:10:36 shortcut calendar
00:10:36 bound/opened calendar           one tab, one "opened"
00:12:04 work-window-created           ← M11 email link
00:12:04 routed gmail
00:12:24 routed matters                ← M12 Sheet link (Calendar → Habitat link: nothing logged)
00:14:21 shortcut gmail                ← M7
00:14:21 focused gmail (live)
00:14:52 shortcut gmail                ← M7 repeated with the open-message check
00:14:52 focused gmail (live)
00:18:35 shortcut calendar             ← M3, from Desktop 1 (core window on Desktop 2)
00:18:36 focused calendar (live)
```

### Method (run 2)

As run 1, plus:

- **Errors button (M0):** Apple Events JavaScript on the `chrome://extensions` tab, returning only whether the lvchrome card, its reload button and an Errors button exist.
- **Shortcuts:** read from the throwaway profile's `Preferences` file (command names and keys only).
- **M7:** a true/false check for an open message on the Gmail page, and an FNV-1a fingerprint of the Gmail address compared before and after the shortcut. The address itself was never printed.
- **Diagnostics** were read after each step with `lv.sh diag` and filtered by time. No screenshots.

## Automated (macOS)

**untested.** Node isn't installed on this work Mac, and Tom chose not to install it (no `npm test`, no `npm run e2e:mac`). An attempt to run the unit tests under macOS's built-in JavaScriptCore was dropped: it has no `URL` API, so 5 of 7 tests failed for reasons unrelated to lvchrome. JavaScriptCore was used only to syntax-check the 0.1.1 changes.

## Automated results (Linux Chromium, fake pages)

Last run: 2026-09-28, lvchrome 0.1.1, Playwright 1.56.1 bundled Chromium. **19 passed, 0 failed, 1 untested.**

| ID | Check | Result |
|---|---|---|
| A0 | All four core tabs detected and bound | pass |
| A1 | Personal-account Gmail (/u/0) not bound when work is /u/1 | pass |
| A2 | Core tabs marked `autoDiscardable: false` | pass |
| A3 | Focus activates each core tab without reloading it | pass |
| A4 | Core tab's window reported as focused | pass (xvfb, no window manager) |
| A5 | Gmail message URL keeps tab bound and live | pass |
| B1 | New-tab link from Gmail lands in a separate work window | pass |
| B2 | Gmail tab unchanged after routing: window, URL, no reload, draft text kept | pass |
| B3 | Link from Doc reuses the same work window | pass |
| B4 | Link from Habitat stand-in window not routed | pass |
| B5 | Popup windows opened from Gmail (pop-out style) not moved | pass |
| B6 | Cmd+T-style new tab next to a core tab not moved | pass |
| C1 | Same-tab navigation away detected, badge "!" | pass |
| C2 | Restore returns to the last core URL (the message view), badge cleared | pass |
| D1 | Focusing a discarded tab | **untested**: in this harness, discarding a tab closes the whole browser. Covered by M5 on the Mac. |
| D2 | Closed Calendar reopened on Go, outside the work window | pass |
| E1 | Diagnostics contain no URLs | pass |
| E2 | Clearing the Sheet ID unbinds it | pass |
| E3 | Popup renders without script errors | pass |
| E4 | Settings page renders without script errors | pass |

The service worker was stopped and restarted once during the run (normal MV3 behaviour). Later checks still passed, so state survives a restart.
