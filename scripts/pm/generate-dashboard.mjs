#!/usr/bin/env node
/**
 * Project dashboard generator — adapted from Docket Agentic SDLC
 * (github.com/compadrejunior/docket-pub) for this project's own 5-stage SDLC
 * (Plan -> Build -> Test -> PR -> Deploy, see docs/project/SDLC.md), which locally
 * overrides Docket's stock 4-folder Plan/Ready/Build-Review/Close flow. Upstream Docket
 * is never modified; this is a local, adapted copy.
 *
 * Derives the business-facing management view from the story folders + frontmatter.
 * Source of truth: docs/stories/<stage folder>/*.md and docs/project/epics.md.
 *
 * Writes:
 *   docs/project/DASHBOARD.md
 *   docs/project/ROADMAP.md
 *   docs/project/dashboard.html
 *   docs/project/metrics/snapshots.csv   (append/upsert today's row)
 *   docs/project/metrics/cycle-times.csv (overwrite)
 *   docs/project/metrics/backlog.csv     (overwrite; also patches backlog.html's inline copy)
 *
 * Usage: node scripts/pm/generate-dashboard.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig } from "../lib/config.mjs";

// ============================================================================
// CONFIG — everything project-specific lives in docket.config.json, which
// check-docs.mjs reads too, so the two can no longer drift apart.
// ============================================================================

const CWD = process.cwd();
const CONFIG = loadConfig(CWD);

const PRODUCT_NAME = CONFIG.product.name;
const STORIES = CONFIG.dirs.stories;
const PROJECT = CONFIG.dirs.project;
const METRICS = CONFIG.dirs.metrics;
const EPICS_MD = CONFIG.dirs.epicsMd;

// Stage folder names -> derived `status` value. Folder location IS status — exact
// casing/spacing matters, since these are literal directory names under docs/stories/.
// This is the project's own 5-stage SDLC (Plan/Build/Test/PR/Deploy) plus Archived,
// extending Docket's stock 4-folder scheme so cycle time can be measured per stage.
export const FOLDER_STATUS = {
  "1. PLAN": "plan",
  "2. BUILD": "build",
  "3. TEST": "test",
  "4. PR": "pr",
  "5. DEPLOY": "deploy",
  "6. ARCHIVED": "archived",
};

// A story counts as delivered once it reaches Deploy (or is later Archived) — this is
// the completion signal used for percentages, dependency-readiness and calibration.
const DELIVERED_STATUSES = new Set(["deploy", "archived"]);

// Size → points, and size → default cycle-time (days) before any observed data exists.
export const POINTS = { S: 1, M: 3, L: 5, XL: 8 };
const DEFAULT_DAYS = { S: 1, M: 3, L: 5, XL: 8 };

// A size's estimate switches from DEFAULT_DAYS to the observed median once it has
// at least this many exact-dated delivered samples.
const CALIBRATION_SAMPLE_THRESHOLD = 3;

export const PRIORITY_RANK = { high: 0, medium: 1, low: 2, unset: 3 };

// Title vocabulary-scrubbing regex from config.product.titleScrubRegex: strips jargon
// from generated management-view titles. Leave the config value `null` to disable it.
const TECH = CONFIG.product.titleScrub;

// ============================================================================
// End of config block.
// ============================================================================

// ---- date helpers (plain script; Date is fine here) ----
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = iso(today);
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs) =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;

function businessTitle(t) {
  let s = (t || "").replace(/^\s*\[[^\]]+\]\s*/, ""); // drop leading "[Tag]"-style prefix
  if (TECH) {
    s = s.replace(TECH, " ");
    s = s
      .replace(/\s*\+\s*[/,]\s*/g, " ")
      .replace(/\s*[/,]\s*\+\s*/g, " ")
      .replace(/\(\s*[+/,]\s*/g, "(")
      .replace(/\s*[+/,]\s*\)/g, ")")
      .replace(/\(\s*\)/g, " ")
      .replace(/\s+\)/g, ")")
      .replace(/\(\s+/g, "(");
    s = s
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.])/g, "$1")
      .trim();
  }
  s = s
    .replace(/^[-–—:\s]+/, "")
    .replace(/[-–—:\s(]+$/, "")
    .trim();
  return s || t;
}
// Mermaid-safe label (no colons/semis/brackets/newlines)
const mmLabel = (t) =>
  businessTitle(t)
    .replace(/[:;#[\]<>|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

// ---- parse epics.md canonical table ----
// Format contract: a markdown table shaped `| n | Epic | Capability | Status |`,
// parsed POSITIONALLY, not by column name — column headers can say anything, but the
// four cells of each data row must appear in this order.
export function loadEpics() {
  const md = readFileSync(EPICS_MD, "utf8");
  const epics = new Map(); // epic -> {capability, status}
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (m) epics.set(m[1].trim(), { capability: m[2].trim(), status: m[3].trim() });
  }
  if (!epics.size) throw new Error("Could not parse canonical epics from epics.md");
  return epics;
}

// ---- parse a story file's frontmatter ----
function parseStory(folder, name) {
  const raw = readFileSync(join(STORIES, folder, name), "utf8");
  if (!raw.trimStart().startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  const fm = raw.slice(raw.indexOf("---") + 3, end);
  const get = (k) => {
    // [ \t]* not \s* — \s crosses newlines, so an empty field would capture the next line
    const m = fm.match(new RegExp("^" + k + ":[ \\t]*(.*)$", "m"));
    if (!m) return "";
    let v = m[1].trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      try {
        v = JSON.parse(v);
      } catch {
        /* not a JSON-quoted value, keep raw string */
      }
    }
    return v;
  };
  // depends_on: YAML inline list `[US-1, US-2]`, or a bare/semicolon/comma-separated list
  const list = (k) =>
    get(k)
      .replace(/^\[|\]$/g, "")
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    file: `${folder}/${name}`,
    status: FOLDER_STATUS[folder],
    id: get("id"),
    title: get("title"),
    epic: get("epic"),
    size: (get("size") || "M").toUpperCase(),
    priority: (get("priority") || "unset").toLowerCase(),
    mvp: get("mvp").toLowerCase(),
    depends_on: list("depends_on"),
    started: get("started"),
    test_started: get("test_started"),
    pr_opened: get("pr_opened"),
    deployed: get("deployed"),
    completed: get("completed"),
    date_confidence: (get("date_confidence") || "approx").toLowerCase(),
  };
}

export function loadStories() {
  const out = [];
  for (const folder of Object.keys(FOLDER_STATUS)) {
    let entries;
    try {
      entries = readdirSync(join(STORIES, folder));
    } catch {
      continue;
    }
    for (const name of entries) {
      if (!name.toLowerCase().endsWith(".md")) continue;
      const s = parseStory(folder, name);
      if (s) out.push(s);
    }
  }
  return out;
}

// ---- Ready/Blocked (never authored — always the exact inverse-of-status computation) ----
// A story is Ready when every story it depends_on has reached Deploy or Archived
// (vacuously true when it has no dependencies); otherwise it is Blocked.
export function computeReady(list) {
  const statusById = new Map(list.map((s) => [s.id, s.status]));
  const out = new Map();
  for (const s of list)
    out.set(
      s.id,
      s.depends_on.every((dep) => DELIVERED_STATUSES.has(statusById.get(dep))),
    );
  return out;
}

// ---- progress bar ----
function bar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function main() {
  const epicsMeta = loadEpics();
  const stories = loadStories();

  // validate epics
  const bad = stories.filter((s) => !epicsMeta.has(s.epic));
  if (bad.length) {
    console.error("Stories with non-canonical epics:");
    bad.forEach((s) => console.error(`  ${s.file}: "${s.epic}"`));
    process.exit(1);
  }

  const active = stories.filter((s) => s.status !== "archived"); // planning universe
  const counts = { plan: 0, build: 0, test: 0, pr: 0, deploy: 0, archived: 0 };
  stories.forEach((s) => counts[s.status]++);
  const pts = (list) => list.reduce((a, s) => a + (POINTS[s.size] || 3), 0);
  const totalPts = pts(active);
  const delivered = active.filter((s) => DELIVERED_STATUSES.has(s.status));
  const donePts = pts(delivered);
  const pctCount = active.length ? Math.round((delivered.length / active.length) * 100) : 0;
  const pctPts = totalPts ? Math.round((donePts / totalPts) * 100) : 0;

  // ---- cycle-time calibration (exact-dated, delivered stories: started -> deployed) ----
  const cyc = { S: [], M: [], L: [], XL: [] };
  stories.forEach((s) => {
    if (
      DELIVERED_STATUSES.has(s.status) &&
      s.date_confidence === "exact" &&
      s.started &&
      s.deployed
    ) {
      const d = daysBetween(s.started, s.deployed);
      if (d >= 0 && cyc[s.size]) cyc[s.size].push(d);
    }
  });
  const calib = {};
  for (const sz of ["S", "M", "L", "XL"]) {
    const xs = cyc[sz];
    calib[sz] = {
      n: xs.length,
      median: median(xs),
      mean: mean(xs),
      min: xs.length ? Math.min(...xs) : null,
      max: xs.length ? Math.max(...xs) : null,
    };
  }
  const daysFor = (sz) =>
    calib[sz].n >= CALIBRATION_SAMPLE_THRESHOLD && calib[sz].median != null
      ? { days: calib[sz].median, basis: "observed" }
      : { days: DEFAULT_DAYS[sz], basis: "default" };

  // ---- story-point estimation baseline (days of effort observed per point) ----
  const daysPerPoint = (sz) => {
    const { days, basis } = daysFor(sz);
    return { value: +(days / POINTS[sz]).toFixed(2), basis };
  };

  // ---- epic rollup ----
  const byEpic = new Map();
  for (const epic of epicsMeta.keys())
    byEpic.set(epic, { plan: 0, build: 0, test: 0, pr: 0, deploy: 0, archived: 0, list: [] });
  stories.forEach((s) => {
    const e = byEpic.get(s.epic);
    e[s.status]++;
    e.list.push(s);
  });

  writeDashboard({
    counts,
    active,
    delivered,
    pctCount,
    pctPts,
    donePts,
    totalPts,
    byEpic,
    epicsMeta,
    calib,
    stories,
    daysPerPoint,
  });
  writeRoadmap({ stories, epicsMeta, daysFor });
  writeHtml({ counts, pctCount, pctPts, byEpic, epicsMeta });
  upsertSnapshot({ counts, donePts, totalPts, deliveredCount: delivered.length });
  writeCycleTimes({ calib, daysPerPoint });
  const backlogRows = writeBacklogCsv({ stories, epicsMeta });

  console.log(
    `dashboard generated @ ${TODAY} — ${active.length} active stories, ${pctCount}% by count / ${pctPts}% by effort`,
  );
  console.log(
    `backlog.csv generated — ${backlogRows} stories (depended_by / points / epic_no computed)`,
  );
}

function writeDashboard({
  counts,
  active,
  delivered,
  pctCount,
  pctPts,
  donePts,
  totalPts,
  byEpic,
  epicsMeta,
  calib,
  stories,
  daysPerPoint,
}) {
  const L = [];
  L.push(`# ${PRODUCT_NAME} — Project Dashboard`, "");
  L.push(
    `> **Generated ${TODAY}** from the story backlog. Do not edit by hand — run \`/pm-dashboard\` (or \`node scripts/pm/generate-dashboard.mjs\`) to refresh. Stages follow this project's SDLC — see [SDLC.md](SDLC.md).`,
    "",
  );
  L.push("## Overall progress", "");
  L.push(
    `- **By story count:** ${delivered.length} of ${active.length} delivered (Deploy or Archived) — **${pctCount}%**  \`${bar(pctCount)}\``,
  );
  L.push(
    `- **By effort (size points):** ${donePts} of ${totalPts} pts — **${pctPts}%**  \`${bar(pctPts)}\``,
  );
  L.push(
    `- **Plan:** ${counts.plan} · **Build:** ${counts.build} · **Test:** ${counts.test} · **PR:** ${counts.pr} · **Deploy:** ${counts.deploy} · **Archived:** ${counts.archived} (excluded from totals)`,
    "",
  );

  L.push(
    "```mermaid",
    "pie showData",
    "    title Story stage",
    `    "Plan" : ${counts.plan}`,
    `    "Build" : ${counts.build}`,
    `    "Test" : ${counts.test}`,
    `    "PR" : ${counts.pr}`,
    `    "Deploy" : ${counts.deploy}`,
    "```",
    "",
  );

  // burn-up from snapshots
  const burn = readSnapshots();
  if (burn.length >= 2) {
    L.push("## Burn-up", "");
    L.push(
      "```mermaid",
      "xychart-beta",
      '    title "Stories delivered over time"',
      `    x-axis [${burn.map((r) => r.date.slice(5)).join(", ")}]`,
      `    y-axis "Stories" 0 --> ${Math.max(...burn.map((r) => r.total))}`,
      `    line [${burn.map((r) => r.delivered).join(", ")}]`,
      `    line [${burn.map((r) => r.total).join(", ")}]`,
      "```",
      "",
    );
  }

  L.push("## Progress by epic", "");
  L.push("| Epic | Capability status | Deploy | PR | Test | Build | Plan | % (effort) | |");
  L.push("|------|-------------------|-------:|---:|-----:|------:|-----:|-----------:|--|");
  for (const [epic, meta] of epicsMeta) {
    const e = byEpic.get(epic);
    const act = [...e.list].filter((s) => s.status !== "archived");
    const tp = act.reduce((a, s) => a + POINTS[s.size], 0);
    const dp = act
      .filter((s) => DELIVERED_STATUSES.has(s.status))
      .reduce((a, s) => a + POINTS[s.size], 0);
    const pct = tp ? Math.round((dp / tp) * 100) : 0;
    if (!e.list.length) continue;
    L.push(
      `| ${epic} | ${meta.status} | ${e.deploy} | ${e.pr} | ${e.test} | ${e.build} | ${e.plan} | ${pct}% | \`${bar(pct, 12)}\` |`,
    );
  }
  L.push("");

  // Now / Next / Delivered
  const inProgress = stories.filter(
    (s) => s.status === "build" || s.status === "test" || s.status === "pr",
  );
  const planned = stories
    .filter((s) => s.status === "plan")
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  const deployed = stories.filter((s) => s.status === "deploy");
  L.push("## Now — in progress (Build / Test / PR)", "");
  if (inProgress.length) {
    inProgress.forEach((s) =>
      L.push(`- **${businessTitle(s.title)}** — _${s.epic}_ · ${s.size} · stage: ${s.status}`),
    );
  } else {
    L.push("_Nothing in progress._");
  }
  L.push("", "## Next — top of the Plan backlog", "");
  planned
    .slice(0, 10)
    .forEach((s) =>
      L.push(`- ${businessTitle(s.title)} — _${s.epic}_ · ${s.size} · priority: ${s.priority}`),
    );
  if (planned.length > 10) L.push(`- …and ${planned.length - 10} more in the backlog.`);
  L.push("", `## Delivered — ${deployed.length} in Deploy, ${counts.archived} Archived`, "");
  L.push(
    "See [ROADMAP.md](ROADMAP.md) for the timeline and [How long stories actually take](#how-long-stories-actually-take).",
    "",
  );

  L.push("## How long stories actually take", "");
  L.push("_Measured end-to-end, from Build start to Deploy._", "");
  const anyExact = Object.values(calib).some((c) => c.n > 0);
  if (!anyExact) {
    L.push(
      "_No delivered stories carry tracked start/deploy dates yet, so cycle-time calibration has no samples._",
    );
    L.push(
      "_As stories move through Build → Test → PR → Deploy with real dates, this table fills in and the roadmap estimates become empirical instead of default._",
      "",
    );
  } else {
    L.push(
      "| Size | Points (baseline) | Samples | Median days | Mean | Min | Max | Days/point | Basis |",
    );
    L.push(
      "|------|------------------:|--------:|------------:|-----:|----:|----:|-----------:|-------|",
    );
    for (const sz of ["S", "M", "L", "XL"]) {
      const c = calib[sz];
      const dpp = daysPerPoint(sz);
      L.push(
        `| ${sz} | ${POINTS[sz]} | ${c.n} | ${c.median ?? "—"} | ${c.mean ?? "—"} | ${c.min ?? "—"} | ${c.max ?? "—"} | ${dpp.value} | ${dpp.basis} |`,
      );
    }
    L.push(
      "",
      `_Only stories with observed (\`exact\`) dates are counted; backfilled (\`approx\`) dates are excluded so estimates stay honest. A size switches from default to observed once it has ≥${CALIBRATION_SAMPLE_THRESHOLD} samples. **Days/point** is the story-point estimation baseline: it starts at the flat one-day-per-point assumption and recalibrates to the observed ratio (median days ÷ baseline points) as real \`started\`/\`deployed\` dates accumulate. Use it to sanity-check the \`size:\` you assign to a new story._`,
      "",
    );
  }

  L.push("---", "", "_Derived from `docs/stories/` + `docs/project/epics.md`._");
  writeFileSync(join(PROJECT, "DASHBOARD.md"), L.join("\n") + "\n");
}

function writeRoadmap({ stories, epicsMeta, daysFor }) {
  const L = [];
  L.push(`# ${PRODUCT_NAME} — Roadmap & Timeline`, "");
  L.push(
    `> **Generated ${TODAY}.** Delivered work with tracked dates is shown on the timeline; remaining work is projected forward. Do not edit by hand.`,
    "",
  );

  // Business capability status
  L.push("## Business capability status", "");
  L.push("| Capability status | Epics |");
  L.push("|-------------------|-------|");
  const byStatus = new Map();
  for (const [epic, meta] of epicsMeta) {
    if (!byStatus.has(meta.status)) byStatus.set(meta.status, []);
    byStatus.get(meta.status).push(epic);
  }
  const order = [...new Set([...epicsMeta.values()].map((meta) => meta.status))];
  for (const st of [...byStatus.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b))) {
    L.push(`| ${st} | ${byStatus.get(st).join(", ")} |`);
  }
  L.push("");

  // Forward schedule: Build/Test/PR first (already started), then Plan by priority.
  // Sequential (single-team assumption).
  const open = [
    ...stories.filter((s) => s.status === "build" || s.status === "test" || s.status === "pr"),
    ...stories
      .filter((s) => s.status === "plan")
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]),
  ];
  const usesObserved = ["S", "M", "L", "XL"].some((sz) => daysFor(sz).basis === "observed");
  L.push("## Forward plan", "");
  L.push(
    `> **Basis:** durations are ${usesObserved ? "a mix of **observed** cycle times (from delivered stories) and defaults where samples are thin" : "**default** point-per-day estimates (no delivered stories have tracked dates yet)"}. Single-team sequential assumption starting ${TODAY}. This is a projection, not a commitment.`,
    "",
  );

  let cursor = TODAY;
  const scheduled = open.map((s) => {
    const { days, basis } = daysFor(s.size);
    const start = cursor;
    const end = addDays(start, Math.max(1, days));
    cursor = end;
    return { ...s, start, end, days, basis };
  });

  L.push(
    "```mermaid",
    "gantt",
    "    dateFormat YYYY-MM-DD",
    "    axisFormat %b %d",
    "    title Remaining work (projected)",
  );
  const epicOrder = [...new Set(scheduled.map((s) => s.epic))];
  for (const epic of epicOrder) {
    L.push(`    section ${epic.replace(/[:#]/g, " ")}`);
    for (const s of scheduled.filter((x) => x.epic === epic)) {
      const tag = s.status !== "plan" ? "active, " : "";
      L.push(`    ${mmLabel(s.title)} (${s.size}) :${tag}${s.start}, ${s.end}`);
    }
  }
  L.push("```", "");

  L.push("## Delivered timeline (tracked dates only)", "");
  const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  const deliveredDated = stories.filter(
    (s) => DELIVERED_STATUSES.has(s.status) && isISO(s.started) && isISO(s.deployed),
  );
  if (!deliveredDated.length) {
    L.push(
      "_No delivered stories have tracked start/deploy dates yet. Once stories move through the folders with real dates recorded, they appear here on the timeline and feed the cycle-time calibration._",
      "",
    );
  } else {
    L.push(
      "```mermaid",
      "gantt",
      "    dateFormat YYYY-MM-DD",
      "    axisFormat %b %d",
      "    title Delivered",
    );
    const epicsD = [...new Set(deliveredDated.map((s) => s.epic))];
    for (const epic of epicsD) {
      L.push(`    section ${epic.replace(/[:#]/g, " ")}`);
      for (const s of deliveredDated.filter((x) => x.epic === epic))
        L.push(`    ${mmLabel(s.title)} :done, ${s.started}, ${s.deployed}`);
    }
    L.push("```", "");
  }

  L.push(
    "---",
    "",
    '_Forward estimates self-calibrate: as delivered stories accrue real dates, per-size durations shift from default to observed. See DASHBOARD "How long stories actually take"._',
  );
  writeFileSync(join(PROJECT, "ROADMAP.md"), L.join("\n") + "\n");
}

function writeHtml({ counts, pctCount, pctPts, byEpic, epicsMeta }) {
  const active = counts.plan + counts.build + counts.test + counts.pr + counts.deploy;
  const epicRows = [...epicsMeta.entries()]
    .map(([epic, meta]) => {
      const e = byEpic.get(epic);
      const act = e.list.filter((s) => s.status !== "archived");
      const tp = act.reduce((a, s) => a + POINTS[s.size], 0);
      const dp = act
        .filter((s) => DELIVERED_STATUSES.has(s.status))
        .reduce((a, s) => a + POINTS[s.size], 0);
      const pct = tp ? Math.round((dp / tp) * 100) : 0;
      const delivered = act.filter((s) => DELIVERED_STATUSES.has(s.status)).length;
      if (!e.list.length) return "";
      return `<tr><td>${epic}</td><td><span class="chip">${meta.status}</span></td><td class="barcell"><div class="track"><div class="fill" style="width:${pct}%"></div></div><span class="pct">${pct}%</span></td><td class="num">${delivered}/${act.length}</td></tr>`;
    })
    .join("");
  const ring = (pct, label) =>
    `<div class="ring" style="--p:${pct}"><div class="ring-inner"><span class="ring-pct">${pct}%</span><span class="ring-lbl">${label}</span></div></div>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${PRODUCT_NAME} — Project Dashboard</title>
<style>
:root{--bg:#f7f8fa;--card:#fff;--ink:#1c2530;--muted:#5b6b7d;--line:#e6eaef;--accent:#2f6feb;--good:#1f9d55;--warn:#c47f17;--bad:#c0392b}
@media(prefers-color-scheme:dark){:root{--bg:#0f141a;--card:#161d26;--ink:#e6edf3;--muted:#9fb0c0;--line:#232c37;--accent:#5b8dff}}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink)}
.wrap{max-width:960px;margin:0 auto;padding:28px 20px}
h1{font-size:22px;margin:0 0 4px}.sub{color:var(--muted);font-size:13px;margin-bottom:22px}
.cards{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px;flex:1;min-width:150px}
.card h3{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.rings{display:flex;gap:22px;align-items:center;justify-content:center}
.ring{--p:0;width:104px;height:104px;border-radius:50%;background:conic-gradient(var(--accent) calc(var(--p)*1%),var(--line) 0);display:grid;place-items:center}
.ring-inner{width:78px;height:78px;border-radius:50%;background:var(--card);display:grid;place-items:center;text-align:center}
.ring-pct{font-size:20px;font-weight:700}.ring-lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--line);font-size:14px}
th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}tr:last-child td{border-bottom:0}
td.num{text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}
.barcell{width:42%}.track{display:inline-block;width:calc(100% - 44px);height:8px;border-radius:6px;background:var(--line);vertical-align:middle;overflow:hidden}
.fill{height:100%;background:var(--accent)}.pct{font-size:12px;color:var(--muted);margin-left:8px}
.chip{font-size:11px;padding:2px 8px;border-radius:20px;background:var(--line);color:var(--ink);white-space:nowrap}
.foot{color:var(--muted);font-size:12px;margin-top:20px}
</style></head><body><div class="wrap">
<h1>${PRODUCT_NAME} — Project Dashboard</h1><div class="sub">Generated ${TODAY} · business/functional view · ${active} active stories</div>
<div class="cards">
<div class="card"><h3>Completion</h3><div class="rings">${ring(pctCount, "by count")}${ring(pctPts, "by effort")}</div></div>
<div class="card"><h3>Pipeline</h3>
<p style="margin:6px 0"><b style="font-size:26px">${counts.build + counts.test + counts.pr}</b> in progress</p>
<p style="margin:6px 0"><b style="font-size:26px">${counts.plan}</b> in backlog</p>
<p style="margin:6px 0;color:var(--muted)">${counts.deploy} delivered · ${counts.archived} archived</p></div>
</div>
<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Progress by epic</h3>
<table><thead><tr><th>Epic</th><th>Capability</th><th>Progress (effort)</th><th class="num">Done</th></tr></thead><tbody>${epicRows}</tbody></table>
<p class="foot">Derived from docs/stories/ + docs/project/epics.md. Refresh with <code>/pm-dashboard</code>.</p>
</div></body></html>`;
  writeFileSync(join(PROJECT, "dashboard.html"), html);
}

function readSnapshots() {
  const fp = join(METRICS, "snapshots.csv");
  if (!existsSync(fp)) return [];
  return readFileSync(fp, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .filter(Boolean)
    .map((l) => {
      const [date, total, delivered, in_progress, plan, points_done, points_total] = l.split(",");
      return {
        date,
        total: +total,
        delivered: +delivered,
        in_progress: +in_progress,
        plan: +plan,
        points_done: +points_done,
        points_total: +points_total,
      };
    });
}
function upsertSnapshot({ counts, donePts, totalPts, deliveredCount }) {
  if (!existsSync(METRICS)) mkdirSync(METRICS, { recursive: true });
  const header = "date,total,delivered,in_progress,plan,points_done,points_total";
  const rows = readSnapshots().filter((r) => r.date !== TODAY);
  const total = counts.plan + counts.build + counts.test + counts.pr + counts.deploy;
  const inProgress = counts.build + counts.test + counts.pr;
  rows.push({
    date: TODAY,
    total,
    delivered: deliveredCount,
    in_progress: inProgress,
    plan: counts.plan,
    points_done: donePts,
    points_total: totalPts,
  });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  const body = rows
    .map((r) =>
      [r.date, r.total, r.delivered, r.in_progress, r.plan, r.points_done, r.points_total].join(
        ",",
      ),
    )
    .join("\n");
  writeFileSync(join(METRICS, "snapshots.csv"), header + "\n" + body + "\n");
}
function writeCycleTimes({ calib, daysPerPoint }) {
  if (!existsSync(METRICS)) mkdirSync(METRICS, { recursive: true });
  const header =
    "size,points_baseline,samples,median_days,mean_days,min_days,max_days,basis,days_per_point";
  const rows = ["S", "M", "L", "XL"].map((sz) => {
    const c = calib[sz];
    const basis = c.n >= CALIBRATION_SAMPLE_THRESHOLD ? "observed" : "default";
    return [
      sz,
      POINTS[sz],
      c.n,
      c.median ?? "",
      c.mean ?? "",
      c.min ?? "",
      c.max ?? "",
      basis,
      daysPerPoint(sz).value,
    ].join(",");
  });
  writeFileSync(join(METRICS, "cycle-times.csv"), header + "\n" + rows.join("\n") + "\n");
}

// ---- backlog.csv: the working backlog view, DERIVED from story frontmatter ----
// Authored per story: epic, size, priority, mvp, depends_on (+ folder = status, + dates).
// Computed here: status label, points, epic_no, and depended_by (the inverse of depends_on).
const STATUS_LABEL = {
  plan: "Plan",
  build: "Build",
  test: "Test",
  pr: "PR",
  deploy: "Deploy",
  archived: "Archived",
};
const STATUS_SORT = ["build", "test", "pr", "deploy", "plan", "archived"];
const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildBacklog({ stories, epicsMeta }) {
  const epicNo = new Map([...epicsMeta.keys()].map((e, i) => [e, i + 1]));

  // A story id may have more than one file (e.g. a rework split); one backlog row per id.
  const byId = new Map();
  for (const s of stories) {
    const cur = byId.get(s.id);
    if (!cur) {
      byId.set(s.id, { ...s, files: [s.file], depends_on: [...s.depends_on] });
    } else {
      cur.files.push(s.file);
      cur.depends_on = [...new Set([...cur.depends_on, ...s.depends_on])];
      cur.mvp ||= s.mvp;
      cur.started ||= s.started;
      cur.test_started ||= s.test_started;
      cur.pr_opened ||= s.pr_opened;
      cur.deployed ||= s.deployed;
      cur.completed ||= s.completed;
      if (cur.priority === "unset") cur.priority = s.priority;
    }
  }

  // depended_by is the exact inverse of depends_on — never authored, always computed.
  const dependedBy = new Map();
  for (const s of byId.values()) {
    for (const dep of s.depends_on) {
      if (!dependedBy.has(dep)) dependedBy.set(dep, []);
      dependedBy.get(dep).push(s.id);
    }
  }

  const ready = computeReady([...byId.values()]);

  const rows = [...byId.values()].sort(
    (a, b) =>
      STATUS_SORT.indexOf(a.status) - STATUS_SORT.indexOf(b.status) ||
      (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3) ||
      a.id.localeCompare(b.id),
  );

  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    epic: s.epic,
    epic_no: epicNo.get(s.epic) ?? "",
    status: STATUS_LABEL[s.status],
    priority: s.priority === "unset" ? "" : s.priority.replace(/^./, (c) => c.toUpperCase()),
    size: s.size,
    points: POINTS[s.size] ?? 3,
    mvp: s.mvp ? s.mvp.replace(/^./, (c) => c.toUpperCase()) : "",
    ready: ready.get(s.id) ? "Yes" : "No",
    depends_on: s.depends_on.join(";"),
    depended_by: (dependedBy.get(s.id) || []).sort().join(";"),
    started: s.started,
    test_started: s.test_started,
    pr_opened: s.pr_opened,
    deployed: s.deployed,
    completed: s.completed,
    files: s.files.join(" | "),
  }));
}

export function backlogCsvText({ stories, epicsMeta }) {
  const rows = buildBacklog({ stories, epicsMeta });
  if (!rows.length)
    return "id,title,epic,epic_no,status,priority,size,points,mvp,ready,depends_on,depended_by,started,test_started,pr_opened,deployed,completed,files\n";
  const cols = Object.keys(rows[0]);
  return (
    [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n"
  );
}

// backlog.html keeps an inline copy of the CSV so it still works when opened straight off disk
// (browsers block fetch() on file://). Refresh it here, or it silently drifts from the real CSV.
export function injectCsvIntoHtml(html, csv) {
  const open = '<script id="csv" type="text/plain">';
  const start = html.indexOf(open);
  if (start === -1) return null;
  const end = html.indexOf("<\/script>", start);
  if (end === -1) return null;
  return html.slice(0, start + open.length) + "\n" + csv + html.slice(end);
}

function writeBacklogCsv({ stories, epicsMeta }) {
  if (!existsSync(METRICS)) mkdirSync(METRICS, { recursive: true });
  const text = backlogCsvText({ stories, epicsMeta });
  writeFileSync(join(METRICS, "backlog.csv"), text);

  const htmlPath = join(PROJECT, "backlog.html");
  if (existsSync(htmlPath)) {
    const updated = injectCsvIntoHtml(readFileSync(htmlPath, "utf8"), text);
    if (updated) writeFileSync(htmlPath, updated);
    else console.warn('warn: could not find the inline <script id="csv"> block in backlog.html');
  }
  return text.trim().split("\n").length - 1;
}

// Only run the generator when invoked directly — check-docs.mjs imports the helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
