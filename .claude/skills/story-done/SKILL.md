---
name: story-done
description: >
  Moves a story from 5. DEPLOY to 6. ARCHIVED, stamps completed with today's date and
  date_confidence exact, then regenerates the project artifacts. Also handles archiving
  a story that will never be built. Use when the user says a deployed story is confirmed
  stable, asks to "close US-004", "archive that story", or invokes /story-done.
---

# story-done

Performs the Deploy → Archived transition — the final closure, once a deploy has been
confirmed stable — and the direct-to-archive transition for work that will not be
built.

Under this project's 5-stage SDLC, "done" means fully deployed and confirmed stable,
not just code-complete. Code-complete-but-not-yet-deployed stories stay in `3. TEST` or
`4. PR`; a story that has been deployed but not yet confirmed stable stays in
`5. DEPLOY` until this skill runs.

## Before moving anything

Confirm the deploy is actually stable — say what that confirmation rested on (e.g. a
manual smoke check against the running `docker-compose.prod.yml` stack, or monitoring
observed after the deploy). If something was not verified, say so and ask whether to
proceed — closing a story on an assumption is how a dashboard starts lying.

If the story has no `deployed` date yet, it should go through `/story-advance` first,
not through this skill.

## Procedure

1. **Move the file.** Folder names contain a leading number and a space, so quote them:

   ```bash
   git mv "docs/stories/5. DEPLOY/US-004_task-list-pagination.md" "docs/stories/6. ARCHIVED/"
   ```

2. **Stamp the frontmatter.** Set `completed:` to today's date and
   `date_confidence: exact`. Leave every other date field alone.

3. **Regenerate and validate** by invoking the **pm-dashboard** skill.

4. **Report** the story, its new stage, and what the dashboard now shows for overall
   progress.

## Archiving instead (work that will never be built)

A story that will never be built goes straight to `6. ARCHIVED` from wherever it
currently sits, rather than being deleted — the decision not to build something is
itself worth keeping, and a deleted file takes its reasoning with it. Do not stamp
`completed` on a story archived this way: it was not completed.

Archived stories are excluded from every percentage and points total, but still appear
in the backlog CSV, so they remain visible without distorting progress.

Record why it was archived in the story body before moving it. "Superseded by US-011"
is useful a year later; an empty archived story is not.

## Downstream effects worth mentioning

Completing a story can unblock others. After regenerating, check `ready` in
`docs/project/metrics/backlog.csv` for stories that just became Ready and mention
them — that is usually the most useful thing anyone learns from closing a story.
