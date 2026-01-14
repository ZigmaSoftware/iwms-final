import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";

import { staffTemplateApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

type StaffTemplateAuditRecord = {
  unique_id: string;
  driver_name?: string | null;
  operator_name?: string | null;
  extra_operator_id?: string[];
  status?: string | null;
  approval_status?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  approved_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function StaffTemplateAuditForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [record, setRecord] = useState<StaffTemplateAuditRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const { encStaffMasters, encStaffTemplateAudit } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encStaffMasters}/${encStaffTemplateAudit}`;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    staffTemplateApi
      .get(id)
      .then((res: any) => setRecord(res ?? null))
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  const extraOperators = record?.extra_operator_id?.length
    ? record.extra_operator_id.join(", ")
    : "-";

  return (
    <div className="p-3">
      <ComponentCard
        title={t("admin.staff_template_audit.title")}
        desc={t("admin.staff_template_audit.subtitle")}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>{t("admin.staff_template.columns.template_id")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.unique_id ?? ""}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.columns.primary_driver")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.driver_name ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.columns.primary_operator")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.operator_name ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.columns.extra_staff")}</Label>
            <textarea
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={extraOperators}
              readOnly
            />
          </div>

          <div>
            <Label>{t("common.status")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.status ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.columns.approval_status")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.approval_status ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.created_by")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.created_by_name ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.updated_by")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.updated_by_name ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("admin.staff_template.approved_by")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={record?.approved_by_name ?? "-"}
              readOnly
            />
          </div>

          <div>
            <Label>{t("common.created_at")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={
                record?.created_at ? new Date(record.created_at).toLocaleString() : "-"
              }
              readOnly
            />
          </div>

          <div>
            <Label>{t("common.updated_at")}</Label>
            <input
              className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-sm"
              value={
                record?.updated_at ? new Date(record.updated_at).toLocaleString() : "-"
              }
              readOnly
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
          >
            {t("common.back")}
          </button>
        </div>
      </ComponentCard>
    </div>
  );
}
