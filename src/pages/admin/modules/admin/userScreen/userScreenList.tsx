import { useEffect, useState } from "react";
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
import { getEncryptedRoute } from "@/utils/routeCache";
import { Switch } from "@/components/ui/switch";
import {
  userScreenApi
} from "@/helpers/admin";

type UserScreen = {
  unique_id: string;
  mainscreen_name: string;
  userscreen_name: string;
  folder_name: string;
  icon_name: string;
  order_no: number;
  is_active: boolean;
  mainscreen_id: string;
};

export default function UserScreenList() {
  const [screens, setScreens] = useState<UserScreen[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    userscreen_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encAdmins, encUserScreen } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserScreen}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encAdmins}/${encUserScreen}/${id}/edit`;

  const extractData = (response: any) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return response?.data?.results ?? [];
  };

  const fetchScreens = async () => {
    try {
      const res = await userScreenApi.list();
      setScreens(extractData(res));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This screen will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await userScreenApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchScreens();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters.global.value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: UserScreen, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const statusTemplate = (row: UserScreen) => {
    const updateStatus = async (value: boolean) => {
      await userScreenApi.update(row.unique_id, {
        userscreen_name: row.userscreen_name,
        folder_name: row.folder_name,
        icon_name: row.icon_name,
        order_no: row.order_no,
        mainscreen_id: row.mainscreen_id,
        is_active: value,
      });

      fetchScreens();
    };

    return (
      <Switch checked={row.is_active} onCheckedChange={updateStatus} />
    );
  };

  const actionTemplate = (row: UserScreen) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

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

  return (
    <div className="px-3 py-3 w-full">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              User Screens
            </h1>
            <p className="text-gray-500 text-sm">
              Manage application screens
            </p>
          </div>

          <Button
            label="Add User Screen"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={screens}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={[
            "userscreen_name",
            "mainscreen_name",
            "folder_name",
          ]}
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          showGridlines
          className="p-datatable-sm"
          header={header}
          emptyMessage="No screens found."
        >
          <Column
            header="S.No"
            body={indexTemplate}
            style={{ width: "70px" }}
          />
          <Column
            field="mainscreen_name"
            header="MainScreen"
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="userscreen_name"
            header="UserScreen"
            sortable
            style={{ minWidth: "150px" }}
          />
          <Column
            field="folder_name"
            header="Folder"
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="icon_name"
            header="Icon"
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="order_no"
            header="Order"
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header="Status"
            body={statusTemplate}
            style={{ width: "120px" }}
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
