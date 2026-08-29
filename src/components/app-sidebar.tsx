"use client";

import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  FileText,
  Landmark,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  {
    href: "/property-transactions",
    label: "取得・売却実績",
    icon: ArrowLeftRight,
  },
  { href: "/reits", label: "REIT銘柄", icon: Landmark },
  { href: "/rankings", label: "ランキング", icon: BarChart3 },
  { href: "/distributions", label: "分配金予実", icon: CalendarClock },
  { href: "/portfolio", label: "保有REIT", icon: Wallet },
  { href: "/disclosures", label: "決算資料", icon: FileText },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/property-transactions"
          className="px-2 py-1.5 font-semibold tracking-tight"
        >
          estateresearch
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
