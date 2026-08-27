# Task Management API — Roadmap & Timeline

> **Generated 2026-08-27.** Delivered work with tracked dates is shown on the timeline; remaining work is projected forward. Do not edit by hand.

## Business capability status

| Capability status | Epics |
|-------------------|-------|
| Not started | Auth Enhancements, Task Query Enhancements |
| Done | Docker & Deploy Infrastructure, Project Process Adoption |
| In progress | CI Pipeline |

## Forward plan

> **Basis:** durations are a mix of **observed** cycle times (from delivered stories) and defaults where samples are thin. Single-team sequential assumption starting 2026-08-27. This is a projection, not a commitment.

```mermaid
gantt
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    title Remaining work (projected)
    section Auth Enhancements
    Add JWT refresh token endpoint (M) :2026-08-27, 2026-08-28
    Support multiple concurrent refresh tokens per user (M) :2026-08-29, 2026-08-30
    Revoke all sessions endpoint (S) :2026-08-30, 2026-08-31
    section Task Query Enhancements
    Add pagination to task list endpoints (M) :2026-08-28, 2026-08-29
    Add status/priority filtering to task list endpoints (M) :2026-08-31, 2026-09-01
    Add sort ordering to task list endpoints (S) :2026-09-01, 2026-09-02
```

## Delivered timeline (tracked dates only)

```mermaid
gantt
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    title Delivered
    section CI Pipeline
    Enable branch protection requiring CI to pass before merge :done, 2026-08-26, 2026-08-27
    Add GitHub Actions CI workflow (lint/test/build) :done, 2026-08-26, 2026-08-26
    Add Docker image build/smoke-test job to CI :done, 2026-08-26, 2026-08-26
    section Docker & Deploy Infrastructure
    Add multi-stage Dockerfile and .dockerignore :done, 2026-08-26, 2026-08-26
    Add docker-compose base + dev/test/prod overrides :done, 2026-08-26, 2026-08-26
    Document Docker workflows in docs/setup.md and README :done, 2026-08-26, 2026-08-26
    section Project Process Adoption
    Adopt local Docket SDLC scaffolding (5-stage flow) :done, 2026-08-26, 2026-08-26
    Add story-advance skill and adapt generation scripts for 6-folder scheme :done, 2026-08-26, 2026-08-26
```

---

_Forward estimates self-calibrate: as delivered stories accrue real dates, per-size durations shift from default to observed. See DASHBOARD "How long stories actually take"._
