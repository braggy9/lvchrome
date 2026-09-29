# Google Tasks date/time test — brief for an agent

**Status:** run on 29 Sep 2026 by a Claude Code session on the Mac, at Tom's request. Awaiting Tom's confirmation. See *Run 1* at the end.

This test is separate from the lvchrome extension (`SPEC.md`). It checks whether a task created through the **native Google Tasks UI** keeps a specific date, time, list and URL after a refresh.

## Who can run this

`CLAUDE.md` (as of 28 Sep 2026) allows Mac results from Tom by hand, or from a Claude Code session running on the Mac at Tom's request. It also says Mac scripts drive **only a throwaway Chrome profile** (via `tests/mac/guard.sh`), take no screenshots, and never print URLs, titles or page content.

This test needs Tom's **signed-in** profile, so `CLAUDE.md` carries a **standing exception** for it (Tom, 29 Sep 2026). A Claude Code session on the Mac may drive his signed-in Chrome for this test without `tests/mac/guard.sh`, but only within these limits:

- Create only the one synthetic task below.
- For the duplicate check only, look through task titles to find an exact match for this task's title. Never record, quote or report any other title.
- Report only what's in the table under *Report back*: this task's own values and status, plus the Google screen and control labels you used.
- Screenshots are allowed (Tom, 29 Sep 2026), only of the Tasks tab and only to see and operate it. Don't save, attach or share them, and don't transcribe, record or repeat anything else visible in them: other tasks, emails, tabs.
- Don't delete anything without asking Tom.

Tom can also run it himself and fill in the report table.

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
2. **Duplicate check first:** look for a task titled exactly `TEST Slack capture — 3 Oct`, due 3 Oct 2026. If one exists, don't create another. Report it instead. Only an exact title match counts:
   - An older `TEST Slack capture — 26 Sep` task doesn't count. Leave it alone, note that it exists, and carry on.
   - Don't record any other task you pass over.
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
| Anything unexpected on this task (time shifted, overdue flag, repeat, etc.) | |
| Older 26 Sep test task present? (yes/no only) | |

## Rules

- Tom confirms the result. Don't mark anything pass/fail on his behalf.
- Synthetic data only. Don't log or send any other URLs or account details.
- Cleanup: ask Tom before deleting the test task.

## Run 1: 29 Sep 2026, about 10:40–10:48 AEST

Run by a Claude Code session on the Mac, driving Tom's signed-in Chrome through the Claude in Chrome extension, at Tom's request in that session. Tom chose Sat 3 Oct, the matching title and the default list. **Not yet confirmed by Tom.**

**Method, and a rule it didn't meet.** This run happened before the standing exception in `CLAUDE.md` was written. It used **screenshots** and the page's accessibility tree to find controls and read the task back, so other tasks were on screen in those screenshots. None of them is recorded here or anywhere else. The exception now forbids screenshots. A no-screenshot re-read at about 12:20 couldn't see the task: Google Tasks doesn't draw its list in a background tab, and the tab stayed hidden. So the values below come from the 10:40 run, and Tom can confirm them by opening the task.

No task with this exact title existed before the run. One task was created.

| Item | Seen |
|---|---|
| Google screen used | Standalone Tasks page (tasks.google.com), "All tasks" view |
| Controls used (names as shown in the UI) | **Add a task** (My Tasks); title field; **Details**; the clock chip (tooltip **Date/time**) → calendar dialog (next-month arrow, then day **3**) → **Set time** dropdown → **15:00** → **Done**. Saved by clicking outside the task. There's no save button. |
| Date after refresh | **Sat 3 Oct** on the chip; its accessible label reads "Scheduled for Saturday, 3 October 2026, 15:00". Reopening the Date/time dialog shows 3 Oct 2026 selected. |
| Time after refresh (and any time-zone label) | **15:00** (24-hour, as the picker offers it). **No time-zone label** on the task or in the dialog. The Mac's zone is Australia/Sydney (AEST, +10:00); the Google account's own zone wasn't checked. |
| List | **My Tasks** (the default list) |
| URL in details (present? clickable? exact text?) | Present, shown as a link, `href` = `https://example.com/draft?ref=slack-test`, exact match. It wasn't clicked. |
| Anything unexpected on this task (time shifted, overdue flag, repeat, etc.) | None: no time shift, no overdue flag, **Repeat** not set. |
| Older 26 Sep test task present? (yes/no only) | Yes |

Run notes: the first attempt to type the URL didn't reach Details (the row re-laid out after the title was typed), so it was retyped before saving. The Date/time dialog has no time-zone field.

Cleanup: both test tasks are still in My Tasks. Ask Tom before deleting either.

## What this means for Slack capture

The UI keeps a time; the **API can't**. Google's Tasks API reference (`Task.due`, page last updated 24 Feb 2026, read 29 Sep 2026) says only the date is recorded, the time part is discarded when the field is set, and a task's scheduled time can't be read or written through the API.

So a capture tool that creates tasks through the API gets **date-only** tasks. Where the time matters, put it in the title or notes, or create a Calendar event instead. This is from the documentation, not tested here: no API call was made.
