# Run the workspace build task.
build:
    pnpm exec turbo run build

# Run the workspace test suite.
test:
    pnpm test

# Run the validation gate: type checks followed by tests.
check:
    pnpm typecheck
    pnpm test
