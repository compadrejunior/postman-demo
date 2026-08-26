---
id: US-001
title: Add JWT refresh token endpoint
epic: Auth Enhancements
size: M
priority: high
mvp: yes
depends_on: []
started:
test_started:
pr_opened:
deployed:
completed:
date_confidence: approx
---

# Add JWT refresh token endpoint

## Story

As an authenticated user, I want to exchange a refresh token for a new access token without re-entering my credentials, so that my session can be extended securely without forcing frequent re-logins or requiring the client to store my password.

## Acceptance criteria

- Login (`POST /api/auth/login`) returns both an access token and a refresh token; the refresh token is a separate, longer-lived, single-purpose token distinct from the access token's claims.
- A new `POST /api/auth/refresh` endpoint accepts a valid, non-revoked refresh token and returns a new access token (and, if rotation is chosen, a new refresh token).
- An invalid, expired, or revoked refresh token returns `401 Unauthorized` with a clear error code, never a 500.
- Refresh tokens are persisted (or their revocation state is trackable) so that a `POST /api/auth/logout` endpoint can invalidate a given refresh token, preventing further use even if it has not yet expired.
- `RefreshTokenUseCase` and `LogoutUseCase` are added in `src/application/use-cases/auth/`, following the existing `LoginUserUseCase`/`RegisterUserUseCase` pattern (constructor-injected ports, no framework/Zod/Mongo imports).
- A `RefreshTokenRepository` port (or equivalent extension of an existing port) is defined in `src/application/ports/` and implemented as a Mongo adapter in `src/infrastructure/database/mongo/`, following the existing `MongoUserRepository`/`MongoTaskRepository` pattern.
- New Zod request schemas for `/refresh` and `/logout` live in `src/presentation/http/express/schemas/`, per CLAUDE.md's "Zod stays at the boundary" rule.
- Route-level wiring added to `authRoutes.ts` and to `src/composition/container.ts`.
- Unit tests for both new use-cases (using existing/new fakes in `tests/unit/_fakes/`) and integration tests for both new HTTP routes in `tests/integration/http/` cover the happy path plus every distinct error status.
- `npm run test:coverage` stays at or above the 90% floor.
- `docs/api-reference.md` is updated with the two new endpoints.
