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
  mainScreenTypeApi
} from "@/helpers/admin";

import type { MainScreenType } from "../types/admin.types"; 


export default function MainScreenTypeList() {
  const [mainScreenTypes, setMainScreenTypes] = useState<MainScreenType[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  const navigate = useNavigate();
  const { encAdmins, encMainScreenType } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encMainScreenType}/new`;
  const ENC_EDIT_PATH = (unique_id: string) => `/${encAdmins}/${encMainScreenType}/${unique_id}/edit`;

  const extractData = (response: any) => {
    if (Array.isArray(response)) return response;                 // plain array
    if (Array.isArray(response?.data)) return response.data;      // axios .data
    return response?.data?.results ?? [];                         // DRF pagination
  };

  const fetchMainScreenTypes = async () => {
    try {
      const res = await mainScreenTypeApi.list();
      setMainScreenTypes(extractData(res));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMainScreenTypes();
  }, []);

  console.log(mainScreenTypes);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This userType will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await mainScreenTypeApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchMainScreenTypes();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: MainScreenType, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: MainScreenType) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>

      {/* <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button> */}
    </div>
  );

  const statusTemplate = (row: MainScreenType) => {
    const updateStatus = async (value: boolean) => {
      await mainScreenTypeApi.update(row.unique_id, {
        type_name: row.type_name,
        is_active: value,
      });


      fetchMainScreenTypes();
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search user types..."
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
            <h1 className="text-3xl font-bold text-gray-800 mb-1">MainScreen Types</h1>
            <p className="text-gray-500 text-sm">Manage your mainscreen type records</p>
          </div>

          <Button
            label="Add Screen Type"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={mainScreenTypes}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={["type_name"]}
          header={header}
          emptyMessage="No main screen types found."
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column field="type_name" header="MainScreen Type" sortable style={{ minWidth: "200px" }} />
          <Column header="Status" body={statusTemplate} style={{ width: "150px" }} />
          <Column header="Actions" body={actionTemplate} style={{ width: "150px" }} />
        </DataTable>
      </div>
    </div>
  );
}
