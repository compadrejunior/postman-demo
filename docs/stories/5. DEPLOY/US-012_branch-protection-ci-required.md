---
id: US-012
title: Enable branch protection requiring CI to pass before merge
epic: CI Pipeline
size: S
priority: medium
mvp: no
depends_on: [US-010]
started: 2026-08-26
test_started: 2026-08-27
pr_opened: 2026-08-27
deployed: 2026-08-27
completed:
date_confidence: exact
---

# Enable branch protection requiring CI to pass before merge

## Story

As a maintainer, I want GitHub to refuse to merge a PR whose CI checks are failing, so that the CI gate added in US-010 can't be silently ignored.

## Acceptance criteria

- `master` (and `develop`, if used) has a branch protection rule requiring the `test` (and ideally `docker`) CI job to pass before merging.
- This is a repository-settings change on GitHub, not a file in this repository — tracked here so it isn't forgotten.
