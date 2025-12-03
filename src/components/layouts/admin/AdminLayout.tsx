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
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const desktopPadding =
    isExpanded || isHovered || isMobileOpen ? "lg:pl-[290px]" : "lg:pl-[90px]";

  return (
    <div className="relative min-h-screen bg-[#f5f7fb]">
      <AppHeader />
      <AppSidebar />
      <Backdrop />
      <main className={`pt-3 transition-all ${desktopPadding}`}>
        <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7fb] px-4 py-4 lg:py-3 lg:px-3">
          {children}
        </div>
      </main>
    </div>
  );
}
