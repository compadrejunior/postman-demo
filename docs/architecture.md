# Architecture

This API follows **Clean Architecture** with **SOLID** principles. The goal is that business rules (domain and application layers) never depend on frameworks or libraries (Express, MongoDB, JWT, bcrypt, Zod) — those live in an outer layer and are swapped out through interfaces ("ports"), never referenced directly by inner layers.

## Layers and dependency direction

```
presentation  --->  application  --->  domain
     ^                    ^
     |                    |
infrastructure ----------+
     ^
     |
composition (wires everything together)
```

Dependencies only ever point inward. `domain` depends on nothing. `application` depends only on `domain`. `presentation` and `infrastructure` depend on `application`'s ports (interfaces) but never on each other's concrete implementations. `composition` is the only module allowed to import concrete classes from every layer.

### `src/domain/`

Pure business logic and rules, with zero dependency on Node.js, Express, MongoDB, or any npm package.

- `entities/` — `User`, `Task`. Plain classes with private constructors and a `create()` factory, exposing getters. `Task.isAccessibleBy(userId, role)` is the single source of truth for the ownership/admin-bypass rule — see [Authorization](#authorization).
- `value-objects/` — `Email` (validates and normalizes), `TaskStatus`, `TaskPriority`, `UserRole` (string literal unions with type guards).
- `errors/` — `DomainError` subclasses (`TaskNotFoundError`, `UserAlreadyExistsError`, `InvalidCredentialsError`, `UnauthorizedTaskAccessError`, `InvalidEmailError`). These carry a `code` string but **no HTTP status** — HTTP is a presentation-layer concern.

### `src/application/`

Orchestrates domain objects to fulfill one use-case each. Still framework-agnostic.

- `ports/` — interfaces that infrastructure adapters implement: `UserRepository`, `TaskRepository`, `PasswordHasher`, `TokenService`, `Clock`, `IdGenerator`. This is the Dependency Inversion Principle in practice: application code depends on these abstractions, never on `mongodb`, `bcrypt`, or `jsonwebtoken` directly.
- `dtos/` — plain TypeScript interfaces for use-case input/output. **Not Zod schemas** — see [Why Zod stays at the boundary](#why-zod-stays-at-the-boundary).
- `use-cases/` — one class per use-case (`RegisterUserUseCase`, `LoginUserUseCase`, `CreateTaskUseCase`, `ListTasksUseCase`, `ListAllTasksUseCase`, `GetTaskByIdUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase`), each with a single `execute()` method (Single Responsibility Principle).

### `src/infrastructure/`

Concrete implementations of the application ports, plus process-level config. This is the only place third-party libraries are imported.

- `config/env.ts` — validates `process.env` with Zod at startup and fails fast if required variables are missing.
- `database/mongo/` — `MongoDatabase` (connection lifecycle + index setup) and `MongoUserRepository`/`MongoTaskRepository`, implementing the repository ports using the **native `mongodb` driver** (see [Why the native driver, not Mongoose](#why-the-native-driver-not-mongoose)).
- `security/` — `BcryptPasswordHasher` and `JwtTokenService`, implementing `PasswordHasher` and `TokenService`.
- `system/` — `SystemClock` and `CryptoIdGenerator`, trivial adapters that still go through a port so use-cases stay deterministic and testable (see tests using `FixedClock`/`SequentialIdGenerator`).

### `src/presentation/`

The HTTP boundary: Express routes, controllers, middlewares, and the one place Zod schemas exist.

- `schemas/` — Zod request schemas (`authSchemas.ts`, `taskSchemas.ts`).
- `validateRequest.ts` — generic middleware: `schema.safeParse(req[part])`, replaces `req[part]` with the parsed value on success, or calls `next(new RequestValidationError(...))` on failure.
- `middlewares/` — `authMiddleware` (verifies the JWT via the `TokenService` port, attaches `req.userId`/`req.userRole`), `requireRole` (route-level role gate), `errorHandler` (maps error types to HTTP status codes), `notFoundHandler`.
- `controllers/` — thin classes that call one use-case and shape the HTTP response. No business logic.
- `routes/` — Express `Router` factories, one per resource, combined in `routes/index.ts`.
- `app.ts` — an **app factory**: `createApp(controllers)` returns a configured `Express` instance without connecting to a database or calling `.listen()`, so it can be exercised directly with `supertest` in integration tests.

### `src/composition/container.ts`

The composition root. `buildContainer(db, env)` constructs every concrete adapter and wires them into the use-cases and controllers. This is the **only** file that imports concrete infrastructure classes into code that also touches use-cases/controllers — everywhere else talks through ports.

### `src/index.ts`

The process entrypoint: loads env, connects to MongoDB, builds the container, starts Express, and wires graceful shutdown (`SIGINT`/`SIGTERM`).

## Authorization

`Task.isAccessibleBy(requestingUserId, requestingUserRole)` returns `true` when the requester owns the task, or when their role is `admin`. Every task use-case that operates on a specific task id (`GetTaskByIdUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase`) calls this and throws `UnauthorizedTaskAccessError` (mapped to HTTP 403) when it returns `false`. This keeps "who can touch this resource" a **domain rule**, unit-testable without HTTP or a database.

`GET /api/tasks` is intentionally scoped to the requester's own tasks regardless of role — "see everyone's tasks" is a separate, coarser capability (`GET /api/admin/tasks`, backed by `ListAllTasksUseCase`), gated by the `requireRole("admin")` **presentation-layer** middleware. This is a deliberate distinction: per-resource ownership is a domain rule (enforced deep in the call stack, close to the entity it protects); "can you even reach this whole endpoint" is a route-level concern that doesn't need domain modeling. There is no HTTP endpoint to self-promote to admin — promoting a user is a manual database operation (see [docs/setup.md](./setup.md)) to avoid a built-in privilege-escalation path in the first slice.

## Why Zod stays at the boundary

Zod schemas exist **only** under `src/presentation/http/express/schemas/`. `validateRequest` parses `req.body`/`req.params`/`req.query` and hands controllers already-validated data, which controllers then pass into use-cases as plain DTOs. Domain and application code never import `zod` or see a `ZodError` — if Zod were replaced with another validation library tomorrow, only the `presentation` layer would change.

The one exception is `src/infrastructure/config/env.ts`, which validates `process.env` with Zod at process startup. This is still not a domain/application concern — it is infrastructure/config, just validating a different kind of external input than an HTTP request.

## Why the native driver, not Mongoose

MongoDB access uses the native `mongodb` driver, confined to `src/infrastructure/database/mongo/`, instead of Mongoose. Mongoose bakes in its own schema/casting/validation/hooks/virtuals layer on top of MongoDB — a second opinionated abstraction sitting between the driver and our own repository interface. Swapping databases later would mean unwinding both Mongoose's model layer *and* our repository interface, and the temptation to leak Mongoose-specific behavior (documents, virtuals, `.lean()`) past the repository boundary is real.

With the native driver, each repository (`MongoUserRepository`, `MongoTaskRepository`) talks in plain BSON-shaped documents only, with explicit `toDomain`/`toPersistence` mapping functions — exactly one mapping layer instead of two. The tradeoff: no schema casting/validation "for free," and index management is manual (see `MongoDatabase.ensureIndexes` in `connection.ts`). This is acceptable here because Zod already owns request-boundary validation and domain entities own their own invariants — persistence-layer validation would have been redundant.

## Error handling

- Domain errors (`DomainError` subclasses) carry a `code` but no HTTP status.
- Presentation-only errors (`RequestValidationError`, `ForbiddenError`, `UnauthenticatedError`) exist for concerns that are inherently HTTP-shaped and don't belong in the domain.
- `errorHandler` (the single Express error-handling middleware) maps error types to status codes: validation → 400, unauthenticated → 401, forbidden/unauthorized-task-access → 403, not-found → 404, already-exists → 409, anything unrecognized → 500 (logged, message never leaked to the client).

## Adding a new feature

See the `add-feature` Claude Code skill (`.claude/skills/add-feature/SKILL.md`) for a guided checklist that walks through adding a new entity/use-case/endpoint while keeping the layers honest.
