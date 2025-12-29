import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleButtonProps {
  className?: string;
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2",
        isDark
          ? "border-white/15 bg-white/5 text-white focus-visible:ring-white/30"
          : "border-[var(--admin-border)] bg-white/90 text-[var(--admin-text)] shadow-[0_10px_24px_rgba(9,74,141,0.08)] focus-visible:ring-[var(--admin-primarySoft)]",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition",
          isDark
            ? "bg-white/10 text-white"
            : "bg-[var(--admin-primarySoft)]/80 text-[var(--admin-primary)]",
        )}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
      <span className="flex flex-col text-left leading-none">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--admin-mutedText)]">
          {t("common.theme_mode_label")}
        </span>
        <span>{isDark ? t("common.theme_dark") : t("common.theme_light")}</span>
      </span>
    </button>
  );
}
