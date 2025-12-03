import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {desktopApi} from "@/api";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { Switch } from "@/components/ui/switch";

type PairRow = {
  id: string;
  user_type: number;
  user_type_name: string;
  main_screen: number;
  main_screen_name: string;
  total_screens: number;
  is_active: boolean;
  recordIds: string[];
};

export default function UserPer() {
  const [rows, setRows] = useState<PairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    user_type_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();

  const { encAdmins, encUserPermission } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserPermission}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encAdmins}/${encUserPermission}/${id}/edit`;

  /* ------------------------------------------------------------------
      Load grouped permissions
  ------------------------------------------------------------------ */
  const fetchSummary = async () => {
    try {
      const res = await desktopApi.get("userpermissions/");
      const activeRows = res.data.filter((r: any) => !r.is_delete);

      const grouped = new Map<
        string,
        {
          row: PairRow;
          recordIds: string[];
        }
      >();

      activeRows.forEach((item: any) => {
        const key = `${item.user_type}-${item.main_screen}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.row.total_screens += 1;
          existing.recordIds.push(String(item.id));
        } else {
          grouped.set(key, {
            row: {
              id: String(item.id),
              user_type: item.user_type,
              user_type_name: item.user_type_name,
              main_screen: item.main_screen,
              main_screen_name: item.main_screen_name,
              total_screens: 1,
              is_active: item.is_active,
              recordIds: [String(item.id)],
            },
            recordIds: [String(item.id)],
          });
        }
      });

      const uniqueRows = Array.from(grouped.values()).map(({ row, recordIds }) => ({
        ...row,
        recordIds,
      }));

      setRows(uniqueRows);
    } catch (error) {
      Swal.fire("Error", "Failed to load permissions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  /* ------------------------------------------------------------------
      Delete grouped permission pair
  ------------------------------------------------------------------ */
  const handleDeletePair = async (row: PairRow) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this permission?",
      text: "This will remove all permission records for this user type & main screen.",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      for (const recordId of row.recordIds) {
        await desktopApi.delete(`userpermissions/${recordId}/`);
      }
      Swal.fire("Success", "Deleted successfully!", "success");
      fetchSummary();
    } catch {
      Swal.fire("Error", "Failed to delete record.", "error");
    }
  };

  /* ------------------------------------------------------------------
      Search filter
  ------------------------------------------------------------------ */
  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated["global"].value = value;
    setFilters(updated);
    setGlobalFilterValue(value);
  };

  /* ------------------------------------------------------------------
      TOGGLE STATUS for grouped permissions
  ------------------------------------------------------------------ */
  const statusTemplate = (row: PairRow) => {
    const updateStatus = async (value: boolean) => {
      try {
        // Update ALL records under this grouping
        for (const recordId of row.recordIds) {
          await desktopApi.patch(`userpermissions/${recordId}/`, { is_active: value });
        }
        fetchSummary();
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  /* ------------------------------------------------------------------
      Action Buttons
  ------------------------------------------------------------------ */
  const actionTemplate = (row: PairRow) => (
    <div className="flex gap-2 justify-center">
      <button
        onClick={() =>
          navigate(ENC_EDIT_PATH(Number(row.id)), {
            state: {
              user_type: row.user_type,
              main_screen: row.main_screen,
            },
          })
        }
        className="text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        onClick={() => handleDeletePair(row)}
        className="text-red-600 hover:text-red-800"
        title="Delete"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  /* ------------------------------------------------------------------
      Index
  ------------------------------------------------------------------ */
  const indexTemplate = (_: PairRow, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  /* ------------------------------------------------------------------
      Header Search UI
  ------------------------------------------------------------------ */
  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search permissions..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* ------------------------------------------------------------------
      Render
  ------------------------------------------------------------------ */
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Permission List</h1>
            <p className="text-gray-500 text-sm">Manage permission groupings</p>
          </div>
          <Button
            label="Add New"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={rows}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          rowsPerPageOptions={[5, 10, 25, 50]}
          globalFilterFields={["user_type_name", "main_screen_name"]}
          header={header}
          emptyMessage="No user permissions found."
          stripedRows
          showGridlines
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="user_type_name"
            header="User Type"
            sortable
            style={{ minWidth: "200px" }}
          />

          <Column
            field="main_screen_name"
            header="Main Screen"
            sortable
            style={{ minWidth: "180px" }}
          />

          <Column
            field="total_screens"
            header="Screen Count"
            sortable
            style={{ width: "140px" }}
          />

          {/* NEW — TOGGLE STATUS */}
          <Column
            field="is_active"
            header="Status"
            body={statusTemplate}
            style={{ width: "150px" }}
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
