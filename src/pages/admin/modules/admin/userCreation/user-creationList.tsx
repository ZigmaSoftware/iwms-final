import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { desktopApi } from "@/api";
import Swal from "sweetalert2";
import ReactDOM from "react-dom/client";

import QRCode from "react-qr-code";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { Switch } from "@/components/ui/switch";

export default function UserCreationList() {
  const navigate = useNavigate();
  const { encAdmins, encUserCreation } = getEncryptedRoute();
  const ENC_NEW = `/${encAdmins}/${encUserCreation}/new`;
  const ENC_EDIT = (unique_id: number) =>
    `/${encAdmins}/${encUserCreation}/${unique_id}/edit`;

  const [users, setUsers] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const fetchUsers = async () => {
    try {
      const res = await desktopApi.get("users-creation/");
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /** ------------ FILTERED LISTS ---------------- */
  const staffList = users.filter(
    (u) => u.user_type_name?.toString().toLowerCase() === "staff"
  );
  const customerList = users.filter(
    (u) => u.user_type_name?.toString().toLowerCase() === "customer"
  );

  /** ------------ QR POPUP ------------------ */
  const openQRPopup = (data: any) => {
    Swal.fire({
      title: "Customer QR",
      html: `<div id="qr-holder" class="flex justify-center"></div>`,
      width: 350,
      didOpen: () => {
        const div = document.getElementById("qr-holder");
        if (div) {
          const root = ReactDOM.createRoot(div);
          root.render(<QRCode value={JSON.stringify(data)} size={180} />);
        }
      },
    });
  };

  /** ---------- Delete User ---------- */
  const handleDelete = async (unique_id: number) => {
    const r = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be soft-deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (!r.isConfirmed) return;

    await desktopApi.delete(`user/${unique_id}/`);
    Swal.fire("Deleted!", "User removed.", "success");
    fetchUsers();
  };

  /** ---------- Toggle Status ---------- */
  const handleStatusToggle = async (unique_id: string, value: boolean) => {
    await desktopApi.put(`user/${unique_id}/`, { is_active: value });
    fetchUsers();
  };

  /** ---------- UTILS ---------- */
  const cap = (t?: string) =>
    t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "";

  const onSearch = (e: any) => {
    const val = e.target.value;
    const _f: any = { ...filters };
    _f["global"].value = val;
    setFilters(_f);
    setGlobalFilter(val);
  };

  const searchBar = (
    <div className="flex justify-end p-2">
      <div className="flex items-center gap-2 px-3 py-1 border rounded bg-white">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilter}
          onChange={onSearch}
          placeholder="Search..."
          className="border-0 shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 text-sm">Manage staff & customers</p>
        </div>

        <Button
          label="Add User"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW)}
        />
      </div>

      {/* ------- TABS ------- */}
      <Tabs defaultValue="staff">
        <TabsList className="flex gap-3 pb-2">
          <TabsTrigger value="staff" className="px-4 py-2 border rounded">
            Staff
          </TabsTrigger>
          <TabsTrigger value="customer" className="px-4 py-2 border rounded">
            Customer
          </TabsTrigger>
        </TabsList>

        {/* ================= STAFF TABLE ================= */}
        <TabsContent value="staff">
          <DataTable
            value={staffList}
            paginator
            rows={10}
            filters={filters}
            globalFilterFields={["staff_name", "staffusertype_name", "zone_name"]}
            header={searchBar}
            stripedRows
            showGridlines
            className="p-datatable-sm mt-4"
          >
            <Column
              header="S.No"
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: "80px" }}
            />
            <Column
              header="User Type"
              field="user_type_name"
              body={(r) => cap(r.user_type_name)}
            />
            <Column
              header="Staff User Type"
              field="staffusertype_name"
              body={(r) => cap(r.staffusertype_name)}
            />
            <Column
              header="Staff Name"
              field="staff_name"
              body={(r) => cap(r.staff_name)}
            />
            <Column header="Zone" field="zone_name" />
            <Column header="Ward" field="ward_name" />
            <Column
              header="Status"
              body={(row) => (
                <Switch
                  checked={row.is_active}
                  onCheckedChange={(val) => handleStatusToggle(row.id, val)}
                />
              )}
            />
            <Column
              header="Actions"
              style={{ width: "140px" }}
              body={(row) => (
                <div className="flex gap-3">
                  <PencilIcon
                    className="cursor-pointer"
                    onClick={() => navigate(ENC_EDIT(row.unique_id))}
                  />
                  <TrashBinIcon
                    className="cursor-pointer text-red-600"
                    onClick={() => handleDelete(row.unique_id)}
                  />
                </div>
              )}
            />
          </DataTable>
        </TabsContent>

        {/* ================= CUSTOMER TABLE ================= */}
        <TabsContent value="customer">
          <DataTable
            value={customerList}
            paginator
            rows={10}
            filters={filters}
            globalFilterFields={[
              "customer.customer_name",
              "customer.contact_no",
            ]}
            header={searchBar}
            stripedRows
            showGridlines
            className="p-datatable-sm mt-4"
          >
            <Column
              header="S.No"
              body={(_, opt) => opt.rowIndex + 1}
              style={{ width: "80px" }}
            />
            <Column header="User Type" body={(r) => cap(r.user_type_name)} />
            <Column
              header="Customer Name"
              body={(r) => r.customer?.customer_name}
            />
            <Column header="Mobile" body={(r) => r.customer?.contact_no} />
            <Column header="Ward" body={(r) => r.customer?.ward_name} />
            <Column header="Zone" body={(r) => r.customer?.zone_name} />
            <Column header="City" body={(r) => r.customer?.city_name} />
            <Column header="State" body={(r) => r.customer?.state_name} />

            <Column
              header="QR"
              body={(row) =>
                row.customer ? (
                  <button
                    className="text-blue-600 underline"
                    onClick={() =>
                      openQRPopup({
                        id: row.customer.id,
                        name: row.customer.customer_name,
                        mobile: row.customer.contact_no,
                        address: `${row.customer.building_no}, ${row.customer.street}, ${row.customer.area}`,
                      })
                    }
                  >
                    View
                  </button>
                ) : (
                  "—"
                )
              }
            />

            <Column
              header="Status"
              body={(row) => (
                <Switch
                  checked={row.is_active}
                  onCheckedChange={(val) => handleStatusToggle(row.unique_id, val)}
                />
              )}
            />

            <Column
              header="Actions"
              style={{ width: "140px" }}
              body={(row) => (
                <div className="flex gap-3">
                  <PencilIcon
                    className="cursor-pointer"
                    onClick={() => navigate(ENC_EDIT(row.unique_id))}
                  />
                  <TrashBinIcon
                    className="cursor-pointer text-red-600"
                    onClick={() => handleDelete(row.unique_id)}
                  />
                </div>
              )}
            />
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
  );
}
