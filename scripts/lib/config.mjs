/**
 * Single reader for `docket.config.json`.
 *
 * Adapted from Docket Agentic SDLC (github.com/compadrejunior/docket-pub) for this
 * project's local-only setup: Jira/Confluence integrations are not adopted here, so
 * their config sections stay at their disabled defaults and are never read by the
 * scripts in this repo. Kept in the shape upstream Docket ships it so a future
 * integration only means flipping `enabled: true`, not restructuring this file.
 *
 * A missing config file is not an error: the defaults below ARE the shipped
 * configuration, so the local core runs in a repository that has no config at all.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULTS = {
  version: 1,
  product: { name: "Docket", titleScrubRegex: null },
  paths: { docs: "docs", stories: "docs/stories", project: "docs/project" },
  jira: { enabled: false },
  confluence: { enabled: false },
  repository: { provider: "auto", baseBranch: "master" },
};

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function merge(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    if (v === undefined) continue;
    out[k] = isObject(v) && isObject(base[k]) ? merge(base[k], v) : v;
  }
  return out;
}

export function loadConfig(cwd = process.cwd()) {
  const file = join(cwd, "docket.config.json");
  let raw = {};

  if (existsSync(file)) {
    try {
      raw = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      throw new Error(`docket.config.json is not valid JSON: ${e.message}`);
    }
  }
  delete raw.$schema;

  const cfg = merge(DEFAULTS, raw);

  // Absolute path helpers, so no caller has to re-join docs/... by hand.
  const p = cfg.paths;
  cfg.dirs = {
    root: resolve(cwd),
    docs: resolve(cwd, p.docs),
    stories: resolve(cwd, p.stories),
    project: resolve(cwd, p.project),
    metrics: resolve(cwd, p.project, "metrics"),
    epicsMd: resolve(cwd, p.project, "epics.md"),
  };

  // titleScrubRegex is stored as a string in JSON; compile it once here.
  cfg.product.titleScrub = cfg.product.titleScrubRegex
    ? new RegExp(cfg.product.titleScrubRegex, "gi")
    : null;

  return cfg;
}
