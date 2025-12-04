import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {desktopApi}from "@/api";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { Switch } from "@/components/ui/switch";

type PermissionSet = {
  add: boolean;
  all: boolean;
  update: boolean;
  list: boolean;
  delete: boolean;
  view: boolean;
  print: boolean;
};

type UserScreen = {
  id: number;
  unique_id: string;
  screen_name: string;
  folder_name: string;
  order_no: number;
  icon: string;
  description: string;
  is_active: boolean;
  is_delete: boolean;
  mainscreen_name?: string;
  permissions: PermissionSet;
};

export default function UserScreenList() {
  const [screens, setScreens] = useState<UserScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    screen_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const location = useLocation();

  const { encAdmins, encUserScreen } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserScreen}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encAdmins}/${encUserScreen}/${id}/edit`;

  /* -----------------------------------------
     Load data
  ----------------------------------------- */
  const fetchScreens = async () => {
    try {
      const res = await desktopApi.get("userscreens/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];

      setScreens(data.filter((s: UserScreen) => !s.is_delete));
    } catch (error) {
      Swal.fire("Error", "Failed to load screens.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreens();
  }, [location.state?.refreshed]);

  /* -----------------------------------------
     Delete screen
  ----------------------------------------- */
  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the screen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      await desktopApi.delete(`userscreens/${id}/`);
      setScreens((prev) => prev.filter((s) => s.id !== id));
      Swal.fire("Deleted!", "Screen deleted successfully", "success");
    } catch {
      Swal.fire("Error", "Delete failed.", "error");
    }
  };

  /* -----------------------------------------
     Search Filter
  ----------------------------------------- */
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated["global"].value = value;
    setFilters(updated);
    setGlobalFilterValue(value);
  };

  /* -----------------------------------------
     TOGGLE STATUS (NEW)
  ----------------------------------------- */
  const statusTemplate = (row: UserScreen) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.put(`userscreens/${row.id}/`, { is_active: value });
        fetchScreens();
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

  /* -----------------------------------------
     Actions (Edit / Delete)
  ----------------------------------------- */
  const actionTemplate = (row: UserScreen) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: UserScreen, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search screens..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  if (loading) return <div className="p-6">Loading screens…</div>;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Screens</h1>
            <p className="text-gray-500 text-sm">Manage your user screen records</p>
          </div>

          <Button
            label="Add Screen"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={screens}
          paginator
          rows={10}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={[
            "screen_name",
            "folder_name",
            "mainscreen_name",
          ]}
          header={header}
          emptyMessage="No screens found."
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="screen_name"
            header="Screen Name"
            sortable
            style={{ minWidth: "180px" }}
          />

          <Column field="folder_name" header="Folder" sortable style={{ minWidth: "140px" }} />

          <Column field="order_no" header="Order" sortable style={{ width: "100px" }} />

          <Column
            field="mainscreen_name"
            header="Main Screen"
            sortable
            body={(row: UserScreen) => row.mainscreen_name || "-"}
            style={{ minWidth: "170px" }}
          />

          {/* STATUS TOGGLE */}
          <Column
            field="is_active"
            header="Status"
            body={statusTemplate}
            style={{ width: "150px" }}
          />

          {/* ACTIONS */}
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
