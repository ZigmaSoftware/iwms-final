import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CameraStatusProps {
  active: number;
  inactive: number;
}

export function CameraStatus({ active, inactive }: CameraStatusProps) {
  const { t } = useTranslation();
  const total = active + inactive;

  return (
    <div className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h3 className="text-sm font-semibold text-">
          {t("dashboard.home.cameras_title")}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs font-medium">

        <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <div className="text-green-700 dark:text-green-400">
            {t("common.active")}
          </div>
          <div className="text-lg font-bold text-green-700 dark:text-green-400">
            {active}
          </div>
        </div>

        <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <div className="text-red-700 dark:text-red-400">
            {t("common.inactive")}
          </div>
          <div className="text-lg font-bold text-red-700 dark:text-red-400">
            {inactive}
          </div>
        </div>

         <div className="p-2 rounded-md bg-yellow-50 dark:bg-red-900/20 border border-yellow-200 dark:border-yellow-700">
          <div className="text-yellow-700 dark:text-yellow-400">
            {t("common.total")}
          </div>
          <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
            {total}
          </div>
        </div>

      </div>
    </div>
  );
}
