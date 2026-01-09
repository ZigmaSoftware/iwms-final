import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Input } from "@/components/ui/input";

import { adminApi } from "@/helpers/admin/registry";
import { getEncryptedRoute } from "@/utils/routeCache";

type SelectOption = { value: string; label: string };

const normalizeList = (payload: any): any[] =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload?.results ?? [];

const toOptions = (items: any[], valueKey: string, labelKey: string): SelectOption[] =>
  items
    .map((item) => ({
      value: String(item?.[valueKey] ?? ""),
      label: String(item?.[labelKey] ?? item?.[valueKey] ?? ""),
    }))
    .filter((option) => option.value);

export default function CustomerTagForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const customerTagApi = adminApi.customerTags;
  const customerApi = adminApi.customerCreations;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [status, setStatus] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [revokedAt, setRevokedAt] = useState("");

  const { encCustomerMaster, encCustomerTag } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encCustomerMaster}/${encCustomerTag}`;

  useEffect(() => {
    setFetching(true);
    customerApi
      .list()
      .then((res: any) => {
        setCustomers(toOptions(normalizeList(res), "unique_id", "customer_name"));
      })
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      })
      .finally(() => setFetching(false));
  }, [customerApi, t]);

  useEffect(() => {
    if (!isEdit || !id) return;

    customerTagApi
      .get(id)
      .then((res: any) => {
        setCustomerId(res?.customer_id ?? "");
        setTagCode(res?.tag_code ?? "");
        setStatus(res?.status ?? "");
        setIssuedAt(res?.issued_at ?? "");
        setRevokedAt(res?.revoked_at ?? "");
      })
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      });
  }, [customerTagApi, id, isEdit, t]);

  const customerLabel =
    customers.find((option) => option.value === customerId)?.label ?? customerId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isEdit && !customerId) {
      Swal.fire(t("common.warning"), t("common.missing_fields"), "warning");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && id) {
        await customerTagApi.update(id, {});
        Swal.fire(t("common.success"), t("common.updated_success"), "success");
      } else {
        await customerTagApi.create({ customer_id: customerId });
        Swal.fire(t("common.success"), t("common.added_success"), "success");
      }
      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message = error?.response?.data?.detail || t("common.save_failed_desc");
      Swal.fire(t("common.save_failed"), message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <ComponentCard
        title={isEdit ? t("admin.customer_tag.title_edit") : t("admin.customer_tag.title_add")}
        desc={t("admin.customer_tag.subtitle")}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>{t("admin.customer_tag.customer")}</Label>
              {isEdit ? (
                <Input value={customerLabel} disabled className="bg-gray-100" />
              ) : (
                <Select
                  value={customerId}
                  onChange={setCustomerId}
                  options={customers}
                  placeholder={t("common.select_option")}
                  disabled={fetching}
                  required
                />
              )}
            </div>

            <div>
              <Label>{t("admin.customer_tag.tag_code")}</Label>
              <Input value={tagCode} disabled className="bg-gray-100" />
            </div>

            <div>
              <Label>{t("admin.customer_tag.status")}</Label>
              <Input value={status} disabled className="bg-gray-100" />
            </div>

            <div>
              <Label>{t("admin.customer_tag.issued_at")}</Label>
              <Input value={issuedAt} disabled className="bg-gray-100" />
            </div>

            <div>
              <Label>{t("admin.customer_tag.revoked_at")}</Label>
              <Input value={revokedAt || "-"} disabled className="bg-gray-100" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading || fetching || (isEdit && status === "REVOKED")}
              className="rounded-lg bg-green-custom px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? t("common.saving")
                : isEdit
                ? t("admin.customer_tag.revoke")
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
