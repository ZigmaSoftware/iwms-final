import { useMemo } from "react";
import { DataCard } from "@/components/ui/DataCard";
import type { ComplaintData } from "@/types";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";

export function ComplaintsPanel() {
  const complaints: ComplaintData[] = [
    {
      id: "1",
      title: "Missed Collection",
      status: "Open",
      priority: "High",
      timestamp: "2h ago",
      year: "2024",
    },
    {
      id: "2",
      title: "Vehicle Breakdown",
      status: "In Progress",
      priority: "High",
      timestamp: "4h ago",
      year: "2024",
    },
    {
      id: "4",
      title: "Equipment Issue",
      status: "Resolved",
      priority: "Low",
      timestamp: "1d ago",
      year: "2025",
    },
  ];
  const { encDashboardGrievances } = getEncryptedRoute();
  const grievancesPath = `/dashboard/${encDashboardGrievances}`;

  // Compute totals
  const summary = useMemo(() => {
    const total = complaints.length;
    const inProgress = complaints.filter(
      (c) => c.status === "In Progress"
    ).length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;

    return { total, inProgress, resolved };
  }, [complaints]);

  const CARD_STYLE =
    "flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700";

  const priorityStyles: Record<ComplaintData["priority"], string> = {
    High: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/50 dark:bg-rose-900/30 dark:text-rose-200",
    Medium:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-200",
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-200",
  };

  const getStatusMeta = (status: ComplaintData["status"]) => {
    switch (status) {
      case "Open":
        return {
          icon: <AlertTriangle className="w-3 h-3 text-rose-500" />,
          ring: "bg-rose-50 dark:bg-rose-900/30",
        };
      case "In Progress":
        return {
          icon: <Info className="w-3 h-3 text-blue-500" />,
          ring: "bg-blue-50 dark:bg-blue-900/30",
        };
      default:
        return {
          icon: <CheckCircle className="w-3 h-3 text-emerald-500" />,
          ring: "bg-emerald-50 dark:bg-emerald-900/30",
        };
    }
  };

  return (
    <DataCard
      title="Grievances"
      compact
      action={
        <Link
          to={grievancesPath}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-2 mt-2">
        {/* TOTAL */}
        <div className={`${CARD_STYLE} bg-blue-50 dark:bg-blue-900/20`}>
          <div className="text-[14px] text-gray-600 dark:text-gray-300 font-bold">
            Total
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {summary.total}
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className={`${CARD_STYLE} bg-yellow-50 dark:bg-yellow-900/20`}>
          <div className="text-[14px] text-gray-600 dark:text-gray-300 font-bold">
            In Progress
          </div>
          <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
            {summary.inProgress}
          </div>
        </div>

        {/* RESOLVED */}
        <div className={`${CARD_STYLE} bg-green-50 dark:bg-green-900/20`}>
          <div className="text-[14px] text-gray-600 dark:text-gray-300 font-bold">
            Resolved
          </div>
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {summary.resolved}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
        {complaints.map((complaint, idx) => {
          const meta = getStatusMeta(complaint.status);
          return (
            <div key={complaint.id} className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className={`p-1 rounded-full ${meta.ring}`}>
                  {meta.icon}
                </div>
                {idx < complaints.length - 1 && (
                  <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {complaint.title}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityStyles[complaint.priority]}`}
                  >
                    {complaint.priority}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {complaint.status} • {complaint.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </DataCard>
  );
}
