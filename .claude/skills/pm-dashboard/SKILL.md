---
name: pm-dashboard
description: >
  Regenerates every derived project artifact in docs/project/ — DASHBOARD.md,
  ROADMAP.md, and docs/project/metrics/*.csv — from the story backlog
  (docs/stories/**/*.md frontmatter) and docs/project/epics.md, then validates the
  result. Use whenever a story moves between stage folders (1. PLAN / 2. BUILD /
  3. TEST / 4. PR / 5. DEPLOY / 6. ARCHIVED), when frontmatter changes (epic, size,
  priority, depends_on, any stage-transition date), or when the user asks to "update
  the dashboard", "refresh the backlog", "regenerate the roadmap", or invokes
  /pm-dashboard directly.
---

# pm-dashboard

Regenerates every derived artifact under `docs/project/` from the one authored source of
truth: each story's YAML frontmatter under `docs/stories/{1. PLAN,2. BUILD,3. TEST,4. PR,
5. DEPLOY,6. ARCHIVED}/`, plus the canonical epic list in `docs/project/epics.md`.

**Never hand-edit** `DASHBOARD.md`, `ROADMAP.md`, or anything under
`docs/project/metrics/`. If a number looks wrong, fix the story frontmatter or
`epics.md` and regenerate. Patching the output does not survive the next run, and the
validator cannot tell a hand-edit from staleness anyway, so both are rejected.

The full authoring contract — the frontmatter schema, dependency rules, when to stamp
each stage-transition date — lives in
[docs/project/backlog.md](../../../docs/project/backlog.md) and
[.claude/rules/stories-and-plans.md](../../rules/stories-and-plans.md). This skill does
not restate it.

## Procedure

1. Regenerate and validate:

   ```bash
   node scripts/pm/generate-dashboard.mjs
   node scripts/pm/check-docs.mjs
   ```

   (Equivalently: `npm run pm:dashboard && npm run pm:check`.)

2. Report both summary lines. If the validator fails, fix the flagged story file and
   re-run both. Do not hand-patch generated output to silence an error — that hides the
   real defect and the next regeneration reverts it.

This project has no Jira/Confluence integration, so there is no sync step — unlike
upstream Docket's `pm-dashboard`, this is a two-command, fully local loop.

## What the generator produces

- **`DASHBOARD.md`** — progress by count and by effort, a stage pie chart, a burn-up
  chart once two or more snapshots exist, per-epic progress across all six stages,
  Now/Next/Delivered, and the cycle-time table (Build start → Deploy) with the
  days-per-point estimation baseline.
- **`ROADMAP.md`** — the business-capability table, a projected forward plan, and a
  delivered timeline built from tracked dates.
- **`metrics/backlog.csv`** — the working backlog view.
- **`metrics/snapshots.csv`** — today's row upserted into the burn-up ledger.
- **`metrics/cycle-times.csv`** — median, mean, min and max days per size, plus the
  points baseline and the observed days-per-point ratio.

## Derived, never authored

Stage comes from the folder. `points` come from `size`. `epic_no` comes from the order
in `epics.md`. `depended_by` is the exact inverse of every `depends_on`, so a dependency
can never be recorded on one side only. `ready` is computed: a story is Ready when every
story it depends on has reached Deploy or Archived, and Blocked otherwise.

A story whose `epic:` is not canonical aborts generation with a non-zero exit. Fix the
story, not the generator — that strictness is what stops the taxonomy from sprawling.

## Related

`scripts/pm/add-frontmatter.mjs` backfills missing frontmatter keys on story files that
predate the convention. It is an onboarding tool, not part of this loop.
