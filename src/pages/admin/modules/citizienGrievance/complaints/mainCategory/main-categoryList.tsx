import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { mobileApi } from "@/api";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { Switch } from "@/components/ui/switch";
import { getEncryptedRoute } from "@/utils/routeCache";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

type MainCategory = {
  unique_id: string;
  main_categoryName: string;
  is_active: boolean;
};

export default function MainComplaintCategoryList() {
  const [records, setRecords] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();
  const { encCitizenGrivence, encMainComplaintCategory } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encCitizenGrivence}/${encMainComplaintCategory}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encCitizenGrivence}/${encMainComplaintCategory}/${id}/edit`;

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    main_categoryName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const fetchData = async () => {
    try {
      const res = await mobileApi.get("main-category/");
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This category will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    await mobileApi.delete(`main-category/${id}/`);
    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });
    fetchData();
  };

  const statusTemplate = (row: MainCategory) => {
    const updateStatus = async (value: boolean) => {
      await mobileApi.patch(`main-category/${row.unique_id}/`, {
        is_active: value,
      });
      fetchData();
    };
    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: MainCategory) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        onClick={() => handleDelete(row.unique_id)}
        className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
        title="Delete"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_row: any, { rowIndex }: any) => rowIndex + 1;

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
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* TITLE ROW */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Main Categories
            </h1>
            <p className="text-gray-500 text-sm">
              Manage all customer complaint categories
            </p>
          </div>

          <Button
            label="Add New"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        {/* TABLE */}
        <DataTable
          value={records}
          dataKey="unique_id"
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={["main_categoryName"]}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No records found."
          className="p-datatable-sm"
        >
          <Column
            header="S.No"
            body={indexTemplate}
            style={{ width: "80px" }}
          />

          <Column
            field="main_categoryName"
            header="Main Category"
            sortable
          />

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
