import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DataCard } from "../ui/DataCard";
import { getEncryptedRoute } from "@/utils/routeCache";
import { useTranslation } from "react-i18next";

const API_BASE =
  "https://zigma.in/d2d/folders/waste_collected_summary_report/test_waste_collected_data_api.php";
const API_KEY = "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

type Summary = {
  trips: number;
  totalTons: number;
  avgTons: string;
};

const getMonthParam = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export function WeighmentSummary() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Summary>({
    trips: 0,
    totalTons: 0,
    avgTons: "0.00",
  });
  const [loading, setLoading] = useState(true);
  const { encDashboardWeighBridge } = getEncryptedRoute();
  const weighbridgePath = `/dashboard/${encDashboardWeighBridge}`;

  useEffect(() => {
    const controller = new AbortController();
    const monthParam = getMonthParam();
    const url = `${API_BASE}?action=month_wise_date&date=${monthParam}&key=${API_KEY}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!Array.isArray(json?.data)) {
          setSummary({ trips: 0, totalTons: 0, avgTons: "0.00" });
          return;
        }

        const totals = json.data.reduce(
          (acc: { trips: number; totalNet: number }, row: any) => {
            acc.trips += Number(row.total_trip) || 0;
            acc.totalNet += Number(row.total_net_weight) || 0;
            return acc;
          },
          { trips: 0, totalNet: 0 }
        );

        const totalTons = totals.totalNet / 1000;
        const avgTons = totals.trips ? totalTons / totals.trips : 0;

        setSummary({
          trips: totals.trips,
          totalTons,
          avgTons: avgTons.toFixed(2),
        });
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setSummary({ trips: 0, totalTons: 0, avgTons: "0.00" });
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const tripsValue = loading ? "--" : summary.trips;
  const totalTonsValue = loading ? "--" : summary.totalTons.toFixed(1);
  const avgTonsValue = loading ? "--" : summary.avgTons;

  return (
    <DataCard
      title={t("dashboard.home.weighment_summary_title")}
      compact
      action={
        <Link
          to={weighbridgePath}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t("common.view_all")}
        </Link>
      }
    >
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-[10px] text-gray-600 dark:text-gray-400">
            {t("common.trips")}
          </div>
          <div className="text-lg font-bold text-green-700 dark:text-green-400">
            {tripsValue}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-[10px] text-gray-600 dark:text-gray-400">
            {t("dashboard.home.weighment_total_tons")}
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
            {totalTonsValue}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="text-[10px] text-gray-600 dark:text-gray-400">
            {t("dashboard.home.weighment_avg_tons_per_trip")}
          </div>
          <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
            {avgTonsValue}
          </div>
        </div>
      </div>

    </DataCard>
  );
}
