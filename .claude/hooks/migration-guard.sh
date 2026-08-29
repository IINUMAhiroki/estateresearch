#!/usr/bin/env bash
# PostToolUse (Edit|Write) guard: any new/modified Supabase migration must
# enable RLS at least as many times as it creates tables. This is a fast,
# static check — the authoritative check is `pnpm check:rls` + pgTAP.
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

case "$file_path" in
  */supabase/migrations/*.sql) ;;
  *) exit 0 ;;
esac

[ -f "$file_path" ] || exit 0

create_count=$(grep -ciE '^\s*create table' "$file_path" || true)
rls_count=$(grep -ciE 'enable row level security' "$file_path" || true)

if [ "$create_count" -gt "$rls_count" ]; then
  echo "migration-guard: $file_path creates $create_count table(s) but only enables RLS $rls_count time(s)." >&2
  echo "Every 'create table' in supabase/migrations must be followed by 'alter table ... enable row level security' and explicit policies in the same file." >&2
  exit 2
fi

exit 0
