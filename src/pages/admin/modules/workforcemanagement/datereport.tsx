import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";
import "./datereport.css";

type ApiRow = {
  date: string;
  Start_Time: string | null;
  End_Time: string | null;
  total_trip: number;
  dry_weight: number;
  wet_weight: number;
  mix_weight: number;
  total_net_weight: number;
  average_weight_per_trip: number;
};

const API_URL =
  "/zigma-api/waste_collected_summary_report/waste_collected_data_api.php";
const API_KEY = "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

const today = new Date();
const todayIso = today.toISOString().split("T")[0];

const formatFullDate = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const compareDates = (a: string, b: string) => {
  return new Date(a).getTime() - new Date(b).getTime();
};

const formatNumber = (value?: number | null) =>
  value !== undefined && value !== null ? value.toLocaleString() : "-";

const formatTime = (value: string | null) => (value ? value : "-");

const getLastDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export default function DateReport() {
  const navigate = useNavigate();
  const { encWorkforceManagement } = getEncryptedRoute();

  const initialFromDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const initialToDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    getLastDayOfMonth(today.getFullYear(), today.getMonth() + 1)
  ).padStart(2, "0")}`;

  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Pagination ----
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  const paginatedRows = rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const fetchData = async (targetFromDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from_date: targetFromDate,
        key: API_KEY,
      });
      const response = await fetch(`${API_URL}?${params.toString()}`);
      const payload = await response.json();
      if (payload?.status && Array.isArray(payload.data)) {
        const sorted = [...payload.data].sort((a, b) =>
          compareDates(a.date, b.date)
        );
        setRows(sorted);
        setCurrentPage(1); // reset page
      } else {
        setRows([]);
        setError("No data available for the selected range.");
      }
    } catch (err) {
      console.error("Date report API error:", err);
      setRows([]);
      setError("Unable to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(initialFromDate);
  }, [initialFromDate]);

  const handleGo = () => {
    fetchData(fromDate);
  };

  const goBack = () => {
    navigate(`/${encWorkforceManagement}/${encWorkforceManagement}`);
  };

  const rangeLabel = `${formatFullDate(fromDate)} – ${formatFullDate(toDate)}`;

  return (
    <div className="dr-page">
      <div className="dr-card">
        <div className="dr-header">
          <button type="button" className="dr-back" onClick={goBack}>
            Back
          </button>

          <div className="dr-title-area">
            <h1>Date-wise Waste Report</h1>
            <p>{rangeLabel}</p>
          </div>

          <div className="dr-controls">
            <label>
              From Date
              <input
                type="date"
                value={fromDate}
                max={todayIso}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>

            <label>
              To Date
              <input
                type="date"
                value={toDate}
                max={todayIso}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="dr-go"
              onClick={handleGo}
              disabled={loading}
            >
              {loading ? "Loading..." : "Go"}
            </button>
          </div>
        </div>

        {error && <p className="dr-error">{error}</p>}

        <div className="dr-table-wrapper">
          {loading && rows.length === 0 ? (
            <p className="dr-loading">Loading data...</p>
          ) : rows.length === 0 ? (
            <p className="dr-empty">No data available for the selected range.</p>
          ) : (
            <table className="dr-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>No. of Trip</th>
                  <th>Dry Wt/kg</th>
                  <th>Wet Wt/kg</th>
                  <th>Mixed Wt/kg</th>
                  <th>Net Wt/kg</th>
                  <th>Avg/<br />Trip</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={row.date + index}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>{row.date}</td>
                    <td>{formatTime(row.Start_Time)}</td>
                    <td>{formatTime(row.End_Time)}</td>
                    <td>{formatNumber(row.total_trip)}</td>
                    <td>{formatNumber(row.dry_weight)}</td>
                    <td>{formatNumber(row.wet_weight)}</td>
                    <td>{formatNumber(row.mix_weight)}</td>
                    <td>{formatNumber(row.total_net_weight)}</td>
                    <td>{Number(row.average_weight_per_trip).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ================= PAGINATION ================= */}
        {rows.length > 0 && (
          <div className="dr-pagination">
            <div className="dr-pagination-bar">
              <div
                className="dr-pagination-progress"
                style={{
                  width: `${(currentPage / totalPages) * 100}%`,
                }}
              ></div>
            </div>

            <div className="dr-pagination-numbers">
              <button
                className="dr-page-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                «
              </button>

              <button
                className="dr-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`dr-page-number ${
                    currentPage === i + 1 ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="dr-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ›
              </button>

              <button
                className="dr-page-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
