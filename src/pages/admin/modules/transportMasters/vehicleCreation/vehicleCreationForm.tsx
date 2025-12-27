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

const vehicleTypeApi = adminApi.vehicleTypes;
const fuelTypeApi = adminApi.fuels;
const stateApi = adminApi.states;
const districtApi = adminApi.districts;
const cityApi = adminApi.cities;
const zoneApi = adminApi.zones;
const wardApi = adminApi.wards;
const vehicleApi = adminApi.vehicleCreation;

export default function VehicleCreationForm() {
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
    Swal.fire("Missing Fields", "Required fields missing", "warning");
    return;
  }

  if (form.driverNo && !/^\d{10}$/.test(form.driverNo)) {
    Swal.fire(
      "Invalid Mobile Number",
      "Driver mobile number must be exactly 10 digits",
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

      Swal.fire("Success", "Saved successfully", "success");
      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire("Error", "Save failed", "error");
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
    <ComponentCard title={isEdit ? "Edit Vehicle" : "Add Vehicle"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div><Label>Vehicle No</Label><Input value={form.vehicleNo} onChange={e=>update("vehicleNo",e.target.value)} /></div>
          <div><Label>Chassis No</Label><Input value={form.chaseNo} onChange={e=>update("chaseNo",e.target.value)} /></div>
          <div><Label>IMEI No</Label><Input value={form.imeiNo} onChange={e=>update("imeiNo",e.target.value)} /></div>
          <div><Label>Driver Name</Label><Input value={form.driverName} onChange={e=>update("driverName",e.target.value)} /></div>
          <div><Label>Driver Mobile</Label><Input value={form.driverNo} 
              maxLength={10}
               pattern="[0-9]*"
        onChange={(e) => {
      const val = e.target.value.replace(/\D/g, "");
      update("driverNo", val);
    }} /></div>

          <div><Label>Capacity</Label><Input value={form.capacity} onChange={e=>update("capacity",e.target.value)} /></div>
          <div><Label>Fuel Efficiency</Label><Input value={form.fuelEfficiency} onChange={e=>update("fuelEfficiency",e.target.value)} /></div>
          <div><Label>Last Maintenance</Label><Input type="date" value={form.lastMaintenance} onChange={e=>update("lastMaintenance",e.target.value)} /></div>

          <ShadcnSelect label="Vehicle Type" value={form.vehicleType} onChange={(v:string)=>update("vehicleType",v)}
            placeholder="Select vehicle type"
            options={vt.map(v=>({value:resolveId(v),label:v.vehicleType}))} />

          <ShadcnSelect label="Fuel Type" value={form.fuelType} onChange={(v:string)=>update("fuelType",v)}
            placeholder="Select fuel type"
            options={ft.map(f=>({value:resolveId(f),label:f.fuel_type}))} />

          <ShadcnSelect label="State" value={form.state} onChange={(v:string)=>update("state",v)}
            placeholder="Select state"
            options={states.map(s=>({value:resolveId(s),label:s.name}))} />

          <ShadcnSelect label="District" value={form.district} onChange={(v:string)=>update("district",v)}
            placeholder="Select district"
            options={districts.map(d=>({value:resolveId(d),label:d.name}))} />

          <ShadcnSelect label="City" value={form.city} onChange={(v:string)=>update("city",v)}
            placeholder="Select city"
            options={cities.map(c=>({value:resolveId(c),label:c.name}))} />

          <ShadcnSelect label="Zone" value={form.zone} onChange={(v:string)=>update("zone",v)}
            placeholder="Select zone"
            options={zones.map(z=>({value:resolveId(z),label:z.name}))} />

          <ShadcnSelect label="Ward" value={form.ward} onChange={(v:string)=>update("ward",v)}
            placeholder="Select ward"
            options={wards.map(w=>({value:resolveId(w),label:w.name}))} />

          <ShadcnSelect label="Status" value={form.isActive} onChange={(v:string)=>update("isActive",v)}
            placeholder="Select status"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]} />

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-green-custom text-white px-4 py-2 rounded">
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
          <button type="button" onClick={()=>navigate(ENC_LIST_PATH)} className="bg-red-400 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
