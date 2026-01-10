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

type ZonePropertyLoadTrackerRecord = {
  id: number;
  zone_id: string;
  vehicle_id: string;
  property_id: string;
  sub_property_id: string;
  current_weight_kg: number;
  last_updated?: string | null;
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

export default function ZonePropertyLoadTrackerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const zonePropertyLoadTrackerApi = adminApi.zonePropertyLoadTrackers;
  const zoneApi = adminApi.zones;
  const vehicleApi = adminApi.vehicleCreations;
  const propertyApi = adminApi.properties;
  const subPropertyApi = adminApi.subProperties;

  const [records, setRecords] = useState<ZonePropertyLoadTrackerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [zoneLookup, setZoneLookup] = useState<Record<string, string>>({});
  const [vehicleLookup, setVehicleLookup] = useState<Record<string, string>>({});
  const [propertyLookup, setPropertyLookup] = useState<Record<string, string>>({});
  const [subPropertyLookup, setSubPropertyLookup] = useState<Record<string, string>>({});

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const { encTransportMaster, encZonePropertyLoadTracker } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encTransportMaster}/${encZonePropertyLoadTracker}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encTransportMaster}/${encZonePropertyLoadTracker}/${id}/edit`;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [trackerRes, zoneRes, vehicleRes, propertyRes, subPropertyRes] = await Promise.all([
        zonePropertyLoadTrackerApi.list(),
        zoneApi.list(),
        vehicleApi.list(),
        propertyApi.list(),
        subPropertyApi.list(),
      ]);

      setRecords(normalizeList(trackerRes));
      setZoneLookup(buildLookup(normalizeList(zoneRes), "unique_id", "name"));
      setVehicleLookup(buildLookup(normalizeList(vehicleRes), "unique_id", "vehicle_no"));
      setPropertyLookup(buildLookup(normalizeList(propertyRes), "unique_id", "property_name"));
      setSubPropertyLookup(buildLookup(normalizeList(subPropertyRes), "unique_id", "sub_property_name"));
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

  const formatUpdatedAt = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "-";

  const header = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {t("admin.zone_property_load_tracker.list_title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("admin.zone_property_load_tracker.list_subtitle")}
          </p>
        </div>

        <Button
          label={t("admin.zone_property_load_tracker.create_button")}
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
            placeholder={t("admin.zone_property_load_tracker.search_placeholder")}
            className="border-none text-sm"
          />
        </div>
      </div>
    </div>
  );

  const actionTemplate = (row: ZonePropertyLoadTrackerRecord) => (
    <div className="flex justify-center">
      <button
        title={t("common.edit")}
        onClick={() => navigate(ENC_EDIT_PATH(row.id), { state: { record: row } })}
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
        globalFilterFields={[
          "zone_id",
          "vehicle_id",
          "property_id",
          "sub_property_id",
        ]}
        header={header}
        stripedRows
        showGridlines
        className="p-datatable-sm"
        emptyMessage={t("admin.zone_property_load_tracker.empty_message")}
      >
        <Column header={t("common.s_no")} body={(_, { rowIndex }) => rowIndex + 1} style={{ width: 70 }} />
        <Column
          header={t("admin.zone_property_load_tracker.zone")}
          body={(row: ZonePropertyLoadTrackerRecord) => zoneLookup[row.zone_id] ?? row.zone_id}
        />
        <Column
          header={t("admin.zone_property_load_tracker.vehicle")}
          body={(row: ZonePropertyLoadTrackerRecord) => vehicleLookup[row.vehicle_id] ?? row.vehicle_id}
        />
        <Column
          header={t("admin.zone_property_load_tracker.property")}
          body={(row: ZonePropertyLoadTrackerRecord) => propertyLookup[row.property_id] ?? row.property_id}
        />
        <Column
          header={t("admin.zone_property_load_tracker.sub_property")}
          body={(row: ZonePropertyLoadTrackerRecord) =>
            subPropertyLookup[row.sub_property_id] ?? row.sub_property_id
          }
        />
        <Column
          field="current_weight_kg"
          header={t("admin.zone_property_load_tracker.current_weight")}
        />
        <Column
          header={t("admin.zone_property_load_tracker.last_updated")}
          body={(row: ZonePropertyLoadTrackerRecord) => formatUpdatedAt(row.last_updated)}
        />
        <Column header={t("common.actions")} body={actionTemplate} style={{ width: 120 }} />
      </DataTable>
    </div>
  );
}
