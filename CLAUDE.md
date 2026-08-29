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

## Vibe coding 衛生ルール

`git commit` 実行時は `.claude/hooks/quality-check.sh` が自動でシークレットスキャン + `pnpm check` + `pnpm typecheck` + `pnpm test` を実行しブロックする（PreToolUse フック）。それに加えて以下を徹底する。

1. **差分は必ず自分で読んでから commit する。** 生成しただけの大きな diff をそのまま commit しない。1 commit = 1つの論理的な変更に保つ。
2. **失敗したチェックを緩めて通さない。** テストを消す/skip する、lintルールを無効化する、型を `any` で握りつぶす等で「グリーンにする」のは禁止。原因を直すか、ユーザーに確認する。
3. **依存を追加する前に、同等の機能が既存依存（shadcn/ui, zod, react-hook-form 等）で足りないか確認する。** 増やしたら `pnpm-lock.yaml` の変更も commit に含める。
4. **認証・データアクセス・決済等セキュリティに関わる変更は特に慎重に。** 変更後は `code-review` skill や `claude-security` プラグイン（オンデマンド）でのセルフレビューを検討する。
5. **わからない/自信がない実装を断定的に「動きます」と報告しない。** 実際に `pnpm dev` やテストで動作確認してから報告する。
6. **秘密情報（APIキー・トークン・パスワード）をコード中にハードコードしない。** 迷ったら `.env.local` に置き、`src/lib/env.ts` 経由で読む。
7. **`main` に直接 commit しない。** 必ず feature branch を切って PR を出す（`.claude/hooks/quality-check.sh` が `main`/`master` 上の commit をブロックする）。作業を始める前に `git checkout -b <name>`。
8. **force-push は禁止。**（`settings.json` の deny で機械的にブロック済み）履歴を書き換えたい場合はユーザーに確認する。
9. **既存テーブルを変更するときは `.claude/skills/alter-table/SKILL.md` の Expand/Contract パターンに従う。** 本番ユーザーがいる前提になったら、列追加→バックフィル→制約強化を単一マイグレーションにまとめない。

## コンポーネント設計・コード品質の原則

1. **Server Component がデフォルト。** `'use client'` はインタラクティブな部分（フォーム、ボタンのonClick等）だけに絞り、ツリーの末端になるべく近い位置に置く。データ取得は Server Component か Server Action で行い、クライアントから直接 Supabase を叩かない。
2. **`src/components/ui/*` は shadcn の生成物として扱い、直接ビジネスロジックを書き込まない。** 機能固有のコンポーネントは `src/app/(app)/<feature>/` に置くか `src/components/<feature>/` にまとめる。
3. **AHA（Avoid Hasty Abstractions）。** 同じコードが3箇所目に出てきたら共通化を検討する。1〜2箇所の重複を先回りして抽象化しない。
4. **Composition over configuration。** 真偽値propsを増やして分岐を増やすより、コンポーネントを分けて組み合わせる（Radix/shadcnの流儀に合わせる）。
5. **`any` を使わない。** 型が合わないときは型を直すか、型ガードを書く。`as` によるキャストは最終手段。
6. **マジックナンバー・マジック文字列を埋め込まない。** `USE_TYPE_LABELS`（`properties/page.tsx`）のように、意味のある定数として module scope に出す。
7. **アクセシビリティは Radix/shadcn の既定に任せ、Biome の a11y lint ルールを無効化しない。** どうしても外す必要がある場合はコメントで理由を書く。
8. **非同期データ取得を伴うページを追加するときは、Next.js の `loading.tsx` / `error.tsx` 規約を使う。** 独自のローディング/エラー状態管理を先に書かない。
9. **関数・コンポーネントは単一責任に保つ。** 1つの関数が「取得して」「加工して」「表示する」を全部やっていたら分割を検討する。

## RLS チェックリスト（新テーブル追加時）

- [ ] `enable row level security` した
- [ ] `to authenticated` を明示したポリシーを select/insert/update/delete それぞれに書いた（公開マスタは select のみ）
- [ ] `anon` への権限を revoke した（公開マスタ以外）
- [ ] 個人データなら `owner_id` カラムと関連ポリシーがある
- [ ] `updated_at` トリガーを付けた
- [ ] `pnpm check:rls` と `pnpm db:test` が通る
- [ ] view を作った場合は `security_invoker = true`
- [ ] `security definer` 関数は `set search_path = ''` + 不要ロールから execute revoke
