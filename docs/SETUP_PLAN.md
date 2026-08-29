# estateresearch 環境セットアップ計画（Vercel + Supabase / TypeScript / RLS-first）

## Context

- リポジトリは `README.md` のみの空状態。Claude Code で vibe coding するための土台を作る。
- 狙いは「セキュリティ（特に Supabase RLS）を忘れられない環境」を最初に作ること。ルールを CLAUDE.md に書くだけでなく、フック・スクリプト・CI・pgTAP テストで機械的に落とす。
- 確定事項: テナントは **個人データ + 一部公開マスタ** / 認証は **Email のみ (password + magic link)** / **pnpm + Node 24 (mise)** / Next.js App Router + Tailwind v4 + shadcn/ui / データアクセスは `@supabase/supabase-js` + 生成型のみ（ORM・直接 Postgres 接続は禁止 = RLS を迂回しない）。
- **作業は全て `estateresearch/` 配下で完結させる**（一時ファイル・雛形生成も外に出さない）。
- **アカウント状況**: Supabase・Vercel とも **GitHub アカウント連携でアカウント作成済み**（`supabase login` / `vercel login` は GitHub OAuth ブラウザ認証で完了する想定・追加作業ほぼ不要）。**プロジェクトはどちらも未作成** → 1-4 / 1-5 でプロジェクト作成から行う。
- ローカル実測: mise あり（node 24 未アクティブ）、Docker 29 あり（デーモン停止中）、gh ログイン済み、`supabase` / `vercel` / `pnpm` / `psql` は未導入。

## 1. ブートストラップ手順

### 1-0 ツールチェーン

```bash
cd /Users/hiroki.iinuma/estateresearch
mise use node@24 pnpm python@3.12 && mise trust     # mise.toml を repo に作成 (commit)
brew install supabase/tap/supabase libpq && brew link --force libpq   # supabase CLI + psql
pnpm add -g vercel                                   # クラウド連携時に使用
open -a Docker
```

### 1-1 Next.js 雛形（repo 内の一時ディレクトリに生成 → 同期）

`create-next-app` は既存の `README.md` / `.claude/` と衝突するため、**repo 内の `.scaffold/`** に生成してから同期する。

```bash
pnpm create next-app@latest .scaffold --ts --app --tailwind --src-dir \
  --import-alias "@/*" --use-pnpm --turbopack --biome   # --biome 不可なら --no-eslint → 後で biome
rsync -a --exclude .git .scaffold/ ./ && rm -rf .scaffold
```

Lint/format は Biome（1 バイナリ・設定 1 ファイル、Next 16 で `next lint` 廃止のため ESLint 統合の利点なし）。

### 1-2 UI / フォーム / データ

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card textarea form dialog dropdown-menu sonner skeleton
pnpm add @supabase/supabase-js @supabase/ssr server-only zod react-hook-form @hookform/resolvers lucide-react framer-motion
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths @testing-library/react jsdom
```

UI 実装時は `frontend-design` スキルを明示的に使い、shadcn デフォルト(zinc)のまま流用せずテーマ・タイポグラフィを意図的に選ぶ。`framer-motion` はホバー/遷移の微小アニメーション用。

### 1-3 Supabase ローカル

```bash
supabase init && supabase start          # API 54321 / DB 54322 / Studio 54323 / Mailpit 54324
supabase migration new init_schema       # §3-1 の内容
supabase db reset
supabase gen types typescript --local > src/lib/supabase/database.types.ts
supabase test new rls_research_notes && supabase test db
```

### 1-4 Supabase Cloud プロジェクト作成 & link（次フェーズ・アカウントは作成済み）

`supabase login` は GitHub OAuth でブラウザが開くので、既存アカウントでそのまま許可するだけ（新規登録不要）。プロジェクト作成が本番作業。

```bash
supabase login                                       # 既存 GitHub アカウントでブラウザ認証のみ
supabase orgs list                                    # <ORG> を確認（GitHub 連携時に自動作成された個人 org）
supabase projects create estateresearch --org-id <ORG> --region ap-northeast-1 --db-password "$(openssl rand -base64 24)"
supabase link --project-ref <REF> && supabase db push
supabase projects api-keys --project-ref <REF>      # sb_publishable_* / sb_secret_*
```

Dashboard: Auth > Providers > Email（password + magic link, Confirm email ON）、Redirect URLs に `http://localhost:3000/**`。

### 1-5 GitHub リポジトリ + Vercel プロジェクト作成（次フェーズ・アカウントは作成済み）

`vercel login` も GitHub OAuth ブラウザ認証のみ。プロジェクトは `vercel link` で GitHub リポジトリと紐付けて新規作成する。

```bash
gh repo create estateresearch --private --source=. --push
vercel login                                          # 既存 GitHub アカウントでブラウザ認証のみ
vercel link                                           # 新規プロジェクトとして作成（GitHub repo と連携）
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production preview development
vercel env add SUPABASE_SECRET_KEY production preview       # development には入れない
vercel env pull .env.local --environment=development
```

Vercel Dashboard 側で GitHub App の連携（リポジトリへのアクセス許可）が初回だけ必要。以降は push で自動デプロイ。Redirect URLs（Supabase 側）に `https://estateresearch.vercel.app/**` と `https://estateresearch-*-<team>.vercel.app/**` を追加。

### 1-6 秘密情報

`.gitignore` に `.env*` + `!.env.example`。`.env.example` は変数名とローカル値のみ。ローカルは `supabase status -o env` の値を使う。

## 2. リポジトリ構成

```text
mise.toml biome.json next.config.ts vitest.config.ts components.json .env.example CLAUDE.md
docs/SETUP_PLAN.md                         # この計画
.claude/settings.json                      # permissions / hooks / enabledPlugins (commit)
.claude/hooks/migration-guard.sh  .claude/hooks/rls-on-stop.sh
.claude/skills/new-table/SKILL.md
.github/workflows/ci.yml
scripts/check-rls.sql  scripts/check-rls.sh
src/proxy.ts                               # Next 16 (15 なら src/middleware.ts)
src/app/(auth)/login/page.tsx  src/app/auth/callback/route.ts  src/app/auth/signout/route.ts
src/app/(app)/layout.tsx  (app)/notes/{page.tsx,actions.ts}  (app)/properties/page.tsx
src/components/ui/*  src/components/notes/*
src/lib/supabase/{client,server,middleware,admin,database.types}.ts
src/lib/validations/notes.ts  src/lib/env.ts   # zod で env 検証
supabase/config.toml  supabase/seed.sql
supabase/migrations/<ts>_init_schema.sql  (<ts>_storage.sql は必要時)
supabase/tests/database/{000_rls_enforced,rls_research_notes,rls_properties}.test.sql
```

## 3. Supabase セキュリティ・ガードレール（核）

### 3-1 マイグレーション規約

1 テーブルにつき「create table → enable RLS → policies (`to authenticated` 明示) → revoke → index → updated_at trigger」を**同一ファイル内**に並べる。

- `profiles`: `id uuid pk references auth.users on delete cascade`、select/update own。`handle_new_user()`（security definer, `set search_path = ''`, execute を public/anon/authenticated から revoke）で auth.users insert 時に自動作成。
- `properties`（公開マスタ）: `select to authenticated using (true)`、`revoke insert, update, delete from anon, authenticated`（二重防御）。書込は migrations / seed / service role のみ。
- `research_notes`（個人）: `owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade`、select/insert/update/delete の 4 ポリシーすべて `owner_id = (select auth.uid())`、`revoke all from anon`、`owner_id` index。
- 共通: `(select auth.uid())` で initPlan キャッシュ、view は `with (security_invoker = true)`、`set_updated_at()` trigger。
- Storage（使う段階で）: private bucket、パス規約 `{uid}/{note_id}/{file}`、`(storage.foldername(name))[1] = auth.uid()::text`。

### 3-2 `pnpm check:rls`（`scripts/check-rls.sql` + `.sh`）

public スキーマで「RLS 無効」「ポリシー 0 件」「security_invoker でない view」を列挙し、1 件でもあれば exit 1。`DB_URL` 既定は `postgresql://postgres:postgres@127.0.0.1:54322/postgres`。同じ検査を pgTAP `000_rls_enforced.test.sql` にも持たせ、`supabase test db` 単体でも落ちるようにする。

### 3-3 pgTAP RLS テスト

`rls_research_notes.test.sql`: auth.users に A/B を insert → `set local role authenticated; set local request.jwt.claims` を切替え、A は自分のノートが見える / B からは 0 行・update は 0 行更新 / authenticated は properties に insert 不可 (42501) / anon は research_notes 読めず (42501)・properties 0 行。`rls_properties.test.sql` も同様。

### 3-4 アプリ側の固定ルール

- `server.ts`: `createServerClient` を `cookies: { getAll, setAll }` 形式のみで（setAll は try/catch）。`client.ts`: `createBrowserClient`。`middleware.ts`: `updateSession()` で **`getUser()`**（`getSession()` はサーバーで信用しない）。
- `admin.ts`: 先頭 `import 'server-only'`、`SUPABASE_SECRET_KEY`、`persistSession: false`。seed / 管理バッチ専用。`src/lib/env.ts` の zod で `NEXT_PUBLIC_` に secret が混ざれば起動失敗。
- Server Actions: `'use server'` → zod parse → `getUser()` → `owner_id` はクライアントから受け取らず default に任せる → `revalidatePath`。
- `proxy.ts`: セッション更新 + 未ログインの `/notes` `/properties` は `/login` へ。
- `auth/callback/route.ts`: `exchangeCodeForSession`、`next` は相対パスのみ（open redirect 防止）。
- `next.config.ts` `headers()`: nosniff / `X-Frame-Options: DENY` / Referrer-Policy / Permissions-Policy / HSTS / CSP は `Report-Only` で開始し動作確認後 enforce。

## 4. Claude Code 設定

### 4-1 `CLAUDE.md`

Stack・コマンド（`pnpm dev / check / test / db:reset / db:types / db:test / check:rls`）・**Non-negotiable security rules**（新テーブルは同一マイグレーションで RLS + 明示ポリシー + anon revoke / `owner_id` 規約 / secret key は `admin.ts` 以外 import 禁止・`NEXT_PUBLIC_` 禁止 / Server Actions は zod + `getUser()` / ORM・直接接続禁止 / マイグレーション後は `db:reset && check:rls && db:test && db:types` してから commit / `.env*` は読み書きしない / 新テーブルは `/new-table` スキル / 一時ファイルは repo 外に作らない）+ RLS checklist 表。

### 4-2 `.claude/settings.json`（commit）

- permissions allow: `pnpm *`, `supabase *`, `vercel env pull*`, `vercel link*`, `git *`, `gh pr *`, `psql *`
- permissions deny: `Read(./.env)`, `Read(./.env.*)`, `Bash(supabase db push*)`, `Bash(vercel --prod*)`, `Bash(vercel env add*)`（クラウド適用は人間が手動）
- hooks:
  - `PostToolUse` (Edit|Write) → `migration-guard.sh`: 対象が `supabase/migrations/*.sql` のときだけ `create table` 数と `enable row level security` 数を比較、不足なら stderr + `exit 2` で差し戻し。
  - `Stop` → `rls-on-stop.sh`: `stop_hook_active` なら exit 0。`supabase/migrations|tests` に差分がなければ exit 0。Supabase 起動中なら `supabase db reset --local && pnpm check:rls && supabase test db`、失敗で `exit 2`。未起動なら警告のみ。
- enabledPlugins: `supabase` / `vercel` / `security-guidance` / `frontend-design` / `typescript-lsp`（各 `@claude-plugins-official`）

### 4-3 プラグイン運用

| plugin | 用途 |
| --- | --- |
| security-guidance | 常時。編集時パターン警告 + Stop/commit/push の LLM diff レビュー（Python 必要 → mise で python 追加） |
| supabase (MCP) | `get_advisors(security)` / `list_tables` の確認用。`apply_migration` / `execute_sql` は本番に使わない |
| vercel (MCP) | デプロイ状況・ログ確認 |
| frontend-design | UI 実装時に明示呼び出し |
| typescript-lsp | 常時 |
| claude-security | PR 前・リリース前の on-demand deep scan |
| playwright | E2E を始める段階で |

### 4-4 `.claude/skills/new-table/SKILL.md`

(1) `supabase migration new` → (2) private / master テンプレ展開 → (3) `rls_<table>.test.sql` 生成 → (4) `db:reset && check:rls && db:test && db:types` → (5) RLS checklist を出力して自己確認。

## 5. CI (`.github/workflows/ci.yml`) — 無料枠内の縮小版

個人開発のため GitHub Actions の消費を最小化する。private repo の無料枠は 2,000 分/月（Linux ランナー 1 倍換算）。lint/typecheck/test は §4-2 の Stop フックでローカル担保済みなので **CI からは外し、CI は「RLS の抜けを機械的に落とす」役割に一本化**する。

- **トリガーを絞る**: `on: pull_request` かつ `paths: ["supabase/**"]` のみ（`push` トリガーは無し）。UI だけの変更では起動しない。
- **`concurrency`** で同一 PR の古い実行をキャンセル（`group: ci-${{ github.ref }}`, `cancel-in-progress: true`）— 連続 push での多重課金を防ぐ。
- 単一ジョブ・単一 OS（`ubuntu-latest`、matrix なし）: `supabase/setup-cli@v1` → `supabase db start`（DB のみ起動、Studio 等は上げない）→ `pnpm check:rls` → `supabase test db`。
- lint/typecheck/vitest・型の鮮度チェック・`supabase db lint` は**やらない**（オプション扱い。必要になったら手動 `workflow_dispatch` で追加する程度に留める）。
- デプロイは Vercel の Git 連携（push で自動 Preview）に任せる。Vercel 側のビルド自体が `tsc`/lint 相当のビルドエラーを検出するため、CI で二重にやる必要は薄い。CI に秘密情報は不要。
- 見積り: 1 run あたり数分（CLI セットアップ + DB起動 + テスト）。migrations を頻繁に触らない限り月あたりの消費は小さく、無料枠に収まる想定。

## 6. 検証（E2E）

1. `supabase start` → Studio で 3 テーブルと RLS バッジ確認。
2. `pnpm check:rls` exit 0 → Studio で意図的に RLS 無効化 → exit 1 → `db:reset` で復旧。
3. `supabase test db` 全 pass。
4. `pnpm dev` → `/login` で magic link → Mailpit (54324) → `/auth/callback` → `/notes`、`profiles` 自動作成確認。
5. 別ユーザーで相手のノートが見えない・`properties` は共通で見える。
6. Claude に `create table` だけの migration を書かせ、`migration-guard.sh` が差し戻す／Stop hook が検査を回すことを確認。
7. push → Actions 緑 → Vercel Preview で magic link ログイン。`vercel --prod` は手動。

## 7. リスク・落とし穴

- Docker 停止中 → 先に起動。初回 image pull に数分。
- create-next-app の既存ファイル衝突 → repo 内 `.scaffold/` に生成して rsync（repo 外には出さない）。
- Next 16 は `middleware.ts` → `proxy.ts`。@supabase/ssr は `getAll/setAll` 以外の cookie API 不可。
- API キーは新体系 `sb_publishable_*` / `sb_secret_*` に統一（legacy anon/service_role と混在させない）。
- Tailwind v4 + shadcn: 最新 CLI は v4 対応。`tailwind.config.js` 手順の古い記事は使わない。
- `gen types --local` は DB 起動前提。CI の diff で検知。
- Supabase は当面 prod/preview 共用。分離が必要になったら Branching か 2 プロジェクト。
- magic link の Redirect URL ワイルドカードを忘れると preview でログイン不能。`emailRedirectTo` は request origin から組む。
- 組み込み SMTP はレート制限あり → 実ユーザー前に Resend 等。
- Stop hook の `db reset` は 5–15 秒 → migration 差分がある時だけ実行。
