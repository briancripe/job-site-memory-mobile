# Install the locked workspace dependencies for clean-checkout validation.
setup:
    pnpm install --frozen-lockfile

# Validate the dependency-free Pixel page. It is served directly and has no bundle artifact.
build:
    node --check apps/pixel-web/server.mjs
    test -s apps/pixel-web/index.html

# Run the Pixel page locally at http://127.0.0.1:8787.
pixel host="127.0.0.1" port="8787":
    HOST="{{host}}" PORT="{{port}}" pnpm pixel

# Run the Pixel page for tailnet devices at http://<tailscale-ip>:8796.
pixel-tailscale port="8796":
    HOST="0.0.0.0" PORT="{{port}}" pnpm pixel

# Run against a real Loci MCP endpoint instead of throwaway in-memory data.
pixel-loci loci_url host="127.0.0.1" port="8787":
    LOCI_MCP_URL="{{loci_url}}" HOST="{{host}}" PORT="{{port}}" pnpm pixel

# Verify a running Pixel page. Override base_url for another host or port.
pixel-health base_url="http://127.0.0.1:8787":
    curl --fail --silent --show-error "{{base_url}}/health"

# Run the workspace test suite.
test:
    pnpm test

# Run type checks explicitly; this remains red until S2 imports the kit shell.
typecheck: setup
    pnpm typecheck

# Run the existing dependency-free hackathon check without provisioning the unused Expo tree.
check:
    node --experimental-strip-types apps/mobile/src/loci.check.ts
