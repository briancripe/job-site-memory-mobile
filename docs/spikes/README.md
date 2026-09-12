# Spikes

A spike answers one question with a go/no-go, inside a time-box, and leaves behind a verdict, not
a feature. The split below is by one test: **would a "no" change what we submit or say on stage?**
If yes, it runs before `prototype:graduate`. If it only changes what comes next, it waits.

Deadline pressure is real: the hackathon closes Sun 2026-09-13 (portal time). Pre-graduate
spikes total about 4 hours of time-boxes.

## Before graduate (blocking)

| # | Spike | Time-box | Blocked on | A "no" means |
|---|---|---|---|---|
| [S1](S1-image-parts.md) | Do camera images reach the model through CopilotKit RN 1.70? | 45 min | kit running locally | The phone isn't a vision surface: ship text-only, and the Claude app does vision |
| [S2](S2-kit-integration.md) | Do `loci-tools.tsx` hooks, render props and zod schemas work in the real kit? | 60 min | S1's kit setup | Rework the tool layer before anything else |
| [S3](S3-live-brief.md) | Against live loci `ask`, is the arrival brief correct and does the confirm band resolve on a real phone over cellular? | 90 min | loci P2 deployed, S2 | The mobile beat is cut from the demo |
| [S4](S4-injection-beat.md) | What does the model do with a printed injection tag seen through the phone camera? | 30 min | S3 | Change the stage line, not the code: the tap gate still holds |

Run them in that order. **Kill rule:** if S1 *and* its fallback fail, or S3 is no-go by the
submission cutoff, the repo stays private and the submission is loci on its own. A stretch goal
that half-works on stage costs more than it adds.

> **Graduated early, 2026-09-12, as a private push**, so work could continue on another host. The
> spikes above now gate going **public** and entering the submission, not the first push.

### Before going public (decisions, not spikes)

- **Brought vs built stays visible.** The hackathon requires showing what was built during the event
  (loci does it with visible `brought-*` tags). Everything in the graduation commit was built on
  2026-09-12. Import the kit at `5c8bf4c` as **one commit on its own**, verbatim apart from the
  npm → pnpm manifest changes, and tag it `brought-kit-5c8bf4c`. Never squash it into built work.
  Then `git show --stat brought-kit-5c8bf4c` is exactly what was brought.
- **Public, not private.** The graduation push is private. The submission needs a public repo: `gh repo edit --visibility public`.
- **Home.** Either a `mobile/` folder in `LincForge/0xl0c1` (one submission, one repo) or this repo
  linked from loci's README. Team call.
- **No capability token in the tree.** `EXPO_PUBLIC_LOCI_URL` lives in an untracked `.env` only.
  Grep for `loci-` plus the token before pushing.
- **Licenses.** Kit is MIT (CopilotKit), loci is Apache-2.0. Keep the kit's MIT notice on the vendored files.

## After graduate (non-blocking)

Filed here so they don't creep into the weekend. Each one becomes its own file when it's pulled.

| # | Spike | Question | Pull it when |
|---|---|---|---|
| A1 | Realtime voice | Can the kit's `/api/realtime-token` drive OpenAI Realtime over `react-native-webrtc` in Expo (dev build, not Expo Go) with the same three frontend tools? | Dictation plus Send is too slow with gloves on |
| A2 | "Live video" | Sample a frame every N seconds, or on a voice trigger? Measure cost, latency and whether the answers get better than one snap | One snap misses what the tech is pointing at |
| A3 | Token off the device | Proxy loci through the runtime with a one-time, session-bound approval (the kit's `followups.ts` pattern) so the tap gate holds server-side too | The capability URL stops being a shared, open demo graph |
| A4 | Idempotent commit on flaky cellular | loci `commit` isn't idempotent, so a retry after a dropped response writes twice. Client idempotency key, or check with `ask` before retrying? | Real field use under a subfloor |
| A5 | Does object + lesson + `next_question` carry a multi-week job? | Model a real restoration job (rooms, daily moisture-reading series, equipment in and out) on loci's three tools and see where it breaks | Before any 4th loci tool or table is proposed |
| A6 | Documentation interop | Can briefs and claims be pushed into Encircle or CompanyCam through their APIs instead of us storing photos? | A restoration company wants to pilot it |
| A7 | Homeowner status report | Is a read-only report generated from loci lessons useful to the client, and what should it hide? | Someone other than the tech needs to read the job |
