# S2: Does the tool layer work in the real kit?

**Time-box:** 60 min · **Needs:** S1's running kit · **Blocks:** S3

## Question

`src/loci-tools.tsx` was written against the kit's `tools.tsx` pattern but has never been compiled.
Do these assumptions hold in `@copilotkit/react-native/headless` 1.70.1 with zod 4?

| Assumption | How to check |
|---|---|
| `useFrontendTool` `render` receives `result` (object or JSON string) | Log `result` in `AskCard` |
| `useHumanInTheLoop` `render` gets `respond` only while executing, and `respond(value)` resumes the run | Commit card round-trip |
| zod `.default("")` / `.optional()` produce a tool schema the provider accepts (OpenAI strict mode rejects some optional shapes) | Watch the runtime log on the first tool call |
| `material` / `mounting` show up as JSON-schema `enum`s, not bare strings | Dump the tool schema the runtime sends |
| `useAgent` + `runAgent` from inside a tool render (`ConfirmBand`) doesn't clash with an in-flight run | Tap a candidate right after the model finishes asking |
| `CommitCard`'s preview effect runs once per draft, with no loop from fresh `args` objects | Count loci POSTs in a fake server log |

## Method

1. Import the kit at `5c8bf4c` into the matching workspace paths: `apps/mobile` (App.tsx,
   index.js, app.json, metro.config.js, and the rest of `src/`), `apps/web`, and `packages/agent-core`. Skip
   `apps/channel`. Convert the npm bits: `npm run --workspace X` becomes `pnpm --filter X` or a turbo task, and
   agent-core becomes `"agent-core": "workspace:*"` in `apps/web`. Keep the import separable for the graduation checklist.
2. Swap `<Tools/>` for `<LociTools/>`, and swap the route's prompt for `JOB_SITE_PROMPT`
   (export it from agent-core the way `./mobile-finance-prompt` is).
3. `pnpm typecheck`, then fix what breaks. If Metro can't resolve something under pnpm, check the
   hoisted `.npmrc` is in effect before touching `metro.config.js`.
4. Point `EXPO_PUBLIC_LOCI_URL` at a **local** loci (`LOCI_PATH_TOKEN=dev uv run python server.py`),
   never the shared graph, and drive observe → ask → commit (Discard once, Commit once).

## Go / no-go

- **Go:** type-checks clean, and all six rows are confirmed or fixed in about 60 min.
- **No-go:** a hook contract is fundamentally different, e.g. `respond` is unavailable in RN
  headless. Rewrite the commit gate as a plain frontend tool that returns a draft, plus a native
  confirm card outside the tool render.

## Verdict

_Fill in: which rows needed changes, and the final schema shape that worked._
