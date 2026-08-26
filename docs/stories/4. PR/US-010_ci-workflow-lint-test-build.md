---
id: US-010
title: Add GitHub Actions CI workflow (lint/test/build)
epic: CI Pipeline
size: S
priority: high
mvp: yes
depends_on: []
started: 2026-08-26
test_started: 2026-08-26
pr_opened: 2026-08-26
deployed:
completed:
date_confidence: exact
---

# Add GitHub Actions CI workflow (lint/test/build)

## Story

As a maintainer, I want CI to enforce lint, coverage, and build on every PR, so that the local pre-commit hooks (which can be bypassed with `--no-verify`) are backed by a network-enforced gate, closing the gap already flagged in `docs/testing.md`.

## Acceptance criteria

- `.github/workflows/ci.yml` runs on `pull_request` and on `push` to `master`/`develop`.
- The `test` job runs `npm ci`, `npm run lint`, `npm run test:coverage`, and `npm run build` on Node 22.
- A failing lint/test/build step fails the workflow.
