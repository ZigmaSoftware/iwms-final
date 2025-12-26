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

import { binApi, wardApi } from "@/helpers/admin";
import { encryptSegment } from "@/utils/routeCrypto";

/* ================= ROUTES ================= */
const encMasters = encryptSegment("masters");
const encBins = encryptSegment("bins");
const LIST_PATH = `/${encMasters}/${encBins}`;

/* ================= TYPES ================= */
type SelectOption = { value: string; label: string };

/* ================= HELPERS ================= */
const extractErr = (e: any): string => {
  const data = e?.response?.data;
  if (data) {
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      return Object.entries(data)
        .map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
          return `${key}: ${String(value)}`;
        })
        .join("\n");
    }
    return String(data);
  }
  if (e?.message) return e.message;
  return "Unexpected error";
};

/* ==========================================================
      COMPONENT
========================================================== */
export default function BinForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  /* ================= FORM STATE ================= */
  const [binName, setBinName] = useState("");
  const [wardId, setWardId] = useState("");
  const [pendingWard, setPendingWard] = useState("");

  const [binType, setBinType] = useState("public");
  const [wasteType, setWasteType] = useState("organic");
  const [capacity, setCapacity] = useState<number | "">("");
  const [colorCode, setColorCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [expectedLife, setExpectedLife] = useState<number | "">("");
  const [binStatus, setBinStatus] = useState("active");
  const [isActive, setIsActive] = useState(true);

  const [wards, setWards] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD WARDS ================= */
  useEffect(() => {
    wardApi
      .list()
      .then((res: any) =>
        setWards(
          res
            .filter((w: any) => w.is_active)
            .map((w: any) => ({
              value: String(w.unique_id),
              label: w.name,
            }))
        )
      )
      .catch((err) => Swal.fire("Error", extractErr(err), "error"));
  }, []);

  /* ================= EDIT MODE LOAD ================= */
  useEffect(() => {
    if (!isEdit || !id) return;

    const toNumberOrEmpty = (value: unknown): number | "" => {
      if (value === null || value === undefined || value === "") return "";
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : "";
    };
    const toStringOrEmpty = (value: unknown): string =>
      value === null || value === undefined ? "" : String(value);

    binApi
      .get(id)
      .then((data: any) => {
        setBinName(data.bin_name ?? "");
        setBinType(data.bin_type ?? "public");
        setWasteType(data.waste_type ?? "organic");
        setCapacity(toNumberOrEmpty(data.capacity_liters));
        setColorCode(data.color_code ?? "");
        setLatitude(toStringOrEmpty(data.latitude));
        setLongitude(toStringOrEmpty(data.longitude));
        setInstallationDate(data.installation_date ?? "");
        setExpectedLife(toNumberOrEmpty(data.expected_life_years));
        setBinStatus(data.bin_status ?? "active");
        setIsActive(Boolean(data.is_active));

        // THIS IS THE KEY FIX
        const w = String(data.ward ?? data.ward_id ?? "");
        if (w) setPendingWard(w);
      })
      .catch(() => Swal.fire("Error", "Failed to load bin details", "error"));
  }, [id, isEdit]);

  /* ================= APPLY PENDING WARD ================= */
  useEffect(() => {
    if (
      pendingWard &&
      wards.length > 0 &&
      wards.some((w) => w.value === pendingWard)
    ) {
      setWardId(pendingWard);
      setPendingWard("");
    }
  }, [pendingWard, wards]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];
    const hasNumber = (value: number | "") =>
      typeof value === "number" && Number.isFinite(value);

    if (!binName.trim()) missingFields.push("Bin name");
    if (!wardId) missingFields.push("Ward");
    if (typeof capacity !== "number" || capacity <= 0) {
      missingFields.push("Capacity");
    }
    if (!colorCode.trim()) missingFields.push("Color code");
    if (!latitude.trim()) missingFields.push("Latitude");
    if (!longitude.trim()) missingFields.push("Longitude");
    if (!installationDate) missingFields.push("Installation date");
    if (typeof expectedLife !== "number" || expectedLife <= 0) {
      missingFields.push("Expected life");
    }

    if (missingFields.length > 0) {
      Swal.fire(
        "Missing Fields",
        `Please provide: ${missingFields.join(", ")}.`,
        "warning"
      );
      return;
    }

    setLoading(true);

    const latValue = Number.parseFloat(latitude.replace(/,/g, "."));
    const lonValue = Number.parseFloat(longitude.replace(/,/g, "."));
    if (Number.isNaN(latValue) || Number.isNaN(lonValue)) {
      Swal.fire(
        "Invalid Coordinates",
        "Latitude and Longitude must be valid numbers.",
        "warning"
      );
      return;
    }

    const payload = {
      bin_name: binName.trim(),
      ward: wardId,
      bin_type: binType,
      waste_type: wasteType,
      capacity_liters: Number(capacity),
      color_code: colorCode.trim(),
      latitude: latValue,
      longitude: lonValue,
      installation_date: installationDate,
      expected_life_years: Number(expectedLife),
      bin_status: binStatus,
      is_active: isActive,
    };

    try {
      if (isEdit && id) {
        console.log(payload);
        await binApi.update(id, payload);
        Swal.fire("Success", "Bin updated successfully!", "success");
      } else {
        await binApi.create(payload);
        Swal.fire("Success", "Bin added successfully!", "success");
      }

      navigate(LIST_PATH);
    } catch (err: any) {
      Swal.fire("Save failed", extractErr(err), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= JSX ================= */
  return (
    <ComponentCard title={isEdit ? "Edit Bin" : "Add Bin"}>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        noValidate
      >
        {/* Bin Name */}
        <div>
          <Label>Bin Name *</Label>
          <Input
            value={binName}
            onChange={(e) => setBinName(e.target.value)}
            required
          />
        </div>

        {/* Ward */}
        <div>
          <Label>Ward *</Label>
          <Select value={wardId} onValueChange={setWardId}>
            <SelectTrigger className="input-validate w-full">
              <SelectValue placeholder="Select Ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bin Type */}
        <div>
          <Label>Bin Type</Label>
          <Select value={binType} onValueChange={setBinType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Waste Type */}
        <div>
          <Label>Waste Type</Label>
          <Select value={wasteType} onValueChange={setWasteType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="organic">Organic</SelectItem>
              <SelectItem value="plastic">Plastic</SelectItem>
              <SelectItem value="metal">Metal</SelectItem>
              <SelectItem value="paper">Paper</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Capacity */}
        <div>
          <Label>Capacity (Liters) *</Label>
          <Input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value ? +e.target.value : "")}
            min={1}
            required
          />
        </div>

        {/* Color */}
        <div>
          <Label>Color Code *</Label>
          <Input
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            required
          />
        </div>

        {/* Latitude */}
        <div>
          <Label>Latitude *</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>

        {/* Longitude */}
        <div>
          <Label>Longitude *</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>

        {/* Installation Date */}
        <div>
          <Label>Installation Date *</Label>
          <Input
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
            required
          />
        </div>

        {/* Expected Life */}
        <div>
          <Label>Expected Life (Years) *</Label>
          <Input
            type="number"
            value={expectedLife}
            onChange={(e) =>
              setExpectedLife(e.target.value ? +e.target.value : "")
            }
            min={1}
            required
          />
        </div>

        {/* Active Status */}
        <div>
          <Label>Active Status</Label>
          <Select
            value={isActive ? "true" : "false"}
            onValueChange={(v) => setIsActive(v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
