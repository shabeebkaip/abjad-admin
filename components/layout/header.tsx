"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";

const breadcrumbs: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Dashboard" },
  "/users": { label: "User Management" },
  "/tickets": { label: "Support Tickets" },
  "/content": { label: "Content Management" },
  "/settings": { label: "Platform Configuration" },
  "/reports": { label: "Reports & Export" },
};

export function Header() {
  const pathname = usePathname();
  const current = breadcrumbs[pathname] ?? { label: "Admin" };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md">
      <SidebarTrigger className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" />
      <Separator orientation="vertical" className="h-4 bg-slate-200" />

      <div className="flex flex-1 items-center gap-1.5">
        <span className="text-xs text-slate-400">Abjad</span>
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-sm font-semibold text-slate-700">{current.label}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          <Search className="h-4 w-4" />
        </Button>
        <NotificationBell />
      </div>
    </header>
  );
}
