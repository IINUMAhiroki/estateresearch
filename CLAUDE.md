@AGENTS.md

# estateresearch

不動産リサーチ用の個人アプリ。Next.js (App Router, TypeScript) + Supabase (Postgres/Auth) + Vercel。
セットアップの背景・全体設計は [docs/SETUP_PLAN.md](docs/SETUP_PLAN.md) を参照。

## コマンド

- `pnpm dev` — 開発サーバー
- `pnpm check` / `pnpm check:write` — Biome (lint + format)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — Vitest (unit)
- `pnpm db:start` — `supabase start`（ローカル Postgres/Auth/Storage/Mailpit）
- `pnpm db:reset` — migrations + seed を再適用
- `pnpm db:types` — `database.types.ts` を再生成
- `pnpm db:test` — pgTAP テスト (`supabase test db`)
- `pnpm check:rls` — public スキーマの RLS 有効化・ポリシー有無を検査

## Non-negotiable security rules（絶対に省略しない）

1. **`public` に新テーブルを作るときは、同一マイグレーションファイル内で** `alter table ... enable row level security` と `to authenticated` を明示した `create policy` を必ず書く。RLS 抜けは環境全体の前提を壊す。
2. 個人データテーブルは `owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade` を持ち、select/insert/update/delete すべてに `owner_id = (select auth.uid())` のポリシーを付ける。
3. 公開マスタテーブルは `select to authenticated using (true)` のみとし、`revoke insert, update, delete on <table> from anon, authenticated` で書き込みを二重に塞ぐ（書き込みは migration/seed/service role 経由のみ）。
4. `anon` ロールから private テーブルへの権限は `revoke all on <table> from anon` で明示的に落とす。
5. Service role / secret key は `src/lib/supabase/admin.ts` 以外で import 禁止。`NEXT_PUBLIC_` prefix の環境変数に secret を入れない（`src/lib/env.ts` の zod スキーマで検証）。
6. Server Actions は必ず zod で入力を検証し、`supabase.auth.getUser()` でユーザーを取得する。クライアントから渡された user id / owner id を信用しない。
7. `@supabase/supabase-js` + 生成型以外でデータへアクセスしない（ORM・直接 Postgres 接続禁止 = RLS を必ず経由させる）。
8. マイグレーションを変更したら commit 前に必ず `pnpm db:reset && pnpm check:rls && pnpm db:test && pnpm db:types` を実行する。
9. `.env*`（`.env.example` 除く）は読み書きしない。秘密情報をログや出力に含めない。
10. 一時ファイル・雛形生成物はリポジトリ (`estateresearch/`) の外に置かない。
11. 新しいテーブルを追加するときは `.claude/skills/new-table/SKILL.md` の手順に従う。

## RLS チェックリスト（新テーブル追加時）

- [ ] `enable row level security` した
- [ ] `to authenticated` を明示したポリシーを select/insert/update/delete それぞれに書いた（公開マスタは select のみ）
- [ ] `anon` への権限を revoke した（公開マスタ以外）
- [ ] 個人データなら `owner_id` カラムと関連ポリシーがある
- [ ] `updated_at` トリガーを付けた
- [ ] `pnpm check:rls` と `pnpm db:test` が通る
- [ ] view を作った場合は `security_invoker = true`
- [ ] `security definer` 関数は `set search_path = ''` + 不要ロールから execute revoke
