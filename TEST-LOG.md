# Test log

Results are recorded **only from Tom's reports on the Mac**. Default is `untested`.

Environment per run: macOS version · Chrome version · Memory Saver on/off · throwaway or live profile.

| ID | Area | Test | Condition | Result | Date | Notes |
|---|---|---|---|---|---|---|
| 0.1 | Setup | Unpacked extensions allowed (Developer mode available, no blocking policy) | — | untested | | |
| 1.1 | Focus | Focus Gmail tab in another window on the same Space | Memory Saver off | untested | | |
| 1.2 | Focus | Focus Gmail tab in a window on a different Space | Memory Saver off | untested | | |
| 1.3 | Focus | Same as 1.2 for Calendar, Matters Sheet, Mission Control Doc | Memory Saver off | untested | | |
| 1.4 | Focus | 1.2–1.3 repeated | Memory Saver on | untested | | |
| 1.5 | Reload | Focused tab does not reload (scroll position and unsaved state kept) | Memory Saver on/off | untested | | |
| 1.6 | Sleep/wake | After sleep/wake, all four tabs still found and focused without reload | — | untested | | |
| 1.7 | Matching | Gmail on a message URL (`#inbox/<id>`) still matched as the core Gmail tab | — | untested | | |
| 1.8 | Matching | Personal-account Gmail/Calendar tabs are not matched | — | untested | | |
| 1.9 | Missing | Behaviour when a core tab is closed matches the agreed rule | — | untested | | |
| 1.10 | Habitat | Habitat tabs/windows untouched throughout | — | untested | | |
| 2.1 | Routing | New-tab link from Gmail opens in the work window | — | untested | | |
| 2.2 | Routing | Same for Calendar, Sheet, Doc | — | untested | | |
| 2.3 | Drafts | Unsent Gmail compose with typed text survives 2.1–2.2 | — | untested | | |
| 2.4 | Same-tab | Core tab navigating away in the same tab is detected and restore is offered | — | untested | | |
| 2.5 | Core tabs | No core tab is replaced or closed by routing | — | untested | | |
