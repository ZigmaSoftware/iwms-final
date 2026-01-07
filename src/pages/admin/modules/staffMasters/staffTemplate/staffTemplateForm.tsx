import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

import { getEncryptedRoute } from "@/utils/routeCache";
import { staffTemplateApi, userCreationApi } from "@/helpers/admin";

/* ================= TYPES ================= */

type Option = {
  value: string;
  label: string;
};

type StaffTemplateFormData = {
  driver_id: string;
  operator_id: string;
  extra_operator_id: string; // comma-separated user IDs
  status: "ACTIVE" | "INACTIVE";
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  created_by: string;
  updated_by: string;
  approved_by: string;
};

/* ================= INITIAL STATE ================= */

const initialFormData: StaffTemplateFormData = {
  driver_id: "",
  operator_id: "",
  extra_operator_id: "",
  status: "ACTIVE",
  approval_status: "PENDING",
  created_by: "",
  updated_by: "",
  approved_by: "",
};

/* ================= COMPONENT ================= */

export default function StaffTemplateForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] =
    useState<StaffTemplateFormData>(initialFormData);

  const [driverOptions, setDriverOptions] = useState<Option[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);

  const { encStaffMasters, encStaffTemplate } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encStaffMasters}/${encStaffTemplate}`;
  const statusOptions = [
    { value: "ACTIVE", label: t("common.active") },
    { value: "INACTIVE", label: t("common.inactive") },
  ];
  const approvalStatusOptions = [
    { value: "PENDING", label: t("common.pending") },
    { value: "APPROVED", label: t("common.approved") },
    { value: "REJECTED", label: t("common.rejected") },
  ];

  /* ================= LOAD STAFF OPTIONS ================= */

  useEffect(() => {
    userCreationApi
      .list({ params: { active_status: 1 } })
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data ?? [];

        const staffOnly = data.filter(
          (u: any) =>
            u.user_type_name === "Staff" &&
            u.is_active === true &&
            u.is_deleted === false &&
            u.unique_id
        );

        const drivers: Option[] = staffOnly
          .filter((s: any) => s.staffusertype_name === "driver")
          .map((s: any) => ({
            value: s.unique_id,
            label: s.staff_name,
          }));

        const operators: Option[] = staffOnly
          .filter((s: any) => s.staffusertype_name === "operator")
          .map((s: any) => ({
            value: s.unique_id,
            label: s.staff_name,
          }));

        setDriverOptions(drivers);
        setOperatorOptions(operators);

        const currentUserId = localStorage.getItem("unique_id") || "";
        setFormData((prev) => ({
          ...prev,
          created_by: currentUserId,
          updated_by: currentUserId,
          approved_by: prev.approved_by || currentUserId,
        }));
      })
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      });
  }, [t]);

  /* ================= LOAD TEMPLATE (EDIT) ================= */
  // ⚠️ Loads ONLY after options exist

  useEffect(() => {
    if (
      !isEdit ||
      !id ||
      driverOptions.length === 0 ||
      operatorOptions.length === 0
    )
      return;

    setFetching(true);

    staffTemplateApi
      .get(id)
      .then((tpl: any) => {
        setFormData({
          driver_id: tpl.driver_id ?? "",
          operator_id: tpl.operator_id ?? "",
          extra_operator_id: Array.isArray(tpl.extra_operator_id)
            ? tpl.extra_operator_id.join(",")
            : "",
          status: tpl.status ?? "ACTIVE",
          approval_status: tpl.approval_status ?? "PENDING",
          created_by: tpl.created_by ?? "",
          updated_by: tpl.updated_by ?? "",
          approved_by: tpl.approved_by ?? "",
        });
      })
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      })
      .finally(() => setFetching(false));
  }, [id, isEdit, driverOptions.length, operatorOptions.length, t]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Business rule
    if (
      formData.driver_id &&
      formData.driver_id === formData.operator_id
    ) {
      Swal.fire(
        t("common.error"),
        t("admin.staff_template.error_primary_role_duplicate"),
        "warning"
      );
      return;
    }

    setSubmitting(true);

    try {
      const extraIds = formData.extra_operator_id
        ? formData.extra_operator_id
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        driver_id: formData.driver_id,
        operator_id: formData.operator_id,
        extra_operator_id: extraIds,
        status: formData.status,
        approval_status: formData.approval_status,
        created_by: formData.created_by,
        updated_by: formData.updated_by || formData.created_by,
        approved_by: formData.approved_by || null,
      };

      const formBody = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (Array.isArray(v)) {
          v.forEach((item) => formBody.append(k, String(item)));
        } else {
          formBody.append(k, String(v));
        }
      });

      if (isEdit && id) {
        await staffTemplateApi.update(id, formBody);
      } else {
        await staffTemplateApi.create(formBody);
      }

      Swal.fire(
        t("common.success"),
          isEdit ? t("common.updated_success") : t("common.created_success"),
          "success"
        );

      navigate(ENC_LIST_PATH);
    } catch {
      Swal.fire(t("common.error"), t("common.save_failed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="p-6">
      <ComponentCard
        title={
          isEdit
            ? t("admin.staff_template.title_edit")
            : t("admin.staff_template.title_add")
        }
        desc={t("admin.staff_template.subtitle")}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* DRIVER */}
            <div>
              <Label>{t("admin.staff_template.primary_driver")}</Label>
              <Select
                value={formData.driver_id}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, driver_id: v }))
                }
                options={driverOptions}
                placeholder={t("common.select_option")}
                required
                disabled={fetching}
              />
            </div>

            {/* OPERATOR */}
            <div>
              <Label>{t("admin.staff_template.primary_operator")}</Label>
              <Select
                value={formData.operator_id}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, operator_id: v }))
                }
                options={operatorOptions}
                placeholder={t("common.select_option")}
                required
                disabled={fetching}
              />
            </div>

            {/* EXTRA OPERATORS (comma-separated IDs) */}
            <div>
              <Label>{t("admin.staff_template.extra_staff")}</Label>
              <textarea
                className="w-full rounded border border-gray-300 p-2 text-sm"
                placeholder={t("admin.staff_template.extra_staff_placeholder")}
                value={formData.extra_operator_id}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    extra_operator_id: e.target.value,
                  }))
                }
                disabled={fetching}
              />
            </div>

            {/* STATUS */}
            <div>
              <Label>{t("common.status")}</Label>
              <Select
                value={formData.status}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, status: v as any }))
                }
                options={statusOptions}
                placeholder={t("common.select_status")}
                required
                disabled={fetching}
              />
            </div>

            {/* APPROVAL STATUS */}
            <div>
              <Label>{t("admin.staff_template.approval_status")}</Label>
              <Select
                value={formData.approval_status}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, approval_status: v as any }))
                }
                options={approvalStatusOptions}
                placeholder={t("common.select_status")}
                required
                disabled={fetching}
              />
            </div>

            {/* APPROVER */}
            <div>
              <Label>{t("admin.staff_template.approved_by")}</Label>
              <Select
                value={formData.approved_by}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, approved_by: v }))
                }
                options={operatorOptions.concat(driverOptions)}
                placeholder={t("common.select_option")}
                disabled={fetching}
              />
            </div>

            {/* CREATED BY */}
            <div>
              <Label>{t("admin.staff_template.created_by")}</Label>
              <input
                className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
                value={formData.created_by}
                readOnly
              />
            </div>

            {/* UPDATED BY */}
            <div>
              <Label>{t("admin.staff_template.updated_by")}</Label>
              <Select
                value={formData.updated_by}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, updated_by: v }))
                }
                options={operatorOptions.concat(driverOptions)}
                placeholder={t("common.select_option")}
                disabled={fetching}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || fetching}
              className="rounded-lg bg-green-custom px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting
                ? t("common.saving")
                : isEdit
                ? t("common.update")
                : t("common.save")}
            </button>

            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
