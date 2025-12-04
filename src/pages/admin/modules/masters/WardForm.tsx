import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { desktopApi } from "@/api";
import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encryptSegment } from "@/utils/routeCrypto";


const encMasters = encryptSegment("masters");
const encWards = encryptSegment("wards");

const ENC_LIST_PATH = `/${encMasters}/${encWards}`;


function WardForm() {
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  const [countries, setCountries] = useState<
    { value: string; label: string }[]
  >([]);
  const [states, setStates] = useState<{ value: string; label: string }[]>([]);
  const [districts, setDistricts] = useState<
    { value: string; label: string }[]
  >([]);
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [zones, setZones] = useState<{ value: string; label: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Countries
  useEffect(() => {
    desktopApi
      .get("countries/")
      .then((res) => {
        const data = res.data
          .filter((c: any) => c.is_active)
          .map((c: any) => ({ value: c.unique_id, label: c.name }));
        setCountries(data);
      })
      .catch((err) => console.error("Error fetching countries:", err));
  }, []);

  // States by country
  useEffect(() => {
    setStates([]);
    setDistricts([]);
    setCities([]);
    setZones([]);
    setStateId("");
    setDistrictId("");
    setCityId("");
    setZoneId("");
    if (!countryId) return;
    desktopApi
      .get(`states/?country=${countryId}`)
      .then((res) => {
        const data = res.data
          .filter((s: any) => s.is_active)
          .map((s: any) => ({ value: s.unique_id, label: s.name }));
        setStates(data);
      })
      .catch((err) => console.error("Error fetching states:", err));
  }, [countryId]);

  // Districts by state
  useEffect(() => {
    setDistricts([]);
    setCities([]);
    setZones([]);
    setDistrictId("");
    setCityId("");
    setZoneId("");
    if (!stateId) return;
    desktopApi
      .get(`districts/?state=${stateId}`)
      .then((res) => {
        const data = res.data
          .filter((d: any) => d.is_active)
          .map((d: any) => ({ value: d.unique_id, label: d.name }));
        setDistricts(data);
      })
      .catch((err) => console.error("Error fetching districts:", err));
  }, [stateId]);

  // Cities by district
  useEffect(() => {
    setCities([]);
    setZones([]);
    setCityId("");
    setZoneId("");
    if (!districtId) return;
    desktopApi
      .get(`cities/?district=${districtId}`)
      .then((res) => {
        const data = res.data
          .filter((c: any) => c.is_active)
          .map((c: any) => ({ value: c.unique_id, label: c.name }));
        setCities(data);
      })
      .catch((err) => console.error("Error fetching cities:", err));
  }, [districtId]);

  // Zones by city (your ZoneViewSet supports ?city=)
  useEffect(() => {
    setZones([]);
    setZoneId("");
    if (!cityId) return;
    desktopApi
      .get(`zones/?city=${cityId}`)
      .then((res) => {
        const data = res.data
          .filter((z: any) => z.is_active && !z.is_deleted)
          .map((z: any) => ({ value: z.unique_id, label: z.name }));
        setZones(data);
      })
      .catch((err) => console.error("Error fetching zones:", err));
  }, [cityId]);

  // Load Ward for edit
  useEffect(() => {
    if (!isEdit) return;
    desktopApi
      .get(`wards/${id}/`)
      .then(async (res) => {
        const w = res.data;
        setName(w.name);
        setIsActive(w.is_active);
        setDescription(w.description || "");

        // Preload cascading selects for edit (ensure option lists exist before setting IDs)
        const loadCascade = async () => {
          // country
          if (w.country_id) {
            setCountryId(String(w.country_id));
            const statesRes = await desktopApi.get(`states/?country=${w.country_id}`);
            setStates(
              statesRes.data
                .filter((s: any) => s.is_active)
                .map((s: any) => ({ value: s.unique_id, label: s.name }))
            );
          }
          // state
          if (w.state_id) {
            setStateId(String(w.state_id));
            const dRes = await desktopApi.get(`districts/?state=${w.state_id}`);
            setDistricts(
              dRes.data
                .filter((d: any) => d.is_active)
                .map((d: any) => ({ value: d.unique_id, label: d.name }))
            );
          }
          // district
          if (w.district_id) {
            setDistrictId(String(w.district_id));
            const cRes = await desktopApi.get(`cities/?district=${w.district_id}`);
            setCities(
              cRes.data
                .filter((c: any) => c.is_active)
                .map((c: any) => ({ value: c.unique_id, label: c.name }))
            );
          }
          // city
          if (w.city_id) {
            setCityId(String(w.city_id));
            const zRes = await desktopApi.get(`zones/?city=${w.city_id}`);
            setZones(
              zRes.data
                .filter((z: any) => z.is_active && !z.is_deleted)
                .map((z: any) => ({ value: z.unique_id, label: z.name }))
            );
          }
          // zone
          if (w.zone_id) setZoneId(String(w.zone_id));
        };

        await loadCascade();
      })
      .catch((err) => {
        console.error("Error fetching ward:", err);
        Swal.fire({
          icon: "error",
          title: "Failed to load ward",
          text: err.response?.data?.detail || "Something went wrong!",
        });
      });
  }, [id, isEdit]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guardrails: keep it tight
    if (!countryId || !stateId || !name) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Country, State and Ward Name are mandatory.",
      });
      return;
    }
    if (!cityId && !zoneId) {
      Swal.fire({
        icon: "warning",
        title: "Geography Incomplete",
        text: "Select City (and Zone if applicable).",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        country: countryId,
        state: stateId,
        district: districtId || null,
        city: cityId || null,
        zone: zoneId || null,
        description,
        is_active: isActive,
      };
      console.log(payload);

      if (isEdit) {
        await desktopApi.put(`wards/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await desktopApi.post("wards/", payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Failed to save ward:", error);
      const data = error.response?.data;
      let message = "Something went wrong while saving.";

      if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
          .join("\n");
      } else if (typeof data === "string") {
        message = data;
      }

      const errMsg = message.toLowerCase();
      if (
        errMsg.includes("ward name already exists") ||
        errMsg.includes("duplicate")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Ward",
          text: "Ward name already exists in the selected scope.",
        });
      } else {
        Swal.fire({ icon: "error", title: "Save failed", text: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Ward" : "Add Ward"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country */}
          <div>
            <Label htmlFor="country">
              Country <span className="text-red-500">*</span>
            </Label>
            <Select value={countryId || undefined} onValueChange={(val) => setCountryId(val)}>
              <SelectTrigger className="input-validate w-full" id="country">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state">
              State <span className="text-red-500">*</span>
            </Label>
            <Select value={stateId || undefined} onValueChange={(val) => setStateId(val)}>
              <SelectTrigger className="input-validate w-full" id="state">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div>
            <Label htmlFor="district">District</Label>
            <Select value={districtId || undefined} onValueChange={(val) => setDistrictId(val)}>
              <SelectTrigger className="input-validate w-full" id="district">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city">City</Label>
            <Select value={cityId || undefined} onValueChange={(val) => setCityId(val)}>
              <SelectTrigger className="input-validate w-full" id="city">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone */}
          <div>
            <Label htmlFor="zone">Zone</Label>
            <Select value={zoneId || undefined} onValueChange={(val) => setZoneId(val)}>
              <SelectTrigger className="input-validate w-full" id="zone">
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.value} value={z.value}>
                    {z.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ward Name */}
          <div>
            <Label htmlFor="wardName">
              Ward Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wardName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Ward Name"
              required
            />
          </div>

          {/* Active */}
          <div>
            <Label htmlFor="isActive">Active Status</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
            >
              <SelectTrigger className="input-validate w-full" id="isActive">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-200 outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>
          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default WardForm;
