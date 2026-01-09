import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

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

const normalizeList = (payload: any): StaffTemplateAuditRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export default function StaffTemplateAuditList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [records, setRecords] = useState<StaffTemplateAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const { encStaffMasters, encStaffTemplateAudit } = getEncryptedRoute();
  const ENC_VIEW_PATH = (id: string) =>
    `/${encStaffMasters}/${encStaffTemplateAudit}/${id}/edit`;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const payload: any = await staffTemplateApi.list();
      setRecords(normalizeList(payload));
    } catch {
      Swal.fire(t("common.error"), t("common.load_failed"), "error");
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

  const actionTemplate = (row: StaffTemplateAuditRecord) => (
    <div className="flex justify-center">
      <button
        title={t("common.view")}
        onClick={() => navigate(ENC_VIEW_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        {t("common.view")}
      </button>
    </div>
  );

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {t("admin.staff_template_audit.list_title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("admin.staff_template_audit.list_subtitle")}
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 border rounded-full px-3 py-1 bg-white">
          <i className="pi pi-search text-gray-500" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder={t("common.search_placeholder")}
            className="border-none text-sm"
          />
        </div>
      </div>

      <DataTable
        value={records}
        dataKey="unique_id"
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        globalFilterFields={[
          "unique_id",
          "driver_name",
          "operator_name",
          "status",
          "approval_status",
          "created_by_name",
          "updated_by_name",
          "approved_by_name",
        ]}
        stripedRows
        showGridlines
        className="p-datatable-sm"
        emptyMessage={t("admin.staff_template_audit.empty_message")}
      >
        <Column
          header={t("common.s_no")}
          body={(_, { rowIndex }) => rowIndex + 1}
          style={{ width: 70 }}
        />
        <Column
          field="unique_id"
          header={t("admin.staff_template.columns.template_id")}
          sortable
        />
        <Column
          header={t("admin.staff_template.columns.primary_driver")}
          body={(r: StaffTemplateAuditRecord) => r.driver_name ?? "-"}
          sortable
        />
        <Column
          header={t("admin.staff_template.columns.primary_operator")}
          body={(r: StaffTemplateAuditRecord) => r.operator_name ?? "-"}
          sortable
        />
        <Column
          header={t("admin.staff_template.columns.extra_staff")}
          body={(r: StaffTemplateAuditRecord) => r.extra_operator_id?.length ?? 0}
          style={{ width: 120 }}
        />
        <Column field="status" header={t("common.status")} sortable />
        <Column field="approval_status" header={t("admin.staff_template.columns.approval_status")} sortable />
        <Column
          header={t("admin.staff_template.created_by")}
          body={(r: StaffTemplateAuditRecord) => r.created_by_name ?? "-"}
        />
        <Column
          header={t("admin.staff_template.updated_by")}
          body={(r: StaffTemplateAuditRecord) => r.updated_by_name ?? "-"}
        />
        <Column
          header={t("admin.staff_template.approved_by")}
          body={(r: StaffTemplateAuditRecord) => r.approved_by_name ?? "-"}
        />
        <Column
          header={t("common.created_at")}
          body={(r: StaffTemplateAuditRecord) =>
            r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"
          }
        />
        <Column header={t("common.actions")} body={actionTemplate} style={{ width: 120 }} />
      </DataTable>
    </div>
  );
}
