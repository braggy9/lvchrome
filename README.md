# lvchrome

A small, reversible Chrome extension prototype for returning dependably to four core work tabs — Gmail, Calendar, the Matters Sheet and the Mission Control Doc — in a standard Chrome profile on macOS.

**Status:** scaffold only. No extension code yet. See `SPEC.md` for the plan and `TEST-LOG.md` for results (all untested).

## Local config

Copy `config.example.json` to `config.local.json` and fill in the real values. `config.local.json` is gitignored so document IDs never reach the repo.

## Install (once the extension exists)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Start in a throwaway profile. Only load into your live profile after reviewing the change.

## Uninstall

`chrome://extensions` → **Remove** on lvchrome. Nothing else in the profile is changed.
