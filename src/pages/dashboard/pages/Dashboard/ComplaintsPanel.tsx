import { useEffect, useMemo, useState } from "react";
import { DataCard } from "@/components/ui/DataCard";
import type { ComplaintData } from "@/types";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";
import { complaintApi } from "@/helpers/admin";

export function ComplaintsPanel() {
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const { encDashboardGrievances } = getEncryptedRoute();
  const grievancesPath = `/dashboard/${encDashboardGrievances}`;

  useEffect(() => {
    let isMounted = true;
    const fetchComplaints = async () => {
      try {
        const response = await complaintApi.list();
        const rows = Array.isArray(response) ? response : [];
        const deduped = new Map<string, ComplaintData>();

        rows.forEach((row: Record<string, any>, index: number) => {
          const id = String(
            row.unique_id ?? row.id ?? row.complaint_id ?? index
          ).trim();
          if (!id) return;

          const createdRaw =
            row.created ??
            row.created_at ??
            row.complaint_created_at ??
            row.date ??
            "";
          const createdDate = createdRaw ? new Date(createdRaw) : null;
          const normalizedStatus = normalizeStatus(row.status);
          const normalizedPriority = normalizePriority(
            row.priority ?? row.risk ?? row.severity
          );
          const title =
            row.main_category ??
            row.sub_category ??
            row.category ??
            row.details ??
            "Complaint";

          const mapped: ComplaintData = {
            id,
            title: String(title),
            status: normalizedStatus,
            priority: normalizedPriority,
            timestamp: formatTimeAgo(createdDate) ?? "-",
            year: createdDate ? String(createdDate.getFullYear()) : "-",
          };

          const existing = deduped.get(id);
          if (!existing) {
            deduped.set(id, mapped);
            return;
          }

          if (!createdDate) return;
          const existingDate = parseTimeAgo(existing.timestamp);
          if (!existingDate || createdDate > existingDate) {
            deduped.set(id, mapped);
          }
        });

        const priorityRank: Record<ComplaintData["priority"], number> = {
          High: 0,
          Medium: 1,
          Low: 2,
        };

        const sorted = Array.from(deduped.values()).sort((a, b) => {
          const rankDiff = priorityRank[a.priority] - priorityRank[b.priority];
          if (rankDiff !== 0) return rankDiff;

          const aDate = parseTimeAgo(a.timestamp);
          const bDate = parseTimeAgo(b.timestamp);
          if (!aDate || !bDate) return 0;
          return bDate.getTime() - aDate.getTime();
        });

        if (isMounted) {
          setComplaints(sorted.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch complaints:", error);
        if (isMounted) {
          setComplaints([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComplaints();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute totals
  const summary = useMemo(() => {
    const total = complaints.length;
    const inProgress = complaints.filter(
      (c) => c.status === "In Progress"
    ).length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;

    return { total, inProgress, resolved };
  }, [complaints]);

  const shouldScroll = complaints.length > 3;

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
      {loading && !complaints.length ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Loading grievances...
        </div>
      ) : null}
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

      <div
        className={`mt-3 space-y-2 pr-1 ${
          shouldScroll ? "max-h-40 overflow-y-auto" : ""
        }`}
      >
        {!loading && !complaints.length && (
          <div className="text-xs text-muted-foreground">
            No grievances available.
          </div>
        )}
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

function normalizeStatus(raw: unknown): ComplaintData["status"] {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("close") || value.includes("resolved")) return "Resolved";
  if (value.includes("progress") || value.includes("ongoing")) return "In Progress";
  return "Open";
}

function normalizePriority(raw: unknown): ComplaintData["priority"] {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("high") || value.includes("critical")) return "High";
  if (value.includes("low")) return "Low";
  return "Medium";
}

function formatTimeAgo(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(Math.floor(diffMs / 1000), 0);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y ago`;
}

function parseTimeAgo(label: string): Date | null {
  const value = label.trim();
  const match = value.match(/^(\d+)(s|m|h|d|mo|y) ago$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  const now = Date.now();
  const multiplier =
    unit === "s"
      ? 1000
      : unit === "m"
      ? 60_000
      : unit === "h"
      ? 3_600_000
      : unit === "d"
      ? 86_400_000
      : unit === "mo"
      ? 2_592_000_000
      : 31_536_000_000;
  return new Date(now - amount * multiplier);
}
