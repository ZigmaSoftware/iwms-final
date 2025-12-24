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
import { countryApi } from "@/helpers/admin";

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

  const handleDelete = async (unique_id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This country will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

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

  const header = (
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

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: CountryRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await countryApi.update(row.unique_id, { is_active: value });
        void fetchCountries();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to update status",
          text: extractErrorMessage(error),
        });
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (c: CountryRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(c.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      {/* <button
        onClick={() => handleDelete(c.unique_id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button> */}
    </div>
  );

  const indexTemplate = (_: CountryRecord, { rowIndex }: any) => rowIndex + 1;

  return (
    <div className="p-3">
      
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

        <DataTable
          value={countries}
          dataKey="unique_id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          filters={filters}
          header={header}
          globalFilterFields={[
            "name",
            "continent_name",
            "currency",
            "mob_code",
          ]}
          stripedRows
          showGridlines
          emptyMessage="No countries found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column
            field="continent_name"
            header="Continent"
            sortable
            body={(r) => cap(r.continent_name)}
          />
          <Column
            field="name"
            header="Country"
            sortable
            body={(r) => cap(r.name)}
          />
          <Column field="currency" header="Currency" sortable />
          <Column field="mob_code" header="Mobile Code" sortable />
          <Column header="Status" body={statusTemplate} />
          <Column header="Actions" body={actionTemplate} />
        </DataTable>
     
    </div>
  );
}
