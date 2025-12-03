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
import { getEncryptedRoute } from "@/utils/routeCache";
import { Switch } from "@/components/ui/switch";

type UserType = {
  id: number;
  unique_id: string;
  name: string;
  is_active: boolean;
};

export default function UserTypePage() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  const navigate = useNavigate();
  const { encAdmins, encUserType } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserType}/new`;
  const ENC_EDIT_PATH = (id: number) => `/${encAdmins}/${encUserType}/${id}/edit`;

  const fetchUserTypes = async () => {
    try {
      const res = await desktopApi.get("user-type/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUserTypes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const handleDelete = async (id: number) => {
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

    await desktopApi.delete(`user-type/${id}/`);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchUserTypes();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: UserType, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: UserType) => (
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

  const statusTemplate = (row: UserType) => {
    const updateStatus = async (value: boolean) => {
      await desktopApi.patch(`user-type/${row.id}/`, { is_active: value });
      fetchUserTypes();
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
            <h1 className="text-3xl font-bold text-gray-800 mb-1">User Types</h1>
            <p className="text-gray-500 text-sm">Manage your user type records</p>
          </div>

          <Button
            label="Add User Type"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={userTypes}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={["name"]}
          header={header}
          emptyMessage="No user types found."
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column field="name" header="User Type" sortable style={{ minWidth: "200px" }} />
          <Column header="Status" body={statusTemplate} style={{ width: "150px" }} />
          <Column header="Actions" body={actionTemplate} style={{ width: "150px" }} />
        </DataTable>
      </div>
    </div>
  );
}
