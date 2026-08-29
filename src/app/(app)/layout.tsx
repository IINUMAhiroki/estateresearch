import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <SidebarTrigger />
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              ログアウト
            </Button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
