# Google Tasks date/time test — brief for an agent

**Status:** not run. No task has been created by any agent so far (checked 25 Sep 2026).

This test is separate from the lvchrome extension (`SPEC.md`). It checks whether a task created through the **native Google Tasks UI** keeps a specific date, time, list and URL after a refresh.

## Who can run this

`CLAUDE.md` says Mac tests are run by Tom, not by an agent. That rule was written for the lvchrome extension tests. Tom asked for an agent to run this Google Tasks test (25 Sep 2026), but this brief doesn't settle whether that makes it an exception. So:

- **Tom can run it himself** using the steps below and report back with the table.
- **An agent may run it only if Tom confirms in that session** that he wants the agent to drive his Chrome for this test. Without that confirmation, prepare the steps and wait for Tom's report.

If an agent runs it, it must be able to drive **Tom's own signed-in Chrome on his Mac**.

- A cloud Claude Code session (Linux container) **cannot**. It has its own headless Chromium, but that browser isn't signed in to Tom's Google account and can't see his Mac, his Chrome profile or his tabs.
- Which local Claude setups can drive Tom's Chrome is **not verified here**. Confirm it works before starting.
- Don't use the Google Tasks API or an API-bridge tool instead. This tests the UI. Unverified: the API may also drop the time portion of a due date, which would make an API result misleading.

## Before you start

- **The date has passed.** 26 Sep 2026 is now in the past. A task dated in the past may show as overdue or behave differently. Ask Tom whether to keep 26 Sep or use a future date, and record which one was used.
- The title (`… — 26 Sep`) matches the original date. If the date changes, ask Tom whether the title changes too.

## Test values

| Field | Value |
|---|---|
| Title | `TEST Slack capture — 26 Sep` (em dash) |
| Date | Saturday 26 September 2026 (see above) |
| Time | 3:00 pm, Australia/Sydney |
| Details | `https://example.com/draft?ref=slack-test` |
| List | Default list unless Tom says otherwise. Record which list was used |

## Steps

1. Open Google Tasks in Tom's signed-in Chrome. Record which screen you used: the Tasks side panel in Gmail or Calendar, or the standalone Tasks page.
2. **Duplicate check first:** search or scan the lists for an existing `TEST Slack capture` task. If one exists, don't create another. Report it instead.
3. Create **one** task with the values above. Set the date and time with the task's own date/time control, not by typing them into the title.
4. Put the URL in the details/description field.
5. Save, then refresh the page.
6. Reopen the task and record what is actually shown.

**If saving is uncertain** (spinner, error, no confirmation), stop. Refresh and check whether the task exists. **Never create a second one.**

## Report back (exactly what is visible)

| Item | Seen |
|---|---|
| Google screen used | |
| Controls used (names as shown in the UI) | |
| Date after refresh | |
| Time after refresh (and any time-zone label) | |
| List | |
| URL in details (present? clickable? exact text?) | |
| Anything unexpected (time shifted, overdue flag, repeat, etc.) | |

## Rules

- Tom confirms the result. Don't mark anything pass/fail on his behalf.
- Synthetic data only. Don't log or send any other URLs or account details.
- Cleanup: ask Tom before deleting the test task.
