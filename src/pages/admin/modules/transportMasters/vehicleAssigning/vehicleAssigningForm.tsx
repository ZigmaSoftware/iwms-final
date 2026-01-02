import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

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
import { filterActiveRecords } from "@/utils/customerUtils";
import { adminApi } from "@/helpers/admin/registry";
import { useTranslation } from "react-i18next";

const vehicleTypeApi = adminApi.vehicleTypes;
const fuelTypeApi = adminApi.fuels;
const stateApi = adminApi.states;
const districtApi = adminApi.districts;
const cityApi = adminApi.cities;
const zoneApi = adminApi.zones;
const wardApi = adminApi.wards;
const vehicleApi = adminApi.vehicleAssigning;

export default function VehicleAssigningForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encTransportMaster, encVehicleCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encTransportMaster}/${encVehicleCreation}`;

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  /* ---------------- FORM STATE ---------------- */
  const [form, setForm] = useState({
    vehicleNo: "",
    chaseNo: "",
    imeiNo: "",
    driverName: "",
    driverNo: "",
    capacity: "",
    fuelEfficiency: "",
    lastMaintenance: "",
    vehicleType: "",
    fuelType: "",
    state: "",
    district: "",
    city: "",
    zone: "",
    ward: "",
    isActive: "true",
  });

  const update = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  /* ---------------- OPTIONS ---------------- */
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [fuelTypes, setFuelTypes] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const resolveId = (i: any) =>
    String(i?.unique_id ?? i?.id ?? i?.value ?? "");

  /* ---------------- INIT LOAD ---------------- */
  useEffect(() => {
    Promise.all([
      vehicleTypeApi.list(),
      fuelTypeApi.list(),
      stateApi.list(),
    ]).then(([vt, ft, st]) => {
      setVehicleTypes(vt);
      setFuelTypes(ft);
      setStates(st);
    });

    if (!isEdit) {
      setInitialLoad(false);
      return;
    }

    vehicleApi.get(id as string).then(async (v) => {
      const maintenanceRaw = v.last_maintenance ?? "";
      const maintenance =
        typeof maintenanceRaw === "string"
          ? maintenanceRaw.split("T")[0]
          : "";
      setForm({
        vehicleNo: v.vehicle_no,
        chaseNo: v.chase_no,
        imeiNo: v.imei_no,
        driverName: v.driver_name,
        driverNo: v.driver_no,
        capacity: v.capacity ?? "",
        fuelEfficiency: v.fuel_efficiency ?? "",
        lastMaintenance: maintenance,
        vehicleType: String(v.vehicle_type_id),
        fuelType: String(v.fuel_type_id),
        state: String(v.state_id),
        district: String(v.district_id),
        city: String(v.city_id),
        zone: String(v.zone_id),
        ward: String(v.ward_id),
        isActive: String(v.is_active),
      });

      const d = await districtApi.list({ params: { state_id: v.state_id } });
      const c = await cityApi.list({ params: { district_id: v.district_id } });
      const z = await zoneApi.list({ params: { city_id: v.city_id } });
      const w = await wardApi.list({ params: { zone_id: v.zone_id } });

      setDistricts(d);
      setCities(c);
      setZones(z);
      setWards(w);

      setInitialLoad(false);
    });
  }, [id]);

  /* ---------------- CASCADING ---------------- */
  useEffect(() => {
    if (!form.state || (isEdit && initialLoad)) return;
    districtApi.list({ params: { state_id: form.state } }).then(setDistricts);
    update("district", "");
    update("city", "");
    update("zone", "");
    update("ward", "");
    setCities([]); setZones([]); setWards([]);
  }, [form.state]);

  useEffect(() => {
    if (!form.district || (isEdit && initialLoad)) return;
    cityApi.list({ params: { district_id: form.district } }).then(setCities);
    update("city", "");
    update("zone", "");
    update("ward", "");
    setZones([]); setWards([]);
  }, [form.district]);

  useEffect(() => {
    if (!form.city || (isEdit && initialLoad)) return;
    zoneApi.list({ params: { city_id: form.city } }).then(setZones);
    update("zone", "");
    update("ward", "");
    setWards([]);
  }, [form.city]);

  useEffect(() => {
    if (!form.zone || (isEdit && initialLoad)) return;
    wardApi.list({ params: { zone_id: form.zone } }).then(setWards);
    update("ward", "");
  }, [form.zone]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

     if (!form.vehicleNo || !form.vehicleType || !form.fuelType) {
    Swal.fire(
      t("admin.vehicle_creation.missing_fields_title"),
      t("admin.vehicle_creation.missing_fields_desc"),
      "warning"
    );
    return;
  }

  if (form.driverNo && !/^\d{10}$/.test(form.driverNo)) {
    Swal.fire(
      t("admin.vehicle_creation.invalid_mobile_title"),
      t("admin.vehicle_creation.invalid_mobile_desc"),
      "warning"
    );
    return;
  }

    const payload = {
      vehicle_no: form.vehicleNo,
      chase_no: form.chaseNo,
      imei_no: form.imeiNo,
      driver_name: form.driverName,
      driver_no: form.driverNo,
      capacity: form.capacity,
      fuel_efficiency: form.fuelEfficiency,
      last_maintenance: form.lastMaintenance || null,
      vehicle_type_id: form.vehicleType,
      fuel_type_id: form.fuelType,
      state_id: form.state,
      district_id: form.district,
      city_id: form.city,
      zone_id: form.zone,
      ward_id: form.ward,
      is_active: form.isActive === "true",
      is_deleted: false,
    };

    try {
      setLoading(true);
      isEdit
        ? await vehicleApi.update(id as string, payload)
        : await vehicleApi.create(payload);

      Swal.fire(
        t("common.success"),
        t("admin.vehicle_creation.save_success"),
        "success"
      );
      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire(t("common.save_failed"), t("common.save_failed_desc"), "error");
    } finally {
      setLoading(false);
    }
  };

  const vt = filterActiveRecords(vehicleTypes, []);
  const ft = filterActiveRecords(fuelTypes, []);

  /* ---------------- UI ---------------- */
  const ShadcnSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
  }: any) => (
    <div>
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o: any) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <ComponentCard
      title={
        isEdit
          ? t("admin.vehicle_creation.title_edit")
          : t("admin.vehicle_creation.title_add")
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div><Label>{t("admin.vehicle_creation.vehicle_no")}</Label><Input value={form.vehicleNo} onChange={e=>update("vehicleNo",e.target.value)} /></div>
          <div><Label>{t("admin.vehicle_creation.chassis_no")}</Label><Input value={form.chaseNo} onChange={e=>update("chaseNo",e.target.value)} /></div>
          <div><Label>{t("admin.vehicle_creation.imei_no")}</Label><Input value={form.imeiNo} onChange={e=>update("imeiNo",e.target.value)} /></div>
          <div><Label>{t("admin.vehicle_creation.driver_name")}</Label><Input value={form.driverName} onChange={e=>update("driverName",e.target.value)} /></div>
          <div><Label>{t("admin.vehicle_creation.driver_mobile")}</Label><Input value={form.driverNo} 
              maxLength={10}
               pattern="[0-9]*"
        onChange={(e) => {
      const val = e.target.value.replace(/\D/g, "");
      update("driverNo", val);
    }} /></div>

          <div><Label>{t("admin.vehicle_creation.capacity")}</Label><Input value={form.capacity} onChange={e=>update("capacity",e.target.value)} /></div>
          <div><Label>{t("admin.vehicle_creation.fuel_efficiency")}</Label><Input value={form.fuelEfficiency} onChange={e=>update("fuelEfficiency",e.target.value)} /></div>
          <div><Label>{t("admin.vehicle_creation.last_maintenance")}</Label><Input type="date" value={form.lastMaintenance} onChange={e=>update("lastMaintenance",e.target.value)} /></div>

          <ShadcnSelect label={t("admin.vehicle_creation.vehicle_type")} value={form.vehicleType} onChange={(v:string)=>update("vehicleType",v)}
            placeholder={t("common.select_item_placeholder", { item: t("admin.vehicle_creation.vehicle_type") })}
            options={vt.map(v=>({value:resolveId(v),label:v.vehicleType}))} />

          <ShadcnSelect label={t("admin.vehicle_creation.fuel_type")} value={form.fuelType} onChange={(v:string)=>update("fuelType",v)}
            placeholder={t("common.select_item_placeholder", { item: t("admin.vehicle_creation.fuel_type") })}
            options={ft.map(f=>({value:resolveId(f),label:f.fuel_type}))} />

          <ShadcnSelect label={t("common.state")} value={form.state} onChange={(v:string)=>update("state",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.state") })}
            options={states.map(s=>({value:resolveId(s),label:s.name}))} />

          <ShadcnSelect label={t("common.district")} value={form.district} onChange={(v:string)=>update("district",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.district") })}
            options={districts.map(d=>({value:resolveId(d),label:d.name}))} />

          <ShadcnSelect label={t("common.city")} value={form.city} onChange={(v:string)=>update("city",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.city") })}
            options={cities.map(c=>({value:resolveId(c),label:c.name}))} />

          <ShadcnSelect label={t("common.zone")} value={form.zone} onChange={(v:string)=>update("zone",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.zone") })}
            options={zones.map(z=>({value:resolveId(z),label:z.name}))} />

          <ShadcnSelect label={t("common.ward")} value={form.ward} onChange={(v:string)=>update("ward",v)}
            placeholder={t("common.select_item_placeholder", { item: t("common.ward") })}
            options={wards.map(w=>({value:resolveId(w),label:w.name}))} />

          <ShadcnSelect label={t("common.status")} value={form.isActive} onChange={(v:string)=>update("isActive",v)}
            placeholder={t("common.select_status")}
            options={[
              { value: "true", label: t("common.active") },
              { value: "false", label: t("common.inactive") },
            ]} />

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-green-custom text-white px-4 py-2 rounded">
            {loading ? t("common.saving") : isEdit ? t("common.update") : t("common.save")}
          </button>
          <button type="button" onClick={()=>navigate(ENC_LIST_PATH)} className="bg-red-400 text-white px-4 py-2 rounded">
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
