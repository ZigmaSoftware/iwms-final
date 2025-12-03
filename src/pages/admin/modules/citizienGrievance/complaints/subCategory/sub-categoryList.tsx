import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { mobileAPI } from "@/api";

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

export default function SubComplaintCategoryList() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  const navigate = useNavigate();
  const { encCitizenGrivence, encSubComplaintCategory } = getEncryptedRoute();

  const NEW_PATH = `/${encCitizenGrivence}/${encSubComplaintCategory}/new`;
  const EDIT_PATH = (id: number) =>
    `/${encCitizenGrivence}/${encSubComplaintCategory}/${id}/edit`;

  const fetchData = async () => {
    try {
      const res = await mobileAPI.get("sub-category/");
      setRecords(res.data.data);
    } catch (err) {
      console.error("Error loading sub categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmation = await Swal.fire({
      title: "Confirm Deletion",
      text: "This record will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33"
    });

    if (!confirmation.isConfirmed) return;

    await mobileAPI.delete(`sub-category/${id}/`);

    Swal.fire({
      icon: "success",
      title: "Deleted Successfully",
      timer: 1500,
      showConfirmButton: false
    });

    fetchData();
  };

  const statusTemplate = (row: any) => {
    const updateStatus = async (value: boolean) => {
      await mobileAPI.patch(`sub-category/${row.id}/`, { is_active: value });
      fetchData();
    };
    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: any) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(EDIT_PATH(row.id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5 fill-gray-600" />
      </button>

      <button
        onClick={() => handleDelete(row.id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5 fill-gray-600" />
      </button>
    </div>
  );

  const indexTemplate = (_: any, { rowIndex }: any) => rowIndex + 1;

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters({
      ...filters,
      global: { value, matchMode: FilterMatchMode.CONTAINS }
    });
  };

  const header = (
    <div className="flex justify-between items-center">
      <div className="flex justify-end w-full">
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
    </div>
  );

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">

        {/* PAGE TITLE */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sub Categories</h1>
            <p className="text-gray-500 text-sm">
              Manage all sub complaint category records
            </p>
          </div>

          <Button
            label="Add New"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(NEW_PATH)}
          />
        </div>

        {/* DATA TABLE */}
        <DataTable
          value={records}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={["name", "mainCategory_name"]}
          header={header}
          rowsPerPageOptions={[5, 10, 25, 50]}
          stripedRows
          showGridlines
          emptyMessage="No records found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column field="name" header="Sub Category" sortable />
          <Column field="mainCategory_name" header="Main Category" sortable />
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
