import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { customerCreationApi, userCreationApi } from "@/helpers/admin";

const normalizeList = (payload: any) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload?.data?.results ?? [];

export default function UserCreationList() {
  const navigate = useNavigate();
  const { encAdmins, encUserCreation } = getEncryptedRoute();

  const ENC_NEW = `/${encAdmins}/${encUserCreation}/new`;
  const ENC_EDIT = (unique_id: string) =>
    `/${encAdmins}/${encUserCreation}/${unique_id}/edit`;

  const [users, setUsers] = useState<any[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, any>>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  /* ---------------- FETCH ---------------- */
  const fetchUsers = async () => {
    try {
      const [usersRes, customersRes] = await Promise.all([
        userCreationApi.list(),
        customerCreationApi.list(),
      ]);

      setUsers(normalizeList(usersRes));

      const map: Record<string, any> = {};
      const customers = normalizeList(customersRes);

      customers.forEach((c: any) => {
        const key = c?.unique_id ?? c?.id;
        if (key) map[String(key)] = c;
      });

      setCustomerMap(map);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ---------------- FILTERS ---------------- */
  const staffList = users.filter(
    (u) => u.user_type_name?.toLowerCase() === "staff"
  );

  const composeCustomerInfo = (row: any) => {
    if (row?.customer_name || row?.customer_unique_id) {
      return {
        unique_id: row.customer_unique_id ?? row.customer_id,
        customer_name: row.customer_name,
        contact_no: row.customer_contact_no,
        building_no: row.customer_building_no,
        street: row.customer_street,
        area: row.customer_area,
        ward_name: row.customer_ward_name ?? row.ward_name,
        zone_name: row.customer_zone_name ?? row.zone_name,
        city_name: row.customer_city_name ?? row.city_name,
        state_name: row.customer_state_name ?? row.state_name,
      };
    }

    const key = row?.customer_unique_id ?? row?.customer_id ?? row?.customer;
    return key ? customerMap[String(key)] ?? null : null;
  };

  const customerList = users
    .filter((u) => u.user_type_name?.toLowerCase() === "customer")
    .map((u) => ({ ...u, customer: composeCustomerInfo(u) }));

  /* ---------------- QR ---------------- */
  const buildCustomerQrPayload = (c: any) =>
    c
      ? {
          id: c.unique_id,
          name: c.customer_name,
          mobile: c.contact_no,
          address: `${c.building_no}, ${c.street}, ${c.area}`,
        }
      : null;

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

  /* ---------------- ACTIONS ---------------- */
  const handleDelete = async (unique_id: string) => {
    const r = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be soft-deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!r.isConfirmed) return;

    try {
      await userCreationApi.remove(unique_id);
      Swal.fire("Deleted!", "User removed.", "success");
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Unable to delete user", "error");
    }
  };

  /**
   * 🔥 ONLY FIX APPLIED HERE
   * Backend expects 1 / 0, not true / false
   */
  const handleStatusToggle = async (unique_id: string, value: boolean) => {
    try {
      await userCreationApi.update(unique_id, {
        is_active: value ? 1 : 0,
      });
      fetchUsers();
    } catch (err: any) {
      console.error("Status update error:", err?.response?.data || err);
      Swal.fire("Update failed", "Unable to change status", "error");
    }
  };

  /* ---------------- SEARCH ---------------- */
  const cap = (t?: string) =>
    t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "";

  const onSearch = (e: any) => {
    const val = e.target.value;
    setFilters({ global: { value: val, matchMode: FilterMatchMode.CONTAINS } });
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

  /* ================= RENDER ================= */
  return (
    <>
        <div className="p-3">
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-g  ray-500 text-sm">Manage staff & customers</p>
        </div>

        <Button
          label="Add User"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW)}
        />
      </div>

      <Tabs defaultValue="staff">
        <TabsList className="flex gap-3 pb-2">
          <TabsTrigger value="staff" className="px-4 py-2 border rounded">
            Staff
          </TabsTrigger>
          <TabsTrigger value="customer" className="px-4 py-2 border rounded">
            Customer
          </TabsTrigger>
        </TabsList>

        {/* ================= STAFF ================= */}
        <TabsContent value="staff">
          <DataTable
            value={staffList}
            dataKey="unique_id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            filters={filters}
            globalFilterFields={["staff_name", "staffusertype_name", "zone_name"]}
            header={searchBar}
            stripedRows
            showGridlines
            className="p-datatable-sm mt-4"
          >
            <Column header="S.No" body={(_, o) => o.rowIndex + 1} />
            <Column header="User Type" body={(r) => cap(r.user_type_name)} />
            <Column
              header="Staff User Type"
              body={(r) => cap(r.staffusertype_name)}
            />
            <Column header="Staff Name" body={(r) => cap(r.staff_name)} />
            <Column header="Zone" field="zone_name" />
            <Column header="Ward" field="ward_name" />
            <Column
              header="Status"
              body={(r) => (
                <Switch
                  checked={!!r.is_active}
                  onCheckedChange={(v) =>
                    handleStatusToggle(r.unique_id, v)
                  }
                />
              )}
            />
            <Column
              header="Actions"
              body={(r) => (
                <div className="flex gap-3">
                  <PencilIcon onClick={() => navigate(ENC_EDIT(r.unique_id))} />
                </div>
              )}
            />
          </DataTable>
        </TabsContent>

        {/* ================= CUSTOMER ================= */}
        <TabsContent value="customer">
          <DataTable
            value={customerList}
            dataKey="unique_id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
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
            <Column header="S.No" body={(_, o) => o.rowIndex + 1} />
            <Column header="User Type" body={(r) => cap(r.user_type_name)} />
            <Column header="Customer Name" body={(r) => r.customer?.customer_name} />
            <Column header="Mobile" body={(r) => r.customer?.contact_no} />
            <Column header="Ward" body={(r) => r.customer?.ward_name} />
            <Column header="Zone" body={(r) => r.customer?.zone_name} />
            <Column header="City" body={(r) => r.customer?.city_name} />
            <Column header="State" body={(r) => r.customer?.state_name} />
            <Column
              header="QR"
              body={(r) => {
                const payload = buildCustomerQrPayload(r.customer);
                return payload ? (
                  <button
                    className="p-1 border rounded"
                    onClick={() => openQRPopup(payload)}
                  >
                    <QRCode value={JSON.stringify(payload)} size={48} />
                  </button>
                ) : (
                  "—"
                );
              }}
            />
            <Column
              header="Status"
              body={(r) => (
                <Switch
                  checked={!!r.is_active}
                  onCheckedChange={(v) =>
                    handleStatusToggle(r.unique_id, v)
                  }
                />
              )}
            />
            <Column
              header="Actions"
              body={(r) => (
                <div className="flex gap-3">
                  <PencilIcon 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => navigate(ENC_EDIT(r.unique_id))} />
                </div>
              )}
            />
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
