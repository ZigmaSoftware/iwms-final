import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { GIcon } from "../components/ui/gicon";

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const current = i18n.language === "ta" ? "ta" : "en";

  const setLang = (lang: "en" | "ta") => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-2">
      <GIcon name="translate" className="text-base text-muted-foreground" />
      <Button
        type="button"
        size="sm"
        variant={current === "en" ? "default" : "outline"}
        className="px-3 py-1 text-xs"
        onClick={() => setLang("en")}
      >
        {t("common.language_en")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={current === "ta" ? "default" : "outline"}
        className="px-3 py-1 text-xs"
        onClick={() => setLang("ta")}
      >
        {t("common.language_ta")}
      </Button>
    </div>
  );
};
