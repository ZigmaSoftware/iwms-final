import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {desktopApi} from "@/api";
import { PencilIcon, TrashBinIcon } from "@/icons";
import Swal from "sweetalert2";
import { getEncryptedRoute } from "@/utils/routeCache";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { Switch } from "@/components/ui/switch";

type MainUserScreen = {
  id: number;
  mainscreen: string;
  is_active: boolean;
};

export default function MainUserScreenList() {
  const [mainScreens, setMainScreens] = useState<MainUserScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  // FIX: Remove strict typing exactly like UserTypeList
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    mainscreen: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encAdmins, encMainUserScreen } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encMainUserScreen}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encAdmins}/${encMainUserScreen}/${id}/edit`;

  const fetchMainScreens = async () => {
    try {
      const res = await desktopApi.get("mainuserscreen/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setMainScreens(data);
    } catch (error) {
      console.error("Failed to fetch main user screens:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMainScreens();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This main user screen will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await desktopApi.delete(`mainuserscreen/${id}/`);
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchMainScreens();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  /* ------------------------------ FIXED FILTER HANDLER ------------------------------ */
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated["global"].value = value; // NOW WORKS (no TypeScript error)
    setFilters(updated);
    setGlobalFilterValue(value);
  };

  /* ----------------------------- TOGGLE STATUS LIKE USER TYPE ----------------------------- */
  const statusTemplate = (row: MainUserScreen) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.put(`mainuserscreen/${row.id}/`, { is_active: value });
        fetchMainScreens();
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

  const actionTemplate = (row: MainUserScreen) => (
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

  const indexTemplate = (_: MainUserScreen, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-lg border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search main screens..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  if (loading) return <div className="p-6">Loading main user screens...</div>;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Main User Screens</h1>
            <p className="text-gray-500 text-sm">Manage your main user screen records</p>
          </div>

          <Button
            label="Add Main Screen"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={mainScreens}
          paginator
          rows={10}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={["mainscreen"]}
          header={header}
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column field="mainscreen" header="Main Screen" sortable style={{ minWidth: "200px" }} />
          <Column header="Status" body={statusTemplate} style={{ width: "150px" }} />
          <Column header="Actions" body={actionTemplate} style={{ width: "150px" }} />
        </DataTable>

      </div>
    </div>
  );
}
