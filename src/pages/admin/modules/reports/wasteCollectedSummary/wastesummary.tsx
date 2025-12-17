import { useEffect, useMemo, useState } from "react";
import "./wastesummary.css";
import { desktopApi } from "@/api";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

import {
  filterActiveCustomers,
  normalizeCustomerArray,
} from "@/utils/customerUtils";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

/* ================= CONSTANTS ================= */

const ZIGMA_API_BASE = (
  import.meta.env.VITE_ZIGMA_API_BASE ||
  "https://zigma.in/d2d/folders"
).replace(/\/$/, "");

const VEHICLE_TRACKING_API =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

/* ================= TYPES ================= */

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

/* ================= COMPONENT ================= */

export default function WasteSummary() {
  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [monthValue, setMonthValue] = useState(initialMonth);
  const [rows, setRows] = useState<ApiRow[]>([]);

  const [totalHouseholdCount, setTotalHouseholdCount] = useState<number | null>(null);
  const [totalWasteCollectedCount, setTotalWasteCollectedCount] = useState<number | null>(null);
  const [vehicleTrackingCount, setVehicleTrackingCount] = useState<number | null>(null);

  /* ===== PrimeReact Search ===== */

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  /* ================= HELPERS ================= */

  const parseNum = (v?: number | string | null) => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const formatNum = (v?: number | string | null) => {
    const n = parseNum(v);
    return n !== null ? n.toLocaleString() : "-";
  };

  const getVehicleCount = (row: ApiRow) => {
    const values = [
      row.total_vehicle,
      row.vehicle_count,
      row.total_vehicle_count,
      row.vehicles,
      row.no_of_vehicle,
      row.no_of_vehicles,
    ];
    for (const v of values) {
      const n = parseNum(v);
      if (n !== null) return n;
    }
    return vehicleTrackingCount;
  };

  const notCollected =
    totalHouseholdCount !== null && totalWasteCollectedCount !== null
      ? Math.max(totalHouseholdCount - totalWasteCollectedCount, 0)
      : null;

  /* ================= FETCH MONTH DATA ================= */

  const fetchMonthData = async () => {
    try {
      const url = `${ZIGMA_API_BASE}/waste_collected_summary_report/waste_collected_data_api.php?from_date=${monthValue}-01&key=ZIGMA-DELHI-WEIGHMENT-2025-SECURE`;
      const res = await fetch(url);
      const json = await res.json();
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [monthValue]);

  /* ================= MASTER COUNTS ================= */

  useEffect(() => {
    (async () => {
      const res = await desktopApi.get("customercreations/");
      const active = filterActiveCustomers(
        normalizeCustomerArray(res.data)
      );
      setTotalHouseholdCount(active.length);
    })();

    (async () => {
      const res = await desktopApi.get("wastecollections/");
      setTotalWasteCollectedCount(
        Array.isArray(res.data) ? res.data.length : 0
      );
    })();

    (async () => {
      const res = await fetch(VEHICLE_TRACKING_API);
      const body = await res.json();
      const list = Array.isArray(body?.data) ? body.data : body;
      const set = new Set<string>();
      list?.forEach((r: any) => {
        Object.values(r).forEach((v) => v && set.add(String(v)));
      });
      setVehicleTrackingCount(set.size);
    })();
  }, []);

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
          placeholder="Search waste summary..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* ================= EXPORT ================= */

  const handleDownload = () => {
    const exportRows = rows.map((r) => ({
      Date: r.date,
      "Total Household": totalHouseholdCount,
      "Wt Collected": totalWasteCollectedCount,
      "Wt Not Collected": notCollected,
      "No. of Vehicle": getVehicleCount(r),
      "No. of Trip": parseNum(r.total_trip),
      "Dry Wt/kg": parseNum(r.dry_weight),
      "Wet Wt/kg": parseNum(r.wet_weight),
      "Mixed Wt/kg": parseNum(r.mix_weight),
      "Weighment/kg": parseNum(r.total_net_weight),
      "Avg/Per Trip": parseNum(r.average_weight_per_trip),
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Waste Summary");

    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `waste-summary-${monthValue}.xlsx`
    );
  };

  /* ================= UI ================= */

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Waste Collected Summary
            </h1>
            <p className="text-gray-500 text-sm">
              Month-wise waste collection analytics
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="month"
              value={monthValue}
              max={initialMonth}
              onChange={(e) => setMonthValue(e.target.value)}
              className="border px-2 py-1 rounded"
            />

            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Download
            </button>
          </div>
        </div>

        <DataTable
          value={rows}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          header={renderHeader()}
          stripedRows
          showGridlines
          emptyMessage="No waste data found."
          globalFilterFields={[
            "date",
            "total_trip",
            "dry_weight",
            "wet_weight",
            "mix_weight",
            "total_net_weight",
          ]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={(_, o) => o.rowIndex + 1} style={{ width: "80px" }} />
          <Column field="date" header="Date" sortable />
          <Column header="Total Household" body={() => formatNum(totalHouseholdCount)} />
          <Column header="Wt Collected" body={() => formatNum(totalWasteCollectedCount)} />
          <Column header="Wt Not Collected" body={() => formatNum(notCollected)} />
          <Column header="No. of Vehicle" body={(r) => formatNum(getVehicleCount(r))} />
          <Column field="total_trip" header="No. of Trip" sortable />
          <Column field="dry_weight" header="Dry Wt/kg" sortable />
          <Column field="wet_weight" header="Wet Wt/kg" sortable />
          <Column field="mix_weight" header="Mixed Wt/kg" sortable />
          <Column field="total_net_weight" header="Weighment/kg" sortable />
          <Column
            field="average_weight_per_trip"
            header="Avg / Trip"
            body={(r) => Number(r.average_weight_per_trip).toFixed(2)}
          />
        </DataTable>
      </div>
    </div>
  );
}
