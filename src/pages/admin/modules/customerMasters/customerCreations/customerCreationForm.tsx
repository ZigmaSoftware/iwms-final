import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import {
  cityApi,
  countryApi,
  customerCreationApi,
  districtApi,
  propertiesApi,
  stateApi,
  subPropertiesApi,
  wardApi,
  zoneApi,
} from "@/helpers/admin";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { getEncryptedRoute } from "@/utils/routeCache";

/* ===============================
   TYPES
================================ */
type Option = { value: string; label: string };

export default function CustomerCreationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encCustomerMaster, encCustomerCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encCustomerMaster}/${encCustomerCreation}`;

  const [loading, setLoading] = useState(false);

  /* ===============================
     FORM STATE
  ================================ */
  const [formData, setFormData] = useState({
    customer_name: "",
    contact_no: "",
    building_no: "",
    street: "",
    area: "",
    pincode: "",
    latitude: "",
    longitude: "",
    id_proof_type: "",
    id_no: "",
    is_deleted: false,
    is_active: true,

    ward_id: "",
    zone_id: "",
    city_id: "",
    district_id: "",
    state_id: "",
    country_id: "",
    property_id: "",
    sub_property_id: "",
  });

  const update = (key: string, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }));

  /* ===============================
     DROPDOWNS
  ================================ */
  const [dropdowns, setDropdowns] = useState({
    wards: [] as any[],
    zones: [] as any[],
    cities: [] as any[],
    districts: [] as any[],
    states: [] as any[],
    countries: [] as any[],
    properties: [] as any[],
    subProperties: [] as any[],
  });

  const resolveId = (o: any) =>
    String(o?.unique_id ?? o?.id ?? "");

  /* ===============================
     FETCH DROPDOWNS
  ================================ */
  const fetchDropdowns = async () => {
    try {
      const [
        wards,
        zones,
        cities,
        districts,
        states,
        countries,
        properties,
        subProperties,
      ] = await Promise.all([
        wardApi.list(),
        zoneApi.list(),
        cityApi.list(),
        districtApi.list(),
        stateApi.list(),
        countryApi.list(),
        propertiesApi.list(),
        subPropertiesApi.list(),
      ]);

      setDropdowns({
        wards,
        zones,
        cities,
        districts,
        states,
        countries,
        properties,
        subProperties,
      });
    } catch (err) {
      console.error("Dropdown load failed", err);
    }
  };

  /* ===============================
     INIT LOAD
  ================================ */
  useEffect(() => {
    fetchDropdowns();

    if (isEdit && id) {
      customerCreationApi
        .get(id)
        .then((res) => setFormData(res as any))
        .catch(() =>
          Swal.fire("Error", "Failed to load customer", "error")
        );
    }
  }, [id]);

  /* ===============================
     SUBMIT
  ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const required = [
      "customer_name",
      "contact_no",
      "building_no",
      "street",
      "area",
      "pincode",
      "latitude",
      "longitude",
      "id_proof_type",
      "id_no",
      "ward_id",
      "zone_id",
      "city_id",
      "district_id",
      "state_id",
      "country_id",
      "property_id",
      "sub_property_id",
    ];

    for (const k of required) {
      if (!(formData as any)[k]) {
        Swal.fire("Missing Fields", "Please fill all mandatory fields", "warning");
        return;
      }
    }

    if (!/^\d{10}$/.test(formData.contact_no)) {
      Swal.fire("Invalid Contact", "Contact must be 10 digits", "warning");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      Swal.fire("Invalid Pincode", "Pincode must be 6 digits", "warning");
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lon)) {
      Swal.fire("Invalid Coordinates", "Latitude / Longitude invalid", "warning");
      return;
    }

    const payload = {
      ...formData,
      latitude: String(lat),
      longitude: String(lon),
    };

    try {
      setLoading(true);
      isEdit
        ? await customerCreationApi.update(id as string, payload)
        : await customerCreationApi.create(payload);

      Swal.fire("Success", "Customer saved successfully", "success");
      navigate(ENC_LIST_PATH);
    } catch (err) {
      Swal.fire("Error", "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     SHADCN SELECT WRAPPER
  ================================ */
  const ShadcnSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Option[];
    placeholder: string;
  }) => (
    <div>
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  /* ===============================
     RENDER
  ================================ */
  return (
    <ComponentCard title={isEdit ? "Edit Customer" : "Add Customer"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div><Label>Customer Name</Label><Input value={formData.customer_name} onChange={e=>update("customer_name",e.target.value)} /></div>
          <div><Label>Contact No</Label><Input value={formData.contact_no} onChange={e=>update("contact_no",e.target.value)} /></div>
          <div><Label>Building No</Label><Input value={formData.building_no} onChange={e=>update("building_no",e.target.value)} /></div>
          <div><Label>Street</Label><Input value={formData.street} onChange={e=>update("street",e.target.value)} /></div>
          <div><Label>Area</Label><Input value={formData.area} onChange={e=>update("area",e.target.value)} /></div>
          <div><Label>Pincode</Label><Input value={formData.pincode} onChange={e=>update("pincode",e.target.value)} /></div>
          <div><Label>Latitude</Label><Input value={formData.latitude} onChange={e=>update("latitude",e.target.value)} /></div>
          <div><Label>Longitude</Label><Input value={formData.longitude} onChange={e=>update("longitude",e.target.value)} /></div>

          <ShadcnSelect label="ID Proof Type" value={formData.id_proof_type}
            onChange={(v)=>update("id_proof_type",v)}
            placeholder="Select ID Proof"
            options={[
              { value: "AADHAAR", label: "Aadhaar" },
              { value: "VOTER_ID", label: "Voter ID" },
              { value: "PAN_CARD", label: "PAN Card" },
              { value: "DL", label: "Driving License" },
              { value: "PASSPORT", label: "Passport" },
            ]}
          />

          <div><Label>ID Number</Label><Input value={formData.id_no} onChange={e=>update("id_no",e.target.value)} /></div>

          <ShadcnSelect label="Ward" value={formData.ward_id} onChange={(v)=>update("ward_id",v)}
            placeholder="Select ward"
            options={dropdowns.wards.map(w=>({value:resolveId(w),label:w.name}))} />

          <ShadcnSelect label="Zone" value={formData.zone_id} onChange={(v)=>update("zone_id",v)}
            placeholder="Select zone"
            options={dropdowns.zones.map(z=>({value:resolveId(z),label:z.name}))} />

          <ShadcnSelect label="City" value={formData.city_id} onChange={(v)=>update("city_id",v)}
            placeholder="Select city"
            options={dropdowns.cities.map(c=>({value:resolveId(c),label:c.name}))} />

          <ShadcnSelect label="District" value={formData.district_id} onChange={(v)=>update("district_id",v)}
            placeholder="Select district"
            options={dropdowns.districts.map(d=>({value:resolveId(d),label:d.name}))} />

          <ShadcnSelect label="State" value={formData.state_id} onChange={(v)=>update("state_id",v)}
            placeholder="Select state"
            options={dropdowns.states.map(s=>({value:resolveId(s),label:s.name}))} />

          <ShadcnSelect label="Country" value={formData.country_id} onChange={(v)=>update("country_id",v)}
            placeholder="Select country"
            options={dropdowns.countries.map(c=>({value:resolveId(c),label:c.name}))} />

          <ShadcnSelect label="Property" value={formData.property_id} onChange={(v)=>update("property_id",v)}
            placeholder="Select property"
            options={dropdowns.properties.map(p=>({value:resolveId(p),label:p.property_name}))} />

          <ShadcnSelect label="Sub Property" value={formData.sub_property_id} onChange={(v)=>update("sub_property_id",v)}
            placeholder="Select sub property"
            options={dropdowns.subProperties.map(sp=>({value:resolveId(sp),label:sp.sub_property_name}))} />

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="submit" disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded">
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
          <button type="button" onClick={()=>navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
