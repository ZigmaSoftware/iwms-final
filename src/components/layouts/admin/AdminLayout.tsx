import AppHeader from "@/components/layout/AdminPanelLayout/AppHeader";
import AppSidebar from "@/components/layout/AdminPanelLayout/AppSideBar";
import Backdrop from "@/components/layout/AdminPanelLayout/Backdrop";
import { SidebarProvider, useSidebar } from "@/contexts/SideBarContext";
import type { AdminLayoutProps } from "@/types/roles";

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </SidebarProvider>
  );
}

function AdminLayoutShell({ children }: AdminLayoutProps) {
  const { isExpanded, isMobileOpen } = useSidebar();

  const desktopPadding =
    isExpanded || isMobileOpen ? "lg:pl-[330px]" : "lg:pl-[150px]";

  return (
    <div
      className="relative min-h-screen text-[var(--admin-text)]"
      style={{ background: "var(--admin-surface)" }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-20 top-[-160px] h-[320px] w-[320px] rounded-full bg-[var(--admin-primarySoft)] blur-[140px]" />
        <div className="absolute bottom-[-200px] left-[-80px] h-[280px] w-[280px] rounded-full bg-[var(--admin-accentSoft)] blur-[140px]" />
      </div>
      <AppHeader />
      <AppSidebar />
      <Backdrop />
      <main className={`pt-6 transition-all ${desktopPadding}`}>
        <div className="min-h-[calc(100vh-4rem)] px-4 py-6 lg:py-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <div className="w-full rounded-[32px] border border-[var(--admin-border)] bg-[var(--admin-surfaceAlt)]/95 p-6 shadow-[var(--admin-cardShadow)] backdrop-blur">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
