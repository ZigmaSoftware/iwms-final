import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {desktopApi} from "@/api";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";

import { Switch } from "@/components/ui/switch"; // 🔥 Toggle

type VehicleType = {
  id: number;
  unique_id: string;
  vehicleType: string;
  description: string;
  is_active: boolean;
};

export default function VehicleTypeCreation() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { encTransportMaster, encVehicleType } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encTransportMaster}/${encVehicleType}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encTransportMaster}/${encVehicleType}/${id}/edit`;

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    vehicleType: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const fetchVehicleTypes = async () => {
    try {
      const res = await desktopApi.get("vehicle-type/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVehicleTypes(data);
    } catch (error) {
      console.error("Failed to fetch vehicle types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This vehicle type will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await desktopApi.delete(`vehicle-type/${id}/`);
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchVehicleTypes();
    } catch (err) {
      console.error("Failed to delete vehicle type:", err);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated["global"].value = value;
    setFilters(updated);
    setGlobalFilterValue(value);
  };

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  /* -------------------- 🔥 Status Toggle (PATCH API) -------------------- */
  const statusTemplate = (row: VehicleType) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.patch(`vehicle-type/${row.id}/`, { is_active: value });
        fetchVehicleTypes();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    };

    return (
      <Switch checked={row.is_active} onCheckedChange={updateStatus} />
    );
  };

  /* --------------------- ACTION BUTTONS --------------------- */
  const actionTemplate = (row: VehicleType) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        onClick={() => handleDelete(row.id)}
        className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
        title="Delete"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  // Index column
  const indexTemplate = (_: VehicleType, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search vehicle types..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Vehicle Types
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your vehicle type records
            </p>
          </div>

          <Button
            label="Add Vehicle Type"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        {/* Table */}
        <DataTable
          value={vehicleTypes}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={["vehicleType"]}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No vehicle types found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="vehicleType"
            header="Vehicle Type"
            sortable
            body={(row: VehicleType) => cap(row.vehicleType)}
            style={{ minWidth: "200px" }}
          />

          {/* 🔥 Toggle Status */}
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
