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
import { useTranslation } from "react-i18next";

/* ===============================
   TYPES
================================ */
type Option = { value: string; label: string };

export default function CustomerCreationForm() {
  const { t } = useTranslation();
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
          Swal.fire(
            t("common.error"),
            t("admin.customer_creation.load_failed"),
            "error"
          )
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
        Swal.fire(
          t("common.warning"),
          t("admin.customer_creation.missing_fields"),
          "warning"
        );
        return;
      }
    }

    if (!/^\d{10}$/.test(formData.contact_no)) {
      Swal.fire(
        t("admin.customer_creation.invalid_contact_title"),
        t("admin.customer_creation.invalid_contact_desc"),
        "warning"
      );
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      Swal.fire(
        t("admin.customer_creation.invalid_pincode_title"),
        t("admin.customer_creation.invalid_pincode_desc"),
        "warning"
      );
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lon)) {
      Swal.fire(
        t("admin.customer_creation.invalid_coordinates_title"),
        t("admin.customer_creation.invalid_coordinates_desc"),
        "warning"
      );
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

      Swal.fire(
        t("common.success"),
        t("admin.customer_creation.save_success"),
        "success"
      );
      navigate(ENC_LIST_PATH);
    } catch (err) {
      Swal.fire(t("common.save_failed"), t("common.save_failed_desc"), "error");
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
    <ComponentCard
      title={
        isEdit
          ? t("admin.customer_creation.title_edit")
          : t("admin.customer_creation.title_add")
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div><Label>{t("admin.customer_creation.customer_name")}</Label><Input value={formData.customer_name} onChange={e=>update("customer_name",e.target.value)} /></div>
          <div><Label>{t("admin.customer_creation.contact_no")}</Label><Input value={formData.contact_no} onChange={e=>update("contact_no",e.target.value)} /></div>
          <div><Label>{t("common.building_no")}</Label><Input value={formData.building_no} onChange={e=>update("building_no",e.target.value)} /></div>
          <div><Label>{t("common.street")}</Label><Input value={formData.street} onChange={e=>update("street",e.target.value)} /></div>
          <div><Label>{t("common.area")}</Label><Input value={formData.area} onChange={e=>update("area",e.target.value)} /></div>
          <div><Label>{t("common.pincode")}</Label><Input value={formData.pincode} onChange={e=>update("pincode",e.target.value)} /></div>
          <div><Label>{t("common.latitude")}</Label><Input value={formData.latitude} onChange={e=>update("latitude",e.target.value)} /></div>
          <div><Label>{t("common.longitude")}</Label><Input value={formData.longitude} onChange={e=>update("longitude",e.target.value)} /></div>

          <ShadcnSelect label={t("admin.customer_creation.id_proof_type")} value={formData.id_proof_type}
            onChange={(v)=>update("id_proof_type",v)}
            placeholder={t("admin.customer_creation.id_proof_placeholder")}
            options={[
              { value: "AADHAAR", label: t("admin.customer_creation.id_proof_aadhaar") },
              { value: "VOTER_ID", label: t("admin.customer_creation.id_proof_voter") },
              { value: "PAN_CARD", label: t("admin.customer_creation.id_proof_pan") },
              { value: "DL", label: t("admin.customer_creation.id_proof_dl") },
              { value: "PASSPORT", label: t("admin.customer_creation.id_proof_passport") },
            ]}
          />

          <div><Label>{t("admin.customer_creation.id_no")}</Label><Input value={formData.id_no} onChange={e=>update("id_no",e.target.value)} /></div>

          <ShadcnSelect label={t("common.ward")} value={formData.ward_id} onChange={(v)=>update("ward_id",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.ward") })}
            options={dropdowns.wards.map(w=>({value:resolveId(w),label:w.name}))} />

          <ShadcnSelect label={t("common.zone")} value={formData.zone_id} onChange={(v)=>update("zone_id",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.zone") })}
            options={dropdowns.zones.map(z=>({value:resolveId(z),label:z.name}))} />

          <ShadcnSelect label={t("common.city")} value={formData.city_id} onChange={(v)=>update("city_id",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.city") })}
            options={dropdowns.cities.map(c=>({value:resolveId(c),label:c.name}))} />

          <ShadcnSelect label={t("common.district")} value={formData.district_id} onChange={(v)=>update("district_id",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.district") })}
            options={dropdowns.districts.map(d=>({value:resolveId(d),label:d.name}))} />

          <ShadcnSelect label={t("common.state")} value={formData.state_id} onChange={(v)=>update("state_id",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.state") })}
            options={dropdowns.states.map(s=>({value:resolveId(s),label:s.name}))} />

          <ShadcnSelect label={t("common.country")} value={formData.country_id} onChange={(v)=>update("country_id",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.country") })}
            options={dropdowns.countries.map(c=>({value:resolveId(c),label:c.name}))} />

          <ShadcnSelect label={t("admin.customer_creation.property")} value={formData.property_id} onChange={(v)=>update("property_id",v)}
            placeholder={t("admin.customer_creation.property_placeholder")}
            options={dropdowns.properties.map(p=>({value:resolveId(p),label:p.property_name}))} />

          <ShadcnSelect label={t("admin.customer_creation.sub_property")} value={formData.sub_property_id} onChange={(v)=>update("sub_property_id",v)}
            placeholder={t("admin.customer_creation.sub_property_placeholder")}
            options={dropdowns.subProperties.map(sp=>({value:resolveId(sp),label:sp.sub_property_name}))} />

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="submit" disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded">
            {loading ? t("common.saving") : isEdit ? t("common.update") : t("common.save")}
          </button>
          <button type="button" onClick={()=>navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded">
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
