---
id: US-002
title: Support multiple concurrent refresh tokens per user
epic: Auth Enhancements
size: M
priority: medium
mvp: no
depends_on: [US-001]
started:
test_started:
pr_opened:
deployed:
completed:
date_confidence: approx
---

# Support multiple concurrent refresh tokens per user

## Story

As a user signed in on more than one device, I want each device to keep its own refresh token, so that refreshing or logging out on one device does not invalidate my session on another.

## Acceptance criteria

- A user may hold more than one active, valid refresh token at a time (one per session/device).
- Refreshing a token on one device does not revoke the refresh tokens issued to other devices.
- Refresh tokens are stored per-session (not a single field on the user record) so multiple can coexist.
- Existing single-session behavior from US-001 continues to pass its tests.
