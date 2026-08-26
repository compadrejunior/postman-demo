---
name: add-feature
description: Scaffold a new domain entity, use-case, repository method, or HTTP endpoint in this Task Management API following its existing Clean Architecture layering, and self-review the result against SOLID/layering rules before calling it done.
---

# Add a feature

This project (see `docs/architecture.md`) is layered as `domain -> application -> infrastructure/presentation -> composition`, with dependencies only ever pointing inward. Use this checklist whenever you add a new entity, use-case, repository method, or endpoint — it exists so new work doesn't quietly cut through the layers even when that would be faster in the moment.

## 1. Start in `domain/` if this introduces a new concept

- New entity → `src/domain/entities/<Name>.ts`: private constructor + `create()` factory, getters, no framework imports.
- New constrained value → `src/domain/value-objects/<Name>.ts`: either a validating class (like `Email`) or a literal-union type + type guard (like `TaskStatus`).
- New business-rule failure → `src/domain/errors/<Name>Error.ts`, extending `DomainError`, with a `code` and no HTTP status.
- If the new concept has an authorization rule (who can touch it), put that rule as a method on the entity itself (see `Task.isAccessibleBy`), not in a use-case or controller.

Skip this step if you're adding a use-case for an existing entity.

## 2. Application layer

- New port needed (e.g. calling a new external capability)? Add an interface to `src/application/ports/`. Application/domain code must depend on this interface, never on the concrete library.
- Add input/output DTOs to `src/application/dtos/` as **plain TypeScript interfaces** — not Zod-inferred types, not framework request/response types.
- Add the use-case class to `src/application/use-cases/<area>/`, one class, one `execute()` method. Constructor-inject only the ports it needs.
- Unit-test it immediately in `tests/unit/application/use-cases/<area>/`, against fakes in `tests/unit/_fakes/` (add a new fake there if an existing one doesn't cover the new port).

## 3. Infrastructure layer (only if you added a port)

- Implement the port in `src/infrastructure/<area>/<ConcreteName>.ts`. This is the only layer allowed to import the third-party library.
- If it's a new Mongo repository method: keep the `toDomain`/`toPersistence` mapping pattern from `MongoUserRepository`/`MongoTaskRepository` — the repository never returns a raw MongoDB document past its own boundary.
- Integration-test it in `tests/integration/infrastructure/` against `mongodb-memory-server` if it touches the database.

## 4. Presentation layer (only if this is exposed over HTTP)

- Request shape → a Zod schema in `src/presentation/http/express/schemas/`. This is the **only** place Zod validation belongs (plus `infrastructure/config/env.ts` for env vars) — do not import Zod into application/domain code.
- Controller method → thin: build the use-case input from `req`, call `execute()`, shape the response. No business logic, no direct database/library calls.
- Route → wire `validateRequest(schema, part)` and, if the route needs auth, `authMiddleware`; if it needs a route-level role gate (not a per-resource ownership check — that's a domain rule), use `requireRole(...)`.
- New domain error needs an HTTP mapping? Add it to `STATUS_BY_ERROR` in `src/presentation/http/express/middlewares/errorHandler.ts` rather than special-casing it in the controller.

## 5. Composition root

- Wire the new use-case/controller/adapter in `src/composition/container.ts`. This is the only file allowed to import concrete classes from every layer at once.

## 6. Tests and coverage

- Unit tests for the use-case (step 2) and any new domain logic (step 1).
- Integration tests for any new repository method or infrastructure adapter (step 3).
- HTTP integration test in `tests/integration/http/` covering the happy path and every distinct error status the new route can return, if you added an endpoint.
- Run `npm run test:coverage` — it must stay ≥ 90% across lines/functions/branches/statements (`vitest.config.ts`). See `docs/testing.md` for what's excluded and why.

## 7. Docs

- New endpoint → add it to `docs/api-reference.md` (request/response shape, status codes).
- New architectural decision (a new port, a new library, a new cross-cutting rule) → add a short section to `docs/architecture.md` explaining the *why*, following the existing "Why X, not Y" pattern used for the native driver / Zod-at-the-boundary decisions.

## Self-review before calling it done

Before considering the feature complete, check it against these — they're the actual substance of "Clean Architecture and SOLID" for this project, not the checklist above by itself:

- **Dependency direction:** does anything in `domain/` or `application/` import from `infrastructure/` or `presentation/`, or import a third-party library directly (other than the plain-TS-interface pattern already established)? If so, invert it — the inner layer should define a port, the outer layer should implement it.
- **Single Responsibility:** does the new use-case do exactly one thing? Does the new controller method do anything beyond "validate happened upstream, call use-case, shape response"?
- **No leaked framework types:** do any DTOs, use-case signatures, or domain method signatures mention `Request`/`Response`, a Mongo document type, or a `ZodError`? If so, that's a layer boundary being crossed.
- **Authorization stays in domain/application:** is a per-resource permission check happening in a controller or middleware instead of via an entity method or use-case? Route-level role gates (`requireRole`) are the one legitimate exception — resource-level ownership is not.
- **Coverage didn't regress:** did `npm run test:coverage` actually run and pass after these changes, not just "look like it should pass"?
