import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { encryptSegment } from "@/utils/routeCrypto";
import { Switch } from "@/components/ui/switch";
import { zoneApi } from "@/helpers/admin";

// ===========================
//   Types
// ===========================
type ZoneRecord = {
  unique_id: string;
  name: string;
  city_name: string;
  district_name: string;
  state_name: string;
  is_active: boolean;
};

type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Something went wrong while processing the request.";
  if (typeof error === "string") return error;

  const data = (error as ErrorWithResponse)?.response?.data;

  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(", ");

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([k, v]) =>
        Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${String(v)}`
      )
      .join("\n");
  }

  if (error instanceof Error && error.message) return error.message;

  return "Something went wrong while processing the request.";
};

// ===========================
//   Component
// ===========================
export default function ZoneList() {
  const [zones, setZones] = useState<ZoneRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encZones = encryptSegment("zones");

  const ENC_NEW_PATH = `/${encMasters}/${encZones}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encZones}/${id}/edit`;

  // ===========================
  //   Load Data
  // ===========================
  const fetchZones = useCallback(async () => {
    // setLoading(true);
    try {
      const data = (await zoneApi.list()) as ZoneRecord[];
      setZones(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load zones",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // ===========================
  //   Delete
  // ===========================
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This zone will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    await zoneApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchZones();
  };

  // ===========================
  //   Search
  // ===========================
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setFilters({
      ...filters,
      global: { ...filters.global, value },
    });

    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Zones..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // ===========================
  //   Toggle Status
  // ===========================
  const statusTemplate = (row: ZoneRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await zoneApi.update(row.unique_id, { is_active: value });
        fetchZones();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  // ===========================
  //   Actions
  // ===========================
  const actionTemplate = (row: ZoneRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      {/* <button
        onClick={() => handleDelete(row.unique_id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button> */}
    </div>
  );

  const indexTemplate = (_: ZoneRecord, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  // ===========================
  //   UI
  // ===========================
  return (
    <div className="p-3">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Zones</h1>
            <p className="text-gray-500 text-sm">Manage zone records</p>
          </div>

          <Button
            label="Add Zone"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={zones}
          dataKey="unique_id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          filters={filters}
          header={renderHeader()}
          stripedRows
          showGridlines
          emptyMessage="No zones found."
          globalFilterFields={[
            "name",
            "city_name",
            "district_name",
            "state_name",
          ]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="city_name"
            header="City"
            sortable
            body={(row) => cap(row.city_name)}
          />

          <Column
            field="name"
            header="Zone"
            sortable
            body={(row) => cap(row.name)}
          />

          <Column header="Status" body={statusTemplate} style={{ width: "140px" }} />

          <Column
            header="Actions"
            body={actionTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
    </div>
  );
}
