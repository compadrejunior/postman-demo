---
id: US-014
title: Add story-advance skill and adapt generation scripts for 6-folder scheme
epic: Project Process Adoption
size: M
priority: high
mvp: yes
depends_on: [US-013]
started: 2026-08-26
test_started: 2026-08-26
pr_opened: 2026-08-26
deployed:
completed:
date_confidence: exact
---

# Add story-advance skill and adapt generation scripts for 6-folder scheme

## Story

As a maintainer, I want a skill that moves a story forward exactly one SDLC stage at a time, so that intermediate transitions (Build→Test, Test→PR, PR→Deploy) are handled consistently with `/story-start` and `/story-done`, without ever skipping a stage.

## Acceptance criteria

- `.claude/skills/story-advance/SKILL.md` moves a story one stage forward, stamps the corresponding date field (`test_started`, `pr_opened`, or `deployed`) with `date_confidence: exact`, and regenerates/validates the dashboard.
- `.claude/skills/story-start/SKILL.md` performs Plan → Build; `.claude/skills/story-done/SKILL.md` is repurposed to perform Deploy → Archived only.
- `scripts/pm/generate-dashboard.mjs`, `scripts/pm/check-docs.mjs`, and `scripts/pm/add-frontmatter.mjs` all recognize the 6 stage folders and the new date fields.
- `.claude/rules/stories-and-plans.md` documents the 6-stage scheme and the new fields.
