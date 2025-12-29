import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

import { getEncryptedRoute } from "@/utils/routeCache";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const { encMasters, encSubProperties } = getEncryptedRoute();

import { subPropertiesApi, propertiesApi } from "@/helpers/admin";


const ENC_LIST_PATH = `/${encMasters}/${encSubProperties}`;


export default function SubPropertyForm() {
  const { t } = useTranslation();
  const [subPropertyName, setSubPropertyName] = useState("");
  const [propertyId, setPropertyId] = useState<string>(""); // ALWAYS controlled
  const [properties, setProperties] = useState<
    { unique_id: string; property_name: string; is_active?: boolean }[]
  >([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // ---------------------------------------------------
  // Fetch Property List
  // ---------------------------------------------------
  const fetchProperties = async () => {
    try {
      const res = await propertiesApi.list();
      setProperties(res);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("common.error"),
      });
    }
  };

  // ---------------------------------------------------
  // Fetch existing data for edit
  // ---------------------------------------------------
  useEffect(() => {
    fetchProperties();

    if (isEdit) {
      subPropertiesApi
        .get(id as string)
        .then((res) => {
          setSubPropertyName(res.sub_property_name);
          setIsActive(res.is_active);

          // Backend returns property → unique_id
          setPropertyId(String(res.property_id ?? res.property ?? ""));
        })
        .catch((err) => {
          Swal.fire({
            icon: "error",
            title: t("common.error"),
            text: err.response?.data?.detail || t("common.load_failed"),
          });
        });
    }
  }, [id, isEdit]);

  // ---------------------------------------------------
  // Save / Update
  // ---------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subPropertyName || !propertyId) {
      Swal.fire({
        icon: "warning",
        title: t("common.warning"),
        text: t("common.all_fields_required"),
      });
      return;
    }

    setLoading(true);

    const payload = {
      sub_property_name: subPropertyName,
      property_id: propertyId, // FIXED → backend expects this
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await subPropertiesApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: t("common.updated_success"),
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await subPropertiesApi.create(payload);
        Swal.fire({
          icon: "success",
          title: t("common.added_success"),
          timer: 1400,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const data = error.response?.data;
      let message = t("common.save_failed_desc");

      if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
          .join("\n");
      }

      Swal.fire({
        icon: "error",
        title: t("common.save_failed"),
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------

  return (
    <ComponentCard
      title={
        isEdit
          ? t("common.edit_item", { item: t("admin.nav.sub_property") })
          : t("common.add_item", { item: t("admin.nav.sub_property") })
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property dropdown */}
          <div>
            <Label htmlFor="property">
              {t("admin.nav.property")} *
            </Label>

            <Select
              value={propertyId || ""}
              onValueChange={(val) => setPropertyId(val)}
            >
              <SelectTrigger id="property" className="input-validate w-full">
                <SelectValue
                  placeholder={t("common.select_item_placeholder", {
                    item: t("admin.nav.property"),
                  })}
                />
              </SelectTrigger>

              <SelectContent>
                {properties
                  .filter((p) => p.is_active === true) // 🔥 Only active properties
                  .map((p) => (
                    <SelectItem key={p.unique_id} value={p.unique_id}>
                      {p.property_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-property Name */}
          <div>
            <Label htmlFor="subPropertyName">
              {t("common.item_name", { item: t("admin.nav.sub_property") })} *
            </Label>
            <Input
              id="subPropertyName"
              type="text"
              className="input-validate w-full"
              placeholder={t("common.enter_item_name", {
                item: t("admin.nav.sub_property"),
              })}
              value={subPropertyName}
              onChange={(e) => setSubPropertyName(e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="isActive">{t("common.status")} *</Label>

            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
            >
              <SelectTrigger id="isActive" className="input-validate w-full">
                <SelectValue placeholder={t("common.select_status")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="true">{t("common.active")}</SelectItem>
                <SelectItem value="false">{t("common.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading
              ? isEdit
                ? t("common.updating")
                : t("common.saving")
              : isEdit
              ? t("common.update")
              : t("common.save")}
          </button>

          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
