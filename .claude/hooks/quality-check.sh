#!/usr/bin/env bash
# PreToolUse gate on `git commit`: run biome check + tsc --noEmit + vitest
# before the commit is allowed to happen. Exits 2 (blocking) on any failure
# so Claude has to fix the issue and retry instead of committing broken code.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0

run() { mise exec -- "$@"; }

# Secret scan: block commits containing likely credentials. Cheap, high-value
# guardrail against an AI agent accidentally staging a real key.
staged_diff="$(git diff --cached -U0 -- . ':!pnpm-lock.yaml')"
secret_patterns='sb_secret_[A-Za-z0-9_-]|SUPABASE_SECRET_KEY\s*=\s*[^$'"'"'"[:space:]]|AKIA[0-9A-Z]{16}|-----BEGIN[A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}'
if echo "$staged_diff" | grep -E "^\+" | grep -qE "$secret_patterns"; then
  echo "quality-check: staged diff looks like it contains a secret/credential. Remove it (use .env.local, never commit real keys) before committing." >&2
  echo "$staged_diff" | grep -E "^\+" | grep -E "$secret_patterns" >&2
  exit 2
fi

if ! output=$(run pnpm check 2>&1); then
  echo "quality-check: biome check failed (run 'pnpm check:write' to auto-fix formatting):" >&2
  echo "$output" >&2
  exit 2
fi

if ! output=$(run pnpm typecheck 2>&1); then
  echo "quality-check: tsc --noEmit failed:" >&2
  echo "$output" >&2
  exit 2
fi

if ! output=$(run pnpm test 2>&1); then
  echo "quality-check: vitest failed:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
