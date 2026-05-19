"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Dashboard" },
  "/users": { label: "User Management" },
  "/transactions": { label: "Transactions" },
  "/tickets": { label: "Support Tickets" },
  "/content": { label: "Content Management" },
  "/checks": { label: "Background & Credit Checks" },
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
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-[#00ACD3] text-white text-[9px] font-bold">
            8
          </span>
        </Button>
      </div>
    </header>
  );
}
