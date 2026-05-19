"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api-client";
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  Headphones,
  FileText,
  Settings,
  BarChart3,
  LogOut,
  Bell,
  ChevronRight,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = { title: string; href: string; icon: React.ElementType; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const navItems: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Teachers",        href: "/users/teachers", icon: GraduationCap, badge: "2" },
      { title: "Schools",         href: "/users/schools",  icon: Building2,     badge: "1" },
      { title: "Support Tickets", href: "/tickets",        icon: Headphones,    badge: "5" },
    ],
  },
  {
    label: "Hiring",
    items: [
      { title: "Applications", href: "/applications", icon: ClipboardList },
      { title: "Interviews",   href: "/interviews",   icon: CalendarDays  },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Job Posts",       href: "/content",   icon: FileText  },
      { title: "Reports & Export",href: "/reports",   icon: BarChart3 },
      { title: "Configuration",   href: "/settings",  icon: Settings  },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, #00ACD3 0%, #1C93D9 100%)" }}
          >
            <span className="text-sm font-bold text-white">أ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white">
              Abjad
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">
              Admin Console
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-white/[0.08]" />

      <SidebarContent className="px-3 py-3">
        {navItems.map((group, gi) => (
          <SidebarGroup key={group.label} className={cn("py-0", gi > 0 && "mt-5")}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-white/25 px-2 mb-2 font-bold">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-10 rounded-xl transition-all duration-150 flex items-center gap-3 font-medium text-sm px-3",
                        isActive
                          ? "text-white"
                          : "text-white/50 hover:text-white hover:bg-white/[0.07]"
                      )}
                      style={
                        isActive
                          ? {
                              background: "rgba(0, 172, 211, 0.15)",
                              boxShadow: "inset 3px 0 0 #00ACD3",
                            }
                          : undefined
                      }
                    >
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-[#00ACD3]" : "text-white/30"
                        )}
                      />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <Badge
                          className={cn(
                            "h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full border-0",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[#00ACD3]/20 text-[#00ACD3]"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator className="bg-white/[0.08]" />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-white/[0.06] transition-colors outline-none">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/15">
                  <AvatarFallback
                    className="text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #00ACD3 0%, #1C93D9 100%)" }}
                  >
                    SA
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-semibold text-white truncate">Super Admin</span>
                  <span className="text-[11px] text-white/40 truncate">admin@abjad.sa</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white/25 ml-auto shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
