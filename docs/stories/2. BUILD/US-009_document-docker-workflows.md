---
id: US-009
title: Document Docker workflows in docs/setup.md and README
epic: Docker & Deploy Infrastructure
size: S
priority: medium
mvp: no
depends_on: [US-008]
started: 2026-08-26
test_started:
pr_opened:
deployed:
completed:
date_confidence: exact
---

# Document Docker workflows in docs/setup.md and README

## Story

As a new contributor, I want clear documentation of how to run the API in each Docker environment, so that I don't have to reverse-engineer the compose files to get started.

## Acceptance criteria

- `docs/setup.md` states plainly that MongoDB runs as a container alongside the API in every environment, with a "Running with Docker" section giving the exact `docker compose` invocation for dev/test/prod.
- `docs/setup.md` notes that `MONGODB_URI`'s value is overridden by the base compose file when running in Docker.
- `README.md` gets a short "Docker quickstart" section covering the same three commands.
