import { useEffect, useMemo, useState } from "react";
import "./wastesummary.css";
import {desktopApi} from "@/api";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  filterActiveCustomers,
  normalizeCustomerArray,
} from "@/utils/customerUtils";

const ZIGMA_API_BASE = (
  import.meta.env.VITE_ZIGMA_API_BASE ||
  "https://zigma.in/d2d/folders"
).replace(/\/$/, "");

const VEHICLE_TRACKING_API =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const pickVehicleId = (record: Record<string, any>): string | null => {
  const keys = [
    "vehicleId",
    "vehicle_id",
    "vehicleNo",
    "regNo",
    "vehicle_number",
    "vehicle",
    "vehiclenumber",
    "shortName",
  ];

  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null) {
      const str = String(value).trim();
      if (str) return str;
    }
  }
  return null;
};

type ApiRow = {
  date: string;
  total_vehicle?: number | string;
  vehicle_count?: number | string;
  total_vehicle_count?: number | string;
  vehicles?: number | string;
  no_of_vehicle?: number | string;
  no_of_vehicles?: number | string;
  total_trip?: number | string;
  dry_weight: number;
  wet_weight: number;
  mix_weight: number;
  total_net_weight: number;
  average_weight_per_trip: number;
  total_household?: number;
  wt_collected?: number;
  wt_not_collected?: number;
};

export default function WasteSummary() {
  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [monthValue, setMonthValue] = useState(initialMonth);
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalHouseholdCount, setTotalHouseholdCount] = useState<number | null>(
    null
  );
  const [totalWasteCollectedCount, setTotalWasteCollectedCount] =
    useState<number | null>(null);
  const [vehicleTrackingCount, setVehicleTrackingCount] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = useMemo(
    () => Math.ceil(rows.length / rowsPerPage),
    [rows.length]
  );

  const formatMonthLabel = (value: string) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  const parseNumberValue = (value?: number | string | null) => {
    if (value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatOptionalNumber = (value?: number | string | null) => {
    const parsed = parseNumberValue(value);
    return parsed !== null ? parsed.toLocaleString() : "-";
  };

  const getVehicleCount = (row: ApiRow) => {
    const candidates = [
      row.total_vehicle,
      row.vehicle_count,
      row.total_vehicle_count,
      row.vehicles,
      row.no_of_vehicle,
      row.no_of_vehicles,
    ];

    for (const value of candidates) {
      const parsed = parseNumberValue(value);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  const computedNotCollected =
    totalHouseholdCount !== null && totalWasteCollectedCount !== null
      ? Math.max(totalHouseholdCount - totalWasteCollectedCount, 0)
      : null;

  const fetchMonthData = async () => {
    setLoading(true);

    try {
      const fromDate = `${monthValue}-01`;
      const params = new URLSearchParams({
        from_date: fromDate,
        key: "ZIGMA-DELHI-WEIGHMENT-2025-SECURE",
      });

      const url = `${ZIGMA_API_BASE}/waste_collected_summary_report/waste_collected_data_api.php?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const raw = await response.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Non-JSON response: ${raw.slice(0, 200)}`);
      }

      if (data.status && Array.isArray(data.data)) {
        setRows(data.data);
        setCurrentPage(1);
      } else setRows([]);
    } catch (error) {
      console.error("API Error:", error);
      setRows([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMonthData();
  }, [monthValue]);

  useEffect(() => {
    const fetchHouseholdCount = async () => {
      try {
      const response = await desktopApi.get("customercreations/");
      const customers = normalizeCustomerArray(response.data);
      const activeCustomers = filterActiveCustomers(customers);
      setTotalHouseholdCount(activeCustomers.length);
      } catch (error) {
        console.error("Customer count fetch failed:", error);
        setTotalHouseholdCount(0);
      }
    };

    const fetchWasteCollectionCount = async () => {
      try {
        const response = await desktopApi.get("wastecollections/");
        if (Array.isArray(response.data)) {
          setTotalWasteCollectedCount(response.data.length);
        } else {
          setTotalWasteCollectedCount(0);
        }
      } catch (error) {
        console.error("Waste collection count fetch failed:", error);
        setTotalWasteCollectedCount(0);
      }
    };

    const fetchVehicleTrackingCount = async () => {
      try {
        const response = await fetch(VEHICLE_TRACKING_API);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const body = await response.json();
        const records = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
          ? body.data
          : [];

        if (Array.isArray(records) && records.length) {
          const unique = new Set<string>();
          records.forEach((record) => {
            const id = pickVehicleId(record);
            if (id) unique.add(id);
          });
          setVehicleTrackingCount(unique.size || records.length);
        } else {
          setVehicleTrackingCount(null);
        }
      } catch (error) {
        console.error("Vehicle tracking count fetch failed:", error);
        setVehicleTrackingCount(null);
      }
    };

    fetchHouseholdCount();
    fetchWasteCollectionCount();
    fetchVehicleTrackingCount();
  }, []);

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => {
      const searchFields = [
        row.date,
        row.total_household,
        row.wt_collected,
        row.wt_not_collected,
        row.total_trip,
        row.dry_weight,
        row.wet_weight,
        row.mix_weight,
        row.total_net_weight,
        row.average_weight_per_trip,
        getVehicleCount(row),
      ];

      return searchFields.some((value) =>
        value !== undefined && value !== null
          ? value.toString().toLowerCase().includes(needle)
          : false
      );
    });
  }, [searchTerm, rows]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  const handleDownload = () => {
    const exportRows = filteredRows.map((row) => {
      const vehicleCount = getVehicleCount(row) ?? vehicleTrackingCount ?? null;

      return {
        Date: row.date,
        "Total Household": totalHouseholdCount ?? row.total_household ?? null,
        "Wt Collected": totalWasteCollectedCount ?? row.wt_collected ?? null,
        "Wt Not Collected": computedNotCollected ?? row.wt_not_collected ?? null,
        "No. of Vehicle": vehicleCount,
        "No. of Trip": parseNumberValue(row.total_trip),
        "Dry Wt/kg": parseNumberValue(row.dry_weight),
        "Wet Wt/kg": parseNumberValue(row.wet_weight),
        "Mixed Wt/kg": parseNumberValue(row.mix_weight),
        "Weighment/kg": parseNumberValue(row.total_net_weight),
        "Avg/Per Trip": parseNumberValue(row.average_weight_per_trip),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Waste Summary");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `waste-summary-${monthValue}.xlsx`);
  };

  return (
    <div className="ws-page">
      <div className="ws-card">
        <div className="ws-header">
          <div className="ws-month-control">
            <label>Month</label>
            <div className="ws-month-input">
              <input
                type="month"
                value={monthValue}
                max={initialMonth}
                onChange={(e) => setMonthValue(e.target.value)}
              />
              <button type="button" className="ws-go-button" onClick={fetchMonthData}>
                Go
              </button>
            </div>
          </div>

          <div className="ws-actions">
            <button
              type="button"
              className="ws-export-button"
              onClick={handleDownload}
            >
              Download XLSX
            </button>

            <input
              type="text"
              className="ws-search"
              placeholder="Search by date, weight, vehicle, trip…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ws-table-wrapper">
          <div className="ws-table-headline">{formatMonthLabel(monthValue)}</div>

          {loading ? (
            <div className="loading">Loading data…</div>
          ) : (
            <table className="ws-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Total Household</th>
                  <th>Wt Collected</th>
                  <th>Wt Not Collected</th>
                  <th>No. of Vehicle</th>
                  <th>No. of Trip</th>
                  <th>Dry Wt/kg</th>
                  <th>Wet Wt/kg</th>
                  <th>Mixed Wt/kg</th>
                  <th>Weighment/kg</th>
                  <th>Avg/Per Trip</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: 20 }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, index) => (
                    <tr key={row.date}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td>{row.date}</td>
                      <td>
                        {formatOptionalNumber(
                          totalHouseholdCount ?? row.total_household
                        )}
                      </td>
                      <td>
                        {formatOptionalNumber(
                          totalWasteCollectedCount ?? row.wt_collected
                        )}
                      </td>
                      <td>
                        {formatOptionalNumber(
                          computedNotCollected ?? row.wt_not_collected
                        )}
                      </td>
                      <td>
                        {formatOptionalNumber(
                          getVehicleCount(row) ?? vehicleTrackingCount
                        )}
                      </td>
                      <td>{formatOptionalNumber(row.total_trip)}</td>
                      <td>{row.dry_weight.toLocaleString()}</td>
                      <td>{row.wet_weight.toLocaleString()}</td>
                      <td>{row.mix_weight}</td>
                      <td>{row.total_net_weight.toLocaleString()}</td>
                      <td>{row.average_weight_per_trip.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* === PAGINATION === */}
        <div className="ws-pagination">
          <div className="ws-pagination-bar">
            <div
              className="ws-pagination-progress"
              style={{
                width: `${(currentPage / totalPages) * 100}%`,
              }}
            ></div>
          </div>

          <div className="ws-pagination-numbers">
            <button
              className="ws-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              «
            </button>

            <button
              className="ws-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`ws-page-number ${
                  currentPage === i + 1 ? "active" : ""
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="ws-page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>

            <button
              className="ws-page-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
