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
import { Switch } from "@/components/ui/switch";

type State = {
  id: number;
  name: string;
  country_name: string;
  label: string;
  is_active: boolean;
};

export default function StateList() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encStates = encryptSegment("states");

  const ENC_NEW_PATH = `/${encMasters}/${encStates}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encMasters}/${encStates}/${id}/edit`;

  const fetchStates = async () => {
    try {
      const res = await desktopApi.get("states/");
      setStates(res.data);
    } catch (err) {
      console.error("Failed loading states:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This state will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    await desktopApi.delete(`states/${id}/`);
    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });
    fetchStates();
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
  const statusTemplate = (row: State) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.patch(`states/${row.id}/`, { is_active: value });
        fetchStates();
      } catch (err) {
        console.error("Status update failed:", err);
      }
    };

    return (
      <Switch checked={row.is_active} onCheckedChange={updateStatus} />
    );
  };

  const actionTemplate = (row: State) => (
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

  const indexTemplate = (_: State, { rowIndex }: any) => rowIndex + 1;

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
            body={(row: State) => cap(row.country_name)}
            sortable
            style={{ minWidth: "150px" }}
          />

          <Column
            field="name"
            header="State"
            body={(row: State) => cap(row.name)}
            sortable
            style={{ minWidth: "150px" }}
          />

          <Column
            field="label"
            header="Label"
            body={(row: State) => row.label.toUpperCase()}
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
