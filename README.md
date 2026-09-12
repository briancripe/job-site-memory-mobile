# Job Site Memory Mobile

A camera-enabled, mobile-friendly job-memory page for field technicians. The hackathon MVP runs in
Chrome on a Google Pixel; it does not require a native app build.

The technician photographs an object and supplies its room or zone. A connected vision agent
describes the object and transcribes its visible stamps, then asks 0xL0C1 for the matching history.
Loci returns the diagnosis, required part, and open question—or asks the technician to choose when
two physical objects are too similar. Nothing is saved until the technician previews and explicitly
commits the lesson.

## Current state

- The working MVP is `apps/pixel-web`: one HTML page and a Node HTTP server with no browser build
  pipeline.
- Images go server-side to the configured CopilotKit vision runtime. Loci receives only the
  model-produced text fingerprint and the place the technician supplied.
- `COPILOTKIT_RUNTIME_URL` and `LOCI_MCP_URL` remain in the Node server environment and are never
  sent to the browser. The runtime owns its model and Ambiguous credentials.
- Candidate confirmation re-queries Loci by the technician-selected `object_id`; the page never
  silently chooses between twins.
- A preview token is required before commit, is single-use, and expires after ten minutes.
- Without the remote URLs, the server remains useful for local UI work but cannot run the complete
  image-to-handoff path.
- `apps/mobile` contains the earlier React Native/CopilotKit prototype. It is not the page served by
  the browser MVP, and its whole-package typecheck remains incomplete.

The feasibility history and earlier scope decision are recorded in
[`docs/design/ADR-0001-hackathon-mobile-no-go.md`](docs/design/ADR-0001-hackathon-mobile-no-go.md).
The Pixel bridge is the later, verified hackathon path.

## Prerequisites

- Node.js 22 or newer
- pnpm 9.12
- [`just`](https://just.systems/)
- Tailscale on both devices when opening the page from a Pixel over the tailnet

Install the locked workspace dependencies once:

```bash
just setup
```

## Build

The Pixel page is served directly, so there is no generated bundle. This validates the server syntax
and static page asset:

```bash
just build
```

## Run the connected bridge

Provide the existing CopilotKit route and Loci MCP capability URL to the Node server:

```bash
COPILOTKIT_RUNTIME_URL=http://<runtime-host>:3100/api/copilotkit \
LOCI_MCP_URL=https://<loci-host>/loci-<capability>/mcp \
just pixel
```

Open <http://127.0.0.1:8787/>. The runtime URL is normalized to its
`/agent/default/run` endpoint automatically.

For the current hackathon Tailscale host:

```bash
COPILOTKIT_RUNTIME_URL=http://100.116.151.118:3100/api/copilotkit \
LOCI_MCP_URL=https://<loci-host>/loci-<capability>/mcp \
just pixel-tailscale
```

Open <http://100.116.151.118:8796/> on the tailnet-connected Pixel. Replace the address with the
current result of `tailscale ip -4` when running on another host.

Verify the server-side connections:

```bash
just pixel-health http://100.116.151.118:8796
```

A fully connected response reports `"mode":"vision+loci"`.

## Demo flow

1. Enter the exact room or zone; Loci never infers location.
2. Tap **Take or choose a photo**, frame the object and any stamped text, then tap
   **Identify object & pull handoff**.
3. If Loci returns similar objects, tap the correct candidate. The app resolves it using that
   candidate's stable `object_id`.
4. Show the arrival card: object, diagnosis, required part, and open question.
5. Enter the new field result and tap **Preview lesson (nothing saved)**.
6. Tap **Discard** to prove the write gate, or **Commit explicitly** to save the handoff.

Run the focused transport, response-adapter, ambiguity, and write-gate checks with:

```bash
just check
```

## Recipes

| Recipe | Purpose |
| --- | --- |
| `just setup` | Install exactly the dependencies in `pnpm-lock.yaml`. |
| `just build` | Validate the server syntax and static page asset. |
| `just pixel [host] [port]` | Run the page locally; defaults to `127.0.0.1:8787`. |
| `just pixel-tailscale [port]` | Bind to `0.0.0.0`; defaults to port `8796`. |
| `just pixel-loci <url> [host] [port]` | Run with a server-side Loci MCP proxy. |
| `just pixel-health [base_url]` | Check a running page's health endpoint. |
| `just check` | Run focused mobile and Pixel bridge checks. |
| `just test` | Run the pre-existing workspace test command. |
| `just typecheck` | Run the prototype workspace typecheck; currently incomplete. |

## Layout

| Path | Role |
| --- | --- |
| `apps/pixel-web/index.html` | Responsive camera UI, confirmation band, and explicit commit controls. |
| `apps/pixel-web/server.mjs` | Static server, vision-runtime bridge, Loci proxy, and preview/commit gate. |
| `apps/pixel-web/loci-response.mjs` | Deployed/original Loci response normalization and AG-UI event parsing. |
| `apps/mobile/src/loci.ts` | Earlier React Native Loci client and structural write helpers. |
| `apps/mobile/src/loci-tools.tsx` | Earlier CopilotKit tool/card prototype. |
| `docs/design/` | Architecture decisions and earlier scope history. |
| `docs/spikes/` | Feasibility evidence gathered before the browser bridge. |
