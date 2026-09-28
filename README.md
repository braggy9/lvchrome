# lvchrome

A small, reversible Chrome extension for getting back to four core work tabs (Gmail, Calendar, the Matters Sheet and the Mission Control Doc) without reloading them. Links opened from those tabs go to a separate work window.

**Status:** prototype 0.1.1. First Mac run done (2026-09-28, throwaway profile). Focusing works, including across Spaces, without reloads. Shortcuts must be set by hand. Link routing is inconsistent, and Memory Saver and sleep/wake are still untested. See `TEST-LOG.md`.

## What it does

| You do | It does |
|---|---|
| **Option+Shift+1 / 2 / 3 / 4** | Goes to Gmail / Calendar / Mission Control Doc / Matters Sheet: brings its window forward and makes it the active tab. Doesn't reload it. If the window is on another desktop (Space), macOS slides across to it. |
| **Option+Shift+0** (optional) | Opens the lvchrome popup |
| Click a link in one of those tabs that opens a new tab | Moves the new tab to a separate **work window** (created the first time) |
| Navigate a core tab away in the same tab | Shows a red **!** on the extension icon. The popup offers **Restore**. It never blocks navigation. |
| Press a shortcut for a core tab you closed | Reopens it in a normal (non-work) window |
| Anything in Habitat, or any other tab | Nothing. It only acts on the four core tabs and on tabs opened from them. |

It also asks Chrome not to unload the four core tabs automatically (Memory Saver). Whether Chrome honours that on your Mac is test M5.

**Privacy:** no network requests, no analytics. It stores only your account number and two file IDs, in this Chrome profile. The event log records event names only, never URLs.

## Install (throwaway profile first)

1. **Get the files:** download https://github.com/braggy9/lvchrome/archive/refs/heads/main.zip and unzip it.
2. **Make a throwaway profile:** Chrome → profile icon (top right) → **Add** → *Continue without an account*. Sign in to your work Google account in that profile only if you want realistic tests.
3. In that profile go to `chrome://extensions` → switch on **Developer mode** (top right).
   - If the switch is missing or greyed out, your Chrome is managed and blocks this. That's test M0 = fail. Stop there and tell me.
4. **Load unpacked** → choose the `extension` folder inside the unzipped folder.
5. Click the puzzle-piece icon → pin **lvchrome**. It's a grey square with an "l". The red **!** badge only shows when it's pinned.
   - **Set the shortcuts by hand.** On Chrome 154, macOS, they were *not* set automatically (M1). Go to `chrome://extensions/shortcuts` → lvchrome, click the pencil on each row and press the keys. Leave scope as **In Chrome**. Chrome lists the rows alphabetically, so match by name:
     - Go to Gmail: **Option+Shift+1**
     - Go to Calendar: **Option+Shift+2**
     - Go to Mission Control Doc: **Option+Shift+3**
     - Go to Matters Sheet: **Option+Shift+4**
     - Activate the extension (opens the popup): **Option+Shift+0**, optional
6. Click the lvchrome icon → **Settings**:
   - **Work account index:** the settings page lists the numbers it can see in open Gmail tabs. Your work inbox's address bar shows `/mail/u/N/`, and N is the number.
   - Paste the full link of the **Matters Sheet** and the **Mission Control Doc**. It keeps only the ID.
   - **Save.**

### Moving to your live profile (after the throwaway tests)

**This is the only change it makes to your live profile:** one unpacked extension, with permission to read tab URLs and titles and to store its settings. Chrome words the tab permission as a browsing-history warning; I haven't checked the exact wording on your Chrome version.

**To undo:** `chrome://extensions` → lvchrome → **Remove**. Nothing else changes. To undo the Memory Saver protection without removing the extension, untick it in Settings.

Repeat steps 3–6 in the live profile.

## Mac test script

**Easier route:** get Claude Code on the Mac to run this for you. See `MAC-RUN.md`. The table below is the manual fallback.

Do these in order, and stop at any fail. After each one, click the lvchrome icon → **Copy diagnostics** and paste the result into the chat along with pass or fail.

| ID | Do this | Pass if |
|---|---|---|
| M0 | Install steps above | The extension loads, with no red "Errors" button |
| M1 | Open `chrome://extensions/shortcuts` *before* setting anything by hand | All four lvchrome shortcuts show Option+Shift+1–4, none blank (failed on the first run: set them by hand, install step 5) |
| M2 | Open the four core tabs in one window. Open another window and press each shortcut. | The right tab comes forward each time |
| M3 | Move the core-tabs window to another Space (Mission Control → drag). From the first Space, press each shortcut. | You end up looking at the right tab. Note *how*: Space switched, window moved, or nothing happened. |
| M4 | Scroll halfway down the Sheet and type something in a Gmail reply. Switch away and use the shortcuts back. | Same scroll position, text still there |
| M5 | Memory Saver on (Settings → Performance). Leave the tabs for 30+ minutes, then repeat M4. | No reload. The popup never says "unloaded". |
| M6 | Close the lid or sleep the Mac for 10+ minutes, wake it, then repeat M4. | No reload |
| M7 | Open one email in the work inbox, switch away, and press Option+Shift+1 | That same email is still open |
| M8 | Open your personal Gmail as well. Press Option+Shift+1. | Goes to work Gmail, never personal |
| M9 | Close the Calendar tab and press Option+Shift+2 | Calendar opens again in a normal window |
| M10 | Throughout all tests | Habitat is never moved, focused or changed |
| M11 | With a half-typed Gmail reply open, click a link inside an email | The link opens in the separate work window. Gmail stays put. |
| M12 | Click a link in a Calendar event, in the Sheet and in the Doc | Each opens in the same work window |
| M13 | After M11–M12, go back to the Gmail reply | Text still there |
| M14 | In the Doc, click a link that opens in the same tab (or type another URL in its address bar) | Red **!** appears. Popup → **Restore** brings the Doc back. |
| M15 | After all of the above | Four core tabs still in their original window |
| M16 | Cmd+click a link in Gmail (opens a background tab) | Tell me if jumping to the work window feels wrong. That's a design choice, not a bug. |

## For developers

- `extension/` is the folder to load. It's plain Manifest V3 JavaScript with no build step.
- `npm test`: unit tests for URL matching (Node, no dependencies).
- `npm run e2e`: automated run in Linux Chromium with fake Google pages. Needs Playwright and `xvfb-run`.
- `npm run e2e:mac`: the same suite on macOS, no xvfb. Run `npm install && npx playwright install chromium` first.
- Optional local seed: copy `extension/config.example.json` to `extension/config.local.json` (gitignored). It's read once on first install if no settings exist.
- Four shortcuts are suggested in the manifest. Chrome allows at most four suggested shortcuts per extension, so the popup has none there, but Chrome accepted Option+Shift+0 for it when set by hand. On the first Mac run, Chrome didn't apply the suggestions at all (cause unknown), so install step 5 sets them by hand.
- `tests/mac/`: helpers used for the first Mac run by a Claude Code session on the Mac (no Node needed). `launch.sh` starts Chrome on a throwaway folder once the normal Chrome has quit, and `guard.sh` makes every helper refuse to run unless that's the only Chrome. `lv.sh` reads tab kinds (never URLs or titles), places and checks no-reload markers, presses the shortcuts, and drives the popup and Settings pages. See the *Method* section in `TEST-LOG.md`.
