---
name: story-start
description: >
  Moves a story from 1. PLAN to 2. BUILD, stamps started with today's date and
  date_confidence exact, then regenerates the project artifacts. Use when the user says
  they are starting work on a story, asks to "start US-004", "move this to build", "pick
  up the next story", or invokes /story-start.
---

# story-start

Performs the Plan → Build transition. It is a file move plus a frontmatter edit plus a
regeneration, and doing any one of those without the others is what makes a backlog
drift.

## Procedure

1. **Resolve the story.** Find `docs/stories/1. PLAN/<id>_*.md`. If it is already past
   `1. PLAN`, say so and stop rather than re-stamping `started` — an existing start date
   is real data and overwriting it corrupts the cycle-time calibration.

2. **Check readiness before moving.** Look at `ready` in
   `docs/project/metrics/backlog.csv`. If the story is Blocked, name the dependencies
   that have not reached Deploy or Archived and ask whether to start anyway. Starting a
   blocked story is sometimes the right call, but it should be a decision rather than an
   accident.

3. **Move the file.** Folder names contain a leading number and a space, so quote them:

   ```bash
   git mv "docs/stories/1. PLAN/US-004_task-list-pagination.md" "docs/stories/2. BUILD/"
   ```

4. **Stamp the frontmatter.** Set `started:` to today's date and
   `date_confidence: exact`. Do not touch `test_started`, `pr_opened`, `deployed`, or
   `completed`.

5. **Regenerate and validate** by invoking the **pm-dashboard** skill.

6. **Report** the story id, its title, and the new stage.

## What not to do

Do not write a status line into the story body. The folder is the stage, and a body
that restates it inevitably drifts from it — the validator rejects this outright.

Do not create a branch as part of this skill. Branching is the user's call — and per
this project's Gitflow rules (see CLAUDE.md), it should already exist before Build
starts, named `feature/*`, `bugfix/*`, or `hotfix/*` as appropriate.
