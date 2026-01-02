import { useCallback, useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import ReactDOM from "react-dom/client";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { binApi } from "@/helpers/admin";
import { PencilIcon } from "@/icons";

/* ================= TYPES ================= */

type Bin = {
  unique_id: string;
  bin_name: string;
  capacity_liters: number;
  ward_name: string;
  ward?: string;
  bin_type?: string;
  waste_type?: string;
  bin_status?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_active: boolean;
};

type TableFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
  bin_name: { value: string | null; matchMode: FilterMatchMode };
};

/* ================= ROUTES ================= */

const encMasters = encryptSegment("masters");
const encBins = encryptSegment("bins");

const ENC_NEW_PATH = `/${encMasters}/${encBins}/new`;
const ENC_EDIT_PATH = (id: string) =>
  `/${encMasters}/${encBins}/${id}/edit`;

/* ================= COMPONENT ================= */

export default function BinList() {
  const { t } = useTranslation();
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<TableFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    bin_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  /* ================= DATA FETCH ================= */

  const fetchBins = useCallback(async () => {
    try {
      const data = await binApi.list();
      console.log(data);
      setBins(data);
    } catch {
      Swal.fire(t("common.error"), t("common.fetch_failed"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  /* ================= FILTER ================= */

  const onGlobalFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  /* ================= STATUS TOGGLE ================= */

  const statusBodyTemplate = (row: Bin) => {
    const updateStatus = async (checked: boolean) => {
      try {
        await binApi.update(row.unique_id, {
          bin_name: row.bin_name,
          capacity_liters: row.capacity_liters,
          is_active: checked,
        });
        fetchBins();
      } catch {
        Swal.fire(t("common.error"), t("common.update_status_failed"), "error");
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  /* ================= ACTIONS ================= */

  const actionBodyTemplate = (row: Bin) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
        title={t("common.edit")}
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: any, options: any) =>
    options.rowIndex + 1;

  /* ================= HEADER SEARCH ================= */

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder={t("common.search_item_placeholder", {
            item: t("admin.nav.bin_master"),
          })}
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  const buildBinQrPayload = (bin: Bin) => ({
    id: bin.unique_id,
    name: bin.bin_name,
    ward: bin.ward_name || bin.ward || "",
    capacity_liters: bin.capacity_liters,
    bin_type: bin.bin_type,
    waste_type: bin.waste_type,
    bin_status: bin.bin_status,
    is_active: bin.is_active,
    status: bin.is_active ? "active" : "inactive",
    latitude: bin.latitude,
    longitude: bin.longitude,
  });

  const openQrPopup = (payload: any) => {
    Swal.fire({
      title: t("admin.bin.qr_title"),
      html: `<div id="bin-qr-holder" class="flex justify-center"></div>`,
      width: 350,
      didOpen: () => {
        const div = document.getElementById("bin-qr-holder");
        if (div) {
          const root = ReactDOM.createRoot(div);
          root.render(<QRCode value={JSON.stringify(payload)} size={200} />);
        }
      },
    });
  };

  const qrTemplate = (bin: Bin) => {
    const payload = buildBinQrPayload(bin);
    return (
      <button
        className="p-1 border rounded bg-white shadow-sm hover:bg-gray-50"
        onClick={() => openQrPopup(payload)}
        title={t("admin.bin.qr_show")}
      >
        <QRCode value={JSON.stringify(payload)} size={45} />
      </button>
    );
  };

  /* ================= RENDER ================= */

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {t("admin.nav.bin_master")}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("common.manage_item_records", { item: t("admin.nav.bin_master") })}
          </p>
        </div>

        <Button
          label={t("common.add_item", { item: t("admin.nav.bin_creation") })}
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      {/* Table */}
      <DataTable
        value={bins}
        dataKey="unique_id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        filters={filters}
        globalFilterFields={["bin_name"]}
        header={header}
        stripedRows
        showGridlines
        loading={loading}
        className="p-datatable-sm"
      >
        <Column
          header={t("common.s_no")}
          body={indexTemplate}
          style={{ width: "80px" }}
        />

        <Column
          field="bin_name"
          header={t("common.item_name", { item: t("admin.nav.bin_master") })}
          sortable
          style={{ minWidth: "200px" }}
        />

        <Column
          field="capacity_liters"
          header={t("common.capacity_liters")}
          sortable
          style={{ minWidth: "150px" }}
        />
        <Column
          field="ward_name"
          header={t("admin.nav.ward")}
          body={(row: Bin) => row.ward_name || row.ward || "-"}
          sortable
          style={{ minWidth: "120px" }}
        />

        <Column header={t("admin.bin.qr_label")} body={qrTemplate} style={{ width: "100px" }} />

        <Column
          header={t("common.status")}
          body={statusBodyTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />

        <Column
          header={t("common.actions")}
          body={actionBodyTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
