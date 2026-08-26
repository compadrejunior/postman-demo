# Task Management API — Backlog

> **The backlog is generated. There is exactly one place to author story metadata: the story's own frontmatter.**
>
> | File | Nature | Rule |
> |------|--------|------|
> | `docs/stories/**/*.md` — **frontmatter** | **Authored — the single source of truth** | Edit this. The story's **folder** is its stage. |
> | [`metrics/backlog.csv`](metrics/backlog.csv) | Generated | Never hand-edit. `node scripts/pm/generate-dashboard.mjs` |
> | [`DASHBOARD.md`](DASHBOARD.md) · [`ROADMAP.md`](ROADMAP.md) | Generated | Never hand-edit. |
>
> Validate everything with `node scripts/pm/check-docs.mjs` (or `npm run pm:check`) — it fails if `backlog.csv` is stale or hand-edited, if a dependency points at a story that doesn't exist, or if a story body re-declares metadata.

---

## Core philosophy (adapted from Docket Agentic SDLC)

1. **Folder location is stage.** A story's stage is never a frontmatter field — it's which stage folder the file lives in: `1. PLAN`, `2. BUILD`, `3. TEST`, `4. PR`, `5. DEPLOY`, `6. ARCHIVED`. See [SDLC.md](SDLC.md) for what each stage means.
2. **Derive, never author.** Anything computable from the story corpus (dashboard, roadmap, backlog CSV, per-story points, dependency inverses) is generated, never hand-edited. The validator re-derives every generated artifact in memory and diffs against what's on disk, so a hand-edit and staleness are indistinguishable — and both get rejected.
3. **Self-calibrating estimates.** Delivery-time estimates start as defaults and progressively switch to observed medians once enough Deployed stories carry trustworthy dates. Dates are tagged `exact` (real transition) vs `approx` (backfilled) so guesses can't pollute the calibration.
4. **One-directional dependencies.** Only `depends_on` is authored (a story lists what it needs first); `depended_by` is always computed as the inverse, never written by hand.
5. **Epic taxonomy is strict, not suggestive.** A story whose `epic:` doesn't match a canonical name in [`epics.md`](epics.md) hard-fails generation. This is what prevents taxonomy sprawl.

---

## Authoring a story

Everything the backlog and dashboard need lives in the YAML frontmatter:

```yaml
---
id: US-004
title: "Add pagination to task list endpoints"
epic: Task Query Enhancements   # MUST be canonical — see epics.md
size: M                          # S | M | L | XL  → points 1 | 3 | 5 | 8
priority: high                   # high | medium | low | unset
mvp: yes                         # yes | no | (empty)
depends_on: []                   # stories this one needs FIRST
started:                         # stamped on the move to 2. BUILD
test_started:                    # stamped on the move to 3. TEST
pr_opened:                       # stamped on the move to 4. PR
deployed:                        # stamped on the move to 5. DEPLOY
completed:                       # stamped on the move to 6. ARCHIVED
date_confidence: approx          # exact once you stamp a real date
---
```

**Stage is the folder** — `1. PLAN` · `2. BUILD` · `3. TEST` · `4. PR` · `5. DEPLOY` · `6. ARCHIVED`. Never write a `Status` row in the story body; the validator rejects it, because a body that restates its stage inevitably drifts from the folder.

### Dependencies — you only ever write one direction

- **`depends_on`** — the stories this one needs first. This is the **only** dependency field you author, and the only one that can block: a story is **Blocked** while any story it depends on has not reached Deploy or Archived, and **Ready** when they all have.
- **`depended_by`** — the stories that need this one. **Computed** by the generator as the exact inverse of every `depends_on`. You never write it.

Likewise **`points`** (from `size`), **`epic_no`** (from `epics.md`), **`ready`** (every dependency has reached Deploy/Archived) and **`status`** (from the folder) are derived — they exist in the CSV but are never authored.

### Self-calibrating estimates

`metrics/cycle-times.csv` and the dashboard report a **days/point** figure per size, measured end-to-end from `started` (Build start) to `deployed`. It starts at the flat assumption that one point is one day, and recalibrates to the ratio actually observed once a size accumulates enough delivered stories carrying `exact` dates.

Only `exact` dates count — that is the whole reason the confidence flag exists.

---

## When a story's stage changes

1. Move the file between the six `docs/stories/` folders.
2. Stamp the real date in its frontmatter for the transition just made, and set `date_confidence: exact`.
3. Run `node scripts/pm/generate-dashboard.mjs` (or `npm run pm:dashboard`, or the `/pm-dashboard` skill).
4. Run `node scripts/pm/check-docs.mjs` (or `npm run pm:check`) to confirm nothing is stale.

The `/story-start`, `/story-advance`, and `/story-done` skills perform all of the above for you.

---

## Onboarding a new story file

If a story file predates the frontmatter convention (no `---` block, or missing keys), run `node scripts/pm/add-frontmatter.mjs` first — it backfills missing keys with placeholders (`epic:` is left empty since it can't be safely guessed) without touching keys that already exist. Fill in the placeholders by hand, then run the generator and validator as above.

---

*The dashboard answers "how much is delivered"; the backlog answers "what's next and what's blocking it". Both derive from the same stories, so they cannot disagree.*
