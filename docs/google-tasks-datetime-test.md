# Google Tasks date/time test — brief for an agent

**Status:** not run. No task has been created by any agent so far (checked 25 Sep 2026).

This test is separate from the lvchrome extension (`SPEC.md`). It checks whether a task created through the **native Google Tasks UI** keeps a specific date, time, list and URL after a refresh.

## Who can run this

`CLAUDE.md` (as of 28 Sep 2026) allows Mac results from Tom by hand, or from a Claude Code session running on the Mac at Tom's request. It also says Mac scripts drive **only a throwaway Chrome profile** (via `tests/mac/guard.sh`), take no screenshots, and never print URLs, titles or page content.

This test doesn't fit that second rule as written. It needs Tom's **signed-in** profile, and it reads back a title and URL (synthetic ones, but still). Those rules were written for the lvchrome extension tests, and this brief doesn't decide whether they cover this one. So:

- **Tom can run it himself** using the steps below and report back with the table.
- **An agent may run it only if Tom confirms in that session** that he wants the agent to drive his signed-in Chrome for this test and read back the synthetic values. Without that confirmation, prepare the steps and wait for Tom's report.
- This test can't go through the repo's Mac scripts. `tests/mac/guard.sh` stops unless the throwaway profile is the only Chrome running, so that no script ever acts on the live profile, and Google Tasks needs the signed-in account.

If an agent runs it, it must be able to drive **Tom's own signed-in Chrome on his Mac**.

- A cloud Claude Code session (Linux container) **cannot**. It has its own headless Chromium, but that browser isn't signed in to Tom's Google account and can't see his Mac, his Chrome profile or his tabs.
- Which local Claude setups can drive Tom's Chrome is **not verified here**. Confirm it works before starting.
- Don't use the Google Tasks API or an API-bridge tool instead. This tests the UI. Unverified: the API may also drop the time portion of a due date, which would make an API result misleading.

## Before you start

- **Date changed.** The original request was for Sat 26 Sep 2026, which had passed by the time this brief was written. On 29 Sep 2026 Tom chose **Saturday 3 October 2026** instead, and the title changed to match. Don't use 26 Sep.
- **Daylight saving.** Sydney switches to daylight time on Sun 4 Oct 2026 (checked against the tz database). So 3 Oct at 3:00 pm is still standard time (AEST, UTC+10), the day before the switch. If the time shows up shifted by an hour, report exactly what you see and don't correct it.

## Test values

| Field | Value |
|---|---|
| Title | `TEST Slack capture — 3 Oct` (em dash) |
| Date | Saturday 3 October 2026 |
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
