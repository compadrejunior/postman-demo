# Task Management API — Roadmap & Timeline

> **Generated 2026-08-26.** Delivered work with tracked dates is shown on the timeline; remaining work is projected forward. Do not edit by hand.

## Business capability status

| Capability status | Epics |
|-------------------|-------|
| Not started | Auth Enhancements, Task Query Enhancements |
| In progress | Docker & Deploy Infrastructure, CI Pipeline, Project Process Adoption |

## Forward plan

> **Basis:** durations are **default** point-per-day estimates (no delivered stories have tracked dates yet). Single-team sequential assumption starting 2026-08-26. This is a projection, not a commitment.

```mermaid
gantt
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    title Remaining work (projected)
    section Docker & Deploy Infrastructure
    Add multi-stage Dockerfile and .dockerignore (M) :active, 2026-08-26, 2026-08-29
    Add docker-compose base + dev/test/prod overrides (M) :active, 2026-08-29, 2026-09-01
    Document Docker workflows in docs/setup.md and README (S) :active, 2026-09-01, 2026-09-02
    section CI Pipeline
    Add GitHub Actions CI workflow (lint/test/build) (S) :active, 2026-09-02, 2026-09-03
    Add Docker image build/smoke-test job to CI (S) :active, 2026-09-03, 2026-09-04
    Enable branch protection requiring CI to pass before merge (S) :active, 2026-09-04, 2026-09-05
    section Project Process Adoption
    Adopt local Docket SDLC scaffolding (5-stage flow) (L) :active, 2026-09-05, 2026-09-10
    Add story-advance skill and adapt generation scripts for 6-folder scheme (M) :active, 2026-09-10, 2026-09-13
    section Auth Enhancements
    Add JWT refresh token endpoint (M) :2026-09-13, 2026-09-16
    Support multiple concurrent refresh tokens per user (M) :2026-09-19, 2026-09-22
    Revoke all sessions endpoint (S) :2026-09-22, 2026-09-23
    section Task Query Enhancements
    Add pagination to task list endpoints (M) :2026-09-16, 2026-09-19
    Add status/priority filtering to task list endpoints (M) :2026-09-23, 2026-09-26
    Add sort ordering to task list endpoints (S) :2026-09-26, 2026-09-27
```

## Delivered timeline (tracked dates only)

_No delivered stories have tracked start/deploy dates yet. Once stories move through the folders with real dates recorded, they appear here on the timeline and feed the cycle-time calibration._

---

_Forward estimates self-calibrate: as delivered stories accrue real dates, per-size durations shift from default to observed. See DASHBOARD "How long stories actually take"._
