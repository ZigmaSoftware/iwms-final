import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { desktopApi } from "@/api";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select, { type SelectOption } from "@/components/form/Select";
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

const normalizeListData = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;

  if (payload?.results && Array.isArray(payload.results)) {
    return payload.results;
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.data?.results && Array.isArray(payload.data.results)) {
    return payload.data.results;
  }

  return [];
};

const buildOptions = (
  data: any,
  getLabel: (item: any) => string
): SelectOption[] => {
  return normalizeListData(data)
    .map((item: any) => {
      const rawValue = item?.id ?? item?.unique_id;
      const label = getLabel(item);

      if (rawValue === undefined || rawValue === null || !label) {
        return null;
      }

      return {
        value: String(rawValue),
        label,
      };
    })
    .filter(Boolean) as SelectOption[];
};

const normalizeIdValue = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value === "number") return value;

  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
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
  const [userTypes, setUserTypes] = useState<SelectOption[]>([]);

  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [customerList, setCustomerList] = useState<SelectOption[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [staffUserTypes, setStaffUserTypes] = useState<SelectOption[]>([]);
  const [staffUserType, setStaffUserType] = useState("");

  const [staffList, setStaffList] = useState<SelectOption[]>([]);
  const [staffId, setStaffId] = useState("");

  const [districtList, setDistrictList] = useState<SelectOption[]>([]);
  const [district, setDistrict] = useState("");

  const [cityList, setCityList] = useState<SelectOption[]>([]);
  const [city, setCity] = useState("");

  const [zoneList, setZoneList] = useState<SelectOption[]>([]);
  const [zone, setZone] = useState("");

  const [wardList, setWardList] = useState<SelectOption[]>([]);
  const [ward, setWard] = useState("");

  // ----------------------------------------------------
  // LOAD USER TYPES
  // ----------------------------------------------------
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const res = await desktopApi.get("user-type/");
        setUserTypes(
          buildOptions(res.data, (u) => (u?.name ?? "").toLowerCase())
        );
      } catch (err) {
        console.error("Failed to load user types", err);
        setUserTypes([]);
      }
    };

    fetchUserTypes();
  }, []);

  // ----------------------------------------------------
  // GET SELECTED ROLE NAME (staff / customer / future)
  // ----------------------------------------------------
  const selectedRoleLabel = userTypes.find((ut: any) => ut.value === userType)?.label;
  const selectedRole =
    typeof selectedRoleLabel === "string" ? selectedRoleLabel : undefined;
  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : undefined;

  // ----------------------------------------------------
  // AUTO-LOAD API DATA BASED ON ROLE CONFIG
  // ----------------------------------------------------
  useEffect(() => {
    if (!roleConfig) {
      setCustomerList([]);
      setStaffUserTypes([]);
      setStaffList([]);
      setDistrictList([]);
      setCityList([]);
      setZoneList([]);
      setWardList([]);

      setCustomerId("");
      setStaffUserType("");
      setStaffId("");
      setDistrict("");
      setCity("");
      setZone("");
      setWard("");
      return;
    }

    const { fields = [], apis = [] } = roleConfig;

    if (!fields.includes("customer_id")) {
      setCustomerId("");
      setCustomerList([]);
    }
    if (!fields.includes("staffusertype_id")) {
      setStaffUserType("");
      setStaffUserTypes([]);
    }
    if (!fields.includes("staff_id")) {
      setStaffId("");
      setStaffList([]);
    }
    if (!fields.includes("district_id")) {
      setDistrict("");
      setDistrictList([]);
    }
    if (!fields.includes("city_id")) {
      setCity("");
      setCityList([]);
    }
    if (!fields.includes("zone_id")) {
      setZone("");
      setZoneList([]);
    }
    if (!fields.includes("ward_id")) {
      setWard("");
      setWardList([]);
    }

    const fetchRoleData = async () => {
      await Promise.all(
        apis.map(async (api: string) => {
          try {
            const res = await desktopApi.get(api);
            switch (api) {
              case "customercreations/":
                setCustomerList(
                  buildOptions(res.data, (c) => {
                    const name = c?.customer_name ?? c?.name ?? "";
                    const phone = c?.contact_no ?? c?.phone ?? "";
                    return [name, phone].filter(Boolean).join(" - ");
                  })
                );
                break;

              case "staffusertypes/":
                setStaffUserTypes(buildOptions(res.data, (s) => s?.name ?? ""));
                break;

              case "staffcreation/":
                setStaffList(
                  buildOptions(
                    res.data,
                    (s) => s?.employee_name ?? s?.staff_name ?? s?.name ?? ""
                  )
                );
                break;

              case "districts/":
                setDistrictList(buildOptions(res.data, (d) => d?.name ?? ""));
                break;

              default:
                console.warn(`Unhandled API mapping for ${api}`);
                break;
            }
          } catch (err) {
            console.error(`Failed to load data for ${api}`, err);
          }
        })
      );
    };

    fetchRoleData();
  }, [roleConfig]);

  // ----------------------------------------------------
  // LOAD CHAINED LOCATION DATA
  // ----------------------------------------------------
  useEffect(() => {
    if (!district) {
      setCity("");
      setCityList([]);
      setZone("");
      setZoneList([]);
      setWard("");
      setWardList([]);
      return;
    }

    const loadCities = async () => {
      try {
        const res = await desktopApi.get(`cities/?district=${district}`);
        setCityList(buildOptions(res.data, (c) => c?.name ?? ""));
      } catch (err) {
        console.error("Failed to load cities", err);
        setCityList([]);
      }
    };

    loadCities();
  }, [district]);

  useEffect(() => {
    if (!city) {
      setZone("");
      setZoneList([]);
      setWard("");
      setWardList([]);
      return;
    }

    const loadZones = async () => {
      try {
        const res = await desktopApi.get(`zones/?city=${city}`);
        setZoneList(buildOptions(res.data, (z) => z?.name ?? ""));
      } catch (err) {
        console.error("Failed to load zones", err);
        setZoneList([]);
      }
    };

    loadZones();
  }, [city]);

  useEffect(() => {
    if (!zone) {
      setWard("");
      setWardList([]);
      return;
    }

    const loadWards = async () => {
      try {
        const res = await desktopApi.get(`wards/?zone=${zone}`);
        setWardList(buildOptions(res.data, (w) => w?.name ?? ""));
      } catch (err) {
        console.error("Failed to load wards", err);
        setWardList([]);
      }
    };

    loadWards();
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
      user_type: normalizeIdValue(userType),
      password,
      is_active: isActive ? 1 : 0,
    };

    if (selectedRole === "customer") {
      const customerVal = normalizeIdValue(customerId);
      if (customerVal !== undefined) {
        payload.customer_id = customerVal;
      }
    }

    if (selectedRole === "staff") {
      const staffUserTypeVal = normalizeIdValue(staffUserType);
      const staffVal = normalizeIdValue(staffId);
      const districtVal = normalizeIdValue(district);
      const cityVal = normalizeIdValue(city);
      const zoneVal = normalizeIdValue(zone);
      const wardVal = normalizeIdValue(ward);

      if (staffUserTypeVal !== undefined) payload.staffusertype_id = staffUserTypeVal;
      if (staffVal !== undefined) payload.staff_id = staffVal;
      if (districtVal !== undefined) payload.district_id = districtVal;
      if (cityVal !== undefined) payload.city_id = cityVal;
      if (zoneVal !== undefined) payload.zone_id = zoneVal;
      if (wardVal !== undefined) payload.ward_id = wardVal;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await desktopApi.put(`users-creation/${id}/`, payload);
      } else {
        await desktopApi.post("users-creation/", payload);
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
