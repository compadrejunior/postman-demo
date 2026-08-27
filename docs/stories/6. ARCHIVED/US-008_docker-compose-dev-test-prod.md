---
id: US-008
title: Add docker-compose base + dev/test/prod overrides
epic: Docker & Deploy Infrastructure
size: M
priority: high
mvp: yes
depends_on: [US-007]
started: 2026-08-26
test_started: 2026-08-26
pr_opened: 2026-08-26
deployed: 2026-08-26
completed: 2026-08-26
date_confidence: exact
---

# Add docker-compose base + dev/test/prod overrides

## Story

As a developer, I want separate Dev, Test, and Prod Docker Compose environments — with both the API and MongoDB containerized in every environment — so that I can develop, run a clean-room test pass, and run a production-shaped deployment locally without cross-contaminating data.

## Acceptance criteria

- `docker-compose.yml` defines the shared `api` + `mongo` service shape (build context/target, healthcheck, port).
- `docker-compose.dev.yml` overrides to hot-reload (`npm run dev`, bind-mounted `src`/`tests`) with its own named Mongo volume.
- `docker-compose.test.yml` overrides to run `npm run test:coverage` as a one-shot `run --rm`, with its own named Mongo volume.
- `docker-compose.prod.yml` overrides to the production runtime target with `restart: unless-stopped` and its own named Mongo volume.
- Each environment's Mongo data volume is isolated from the others.
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` starts a working API reachable on the configured port.
