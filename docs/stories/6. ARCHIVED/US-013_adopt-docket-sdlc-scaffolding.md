---
id: US-013
title: Adopt local Docket SDLC scaffolding (5-stage flow)
epic: Project Process Adoption
size: L
priority: high
mvp: yes
depends_on: []
started: 2026-08-26
test_started: 2026-08-26
pr_opened: 2026-08-26
deployed: 2026-08-26
completed: 2026-08-26
date_confidence: exact
---

# Adopt local Docket SDLC scaffolding (5-stage flow)

## Story

As a maintainer, I want a lightweight, git-native way to track upcoming work as Epics and User Stories, so that future feature waves can be picked up story-by-story instead of tracked ad hoc.

## Acceptance criteria

- `docket.config.json`, `docs/project/{SDLC.md,epics.md,ROADMAP.md,backlog.md,DASHBOARD.md}`, and `docs/project/metrics/*.csv` exist, adapted locally from Docket Agentic SDLC (github.com/compadrejunior/docket-pub) without modifying the upstream repository.
- The story-folder scheme (`1. PLAN` through `6. ARCHIVED`) matches this project's own Plan → Build → Test → PR → Deploy SDLC, defined authoritatively in `docs/project/SDLC.md`.
- `scripts/pm/generate-dashboard.mjs` and `scripts/pm/check-docs.mjs` run successfully against the seeded backlog with no validation errors.
- `README.md` and `CLAUDE.md` reference the new process.
