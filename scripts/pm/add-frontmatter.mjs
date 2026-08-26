#!/usr/bin/env node
/**
 * Generic frontmatter backfill for story files — adapted from Docket Agentic SDLC
 * (github.com/compadrejunior/docket-pub) for this project's 5-stage SDLC folders.
 *
 * For every docs/stories/<folder>/*.md file:
 *   - if it already has a `---` frontmatter block, backfill any MISSING keys from the
 *     schema below with a placeholder/default, and leave every existing key untouched.
 *   - if it has no frontmatter at all, prepend a full block with best-effort defaults
 *     derived from the filename and the file's first heading.
 *
 * Status is intentionally NOT written (the folder is the source of truth).
 *
 * `epic:` cannot be safely guessed — it's backfilled as an empty placeholder, which
 * `check-docs.mjs` will then flag as missing/non-canonical. Fill in a real epic from
 * docs/project/epics.md before running the generator.
 *
 * Idempotent — re-running only fills in still-missing keys.
 *
 * Usage: node scripts/pm/add-frontmatter.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "docs", "stories");
const FOLDERS = ["1. PLAN", "2. BUILD", "3. TEST", "4. PR", "5. DEPLOY", "6. ARCHIVED"];
const DRY = process.argv.includes("--dry");

// Schema: key -> default value used only when the key is entirely absent.
const SCHEMA_DEFAULTS = {
  id: "",
  title: "",
  epic: "",
  size: "M",
  priority: "unset",
  mvp: "",
  depends_on: "",
  started: "",
  test_started: "",
  pr_opened: "",
  deployed: "",
  completed: "",
  date_confidence: "approx",
};
const SCHEMA_ORDER = Object.keys(SCHEMA_DEFAULTS);

function idFromName(name) {
  const m = name.match(/^([A-Za-z]+-\d+)/);
  return m ? m[1].toUpperCase() : name.replace(/\.md$/i, "");
}
function titleFromBody(body, name) {
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return name
    .replace(/\.md$/i, "")
    .replace(/^[A-Za-z]+-\d+[_-]?/, "")
    .replace(/_/g, " ")
    .trim();
}

const yamlEsc = (v) => (/[:#"'[\]{}]|^\s|\s$/.test(v) ? JSON.stringify(v) : v);

function parseFrontmatter(raw) {
  if (!raw.trimStart().startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return null;
  const fm = raw.slice(raw.indexOf("---") + 3, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const keys = new Set();
  for (const line of fm.split("\n")) {
    const m = line.match(/^([A-Za-z_]+):/);
    if (m) keys.add(m[1]);
  }
  return { fm, body, keys };
}

let updated = 0,
  created = 0,
  skipped = 0;
for (const folder of FOLDERS) {
  let entries;
  try {
    entries = readdirSync(join(ROOT, folder));
  } catch {
    continue;
  }
  for (const name of entries) {
    if (!name.toLowerCase().endsWith(".md")) continue;
    const fp = join(ROOT, folder, name);
    const raw = readFileSync(fp, "utf8");
    const parsed = parseFrontmatter(raw);

    if (!parsed) {
      // No frontmatter at all — prepend a full block with best-effort defaults.
      const values = { ...SCHEMA_DEFAULTS, id: idFromName(name), title: titleFromBody(raw, name) };
      const fm = [
        "---",
        ...SCHEMA_ORDER.map((k) => `${k}: ${values[k] ? yamlEsc(values[k]) : ""}`),
        "---",
        "",
      ].join("\n");
      if (!DRY) writeFileSync(fp, fm + raw, "utf8");
      created++;
      continue;
    }

    // Frontmatter exists — backfill only the keys that are entirely missing.
    const missing = SCHEMA_ORDER.filter((k) => !parsed.keys.has(k));
    if (!missing.length) {
      skipped++;
      continue;
    }
    const addition = missing.map((k) => `${k}: ${SCHEMA_DEFAULTS[k]}`).join("\n");
    const newRaw = raw.replace(/\n---/, `\n${addition}\n---`);
    if (!DRY) writeFileSync(fp, newRaw, "utf8");
    updated++;
  }
}
console.log(
  `frontmatter: ${created} file(s) created fresh, ${updated} file(s) backfilled, ${skipped} already complete.`,
);
