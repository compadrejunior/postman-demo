# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a Task Management API (Tasks + Users + Auth) built with Node.js, TypeScript, Express, and MongoDB (native driver), following Clean Architecture and SOLID principles. See [docs/architecture.md](docs/architecture.md) for the full layering rationale — read it before adding or restructuring anything in `src/`.

## Non-negotiable rules

- **Dependency direction:** `domain` depends on nothing; `application` depends only on `domain`; `presentation` and `infrastructure` depend only on `application`'s ports (interfaces), never on each other's concrete classes. `src/composition/container.ts` is the only file allowed to import concrete infrastructure classes alongside use-cases/controllers. If you find yourself importing `mongodb`, `bcrypt`, `jsonwebtoken`, or `zod` (outside `presentation/http/express/schemas/` or `infrastructure/config/env.ts`) into `src/domain/` or `src/application/`, stop — that's the boundary being violated.
- **Zod stays at the boundary.** Zod schemas live only in `src/presentation/http/express/schemas/` (plus `src/infrastructure/config/env.ts` for env validation). Use-cases and domain entities take/return plain TypeScript types, never Zod-inferred types or `ZodError`.
- **Authorization is a domain rule, not a controller `if`.** Per-resource ownership checks go through `Task.isAccessibleBy(userId, role)`, called from the use-case, not sprinkled across controllers/middlewares. Route-level (not resource-level) access control, like "must be admin to hit this endpoint at all", is the one thing that legitimately lives in presentation middleware (`requireRole`).
- **90% coverage floor, enforced.** `npm run test:coverage` must pass (lines/functions/branches/statements all ≥ 90%) before committing. This is enforced by a `.husky/pre-commit` hook and backed up by a Claude Code `PreToolUse` hook on `git commit` (`.claude/settings.json`) — see [docs/testing.md](docs/testing.md) for what each layer actually does and does not guarantee.
- **TypeScript strictness stays on.** `tsconfig.json` has `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, and `isolatedModules` enabled. Use `import type` for type-only imports, don't rely on loose indexed access, and don't pass `undefined` explicitly for an optional property — build the object conditionally instead (see `UpdateTaskUseCase.execute` for the pattern).

## Git workflow

- **Never commit directly to `master`.** Every change — including a Claude Code session's own work — goes on a branch and gets merged in (PR or local merge), never committed straight to `master`. If you're on `master` and about to make changes, create and switch to the appropriate branch first.
- **Follow Gitflow branch naming.** Branch off `master`/`develop` (whichever this repo is using as its base) using the standard Gitflow prefixes:
  - `feature/<short-description>` — new functionality (e.g. `feature/task-comments`, `feature/admin-task-filters`)
  - `bugfix/<short-description>` — non-urgent fixes on `develop`
  - `hotfix/<short-description>` — urgent fixes cut from `master`/a release
  - `release/<version>` — release stabilization branches
  - Use kebab-case for the description, and keep it specific to what the branch actually does — not the ticket number alone, not "fixes" or "updates".
- **One branch per context.** Each distinct implementation (a feature, a fix, a refactor) gets its own branch scoped to that piece of work — don't pile unrelated changes from different tasks onto the same branch. If a session's work naturally splits into unrelated concerns, branch accordingly rather than bundling them.

## SDLC stages

Upcoming work is tracked as Epics and User Stories in a local, adapted copy of Docket Agentic SDLC (github.com/compadrejunior/docket-pub) — the upstream repository is never modified. This project's own 5-stage SDLC, **Plan → Build → Test → PR → Deploy**, is authoritative and locally overrides Docket's stock flow; see [docs/project/SDLC.md](docs/project/SDLC.md) for the full definition. A story's stage is never a frontmatter field — it's which folder it sits in under `docs/stories/` (`1. PLAN` through `6. ARCHIVED`), regenerated into `docs/project/DASHBOARD.md`/`ROADMAP.md` by `node scripts/pm/generate-dashboard.mjs`. Move stories with the `/story-start`, `/story-advance`, and `/story-done` skills — never by hand-editing the generated dashboard/roadmap/metrics files.

## Docker

Both the API and MongoDB run as containers in every environment — dev, test, and prod — via a shared `docker-compose.yml` base plus a `docker-compose.<env>.yml` override (see [docs/setup.md](docs/setup.md#running-with-docker) for the exact commands). The multi-stage `Dockerfile`'s `build` target must keep the full `node_modules` (including devDependencies), since the dev and test overrides both run from that target rather than the slimmer production `runtime` target — don't prune devDependencies out of `build` when touching the Dockerfile.

## Adding a feature

Use the `add-feature` skill (`.claude/skills/add-feature/SKILL.md`) — it walks through the layer-by-layer checklist (domain → application → infrastructure → presentation → composition → tests → docs) so new work follows the same structure as the existing code instead of improvising a shortcut through the layers.

## Key docs

- [docs/architecture.md](docs/architecture.md) — layering, dependency-inversion rationale, why the native MongoDB driver over Mongoose, why Zod stays at the boundary, authorization model
- [docs/api-reference.md](docs/api-reference.md) — endpoints and error codes
- [docs/setup.md](docs/setup.md) — env vars, install/run/build commands, how to promote a user to admin, Docker usage
- [docs/testing.md](docs/testing.md) — test structure, coverage policy, three-layer enforcement (husky, Claude Code hook, CI)
- [docs/project/SDLC.md](docs/project/SDLC.md) — this project's 5-stage SDLC and its Docket-based tracking
- [docs/project/epics.md](docs/project/epics.md) — canonical epic taxonomy for the story backlog
