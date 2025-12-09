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
import { adminApi } from "@/helpers/admin";

/* ------------------------------
    TYPES
------------------------------ */
type MainScreen = {
  unique_id: string;
  mainscreentype_name: string;
  mainscreen_name: string;
  icon_name: string;
  order_no: number;
  description: string;
  is_active: boolean;
  is_deleted: boolean;
  mainscreentype_id: string;
};

export default function MainScreenList() {
  const [records, setRecords] = useState<MainScreen[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const navigate = useNavigate();
  const { encAdmins, encMainScreen } = getEncryptedRoute();

  const mainScreenApi = adminApi.mainscreens;

  const ENC_NEW_PATH = `/${encAdmins}/${encMainScreen}/new`;
  const ENC_EDIT_PATH = (id: string) => `/${encAdmins}/${encMainScreen}/${id}/edit`;

  /* ------------------------------
      Extract data uniformly
  ------------------------------ */
  const extractData = (response: any) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return response?.data?.results ?? [];
  };

  /* ------------------------------
      FETCH
  ------------------------------ */
  const fetchData = async () => {
    try {
      const res = await mainScreenApi.list();
      setRecords(extractData(res));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ------------------------------
      DELETE
  ------------------------------ */
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This main screen will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!"
    });

    if (!confirm.isConfirmed) return;

    await mainScreenApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      showConfirmButton: false,
      timer: 1200,
    });

    fetchData();
  };

  /* ------------------------------
      STATUS SWITCH
  ------------------------------ */
  const statusTemplate = (row: MainScreen) => {
    const updateStatus = async (value: boolean) => {
      await mainScreenApi.update(row.unique_id, {
        mainscreen_name: row.mainscreen_name,
        mainscreentype_id: row.mainscreentype_id,
        icon_name: row.icon_name,
        order_no: row.order_no,
        description: row.description,
        is_active: value,
      });

      fetchData();
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  /* ------------------------------
      ACTION BUTTONS
  ------------------------------ */
  const actionTemplate = (row: MainScreen) => (
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

  /* ------------------------------
      Search
  ------------------------------ */
  const onGlobalFilterChange = (e: any) => {
    const val = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = val;

    setFilters(_filters);
    setGlobalFilterValue(val);
  };

  /* ------------------------------
      Table Header
  ------------------------------ */
  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full ">
      <div className="bg-white rounded-lg shadow-lg p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Main Screens</h1>
            <p className="text-gray-500 text-sm">Manage main screen configurations</p>
          </div>

          <Button
            label="Add Main Screen"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={records}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={[
            "mainscreen_name",
            "mainscreentype_name",
            "icon_name",
            "description"
          ]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No records found"
          className="p-datatable-sm"
        >
          <Column header="S.No" body={(_, { rowIndex }) => rowIndex + 1} style={{ width: 80 }} />

          <Column field="mainscreen_name" header="MainScreen Name" sortable />
          <Column field="mainscreentype_name" header="Type" sortable />
          <Column field="icon_name" header="Icon" sortable />
          <Column field="order_no" header="Order No" sortable />
          <Column field="description" header="Description" sortable />

          <Column header="Status" body={statusTemplate} style={{ width: 120 }} />

          <Column header="Actions" body={actionTemplate} style={{ width: 150 }} />
        </DataTable>

      </div>
    </div>
  );
}
