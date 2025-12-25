import { useCallback, useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { binApi } from "@/helpers/admin";
import { PencilIcon } from "@/icons";

/* ================= TYPES ================= */

type Bin = {
  unique_id: string;
  bin_name: string;
  capacity_liters: number;
  is_active: boolean;
};

type TableFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
  bin_name: { value: string | null; matchMode: FilterMatchMode };
};

/* ================= ROUTES ================= */

const encMasters = encryptSegment("masters");
const encBins = encryptSegment("bins");

const ENC_NEW_PATH = `/${encMasters}/${encBins}/new`;
const ENC_EDIT_PATH = (id: string) =>
  `/${encMasters}/${encBins}/${id}/edit`;

/* ================= COMPONENT ================= */

export default function BinList() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<TableFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    bin_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();

  /* ================= DATA FETCH ================= */

  const fetchBins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await binApi.list();
      setBins(data);
    } catch {
      Swal.fire("Error", "Failed to fetch bins", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  /* ================= FILTER ================= */

  const onGlobalFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  /* ================= STATUS TOGGLE ================= */

  const statusBodyTemplate = (row: Bin) => {
    const updateStatus = async (checked: boolean) => {
      try {
        await binApi.update(row.unique_id, {
          bin_name: row.bin_name,
          capacity_liters: row.capacity_liters,
          is_active: checked,
        });
        fetchBins();
      } catch {
        Swal.fire("Error", "Failed to update status", "error");
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  /* ================= ACTIONS ================= */

  const actionBodyTemplate = (row: Bin) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: any, options: any) =>
    options.rowIndex + 1;

  /* ================= HEADER SEARCH ================= */

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search bins..."
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Bins
          </h1>
          <p className="text-gray-500 text-sm">
            Manage bin records
          </p>
        </div>

        <Button
          label="Add Bin"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      {/* Table */}
      <DataTable
        value={bins}
        dataKey="unique_id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        filters={filters}
        globalFilterFields={["bin_name"]}
        header={header}
        stripedRows
        showGridlines
        loading={loading}
        className="p-datatable-sm"
      >
        <Column
          header="S.No"
          body={indexTemplate}
          style={{ width: "80px" }}
        />

        <Column
          field="bin_name"
          header="Bin Name"
          sortable
          style={{ minWidth: "200px" }}
        />

        <Column
          field="capacity_liters"
          header="Capacity (L)"
          sortable
          style={{ minWidth: "150px" }}
        />

        <Column
          header="Status"
          body={statusBodyTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />

        <Column
          header="Actions"
          body={actionBodyTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
