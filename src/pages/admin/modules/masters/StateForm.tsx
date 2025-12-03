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
const encStates = encryptSegment("states");

const ENC_LIST_PATH = `/${encMasters}/${encStates}`;

function StateForm() {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [countryId, setCountryId] = useState(""); // selected Country
  const [countries, setCountries] = useState<
    { value: string; label: string }[]
  >([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  //  Load country list from backend
  useEffect(() => {
    desktopApi
      .get("countries/")
      .then((res) => {
        const activeCountries = res.data
          .filter((c: any) => c.is_active) // only active ones
          .map((c: any) => ({
            value: c.id.toString(),
            label: `${c.name}`,
          }));
        setCountries(activeCountries);
      })
      .catch((err) => console.error("Error fetching countries:", err));
  }, []);

  //  Load existing country for editing
  useEffect(() => {
    if (isEdit) {
      desktopApi
        .get(`states/${id}/`)
        .then((res) => {
          setName(res.data.name);
          setIsActive(res.data.is_active);
          setLabel(res.data.label);
          setCountryId(res.data.country?.toString() || "");
        })
        .catch((err) => {
          console.error("Error fetching state:", err);
          Swal.fire({
            icon: "error",
            title: "Failed to load state",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit, countries]);

  //  Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        country: countryId, // sending continent foreign key
        is_active: isActive,
        label: label,
      };

      if (isEdit) {
        await desktopApi.put(`states/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await desktopApi.post("states/", payload);
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
      let message = "Something went wrong while saving.";

      if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
          .join("\n");
      } else if (typeof data === "string") {
        message = data;
      }

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit State" : "Add State"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/*  Country Dropdown */}
          <div>
            <Label htmlFor="country">
              Country Name <span className="text-red-500">*</span>
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

          {/*  State Name */}
          <div>
            <Label htmlFor="stateName">
              State Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stateName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter State name"
              className="input-validate w-full"
            />
          </div>

          {/* label Name */}
          <div>
            <Label htmlFor="label">
              Label Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter label"
              className="input-validate w-full"
            />
          </div>

          {/*  Active Status */}
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

        {/*  Buttons */}
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

export default StateForm;
