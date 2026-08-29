#!/usr/bin/env bash
# Stop hook: if this turn touched supabase/migrations or supabase/tests,
# actually run the RLS check + pgTAP tests against the local DB (when it's
# up) so Claude can't finish a turn on a silently broken migration.
set -uo pipefail

export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 0

input="$(cat)"
stop_hook_active="$(echo "$input" | jq -r '.stop_hook_active // false')"
[ "$stop_hook_active" = "true" ] && exit 0

changed="$(git status --porcelain -- supabase/migrations supabase/tests 2>/dev/null)"
[ -z "$changed" ] && exit 0

if ! supabase status >/dev/null 2>&1; then
  echo "rls-on-stop: supabase/migrations or supabase/tests changed, but the local Supabase stack is not running — skipping automated RLS check. Run 'pnpm db:start && pnpm check:rls && pnpm db:test' manually." >&2
  exit 0
fi

if ! supabase db reset --local >/dev/null 2>&1; then
  echo "rls-on-stop: 'supabase db reset' failed. Fix the migration before finishing." >&2
  exit 2
fi

if ! output=$(bash scripts/check-rls.sh 2>&1); then
  echo "rls-on-stop: RLS check failed:" >&2
  echo "$output" >&2
  exit 2
fi

if ! output=$(supabase test db 2>&1); then
  echo "rls-on-stop: pgTAP tests failed:" >&2
  echo "$output" >&2
  exit 2
fi

exit 0
