# S3 live arrival-brief verdict

## Question

On a physical Google Pixel over cellular, does the smallest mobile-friendly UI page produce a
correct, non-invented five-part arrival brief from the two documented valve props, reproduce and
resolve the confirm band, and complete the preview/Commit flow against a throwaway loci place?
The hackathon question is page-level feasibility; it does not require a whole native app.

## Method

This spike stopped at its prerequisite gate. Before making any live request or seeding shared
data, the worktree and execution environment were inspected for:

1. a physical Google Pixel and Android/browser device tooling;
2. a runnable mobile-friendly page plus configured model/provider credentials and runtime URL;
3. a loci capability endpoint plus identified throwaway place/data; and
4. the preceding S2 compatibility verdict.

No product code was changed. No shared service was called, no place was seeded, and no substitute
desktop or mocked run was used as evidence for the required physical-phone/cellular measurements.

## Evidence

### Prerequisites

| Prerequisite | Evidence | Executable? |
| --- | --- | --- |
| Physical Google Pixel over cellular, Wi-Fi off | `adb` is not installed, and no Pixel/device or browser-debug interface was available to this session. Cellular and Wi-Fi state therefore could not be observed or controlled. | No |
| Model and credentials | `MODEL_PROVIDER`, `MODEL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `NVIDIA_API_KEY` are unset. The only matching credential variable present was `GITHUB_TOKEN`, which is unrelated to the model/runtime path. | No |
| Mobile-friendly page and runtime | No runnable page-level arrival-brief/confirm-band UI is present, `EXPO_PUBLIC_RUNTIME_URL` is unset, and the repository has no `apps/web` runtime route. Building that page is outside this spike. A whole native app is not a prerequisite. | No |
| Live loci endpoint | `EXPO_PUBLIC_LOCI_URL` is unset. Consequently the planned single read-only `ask` probe could not be addressed safely. | No |
| Throwaway place/data | No throwaway endpoint, place identifier, or seeded disposable records were supplied or found. The planned `bench test <initials>` place, two props, and one lesson were not created. | No |
| S2 gate | `docs/spikes/jsmm-tdv.2-s2-kit-integration.md` reports NO-GO for the unchanged tool layer: strict schema and confirm-band nested-run readiness remain unresolved, and the app baseline lacks two imported modules. | No |

Source/config inspection was executable. It confirmed that the app expects the loci capability URL
in `EXPO_PUBLIC_LOCI_URL`, the runtime URL in `EXPO_PUBLIC_RUNTIME_URL`, and that the planned prompt
contains the five-part brief and candidate-confirmation instructions. Those facts do not establish
live behavior.

### Model, scores, and latency

**Model:** not selected or exercised; provider/model configuration and credentials were absent.

“Not measured” below means the take was not run because the physical phone, cellular control,
runtime/model credentials, live loci endpoint, and throwaway data were unavailable. A dash is not a
failed synthetic score; it is deliberately no claimed result.

| Beat | Take | Brief facts correct | Made-up facts | Taps | Latency |
| --- | ---: | --- | --- | --- | --- |
| Snap prop A stamp → `resumed` brief | 1 | Not measured | Not measured | Not measured | Not measured |
| Snap prop A stamp → `resumed` brief | 2 | Not measured | Not measured | Not measured | Not measured |
| Snap prop A stamp → `resumed` brief | 3 | Not measured | Not measured | Not measured | Not measured |
| Generic snap → `needs_confirm`; tap A → resume | 1 | Not measured | Not measured | Not measured | Not measured |
| Generic snap → `needs_confirm`; tap A → resume | 2 | Not measured | Not measured | Not measured | Not measured |
| Generic snap → `needs_confirm`; tap A → resume | 3 | Not measured | Not measured | Not measured | Not measured |
| Propose → preview → Commit → viewer row | 1 | Not measured | Not measured | Not measured | Not measured |
| Propose → preview → Commit → viewer row | 2 | Not measured | Not measured | Not measured | Not measured |
| Propose → preview → Commit → viewer row | 3 | Not measured | Not measured | Not measured | Not measured |

**Median latency:** not measured. No tool call, snap-to-brief interval, or provider round trip was
executed, so there is no sample from which to calculate a median.

**Prompt changes:** none. Changing the prompt without a runnable live path could not produce useful
evidence and would exceed this prerequisite-only spike.

**Made-up facts:** not measured/assessed. No model response was generated. Therefore this report
claims neither that facts were invented nor that the prompt prevented invention.

## Verdict

**NO-GO.** The required physical-Pixel, cellular, live-service, page-level correctness,
confirm-band, and latency evidence could not be collected from this environment. This is a
prerequisite/evidence NO-GO, not a fabricated failure result for the model, loci service, Pixel,
or page flow. It does not justify building a whole native application.

## Recommendation

Run the smallest follow-up only after the S2 blockers are cleared: make one mobile-friendly page
that renders only the arrival brief and confirm band and can perform the existing preview/Commit
interaction. Do not build or package a whole native app. Open that page on one physical Google
Pixel with cellular service and Wi-Fi off, using one configured model credential, an
`EXPO_PUBLIC_LOCI_URL` for a disposable loci deployment, and a named empty throwaway place. Then
seed exactly the two documented props and one lesson, run exactly the three takes per beat in the
S3 plan, and record the model, per-take scores, made-up facts, prompt changes, and median latency.
Until that Pixel run occurs, claim no physical-device or cellular evidence. Do not broaden the
matrix or tune loci thresholds.
