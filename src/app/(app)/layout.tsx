import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/notes" className="font-semibold tracking-tight">
            estateresearch
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/notes"
              className="text-muted-foreground hover:text-foreground"
            >
              マイノート
            </Link>
            <Link
              href="/properties"
              className="text-muted-foreground hover:text-foreground"
            >
              物件マスタ
            </Link>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                ログアウト
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
