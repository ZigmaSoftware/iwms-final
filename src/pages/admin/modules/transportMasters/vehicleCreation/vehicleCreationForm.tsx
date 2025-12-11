import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
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
  const [vehicleNo, setVehicleNo] = useState("");
  const [chaseNo, setChaseNo] = useState("");
  const [imeiNo, setImeiNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverNo, setDriverNo] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [ward, setWard] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [fuelTypes, setFuelTypes] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const navigate = useNavigate();
  const { encTransportMaster, encVehicleCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encTransportMaster}/${encVehicleCreation}`;

  const { id } = useParams();
  const isEdit = Boolean(id);

  const [initialLoad, setInitialLoad] = useState(true);

  const resolveId = (item: any) => {
    if (!item) return "";
    const raw =
      item.unique_id ??
      item.uniqueId ??
      item.id ??
      item.value ??
      item.code ??
      item.pk ??
      "";
    return raw === null || raw === undefined ? "" : String(raw);
  };

  useEffect(() => {
    Promise.all([vehicleTypeApi.list(), fuelTypeApi.list()]).then(
      ([vtypeRes, fuelRes]) => {
        setVehicleTypes(vtypeRes);
        setFuelTypes(fuelRes);
      }
    );

    stateApi.list().then((res) => setStates(res));

    if (isEdit) {
      vehicleApi.get(id as string).then(async (v) => {
        setVehicleNo(v.vehicle_no);
        setChaseNo(v.chase_no);
        setImeiNo(v.imei_no);
        setDriverName(v.driver_name);
        setDriverNo(v.driver_no);
        setVehicleType(String((v as any).vehicle_type_id ?? v.vehicle_type ?? ""));
        setFuelType(String((v as any).fuel_type_id ?? v.fuel_type ?? ""));

        setState(String((v as any).state_id ?? v.state ?? ""));
        setDistrict(String((v as any).district_id ?? v.district ?? ""));
        setCity(String((v as any).city_id ?? v.city ?? ""));
        setZone(String((v as any).zone_id ?? v.zone ?? ""));
        setWard(String((v as any).ward_id ?? v.ward ?? ""));
        setIsActive(v.is_active);

        const distRes = await districtApi.list({ params: { state_id: v.state_id ?? v.state } });
        setDistricts(distRes);

        const cityRes = await cityApi.list({ params: { district_id: v.district_id ?? v.district } });
        setCities(cityRes);

        const zoneRes = await zoneApi.list({ params: { city_id: v.city_id ?? v.city } });
        setZones(zoneRes);

        const wardRes = await wardApi.list({ params: { zone_id: v.zone_id ?? v.zone } });
        setWards(wardRes);

        setInitialLoad(false);
      });
    } else {
      setInitialLoad(false);
    }
  }, [id]);

  /* ================================
        CASCADING DROPDOWNS
  ================================ */

  useEffect(() => {
    if (!state || (isEdit && initialLoad)) return;

    districtApi.list({ params: { state_id: state } }).then((res) => setDistricts(res));

    setDistrict("");
    setCity("");
    setZone("");
    setWard("");
    setCities([]);
    setZones([]);
    setWards([]);
  }, [state]);

  useEffect(() => {
    if (!district || (isEdit && initialLoad)) return;

    cityApi.list({ params: { district_id: district } }).then((res) => setCities(res));

    setCity("");
    setZone("");
    setWard("");
    setZones([]);
    setWards([]);
  }, [district]);

  useEffect(() => {
    if (!city || (isEdit && initialLoad)) return;

    zoneApi.list({ params: { city_id: city } }).then((res) => setZones(res));

    setZone("");
    setWard("");
    setWards([]);
  }, [city]);

  useEffect(() => {
    if (!zone || (isEdit && initialLoad)) return;

    wardApi.list({ params: { zone_id: zone } }).then((res) => setWards(res));

    setWard("");
  }, [zone]);

  /* ================================
        SUBMIT
  ================================ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleNo || !vehicleType || !fuelType) {
      Swal.fire("Missing Fields", "Vehicle number, vehicle type, and fuel type are required.", "warning");
      return;
    }

    if (!state || !district || !city || !zone || !ward) {
      Swal.fire("Missing Fields", "Please select state, district, city, zone, and ward.", "warning");
      return;
    }

    if (driverNo && !/^\d{10}$/.test(driverNo)) {
      Swal.fire("Invalid Mobile Number", "Driver mobile number must be 10 digits.", "warning");
      return;
    }

    const payload = {
      vehicle_no: vehicleNo,
      chase_no: chaseNo,
      imei_no: imeiNo,
      driver_name: driverName,
      driver_no: driverNo,

      vehicle_type_id: vehicleType,
      fuel_type_id: fuelType,

      state_id: state,
      district_id: district,
      city_id: city,
      zone_id: zone,
      ward_id: ward,

      is_active: isActive,
      is_deleted: false,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await vehicleApi.update(id as string, payload);
        Swal.fire("Updated", "Vehicle updated successfully", "success");
      } else {
        await vehicleApi.create(payload);
        Swal.fire("Success", "Vehicle added successfully", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        (error?.response?.data &&
          Object.entries(error.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n")) ||
        "Save failed.";
      Swal.fire("Error", detail, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================================
        RENDER
  ================================ */

  const vehicleTypeOptions = filterActiveRecords(vehicleTypes, []);
  const fuelTypeOptions = filterActiveRecords(fuelTypes, []);

  return (
    <ComponentCard title={isEdit ? "Edit Vehicle" : "Add Vehicle"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <Label>Vehicle No *</Label>
            <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} required />
          </div>

          <div>
            <Label>Chassis No *</Label>
            <Input value={chaseNo} onChange={(e) => setChaseNo(e.target.value)} required />
          </div>

          <div>
            <Label>IMEI No *</Label>
            <Input value={imeiNo} onChange={(e) => setImeiNo(e.target.value)} required />
          </div>

          <div>
            <Label>Driver Name *</Label>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
          </div>

          <div>
            <Label>Driver Mobile No *</Label>
            <Input value={driverNo} onChange={(e) => setDriverNo(e.target.value)} required />
          </div>

          <div>
            <Label>Vehicle Type *</Label>
            <Select
              value={vehicleType}
              required
              onChange={setVehicleType}
              options={vehicleTypeOptions.map((v) => ({
                value: resolveId(v),
                label: v.vehicleType,
              }))}
            />
          </div>

          <div>
            <Label>Fuel Type *</Label>
            <Select
              value={fuelType}
              required
              onChange={setFuelType}
              options={fuelTypeOptions.map((f) => ({
                value: resolveId(f),
                label: f.fuel_type,
              }))}
            />
          </div>

          <div>
            <Label>State *</Label>
            <Select
              value={state}
              required
              onChange={setState}
              options={states.map((s) => ({ value: resolveId(s), label: s.name }))}
            />
          </div>

          <div>
            <Label>District *</Label>
            <Select
              value={district}
              required
              onChange={setDistrict}
              options={districts.map((d) => ({ value: resolveId(d), label: d.name }))}
            />
          </div>

          <div>
            <Label>City *</Label>
            <Select
              value={city}
              required
              onChange={setCity}
              options={cities.map((c) => ({ value: resolveId(c), label: c.name }))}
            />
          </div>

          <div>
            <Label>Zone *</Label>
            <Select
              value={zone}
              required
              onChange={setZone}
              options={zones.map((z) => ({ value: resolveId(z), label: z.name }))}
            />
          </div>

          <div>
            <Label>Ward *</Label>
            <Select
              value={ward}
              required
              onChange={setWard}
              options={wards.map((w) => ({ value: resolveId(w), label: w.name }))}
            />
          </div>

          <div>
            <Label>Status *</Label>
            <select
              value={isActive ? "Active" : "Inactive"}
              onChange={(e) => setIsActive(e.target.value === "Active")}
              className="w-full px-3 py-2 border border-green-400 rounded-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded"
          >
            {loading ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
          </button>

          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
