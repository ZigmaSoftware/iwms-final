import { ChangeEvent, JSX, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./tripsummary.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

type RawVehicle = Record<string, any>;

type VehicleOption = {
  id: string;
  label: string;
};

interface HistoryRow {
  startTime: number;
  endTime: number;
  intLoc: string;
  finLoc: string;
  tripDistance: number;
  position: string;
  duration: number;
}

interface TripData {
  vehicleName?: string;
  startOdo?: number;
  endOdo?: number;
  totalTripLength?: number;
  moveCount?: number;
  parkCount?: number;
  idleCount?: number;
  historyConsilated?: HistoryRow[];
}

type VisualStatus = "moving" | "parked" | "idle";

const STATUS_ICONS: Record<VisualStatus, JSX.Element> = {
  moving: (
    <svg viewBox="0 0 48 48" role="presentation" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#d1fae5" />
      <path
        d="M16 26l16-12v7h9l-16 12v-7H16z"
        fill="#047857"
        stroke="#065f46"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  parked: (
    <svg viewBox="0 0 48 48" role="presentation" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#e0e7ff" />
      <path
        d="M12 26h24l4-8H8l4 8z"
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth="1"
      />
      <rect x="14" y="22" width="5" height="5" fill="#bfdbfe" />
      <rect x="29" y="22" width="5" height="5" fill="#bfdbfe" />
    </svg>
  ),
  idle: (
    <svg viewBox="0 0 48 48" role="presentation" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#fef3c7" />
      <rect x="16" y="14" width="6" height="20" rx="3" fill="#ca8a04" />
      <rect x="26" y="14" width="6" height="20" rx="3" fill="#ca8a04" />
    </svg>
  ),
};

const TRACKING_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

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

const pad = (value: number) => String(value).padStart(2, "0");
const formatInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;

const computeInitialRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 6 * 60 * 60 * 1000);
  return { from, to };
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

export default function TripSummary() {
  const initialRange = useMemo(() => computeInitialRange(), []);
  const [vehicles, setVehicles] = useState<VehicleOption[]>(FALLBACK_VEHICLES);
  const [vehicleId, setVehicleId] = useState(FALLBACK_VEHICLES[0].id);
  const [fromDate, setFromDate] = useState(() => formatInput(initialRange.from));
  const [toDate, setToDate] = useState(() => formatInput(initialRange.to));
  const [summary, setSummary] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [filters, setFilters] = useState<{
    [key: string]: { value: string | null; matchMode: FilterMatchMode };
  }>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  useEffect(() => {
    let aborted = false;
    const loadVehicles = async () => {
      try {
        const res = await fetch(TRACKING_API_URL);
        if (!res.ok) throw new Error(`Roster error (${res.status})`);
        const body = await res.json();
        const payload = Array.isArray(body) ? body : body?.data;
        if (!Array.isArray(payload)) throw new Error("Unexpected roster shape");
        const normalized = payload
          .map((record: RawVehicle) => normalizeVehicle(record))
          .filter((record): record is VehicleOption => Boolean(record));

        if (!aborted) {
          if (normalized.length) {
            setVehicles(normalized);
            setVehicleId((prev) => (normalized.some((item) => item.id === prev) ? prev : normalized[0].id));
            setRosterError("");
          } else {
            setVehicles(FALLBACK_VEHICLES);
            setVehicleId(FALLBACK_VEHICLES[0].id);
            setRosterError("No live vehicles. Showing fallback vehicles.");
          }
        }
      } catch (error) {
        console.error("Trip summary roster failed:", error);
        if (!aborted) {
          setVehicles(FALLBACK_VEHICLES);
          setVehicleId(FALLBACK_VEHICLES[0].id);
          setRosterError("Live vehicle list unavailable. Using fallback list.");
        }
      }
    };

    loadVehicles();
    return () => {
      aborted = true;
    };
  }, []);

  const fetchSummary = async () => {
    if (!vehicleId) {
      setSummaryError("Please choose a vehicle.");
      return;
    }
    const fromMs = new Date(fromDate).getTime();
    const toMs = new Date(toDate).getTime();
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
      setSummaryError("Invalid date range.");
      return;
    }
    if (fromMs >= toMs) {
      setSummaryError("From date must be earlier than To date.");
      return;
    }

    try {
      setLoading(true);
      setSummaryError("");

      const fromUTC = fromMs;
      const toUTC = toMs;

      const apiUrl = `https://gpsvtsprobend.vamosys.com/v2/getTripSummary?vehicleId=${vehicleId}&fromDateUTC=${fromUTC}&toDateUTC=${toUTC}&userId=NMCP2DISPOSAL&duration=0`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Trip summary error (${res.status})`);
      const data = await res.json();

      if (data && data.data) {
        setSummary(data.data);
        if (!data.data?.historyConsilated?.length) {
          setSummaryError("No trip records for selected range.");
        }
      } else {
        setSummaryError("No data returned from API.");
        setSummary(null);
      }
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to fetch trip summary.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataSource = summary?.historyConsilated ?? [];
    if (!dataSource.length) {
      setSummaryError("No data to export. Try fetching a range with trips first.");
      return;
    }

    const rows = dataSource.map((row, idx) => ({
      "S.No": idx + 1,
      "Vehicle No": summary?.vehicleName || vehicleId,
      "Start Time": new Date(row.startTime).toLocaleString(),
      "Start Address": row.intLoc || "-",
      "End Time": new Date(row.endTime).toLocaleString(),
      "End Address": row.finLoc || "-",
      Position: row.position || "-",
      "Total Minutes": Math.floor((row.duration ?? 0) / 60000),
      Distance: row.tripDistance ?? 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trip Summary");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const filename = `trip-summary-${vehicleId}-${Date.now()}.xlsx`;
    saveAs(blob, filename);
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const updatedFilters = { ...filters };
    updatedFilters["global"].value = value;
    setFilters(updatedFilters);
    setGlobalFilterValue(value);
  };

  const displaySummary = summary ?? {};
  const historyRows = displaySummary.historyConsilated ?? [];

  return (
    <div className="trip-summary-shell">
      <div className="trip-summary-container">
        <div className="trip-summary-header">
          <h3>Trip Summary</h3>
          <button className="btn-excel" type="button" onClick={handleExport}>
            <i className="fa fa-file-excel-o" aria-hidden="true" />
            Download
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-field">
            <label>Vehicle ID</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>From Date</label>
            <input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className="filter-field">
            <label>To Date</label>
            <input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <button className="btn-go" onClick={fetchSummary} disabled={loading}>
            {loading ? "Loading..." : "Go"}
          </button>
        </div>

        {rosterError && <div className="trip-inline-alert">{rosterError}</div>}
        {summaryError && <div className="trip-inline-alert warning">{summaryError}</div>}

        <div className="summary-header">
          <p>
            <span>Vehicle No:</span> {displaySummary.vehicleName || "-"}
          </p>
          <p>
            <span>Start Km:</span> {displaySummary.startOdo ?? "-"}
          </p>
          <p>
            <span>End Km:</span> {displaySummary.endOdo ?? "-"}
          </p>
          <p>
            <span>Trip Distance:</span> {displaySummary.totalTripLength ?? "-"} km
          </p>
        </div>

        <div className="status-cards">
          <div className="card moving">
            <div className="icon-wrap">
              {STATUS_ICONS.moving}
            </div>
            <div>
              <p>Moving</p>
              <strong>{displaySummary.moveCount ?? "-"}</strong>
            </div>
          </div>
          <div className="card parked">
            <div className="icon-wrap">
              {STATUS_ICONS.parked}
            </div>
            <div>
              <p>Parked</p>
              <strong>{displaySummary.parkCount ?? "-"}</strong>
            </div>
          </div>
          <div className="card idle">
            <div className="icon-wrap">
              {STATUS_ICONS.idle}
            </div>
            <div>
              <p>Idle</p>
              <strong>{displaySummary.idleCount ?? "-"}</strong>
            </div>
          </div>
        </div>

        <div className="trip-table-card">
          <DataTable
            value={historyRows}
            paginator
            rows={10}
            filters={filters}
            globalFilterFields={["intLoc", "finLoc", "position"]}
            header={
              <div className="flex justify-between items-center gap-4">
                <div className="text-lg font-semibold text-gray-700">Trip Records</div>
                <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
                  <i className="pi pi-search text-gray-500" />
                  <InputText
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Search trips..."
                    className="p-inputtext-sm !border-0 !shadow-none"
                  />
                </div>
              </div>
            }
            emptyMessage="No trip records found."
            responsiveLayout="scroll"
            stripedRows
            showGridlines
            className="p-datatable-sm"
          >
            <Column
              header="S.No"
              body={(_row, { rowIndex }) => rowIndex + 1}
              style={{ width: "80px" }}
            />
            <Column
              header="Start Time"
              body={(row: HistoryRow) => new Date(row.startTime).toLocaleString()}
              sortable
              style={{ minWidth: "170px" }}
            />
            <Column header="Start Address" body={(row: HistoryRow) => row.intLoc || "-"} style={{ minWidth: "180px" }} />
            <Column
              header="End Time"
              body={(row: HistoryRow) => new Date(row.endTime).toLocaleString()}
              sortable
              style={{ minWidth: "170px" }}
            />
            <Column header="End Address" body={(row: HistoryRow) => row.finLoc || "-"} style={{ minWidth: "180px" }} />
            <Column header="Vehicle No" body={() => displaySummary.vehicleName || vehicleId} style={{ minWidth: "160px" }} />
            <Column header="Position" body={(row: HistoryRow) => row.position || "-"} style={{ minWidth: "140px" }} />
            <Column
              header="Total Minutes"
              body={(row: HistoryRow) => Math.floor((row.duration ?? 0) / 60000)}
              style={{ width: "150px" }}
            />
            <Column header="Distance" body={(row: HistoryRow) => row.tripDistance ?? 0} style={{ width: "140px" }} />
          </DataTable>
        </div>
      </div>
    </div>
  );
}
