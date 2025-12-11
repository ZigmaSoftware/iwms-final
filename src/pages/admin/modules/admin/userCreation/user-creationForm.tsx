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

const pickIdentifier = (entity: any): string => {
  if (entity === null || entity === undefined) return "";
  if (typeof entity !== "object") return String(entity);
  const keys = [
    "unique_id",
    "id",
    "value",
    "staff_unique_id",
    "customer_id",
    "zone_id",
    "city_id",
    "district_id",
    "ward_id",
  ];

  for (const key of keys) {
    const value = entity[key];
    if (value !== undefined && value !== null) {
      const str = String(value);
      if (str.length > 0) return str;
    }
  }

  return "";
};

const parseIdentifierForPayload = (value: string) => {
  if (!value) return undefined;
  return /^\d+$/.test(value) ? Number(value) : value;
};

const mapToOptions = (
  items: any[] = [],
  labelBuilder: (item: any) => string | undefined | null
): Array<{ value: string; label: string }> =>
  items
    .map((item) => {
      const value = pickIdentifier(item);
      if (!value) return null;
      const label = (labelBuilder(item) ?? "").toString();
      return { value, label: label.trim() || value };
    })
    .filter(Boolean) as Array<{ value: string; label: string }>;

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
    desktopApi.get("user-type/").then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setUserTypes(mapToOptions(list, (u: any) => u.name ?? ""));
    });
  }, []);

  // ----------------------------------------------------
  // GET SELECTED ROLE NAME (staff / customer / future)
  // ----------------------------------------------------
  const selectedRoleKey = (() => {
    const raw = userTypes.find((ut: any) => ut.value === userType)?.label;
    if (!raw) return undefined;
    const normalized = String(raw).toLowerCase().trim();
    return normalized.length ? normalized : undefined;
  })();
  const roleConfig = selectedRoleKey ? ROLE_CONFIG[selectedRoleKey] : undefined;

  // ----------------------------------------------------
  // AUTO-LOAD API DATA BASED ON ROLE CONFIG
  // ----------------------------------------------------
  useEffect(() => {
    if (!roleConfig) return;

    roleConfig.apis.forEach((api: string) => {
      desktopApi.get(api).then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        switch (api) {
          case "customercreations/":
            setCustomerList(
              mapToOptions(list, (c: any) => {
                const name = c.customer_name ?? "";
                const phone = c.contact_no ?? "";
                return [name, phone].filter(Boolean).join(" - ");
              })
            );
            break;

          case "staffusertypes/":
            setStaffUserTypes(mapToOptions(list, (s: any) => s.name));
            break;

          case "staffcreation/":
            setStaffList(mapToOptions(list, (s: any) => s.employee_name));
            break;

          case "districts/":
            setDistrictList(mapToOptions(list, (d: any) => d.name));
            break;

          default:
            break;
        }
      });
    });
  }, [selectedRoleKey, roleConfig]);

  // ----------------------------------------------------
  // LOAD CHAINED LOCATION DATA
  // ----------------------------------------------------
  useEffect(() => {
    if (!district) return;
    const districtParam = parseIdentifierForPayload(district);
    if (districtParam === undefined) return;

    desktopApi.get(`cities/?district=${districtParam}`).then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setCityList(mapToOptions(list, (c: any) => c.name));
    });
  }, [district]);

  useEffect(() => {
    if (!city) return;
    const cityParam = parseIdentifierForPayload(city);
    if (cityParam === undefined) return;

    desktopApi.get(`zones/?city=${cityParam}`).then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setZoneList(mapToOptions(list, (z: any) => z.name));
    });
  }, [city]);

  useEffect(() => {
    if (!zone) return;
    const zoneParam = parseIdentifierForPayload(zone);
    if (zoneParam === undefined) return;

    desktopApi.get(`wards/?zone=${zoneParam}`).then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setWardList(mapToOptions(list, (w: any) => w.name));
    });
  }, [zone]);

  // ----------------------------------------------------
  // LOAD EDIT DATA
  // ----------------------------------------------------
  useEffect(() => {
    if (!isEdit) return;

    desktopApi.get(`users-creation/${id}/`).then((res) => {
      const u = res.data;

      setUserType(pickIdentifier(u.user_type_id ?? u.user_type));
      setPassword(u.password ?? "");
      setIsActive(Boolean(u.is_active));

      setCustomerId(pickIdentifier(u.customer_id));
      setStaffId(pickIdentifier(u.staff_id));
      setStaffUserType(pickIdentifier(u.staffusertype_id));

      setDistrict(pickIdentifier(u.district_id));
      setCity(pickIdentifier(u.city_id));
      setZone(pickIdentifier(u.zone_id));
      setWard(pickIdentifier(u.ward_id));
    });
  }, [id, isEdit]);

  // ----------------------------------------------------
  // HANDLE SUBMIT
  // ----------------------------------------------------
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload: any = {
      user_type: parseIdentifierForPayload(userType),
      password,
      is_active: isActive ? 1 : 0,
    };

    if (selectedRoleKey === "customer") {
      const parsedCustomer = parseIdentifierForPayload(customerId);
      if (parsedCustomer !== undefined) payload.customer_id = parsedCustomer;
    }

    if (selectedRoleKey === "staff") {
      const staffFields: Record<string, string> = {
        staffusertype_id: staffUserType,
        staff_id: staffId,
        district_id: district,
        city_id: city,
        zone_id: zone,
        ward_id: ward,
      };

      Object.entries(staffFields).forEach(([key, rawValue]) => {
        const parsedValue = parseIdentifierForPayload(rawValue);
        if (parsedValue !== undefined) payload[key] = parsedValue;
      });
    }

    try {
      setLoading(true);

      if (isEdit) {
        await desktopApi.put(`users-creation/${id}/`, payload);
        await desktopApi.put(`users-creation/${id}/`, payload);
      } else {
        await desktopApi.post("users-creation/", payload);
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
