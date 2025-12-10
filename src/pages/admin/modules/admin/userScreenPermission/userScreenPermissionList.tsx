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

/* -----------------------------------------------------------
   TYPES
----------------------------------------------------------- */
type PermissionScreen = {
  screen: string;
  action: string;
  order: number;
};

type StaffUserType = {
  unique_id: string;               // staffusertype_id
  name: string;                    // userscreen_name (first one)
  is_active: boolean;

  staffusertype_name?: string;
  usertype_id?: string | null;
  mainscreen_id?: string;

  screens?: PermissionScreen[];
};

type GroupedMap = Record<string, StaffUserType>;

const userScreenPermissionApi = adminApi.userscreenpermissions;

/* -----------------------------------------------------------
   COMPONENT
----------------------------------------------------------- */
export default function UserScreenPermissionList() {
  const [records, setRecords] = useState<StaffUserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    staffusertype_name: {
      value: null,
      matchMode: FilterMatchMode.STARTS_WITH,
    },
  });

  const navigate = useNavigate();
  const { encAdmins, encUserScreenPermission } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserScreenPermission}/new`;

  const ENC_EDIT_PATH = (staffTypeId: string) =>
    `/${encAdmins}/${encUserScreenPermission}/${staffTypeId}/edit`;

  /* -----------------------------------------------------------
     FETCH DATA
  ----------------------------------------------------------- */
  const fetchRecords = async () => {
    try {
      const res: unknown = await userScreenPermissionApi.list();

      let data: any[] = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (res && typeof res === "object" && Array.isArray((res as any).data)) {
        data = (res as any).data;
      }

      console.log("Normalized API Data:", data);

      // Group by staffusertype_id
      const groupedObj: GroupedMap = data.reduce((acc, item) => {
        const uid = item.staffusertype_id;

        if (!acc[uid]) {
          acc[uid] = {
            unique_id: uid,
            name: item.userscreen_name,
            staffusertype_name: item.staffusertype_name ?? "Unknown",
            mainscreen_id: item.mainscreen_id,
            is_active: item.is_active,
            screens: [],
          };
        }

        acc[uid].screens!.push({
          screen: item.userscreen_name,
          action: item.userscreenaction_name,
          order: item.order_no,
        });

        return acc;
      }, {} as GroupedMap);

      const groupedList = Object.values(groupedObj);

      setRecords(groupedList);
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

  const handleDelete = async (staffTypeId: string) => {
  const confirmDelete = await Swal.fire({
    title: "Are you sure?",
    text: "All permissions for this staff user type will be deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
  });

  if (!confirmDelete.isConfirmed) return;

  try {
    // 🔥 Direct delete using backend new endpoint
    await userScreenPermissionApi.remove(
      `delete-by-staffusertype/${staffTypeId}`
    );

    Swal.fire("Deleted!", "All permissions removed for this staff type.", "success");

    fetchRecords();

  } catch (error) {
    console.error("DELETE ERROR:", error);
    Swal.fire("Error", "Failed to delete permissions", "error");
  }
};


  // /* -----------------------------------------------------------
  //    STATUS SWITCH
  // ----------------------------------------------------------- */
  // const statusTemplate = (row: StaffUserType) => {
  //   const updateStatus = async (value: boolean) => {
  //     try {
  //       await desktopApi.put(`staffusertypes/${row.unique_id}/`, {
  //         is_active: value,
  //         name: row.name,
  //         usertype_id: row.usertype_id,
  //       });
  //       fetchRecords();
  //     } catch {
  //       Swal.fire("Error", "Failed to update status", "error");
  //     }
  //   };

  //   return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  // };

  /* -----------------------------------------------------------
     ACTION BUTTONS
  ----------------------------------------------------------- */
  const actionTemplate = (row: StaffUserType) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() =>
          navigate(ENC_EDIT_PATH(row.unique_id))
        }
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

  /* -----------------------------------------------------------
     GLOBAL SEARCH
  ----------------------------------------------------------- */
  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated["global"].value = value;
    setFilters(updated);
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

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */
  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              User Screen Permissions for Staff
            </h1>
            <p className="text-gray-500 text-sm">
              Manage screen-level permissions for staff types
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
          value={records}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={["staffusertype_name"]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No records found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: 80 }} />
          <Column
            field="staffusertype_name"
            header="Staff User Type"
            sortable
          />
          {/* <Column header="Status" body={statusTemplate} style={{ width: 120 }} /> */}
          <Column header="Actions" body={actionTemplate} style={{ width: 150 }} />
        </DataTable>
      </div>
    </div>
  );
}
