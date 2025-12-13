import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { getEncryptedRoute } from "@/utils/routeCache";
import { fetchWasteReport, type WasteApiRow } from "@/utils/wasteApi";
import "./datereport.css";

type ApiRow = WasteApiRow & {
  Start_Time: string | null;
  End_Time: string | null;
  total_trip: number;
  dry_weight: number;
  wet_weight: number;
  mix_weight: number;
  total_net_weight: number;
  average_weight_per_trip: number;
};

const today = new Date();

const getLastDayOfMonth = (y: number, m: number) =>
  new Date(y, m, 0).getDate();

const formatNumber = (v?: number | null) =>
  v !== null && v !== undefined ? v.toLocaleString() : "-";

const formatTime = (v: string | null) => (v ? v : "-");

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

  /* ================= Fetch ================= */
  const loadData = async () => {
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be later than To Date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { rows: apiRows, message } =
        await fetchWasteReport<ApiRow>(
          "date_wise_data",
          fromDate,
          toDate
        );

      if (!apiRows.length) {
        setRows([]);
        setError(message || "No data available");
        return;
      }

      setRows(apiRows);
    } catch (e) {
      setRows([]);
      setError("Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const indexTemplate = (_: ApiRow, { rowIndex }: any) => rowIndex + 1;

  /* ================= UI ================= */
  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              Date-wise Waste Report
            </h1>
            <p className="text-sm text-gray-500">
              Consolidated waste metrics by date
            </p>
          </div>

          <Button
            icon="pi pi-arrow-left"
            label="Back"
            severity="secondary"
            onClick={() =>
              navigate(
                `/${encWorkforceManagement}/${encWorkforceManagement}`
              )
            }
          />
        </div>

        {/* Controls */}
        <div className="flex gap-4 items-end mb-4">
          <label>
            From Date
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="ml-2"
            />
          </label>

          <label>
            To Date
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ml-2"
            />
          </label>

          <Button
            label="Go"
            icon="pi pi-search"
            onClick={loadData}
            loading={loading}
          />
        </div>

        {error && (
          <p className="text-red-600 mb-3">{error}</p>
        )}

        {/* ================= TABLE ================= */}
        <DataTable
          value={rows}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          stripedRows
          showGridlines
          emptyMessage="No records found"
          className="p-datatable-sm"
        >
          <Column
            header="S.No"
            body={indexTemplate}
            style={{ width: "80px" }}
          />

          <Column field="date" header="Date" sortable />
          <Column
            header="Start Time"
            body={(r) => formatTime(r.Start_Time)}
          />
          <Column
            header="End Time"
            body={(r) => formatTime(r.End_Time)}
          />
          <Column
            field="total_trip"
            header="Trips"
            sortable
          />
          <Column
            header="Dry (kg)"
            body={(r) => formatNumber(r.dry_weight)}
          />
          <Column
            header="Wet (kg)"
            body={(r) => formatNumber(r.wet_weight)}
          />
          <Column
            header="Mixed (kg)"
            body={(r) => formatNumber(r.mix_weight)}
          />
          <Column
            header="Net (kg)"
            body={(r) => formatNumber(r.total_net_weight)}
            sortable
          />
          <Column
            header="Avg / Trip"
            body={(r) =>
              Number(r.average_weight_per_trip).toFixed(2)
            }
          />
        </DataTable>
      </div>
    </div>
  );
}
