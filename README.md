# Job Site Memory Mobile

A text-first, mobile-friendly job-memory page for field technicians. The current hackathon MVP
runs in Chrome on a Google Pixel; it does not require a native app build.

The page can observe an object, look up matching job memory, resolve ambiguous candidates, preview
a lesson, discard it, or save it after an explicit **Commit** tap. It runs with throwaway in-memory
data by default and can proxy the same operations to a configured 0xL0C1 MCP endpoint.

## Current state

- The working MVP is `apps/pixel-web`: one HTML page and a Node HTTP server with no browser build
  pipeline.
- The default demo store is process memory. Restarting the server clears observed objects and
  lessons.
- A preview token is required before commit, is single-use, and expires after ten minutes.
- The optional `LOCI_MCP_URL` stays on the server and is never sent to the browser.
- Camera, vision, native packaging, authentication, and production persistence are out of scope.
- `apps/mobile` contains the earlier React Native/CopilotKit integration prototype. It is not the
  page served by the current MVP, and its whole-package typecheck remains incomplete.

The feasibility history and scope decision are recorded in
[`docs/design/ADR-0001-hackathon-mobile-no-go.md`](docs/design/ADR-0001-hackathon-mobile-no-go.md).

## Prerequisites

- Node.js 22 or newer
- pnpm 9.12
- [`just`](https://just.systems/) for the documented recipes
- Tailscale on both devices only when opening the page from a Pixel over the tailnet

Install the locked workspace dependencies once:

```bash
just setup
```

## Build

The Pixel page is served directly, so there is no generated bundle. The build recipe validates the
server's JavaScript syntax and confirms the page asset exists:

```bash
just build
```

## Run locally

Start a localhost-only development server:

```bash
just pixel
```

Open <http://127.0.0.1:8787/>. The default mode is clearly labeled **THROWAWAY DEMO** in the page.

The recipe accepts optional host and port arguments:

```bash
just pixel 127.0.0.1 9000
```

In another terminal, verify the running server:

```bash
just pixel-health
just pixel-health http://127.0.0.1:9000
```

A successful response resembles:

```json
{"ok":true,"mode":"throwaway-demo","host":"127.0.0.1","port":8787}
```

## Run on a Pixel through Tailscale

Start the server on all host interfaces using the dedicated tailnet recipe:

```bash
just pixel-tailscale
```

Find the host's current tailnet address with `tailscale ip -4`, then open
`http://<tailscale-ip>:8796/` on a Pixel connected to the same tailnet. On the current hackathon
host, the URL is <http://100.116.151.118:8796/>.

Verify that exact route from the host with:

```bash
just pixel-health http://100.116.151.118:8796
```

Binding to `0.0.0.0` makes the process reachable on every permitted host interface. Use the
localhost recipe when tailnet access is not needed.

## Run with a real Loci endpoint

Pass the MCP HTTP endpoint to the server-side proxy:

```bash
just pixel-loci "https://example.invalid/loci-token/mcp"
```

Optional host and port arguments follow the URL:

```bash
just pixel-loci "https://example.invalid/loci-token/mcp" 0.0.0.0 8796
```

In Loci mode, `observe`, `ask`, preview, and commit are forwarded as JSON-RPC `tools/call`
requests. Do not put the endpoint or its token in browser code or commit it to the repository.

## Functional verification

No new automated test suite is required for this hackathon page. After starting it, verify the
actual flow in the browser:

1. Confirm the mode badge says **THROWAWAY DEMO** or **LOCI MCP**.
2. Observe an object and confirm an `observed` response.
3. Ask memory, choose a candidate when prompted, and confirm it resumes the selected object.
4. Preview a lesson, then verify **Discard** reports `saved: false`.
5. Preview again and tap **Commit explicitly**; verify it reports `saved: true`.

The existing narrow transport/write-gate check remains available as `just check`. It is not a
browser test and does not replace the manual page flow.

## Recipes

| Recipe | Purpose |
| --- | --- |
| `just setup` | Install exactly the dependencies in `pnpm-lock.yaml`. |
| `just build` | Validate the server syntax and static page asset. |
| `just pixel [host] [port]` | Run the page locally; defaults to `127.0.0.1:8787`. |
| `just pixel-tailscale [port]` | Bind to `0.0.0.0`; defaults to port `8796`. |
| `just pixel-loci <url> [host] [port]` | Run with a server-side Loci MCP proxy. |
| `just pixel-health [base_url]` | Check the health endpoint of a running page. |
| `just check` | Run the existing focused write-gate check. |
| `just test` | Run the pre-existing workspace test command. |
| `just typecheck` | Run the prototype workspace typecheck; currently incomplete. |

## Layout

| Path | Role |
| --- | --- |
| `apps/pixel-web/index.html` | Responsive Pixel UI and browser interactions. |
| `apps/pixel-web/server.mjs` | Static server, demo memory, Loci proxy, and preview/commit gate. |
| `apps/mobile/src/loci.ts` | Earlier React Native Loci client and structural write helpers. |
| `apps/mobile/src/loci-tools.tsx` | Earlier CopilotKit tool/card prototype. |
| `docs/design/` | Architecture decisions and the spike conclusion. |
| `docs/spikes/` | Evidence gathered before narrowing the MVP. |
