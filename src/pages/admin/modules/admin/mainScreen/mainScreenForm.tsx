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

import { encryptSegment } from "@/utils/routeCrypto";


/* ------------------------------
    ROUTES
------------------------------ */
const encAdmins = encryptSegment("admins");
const encMainScreens = encryptSegment("mainscreens");
const ENC_LIST_PATH = `/${encAdmins}/${encMainScreens}`;

/* ------------------------------
    APIs
------------------------------ */

import {
  mainScreenTypeApi,
  mainScreenApi
} from "@/helpers/admin";


/* ==========================================================
      COMPONENT
========================================================== */
export default function MainScreenForm() {
  const { t } = useTranslation();
  /* FORM FIELDS */
  const [mainscreenName, setMainScreenName] = useState("");
  const [iconName, setIconName] = useState("");
  const [orderNo, setOrderNo] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [mainscreenTypeId, setMainScreenTypeId] = useState<string>("");

  /* DROPDOWN DATA */
  const [mainScreenTypes, setMainScreenTypes] = useState<
    { value: string; label: string }[]
  >([]);

  /* STATE */
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const navigate = useNavigate();

  /* ==========================================================
      LOAD MAINSCREEN TYPES
  ========================================================== */
  useEffect(() => {
    (async () => {
      try {
        const res = await mainScreenTypeApi.list();
        const mapped = res
          .filter((x: any) => x.is_active)
          .map((x: any) => ({
            value: String(x.unique_id),
            label: x.type_name,
          }));
        setMainScreenTypes(mapped);
      } catch (err) {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      }
    })();
  }, []);

  /* ==========================================================
      EDIT MODE — LOAD RECORD
  ========================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    (async () => {
      try {
        const data = await mainScreenApi.get(id);

        setMainScreenName(data.mainscreen_name ?? "");
        setIconName(data.icon_name ?? "");
        setOrderNo(data.order_no ?? "");
        setDescription(data.description ?? "");
        setMainScreenTypeId(data.mainscreentype_id ?? "");
        setIsActive(Boolean(data.is_active));
      } catch (err) {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      }
    })();
  }, [isEdit, id]);

  /* ==========================================================
      SUBMIT
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!mainscreenName.trim() || !mainscreenTypeId) {
      Swal.fire(t("common.warning"), t("common.missing_fields"), "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        mainscreen_name: mainscreenName.trim(),
        icon_name: iconName.trim(),
        order_no: Number(orderNo) || 0,
        description: description.trim(),
        mainscreentype_id: mainscreenTypeId,
        is_active: isActive,
      };

      if (isEdit && id) {
        await mainScreenApi.update(id, payload);
        Swal.fire(t("common.success"), t("common.updated_success"), "success");
      } else {
        await mainScreenApi.create(payload);
        Swal.fire(t("common.success"), t("common.added_success"), "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire(
        t("common.save_failed"),
        err?.response?.data?.detail || t("common.save_failed_desc"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard
      title={
        isEdit
          ? t("common.edit_item", { item: t("admin.nav.main_screen") })
          : t("common.add_item", { item: t("admin.nav.main_screen") })
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* MainScreen Type */}
          <div>
            <Label>{t("admin.nav.main_screen_type")} *</Label>
            <Select
              value={mainscreenTypeId}
              onValueChange={(v) => setMainScreenTypeId(v)}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue
                  placeholder={t("common.select_item_placeholder", {
                    item: t("admin.nav.main_screen_type"),
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {mainScreenTypes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t("common.no_items_found", {
                      item: t("admin.nav.main_screen_type"),
                    })}
                  </div>
                ) : (
                  mainScreenTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div>
            <Label>
              {t("common.item_name", {
                item: t("admin.nav.main_screen"),
              })}{" "}
              *
            </Label>
            <Input
              value={mainscreenName}
              onChange={(e) => setMainScreenName(e.target.value)}
              placeholder={t("common.enter_item_name", {
                item: t("admin.nav.main_screen"),
              })}
              className="input-validate w-full"
              required
            />
          </div>

          {/* Icon Name */}
          <div>
            <Label>{t("common.icon_name")}</Label>
            <Input
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder={t("common.enter_icon_name")}
              className="input-validate w-full"
            />
          </div>

          {/* Order No */}
          <div>
            <Label>{t("common.order_no")}</Label>
            <Input
              type="number"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder={t("common.order_no_placeholder")}
              className="input-validate w-full"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label>{t("common.description")}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("common.description_optional")}
              className="input-validate w-full"
            />
          </div>

          {/* Status */}
          <div>
            <Label>{t("common.status")} *</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder={t("common.select_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("common.active")}</SelectItem>
                <SelectItem value="false">{t("common.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
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
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
