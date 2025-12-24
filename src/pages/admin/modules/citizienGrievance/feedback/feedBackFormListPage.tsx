import { useCallback, useEffect, useState } from "react";
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
import { adminApi } from "@/helpers/admin/registry";

type feedback = {
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
  category: string;
  feedback_details: string;
  is_deleted: boolean;
  is_active: boolean;
};

const feedbackApi = adminApi.feedbacks;

export default function FeedBackFormList() {
  const [feedbacks, setFeedbacks] = useState<feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { encCitizenGrivence, encFeedback } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encCitizenGrivence}/${encFeedback}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encCitizenGrivence}/${encFeedback}/${id}/edit`;

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feedbackApi.list();
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to fetch feedbacks", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This feedback will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      await feedbackApi.remove(id);
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchFeedbacks();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error deleting record",
        text: "Something went wrong.",
      });
    }
  };

  const onGlobalFilterChange = (e: any) => {
    const updated = { ...filters };
    updated["global"].value = e.target.value;
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
          placeholder="Search feedback..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* -------------------- NEW STATUS TOGGLE -------------------- */
  const statusTemplate = (row: feedback) => {
    const updateStatus = async (value: boolean) => {
      try {
        await feedbackApi.update(row.unique_id, { is_active: value });
        fetchFeedbacks();
      } catch (error) {
        console.error("Failed to update status", error);
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  const actionTemplate = (row: feedback) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="size-5" />
      </button>

      {/* <button
        onClick={() => handleDelete(row.unique_id)}
        className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
        title="Delete"
      >
        <TrashBinIcon className="size-5" />
      </button> */}
    </div>
  );

  const indexTemplate = (_: feedback, { rowIndex }: any) => rowIndex + 1;

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  if (loading) return <div className="p-6">Loading Feedbacks...</div>;

  return (
    <div className="p-6">

        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Feedbacks
            </h1>
            <p className="text-gray-500 text-sm">Manage all feedback records</p>
          </div>

          <Button
            label="Add New"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        {/* Table */}
        <DataTable
          value={feedbacks}
          dataKey="unique_id"
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          globalFilterFields={[
            "customer_name",
            "category",
            "city_name",
            "zone_name",
          ]}
          rowsPerPageOptions={[5, 10, 25, 50]}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No feedback records found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="customer"
            header="Customer ID"
            sortable
            body={(row: feedback) =>
              row.customer ||
              (row.customer_unique_id ? String(row.customer_unique_id) : "") ||
              (row.customer_id ? String(row.customer_id) : "-")
            }
          />

          <Column
            field="customer_name"
            header="Customer Name"
            sortable
            body={(row: feedback) => cap(row.customer_name)}
          />

          <Column
            field="category"
            header="Category"
            sortable
            body={(row: feedback) => cap(row.category)}
          />

          <Column
            field="feedback_details"
            header="Feedback Details"
            sortable
            body={(row: feedback) => cap(row.feedback_details)}
          />

          <Column
            field="zone_name"
            header="Zone"
            sortable
            body={(row: feedback) => cap(row.zone_name)}
          />

          <Column
            field="city_name"
            header="City"
            sortable
            body={(row: feedback) => cap(row.city_name)}
          />

          {/* Status column removed per request */}

          <Column
            header="Actions"
            body={actionTemplate}
            style={{ width: "150px" }}
          />
        </DataTable>
    
    </div>
  );
}
