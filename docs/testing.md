# Testing

## Running tests

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # run once with a coverage report + threshold enforcement
```

## Structure

Tests live under `tests/`, mirroring `src/`'s layer structure:

- `tests/unit/domain/**` — entities and value objects, no test doubles needed (pure logic).
- `tests/unit/application/use-cases/**` — one test file per use-case, exercised against hand-written fakes of each port (`tests/unit/_fakes/`: `FakeUserRepository`, `FakeTaskRepository`, `FakePasswordHasher`, `FakeTokenService`, `FixedClock`, `SequentialIdGenerator`). Use-cases never touch a real database or bcrypt/jwt in unit tests.
- `tests/unit/infrastructure/**` — infrastructure classes that don't need a real MongoDB (`env.ts`, `JwtTokenService`).
- `tests/unit/presentation/**` — middlewares tested with lightweight hand-built `Request`/`Response` doubles.
- `tests/integration/infrastructure/database/**` — `MongoUserRepository`/`MongoTaskRepository` against a real (ephemeral) MongoDB via `mongodb-memory-server`. No network access or Docker required.
- `tests/integration/http/**` — full HTTP flows via `supertest` against the `createApp()` factory, backed by the same in-memory MongoDB, covering the golden paths and the authorization rules (ownership, admin bypass, role-gated `/admin/tasks`) end-to-end.

## Coverage policy

`vitest.config.ts` enforces a **minimum 90%** threshold on lines, functions, branches, and statements (`@vitest/coverage-v8`). A coverage run that falls below any of these fails with a non-zero exit code. This is a floor for the codebase as a whole, and any new feature is expected to keep the whole-repo numbers at or above it — don't add code that drags the total below 90% and call it done.

`src/index.ts` and `src/composition/**` are excluded from coverage (see `coverage.exclude` in `vitest.config.ts`). These are wiring/bootstrap code — the composition root that constructs concrete adapters, and the process entrypoint that connects to a real database and starts listening. They're inherently hard to unit-test meaningfully (the alternative is mocking every constructor call, which tests the mocks, not the code) and are exercised for real by the manual smoke test described in the plan/PR instead. This exclusion is called out explicitly here rather than silently — do not add business logic to these files as a way to dodge coverage.

## Adding tests for a new feature

1. New use-case → a unit test file next to the existing ones in `tests/unit/application/use-cases/`, using the existing fakes (add a new fake to `tests/unit/_fakes/` only if the use-case needs a port none of the existing tests exercise).
2. New repository method or a new infrastructure adapter → an integration test in `tests/integration/infrastructure/`.
3. New HTTP route → extend the relevant file in `tests/integration/http/`, covering the happy path and every distinct error status the route can return (400/401/403/404/409 as applicable).
4. Run `npm run test:coverage` before committing — see [Coverage enforcement](#coverage-enforcement) for what happens if you don't.

## Coverage enforcement

Enforcement happens at **three** layers, and it's worth understanding why each one exists:

1. **`.husky/pre-commit`** (the local gate): runs `npm run test:coverage` on every `git commit`, for anyone — a human typing `git commit` in a terminal, or Claude Code running the same command through its `Bash` tool. This is the only *local* mechanism that reliably blocks a commit regardless of who or what initiates it, because it runs at the actual git hook boundary.
2. **The Claude Code `PreToolUse` hook** in `.claude/settings.json` (a convenience layer): matches `Bash` tool calls that look like `git commit` and runs the same coverage check *before* Claude even attempts the commit, so a session doesn't waste a turn on a commit that husky would reject anyway.
3. **GitHub Actions CI** (`.github/workflows/ci.yml`, the network-enforced gate): runs lint, `test:coverage`, and build on every pull request and on pushes to `master`/`develop`, and also builds and smoke-tests the production Docker image. This is the layer that closes the gap the first two can't: `git commit --no-verify` skips husky, and hooks only apply to Claude Code's own session-driven Bash calls — but neither bypass avoids CI, since it runs on GitHub's infrastructure independent of how the commit was made. Pair it with a branch protection rule requiring the CI check to pass before merge (tracked as story US-012 under the "CI Pipeline" epic in `docs/project/epics.md`) so the gate can't be skipped by a fast-forward or admin merge either.

A `docker-compose.test.yml`-driven container run (`docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm api`) is also available as a clean-room reproduction of what CI runs, useful for debugging a CI failure locally. It does **not** replace `mongodb-memory-server` for the test suite itself — the suite doesn't need a real MongoDB to pass; the containerized `mongo` service exists for environment parity, not because the tests require it.
