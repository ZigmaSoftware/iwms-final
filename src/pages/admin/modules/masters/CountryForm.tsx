import { useEffect, useState, type FormEvent } from "react";
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
import { adminApi } from "@/helpers/admin/registry";

const encMasters = encryptSegment("masters");
const encCountries = encryptSegment("countries");

const ENC_LIST_PATH = `/${encMasters}/${encCountries}`;

type ContinentRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
};

type CountryRecord = {
  name: string;
  mob_code: string;
  currency: string;
  continent_id?: string | number | null;
  continent?: string | number | null;
  is_active: boolean;
};

type SelectOption = {
  value: string;
  label: string;
};

type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const continentApi = adminApi.continents;
const countryApi = adminApi.countries;

const normalizeNullableId = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
};

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Something went wrong while processing the request.";
  if (typeof error === "string") return error;

  const withResponse = error as ErrorWithResponse;
  const data = withResponse.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.join(", ");
  }

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${String(value)}`;
      })
      .join("\n");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while processing the request.";
};

function CountryForm() {
  const [name, setName] = useState("");
  const [mobCode, setMobCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [continentId, setContinentId] = useState("");
  const [continents, setContinents] = useState<SelectOption[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  useEffect(() => {
    const fetchContinents = async () => {
      try {
        const data = (await continentApi.list()) as ContinentRecord[];
        const active = data
          .filter((continent) => continent.is_active)
          .map<SelectOption>((continent) => ({
            value: String(continent.unique_id),
            label: continent.name,
          }));

        setContinents(active);
      } catch (error) {
        console.error("Error fetching continents:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load continents",
          text: extractErrorMessage(error),
        });
      }
    };

    void fetchContinents();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) {
      return;
    }

    const fetchCountry = async () => {
      try {
        const data = (await countryApi.get(id)) as CountryRecord;

        setName(data.name ?? "");
        setIsActive(Boolean(data.is_active));
        setMobCode(data.mob_code ?? "");
        setCurrency(data.currency ?? "");

        const resolvedContinentId = normalizeNullableId(
          data.continent_id ?? data.continent
        );
        setContinentId(resolvedContinentId ?? "");
      } catch (error) {
        console.error("Error fetching country:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load country",
          text: extractErrorMessage(error),
        });
      }
    };

    void fetchCountry();
  }, [id, isEdit]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !continentId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all the required fields before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        continent_id: continentId,
        is_active: isActive,
        mob_code: mobCode.trim(),
        currency: currency.trim(),
      };

      if (isEdit && id) {
        await countryApi.update(id, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await countryApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error) {
      console.error("Failed to save:", error);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
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
              value={mobCode}
              onChange={(e) => setMobCode(e.target.value)}
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
