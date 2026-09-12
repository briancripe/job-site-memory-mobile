# ADR-0001: Do not stage the live mobile/camera flow

**Status:** Accepted for the hackathon decision bead `jsmm-tdv.5`  
**Date:** 2026-09-12

## Context

The proposed hackathon flow depended on a live camera-to-model path, the Loci
tool layer, a mobile-friendly page on a physical Pixel, and a physical
injection-safety check. The completed S1--S4 spike artifacts contain no
end-to-end evidence for those live prerequisites.

S1 verified only client-side image serialization. S2 found the unchanged tool
layer unready for a strict-provider/live claim. S3 could not exercise the
Pixel, page, runtime, loci endpoint, data, correctness, confirm band, or
latency. S4 could not exercise the host route, Pixel, injection tag, or viewer
and therefore cannot establish physical safety.

## Decision

Declare an explicit **NO-GO** for the originally proposed live mobile/camera
flow. Do not make a stage claim for camera/model behavior, cellular use, or
physical injection safety. This decision does not abandon the project.

Preserve a narrow future path: one text-first, mobile-friendly browser UI page
for Google Pixel, served from this host through Tailscale IPv4
`100.116.151.118`, with the server bound to `0.0.0.0`. The Tailscale/Pixel
route is unexercised. The only immediate follow-up is minimal safety validation
on an actual Pixel before expanding scope or claiming the route works.

## Consequences

- No product code or new measurement is part of this decision.
- No implementation molecule is filed.
- The dispatcher may close the decision bead after lifecycle merge using the
  close reason recorded in `jsmm-tdv.5-hackathon-mobile-decision.md`.
- Later work must begin from the unexercised text-first browser-page fallback,
  not a claim that the original live mobile/camera flow passed.
