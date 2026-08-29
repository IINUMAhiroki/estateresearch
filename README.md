# estateresearch

不動産リサーチ用の個人プロジェクト。Next.js (App Router) + Supabase (Postgres/Auth) + Vercel。

セットアップ手順・設計方針は [docs/SETUP_PLAN.md](docs/SETUP_PLAN.md) を参照。プロジェクト運用ルール（RLS必須事項など）は [CLAUDE.md](CLAUDE.md)。

## Getting Started

```bash
mise install
pnpm install
supabase start
pnpm dev
```

http://localhost:3000 を開く。
