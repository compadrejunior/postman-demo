---
id: US-011
title: Add Docker image build/smoke-test job to CI
epic: CI Pipeline
size: S
priority: medium
mvp: no
depends_on: [US-007, US-010]
started: 2026-08-26
test_started:
pr_opened:
deployed:
completed:
date_confidence: exact
---

# Add Docker image build/smoke-test job to CI

## Story

As a maintainer, I want CI to also build the production Docker image and confirm it starts, so that a broken Dockerfile is caught before merge rather than discovered during a deploy.

## Acceptance criteria

- A `docker` job in `.github/workflows/ci.yml`, gated on the `test` job passing, builds the `runtime` target.
- The job starts a container from the built image and confirms it starts without immediately crashing.
- The job does not re-run the full test suite (that already happened in the `test` job).
