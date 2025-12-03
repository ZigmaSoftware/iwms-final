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
const encZones = encryptSegment("zones");

const ENC_LIST_PATH = `/${encMasters}/${encZones}`;

function ZoneForm() {
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
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

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  //  Load Countries
  useEffect(() => {
    desktopApi
      .get("countries/")
      .then((res) => {
        const data = res.data
          .filter((c: any) => c.is_active)
          .map((c: any) => ({ value: c.id.toString(), label: c.name }));
        setCountries(data);
      })
      .catch((err) => console.error("Error fetching countries:", err));
  }, []);

  //  Load States when country changes
  useEffect(() => {
    if (!countryId) {
      setStates([]);
      setDistricts([]);
      setCities([]);
      return;
    }
    desktopApi
      .get(`states/?country=${countryId}`)
      .then((res) => {
        const data = res.data
          .filter((s: any) => s.is_active)
          .map((s: any) => ({ value: s.id.toString(), label: s.name }));
        console.log(data);
        setStates(data);
      })
      .catch((err) => console.error("Error fetching states:", err));
  }, [countryId]);

  //  Load Districts when state changes
  useEffect(() => {
    if (!stateId) {
      setDistricts([]);
      setCities([]);
      return;
    }
    desktopApi
      .get(`districts/?state=${stateId}`)
      .then((res) => {
        const data = res.data
          .filter((d: any) => d.is_active)
          .map((d: any) => ({ value: d.id.toString(), label: d.name }));
        setDistricts(data);
      })
      .catch((err) => console.error("Error fetching districts:", err));
  }, [stateId]);

  //  Load Cities when district changes
  useEffect(() => {
    if (!districtId) {
      setCities([]);
      return;
    }
    desktopApi
      .get(`cities/?district=${districtId}`)
      .then((res) => {
        const data = res.data
          .filter((c: any) => c.is_active)
          .map((c: any) => ({ value: c.id.toString(), label: c.name }));
        setCities(data);
      })
      .catch((err) => console.error("Error fetching cities:", err));
  }, [districtId]);

  //  Load Zone details when editing
  useEffect(() => {
    if (isEdit) {
      desktopApi
        .get(`zones/${id}/`)
        .then((res) => {
          const z = res.data;
          setName(z.name);
          setIsActive(z.is_active);
          setCountryId(z.country?.toString() || "");
          setStateId(z.state?.toString() || "");
          setDistrictId(z.district?.toString() || "");
          setCityId(z.city?.toString() || "");
          setDescription(z.description || "");
        })
        .catch((err) => {
          console.error("Error fetching zone:", err);
          Swal.fire({
            icon: "error",
            title: "Failed to load zone",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit]);

  //  Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation BEFORE enabling loading or API call
    if (!countryId || !stateId || !name || !cityId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all the required fields before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return; // Stop here if validation fails
    }
    setLoading(true);

    try {
      const payload = {
        name,
        country: countryId,
        state: stateId,
        district: districtId,
        city: cityId,
        description,
        is_active: isActive,
      };
      console.log(payload);

      if (isEdit) {
        await desktopApi.put(`zones/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await desktopApi.post("zones/", payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Failed to save zone:", error);
      const data = error.response?.data;
      let message = "Something went wrong while saving.";

      // Convert backend response to readable text
      if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
          .join("\n");
      } else if (typeof data === "string") {
        message = data;
      }

      const errMsg = message.toLowerCase();

      // Custom duplicate check for unique constraint
      if (errMsg.includes("city, name must make a unique set")) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Zone",
          text: "Zone name already exists for the selected city.",
        });
      } else if (errMsg.includes("state, name must make a unique set")) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Zone",
          text: "Zone name already exists for the selected state.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Save failed",
          text: message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Zone" : "Add Zone"}>
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

          {/*  State */}
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

          {/*  District */}
          <div>
            <Label htmlFor="district">District</Label>
            <Select
              value={districtId || undefined}
              onValueChange={(val) => setDistrictId(val)}
            >
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

          {/*  City */}
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

          {/*  Zone Name */}
          <div>
            <Label htmlFor="zoneName">
              Zone Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="zoneName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Zone Name"
              required
            />
          </div>

          {/* Active Status */}
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
          {/*  Description */}
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

export default ZoneForm;
