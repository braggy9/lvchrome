# CLAUDE.md — lvchrome

## What This Repo Is

A small, reversible Chrome extension prototype for work: dependable return to four core tabs (Gmail, Calendar, one Matters Sheet, one Mission Control Doc) in Tom's standard Chrome profile on macOS. Habitat stays in its own ordinary Chrome workflow and is never touched.

Spec and decisions: `SPEC.md`. Test record: `TEST-LOG.md`. Load `extension/` unpacked.

## Commands

- `npm test` — URL-matching unit tests (Node built-in runner)
- `npm run e2e` — Playwright + xvfb run with fake Google pages; update the *Automated results* table in `TEST-LOG.md` after changes

## Mandatory Rules

- Cross-project rules in braggy9/tomos-command-tower `RULES.md` apply (uncertainty, anti-flattening, no process theatre).
- **Mac results come only from the real Mac:** Tom by hand, or a Claude Code session running on the Mac (from 2026-09-28, at Tom's request). Each `TEST-LOG.md` row records who checked it. Cloud sessions are Linux and cannot test Spaces, sleep/wake or the live profile, so they never mark a Mac row pass or fail.
- On the Mac, scripts drive only a throwaway Chrome profile and go through `tests/mac/guard.sh`. No screenshots, and never print URLs, titles or page content.
  - **Standing exception (Tom, 29 Sep 2026):** for the Google Tasks date/time test in `docs/google-tasks-datetime-test.md` only, a Claude Code session on the Mac may drive Tom's signed-in Chrome without `guard.sh`. It may create only that one synthetic task and report only that task's own values (title, date, time, list, details URL). Everything else still applies: no screenshots, never read or print anything else on screen, and never delete anything without asking Tom.
- **Never change the live Chrome profile without showing the exact change and how to undo it first.**
- **Confidentiality:** no network calls, analytics or URL logging. Store only the configured IDs, locally. Real IDs live in `config.local.json` (gitignored), never in commits.
- If a requirement cannot be met reliably, say so before building a larger wrapper.
- Where Chrome API behaviour is assumed rather than verified, say so inline.

## Conventions

- Australian English
- Conventional commits
- Manifest V3, plain JavaScript, no build step unless one earns its place
