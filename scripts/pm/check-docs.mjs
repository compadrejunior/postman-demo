#!/usr/bin/env node
/**
 * Docs validator — adapted from Docket Agentic SDLC (github.com/compadrejunior/docket-pub)
 * for this project's 5-stage SDLC (Plan -> Build -> Test -> PR -> Deploy, see
 * docs/project/SDLC.md). Enforces that story frontmatter is the single source of truth.
 *
 * Fails (exit 1) when:
 *   - a story has no frontmatter, or is missing id / title / epic / size
 *   - `epic:` is not canonical (not in docs/project/epics.md)
 *   - `size:` is not S/M/L/XL, or `priority:` is not high/medium/low/unset, or `mvp:` is not yes/no/empty
 *   - `depends_on:` names a story that does not exist, or the story depends on itself
 *   - the dependency graph has a cycle (A → B → A can never be built)
 *   - two story files share an id but sit in different stage folders
 *   - a story BODY re-declares metadata that belongs to frontmatter (Status/Priority/Epic/Depends On rows)
 *   - docs/project/metrics/backlog.csv is stale
 *
 * Usage: node scripts/pm/check-docs.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadEpics, loadStories, backlogCsvText, FOLDER_STATUS } from "./generate-dashboard.mjs";
import { loadConfig } from "../lib/config.mjs";

// ============================================================================
// CONFIG — read from docket.config.json, the same source generate-dashboard.mjs
// uses, so the validator can no longer disagree with the generator about where
// anything lives.
// ============================================================================
const CWD = process.cwd();
const CONFIG = loadConfig(CWD);
const STORIES = CONFIG.dirs.stories;
const BACKLOG_CSV = join(CONFIG.dirs.metrics, "backlog.csv");
const FOLDERS = Object.keys(FOLDER_STATUS);

const SIZES = new Set(["S", "M", "L", "XL"]);
const PRIORITIES = new Set(["high", "medium", "low", "unset"]);
const MVPS = new Set(["yes", "no", ""]);
// Which stage folder a given date field is expected to appear no earlier than.
const STAGE_ORDER = ["plan", "build", "test", "pr", "deploy", "archived"];
const FIELD_STAGE = {
  started: "build",
  test_started: "test",
  pr_opened: "pr",
  deployed: "deploy",
  completed: "archived",
};
// Metadata that lives in frontmatter and must not be re-stated in the body (it drifts).
const BODY_DUP =
  /^\|\s*\**\s*(status|priority|epic|size|task id|depends on|depends_on|depended by|dependent of|parent\s*\/?\s*depends on)\s*\**\s*\|/i;
// ============================================================================

const errors = [];
const warnings = [];

const epicsMeta = loadEpics();
const stories = loadStories();
const byId = new Map();
for (const s of stories) {
  if (!byId.has(s.id)) byId.set(s.id, []);
  byId.get(s.id).push(s);
}

// ---- per-story frontmatter validation ----
for (const s of stories) {
  const at = s.file;
  if (!s.id) errors.push(`${at}: missing "id:" in frontmatter`);
  if (!s.title) errors.push(`${at}: missing "title:" in frontmatter`);
  if (!s.epic) errors.push(`${at}: missing "epic:" in frontmatter`);
  else if (!epicsMeta.has(s.epic))
    errors.push(`${at}: epic "${s.epic}" is not canonical (see docs/project/epics.md)`);
  if (!SIZES.has(s.size)) errors.push(`${at}: size "${s.size}" is not one of S/M/L/XL`);
  if (!PRIORITIES.has(s.priority))
    errors.push(`${at}: priority "${s.priority}" is not high/medium/low/unset`);
  if (!MVPS.has(s.mvp)) errors.push(`${at}: mvp "${s.mvp}" is not yes/no (or empty)`);

  // A stage-transition date implies the story has reached at least that stage.
  for (const [field, minStage] of Object.entries(FIELD_STAGE)) {
    const value = s[field];
    if (!value) continue;
    if (STAGE_ORDER.indexOf(s.status) < STAGE_ORDER.indexOf(minStage)) {
      warnings.push(
        `${at}: "${field}" is set but the story is still in the ${s.status.toUpperCase()} stage — move it to at least "${minStage}" so dependency blocking stays accurate`,
      );
    }
  }
  // Historical stories legitimately have no dates (date_confidence: approx). Only flag a
  // story that CLAIMS exact dates but is missing one for the stage it has reached.
  if (s.date_confidence === "exact") {
    if ((s.status === "deploy" || s.status === "archived") && !s.deployed)
      warnings.push(`${at}: date_confidence is "exact" but "deployed:" is empty`);
    if (s.status !== "plan" && !s.started)
      warnings.push(`${at}: date_confidence is "exact" but "started:" is empty`);
  }

  for (const dep of s.depends_on) {
    if (dep === s.id) errors.push(`${at}: depends on itself`);
    else if (!byId.has(dep))
      errors.push(`${at}: depends_on "${dep}" — no story with that id exists`);
  }
}

// ---- a story file with no frontmatter is invisible to every generated view ----
for (const folder of FOLDERS) {
  let names;
  try {
    names = readdirSync(join(STORIES, folder));
  } catch {
    continue;
  }
  for (const name of names) {
    if (!name.toLowerCase().endsWith(".md")) continue;
    const rel = `${folder}/${name}`;
    if (!stories.some((s) => s.file === rel)) {
      errors.push(`${rel}: no YAML frontmatter — invisible to the dashboard and the backlog`);
      continue;
    }
    // body must not re-declare frontmatter fields
    const raw = readFileSync(join(STORIES, folder, name), "utf8");
    const body = raw.slice(raw.indexOf("\n---", 3) + 4);
    const lines = body.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(BODY_DUP);
      if (!m) continue;
      // A metadata row is `| Field | Value |` — exactly 2 cells, and NOT a table header
      // (a header is followed by a |---|---| separator).
      const cells = lines[i]
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|").length;
      const isHeader = /^\|[\s:|-]+\|\s*$/.test((lines[i + 1] || "").trim());
      if (cells !== 2 || isHeader) continue;
      errors.push(
        `${rel}: body re-declares "${m[1]}" — that belongs in frontmatter only (it drifts)`,
      );
      break;
    }
  }
}

// ---- duplicate ids must agree on status ----
for (const [id, list] of byId) {
  const statuses = new Set(list.map((s) => s.status));
  if (statuses.size > 1) {
    errors.push(
      `id ${id}: ${list.length} story files in different folders (${[...statuses].join(", ")}) — they must share one status`,
    );
  }
}

// ---- dependency cycles ----
const graph = new Map(
  [...byId.keys()].map((id) => [id, byId.get(id).flatMap((s) => s.depends_on)]),
);
const WHITE = 0,
  GREY = 1,
  BLACK = 2;
const color = new Map([...graph.keys()].map((id) => [id, WHITE]));
const stack = [];
function visit(id) {
  color.set(id, GREY);
  stack.push(id);
  for (const dep of graph.get(id) || []) {
    if (!graph.has(dep)) continue;
    if (color.get(dep) === GREY) {
      errors.push(`dependency cycle: ${[...stack.slice(stack.indexOf(dep)), dep].join(" → ")}`);
    } else if (color.get(dep) === WHITE) visit(dep);
  }
  stack.pop();
  color.set(id, BLACK);
}
for (const id of graph.keys()) if (color.get(id) === WHITE) visit(id);

// ---- backlog.csv must match what the generator would emit ----
const norm = (s) => s.replace(/\r\n/g, "\n");
const expectedCsv = backlogCsvText({ stories, epicsMeta });

if (!existsSync(BACKLOG_CSV)) {
  errors.push(
    "docs/project/metrics/backlog.csv is missing — run: node scripts/pm/generate-dashboard.mjs",
  );
} else if (norm(expectedCsv) !== norm(readFileSync(BACKLOG_CSV, "utf8"))) {
  errors.push(
    "docs/project/metrics/backlog.csv is STALE (or was hand-edited) — run: node scripts/pm/generate-dashboard.mjs",
  );
}

// ---- report ----
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

if (errors.length) {
  console.error(
    `\ndocs:check FAILED — ${errors.length} error(s), ${warnings.length} warning(s) across ${stories.length} stories.`,
  );
  process.exit(1);
}
console.log(
  `docs:check passed — ${stories.length} stories, ${byId.size} unique ids, ${warnings.length} warning(s).`,
);
