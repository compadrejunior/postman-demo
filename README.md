# Task Management API

A Task Management API (Tasks + Users + Auth) built with Node.js, TypeScript, Express, and MongoDB (native driver), following Clean Architecture and SOLID principles. It started as a scaffold for Postman demos and has since grown a full auth + task-ownership model with a strict layering discipline enforced by both tooling and Claude Code hooks.

## Features

- **Auth** — register/login with email + password, JWT-based sessions, `bcrypt` password hashing.
- **Tasks** — create, list, get by id, update, delete, scoped to the authenticated user.
- **Roles** — `user` and `admin`. Admins can list all tasks (`GET /api/admin/tasks`); ordinary users only ever see their own.
- **Authorization as a domain rule** — per-resource ownership (`Task.isAccessibleBy`) lives in the domain layer, not scattered across controllers.
- **Request/env validation at the boundary** — Zod schemas validate HTTP input and `process.env`; the rest of the codebase works with plain TypeScript types.
- **90% enforced test coverage** — lines/functions/branches/statements, backed by a pre-commit hook.

## Stack

- Node.js + TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`)
- Express 5
- MongoDB (native `mongodb` driver — no Mongoose, see [docs/architecture.md](docs/architecture.md#why-the-native-driver-not-mongoose))
- Zod (request/env validation)
- JWT (`jsonwebtoken`) + `bcrypt` for auth
- Vitest (`@vitest/coverage-v8`) for testing, `supertest` for HTTP integration tests, `mongodb-memory-server` for a real-but-ephemeral database in tests
- ESLint + Prettier, Husky pre-commit hook

## Architecture at a glance

```
presentation  --->  application  --->  domain
     ^                    ^
     |                    |
infrastructure ----------+
     ^
     |
composition (wires everything together)
```

- `src/domain/` — entities, value objects, domain errors. Zero third-party dependencies.
- `src/application/` — use-cases and ports (interfaces). Depends only on `domain`.
- `src/infrastructure/` — concrete adapters (MongoDB repositories, bcrypt, JWT, env config). Implements `application`'s ports.
- `src/presentation/` — Express routes, controllers, middlewares, and the only Zod request schemas.
- `src/composition/container.ts` — the sole file allowed to import concrete infrastructure classes alongside use-cases/controllers.

This dependency direction is a hard rule, not a convention — see [Non-negotiable rules](#non-negotiable-rules) below and the full rationale in [docs/architecture.md](docs/architecture.md).

## Setup

See [docs/setup.md](docs/setup.md) for environment variables, install/run/build commands, and how to promote a user to admin.

## Install and run

```bash
npm install
cp .env.example .env   # fill in real values, see docs/setup.md
npm run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage; must pass the 90% floor before committing |
| `npm run lint` | Lint the codebase |
| `npm run format` | Format with Prettier |

## Documentation

- [docs/architecture.md](docs/architecture.md) — Clean Architecture layering, dependency-inversion rationale, why the native MongoDB driver over Mongoose, why Zod stays at the boundary, authorization model
- [docs/api-reference.md](docs/api-reference.md) — endpoints, request/response shapes, status codes
- [docs/setup.md](docs/setup.md) — environment variables, install/run/build/test commands, promoting a user to admin
- [docs/testing.md](docs/testing.md) — test structure, coverage policy, dual-layer hook enforcement, how to add tests for a new feature

## Working on this project (for contributors and AI agents)

This repo is set up to be worked on by Claude Code, so the rules below apply to human contributors and agents alike:

- **[CLAUDE.md](CLAUDE.md)** is the source of truth for non-negotiable rules (dependency direction, Zod boundary, authorization-as-domain-rule, 90% coverage floor, TypeScript strictness) and the Gitflow branch-naming convention (`feature/`, `bugfix/`, `hotfix/`, `release/`). Read it before making structural changes.
- **Adding a feature?** Use the `add-feature` Claude Code skill (`.claude/skills/add-feature/SKILL.md`) — it walks through the layer-by-layer checklist (domain → application → infrastructure → presentation → composition → tests → docs) instead of improvising a shortcut through the layers.
- **Never commit directly to `master`.** All work — human or agent — goes on a branch and gets merged via PR.
- **Coverage is enforced twice**: a `.husky/pre-commit` hook runs `npm run test:coverage`, and a Claude Code `PreToolUse` hook (`.claude/settings.json`, `.claude/hooks/check-before-commit.sh`) backs it up on `git commit`.

### Non-negotiable rules

1. **Dependency direction**: `domain` depends on nothing; `application` depends only on `domain`; `presentation` and `infrastructure` depend only on `application`'s ports, never on each other's concrete classes.
2. **Zod stays at the boundary**: only in `src/presentation/http/express/schemas/` and `src/infrastructure/config/env.ts`.
3. **Authorization is a domain rule**: per-resource checks go through `Task.isAccessibleBy(userId, role)`, called from the use-case — never a controller `if`. Route-level access control (e.g. "must be admin to hit this endpoint") is the one thing that legitimately lives in presentation middleware (`requireRole`).
4. **90% coverage floor**, enforced by tooling, not just convention.
5. **TypeScript strictness stays on** — see `tsconfig.json`.

See [CLAUDE.md](CLAUDE.md) for the full detail behind each rule.
