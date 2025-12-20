import { Link } from "react-router-dom";
import { DataCard } from "./DataCard";
import { getEncryptedRoute } from "@/utils/routeCache";

export function AttendanceMonitor() {
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
      title="Attendance Monitor"
      compact
      action={
        <Link
          to={resourcesPath}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
        </Link>
      }
    >

      <div className="grid grid-cols-4 gap-3 text-center text-xs">

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
          <div className="font-semibold text-gray-700 dark:text-gray-300">Total</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <div className="font-semibold text-green-700 dark:text-green-400">Present</div>
          <div className="text-xl font-bold text-green-700 dark:text-green-400">
            {stats.present}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <div className="font-semibold text-red-700 dark:text-red-400">Absent</div>
          <div className="text-xl font-bold text-red-700 dark:text-red-400">
            {stats.absent}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <div className="font-semibold text-blue-700 dark:text-blue-400">Leave</div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
            {stats.onLeave}
          </div>
        </div>

      </div>

    </DataCard>
  );
}
