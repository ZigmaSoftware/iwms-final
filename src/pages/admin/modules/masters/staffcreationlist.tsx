import { type ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {desktopApi} from "@/api";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import QRCode from "react-qr-code";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";

import { Switch } from "@/components/ui/switch";

type Staff = {
  id: number;
  employee_name: string;
  staff_unique_id: string;
  designation?: string;
  doj?: string;
  site_name?: string;
  active_status: boolean;
  salary_type?: string;
  contact_details?: {
    mobile_no?: string;
  };
  department?: string;
};

const cap = (val?: string) =>
  val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : "";

export default function StaffCreationList() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterParams, setFilterParams] = useState({
    salary_type: "",
    active_status: "",
    site_name: "",
    employee_name: "",
  });

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [datatableFilters, setDatatableFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const { encMasters, encStaffCreation } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encMasters}/${encStaffCreation}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encMasters}/${encStaffCreation}/${id}/edit`;

  const globalFilterFields = [
    "employee_name",
    "employee_id",
    "designation",
    "site_name",
  ];

  const fetchStaffs = async (params = filterParams) => {
    setLoading(true);
    try {
      const response = await desktopApi.get("staffcreation/", { params });
      setStaffs(response.data);
    } catch (err) {
      Swal.fire("Error", "Unable to load staff list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs(filterParams);
  }, []);

  const applyFilter = () => fetchStaffs(filterParams);

  const handleFilterChange = (
    ev: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = ev.target;
    setFilterParams((prev) => ({ ...prev, [name]: value }));
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updated = { ...datatableFilters };
    updated.global.value = e.target.value;
    setGlobalFilterValue(e.target.value);
    setDatatableFilters(updated);
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This staff record will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    await desktopApi.delete(`staffcreation/${id}/`);
    Swal.fire("Deleted!", "Record removed successfully", "success");

    fetchStaffs(filterParams);
  };

  /**
   * 🔥 FIXED TOGGLE — FORM DATA PATCH (NO MORE 415)
   */
  const statusTemplate = (row: Staff) => {
    const updateStatus = async (value: boolean) => {
      try {
        const formData = new FormData();
        formData.append("active_status", String(value));

        await desktopApi.patch(`staffcreation/${row.id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        fetchStaffs(filterParams);
      } catch (err) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    };

    return (
      <Switch
        checked={row.active_status}
        onCheckedChange={updateStatus}
      />
    );
  };

  const qrTemplate = (row: Staff) => (
    <div
      className="cursor-pointer flex justify-center"
      onClick={() => {
        const qrText = `
Zigma ID: ${row.staff_unique_id}
Name: ${row.employee_name}
Designation: ${row.designation || "-"}
Site: ${row.site_name || "-"}
Status: ${row.active_status ? "Active" : "Inactive"}
`;
        setQrData(qrText);
        setQrModalOpen(true);
      }}
    >
      <QRCode value={JSON.stringify(row)} size={50} />
    </div>
  );

  const actionTemplate = (row: Staff) => (
    <div className="flex gap-3 justify-center">
      <button
        title="Edit"
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        onClick={() => handleDelete(row.id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: Staff, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const header = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Master / Staff & Employee Creation List
          </h1>
          <p className="text-sm text-gray-500">
            Track staff records, export QR codes, and keep workforce updated.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            label="+ Create"
            icon="pi pi-plus"
            className="p-button-success p-button-sm"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid gap-3 md:grid-cols-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold">Salary Type</span>
          <select
            name="salary_type"
            value={filterParams.salary_type}
            onChange={handleFilterChange}
            className="h-10 rounded-lg border px-3 text-sm"
          >
            <option value="">All</option>
            <option value="Monthly">Monthly</option>
            <option value="Daily">Daily</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold">Active Status</span>
          <select
            name="active_status"
            value={filterParams.active_status}
            onChange={handleFilterChange}
            className="h-10 rounded-lg border px-3 text-sm"
          >
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold">Site Name</span>
          <input
            name="site_name"
            value={filterParams.site_name}
            onChange={handleFilterChange}
            placeholder="Search site"
            className="h-10 rounded-lg border px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold">Employee Name</span>
          <input
            name="employee_name"
            value={filterParams.employee_name}
            onChange={handleFilterChange}
            placeholder="Search employee"
            className="h-10 rounded-lg border px-3 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={applyFilter}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Go
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 border rounded-full px-3 py-1 bg-white">
          <i className="pi pi-search text-gray-500" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search staff…"
            className="border-none text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* QR Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-lg font-semibold mb-4">
              Staff QR
            </h2>
            <div className="flex justify-center mb-4">
              <QRCode value={qrData} size={200} />
            </div>
            <Button
              label="Close"
              className="p-button-success w-full"
              onClick={() => setQrModalOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <DataTable
            value={staffs}
            paginator
            rows={10}
            loading={loading}
            filters={datatableFilters}
            globalFilterFields={globalFilterFields}
            header={header}
            emptyMessage="No staff found."
            stripedRows
            showGridlines
            className="p-datatable-sm"
          >
            <Column header="S.No" body={indexTemplate} style={{ width: 70 }} />
            <Column field="staff_unique_id" header="Zigma ID" sortable
              body={(row: Staff) => cap(row.staff_unique_id)}
            
            />
            <Column
              field="employee_name"
              header="Employee Name"
              sortable
              body={(row: Staff) => cap(row.employee_name)}
            />
            <Column field="designation" header="Designation" sortable />
            <Column field="doj" header="DOJ" sortable />
            <Column field="site_name" header="Site Name" sortable />
            <Column
              header="Contact"
              body={(row: Staff) => row.contact_details?.mobile_no || "-"}
            />

            {/* 🔥 Toggle with FormData */}
            <Column
              header="Status"
              body={statusTemplate}
              style={{ width: 120 }}
            />

            <Column header="QR" body={qrTemplate} style={{ width: 120 }} />

            <Column header="Action" body={actionTemplate} style={{ width: 140 }} />
          </DataTable>
        </div>
      </div>
    </>
  );
}
