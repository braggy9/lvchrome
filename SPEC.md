# Spec — lvchrome prototype

Build a small, reversible Chrome extension prototype for my existing standard Chrome profile on macOS. I need dependable ways to return to four core tabs, with their address bars available (normal windows, not app or popup windows): Gmail and Calendar for my **work account** (account index in local config), one specific Matters Sheet and one specific Mission Control Doc (file IDs in local config). Habitat stays in its own ordinary Chrome workflow. Do not touch its tabs or windows.

## Step 0 — Can this machine run it?

Tell me how to check whether this machine allows unpacked extensions (Developer mode; `chrome://policy`). Stop if it doesn't.

## Test 1 — Find and focus

Can the extension find and focus the existing four tabs across macOS Spaces without reloading them?

- Match Gmail/Calendar by account path (`/u/N`); match the Sheet and Doc by file ID.
- Treat Memory Saver on and off as separate conditions. Confirm (don't assume) whether tab discarding can be disabled per tab.
- If a core tab is missing: reopen it in a normal, non-work window.

## Test 2 — Route links to a work window

Can links opened from those tabs be moved to a separate work window without disrupting drafts or replacing a core tab?

- Draft survival means: an unsent Gmail compose window with typed text survives every test step.
- If a core tab navigates away in the same tab: detect it and offer to restore it; do not block navigation.

## Setup stages

1. Throwaway Chrome profile first, to check the mechanics.
2. Before loading anything into the live profile, show exactly what will change and how to remove it.

## Testing and records

The agent writes test steps; Tom runs them on the Mac and reports. Record each test in `TEST-LOG.md` as pass, fail or untested, based only on Tom's reports.

## Constraints

- No network calls, analytics or URL logging. Store only the configured IDs, locally.
- If a requirement can't be met reliably, say so before building a larger wrapper.

## Deliverables

The extension, a README with install and uninstall steps, and `TEST-LOG.md`.

## Decisions made (delegated to Claude, 2026-09-25)

| Question | Decision | Why / how to change |
|---|---|---|
| Work Google account | Set in the extension's Settings page (default `/u/0`). The page lists the account numbers it can see. | Tom didn't specify. Picking wrong is harmless and fixed in Settings. |
| Habitat | Excluded by design: the extension acts only on the four matched tabs and on tabs opened from them | Only at risk if Habitat is itself the work Gmail, Calendar or one of the two files |
| Missing core tab | Reopen it in a normal, non-work window | Most useful default. The alternatives were "do nothing" or "ask". |
| Same-tab navigation | Detect it, show a "!" badge, offer Restore to the last core URL. Never block. | Blocking risks breaking Gmail |
| Shortcuts | Option+Shift+1–4. The popup has no shortcut. | Chrome caps suggested shortcuts at four. Leaving the popup (`_execute_action`) unbound avoids the unconfirmed question of whether it counts. |
| Routed links | Moved to the work window, which is then focused | Revisit after M16 if background-tab Cmd+clicks feel wrong |
