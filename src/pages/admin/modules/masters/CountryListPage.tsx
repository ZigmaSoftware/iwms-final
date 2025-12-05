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
import { Switch } from "@/components/ui/switch"; // 
import { adminApi } from "@/helpers/admin";

type CountryRecord = {
  unique_id: string;
  name: string;
  continent_name: string;
  mob_code: string;
  currency: string;
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

const countryApi = adminApi.countries;

export default function CountryList() {
  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encCountries = encryptSegment("countries");

  const ENC_NEW_PATH = `/${encMasters}/${encCountries}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encMasters}/${encCountries}/${unique_id}/edit`;


  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await countryApi.list()) as CountryRecord[];
      setCountries(data);
    } catch (error) {
      console.error("Failed loading countries:", error);
      Swal.fire({
        icon: "error",
        title: "Unable to load countries",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCountries();
  }, [fetchCountries]);

  // Delete Record
  const handleDelete = async (unique_id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This country will be permanently deleted!",
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
      await countryApi.remove(unique_id);
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      void fetchCountries();
    } catch (error) {
      console.error("Failed deleting country:", error);
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    }
  };

  // Search Bar
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
          placeholder="Search Countries..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const header = renderHeader();

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // Toggle logic (PATCH only)
  const statusTemplate = (row: CountryRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await countryApi.update(row.unique_id, { is_active: value });
        void fetchCountries();
      } catch (error) {
        console.error("Status update failed:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to update status",
          text: extractErrorMessage(error),
        });
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  // Actions
  const actionTemplate = (c: CountryRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        title="Edit"
        onClick={() => navigate(ENC_EDIT_PATH(c.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        onClick={() => handleDelete(c.unique_id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  // S.No
  const indexTemplate = (_: CountryRecord, { rowIndex }: any) => rowIndex + 1;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Countries</h1>
            <p className="text-gray-500 text-sm">Manage country records</p>
          </div>

          <Button
            label="Add Country"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        {/* Data Table */}
        <DataTable
          value={countries}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No countries found."
          globalFilterFields={["name", "continent_name", "currency", "mob_code"]}
          className="p-datatable-sm"
        >
          <Column
            header="S.No"
            body={indexTemplate}
            style={{ width: "80px" }}
          />

          <Column
            field="continent_name"
            header="Continent"
            sortable
            body={(row: CountryRecord) => cap(row.continent_name)}
            style={{ minWidth: "150px" }}
          />

          <Column
            field="name"
            header="Country"
            sortable
            body={(row: CountryRecord) => cap(row.name)}
            style={{ minWidth: "150px" }}
          />

          <Column
            field="currency"
            header="Currency"
            sortable
            style={{ minWidth: "130px" }}
          />

          <Column
            field="mob_code"
            header="Mobile Code"
            sortable
            style={{ minWidth: "130px" }}
          />

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
