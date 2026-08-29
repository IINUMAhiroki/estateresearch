#!/usr/bin/env bash
# PostToolUse: auto-format the file that was just edited/written. Keeps
# formatting drift from accumulating instead of only catching it at commit
# time (the quality-check.sh Stop/PreToolUse gate is the backstop, not the
# primary formatting loop).
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *.ts | *.tsx | *.js | *.jsx | *.json | *.css) ;;
  *) exit 0 ;;
esac

mise exec -- pnpm exec biome check --write "$file_path" >/dev/null 2>&1

exit 0
