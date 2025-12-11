import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/helpers/admin/registry";
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

type WasteCollection = {
  unique_id: string;
  customer: string;
  customer_id?: string | number;
  customer_unique_id?: string;
  customer_name: string;
  contact_no: string;
  building_no: string;
  zone_name: string;
  city_name: string;
  street: string;
  area: string;
  pincode: string;
  latitude: string;
  longitude: string;
  id_proof_type: string;
  id_no: string;
  qr_code: string;
  is_active_customer: boolean;
  wet_waste: number;
  dry_waste: number;
  mixed_waste: number;
  total_quantity: number;
  collection_date: string;
  collection_time: string;
  is_deleted: boolean;
  is_active: boolean;
};

export default function WasteCollectedDataList() {
  const [wasteCollectedDatas, setWasteCollectedDatas] =
    useState<WasteCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { encWasteManagementMaster, encWasteCollectedData } =
    getEncryptedRoute();

  const ENC_NEW_PATH = `/${encWasteManagementMaster}/${encWasteCollectedData}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encWasteManagementMaster}/${encWasteCollectedData}/${id}/edit`;

  const wasteApi = adminApi.wasteCollections;

  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const fetchWasteCollectedData = async () => {
    try {
      const res = await wasteApi.list();
      setWasteCollectedDatas(res as any);
    } catch (error) {
      console.error("Failed to fetch waste collected data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteCollectedData();
  }, []);

  // Delete Record
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This wastecollection will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      await wasteApi.remove(id);
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchWasteCollectedData();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error deleting record",
        text: "Something went wrong.",
      });
    }
  };

  // Search
  const onGlobalFilterChange = (e: any) => {
    const updated = { ...filters };
    updated.global.value = e.target.value;
    setFilters(updated);
    setGlobalFilterValue(e.target.value);
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search waste data..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: WasteCollection) => {
    const updateStatus = async (value: boolean) => {
      try {
        await wasteApi.update(row.unique_id, { is_active: value });
        fetchWasteCollectedData();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: WasteCollection) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="fill-gray-500 size-5" />
      </button>

      <button
        onClick={() => handleDelete(row.unique_id)}
        className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
        title="Delete"
      >
        <TrashBinIcon className="fill-gray-500 size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: WasteCollection, { rowIndex }: any) =>
    rowIndex + 1;

  if (loading) return <div className="p-6">Loading Waste Collected Data...</div>;

  return (
    <div className="">
      <div className="bg-white rounded-lg shadow-lg ">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Waste Collected Data
            </h1>
            <p className="text-gray-500 text-sm">
              Manage all waste collection records
            </p>
          </div>

          <Button
            label="Add New"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={wasteCollectedDatas}
          paginator
          rows={10}
          filters={filters}
          globalFilterFields={[
            "customer_name",
            "zone_name",
            "city_name",
            "collection_date",
          ]}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No waste collection records found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="customer"
            header="Customer ID"
            sortable
            body={(r: WasteCollection) =>
              r.customer ||
              (r.customer_unique_id ? String(r.customer_unique_id) : "") ||
              (r.customer_id ? String(r.customer_id) : "-")
            }
          />
          <Column
            field="customer_name"
            header="Customer Name"
            body={(r: WasteCollection) => cap(r.customer_name)}
            sortable
          />
          <Column field="collection_date" header="Collected Date" sortable />
          <Column field="dry_waste" header="Dry Waste" sortable />
          <Column field="wet_waste" header="Wet Waste" sortable />
          <Column field="total_quantity" header="Quantity" sortable />
          <Column
            field="zone_name"
            header="Zone"
            body={(r: WasteCollection) => cap(r.zone_name)}
            sortable
          />
          <Column
            field="city_name"
            header="City"
            body={(r: WasteCollection) => cap(r.city_name)}
            sortable
          />

          {/* 🔥 NEW Switch Toggle */}
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
