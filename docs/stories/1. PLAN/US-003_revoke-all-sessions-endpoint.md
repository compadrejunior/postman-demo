---
id: US-003
title: Revoke all sessions endpoint
epic: Auth Enhancements
size: S
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

# Revoke all sessions endpoint

## Story

As a user who suspects one of my devices is compromised, I want to invalidate every active session at once, so that a stolen or leaked refresh token stops working immediately.

## Acceptance criteria

- `POST /api/auth/logout-all` invalidates every outstanding refresh token for the authenticated user.
- The endpoint requires a valid access token and returns `401` without one.
- After calling it, every previously-issued refresh token for that user is rejected by `POST /api/auth/refresh`.
