import { useEffect, useState, useCallback } from "react";
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
import { adminApi } from "@/helpers/admin/registry";

type StateRecord = {
  unique_id: string;
  name: string;
  country_name: string;
  label: string;
  is_active: boolean;
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

const stateApi = adminApi.states;

export default function StateList() {
  const [states, setStates] = useState<StateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encStates = encryptSegment("states");

  const ENC_NEW_PATH = `/${encMasters}/${encStates}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encMasters}/${encStates}/${unique_id}/edit`;

  const fetchStates = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await stateApi.list()) as StateRecord[];
      setStates(data);
    } catch (error) {
      console.error("Failed loading states:", error);
      Swal.fire({
        icon: "error",
        title: "Unable to load states",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStates();
  }, [fetchStates]);

  const handleDelete = async (unique_id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This state will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      await stateApi.remove(unique_id);
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      void fetchStates();
    } catch (error) {
      console.error("Failed deleting state:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    }
  };

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
          placeholder="Search states..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  // Capitalize helper
  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // ⚡ Toggle handler (PATCH only)
  const statusTemplate = (row: StateRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await stateApi.update(row.unique_id, { is_active: value });
        void fetchStates();
      } catch (error) {
        console.error("Status update failed:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to update status",
          text: extractErrorMessage(error),
        });
      }
    };

    return (
      <Switch checked={row.is_active} onCheckedChange={updateStatus} />
    );
  };

  const actionTemplate = (row: StateRecord) => (
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

  const indexTemplate = (_: StateRecord, { rowIndex }: any) => rowIndex + 1;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">States</h1>
            <p className="text-gray-500 text-sm">Manage state records</p>
          </div>

          <Button
            label="Add State"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={states}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          header={renderHeader()}
          stripedRows
          showGridlines
          emptyMessage="No states found."
          globalFilterFields={["name", "country_name", "label"]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "70px" }} />

          <Column
            field="country_name"
            header="Country"
            body={(row: StateRecord) => cap(row.country_name)}
            sortable
            style={{ minWidth: "150px" }}
          />

          <Column
            field="name"
            header="State"
            body={(row: StateRecord) => cap(row.name)}
            sortable
            style={{ minWidth: "150px" }}
          />

          <Column
            field="label"
            header="Label"
            body={(row: StateRecord) => row.label.toUpperCase()}
            sortable
            style={{ minWidth: "150px" }}
          />

          {/* 🔥 Toggle */}
          <Column
            header="Status"
            body={statusTemplate}
            style={{ width: "150px" }}
          />

          {/* Actions */}
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
