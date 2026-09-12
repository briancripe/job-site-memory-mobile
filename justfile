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

# Run the hackathon validation gate against the currently supported test surface.
check: setup
    pnpm test
