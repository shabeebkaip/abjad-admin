"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useCommandPalette } from "@/components/command-palette/command-palette-provider";

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
  const { setOpen } = useCommandPalette();

  // Show ⌘ on mac, Ctrl elsewhere
  const [modKey, setModKey] = useState("⌘");
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.platform.toLowerCase().includes("mac")) {
      setModKey("Ctrl");
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md">
      <SidebarTrigger className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" />
      <Separator orientation="vertical" className="h-4 bg-slate-200" />

      <div className="flex flex-1 items-center gap-1.5">
        <span className="text-xs text-slate-400">Abjad</span>
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-sm font-semibold text-slate-700">{current.label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 h-8 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search…</span>
          <kbd className="ml-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-500">
            {modKey} K
          </kbd>
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
