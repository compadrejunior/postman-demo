# Task Management API

A Task Management API built with Clean Architecture and SOLID principles.

## Stack

- Node.js + TypeScript
- Express
- MongoDB (native `mongodb` driver)
- Zod (request/env validation)
- JWT (`jsonwebtoken`) + `bcrypt` for auth
- Vitest (`@vitest/coverage-v8`) for testing, with a 90% coverage floor

## Setup

See [docs/setup.md](docs/setup.md) for environment variables and install/run instructions.

## Install and run

```bash
npm install
cp .env.example .env   # fill in real values, see docs/setup.md
npm run dev
```

## Documentation

- [docs/architecture.md](docs/architecture.md) — Clean Architecture layering, SOLID guidance, key design decisions
- [docs/api-reference.md](docs/api-reference.md) — endpoints, request/response shapes, status codes
- [docs/setup.md](docs/setup.md) — environment variables, install/run/build/test commands
- [docs/testing.md](docs/testing.md) — test structure, coverage policy, how to add tests for a new feature
