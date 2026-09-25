# CLAUDE.md — lvchrome

## What This Repo Is

A small, reversible Chrome extension prototype for work: dependable return to four core tabs (Gmail, Calendar, one Matters Sheet, one Mission Control Doc) in Tom's standard Chrome profile on macOS. Habitat stays in its own ordinary Chrome workflow and is never touched.

Spec and decisions: `SPEC.md`. Test record: `TEST-LOG.md`. Load `extension/` unpacked.

## Commands

- `npm test` — URL-matching unit tests (Node built-in runner)
- `npm run e2e` — Playwright + xvfb run with fake Google pages; update the *Automated results* table in `TEST-LOG.md` after changes

## Mandatory Rules

- Cross-project rules in braggy9/tomos-command-tower `RULES.md` apply (uncertainty, anti-flattening, no process theatre).
- **Mac tests are run by Tom, not by an agent.** Cloud sessions are Linux and cannot test Spaces, sleep/wake or the live profile. Never mark a `TEST-LOG.md` row pass/fail without Tom's report.
- **Never change the live Chrome profile without showing the exact change and how to undo it first.**
- **Confidentiality:** no network calls, analytics or URL logging. Store only the configured IDs, locally. Real IDs live in `config.local.json` (gitignored), never in commits.
- If a requirement cannot be met reliably, say so before building a larger wrapper.
- Where Chrome API behaviour is assumed rather than verified, say so inline.

## Conventions

- Australian English
- Conventional commits
- Manifest V3, plain JavaScript, no build step unless one earns its place
