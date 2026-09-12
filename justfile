# Install the locked workspace dependencies for clean-checkout validation.
setup:
    pnpm install --frozen-lockfile

# Run the workspace build task.
build:
    pnpm exec turbo run build

# Run the workspace test suite.
test:
    pnpm test

# Run type checks explicitly; this remains red until S2 imports the kit shell.
typecheck: setup
    pnpm typecheck

# Run the existing dependency-free hackathon check without provisioning the unused Expo tree.
check:
    node --experimental-strip-types apps/mobile/src/loci.check.ts
