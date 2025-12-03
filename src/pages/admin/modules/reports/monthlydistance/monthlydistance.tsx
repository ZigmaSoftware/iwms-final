import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./monthlydistance.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

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

const TRACKING_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";
const TRIP_SUMMARY_ENDPOINT = "https://gpsvtsprobend.vamosys.com/v2/getTripSummary";
const TRIP_SUMMARY_USER_ID = "NMCP2DISPOSAL";

const FALLBACK_VEHICLES: VehicleOption[] = [
  { id: "UP16KT1737", label: "UP16KT1737" },
  { id: "UP16KT1738", label: "UP16KT1738" },
  { id: "UP16KT1739", label: "UP16KT1739" },
  { id: "UP16KT1740", label: "UP16KT1740" },
  { id: "UP16KT1741", label: "UP16KT1741" },
  { id: "UP16KT1742", label: "UP16KT1742" },
  { id: "UP16KT1907", label: "UP16KT1907" },
  { id: "UP16KT1908", label: "UP16KT1908" },
  { id: "UP16KT1910", label: "UP16KT1910" },
  { id: "UP16KT1911", label: "UP16KT1911" },
  { id: "UP16KT1912", label: "UP16KT1912" },
  { id: "UP16KT1913", label: "UP16KT1913" },
];

const ROWS_PER_PAGE = 20;
const CHUNK_SIZE = 6;

const pad = (value: number) => String(value).padStart(2, "0");
const formatMonthInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const monthLabelFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const IST_DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
const DISPLAY_DAY = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });

const buildMonthDays = (monthValue: string) => {
  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: { iso: string; label: string }[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const iso = IST_DAY_KEY.format(date);
    const label = DISPLAY_DAY.format(date).replace(" ", "-");
    result.push({ iso, label });
  }
  return result;
};

const normalizeVehicle = (record: RawVehicle): VehicleOption | null => {
  const candidate =
    record?.vehicleId ||
    record?.vehicle_id ||
    record?.vehicleNo ||
    record?.regNo ||
    record?.vehicle_number ||
    record?.VehicleNo;
  if (!candidate) return null;
  const text = String(candidate).trim();
  if (!text) return null;
  return { id: text, label: text };
};

const runWithConcurrency = async <T,>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<unknown>
) => {
  let index = 0;
  const run = async () => {
    while (index < items.length) {
      const current = items[index++];
      await handler(current);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(workers);
};

const parseTripTimestamp = (value?: number | string) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return new Date(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatCellValue = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return Number.isFinite(value) ? value.toFixed(2) : "-";
};

export default function MonthlyDistance(){
  const [vehicles, setVehicles] = useState<VehicleOption[]>(FALLBACK_VEHICLES);
  const [selectedMonth, setSelectedMonth] = useState(formatMonthInput(new Date()));
  const [monthInput, setMonthInput] = useState(formatMonthInput(new Date()));
  const [fleetRows, setFleetRows] = useState<VehicleDistanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const cacheRef = useRef<Record<string, VehicleDistanceRow[]>>({});

  const monthDays = useMemo(() => buildMonthDays(selectedMonth), [selectedMonth]);

  const monthHeadline = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return "";
    const date = new Date(year, month - 1, 1);
    return monthLabelFormatter.format(date);
  }, [selectedMonth]);

  useEffect(() => {
    let aborted = false;
    const loadVehicles = async () => {
      try {
        const res = await fetch(TRACKING_API_URL);
        if (!res.ok) throw new Error(`Roster error (${res.status})`);
        const body = await res.json();
        const payload = Array.isArray(body) ? body : body?.data;
        if (!Array.isArray(payload)) throw new Error("Unexpected roster response");
        const normalized = payload
          .map((record: RawVehicle) => normalizeVehicle(record))
          .filter((value): value is VehicleOption => Boolean(value));
        if (!aborted) {
          if (normalized.length) {
            setVehicles(normalized);
            setRosterError("");
          } else {
            setVehicles(FALLBACK_VEHICLES);
            setRosterError("Roster empty. Showing fallback vehicles.");
          }
        }
      } catch (error) {
        console.error("Monthly distance roster failed:", error);
        if (!aborted) {
          setVehicles(FALLBACK_VEHICLES);
          setRosterError("Live list unavailable. Using fallback vehicles.");
        }
      }
    };
    loadVehicles();
    return () => {
      aborted = true;
    };
  }, []);

  const computeRange = useCallback(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const to = new Date(year, month, 0, 23, 59, 59, 999);
    return { from, to };
  }, [selectedMonth]);

  const aggregateHistory = useCallback(
    (history: HistoryRow[]) => {
      const totals: Record<string, number> = {};
      monthDays.forEach((day) => {
        totals[day.iso] = 0;
      });
      history.forEach((row) => {
        const stamp = parseTripTimestamp(row.startTime ?? row.endTime);
        if (!stamp) return;
        const dateKey = IST_DAY_KEY.format(stamp);
        if (!Object.prototype.hasOwnProperty.call(totals, dateKey)) return;
        const distance = Number(row.tripDistance || 0);
        totals[dateKey] += distance;
      });
      const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
      return { totals, total };
    },
    [monthDays],
  );

  const fetchFleetData = useCallback(async () => {
    if (!vehicles.length || !monthDays.length) {
      setFleetRows([]);
      return;
    }
    const cacheKey = selectedMonth;
    const cachedRows = cacheRef.current[cacheKey];
    if (cachedRows?.length) {
      setFleetRows(cachedRows);
      setFetchError("");
      setLoading(false);
      return;
    }
    const { from, to } = computeRange();
    const fromUTC = from.getTime();
    const toUTC = to.getTime();
    setLoading(true);
    setFetchError("");
    try {
      const rowMap = new Map<string, VehicleDistanceRow>();
      const failures: string[] = [];

      const updateRows = () => {
        const rows = Array.from(rowMap.values()).sort((a, b) => a.vehicleId.localeCompare(b.vehicleId));
        setFleetRows(rows);
      };

      const worker = async (vehicle: VehicleOption) => {
        try {
          const url = `${TRIP_SUMMARY_ENDPOINT}?vehicleId=${vehicle.id}&fromDateUTC=${fromUTC}&toDateUTC=${toUTC}&userId=${TRIP_SUMMARY_USER_ID}&duration=0`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Trip summary error (${response.status})`);
          const json = await response.json();
          const history: HistoryRow[] = Array.isArray(json?.data?.historyConsilated)
            ? json.data.historyConsilated
            : [];
          const vehicleName = json?.data?.vehicleName || vehicle.label;
          const { totals, total } = aggregateHistory(history);
          const row = { vehicleId: vehicle.id, vehicleName, distances: totals, total };
          rowMap.set(vehicle.id, row);
          updateRows();
          return row;
        } catch (error) {
          failures.push(vehicle.id);
          console.error("Trip summary worker failed:", error);
        }
      };

      await runWithConcurrency(vehicles, CHUNK_SIZE, worker);

      if (failures.length) {
        setFetchError(`Could not load: ${failures.slice(0, 3).join(", ")}${failures.length > 3 ? "..." : ""}`);
      } else {
        setFetchError("");
      }

      const finalRows = Array.from(rowMap.values()).sort((a, b) => a.vehicleId.localeCompare(b.vehicleId));
      cacheRef.current[cacheKey] = finalRows;
      setFleetRows(finalRows);
    } catch (error: any) {
      console.error("Monthly fleet fetch failed:", error);
      setFetchError(error.message || "Unable to load monthly distances.");
      setFleetRows([]);
    } finally {
      setLoading(false);
    }
  }, [vehicles, monthDays, computeRange, aggregateHistory, selectedMonth]);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return fleetRows;
    const needle = search.toLowerCase();
    return fleetRows.filter((row) => row.vehicleId.toLowerCase().includes(needle));
  }, [fleetRows, search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE)),
    [filteredRows.length],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const startRowIndex = (currentPage - 1) * ROWS_PER_PAGE;

  // const goToPreviousPage = () => {
  //   setCurrentPage((prev) => Math.max(prev - 1, 1));
  // };

  // const goToNextPage = () => {
  //   setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  // };

  const totalDistance = useMemo(
    () => fleetRows.reduce((sum, row) => sum + row.total, 0),
    [fleetRows],
  );

  const handleExport = () => {
    if (!filteredRows.length) return;
    const data = filteredRows.map((row, index) => {
      const record: Record<string, string> = {
        "#": String(index + 1),
        "Vehicle Id": row.vehicleId,
      };
      monthDays.forEach((day) => {
        const value = row.distances[day.iso] ?? 0;
        record[day.label] = formatCellValue(value);
      });
      record.Total = formatCellValue(row.total);
      return record;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Distance");
    const blob = new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
      type: "application/octet-stream",
    });
    saveAs(blob, `monthly-distance-${selectedMonth}.xlsx`);
  };

  const applyMonthChange = () => {
    if (!monthInput) return;
    setSelectedMonth(monthInput);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="md-card">
        <div className="md-page-header">
          <h2>Monthly Distance</h2>
          <div className="md-header-actions">
            <div className="md-search-field">
              <label>Search</label>
              <input
                type="text"
                placeholder="Vehicle ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button type="button" className="md-excel-button" onClick={handleExport} disabled={!filteredRows.length}>
              <span className="md-excel-icon" aria-hidden="true">
                ⎘
              </span>
              Export
            </button>
          </div>
        </div>

        <div className="md-toolbar">
          <div className="md-field">
            <label>Month</label>
            <div className="md-field-inline">
              <input
                type="month"
                value={monthInput}
                max={formatMonthInput(new Date())}
                onChange={(e) => setMonthInput(e.target.value)}
              />
              <button type="button" onClick={applyMonthChange} className="md-go-button">
                Go
              </button>
            </div>
          </div>
          <div className="md-summary-small">
            <span>{monthHeadline || "Select a month"}</span>
            <p>
              {filteredRows.length} / {fleetRows.length} vehicles · Total distance {totalDistance.toFixed(2)} km
            </p>
          </div>
        </div>

        {rosterError && <div className="md-alert info">{rosterError}</div>}
        {fetchError && <div className="md-alert warning">{fetchError}</div>}
        {loading && <div className="md-alert info">Loading monthly data…</div>}

        <div className="md-table-card">
          <DataTable
            value={paginatedRows}
            stripedRows
            showGridlines
            className="p-datatable-sm"
            responsiveLayout="scroll"
          >
            <Column
              header="#"
              body={(_: VehicleDistanceRow, { rowIndex }) => startRowIndex + rowIndex + 1}
              style={{ width: "90px" }}
            />
            <Column field="vehicleId" header="Vehicle Id" style={{ minWidth: "150px" }} />
            {monthDays.map((day) => (
              <Column
                key={day.iso}
                header={day.label}
                body={(row: VehicleDistanceRow) => formatCellValue(row.distances[day.iso] ?? 0)}
                style={{ minWidth: "140px" }}
              />
            ))}
            <Column
              header="Total"
              body={(row: VehicleDistanceRow) => formatCellValue(row.total)}
              style={{ width: "130px" }}
            />
          </DataTable>
          {/* <div className="md-pagination">
            <button type="button" onClick={goToPreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button type="button" onClick={goToNextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
