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

type Option = { value: number; label: string };

const encMasters = encryptSegment("masters");
const encCities = encryptSegment("cities");

const ENC_LIST_PATH = `/${encMasters}/${encCities}`;


function CityForm() {
  const [cityName, setCityName] = useState("");
  const [countryId, setCountryId] = useState<number | "">("");
  const [stateId, setStateId] = useState<number | "">("");
  const [districtId, setDistrictId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  //  Fetch active countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await desktopApi.get("countries/");
        const data = res.data
          .filter((c: any) => c.is_active)
          .map((c: any) => ({ value: c.id, label: c.name }));
        setCountries(data);
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    };
    fetchCountries();
  }, []);

  //  Fetch city details (Edit mode)
  useEffect(() => {
    if (!isEdit) return;

    const fetchCity = async () => {
      try {
        const res = await desktopApi.get(`cities/${id}/`);
        const data = res.data;

        setCityName(data.name);
        setCountryId(data.country);
        setStateId(data.state);
        setIsActive(data.is_active);

        //  Fetch districts for this state before setting districtId
        if (data.state) {
          const districtRes = await desktopApi.get(`districts/?state=${data.state}`);
          const districtOptions = districtRes.data
            .filter((d: any) => d.is_active)
            .map((d: any) => ({ value: d.id, label: d.name }));

          setDistricts(districtOptions);
          setDistrictId(data.district);
        }
      } catch (err: any) {
        console.error("Error fetching city:", err);
        Swal.fire({
          icon: "error",
          title: "Failed to load city",
          text: err.response?.data?.detail || "Something went wrong!",
        });
      }
    };

    fetchCity();
  }, [id, isEdit]);

  // Fetch states when country changes
  useEffect(() => {
    if (!countryId) return;

    const fetchStates = async () => {
      try {
        const res = await desktopApi.get(`states/?country=${countryId}`);
        const data = res.data
          .filter((s: any) => s.is_active)
          .map((s: any) => ({ value: s.id, label: s.name }));
        setStates(data);
      } catch (err) {
        console.error("Error fetching states:", err);
        setStates([]);
      }
    };

    fetchStates();
    setStateId("");
    setDistrictId("");
    setDistricts([]);
  }, [countryId]);

  // Fetch districts when state changes
  useEffect(() => {
    if (!stateId) return;

    const fetchDistricts = async () => {
      try {
        const res = await desktopApi.get(`districts/?state=${stateId}`);
        const data = res.data
          .filter((d: any) => d.is_active)
          .map((d: any) => ({ value: d.id, label: d.name }));
        setDistricts(data);

        // Only clear selected district when adding new city
        if (!isEdit) setDistrictId("");
      } catch (err) {
        console.error("Error fetching districts:", err);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [stateId]);

  // 🔹 Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 Basic validation BEFORE enabling loading or API call
    if (!countryId || !stateId || !districtId || !cityName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all the required fields before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return; //  Stop here if validation fails
    }

    setLoading(true); //  Only set loading if validation passed

    try {
      const payload = {
        name: cityName.trim(),
        country: countryId,
        state: stateId,
        district: districtId || null,
        is_active: isActive,
      };

      console.log("Submitting payload:", payload);

      if (isEdit) {
        await desktopApi.put(`cities/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await desktopApi.post("cities/", payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Failed to save:", error);
      const data = error.response?.data;

      if (data?.non_field_errors?.length) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Entry",
          text: data.non_field_errors[0],
        });
      } else {
        let message = "Something went wrong while saving.";
        if (typeof data === "object" && data !== null) {
          message = Object.entries(data)
            .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
            .join("\n");
        }
        Swal.fire({ icon: "error", title: "Save failed", text: message });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render form
  return (
    <ComponentCard title={isEdit ? "Edit City" : "Add City"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country */}
          <div>
            <Label htmlFor="country">
              Country <span className="text-red-500">*</span>
            </Label>
            <Select
              value={countryId === "" ? undefined : String(countryId)}
              onValueChange={(val) => setCountryId(Number(val))}
            >
              <SelectTrigger className="input-validate w-full" id="country">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={String(c.value)}>
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
            <Select
              value={stateId === "" ? undefined : String(stateId)}
              onValueChange={(val) => setStateId(Number(val))}
              disabled={!countryId}
            >
              <SelectTrigger className="input-validate w-full" id="state">
                <SelectValue
                  placeholder={countryId ? "Select State" : "Select Country First"}
                />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div>
            <Label htmlFor="district">
              District <span className="text-red-500">*</span>
            </Label>
            <Select
              value={districtId === "" ? undefined : String(districtId)}
              onValueChange={(val) => setDistrictId(Number(val))}
              disabled={!stateId}
            >
              <SelectTrigger className="input-validate w-full" id="district">
                <SelectValue
                  placeholder={stateId ? "Select District" : "Select State First"}
                />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Name */}
          <div>
            <Label htmlFor="cityName">
              City Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cityName"
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter city name"
              className="input-validate w-full"
              required
            />
          </div>

          {/* Active Status */}
          <div>
            <Label htmlFor="isActive">
              Active Status <span className="text-red-500">*</span>
            </Label>
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

export default CityForm;
