import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { Switch } from "@/components/ui/switch";
import { adminApi } from "@/helpers/admin";

type UserScreenPermission = {
  unique_id: string;

  userscreen_name: string;
  userscreenaction_name: string;
  userscreenaction_id: string;

  usertype_id: string | null;
  staffusertype_id: string | null;

  mainscreen_id: string;
  userscreen_id: string;

  order_no: number;
  description: string;
  is_active: boolean;
};

export default function UserScreenPermissionList() {
  const [permissions, setPermissions] = useState<UserScreenPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const { encAdmins, encUserScreenPermission } = getEncryptedRoute();
  const navigate = useNavigate();
  const permissionApi = adminApi.userscreenpermissions;

  const ENC_NEW_PATH = `/${encAdmins}/${encUserScreenPermission}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encAdmins}/${encUserScreenPermission}/${id}/edit`;

  const extractData = (res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return res?.data?.results ?? [];
  };

  const fetchPermissions = async () => {
    try {
      const res = await permissionApi.list();
      setPermissions(extractData(res));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This permission will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!"
    });

    if (!confirm.isConfirmed) return;

    await permissionApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1400,
      showConfirmButton: false
    });

    fetchPermissions();
  };

  const statusTemplate = (row: UserScreenPermission) => {
    const updateStatus = async (value: boolean) => {
      await permissionApi.update(row.unique_id, {
        usertype_id: row.usertype_id,
        staffusertype_id: row.staffusertype_id,
        mainscreen_id: row.mainscreen_id,
        userscreen_id: row.userscreen_id,
        userscreenaction_id: row.userscreenaction_id,
        order_no: row.order_no,
        description: row.description,
        is_active: value
      });

      fetchPermissions();
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: UserScreenPermission) => (
    <div className="flex gap-2 justify-center">
      <button
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: UserScreenPermission, { rowIndex }: any) =>
    rowIndex + 1;

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      global: { value, matchMode: FilterMatchMode.CONTAINS }
    });
    setGlobalFilterValue(value);
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border shadow-sm">
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
    <div className="px-3 py-3 w-full">
      <div className="bg-white rounded-lg shadow-lg p-6">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              User Screen Permissions
            </h1>
            <p className="text-gray-500 text-sm">
              Manage UserScreen permissions for user and staff roles
            </p>
          </div>

          <Button
            label="Add Permission"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={permissions}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={[
            "userscreen_name",
            "userscreenaction_name",
            "description"
          ]}
          header={header}
          emptyMessage="No permissions found."
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column field="userscreen_name" header="User Screen" sortable />
          <Column field="userscreenaction_name" header="Action" sortable />

          <Column field="usertype_id" header="UserType ID" sortable />
          <Column field="staffusertype_id" header="StaffUserType ID" sortable />

          <Column field="order_no" header="Order" sortable style={{ width: "120px" }} />

          <Column field="description" header="Description" sortable />

          <Column header="Status" body={statusTemplate} style={{ width: "150px" }} />
          <Column header="Actions" body={actionTemplate} style={{ width: "150px" }} />
        </DataTable>

      </div>
    </div>
  );
}
