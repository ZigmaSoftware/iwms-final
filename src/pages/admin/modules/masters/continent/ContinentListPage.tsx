import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { useNavigate } from "react-router-dom";
import {desktopApi} from "@/api";
import Swal from "sweetalert2";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";

type Continent = {
  id: number;
  name: string;
  is_active: boolean;
};

type TableFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
  name: { value: string | null; matchMode: FilterMatchMode };
};

const encMasters = encryptSegment("masters");
const encContinents = encryptSegment("continents");

const ENC_NEW_PATH = `/${encMasters}/${encContinents}/new`;
const ENC_EDIT_PATH = (id: number) =>
  `/${encMasters}/${encContinents}/${id}/edit`;

export default function ContinentList() {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<TableFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();

  const fetchContinents = async () => {
    try {
      const res = await desktopApi.get("continents/");
      setContinents(res.data);
    } catch (error) {
      console.error("Failed to fetch continents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContinents();
  }, []);

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This continent will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      await desktopApi.delete(`continents/${id}/`);
      Swal.fire("Deleted!", "Record removed successfully", "success");
      fetchContinents();
    } catch (error) {
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  const onGlobalFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updated = { ...filters };
    updated.global.value = e.target.value;
    setFilters(updated);
    setGlobalFilterValue(e.target.value);
  };

  /**
   * 🔥 Toggle switch replacing Tag
   * Uses FormData PATCH => No 415 Unsupported Media Type
   */
  const statusBodyTemplate = (row: Continent) => {
    const updateStatus = async (checked: boolean) => {
      try {
        const formData = new FormData();
        formData.append("is_active", String(checked));

        await desktopApi.patch(`continents/${row.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        fetchContinents();
      } catch (err) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  const actionBodyTemplate = (row: Continent) => (
    <div className="flex gap-2 justify-center">
      <Button
        icon="pi pi-pencil"
        rounded
        outlined
        severity="info"
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        onClick={() => handleDelete(row.id)}
      />
    </div>
  );

  const indexTemplate = (_: any, options: any) => options.rowIndex + 1;

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search continents..."
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-3">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Continents</h1>
            <p className="text-gray-500 text-sm">
              Manage continent records
            </p>
          </div>

          <Button
            label="Add Continent"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={continents}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          filters={filters}
          globalFilterFields={["name"]}
          header={header}
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column
            header="S.No"
            body={indexTemplate}
            style={{ width: "80px" }}
          />

          <Column
            field="name"
            header="Continent Name"
            sortable
            style={{ minWidth: "200px" }}
          />

          {/* 🔥 Toggle Switch Column */}
          <Column
            header="Status"
            body={statusBodyTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />

          <Column
            header="Actions"
            body={actionBodyTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
      </div>
    </div>
  );
}
