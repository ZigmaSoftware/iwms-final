import { Link } from "react-router-dom";
import { DataCard } from "./DataCard";
import { getEncryptedRoute } from "@/utils/routeCache";
import { useTranslation } from "react-i18next";

export function AttendanceMonitor() {
  const { t } = useTranslation();
  const stats = {
    total: 182,
    present: 158,
    absent: 24,
    onLeave: 12,
  };
  const { encDashboardResources } = getEncryptedRoute();
  const resourcesPath = `/dashboard/${encDashboardResources}`;

  return (
    <DataCard
      title={t("dashboard.home.attendance_monitor_title")}
      compact
      action={
        <Link
          to={resourcesPath}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t("common.view_all")}
        </Link>
      }
    >

      <div className="grid grid-cols-4 gap-3 text-center text-xs">

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {t("common.total")}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <div className="font-semibold text-green-700 dark:text-green-400">
            {t("common.present")}
          </div>
          <div className="text-xl font-bold text-green-700 dark:text-green-400">
            {stats.present}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <div className="font-semibold text-red-700 dark:text-red-400">
            {t("common.absent")}
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-400">
            {stats.absent}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <div className="font-semibold text-blue-700 dark:text-blue-400">
            {t("common.leave")}
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
            {stats.onLeave}
          </div>
        </div>

      </div>

    </DataCard>
  );
}
