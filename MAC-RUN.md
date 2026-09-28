# Running the tests on the Mac with Claude Code

The cloud session can't reach your Mac, but Claude Code running **on** the Mac (the desktop app or `claude` in Terminal) can. Paste the prompt below into a local Claude Code session and it does the work. It only stops for the things that need your hands.

## Paste this

> Clone https://github.com/braggy9/lvchrome into ~/Code/lvchrome (or pull if it's already there). Read CLAUDE.md, SPEC.md, TEST-LOG.md and README.md.
>
> 1. Run `npm install`, `npx playwright install chromium`, `npm test`, then `npm run e2e:mac`. This is the same automated suite as the cloud run, but on macOS with a real window manager. Record the results in TEST-LOG.md as a new "Automated (macOS)" section.
> 2. Work through the Mac test script (M0–M16) in README.md. Automate as much as you can: AppleScript/`osascript`, `pmset`, keyboard events, screenshots. Ask for macOS permissions (Accessibility, Screen Recording) if you need them. Use a throwaway Chrome profile for anything that doesn't need my real logins.
> 3. Only ask me to do something physical when there's no other way (e.g. waking the Mac, logging into work Google, moving a window between Spaces if you can't script it). Batch those requests into as few interruptions as possible.
> 4. Before touching my live Chrome profile, show me exactly what will change and how to undo it, then wait for my OK.
> 5. Record every result in TEST-LOG.md as pass, fail or untested, with how it was checked (automated or me by hand). Commit on a branch, open a PR, and tell me in plain language which requirements are met, which aren't, and whether the prototype is worth building on.

## What can't be automated

I think these need a person, but a local session should try first:

- **Sleep/wake:** a script can put the Mac to sleep, but waking it and verifying afterwards may need you.
- **Spaces:** macOS has no public API for moving a window to another Space. Scripting it through Mission Control may or may not work.
- **Real Gmail:** needs your signed-in work account. Only you can sign in.

## What run 1 learned (2026-09-28, work MacBook Air)

- **No Node, no git** on the work Mac, and installing them was declined. The code came from the zip, and the Mac tests used `tests/mac/` (AppleScript and System Events only).
- **One Chrome at a time.** AppleScript can't tell two running Chromes apart, so the normal Chrome is quit and `tests/mac/launch.sh` starts a throwaway one. `guard.sh` makes every helper refuse to run otherwise. The debug port and `--load-extension` were avoided because security tools may flag them.
- **By hand:** Load unpacked, Google sign-in (decline sync), setting the shortcuts (M1), Accessibility for Claude (System Settings → Privacy & Security → Accessibility), moving the window to another desktop (M3), and opening an email (M7).
- **Signing in with the work account** makes Workspace force-install its extensions into the profile, and Chrome syncs the account's own extensions too, even with sync declined.
- **Resuming:** Cmd+Q the normal Chrome, run `tests/mac/launch.sh`, then `tests/mac/lv.sh state`. Load the updated `extension/` by pressing **Reload** on the lvchrome card in `chrome://extensions`. Still to do: M5 (30 min idle), M6 (sleep 10+ min), M7, M11/M12 re-clicks on 0.1.1, the red "Errors" button check for M0, and Option+Shift+2 across Spaces for M3.
