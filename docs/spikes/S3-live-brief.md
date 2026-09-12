# S3: Arrival brief and confirm band against live loci, on a real phone

**Time-box:** 90 min · **Needs:** loci P2 (`ask` engine) deployed, S2 go · **Blocks:** graduation

## Questions

1. **Brief correctness.** Given a `resumed` result, does the prompt produce the five-part brief
   without making anything up? Day N must match `first_seen_at`, what-to-verify must be `next_question`
   word for word, and the homeowner and insurance parts must be labelled as suggestions.
2. **Confirm band on the phone.** Do the twin valves land in `needs_confirm`, and does tapping a
   candidate resume through `ask(object_id)` with the right lessons?
3. **Field conditions.** Does the loop hold on a physical phone over **cellular**: latency per tool call, and total time from snap to brief?
4. **Model choice.** Which `MODEL_PROVIDER`/`MODEL` gets 1–3 right most often? Candidates: whatever
   passed S1, plus one alternative.

## Method

1. Confirm loci `ask` no longer returns `not_implemented` (one read-only call).
2. Seed on a **throwaway place** (`bench test <your initials>`), not the demo closet. loci's
   `observe` is create-only, and the graph is shared with the cohort.
3. Seed prop A (3/4" `3/4 600 WOG NSF-61 APOLLO`) and prop B (1/2" `1/2 CSA 600WOG`) in the same place, then one
   commit on A with a `next_question`.
4. On the phone, over cellular with wifi off, run three takes of each beat:
   - Snap A's stamp. Expected: `resumed` and a brief.
   - Snap generically, with no stamp in frame. Expected: `needs_confirm`, tap A, resume.
   - Propose a commit, check the preview, Commit, and see the row in loci's viewer.
5. Score each take: brief facts correct (y/n), anything made up (y/n), taps needed, seconds.

## Go / no-go

- **Go:** at least 2 of 3 clean takes per beat on cellular, no made-up record facts in any take, and a brief within ~20 s of the snap.
- **No-go:** made-up facts that prompt changes can't fix inside the time-box, or the confirm band doesn't reproduce with the real props.
  If the band is the problem, change the prop, never loci's thresholds (loci `SATURDAY.md` §6).

## Verdict

_Fill in: model chosen, take scores, median latency, prompt changes made._
