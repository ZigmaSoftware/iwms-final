import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import "./monthlydistance.css";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { useTranslation } from "react-i18next";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

/* ================= TYPES ================= */

type RawVehicle = Record<string, any>;
type VehicleOption = { id: string; label: string };

type HistoryRow = {
  startTime?: number | string;
  endTime?: number | string;
  tripDistance?: number | string;
};

type VehicleDistanceRow = {
  vehicleId: string;
  vehicleName: string;
  distances: Record<string, number>;
  total: number;
};

/* ================= CONSTANTS ================= */

const TRACKING_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const TRIP_SUMMARY_ENDPOINT =
  "https://gpsvtsprobend.vamosys.com/v2/getTripSummary";

const TRIP_SUMMARY_USER_ID = "NMCP2DISPOSAL";

const FALLBACK_VEHICLES: VehicleOption[] = [
  { id: "UP16KT1737", label: "UP16KT1737" },
  { id: "UP16KT1738", label: "UP16KT1738" },
  { id: "UP16KT1739", label: "UP16KT1739" },
];

const CHUNK_SIZE = 6;

/* ================= DATE HELPERS ================= */

const pad = (v: number) => String(v).padStart(2, "0");

const formatMonthInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const IST_DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
});

const DISPLAY_DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Asia/Kolkata",
});

const buildMonthDays = (monthValue: string) => {
  const [y, m] = monthValue.split("-").map(Number);
  if (!y || !m) return [];
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(y, m - 1, i + 1);
    return {
      iso: IST_DAY_KEY.format(d),
      label: DISPLAY_DAY.format(d).replace(" ", "-"),
    };
  });
};

/* ================= UTILS ================= */

const normalizeVehicle = (r: RawVehicle): VehicleOption | null => {
  const id =
    r?.vehicleId ||
    r?.vehicle_id ||
    r?.vehicleNo ||
    r?.regNo ||
    r?.vehicle_number;
  if (!id) return null;
  return { id: String(id), label: String(id) };
};

const parseTripTimestamp = (v?: number | string) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatCellValue = (v?: number) =>
  typeof v === "number" ? v.toFixed(2) : "-";

/* ===== FIXED CONCURRENCY (NO RACE) ===== */

const runWithConcurrency = async <T,>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<void>
) => {
  const queue = [...items];

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) return;
      await handler(item);
    }
  });

  await Promise.all(workers);
};

/* ================= COMPONENT ================= */

export default function MonthlyDistance() {
  const { t, i18n } = useTranslation();
  const [vehicles, setVehicles] = useState<VehicleOption[]>(FALLBACK_VEHICLES);
  const [monthInput, setMonthInput] = useState(formatMonthInput(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(monthInput);

  const [fleetRows, setFleetRows] = useState<VehicleDistanceRow[]>([]);
  const [rosterError, setRosterError] = useState("");
  const [fetchError, setFetchError] = useState("");

  /* ===== PrimeReact Filters ===== */

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  /* ===== VEHICLE + MONTH CACHE ===== */

  const cacheRef = useRef<Record<string, VehicleDistanceRow>>({});

  const monthDays = useMemo(
    () => buildMonthDays(selectedMonth),
    [selectedMonth]
  );

  const monthHeadline = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const formatter = new Intl.DateTimeFormat(i18n.language || "en-US", {
      month: "long",
      year: "numeric",
    });
    return y && m
      ? formatter.format(new Date(y, m - 1, 1))
      : "";
  }, [i18n.language, selectedMonth]);

  /* ================= LOAD VEHICLES ================= */

  useEffect(() => {
    fetch(TRACKING_API_URL)
      .then((r) => r.json())
      .then((res) => {
        const list = (Array.isArray(res) ? res : res?.data || [])
          .map(normalizeVehicle)
          .filter(Boolean) as VehicleOption[];

        setVehicles(list.length ? list : FALLBACK_VEHICLES);
        setRosterError(
          list.length ? "" : "admin.reports.monthly_distance.error_fallback",
        );
      })
      .catch(() => {
        setVehicles(FALLBACK_VEHICLES);
        setRosterError("admin.reports.monthly_distance.error_unavailable");
      });
  }, []);

  /* ================= FETCH MONTH DATA (FAST) ================= */

  const fetchFleetData = useCallback(async () => {
    if (!vehicles.length || !monthDays.length) return;

    setFleetRows([]);
    setFetchError("");

    const [y, m] = selectedMonth.split("-").map(Number);
    const from = new Date(y, m - 1, 1).getTime();
    const to = new Date(y, m, 0, 23, 59, 59).getTime();

    await runWithConcurrency(vehicles, CHUNK_SIZE, async (v) => {
      const cacheKey = `${selectedMonth}_${v.id}`;

      if (cacheRef.current[cacheKey]) {
        setFleetRows((prev) =>
          [...prev, cacheRef.current[cacheKey]].sort((a, b) =>
            a.vehicleId.localeCompare(b.vehicleId)
          )
        );
        return;
      }

      try {
        const url = `${TRIP_SUMMARY_ENDPOINT}?vehicleId=${v.id}&fromDateUTC=${from}&toDateUTC=${to}&userId=${TRIP_SUMMARY_USER_ID}&duration=0`;
        const res = await fetch(url);
        const json = await res.json();

        const history: HistoryRow[] =
          json?.data?.historyConsilated || [];

        const totals: Record<string, number> = {};
        monthDays.forEach((d) => (totals[d.iso] = 0));

        for (const h of history) {
          const ts = parseTripTimestamp(h.startTime ?? h.endTime);
          if (!ts) continue;
          const key = IST_DAY_KEY.format(ts);
          if (key in totals) {
            totals[key] += Number(h.tripDistance || 0);
          }
        }

        const total = Object.values(totals).reduce((a, b) => a + b, 0);

        const row: VehicleDistanceRow = {
          vehicleId: v.id,
          vehicleName: v.label,
          distances: totals,
          total,
        };

        cacheRef.current[cacheKey] = row;

        setFleetRows((prev) =>
          [...prev, row].sort((a, b) =>
            a.vehicleId.localeCompare(b.vehicleId)
          )
        );
      } catch {
        setFetchError("admin.reports.monthly_distance.error_partial");
      }
    });
  }, [vehicles, monthDays, selectedMonth]);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  /* ================= SEARCH ================= */

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder={t("admin.reports.monthly_distance.search_placeholder")}
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* ================= EXPORT ================= */
  const exportLabels = useMemo(
    () => ({
      index: t("admin.reports.monthly_distance.columns.index"),
      vehicle: t("admin.reports.monthly_distance.columns.vehicle_id"),
      total: t("admin.reports.monthly_distance.columns.total"),
      sheetName: t("admin.reports.monthly_distance.export_sheet"),
      filePrefix: t("admin.reports.monthly_distance.export_file_prefix"),
    }),
    [i18n.language, t],
  );

  const handleExport = () => {
    const data = fleetRows.map((r, i) => {
      const rec: Record<string, string> = {
        [exportLabels.index]: String(i + 1),
        [exportLabels.vehicle]: r.vehicleId,
      };
      monthDays.forEach((d) => {
        rec[d.label] = formatCellValue(r.distances[d.iso]);
      });
      rec[exportLabels.total] = formatCellValue(r.total);
      return rec;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, exportLabels.sheetName);

    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `${exportLabels.filePrefix}-${selectedMonth}.xlsx`
    );
  };

  /* ================= UI ================= */

  return (
    <div className="p-3">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {t("admin.reports.monthly_distance.title")}
            </h1>
            <p className="text-sm text-gray-500">{monthHeadline}</p>
          </div>

          <div className="flex gap-3">
            <input
              type="month"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              className="md-month-input"
            />
            <button
              onClick={() => setSelectedMonth(monthInput)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {t("common.go")}
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {t("common.download")}
            </button>
          </div>
        </div>

        {rosterError && <div className="p-2 text-blue-600">{t(rosterError)}</div>}
        {fetchError && <div className="p-2 text-red-600">{t(fetchError)}</div>}

        <DataTable
          value={fleetRows}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          header={renderHeader()}
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          globalFilterFields={["vehicleId"]}
          className="p-datatable-sm"
        >
          <Column
            header={t("admin.reports.monthly_distance.columns.index")}
            body={(_, o) => o.rowIndex + 1}
            style={{ width: "80px" }}
          />

          <Column
            field="vehicleId"
            header={t("admin.reports.monthly_distance.columns.vehicle_id")}
            sortable
          />

          {monthDays.map((d) => (
            <Column
              key={d.iso}
              header={d.label}
              body={(r: VehicleDistanceRow) =>
                formatCellValue(r.distances[d.iso])
              }
            />
          ))}

          <Column
            header={t("admin.reports.monthly_distance.columns.total")}
            body={(r: VehicleDistanceRow) => formatCellValue(r.total)}
            style={{ width: "120px" }}
          />
        </DataTable>
      
    </div>
  );
}
