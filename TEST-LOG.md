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
| M3 | Spaces | Each shortcut focuses its tab when its window is on a different Space | **pass** | Tom (how), Claude (which tab) | With the core window on Desktop 2, pressing a shortcut on Desktop 1 **slid the screen to Desktop 2**, with the right tab active and no reload. Clean runs for 1, 3 and 4. |
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
