import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { desktopApi } from "@/api";
import { adminApi } from "@/helpers/admin";

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

type StaffUserType = {
  unique_id: string;
  name: string;
  is_active: boolean;
  usertype_name?: string;
  usertype_id?: string | null;
  screens?: any[];
};

const userScreenPermissionApi = adminApi.userscreenpermissions;

export default function UserScreenPermissionList() {
  const [records, setRecords] = useState<StaffUserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    usertype_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  const navigate = useNavigate();
  const { encAdmins, encUserScreenPermission } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserScreenPermission}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encAdmins}/${encUserScreenPermission}/${id}/edit`;

  /* -----------------------------------------------------------
     FETCH DATA — FIXED WITH SAFE NORMALIZATION
  ----------------------------------------------------------- */
  const fetchRecords = async () => {
    try {
      const res: unknown = await userScreenPermissionApi.list();

      // SAFELY normalize response into an array
      let data: any[] = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (
        res &&
        typeof res === "object" &&
        Array.isArray((res as any).data)
      ) {
        data = (res as any).data;
      } else {
        data = [];
      }

      console.log("Normalized API Data:", data);

      // Group by staff usertype
      const grouped = Object.values(
        data.reduce((acc: any, item: any) => {
          const uid = item.staffusertype_id;

          if (!acc[uid]) {
            acc[uid] = {
              unique_id: uid,
              usertype_name: item.usertype_name ?? "Unknown",
              name: item.userscreen_name,
              is_active: item.is_active,
              screens: []
            };
          }

          acc[uid].screens.push({
            screen: item.userscreen_name,
            action: item.userscreenaction_name,
            order: item.order_no
          });

          return acc;
        }, {})
      );

      setRecords(grouped);
    } catch (err) {
      console.error("Fetch failed:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  /* -----------------------------------------------------------
     DELETE RECORD
  ----------------------------------------------------------- */
  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This staff user type will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33"
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const record = await userScreenPermissionApi.get(unique_id);
      const data: any = (record as any)?.data ?? record;

      const staffTypeId =
        data?.staffusertype_id ?? data?.staffusertype?.unique_id ?? unique_id;
      const mainScreenId =
        data?.mainscreen_id ?? data?.mainscreen?.unique_id ?? null;
      const userTypeId = data?.usertype_id ?? data?.usertype?.unique_id ?? null;

      if (!staffTypeId || !mainScreenId || !userTypeId) {
        throw new Error("Missing permission identifiers");
      }

      await userScreenPermissionApi.action(`bulk-sync-multi/${staffTypeId}`, {
        usertype_id: userTypeId,
        staffusertype_id: staffTypeId,
        mainscreen_id: mainScreenId,
        screens: [],
        description: data?.description ?? ""
      });

      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false
      });

      fetchRecords();
    } catch (error: any) {
      console.error("Delete Error:", error.response?.data || error);
      Swal.fire("Error", "Failed to delete permissions", "error");
    }
  };

  /* -----------------------------------------------------------
     STATUS SWITCH
  ----------------------------------------------------------- */
  const statusTemplate = (row: StaffUserType) => {
    const updateStatus = async (value: boolean) => {
      const payload = {
        usertype_id: row.usertype_id,
        name: row.name,
        is_active: value
      };

      try {
        await desktopApi.put(`staffusertypes/${row.unique_id}/`, payload);
        fetchRecords();
      } catch (error: any) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  /* -----------------------------------------------------------
     ACTION BUTTONS
  ----------------------------------------------------------- */
  const actionTemplate = (row: StaffUserType) => (
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

  const indexTemplate = (_: StaffUserType, { rowIndex }: any) => rowIndex + 1;

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated["global"].value = value;
    setFilters(updated);
    setGlobalFilterValue(value);
  };

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
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              User Screen Permissions for Staff
            </h1>
            <p className="text-gray-500 text-sm">
              Manage staff user type records
            </p>
          </div>

          <Button
            label="Add Staff User Type"
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
          globalFilterFields={["name", "usertype_name"]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No staff user types found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: 80 }} />
          <Column field="usertype_name" header="User Type" sortable />
          <Column field="name" header="Staff User Type" sortable />
          <Column header="Status" body={statusTemplate} style={{ width: 120 }} />
          <Column header="Actions" body={actionTemplate} style={{ width: 150 }} />
        </DataTable>
      </div>
    </div>
  );
}
