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
import { Switch } from "@/components/ui/switch";   // Toggle component
import { adminApi } from "@/helpers/admin";

type Ward = {
  unique_id: string;
  name: string;
  is_active: boolean;
  zone_name: string;
  city_name: string;
  district_name: string;
  state_name: string;
  country_name: string;
};

type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const extractErrorMessage = (error: unknown) => {
  if (!error) {
    return "Something went wrong while processing the request.";
  }

  if (typeof error === "string") {
    return error;
  }

  const withResponse = error as ErrorWithResponse;
  const data = withResponse.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.join(", ");
  }

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${String(value)}`;
      })
      .join("\n");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while processing the request.";
};

const wardApi = adminApi.wards;

export default function WardList() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encWards = encryptSegment("wards");

  const ENC_NEW_PATH = `/${encMasters}/${encWards}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encWards}/${id}/edit`;

  const fetchWards = async () => {
    try {
      const res = await desktopApi.get("wards/");
      setWards(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This ward will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    await desktopApi.delete(`wards/${id}/`);
    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchWards();
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
          <i className="pi pi-search text-gray-500" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search Wards..."
            className="p-inputtext-sm !border-0 !shadow-none !outline-none"
          />
        </div>
      </div>
    );
  };

  const header = renderHeader();

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // Toggle Status (PATCH)
  const statusTemplate = (row: Ward) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.put(`wards/${row.unique_id}/`, { is_active: value });
        fetchWards();
      } catch (err) {
        console.error("Status update failed:", err);
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  const actionTemplate = (row: Ward) => (
    <div className="flex gap-3 justify-center">
      <button
        title="Edit"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        onClick={() => handleDelete(row.unique_id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: Ward, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Wards</h1>
            <p className="text-gray-500 text-sm">Manage ward records</p>
          </div>

          <Button
            label="Add Ward"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        {/* Table */}
        <DataTable
          value={wards}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No wards found."
          globalFilterFields={[
            "name",
            "zone_name",
            "city_name",
            "district_name",
            "state_name",
            "country_name",
          ]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="zone_name"
            header="Zone"
            sortable
            body={(row: Ward) => cap(row.zone_name)}
          />

          <Column
            field="city_name"
            header="City"
            sortable
            body={(row: Ward) => cap(row.city_name)}
          />

          <Column
            field="name"
            header="Ward"
            sortable
            body={(row: Ward) => cap(row.name)}
          />

          {/* 🔥 ***TOGGLE REPLACED TAG*** */}
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
