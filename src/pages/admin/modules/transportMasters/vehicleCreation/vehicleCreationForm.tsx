import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {desktopApi} from "@/api";
import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { getEncryptedRoute } from "@/utils/routeCache";
import { filterActiveRecords } from "@/utils/customerUtils";

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

  // Prevents cascading resets during edit mode
  const [initialLoad, setInitialLoad] = useState(true);

  const parseIdValue = (value: string | number | undefined) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  // ===============================
  // Load base dropdowns & edit data
  // ===============================
  useEffect(() => {
    // Load static dropdowns
    Promise.all([desktopApi.get("vehicle-type/"), desktopApi.get("fuels/")])
      .then(([vtypeRes, fuelRes]) => {
        setVehicleTypes(vtypeRes.data);
        setFuelTypes(fuelRes.data);
      })
      .catch(() => Swal.fire("Error", "Failed to load vehicle/fuel types", "error"));

    // Load states
    desktopApi
      .get("states/")
      .then((res) => setStates(res.data))
      .catch(() => Swal.fire("Error", "Failed to load states", "error"));

    // Editing case
    if (isEdit) {
      desktopApi
        .get(`vehicle-creation/${id}/`)
        .then(async (res) => {
          const v = res.data;

          // Set all fields
          setVehicleNo(v.vehicle_no);
          setChaseNo(v.chase_no);
          setImeiNo(v.imei_no);
          setDriverName(v.driver_name);
          setDriverNo(v.driver_no);
          setVehicleType(String(v.vehicle_type));
          setFuelType(String(v.fuel_type));

          setState(v.state);
          setDistrict(v.district);
          setCity(v.city);
          setZone(v.zone);
          setWard(v.ward);
          setIsActive(v.is_active);

          // Now load dependent dropdowns in correct order
          const distRes = await desktopApi.get(`districts/?state_id=${v.state}`);
          setDistricts(distRes.data);

          const cityRes = await desktopApi.get(`cities/?district_id=${v.district}`);
          setCities(cityRes.data);

          const zoneRes = await desktopApi.get(`zones/?city_id=${v.city}`);
          setZones(zoneRes.data);

          const wardRes = await desktopApi.get(`wards/?zone_id=${v.zone}`);
          setWards(wardRes.data);

          setInitialLoad(false);
        })
        .catch(() => Swal.fire("Error", "Failed to load vehicle details", "error"));
    } else {
      setInitialLoad(false);
    }
  }, [id, isEdit]);

  // ===============================
  // Cascading Logic – Safe for Edit
  // ===============================

  useEffect(() => {
    if (!state || initialLoad) return;

    desktopApi.get(`districts/?state_id=${state}`).then((res) => setDistricts(res.data));

    setDistrict("");
    setCity("");
    setZone("");
    setWard("");
    setCities([]);
    setZones([]);
    setWards([]);
  }, [state]);

  useEffect(() => {
    if (!district || initialLoad) return;

    desktopApi.get(`cities/?district_id=${district}`).then((res) => setCities(res.data));

    setCity("");
    setZone("");
    setWard("");
    setZones([]);
    setWards([]);
  }, [district]);

  useEffect(() => {
    if (!city || initialLoad) return;

    desktopApi.get(`zones/?city_id=${city}`).then((res) => setZones(res.data));

    setZone("");
    setWard("");
    setWards([]);
  }, [city]);

  useEffect(() => {
    if (!zone || initialLoad) return;

    desktopApi.get(`wards/?zone_id=${zone}`).then((res) => setWards(res.data));

    setWard("");
  }, [zone]);

  // ===============================
  // Submit
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !vehicleNo ||
      !chaseNo ||
      !imeiNo ||
      !driverName ||
      !driverNo ||
      !vehicleType ||
      !fuelType ||
      !state ||
      !district ||
      !city ||
      !zone ||
      !ward
    ) {
      Swal.fire("Missing Fields", "Please complete all required fields.", "warning");
      return;
    }
    if (!/^\d{10}$/.test(driverNo)) {
      Swal.fire(
        "Invalid Mobile Number",
        "Driver mobile number must be exactly 10 digits.",
        "warning"
      );
      return;
    }

    const payload = {
      vehicle_no: vehicleNo,
      chase_no: chaseNo,
      imei_no: imeiNo,
      driver_name: driverName,
      driver_no: driverNo,
      vehicle_type: vehicleType,
      fuel_type: fuelType,
      state,
      district,
      city,
      zone,
      ward,
      is_active: isActive,
      is_deleted: false,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await desktopApi.put(`vehicle-creation/${id}/`, payload);
        Swal.fire("Updated", "Vehicle updated successfully", "success");
      } else {
        await desktopApi.post("vehicle-creation/", payload);
        Swal.fire("Success", "Vehicle added successfully", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        typeof error.response?.data === "object"
          ? Object.entries(error.response.data)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join("\n")
          : error.response?.data?.detail || "Save failed.";

      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Render
  // ===============================
  const vehicleTypeId = parseIdValue(vehicleType);
  const fuelTypeId = parseIdValue(fuelType);

  const vehicleTypeOptions = filterActiveRecords(
    vehicleTypes,
    vehicleTypeId !== null ? [vehicleTypeId] : []
  );
  const fuelTypeOptions = filterActiveRecords(
    fuelTypes,
    fuelTypeId !== null ? [fuelTypeId] : []
  );

  return (
    <ComponentCard title={isEdit ? "Edit Vehicle" : "Add Vehicle"}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <Label>Vehicle No *</Label>
            <Input value={vehicleNo} required onChange={(e) => setVehicleNo(e.target.value)} />
          </div>

          <div>
            <Label>Chassis No *</Label>
            <Input value={chaseNo} required onChange={(e) => setChaseNo(e.target.value)} />
          </div>

          <div>
            <Label>IMEI No *</Label>
            <Input value={imeiNo} required onChange={(e) => setImeiNo(e.target.value)} />
          </div>

          <div>
            <Label>Driver Name *</Label>
            <Input value={driverName} required onChange={(e) => setDriverName(e.target.value)} />
          </div>

          <div>
            <Label>Driver Mobile No *</Label>
            <Input value={driverNo} required onChange={(e) => setDriverNo(e.target.value)} />
          </div>

          <div>
            <Label>Vehicle Type *</Label>
            <Select
              value={vehicleType}
              required
              onChange={setVehicleType}
              options={vehicleTypeOptions.map((v) => ({
                value: String(v.id),
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
                value: String(f.id),
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
              options={states.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div>
            <Label>District *</Label>
            <Select
              value={district}
              required
              onChange={setDistrict}
              options={districts.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>

          <div>
            <Label>City *</Label>
            <Select
              value={city}
              required
              onChange={setCity}
              options={cities.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div>
            <Label>Zone *</Label>
            <Select
              value={zone}
              required
              onChange={setZone}
              options={zones.map((z) => ({ value: z.id, label: z.name }))}
            />
          </div>

          <div>
            <Label>Ward *</Label>
            <Select
              value={ward}
              required
              onChange={setWard}
              options={wards.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>

          <div>
            <Label>Active Status *</Label>
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
