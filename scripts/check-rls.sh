#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

output="$(psql "$DB_URL" -Atq -f "$SCRIPT_DIR/check-rls.sql")"

if [ -n "$output" ]; then
  echo "RLS check failed:" >&2
  echo "$output" >&2
  exit 1
fi

echo "RLS check passed: all public tables have RLS enabled with policies."
