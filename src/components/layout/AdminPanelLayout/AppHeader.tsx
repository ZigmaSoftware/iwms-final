import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "../../../contexts/SideBarContext";
import { cn } from "@/lib/utils";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, isExpanded, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => setApplicationMenuOpen((prev) => !prev);

  const isDark = theme === "dark";
  const headerBackground = isDark ? "#080f1f" : "#ffffff";
  const headerBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(11,88,170,0.12)";
  const headerShadow = isDark ? "0 6px 18px rgba(0,0,0,0.55)" : "0 8px 20px rgba(11,82,165,0.08)";

  const badgeClass = cn(
    "rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.3em]",
    isDark ? "border border-white/20 text-white/70" : "border border-[var(--admin-border)] text-[var(--admin-mutedText)]",
  );

  return (
    <header className="sticky top-0 z-[60] w-full backdrop-blur-xl">
      <div
        className="relative border-b"
        style={{
          background: headerBackground,
          borderColor: headerBorder,
          boxShadow: headerShadow,
        }}
      >
        <div className="flex min-h-[54px] flex-col gap-2 px-3 py-1.5 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-1.5">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                  isDark
                    ? "border border-white/20 bg-white/5 text-white hover:bg-white/15"
                    : "border border-[var(--admin-border)] bg-white/90 text-[var(--admin-primary)] hover:bg-white",
                )}
                aria-label="Toggle sidebar"
                onClick={handleSidebarToggle}
              >
                {isMobileOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>

              <div className="hidden flex-col lg:flex">
                <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--admin-mutedText)]">
                  Admin Console
                </span>
                <span className="text-lg font-semibold leading-tight text-[var(--admin-text)]">Control Center</span>
              </div>

              <Link to="/admin" className="lg:hidden">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              </Link>
            </div>



            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={toggleApplicationMenu}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition",
                  isDark
                    ? "border border-white/20 bg-white/5 text-white hover:bg-white/15"
                    : "border border-[var(--admin-border)] bg-white/90 text-[var(--admin-primary)] hover:bg-white",
                )}
                aria-label="Toggle quick actions"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            className={cn(
              "flex w-full flex-row gap-2 pt-2 lg:w-auto lg:flex-row lg:items-center lg:gap-3 lg:pt-0",
              isApplicationMenuOpen ? "flex" : "hidden lg:flex",
              isDark ? "border-t border-white/10 lg:border-none" : "border-t border-[var(--admin-border)] lg:border-none",
            )}
          >


            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <div className="flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surfaceAlt)]/90 px-2 py-1 shadow-[0_12px_30px_rgba(1,62,126,0.12)]">
                <NotificationDropdown />
                <UserDropdown />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
