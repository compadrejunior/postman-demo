---
id: US-004
title: Add pagination to task list endpoints
epic: Task Query Enhancements
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

# Add pagination to task list endpoints

## Story

As a user with many tasks, I want the task list endpoints to return results a page at a time, so that the API stays fast and the client isn't forced to load the entire dataset at once.

## Acceptance criteria

- `GET /api/tasks` and `GET /api/admin/tasks` accept `page` and `limit` query parameters, validated via Zod (positive integers, `limit` capped at a sane maximum).
- The response includes pagination metadata (total count, current page, total pages).
- Omitting the query parameters falls back to sensible defaults (e.g. page 1, a default limit) rather than erroring.
- `ListTasksUseCase`/`ListAllTasksUseCase` accept pagination parameters and the Mongo repository implements the corresponding skip/limit query.
- `docs/api-reference.md` documents the new query parameters and response shape.
