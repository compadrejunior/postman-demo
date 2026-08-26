#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash). Fast-fail convenience layer only — the
# real enforcement is the husky pre-commit hook in .husky/pre-commit, which
# runs regardless of whether the commit came from this session or a human
# typing `git commit` directly. See docs/testing.md and CLAUDE.md > Git
# workflow for why both exist.
#
# Reads the Claude Code hook JSON payload from stdin, and if the Bash
# command being run looks like `git commit`, blocks it (exit 2) when the
# current branch is master/main, or when the coverage suite fails.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

PAYLOAD="$(cat)"
COMMAND="$(node -e '
  let data = "";
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => {
    try {
      const parsed = JSON.parse(data);
      process.stdout.write(parsed?.tool_input?.command ?? "");
    } catch {
      process.stdout.write("");
    }
  });
' <<<"$PAYLOAD")"

if [[ "$COMMAND" != *"git commit"* ]]; then
  exit 0
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
if [[ "$CURRENT_BRANCH" == "master" || "$CURRENT_BRANCH" == "main" ]]; then
  echo "Direct commits to '$CURRENT_BRANCH' are not allowed. Create a Gitflow branch (feature/*, bugfix/*, hotfix/*, release/*) first — see CLAUDE.md > Git workflow." >&2
  exit 2
fi

if ! npm run test:coverage --silent; then
  echo "Coverage check failed — 'npm run test:coverage' did not pass (needs >=90% on lines/functions/branches/statements). Fix coverage before committing. See docs/testing.md." >&2
  exit 2
fi

exit 0
