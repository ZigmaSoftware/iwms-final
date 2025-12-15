import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { encryptSegment } from "@/utils/routeCrypto";
import { Switch } from "@/components/ui/switch";
import { districtApi } from "@/helpers/admin";

type DistrictRecord = {
  unique_id: string;
  countryName: string;
  stateName: string;
  name: string;
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

export default function DistrictListPage() {
  const [districts, setDistricts] = useState<DistrictRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encDistricts = encryptSegment("districts");

  const ENC_NEW_PATH = `/${encMasters}/${encDistricts}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encDistricts}/${id}/edit`;

  const fetchDistricts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await districtApi.list();
      const data = res as any[];

      const mapped: DistrictRecord[] = data.map((d: any) => ({
        unique_id: d.unique_id,
        countryName: d.country_name,
        stateName: d.state_name,
        name: d.name,
        is_active: d.is_active,
      }));

      mapped.sort((a, b) => a.name.localeCompare(b.name));
      setDistricts(mapped);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load districts",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This district will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    await districtApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchDistricts();
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev: any) => ({
      ...prev,
      global: { ...prev.global, value },
    }));
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Districts..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: DistrictRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await districtApi.update(row.unique_id, { is_active: value });
        fetchDistricts();
      } catch (e) {
        console.error("Toggle update failed:", e);
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: DistrictRecord) => (
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

  const indexTemplate = (_: DistrictRecord, { rowIndex }: any) => rowIndex + 1;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Districts</h1>
            <p className="text-gray-500 text-sm">Manage district records</p>
          </div>

          <Button
            label="Add District"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={districts}
          dataKey="unique_id"
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          header={renderHeader()}
          stripedRows
          showGridlines
          emptyMessage="No districts found."
          globalFilterFields={["name", "countryName", "stateName"]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column
            field="countryName"
            header="Country"
            body={(row) => cap(row.countryName)}
            sortable
          />
          <Column
            field="stateName"
            header="State"
            body={(row) => cap(row.stateName)}
            sortable
          />
          <Column
            field="name"
            header="District"
            body={(row) => cap(row.name)}
            sortable
          />
          <Column header="Status" body={statusTemplate} />
          <Column header="Actions" body={actionTemplate} />
        </DataTable>
      </div>
    </div>
  );
}
