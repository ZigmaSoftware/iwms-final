import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
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
import { adminApi } from "@/helpers/admin";

type Option = { value: string; label: string };

const encMasters = encryptSegment("masters");
const encDistricts = encryptSegment("districts");

const ENC_LIST_PATH = `/${encMasters}/${encDistricts}`;
const countryApi = adminApi.countries;
const stateApi = adminApi.states;
const districtApi = adminApi.districts;

export default function DistrictForm() {
  const [districtName, setDistrictName] = useState("");
  const [countryId, setCountryId] = useState<string>("");
  const [stateId, setStateId] = useState<string>("");
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);


  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Fetch active countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await countryApi.list();
        const activeCountries = res
          .filter((c: any) => c.is_active)
          .map((c: any) => ({
            value: c.unique_id,
            label: c.name,
          }));
        setCountries(activeCountries);
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    };
    fetchCountries();
  }, []);

  // Fetch existing district for edit mode
  useEffect(() => {
    if (!isEdit) return;

    const fetchDistrict = async () => {
      try {
        const data = await districtApi.get(id as string);

        setDistrictName(data.name);
        setIsActive(data.is_active);
        const resolvedCountry = data.country_id ?? data.country ?? "";
        const resolvedState = data.state_id ?? data.state ?? "";
        setCountryId(resolvedCountry);
        setStateId(resolvedState);
      } catch (err: any) {
        console.error("Error fetching district:", err);
        Swal.fire({
          icon: "error",
          title: "Failed to load district",
          text: err.response?.data?.detail || "Something went wrong!",
        });
      }
    };

    fetchDistrict();
  }, [id, isEdit]);

  // Fetch states when country changes
  useEffect(() => {
    if (!countryId) return;

    const fetchStates = async () => {
      try {
        const res = await stateApi.list({ params: { country: countryId } });
        const activeStates = res
          .filter((s: any) => s.is_active)
          .map((s: any) => ({ value: s.unique_id, label: s.name }));

        setStates(activeStates);
      } catch (err) {
        console.error("Error fetching states:", err);
        setStates([]);
      }
    };

    fetchStates();
  }, [countryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation BEFORE enabling loading or API call
    if (!countryId || !stateId || !districtName) {
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
        name: districtName.trim(),
        country: countryId,
        state: stateId,
        is_active: isActive,
      };

      console.log("Submitting payload:", payload);

      if (isEdit) {
        await districtApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await districtApi.create(payload);
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

      // Custom validation for duplicate district (state + name)
      if (data?.non_field_errors?.length) {
        const errMsg = data.non_field_errors[0];
        if (errMsg.includes("state, name must make a unique set")) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate District",
            text: "District name already exists for the selected state.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Save failed",
            text: errMsg,
          });
        }
      } else {
        let message = "Something went wrong while saving.";
        if (typeof data === "object" && data !== null) {
          message = Object.entries(data)
            .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
            .join("\n");
        } else if (typeof data === "string") {
          message = data;
        }
        Swal.fire({ icon: "error", title: "Save failed", text: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit District" : "Add District"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country */}
          <div>
            <Label htmlFor="country">
              Country <span className="text-red-500">*</span>
            </Label>

            <Select
              value={countryId === "" ? undefined : countryId}
              onValueChange={(val) => {
                setCountryId(val);
                setStateId("");
              }}
            >
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
            <Select
              value={stateId === "" ? undefined : stateId}
              onValueChange={(val) => setStateId(val)}
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

          {/* District Name */}
          <div>
            <Label htmlFor="districtName">
              District Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="districtName"
              type="text"
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder="Enter district name"
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
