# job-site-memory-mobile

Phone client for [0xL0C1](https://github.com/LincForge/0xl0c1) job memory. A trade tech snaps an object,
dictates a question, and gets back an arrival brief. When two objects look alike, it asks which one
(the confirm band). Nothing is saved until the tech taps Commit.

Prototype: local-only, not yet built against the kit. See [docs/DESIGN.md](docs/DESIGN.md).

## Pixel browser MVP

Run the dependency-free Pixel bridge from the repository root. Both URLs stay in the server
environment and are never sent to the phone; the remote runtime owns its model and Ambiguous
credentials.

```bash
COPILOTKIT_RUNTIME_URL=http://<runtime-host>:3100/api/copilotkit \
LOCI_MCP_URL=https://<loci-host>/loci-<capability>/mcp \
pnpm pixel
```

It listens on `0.0.0.0:8787`. `COPILOTKIT_RUNTIME_URL` is the existing CopilotKit base route;
the server appends `/agent/default/run`. `LOCI_MCP_URL` is used server-side for candidate
confirmation and preview/Commit. Without those variables the page reports the missing connection;
its old process-memory fallback remains useful only for UI work.

Hackathon Pixel handoff on this Tailscale host:

```bash
COPILOTKIT_RUNTIME_URL=http://100.116.151.118:3100/api/copilotkit \
PORT=8796 HOST=0.0.0.0 pnpm pixel
```

Open `http://100.116.151.118:8796/` on the Pixel while it is connected to the tailnet.
Enter the room/zone, tap **Take or choose a photo**, then **Identify object & pull handoff**.
If Loci returns visually similar objects, tap the correct candidate; that tap resolves by its
`object_id`. To save a new lesson, preview it and then tap **Commit explicitly**.

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
