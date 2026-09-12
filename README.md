# job-site-memory-mobile

Phone client for [0xL0C1](https://github.com/LincForge/0xl0c1) job memory. A trade tech snaps an object,
dictates a question, and gets back an arrival brief. When two objects look alike, it asks which one
(the confirm band). Nothing is saved until the tech taps Commit.

Prototype: local-only, not yet built against the kit. See [docs/DESIGN.md](docs/DESIGN.md).

## Pixel browser MVP

Run the dependency-free, throwaway demo from the repository root:

```bash
pnpm pixel
```

It listens on `0.0.0.0:8787`. Set `PORT` to choose another port. Set `LOCI_MCP_URL` to an MCP
HTTP endpoint to proxy `observe`, `ask`, and preview/commit calls server-side; the URL is never
sent to the browser. Without it, seeded and newly observed records live only in process memory.

Hackathon Pixel handoff on this Tailscale host:

```bash
PORT=8796 HOST=0.0.0.0 pnpm pixel
```

Open `http://100.116.151.118:8796/` on the Pixel while it is connected to the tailnet.

## Layout

| File | Role |
|---|---|
pnpm workspace plus Turborepo (`apps/*`, `packages/*`), with pnpm pinned by `packageManager`.

| File | Role |
|---|---|
| `apps/mobile/src/loci.ts` | One-POST JSON-RPC client for loci plus the structural write gate (`commitPreview` / `commitSave`) |
| `apps/mobile/src/loci.check.ts` | Run by `pnpm test`. Checks error unwrapping and the dry-run gate |
| `apps/mobile/src/loci-tools.tsx` | CopilotKit tool registrations and cards. Replaces the starter kit's `apps/mobile/src/tools.tsx`. |
| `packages/agent-core/src/job-site-prompt.ts` | Runtime prompt. Replaces `MOBILE_FINANCE_PROMPT` in the kit's `/api/mobile-copilotkit` route. |

```bash
pnpm install
pnpm test                    # turbo run test
pnpm typecheck               # turbo run typecheck (red until the kit's app shell is imported, see S2)
pnpm --filter mobile ios     # after S2
```

## Next build steps

1. Import the kit at `5c8bf4c` into the same paths: `apps/mobile`, `apps/web`, and `packages/agent-core`. Leave out `apps/channel`.
   Convert its npm workspace scripts to pnpm/turbo tasks ([S2](docs/spikes/S2-kit-integration.md)).
2. Add an `expo-camera` snap button to the composer and send `{type:"image"}` content parts. This is risk #1 in the design doc.
3. Set `EXPO_PUBLIC_LOCI_URL` and `EXPO_PUBLIC_RUNTIME_URL`, then run the twin-valve script from loci's `SATURDAY.md` §4.
