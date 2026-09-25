# Spec — lvchrome prototype

Build a small, reversible Chrome extension prototype for my existing standard Chrome profile on macOS. I need dependable ways to return to four core tabs, with their address bars available (normal windows, not app or popup windows): Gmail and Calendar for my **work account** (account index in local config), one specific Matters Sheet and one specific Mission Control Doc (file IDs in local config). Habitat stays in its own ordinary Chrome workflow. Do not touch its tabs or windows.

## Step 0 — Can this machine run it?

Tell me how to check whether this machine allows unpacked extensions (Developer mode; `chrome://policy`). Stop if it doesn't.

## Test 1 — Find and focus

Can the extension find and focus the existing four tabs across macOS Spaces without reloading them?

- Match Gmail/Calendar by account path (`/u/N`); match the Sheet and Doc by file ID.
- Treat Memory Saver on and off as separate conditions. Confirm (don't assume) whether tab discarding can be disabled per tab.
- If a core tab is missing: **[TBC — focus nothing / reopen it / ask]**.

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

## Open questions

- Which Google account is work (`/u/0` or `/u/1`)?
- What is Habitat (one line), so it can be reliably excluded?
- Missing-tab behaviour (see Test 1).
