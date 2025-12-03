import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {desktopApi} from "@/api";
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
import { Switch } from "@/components/ui/switch"; // 🔥 NEW toggle

// ===========================
//   Types
// ===========================
type Zone = {
  id: number;
  name: string;
  city_name: string;
  district_name: string;
  state_name: string;
  is_active: boolean;
};

// ===========================
//   Component
// ===========================
export default function ZoneList() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encZones = encryptSegment("zones");

  const ENC_NEW_PATH = `/${encMasters}/${encZones}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encMasters}/${encZones}/${id}/edit`;

  // ===========================
  //   Load Data
  // ===========================
  const fetchZones = async () => {
    try {
      const res = await desktopApi.get("zones/");
      setZones(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // ===========================
  //   Delete
  // ===========================
  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This zone will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (!confirm.isConfirmed) return;

    await desktopApi.delete(`zones/${id}/`);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false
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
      global: { ...filters.global, value }
    });

    setGlobalFilterValue(value);
  };

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // ===========================
  //   Toggle Status (PATCH)
  // ===========================
  const statusTemplate = (row: Zone) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.patch(`zones/${row.id}/`, { is_active: value });
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
  const actionTemplate = (row: Zone) => (
    <div className="flex gap-3 justify-center">
      <button
        title="Edit"
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        onClick={() => handleDelete(row.id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: Zone, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  // ===========================
  //   Table Header
  // ===========================
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

  const header = renderHeader();

  // ===========================
  //   UI
  // ===========================
  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Page Header */}
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

        {/* Data Table */}
        <DataTable
          value={zones}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No zones found."
          globalFilterFields={["name", "city_name", "district_name", "state_name"]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="city_name"
            header="City"
            sortable
            body={(row: Zone) => cap(row.city_name)}
          />

          <Column
            field="name"
            header="Zone"
            sortable
            body={(row: Zone) => cap(row.name)}
          />

          {/* 🔥 Toggle Status */}
          <Column
            header="Status"
            body={statusTemplate}
            style={{ width: "140px" }}
          />

          <Column
            header="Actions"
            body={actionTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
      </div>
    </div>
  );
}
