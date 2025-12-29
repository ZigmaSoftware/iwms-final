import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { GIcon } from "../components/ui/gicon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "@/lib/utils";

type LanguageCode = "en" | "ta" | "hi";

const LANGUAGES: Array<{ value: LanguageCode; labelKey: string }> = [
  { value: "en", labelKey: "common.language_en" },
  { value: "ta", labelKey: "common.language_ta" },
  { value: "hi", labelKey: "common.language_hi" },
];

type LanguageSwitcherProps = {
  variant?: "buttons" | "select";
  className?: string;
  triggerClassName?: string;
  iconClassName?: string;
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "buttons",
  className,
  triggerClassName,
  iconClassName,
}) => {
  const { i18n, t } = useTranslation();
  const rawLanguage = i18n.resolvedLanguage || i18n.language || "en";
  const normalized = rawLanguage.split("-")[0] as LanguageCode;
  const current = LANGUAGES.some((lang) => lang.value === normalized)
    ? normalized
    : "en";
  const defaultIconClass =
    variant === "select" ? "text-current opacity-70" : "text-muted-foreground";
  const iconClass = cn("text-base", iconClassName ?? defaultIconClass);

  const setLang = (lang: LanguageCode) => {
    i18n.changeLanguage(lang);
  };

  if (variant === "select") {
    return (
      <div className={cn("flex items-center", className)}>
        <Select
          value={current}
          onValueChange={(value) => setLang(value as LanguageCode)}
        >
          <SelectTrigger
            className={cn("h-9 w-full gap-2 text-xs", triggerClassName)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <GIcon name="translate" className={iconClass} />
              <SelectValue
                className="min-w-0 truncate"
                placeholder={t("common.language_en")}
              />
            </div>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((language) => (
              <SelectItem key={language.value} value={language.value}>
                {t(language.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <GIcon name="translate" className={iconClass} />
      {LANGUAGES.map((language) => (
        <Button
          key={language.value}
          type="button"
          size="sm"
          variant={current === language.value ? "default" : "outline"}
          className="px-3 py-1 text-xs"
          onClick={() => setLang(language.value)}
        >
          {t(language.labelKey)}
        </Button>
      ))}
    </div>
  );
};
