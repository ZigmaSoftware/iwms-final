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
import { getEncryptedRoute } from "@/utils/routeCache";

import { Switch } from "@/components/ui/switch";

type Fuel = {
  id: number;
  fuel_type: string;
  description: string;
  is_active: boolean;
};

export default function FuelList() {
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fuel_type: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encTransportMaster, encFuel } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encTransportMaster}/${encFuel}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encTransportMaster}/${encFuel}/${id}/edit`;

  const fetchFuels = async () => {
    try {
      const res = await desktopApi.get("fuels/");
      setFuels(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuels();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This fuel record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirmDelete.isConfirmed) return;

    await desktopApi.delete(`fuels/${id}/`);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchFuels();
  };

  const onGlobalFilterChange = (e: any) => {
    const updated = { ...filters };
    updated["global"].value = e.target.value;
    setFilters(updated);
    setGlobalFilterValue(e.target.value);
  };

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  /* -------------------- STATUS TOGGLE -------------------- */
  const statusTemplate = (row: Fuel) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.patch(`fuels/${row.id}/`, { is_active: value });
        fetchFuels();
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    };

    return (
      <Switch checked={row.is_active} onCheckedChange={updateStatus} />
    );
  };

  /* --------------------- ACTION BUTTONS --------------------- */
  const actionTemplate = (row: Fuel) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: Fuel, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search fuels..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Fuel Types
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your fuel type records
            </p>
          </div>

          <Button
            label="Add Fuel"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={fuels}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={["fuel_type"]}
          header={header}
          emptyMessage="No fuel records found."
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="fuel_type"
            header="Fuel Type"
            sortable
            body={(row: Fuel) => cap(row.fuel_type)}
            style={{ minWidth: "200px" }}
          />

          {/* 🔥 NEW — Toggle Status */}
          <Column
            field="is_active"
            header="Status"
            body={statusTemplate}
            style={{ width: "150px" }}
          />

          <Column
            header="Actions"
            body={actionTemplate}
            style={{ width: "150px" }}
          />
        </DataTable>
      </div>
    </div>
  );
}
