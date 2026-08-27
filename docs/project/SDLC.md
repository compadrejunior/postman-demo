# SDLC

This project uses its own 5-stage flow — **Plan → Build → Test → PR → Deploy** — which locally overrides the stock Docket Agentic SDLC (github.com/compadrejunior/docket-pub) flow of "Plan → Ready → Build/Review → Close". This file is the authoritative description of story lifecycle for this repository. The upstream Docket repository is never modified; everything under `docs/project/`, `docs/stories/`, `scripts/pm/`, `.claude/rules/stories-and-plans.md` and the story-related `.claude/skills/` is a **local, adapted copy**.

## Stages

1. **Plan** — a story exists as a fully-specified `US-NNN` file with `epic`, `size`, `priority`, and acceptance criteria, sitting in `docs/stories/1. PLAN/`. Not yet started.
2. **Build** — an implementer has started work on a branch, per this repository's Gitflow rules in [CLAUDE.md](../../CLAUDE.md) (`feature/*`, `bugfix/*`, `hotfix/*`). The story file moves to `docs/stories/2. BUILD/` and `started` is stamped. Work happens against `npm run dev` locally or `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`.
3. **Test** — implementation is code-complete and `npm run test:coverage` passes locally, meeting the 90% floor from CLAUDE.md's non-negotiable rules. The story moves to `docs/stories/3. TEST/` and `test_started` is stamped. A clean-room, CI-parity run is available via `docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm api`, and the same checks run automatically in `.github/workflows/ci.yml` on every PR.
4. **PR** — a pull request is opened against the branch's target per Gitflow, and is under review. **A PR is only opened once the work behind it is actually complete**: all the code for the story is written, `npm run test:coverage` passes at or above the 90% floor, and every doc the story touches is updated (`docs/api-reference.md`, `docs/architecture.md`, `docs/setup.md`/`README.md`, or the story's own acceptance criteria — whichever apply). A PR is never opened to checkpoint partial or WIP work, and "docs later" is not acceptable — code without its docs is not done. The story moves to `docs/stories/4. PR/` and `pr_opened` is stamped (optionally also filling in `pr_url`) only once that bar is met. Opening, reviewing, and merging a PR is always a manual, explicitly-confirmed human action — nothing in this SDLC or its tooling auto-opens or auto-merges a PR.
5. **Deploy** — the PR is merged and the change has been applied via the appropriate Docker Compose environment (`docker-compose.prod.yml` for production, `docker-compose.dev.yml` for a local dev-parity smoke check). The story moves to `docs/stories/5. DEPLOY/` and `deployed` is stamped. Once the deploy is confirmed stable, the story is archived to `docs/stories/6. ARCHIVED/` and `completed` is stamped.

## Story status is derived, not declared

As in stock Docket, a story's status is which folder it physically sits in under `docs/stories/` — never a hand-authored `status:` frontmatter field. `scripts/pm/generate-dashboard.mjs` derives status this way and regenerates `docs/project/DASHBOARD.md`, `docs/project/ROADMAP.md`, and the metrics CSVs from folder location + frontmatter on every run. See `.claude/rules/stories-and-plans.md` for the full frontmatter contract.

## Relationship to Docker environments

- **Build** stage: `npm run dev`, or `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` (hot-reload, bind-mounted source).
- **Test** stage: `npm run test:coverage` locally, or `docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm api` for a clean-room CI-parity run; the same lint/test/build steps run automatically in CI on every PR (`.github/workflows/ci.yml`).
- **PR** stage: branch pushed, PR opened per Gitflow naming — always a manual/explicitly-confirmed action.
- **Deploy** stage: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` is the production deploy shape. There is no automated deploy pipeline in this project — deploy is a manually run, explicitly-confirmed step, consistent with the "never branch/push/merge/deploy without explicit per-action permission" norm this project inherits from Docket's own agent conventions.

## Tooling

- `/story-start` — Plan → Build.
- `/story-advance` — Build → Test, Test → PR, or PR → Deploy (one stage forward at a time).
- `/story-done` — Deploy → Archived, the final closure.
- `/pm-dashboard` — regenerate `DASHBOARD.md`, `ROADMAP.md`, and the metrics CSVs from the story backlog; run after any story move.
- `npm run pm:dashboard` / `npm run pm:check` — the same generation/validation, runnable without Claude Code.

## Branch protection

`master` has a GitHub branch protection rule requiring the `test` and `docker` jobs from `.github/workflows/ci.yml` to pass before a PR can be merged, enforced for all contributors including repository admins. This is a GitHub repository-settings change, not a file in this repository — it's configured via the GitHub API/UI, not tracked as code. There is no `develop` branch in this repository, so no equivalent rule exists for it.
