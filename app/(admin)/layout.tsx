import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col min-h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </CommandPaletteProvider>
  );
}
