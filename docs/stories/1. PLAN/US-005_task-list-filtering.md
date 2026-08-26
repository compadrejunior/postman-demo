---
id: US-005
title: Add status/priority filtering to task list endpoints
epic: Task Query Enhancements
size: M
priority: medium
mvp: no
depends_on: [US-004]
started:
test_started:
pr_opened:
deployed:
completed:
date_confidence: approx
---

# Add status/priority filtering to task list endpoints

## Story

As a user with a large task list, I want to filter by status and priority, so that I can find the tasks I care about without scanning the whole list.

## Acceptance criteria

- `GET /api/tasks` and `GET /api/admin/tasks` accept `status` and `priority` query parameters, validated against the existing `TaskStatus`/`TaskPriority` value objects.
- Filters combine with the pagination from US-004 (page/limit apply to the filtered result set, not the whole collection).
- An invalid `status`/`priority` value returns `400` with a clear validation error, not a silently-empty result.
- `docs/api-reference.md` documents the new query parameters.
