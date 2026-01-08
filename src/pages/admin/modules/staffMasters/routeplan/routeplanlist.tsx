import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

import { getEncryptedRoute } from "@/utils/routeCache";
import { adminApi } from "@/helpers/admin/registry";
import { useTranslation } from "react-i18next";

type RoutePlanRecord = {
  unique_id: string;
  district_id?: string | null;
  zone_id?: string | null;
  vehicle_id?: string | null;
  supervisor_id?: string | null;
  status?: string | null;
  created_at?: string | null;
};

const routePlanApi = adminApi.routePlans;

const normalize = (payload: any): RoutePlanRecord[] => {
  const rawList: RoutePlanRecord[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  return rawList;
};

export default function RoutePlanList() {
  const { t } = useTranslation();
  const [list, setList] = useState<RoutePlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { encStaffMasters, encRoutePlans } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encStaffMasters}/${encRoutePlans}/new`;
  const ENC_EDIT_PATH = (id: string | number) => `/${encStaffMasters}/${encRoutePlans}/${id}/edit`;

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supervisor_id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const fetchList = async () => {
    try {
      const res = await routePlanApi.list();
      setList(normalize(res));
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: t("common.error"), text: t("common.fetch_failed") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const resolveId = (row: RoutePlanRecord) => row.unique_id;

  const actionTemplate = (row: RoutePlanRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(resolveId(row)))}
        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
        title={t("common.edit")}
      >
        Edit
      </button>
    </div>
  );

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const updated = { ...filters };
    updated.global.value = value;
    setFilters(updated);
    setGlobalFilterValue(value);
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">{t("admin.route_plan.title")}</h1>
          <p className="text-gray-500 text-sm">{t("admin.route_plan.subtitle")}</p>
        </div>

        <Button label={t("admin.route_plan.add")} icon="pi pi-plus" className="p-button-success" onClick={() => navigate(ENC_NEW_PATH)} />
      </div>

      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
          <i className="pi pi-search text-gray-500" />
          <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder={t("admin.route_plan.search_placeholder")} className="p-inputtext-sm !border-0 !shadow-none" />
        </div>
      </div>

      <DataTable value={list} dataKey="unique_id" paginator rows={10} loading={loading} filters={filters} globalFilterFields={["supervisor_id"]} rowsPerPageOptions={[5,10,25,50]} className="p-datatable-sm">
        <Column header={t("common.s_no")} body={(_, { rowIndex }) => rowIndex + 1} style={{ width: "80px" }} />
        <Column field="district_id" header={t("admin.route_plan.district")} />
        <Column field="zone_id" header={t("admin.route_plan.zone")} />
        <Column field="vehicle_id" header={t("admin.route_plan.vehicle")} />
        <Column field="supervisor_id" header={t("admin.route_plan.supervisor")} />
        <Column field="status" header={t("common.status")} />
        <Column field="created_at" header={t("common.created_at")} />
        <Column header={t("common.actions")} body={actionTemplate} style={{ width: "140px" }} />
      </DataTable>
    </div>
  );
}
