# Test log

Two kinds of result, kept apart on purpose:

- **Mac results** come **only from Tom's reports** on the real Mac. Default is `untested`.
- **Automated results** come from `npm run e2e`: Linux Chromium under xvfb with **fake** Google pages. They check the extension's logic. They say nothing about macOS Spaces, sleep/wake, Memory Saver or real Gmail.

## Mac results

Record for each run: macOS version · Chrome version · Memory Saver on/off · throwaway or live profile. Steps for each ID are in `README.md` → *Mac test script*.

| ID | Area | Test | Result | Date | Notes |
|---|---|---|---|---|---|
| M0 | Setup | Unpacked extension loads (Developer mode available, no blocking policy) | untested | | |
| M1 | Setup | Shortcuts Option+Shift+1–4 bound (none show as blank in chrome://extensions/shortcuts) | untested | | Chrome's docs: a clashing shortcut silently fails to register |
| M2 | Focus | Each shortcut focuses its tab from another window on the **same** Space | untested | | |
| M3 | Spaces | Each shortcut focuses its tab when its window is on a **different** Space | untested | | Key unknown: does macOS switch Space, or does the window come to you, or nothing? |
| M4 | Reload | Focused tabs don't reload (scroll position and half-typed text kept) | untested | | |
| M5 | Memory Saver | M3–M4 with Memory Saver on, after 30+ min idle | untested | | Popup shows "unloaded — will reload" if Chrome discarded anyway |
| M6 | Sleep/wake | After sleep/wake, all four found and focused without reload | untested | | |
| M7 | Gmail URLs | Open a message, switch away, shortcut back: same message still open | untested | | |
| M8 | Accounts | Personal-account Gmail/Calendar never picked | untested | | |
| M9 | Missing | Close Calendar, press its shortcut: reopens in a normal window | untested | | |
| M10 | Habitat | Habitat tabs and windows untouched throughout | untested | | |
| M11 | Routing | Link clicked in an email opens in the work window | untested | | |
| M12 | Routing | Same from Calendar (event link), Sheet and Doc | untested | | |
| M13 | Drafts | Half-typed Gmail reply survives M11–M12 | untested | | |
| M14 | Same-tab | A core tab navigated away shows "!" badge; Restore brings it back | untested | | |
| M15 | Core tabs | No core tab replaced or closed by routing | untested | | |
| M16 | Feel | Cmd+click (background tab) jumping to the work window: acceptable or annoying? | untested | | Design choice to revisit |

## Automated results (Linux Chromium, fake pages)

Last run: 2026-09-25, lvchrome 0.1.0, Playwright 1.56.1 bundled Chromium. **19 passed, 0 failed, 1 untested.**

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
