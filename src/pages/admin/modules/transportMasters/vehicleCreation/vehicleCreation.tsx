import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import { Switch } from "@/components/ui/switch";
import { adminApi } from "@/helpers/admin/registry";
import { useTranslation } from "react-i18next";

const vehicleApi = adminApi.vehicleCreation;

type Vehicles = {
  unique_id: string;
  vehicle_no: string;
  driver_name: string;
  driver_no: string;
  vehicle_type: number;
  vehicle_type_name: string;
  fuel_type: number;
  fuel_type_name: string;
  capacity?: string | null;
  fuel_efficiency?: string | null;
  last_maintenance?: string | null;
  zone_id: number;
  zone_name: string;
  ward_id: number;
  ward_name: string;
  is_active: boolean;
};

export default function VehicleCreation() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicles[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { encTransportMaster, encVehicleCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encTransportMaster}/${encVehicleCreation}/new`;
  const ENC_EDIT_PATH = (id: string | number) =>
    `/${encTransportMaster}/${encVehicleCreation}/${id}/edit`;

  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    vehicle_no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const resolveId = (vehicle: Vehicles) => vehicle.unique_id;

  const fetchVehicles = async () => {
    try {
      const res = await vehicleApi.list();
      setVehicles(res);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = await Swal.fire({
      title: t("common.confirm_title"),
      text: t("common.confirm_delete_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await vehicleApi.remove(id);
      Swal.fire({
        icon: "success",
        title: t("common.deleted_success"),
        timer: 1500,
        showConfirmButton: false,
      });
      fetchVehicles();
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    }
  };

  const onGlobalFilterChange = (e: any) => {
    const updated = { ...filters };
    updated["global"].value = e.target.value;
    setFilters(updated);
    setGlobalFilterValue(e.target.value);
  };

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  /* -------------------- FIXED STATUS TOGGLE -------------------- */
  const statusTemplate = (row: Vehicles) => {
    const updateStatus = async (value: boolean) => {
      try {
        await vehicleApi.update(resolveId(row), {
          vehicle_no: row.vehicle_no,
          driver_name: row.driver_name,
          driver_no: row.driver_no,
          vehicle_type: row.vehicle_type,
          vehicle_type_name: row.vehicle_type_name,
          fuel_type: row.fuel_type,
          fuel_type_name: row.fuel_type_name,
          zone_id: row.zone_id,
          zone_name: row.zone_name,
          ward_id: row.ward_id,
          ward_name: row.ward_name,
          is_active: value,
        });

        fetchVehicles();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  const actionTemplate = (row: Vehicles) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(resolveId(row)))}
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
      {/* <button
        onClick={() => handleDelete(resolveId(row))}
        className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button> */}
    </div>
  );

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder={t("admin.vehicle_creation.search_placeholder")}
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-3">
     

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              {t("admin.vehicle_creation.title")}
            </h1>
            <p className="text-gray-500 text-sm">
              {t("admin.vehicle_creation.subtitle")}
            </p>
          </div>

          <Button
            label={t("admin.vehicle_creation.add")}
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={vehicles}
          dataKey="unique_id"
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={["vehicle_no", "driver_name", "vehicle_type_name"]}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage={t("admin.vehicle_creation.empty_message")}
        >
          <Column
            header={t("common.s_no")}
            body={(_, { rowIndex }) => rowIndex + 1}
            style={{ width: "80px" }}
          />

          <Column
            field="vehicle_no"
            header={t("admin.vehicle_creation.vehicle_no")}
            sortable
          />
          <Column
            field="driver_name"
            header={t("admin.vehicle_creation.driver_name")}
            sortable
          />
          <Column
            field="driver_no"
            header={t("admin.vehicle_creation.driver_no")}
            sortable
          />
          <Column
            field="vehicle_type_name"
            header={t("admin.vehicle_creation.vehicle_type")}
            sortable
          />
          <Column
            field="fuel_type_name"
            header={t("admin.vehicle_creation.fuel_type")}
            sortable
          />
          <Column
            field="capacity"
            header={t("admin.vehicle_creation.capacity")}
            sortable
          />
          <Column
            field="fuel_efficiency"
            header={t("admin.vehicle_creation.fuel_efficiency")}
            sortable
          />
          <Column
            field="last_maintenance"
            header={t("admin.vehicle_creation.last_maintenance")}
            body={(row: Vehicles) =>
              row.last_maintenance ? String(row.last_maintenance).split("T")[0] : "-"
            }
            sortable
          />
          <Column field="zone_name" header={t("common.zone")} sortable />
          <Column field="ward_name" header={t("common.ward")} sortable />

          <Column
            field="is_active"
            header={t("common.status")}
            body={statusTemplate}
            style={{ width: "150px" }}
          />

          <Column
            header={t("common.actions")}
            body={actionTemplate}
            style={{ width: "150px" }}
          />
        </DataTable>

    </div>
  );
}
