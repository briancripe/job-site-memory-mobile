# Hackathon mobile feasibility decision

**Decision: NO-GO for the originally proposed live mobile/camera flow.** This is
not an abandonment of job-site memory. It is an evidence-bound decision for the
time-limited hackathon: do not represent the live camera/mobile path as ready,
and do not open an implementation molecule from this decision.

## Evidence synthesis

| Spike | Evidence | Decision effect |
| --- | --- | --- |
| S1 | The CopilotKit React Native client can serialize the preferred image/data shape, but no camera, runtime route, provider, model-visible pixels, transcription, or latency was exercised. | Camera/vision is not a live demo claim; retain text-first. |
| S2 | The headless kit contracts largely match the tool design, but the current strict schema is invalid for optional enums, nested `runAgent` readiness is unproven, and two baseline imports are missing. | Do not run or import the current Loci tool layer unchanged. |
| S3 | No Pixel/cellular session, runnable page, model/runtime credentials, live loci endpoint, throwaway data, correctness result, confirm-band result, or latency sample existed. | No page-level live-flow claim. |
| S4 | No Pixel/browser page, host route, model, endpoint, printed-tag take, or viewer result was exercised. The source-level tap gate is not a physical safety pass. | Do not claim physical injection safety. |

The combined result is a **NO-GO**, driven by missing prerequisite and live
evidence rather than a demonstrated product failure. In particular, the image
transport shape is not disproven, and the project remains viable as a smaller,
text-first future MVP.

## Preserved fallback

The smallest viable future MVP is exactly one mobile-friendly browser UI page
for a Google Pixel, text-first initially. It should be served from this host at
Tailscale IPv4 `100.116.151.118`, with its server bound to `0.0.0.0`.

That Tailscale/Pixel route is **unexercised**. Before any broader work, perform
only the minimal real-Pixel safety validation required by S4's intended route:
open the page through that address, use the disposable live setup, and record
the physical injection/tag result and viewer confirmation. Do not infer a
camera, cellular, or physical safety pass before that validation exists.

## Lifecycle statement

No product code and no new measurements were introduced by this decision. No
implementation molecule was filed.

**Proposed close reason for the dispatcher after lifecycle merge:**

> NO-GO: S1 proved only client-side image serialization (no camera/runtime/model/latency); S2 retains strict-schema and nested-run blockers; S3 recorded no Pixel/page/live loci correctness or latency evidence; and S4 recorded no physical injection or viewer result. The originally proposed live mobile/camera flow is not ready, no implementation molecule was filed, and the unexercised fallback is one text-first Pixel browser page served via `100.116.151.118` with `0.0.0.0` binding plus minimal real-Pixel safety validation.
