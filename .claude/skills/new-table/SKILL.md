---
name: new-table
description: public スキーマに新しいテーブルを追加するときの手順。RLS・ポリシー・テストを漏らさず作る。
---

# 新しいテーブルの追加手順

1. `supabase migration new <table_name>` でマイグレーションファイルを作る。
2. テーブルの性質に応じて、以下のどちらかのテンプレートを展開する（`supabase/migrations/20260829074903_init_schema.sql` の `research_notes` / `properties` を参照）。

   - **個人データ（private）**: `owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade` を持ち、select/insert/update/delete の4ポリシーすべてに `owner_id = (select auth.uid())`、`revoke all from anon`、`owner_id` に index、`updated_at` トリガー。
   - **公開マスタ（public read-only）**: `select to authenticated using (true)` のみ。`revoke insert, update, delete on <table> from anon, authenticated` で書き込みを二重に塞ぐ。

3. 同一マイグレーションファイル内で `alter table ... enable row level security` と全ポリシーを書く（後回しにしない）。
4. `supabase/tests/rls_<table_name>_test.sql` を作り、以下を最低限カバーする pgTAP テストを書く。
   - 所有者は自分の行が見える/操作できる
   - 他人の行は見えない・更新できない（private の場合）
   - anon はアクセスできない（private の場合）/ 書き込みできない（master の場合）
5. 以下を実行して全部通ることを確認する。

   ```bash
   pnpm db:reset && pnpm check:rls && pnpm db:test && pnpm db:types
   ```

6. `CLAUDE.md` の RLS チェックリストで自己確認してから commit する。
