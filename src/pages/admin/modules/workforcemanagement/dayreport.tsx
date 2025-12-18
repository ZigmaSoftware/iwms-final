import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "./dayreport.css";

type ApiRow = {
  Ticket_No: string;
  Vehicle_No: string;
  date: string;
  Start_Time: string | null;
  total_trip: number;
  dry_weight: number;
  wet_weight: number;
  mix_weight: number;
  total_net_weight: number;
  average_weight_per_trip: number;
};

const today = new Date();

const getLastDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const formatNumber = (v?: number | null) =>
  v !== null && v !== undefined ? v.toLocaleString() : "-";

export default function DayReport() {
  const navigate = useNavigate();

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
  const [error, setError] = useState<string | null>(null);

  /* ================= Filters ================= */
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <div className="flex gap-3 items-center">
        <label>
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="ml-2 wf-date-input"
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="ml-2 wf-date-input"
          />
        </label>

        <Button
          label="Go"
          // icon="pi pi-search"
          onClick={fetchData}
        />
      </div>

      <span className="p-input-icon-left">
        {/* <span className="pi pi-search" /> */}
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Ticket / Vehicle / Date"
        />
      </span>
    </div>
  );

  /* ================= Fetch ================= */
  async function fetchData() {
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be greater than To Date");
      return;
    }

    setError(null);

    try {
      const res = await fetch(
        `https://zigma.in/d2d/folders/waste_collected_summary_report/test_waste_collected_data_api.php?action=day_wise_data&from_date=${fromDate}&to_date=${toDate}&key=ZIGMA-DELHI-WEIGHMENT-2025-SECURE`
      );
      const json = await res.json();

      if (!json.data?.length) {
        setRows([]);
        setError("No data available");
        return;
      }

      const mapped: ApiRow[] = json.data.map((row: any) => {
        const dry = Number(row.Dry_Wt.replace(/,/g, ""));
        const wet = Number(row.Wet_Wt.replace(/,/g, ""));
        const mix = Number(row.Mix_Wt.replace(/,/g, ""));
        const net = Number(row.Net_Wt.replace(/,/g, ""));

        return {
          Ticket_No: row.Ticket_No,
          Vehicle_No: row.Vehicle_No,
          date: row.Date.split(" ")[0],
          Start_Time: row.Date.split(" ")[1] || null,
          total_trip: 1,
          dry_weight: dry,
          wet_weight: wet,
          mix_weight: mix,
          total_net_weight: net,
          average_weight_per_trip: net,
        };
      });

      setRows(mapped);
    } catch (e) {
      setError("API error occurred");
      setRows([]);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const indexTemplate = (_: ApiRow, { rowIndex }: any) => rowIndex + 1;

  /* ================= UI ================= */
  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg wf-table-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Day-wise Waste Report</h1>
            <p className="text-gray-500 text-sm">
              Daily vehicle & waste collection summary
            </p>
          </div>

          <Button
            icon="pi pi-arrow-left"
            label="Back"
            severity="success"
            onClick={() => navigate(-1)}
          />
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <DataTable
          value={rows}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          header={renderHeader()}
          globalFilterFields={["Ticket_No", "Vehicle_No", "date"]}
          stripedRows
          showGridlines
          emptyMessage="No records found"
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "70px" }} />
          <Column field="date" header="Date" sortable />
          <Column field="Start_Time" header="Start Time" />
          <Column field="Ticket_No" header="Ticket No" sortable />
          <Column field="Vehicle_No" header="Vehicle No" sortable />
          <Column
            field="dry_weight"
            header="Dry (kg)"
            body={(r) => formatNumber(r.dry_weight)}
          />
          <Column
            field="wet_weight"
            header="Wet (kg)"
            body={(r) => formatNumber(r.wet_weight)}
          />
          <Column
            field="mix_weight"
            header="Mixed (kg)"
            body={(r) => formatNumber(r.mix_weight)}
          />
          <Column
            field="total_net_weight"
            header="Net (kg)"
            body={(r) => formatNumber(r.total_net_weight)}
          />
          <Column
            header="Avg / Trip"
            body={(r) => r.average_weight_per_trip.toFixed(2)}
          />
        </DataTable>
      </div>
    </div>
  );
}
