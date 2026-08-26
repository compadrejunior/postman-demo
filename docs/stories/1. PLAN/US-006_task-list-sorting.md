---
id: US-006
title: Add sort ordering to task list endpoints
epic: Task Query Enhancements
size: S
priority: low
mvp: no
depends_on: [US-004]
started:
test_started:
pr_opened:
deployed:
completed:
date_confidence: approx
---

# Add sort ordering to task list endpoints

## Story

As a user reviewing my tasks, I want to choose how the list is ordered, so that I can see the most urgent or most recent tasks first.

## Acceptance criteria

- `GET /api/tasks` and `GET /api/admin/tasks` accept `sortBy` and `sortOrder` query parameters.
- `sortBy` is restricted to a whitelisted set of fields (e.g. `createdAt`, `dueDate`) to prevent arbitrary/unsafe sort input reaching MongoDB.
- `sortOrder` accepts only `asc`/`desc`; an invalid value returns `400`.
- Combines correctly with pagination (US-004) and filtering (US-005).
