---
description: Story authoring and lifecycle conventions for docs/stories
paths:
  - "docs/stories/**"
  - "docs/project/**"
---

# Story conventions

Adapted from Docket Agentic SDLC (github.com/compadrejunior/docket-pub) for this
project's own 5-stage SDLC (Plan → Build → Test → PR → Deploy — see
[docs/project/SDLC.md](../../docs/project/SDLC.md)), which locally overrides Docket's
stock 4-folder flow. The upstream Docket repository is never modified.

## Frontmatter is the only authored metadata

`docs/stories/**/*.md` frontmatter is the single source of truth. Everything else is
derived from it.

```yaml
---
id: US-004                   # unique across the whole backlog
title: "Add pagination to task list endpoints"
epic: Task Query Enhancements # MUST match a canonical name in docs/project/epics.md
size: M                       # S | M | L | XL → points 1 | 3 | 5 | 8
priority: high                # high | medium | low | unset
mvp: yes                      # yes | no | (empty when not assessed)
depends_on: []                # stories this one needs FIRST; [] when none
started:                      # stamped on the move to 2. BUILD
test_started:                 # stamped on the move to 3. TEST
pr_opened:                    # stamped on the move to 4. PR
deployed:                     # stamped on the move to 5. DEPLOY
completed:                    # stamped on the move to 6. ARCHIVED
date_confidence: approx       # exact once a real transition date is stamped
---
```

**Stage is not a field.** The containing folder is the stage: `1. PLAN`, `2. BUILD`,
`3. TEST`, `4. PR`, `5. DEPLOY`, `6. ARCHIVED`. Changing stage means moving the file.

## Never restate metadata in the story body

No `**Status:**` line, no `| Priority | ... |` row, no epic restated in prose. The
validator rejects it, and for a concrete reason: a body that repeats its stage drifts
from the folder, and then two places disagree about the same fact with nothing to
arbitrate. Frontmatter is the only place any of it is written.

## Derived, never authored

| Field | Derived from |
|---|---|
| `status` | the folder the file is in |
| `points` | `size` |
| `epic_no` | position in `docs/project/epics.md` |
| `depended_by` | the exact inverse of every `depends_on` |
| `ready` | every story in `depends_on` has reached Deploy or Archived |

`depends_on` is written on one side only, on purpose. Because `depended_by` is computed,
a dependency can never end up recorded on one side and missing on the other.

## The six folders, and the states that are not folders

Only six states have a folder and drive the dashboard: `1. PLAN`, `2. BUILD`, `3. TEST`,
`4. PR`, `5. DEPLOY`, `6. ARCHIVED` — one per SDLC stage, plus archival.

Sub-states within a stage (e.g. "waiting on review feedback" while in `4. PR`) live in
the story body or in the tracker, not as folders. Do not create directories for them.

Blocked is computed, not declared: a story is Blocked when something it depends on has
not reached Deploy or Archived. Writing "blocked" by hand would just be another fact
that can go stale.

## Lifecycle

1. `1. PLAN` → `2. BUILD`: move the file, stamp `started` and `date_confidence: exact`.
   Use `/story-start`.
2. `2. BUILD` → `3. TEST` → `4. PR` → `5. DEPLOY`: move the file one stage at a time,
   stamping `test_started`, `pr_opened`, or `deployed` respectively, each with
   `date_confidence: exact`. Use `/story-advance` — it never skips a stage.

   The `3. TEST` → `4. PR` move is knowable before the PR exists, so fold it into the
   same branch/commit as the code being sent for review, before opening the PR — don't
   let it become a follow-up PR whose only content is a file move. `4. PR` →
   `5. DEPLOY` can't be folded that way (`deployed` is only true after merge); when it's
   the only outstanding change, batch that stamp into whichever real PR comes next
   rather than opening a dedicated PR just to move the file. See the "Avoid a PR that
   exists only to move a file" section of the `story-advance` skill for the full
   rationale.
3. `5. DEPLOY` → `6. ARCHIVED`: move the file, stamp `completed` and
   `date_confidence: exact`. Use `/story-done`.
4. Anything that will not be built → `6. ARCHIVED` directly, with the reason recorded
   in the body. Never delete a story: the decision not to build something is worth
   keeping.
5. After any move, regenerate and validate:

   ```bash
   node scripts/pm/generate-dashboard.mjs
   node scripts/pm/check-docs.mjs
   ```

   (Or `npm run pm:dashboard` / `npm run pm:check`.)

## Dates and why the confidence flag matters

`exact` means the date was stamped at the real transition. `approx` means it was
backfilled or reconstructed. Only `exact` dates feed the cycle-time calibration, which
measures the full Build-to-Deploy span.

That distinction is what keeps the estimates honest. The roadmap projects delivery from
observed medians, so a handful of guessed dates would quietly turn a measurement into a
fiction that still looks like a measurement. When you do not know, use `approx`.

## Epic taxonomy is strict

A story whose `epic:` does not match a canonical name in `docs/project/epics.md` fails
generation with a non-zero exit. Fix the story's epic, or add the epic to `epics.md`
deliberately — never loosen the generator. The strictness is the mechanism that stops a
taxonomy from sprawling into near-duplicate names.

## Never hand-edit generated files

`docs/project/DASHBOARD.md`, `docs/project/ROADMAP.md`, and everything under
`docs/project/metrics/` are generated. The validator re-derives them in memory and
byte-compares, so a hand-edit is indistinguishable from staleness and both are rejected.
Fix the source and regenerate.

## Git and deploy actions stay explicit

Never create a branch, push, open/merge a PR, or run a `docker compose ... prod`
deploy as a side effect of a story-lifecycle skill. Those are always a separate,
explicitly-confirmed human (or per-action confirmed agent) action — this mirrors
Docket's own upstream conventions and this project's Gitflow rules in
[CLAUDE.md](../../CLAUDE.md).
