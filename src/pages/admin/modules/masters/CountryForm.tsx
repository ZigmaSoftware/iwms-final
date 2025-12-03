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
const encCountries = encryptSegment("countries");

const ENC_LIST_PATH = `/${encMasters}/${encCountries}`;

function CountryForm() {
  const [name, setName] = useState("");
  const [mob_code, setMobcode] = useState("");
  const [currency, setCurrency] = useState("");
  const [continentId, setContinentId] = useState(""); // selected continent
  const [continents, setContinents] = useState<
    { value: string; label: string }[]
  >([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  //  Load continent list from backend
  useEffect(() => {
    desktopApi
      .get("continents/")
      .then((res) => {
        const activeContinents = res.data
          .filter((c: any) => c.is_active) // only active ones
          .map((c: any) => ({
            value: c.id.toString(),
            label: `${c.name}`,
          }));
        console.log(activeContinents);
        setContinents(activeContinents);
      })
      .catch((err) => console.error("Error fetching continents:", err));
  }, []);

  // Load existing country for editing
  useEffect(() => {
    if (isEdit && continents.length > 0) {
      desktopApi
        .get(`countries/${id}/`)
        .then((res) => {
          setName(res.data.name);
          setIsActive(res.data.is_active);
          setMobcode(res.data.mob_code);
          setCurrency(res.data.currency);
          setContinentId(res.data.continent?.toString() || ""); //
        })
        .catch((err) => {
          console.error("Error fetching country:", err);
          Swal.fire({
            icon: "error",
            title: "Failed to load country",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit, continents]);

  //  Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //  Basic validation BEFORE enabling loading or API call
    if (!name || !continentId) {
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
        continent: continentId, // sending continent foreign key
        is_active: isActive,
        mob_code: mob_code,
        currency: currency,
      };

      if (isEdit) {
        await desktopApi.put(`countries/${id}/`, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await desktopApi.post("countries/", payload);
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
    <ComponentCard title={isEdit ? "Edit Country" : "Add Country"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Continent Dropdown */}
          <div>
            <Label htmlFor="continent">
              Continent Name <span className="text-red-500">*</span>
            </Label>
            <Select
              value={continentId || undefined}
              onValueChange={(val) => setContinentId(val)}
            >
              <SelectTrigger className="input-validate w-full" id="continent">
                <SelectValue placeholder="Select Continent" />
              </SelectTrigger>
              <SelectContent>
                {continents.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/*  Country Name */}
          <div>
            <Label htmlFor="countryName">
              Country Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="countryName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter country name"
              className="input-validate w-full"
              required
            />
          </div>
          {/*  Mobile Code */}
          <div>
            <Label htmlFor="mobile_code">
              Mobile Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mobile_code"
              type="number"
              value={mob_code}
              onChange={(e) => setMobcode(e.target.value)}
              placeholder="Enter mobile code"
              className="input-validate w-full"
              required
            />
          </div>
          {/*  Currency Name */}
          <div>
            <Label htmlFor="currency">
              Currency Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currency"
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="Enter currency"
              className="input-validate w-full"
              required
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

export default CountryForm;
