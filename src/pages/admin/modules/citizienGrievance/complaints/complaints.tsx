import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FileDown } from "lucide-react";

import { PencilIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { adminApi } from "@/helpers/admin";

type Complaint = {
  unique_id: string;
  customer_name: string;
  contact_no: string;
  category: string;
  details: string;
  zone_name: string;
  ward_name: string;
  address: string;
  image_url?: string;
  close_image_url?: string;
  status: string;
  action_remarks?: string;
  created: string;
  complaint_closed_at?: string | null;
};

const complaintApi = adminApi.complaints;

const formatDT = (input: string | null | undefined) => {
  if (!input) return "-";

  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return "-";

  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();

  let hours = dt.getHours();
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${day}-${month}-${year} • ${hours}:${minutes} ${ampm}`;
};

const statusBadgeClass = (status?: string) => {
  const normalized = (status || "").toUpperCase();

  if (["CLOSED", "RESOLVED"].includes(normalized)) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    normalized.includes("PROGRESS") ||
    normalized.includes("ACTION") ||
    normalized.includes("WORK")
  ) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (normalized.includes("PEND")) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
};

const isImage = (url: string) => {
  const lower = url.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) =>
    lower.endsWith(ext)
  );
};

const renderPreview = (src: string | undefined, size = "w-28 h-16") => {
  if (!src) return "-";

  if (isImage(src)) {
    return (
      <img
        src={src}
        className={`${size} rounded-md border object-cover shadow-sm`}
        alt="complaint"
      />
    );
  }

  return (
    <div
      className={`${size} border rounded-md flex items-center justify-center bg-gray-50`}
    >
      <FileDown className="h-5 w-5 text-gray-500" />
    </div>
  );
};

const cap = (str?: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const navigate = useNavigate();
  const { encCitizenGrivence, encComplaint } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encCitizenGrivence}/${encComplaint}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encCitizenGrivence}/${encComplaint}/${unique_id}/edit`;

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintApi.list();
      setComplaints(data);
    } catch {
      Swal.fire("Error", "Unable to load complaints", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((item) => {
      if (item.status) {
        set.add(item.status);
      }
    });
    return ["ALL", ...Array.from(set)];
  }, [complaints]);

  const summaryCards = useMemo(() => {
    const buckets = {
      open: 0,
      pending: 0,
      inProgress: 0,
      closed: 0,
    };

    complaints.forEach((item) => {
      const normalized = (item.status || "").toUpperCase();

      if (["CLOSED", "RESOLVED"].includes(normalized)) {
        buckets.closed += 1;
        return;
      }
      if (
        normalized.includes("PROGRESS") ||
        normalized.includes("ACTION") ||
        normalized.includes("WORK")
      ) {
        buckets.inProgress += 1;
        return;
      }
      if (normalized.includes("PEND")) {
        buckets.pending += 1;
        return;
      }
      buckets.open += 1;
    });

    return [
      {
        label: "Total Complaints",
        value: complaints.length,
        helper: "Across all statuses",
        accent: "from-sky-500 to-indigo-500",
      },
      {
        label: "Open / Pending",
        value: buckets.open + buckets.pending,
        helper: `${buckets.open} open • ${buckets.pending} pending`,
        accent: "from-orange-400 to-amber-500",
      },
      {
        label: "In Progress",
        value: buckets.inProgress,
        helper: "Work in progress",
        accent: "from-purple-500 to-fuchsia-500",
      },
      {
        label: "Closed",
        value: buckets.closed,
        helper: "Resolved & closed",
        accent: "from-emerald-500 to-green-600",
      },
    ];
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const normalizedFilter = statusFilter === "ALL" ? null : statusFilter;
    const term = searchTerm.trim().toLowerCase();

    const matchesTerm = (value?: string) =>
      term === "" ? true : value?.toLowerCase().includes(term);

    return complaints
      .filter((complaint) => {
        const statusMatches = normalizedFilter
          ? (complaint.status || "") === normalizedFilter
          : true;

        if (!term) {
          return statusMatches;
        }

        const textHaystack = [
          complaint.unique_id,
          complaint.customer_name,
          complaint.contact_no,
          complaint.zone_name,
          complaint.ward_name,
          complaint.address,
          complaint.category,
          complaint.status,
          complaint.details,
        ];

        return (
          statusMatches && textHaystack.some((field) => matchesTerm(field))
        );
      })
      .sort((a, b) => {
        const first = new Date(b.created).getTime();
        const second = new Date(a.created).getTime();
        return first - second;
      });
  }, [complaints, searchTerm, statusFilter]);

  const openFile = (fileUrl: string) => {
    if (!fileUrl) return;

    if (isImage(fileUrl)) {
      setModalImage(fileUrl);
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  return (
    <div className="space-y-6 px-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Citizen Grievance
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Complaints Overview
          </h1>
        </div>

        <button
          className="rounded-lg bg-green-custom px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          onClick={() => navigate(ENC_NEW_PATH)}
        >
          + Add Complaint
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className={`h-1.5 bg-gradient-to-r ${card.accent}`} />
            <div className="p-4">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="text-xs text-gray-500">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by CG no, customer, phone, or location"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-green-custom focus:outline-none"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                {filteredComplaints.length} shown
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-custom focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Status" : cap(option)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-400"
            onClick={handleResetFilters}
          >
            Reset
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          Fetching complaints...
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-gray-700">
            No complaints found
          </p>
          <p className="text-sm text-gray-500">
            Adjust your search or status filters to see more results.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredComplaints.map((item) => (
            <article
              key={item.unique_id}
              className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed pb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    {item.unique_id}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {item.customer_name || "Anonymous"}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{cap(item.category)}</span>
                    <span className="text-gray-300">•</span>
                    <span>{item.contact_no || "N/A"}</span>
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                    item.status
                  )}`}
                >
                  {cap(item.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Location
                  </p>
                  <p>{item.address || "-"}</p>
                  <p className="text-xs text-gray-500">
                    {item.zone_name} / {item.ward_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Details
                  </p>
                  <p className="text-gray-700">{item.details || "-"}</p>
                </div>

                {item.action_remarks && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Action Remarks
                    </p>
                    <p className="text-gray-700">{item.action_remarks}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <button
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition hover:border-gray-300"
                  onClick={() => openFile(item.image_url || "")}
                  disabled={!item.image_url}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Complaint Proof
                  </span>
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition hover:border-gray-300"
                  onClick={() => openFile(item.close_image_url || "")}
                  disabled={!item.close_image_url}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Closure Proof
                  </span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-3 text-xs text-gray-500">
                <div>
                  <p>Created: {formatDT(item.created)}</p>
                  <p>
                    Closed: {item.complaint_closed_at ? formatDT(item.complaint_closed_at) : "-"}
                  </p>
                </div>

                {item.status !== "CLOSED" && (
                  <button
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                    onClick={() => navigate(ENC_EDIT_PATH(item.unique_id))}
                  >
                    <PencilIcon className="size-4" />
                    Update
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="relative max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => setModalImage(null)}
            >
              Close
            </button>
            {renderPreview(modalImage, "w-[520px] h-[320px]")}
          </div>
        </div>
      )}
    </div>
  );
}
