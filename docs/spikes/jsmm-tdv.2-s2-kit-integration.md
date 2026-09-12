# S2 kit-integration verdict

## Question

Can the existing `apps/mobile/src/loci-tools.tsx` tool registrations run against
`@copilotkit/react-native/headless` 1.70.1 and zod 4 without changing the
kit/product implementation, including the three rendered-tool contracts and
the strict-provider schema requirements?

This is a compatibility spike only.  It does not prove a live loci call,
provider request, Expo bundle, or device interaction.

## Method

1. Read the installed 1.70.1 RN headless declarations and the matching
   `@copilotkit/react-core/v2` implementation, then compared the existing
   Loci registrations with the real kit's `apps/mobile/src/tools.tsx`.
2. Ran a disposable Node schema probe using the *app-resolved* zod 4.6.2
   (`apps/mobile/node_modules/zod`), not the root zod 3.25.76 resolution.  It
   emitted JSON Schema for `loci_ask` as written and for the strict-safe
   nullable variant below.
3. Ran `pnpm --filter mobile typecheck`.  It reached `loci-tools.tsx` and
   found only the already-missing local `@/message-id` and `@/styles` modules;
   it reported no CopilotKit hook, render-prop, or zod type incompatibility.

No kit files were imported, no product code was changed, and no HTTP request
was sent to a shared or local loci server.

## Evidence

### Installed versions and source loci

- The mobile package declares `@copilotkit/react-native` `1.70.1` and zod
  `^4.1.0`; the installed package version is 1.70.1 and the app-resolved zod
  version is 4.6.2.
- `@copilotkit/react-native/dist/headless.d.mts` re-exports
  `useFrontendTool`, `useHumanInTheLoop`, `useAgent`, and `useCopilotKit` from
  `@copilotkit/react-core/v2/headless`.
- The real kit's `apps/mobile/src/tools.tsx` uses the same headless import and
  a `useHumanInTheLoop({ render: ({ args, respond, result }) => ... })`
  registration.  This confirms that the Loci file targets the actual kit
  pattern, rather than a web-only API.

### Six assumptions

| Assumption | Concrete evidence | Result |
| --- | --- | --- |
| 1. `useFrontendTool` render receives `result` | The 1.70.1 v2 declaration makes a completed render call `{ args, status: Complete, result: string }`; in-progress/executing calls have `result: undefined`. `AskCard` already accepts a JSON string through `parse`. | **Confirmed with a narrower contract:** completed `result` is typed as a string, not an arbitrary object. Object fallback is harmless, but must not be relied on. |
| 2. HITL `respond` is present only while executing and resumes the handler | The declaration gives `respond: (result) => Promise<void>` only to the `Executing` variant; it is `undefined` in `InProgress` and `Complete`. The installed hook implementation stores the handler promise's resolver and `respond` resolves it. | **Confirmed at hook/source level.** The existing `if (!respond)` guard matches the contract. No end-to-end runtime resume was claimed. |
| 3. zod defaults/optionals are accepted by a strict provider | The probe emits defaults as required properties, but emits `material` and `mounting` from `.optional()` outside `required`. A strict OpenAI-compatible tool schema convention requires every object property to be required, expressing absence as `null`. No configured provider/runtime exists to prove acceptance. | **No-go as written for strict mode.** Replace the two `.optional()` enums with `.nullable()` before a strict-provider run. |
| 4. `material` and `mounting` become enums | The probe emitted each as `{ type: "string", enum: [...] }`; it did not reduce either to an unconstrained string. | **Confirmed.** |
| 5. `useAgent` plus `runAgent` from `ConfirmBand` is safe after a question | `useAgent({ agentId: "default" })` is a valid v2 binding. Its declaration warns that `agent` may be a provisional instance until `isReady` is true. The current component does not check `isReady`, and there was no runtime available to establish whether a second `runAgent` conflicts with an active run. | **Unproven / no-go for a live claim.** Gate the button on `isReady` and perform one real candidate-selection smoke run before relying on it. |
| 6. `CommitCard` preview runs once per draft | `draftKey = JSON.stringify(draft)` is the effect dependency, so a fresh `args` object with identical JSON does not retrigger it; `respond` additionally prevents the call until execution. This is a sound source-level guard. No fake-server POST count was collected. | **Confirmed for the fresh-object loop mechanism; live request count remains unmeasured.** |

### Schema probe result

The as-written `loci_ask` schema had `additionalProperties: false`, retained
both enum arrays, and required `description` plus the four `.default("")`
strings.  It omitted `material` and `mounting` from `required` because they
use `.optional()`.

The strict-safe final shape is:

```ts
const material = z.enum([
  "metal_chrome_or_steel", "metal_brass_or_bronze", "metal_matte_black",
  "plastic_molded", "wood_finished", "wood_unfinished",
  "ceramic_or_porcelain", "glass", "fabric_or_upholstery", "paper_or_fiber",
  "composite_or_other",
]);
const mounting = z.enum([
  "wall_mounted", "ceiling_mounted", "freestanding_floor",
  "tabletop_or_counter", "recessed_or_built_in", "handheld_portable",
]);

const lociAskParameters = z.object({
  description: z.string(),
  place_label: z.string().default(""),
  visible_verbatim_text: z.string().default(""),
  visible_tag_code: z.string().default(""),
  object_id: z.string().default(""),
  material: material.nullable(),
  mounting: mounting.nullable(),
});
```

The probe's JSON Schema for this form has all seven properties in `required`,
`additionalProperties: false`, and `anyOf: [{ type: "string", enum: [...] },
{ type: "null" }]` for each nullable enum.  The tool handler must treat
`null` as absent.  This is a proposed minimal graduation fix, not a change
made by this spike.

### Validation limitation

`pnpm --filter mobile typecheck` currently fails with only:

```
src/loci-tools.tsx(18,37): error TS2307: Cannot find module '@/message-id'
src/loci-tools.tsx(19,24): error TS2307: Cannot find module '@/styles'
```

Those two modules are absent from the baseline.  They prevent a green whole
mobile typecheck but do not demonstrate a kit-hook incompatibility.

## Verdict

**NO-GO for importing/running the current Loci tool layer unchanged.**

The RN 1.70.1 headless contracts themselves are compatible with the existing
render and HITL design, and the enum generation is correct.  However, two
requirements remain unproven or incorrect for a real strict-provider run:
the current optional enum fields produce a non-strict schema, and the nested
`runAgent` path has no readiness or live-conflict evidence.  S1 also remains
a separate environment NO-GO for the camera/vision route; this spike does not
change that text-first recommendation.

## Recommendation

For the MVP, keep the source import separable and do not attempt the complete
kit migration during this spike.  Before S3 relies on the tool layer, make the
smallest targeted graduation changes: restore the two missing app modules,
use the nullable strict schema above, guard `ConfirmBand` on `isReady`, and
run exactly one local text-only observe -> ask -> preview -> discard/commit
smoke flow against a local loci.  Record the actual provider schema and
runtime result there.  If that smoke run shows a nested-run conflict, replace
the candidate button flow with a native confirmation outside the tool render,
as the spike plan specifies.
