import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { PencilIcon } from "@/icons";
import { adminApi } from "@/helpers/admin/registry";
import { getEncryptedRoute } from "@/utils/routeCache";
import { Switch } from "@/components/ui/switch";

type CustomerTagRecord = {
  id: number;
  customer_id: string;
  tag_code: string;
  status: string;
  issued_at?: string | null;
  revoked_at?: string | null;
};

const normalizeList = (payload: any): any[] =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload?.results ?? [];

const buildLookup = (items: any[], key: string, label: string) =>
  items.reduce<Record<string, string>>((acc, item) => {
    const lookupKey = item?.[key];
    if (lookupKey !== undefined && lookupKey !== null) {
      acc[String(lookupKey)] = String(item?.[label] ?? lookupKey);
    }
    return acc;
  }, {});

export default function CustomerTagList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const customerTagApi = adminApi.customerTags;
  const customerApi = adminApi.customerCreations;

  const [records, setRecords] = useState<CustomerTagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerLookup, setCustomerLookup] = useState<Record<string, string>>({});

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const { encCustomerMaster, encCustomerTag } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encCustomerMaster}/${encCustomerTag}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encCustomerMaster}/${encCustomerTag}/${id}/edit`;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [tagRes, customerRes] = await Promise.all([
        customerTagApi.list(),
        customerApi.list(),
      ]);

      setRecords(normalizeList(tagRes));
      setCustomerLookup(buildLookup(normalizeList(customerRes), "unique_id", "customer_name"));
    } catch {
      Swal.fire(t("common.error"), t("common.fetch_failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
  };

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "-";

  const statusBodyTemplate = (row: CustomerTagRecord) => {
    const isActive = row.status === "ACTIVE";

    const updateStatus = async (checked: boolean) => {
      if (checked) return;
      try {
        await customerTagApi.update(row.id, {});
        fetchRecords();
      } catch {
        Swal.fire(t("common.error"), t("common.update_status_failed"), "error");
      }
    };

    return (
      <Switch
        checked={isActive}
        disabled={!isActive}
        onCheckedChange={updateStatus}
      />
    );
  };

  const header = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {t("admin.customer_tag.list_title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("admin.customer_tag.list_subtitle")}
          </p>
        </div>

        <Button
          label={t("admin.customer_tag.create_button")}
          icon="pi pi-plus"
          className="p-button-success p-button-sm"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <div className="flex justify-end">
        <div className="flex items-center gap-2 border rounded-full px-3 py-1 bg-white">
          <i className="pi pi-search text-gray-500" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder={t("admin.customer_tag.search_placeholder")}
            className="border-none text-sm"
          />
        </div>
      </div>
    </div>
  );

  const actionTemplate = (row: CustomerTagRecord) => (
    <div className="flex justify-center">
      <button
        title={t("common.edit")}
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  return (
    <div className="p-3">
      <DataTable
        value={records}
        dataKey="id"
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        globalFilterFields={["tag_code", "customer_id", "status"]}
        header={header}
        stripedRows
        showGridlines
        className="p-datatable-sm"
        emptyMessage={t("admin.customer_tag.empty_message")}
      >
        <Column header={t("common.s_no")} body={(_, { rowIndex }) => rowIndex + 1} style={{ width: 70 }} />
        <Column field="tag_code" header={t("admin.customer_tag.tag_code")} />
        <Column
          header={t("admin.customer_tag.customer")}
          body={(row: CustomerTagRecord) => customerLookup[row.customer_id] ?? row.customer_id}
        />
        <Column header={t("admin.customer_tag.status")} body={statusBodyTemplate} style={{ width: 120 }} />
        <Column
          header={t("admin.customer_tag.issued_at")}
          body={(row: CustomerTagRecord) => formatDate(row.issued_at)}
        />
        <Column
          header={t("admin.customer_tag.revoked_at")}
          body={(row: CustomerTagRecord) => formatDate(row.revoked_at)}
        />
        <Column header={t("common.actions")} body={actionTemplate} style={{ width: 120 }} />
      </DataTable>
    </div>
  );
}
