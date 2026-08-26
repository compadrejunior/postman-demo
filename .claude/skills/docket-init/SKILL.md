---
name: docket-init
description: >
  First-run setup for this project's local, adapted Docket scaffolding. Creates any
  missing story-stage folders and docs/project files, then runs the generator and
  validator. Use when the scaffolding under docs/project or docs/stories is missing or
  incomplete, or when the user asks to "set up the story tracking" or invokes
  /docket-init. This project has no Jira/Confluence integration — this skill is local-
  only, unlike upstream Docket's docket-init.
---

# docket-init

This project's story tracking is a local, adapted copy of Docket Agentic SDLC
(github.com/compadrejunior/docket-pub), following this project's own 5-stage SDLC
(Plan → Build → Test → PR → Deploy — see [docs/project/SDLC.md](../../../docs/project/SDLC.md)).
There is no Jira, Confluence, or MCP-routed sync in this project — everything runs from
plain Node scripts against local files.

## Procedure

1. Confirm `docket.config.json` exists at the repo root. If not, create it with
   `jira.enabled: false`, `confluence.enabled: false`, and `repository.baseBranch`
   matching this repo's Gitflow base branch (see CLAUDE.md).
2. Ensure the six story-stage folders exist:
   `docs/stories/{1. PLAN,2. BUILD,3. TEST,4. PR,5. DEPLOY,6. ARCHIVED}`.
3. Ensure `docs/project/epics.md` exists with at least one canonical epic row.
4. Run the local loop and report both summary lines:

   ```bash
   node scripts/pm/generate-dashboard.mjs
   node scripts/pm/check-docs.mjs
   ```

5. If a story file predates the frontmatter convention, run
   `node scripts/pm/add-frontmatter.mjs` to backfill it, then fill in any placeholder
   `epic:` values by hand before regenerating.

Never invent an epic name, a story id, or a completion date — those are decisions for
the person doing the work.
