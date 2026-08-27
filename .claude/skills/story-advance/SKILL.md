---
name: story-advance
description: >
  Moves a story exactly one SDLC stage forward — 2. BUILD to 3. TEST, 3. TEST to 4. PR,
  or 4. PR to 5. DEPLOY — stamping the corresponding transition date with
  date_confidence exact, then regenerates the project artifacts. Never skips a stage.
  Use when the user says a story is code-complete, tests passed, a PR was opened, or a
  deploy went out, or invokes /story-advance.
---

# story-advance

Performs any single forward transition between `2. BUILD`, `3. TEST`, `4. PR`, and
`5. DEPLOY`. Unlike `/story-start` (Plan → Build) and `/story-done` (Deploy →
Archived), this is a generic "move one stage" skill because a story spends time in
three intermediate stages under this project's 5-stage SDLC (see
[docs/project/SDLC.md](../../../docs/project/SDLC.md)).

## Procedure

1. **Resolve the story and the target stage.** Find the story file in its current
   folder. Determine the target stage from what the user described (code-complete →
   Test; PR opened → PR; deployed → Deploy).

2. **Validate the transition is exactly one stage forward.** The allowed moves are:

   | From | To | Frontmatter field stamped |
   |---|---|---|
   | `2. BUILD` | `3. TEST` | `test_started` |
   | `3. TEST` | `4. PR` | `pr_opened` |
   | `4. PR` | `5. DEPLOY` | `deployed` |

   Refuse to skip a stage (e.g. Build straight to PR). If the user wants to skip
   validation or review for a specific reason, say so explicitly and ask for
   confirmation rather than silently jumping stages — a skipped stage with no dated
   record is a fact the dashboard can no longer see.

3. **Move the file.** Folder names contain a leading number and a space, so quote them:

   ```bash
   git mv "docs/stories/3. TEST/US-004_task-list-pagination.md" "docs/stories/4. PR/"
   ```

4. **Stamp the frontmatter.** Set the field from the table above to today's date and
   `date_confidence: exact`. Leave every other date field untouched. If moving into
   `4. PR`, optionally also fill in a `pr_url:` field once the PR exists.

5. **Regenerate and validate** by invoking the **pm-dashboard** skill.

6. **Report** the story id, its title, the new stage, and (when moving into `5. DEPLOY`)
   which Docker Compose environment the deploy used.

## Avoid a PR that exists only to move a file

The `3. TEST` → `4. PR` transition is knowable *before* the PR exists — the date is
"today," not something that depends on the PR actually being created. So when a story's
code/docs are about to go into a PR, do this transition **on that same branch, in that
same commit**, before running `gh pr create` (or opening the PR by hand). Move the file,
stamp `pr_opened`, regenerate the dashboard, and commit it all alongside the real work —
then open the PR from that commit. Don't do it as a follow-up once the PR already
exists; that turns one PR into two for no reason, since nothing about the stamp actually
depended on the PR existing first.

`4. PR` → `5. DEPLOY` is the one transition that genuinely can't be folded in this way —
`deployed` can only be true after the PR merges, so by definition it can't be stamped in
the PR that causes it. When that's the only outstanding change, don't rush a dedicated
PR just to move the file: fold the Deploy stamp (and the dashboard regen) into whichever
real PR comes next, rather than treating "the file needs to move" as urgent enough to
justify its own branch/PR/merge cycle on its own. If no other PR is imminent, it's fine
to let the stamp wait — the dashboard being briefly behind reality is cheaper than a PR
whose only content is a file move.

## What not to do

Do not open a PR, push a branch, or run a `docker compose ... prod` deploy as a side
effect of this skill. This skill only records that a transition already happened — the
underlying git/deploy action is always a separate, explicitly-confirmed step performed
by the user (or by an agent action the user explicitly confirmed).

Do not write a status line into the story body. The folder is the stage.
