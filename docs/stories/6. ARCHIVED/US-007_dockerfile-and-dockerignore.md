---
id: US-007
title: Add multi-stage Dockerfile and .dockerignore
epic: Docker & Deploy Infrastructure
size: M
priority: high
mvp: yes
depends_on: []
started: 2026-08-26
test_started: 2026-08-26
pr_opened: 2026-08-26
deployed: 2026-08-26
completed: 2026-08-26
date_confidence: exact
---

# Add multi-stage Dockerfile and .dockerignore

## Story

As a developer, I want a multi-stage Dockerfile for the API service, so that the same image definition serves local dev (hot reload), CI-parity test runs, and a minimal production runtime.

## Acceptance criteria

- `Dockerfile` defines `deps`, `build`, `prod-deps`, and `runtime` stages; `build` retains full `node_modules` (including devDependencies) so it can double as the dev/test runtime target.
- The `runtime` stage runs as a non-root user and starts the compiled `dist/index.js`.
- `.dockerignore` excludes `node_modules`, `dist`, `coverage`, VCS/IDE metadata, `.env*` (except `.env.example`), and the Docket PM scaffolding (`docs/project`, `docs/stories`).
- `docker build --target runtime .` succeeds and produces a runnable image.
