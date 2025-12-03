import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { desktopApi } from "@/api";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Input } from "@/components/ui/input";
import { getEncryptedRoute } from "@/utils/routeCache";

const { encAdmins, encUserCreation } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encUserCreation}`;

/* ========================================================
   ROLE CONFIG — dynamic field control, scalable for future
   ======================================================== */
const ROLE_CONFIG: any = {
  staff: {
    fields: ["staffusertype_id", "staff_id", "district_id", "city_id", "zone_id", "ward_id"],
    apis: ["staffusertypes/", "staffcreation/", "districts/"],
  },
  customer: {
    fields: ["customer_id"],
    apis: ["customercreations/"],
  },
};

export default function UserCreationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  //  STATE
  // ----------------------------------------------------
  const [userType, setUserType] = useState("");
  const [userTypes, setUserTypes] = useState<Array<{ value: string; label: string }>>([]);

  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [customerList, setCustomerList] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [staffUserTypes, setStaffUserTypes] = useState<any[]>([]);
  const [staffUserType, setStaffUserType] = useState("");

  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffId, setStaffId] = useState("");

  const [districtList, setDistrictList] = useState<any[]>([]);
  const [district, setDistrict] = useState("");

  const [cityList, setCityList] = useState<any[]>([]);
  const [city, setCity] = useState("");

  const [zoneList, setZoneList] = useState<any[]>([]);
  const [zone, setZone] = useState("");

  const [wardList, setWardList] = useState<any[]>([]);
  const [ward, setWard] = useState("");

  // ----------------------------------------------------
  // LOAD USER TYPES
  // ----------------------------------------------------
  useEffect(() => {
    desktopApi.get("user-type/").then((res) => {
      setUserTypes(
        res.data.map((u: any) => ({
          value: u.id.toString(),
          label: u.name.toLowerCase(),
        }))
      );
    });
  }, []);

  // ----------------------------------------------------
  // GET SELECTED ROLE NAME (staff / customer / future)
  // ----------------------------------------------------
  const selectedRole = userTypes.find((ut: any) => ut.value === userType)?.label;
  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : undefined;

  // ----------------------------------------------------
  // AUTO-LOAD API DATA BASED ON ROLE CONFIG
  // ----------------------------------------------------
  useEffect(() => {
    if (!roleConfig) return;

    roleConfig.apis.forEach((api: string) => {
      desktopApi.get(api).then((res) => {
        switch (api) {
          case "customercreations/":
            setCustomerList(
              res.data.map((c: any) => ({
                value: c.id.toString(),
                label: `${c.customer_name} - ${c.contact_no}`,
              }))
            );
            break;

          case "staffusertypes/":
            setStaffUserTypes(
              res.data.map((s: any) => ({
                value: s.id.toString(),
                label: s.name,
              }))
            );
            break;

          case "staffcreation/":
            setStaffList(
              res.data.map((s: any) => ({
                value: s.id.toString(),
                label: s.employee_name,
              }))
            );
            break;

          case "districts/":
            setDistrictList(
              res.data.map((d: any) => ({ value: d.id.toString(), label: d.name }))
            );
            break;

          default:
            break;
        }
      });
    });
  }, [userType, roleConfig]);

  // ----------------------------------------------------
  // LOAD CHAINED LOCATION DATA
  // ----------------------------------------------------
  useEffect(() => {
    if (!district) return;
    desktopApi.get(`cities/?district=${district}`).then((res) =>
      setCityList(res.data.map((c: any) => ({ value: c.id.toString(), label: c.name })))
    );
  }, [district]);

  useEffect(() => {
    if (!city) return;
    desktopApi.get(`zones/?city=${city}`).then((res) =>
      setZoneList(res.data.map((z: any) => ({ value: z.id.toString(), label: z.name })))
    );
  }, [city]);

  useEffect(() => {
    if (!zone) return;
    desktopApi.get(`wards/?zone=${zone}`).then((res) =>
      setWardList(res.data.map((w: any) => ({ value: w.id.toString(), label: w.name })))
    );
  }, [zone]);

  // ----------------------------------------------------
  // LOAD EDIT DATA
  // ----------------------------------------------------
  useEffect(() => {
    if (!isEdit) return;

    desktopApi.get(`user/${id}/`).then((res) => {
      const u = res.data;

      setUserType(u.user_type?.toString());
      setPassword(u.password);
      setIsActive(u.is_active);

      if (u.customer_id) setCustomerId(u.customer_id.toString());
      if (u.staff_id) setStaffId(u.staff_id.toString());
      if (u.staffusertype_id) setStaffUserType(u.staffusertype_id.toString());

      setDistrict(u.district_id?.toString() || "");
      setCity(u.city_id?.toString() || "");
      setZone(u.zone_id?.toString() || "");
      setWard(u.ward_id?.toString() || "");
    });
  }, [id, isEdit]);

  // ----------------------------------------------------
  // HANDLE SUBMIT
  // ----------------------------------------------------
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload: any = {
      user_type: Number(userType),
      password,
      is_active: isActive ? 1 : 0,
    };

    if (selectedRole === "customer") {
      payload.customer_id = Number(customerId);
    }

    if (selectedRole === "staff") {
      payload.staffusertype_id = Number(staffUserType);
      payload.staff_id = Number(staffId);
      payload.district_id = Number(district);
      payload.city_id = Number(city);
      payload.zone_id = Number(zone);
      payload.ward_id = Number(ward);
    }

    try {
      setLoading(true);

      if (isEdit) {
        await desktopApi.put(`user/${id}/`, payload);
      } else {
        await desktopApi.post("user/", payload);
      }

      Swal.fire({ icon: "success", title: "Saved Successfully!" });
      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: JSON.stringify(err.response?.data),
      });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <ComponentCard title={isEdit ? "Edit User" : "Add User"}>
      <form noValidate onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label>User Type *</Label>
            <Select value={userType} onChange={setUserType} options={userTypes} />
          </div>

          <div>
            <Label>Password *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Status *</Label>
            <Select
              value={isActive ? "1" : "0"}
              onChange={(val) => setIsActive(val === "1")}
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
            />
          </div>

          {/* ======================================================
              CUSTOMER FIELDS
             ====================================================== */}
          {roleConfig?.fields?.includes("customer_id") && (
            <div>
              <Label>Customer *</Label>
              <Select value={customerId} onChange={setCustomerId} options={customerList} />
            </div>
          )}

          {/* ======================================================
              STAFF FIELDS (Dynamic)
             ====================================================== */}
          {roleConfig?.fields?.includes("staffusertype_id") && (
            <div>
              <Label>Staff User Type *</Label>
              <Select value={staffUserType} onChange={setStaffUserType} options={staffUserTypes} />
            </div>
          )}

          {roleConfig?.fields?.includes("staff_id") && (
            <div>
              <Label>Staff *</Label>
              <Select value={staffId} onChange={setStaffId} options={staffList} />
            </div>
          )}

          {roleConfig?.fields?.includes("district_id") && (
            <div>
              <Label>District *</Label>
              <Select value={district} onChange={setDistrict} options={districtList} />
            </div>
          )}

          {roleConfig?.fields?.includes("city_id") && (
            <div>
              <Label>City *</Label>
              <Select value={city} onChange={setCity} options={cityList} />
            </div>
          )}

          {roleConfig?.fields?.includes("zone_id") && (
            <div>
              <Label>Zone *</Label>
              <Select value={zone} onChange={setZone} options={zoneList} />
            </div>
          )}

          {roleConfig?.fields?.includes("ward_id") && (
            <div>
              <Label>Ward *</Label>
              <Select value={ward} onChange={setWard} options={wardList} />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button
            type="button"
            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500"
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-green-custom text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
