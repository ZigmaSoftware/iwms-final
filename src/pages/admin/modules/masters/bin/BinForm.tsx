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
import { useTranslation } from "react-i18next";

import { binApi, wardApi } from "@/helpers/admin";
import { encryptSegment } from "@/utils/routeCrypto";

/* ================= ROUTES ================= */
const encMasters = encryptSegment("masters");
const encBins = encryptSegment("bins");
const LIST_PATH = `/${encMasters}/${encBins}`;

/* ================= TYPES ================= */
type SelectOption = { value: string; label: string };

/* ================= HELPERS ================= */
/* ==========================================================
      COMPONENT
========================================================== */
export default function BinForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

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
    return t("common.unexpected_error");
  };

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
      .catch((err) => Swal.fire(t("common.error"), extractErr(err), "error"));
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
      .catch(() =>
        Swal.fire(t("common.error"), t("common.load_failed"), "error")
      );
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
    if (!wardId) missingFields.push(t("common.ward"));
    if (typeof capacity !== "number" || capacity <= 0) {
      missingFields.push(t("common.capacity_liters"));
    }
    if (!colorCode.trim()) missingFields.push(t("common.color_code"));
    if (!latitude.trim()) missingFields.push(t("common.latitude"));
    if (!longitude.trim()) missingFields.push(t("common.longitude"));
    if (!installationDate) missingFields.push(t("common.installed_on"));
    if (typeof expectedLife !== "number" || expectedLife <= 0) {
      missingFields.push(t("common.expected_life_years"));
    }

    if (missingFields.length > 0) {
      Swal.fire(
        t("common.warning"),
        t("admin.bin.missing_fields", { fields: missingFields.join(", ") }),
        "warning"
      );
      return;
    }

    setLoading(true);

    const latValue = Number.parseFloat(latitude.replace(/,/g, "."));
    const lonValue = Number.parseFloat(longitude.replace(/,/g, "."));
    if (Number.isNaN(latValue) || Number.isNaN(lonValue)) {
      Swal.fire(
        t("admin.bin.invalid_coordinates_title"),
        t("admin.bin.invalid_coordinates_desc"),
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
        Swal.fire(t("common.success"), t("common.updated_success"), "success");
      } else {
        await binApi.create(payload);
        Swal.fire(t("common.success"), t("common.added_success"), "success");
      }

      navigate(LIST_PATH);
    } catch (err: any) {
      Swal.fire(t("common.save_failed"), extractErr(err), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= JSX ================= */
  return (
    <ComponentCard
      title={
        isEdit
          ? t("common.edit_item", { item: t("admin.nav.bin_master") })
          : t("common.add_item", { item: t("admin.nav.bin_creation") })
      }
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        noValidate
      >
        {/* Bin Name */}
        <div>
          <Label>
            {t("common.item_name", { item: t("admin.nav.bin_master") })} *
          </Label>
          <Input
            value={binName}
            onChange={(e) => setBinName(e.target.value)}
            required
          />
        </div>

        {/* Ward */}
        <div>
          <Label>{t("common.ward")} *</Label>
          <Select value={wardId} onValueChange={setWardId}>
            <SelectTrigger className="input-validate w-full">
              <SelectValue
                placeholder={t("common.select_item_placeholder", {
                  item: t("common.ward"),
                })}
              />
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
          <Label>{t("common.bin_type")}</Label>
          <Select value={binType} onValueChange={setBinType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                {t("admin.bin.type_public")}
              </SelectItem>
              <SelectItem value="commercial">
                {t("admin.bin.type_commercial")}
              </SelectItem>
              <SelectItem value="residential">
                {t("admin.bin.type_residential")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Waste Type */}
        <div>
          <Label>{t("common.waste_type")}</Label>
          <Select value={wasteType} onValueChange={setWasteType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="organic">
                {t("admin.bin.waste_organic")}
              </SelectItem>
              <SelectItem value="plastic">
                {t("admin.bin.waste_plastic")}
              </SelectItem>
              <SelectItem value="metal">
                {t("admin.bin.waste_metal")}
              </SelectItem>
              <SelectItem value="paper">
                {t("admin.bin.waste_paper")}
              </SelectItem>
              <SelectItem value="mixed">
                {t("admin.bin.waste_mixed")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Capacity */}
        <div>
          <Label>{t("common.capacity_liters")} *</Label>
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
          <Label>{t("common.color_code")} *</Label>
          <Input
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
            required
          />
        </div>

        {/* Latitude */}
        <div>
          <Label>{t("common.latitude")} *</Label>
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
          <Label>{t("common.longitude")} *</Label>
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
          <Label>{t("common.installed_on")} *</Label>
          <Input
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
            required
          />
        </div>

        {/* Expected Life */}
        <div>
          <Label>{t("common.expected_life_years")} *</Label>
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
          <Label>{t("common.status")}</Label>
          <Select
            value={isActive ? "true" : "false"}
            onValueChange={(v) => setIsActive(v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t("common.active")}</SelectItem>
              <SelectItem value="false">{t("common.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex justify-end gap-3">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? t("common.updating")
                : t("common.saving")
              : isEdit
                ? t("common.update")
                : t("common.save")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(LIST_PATH)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
