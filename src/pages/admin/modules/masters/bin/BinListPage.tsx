import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ReactDOM from "react-dom/client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import QRCode from "react-qr-code";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon } from "@/icons";
import { encryptSegment } from "@/utils/routeCrypto";
import { Switch } from "@/components/ui/switch";
import { binApi } from "@/helpers/admin";

type BinRecord = {
  unique_id: string;
  name: string;
  code?: string;
  capacity?: number | string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_active: boolean;
};

type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Something went wrong while processing the request.";
  if (typeof error === "string") return error;

  const data = (error as ErrorWithResponse)?.response?.data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(", ");

  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([k, v]) =>
        Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${String(v)}`
      )
      .join("\n");
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while processing the request.";
};

export default function BinListPage() {
  const [bins, setBins] = useState<BinRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encBins = encryptSegment("bins");

  const ENC_NEW_PATH = `/${encMasters}/${encBins}/new`;
  const ENC_EDIT_PATH = (id: string) => `/${encMasters}/${encBins}/${id}/edit`;

  const fetchBins = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await binApi.list()) as BinRecord[];
      setBins(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load bins",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBins();
  }, [fetchBins]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const nextFilters = { ...filters };
    nextFilters.global.value = value;
    setFilters(nextFilters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Bins..."
          className="p-inputtext-sm !border-0 !shadow-none !outline-none"
        />
      </div>
    </div>
  );

  const statusTemplate = (row: BinRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await binApi.update(row.unique_id, { is_active: value });
        void fetchBins();
      } catch (err) {
        console.error("Status update failed:", err);
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: BinRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: BinRecord, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const buildBinQrPayload = (bin: BinRecord) => ({
    id: bin.unique_id,
    name: bin.name,
    code: bin.code ?? "",
    capacity: bin.capacity ?? "",
    address: bin.address ?? "",
    latitude: bin.latitude ?? "",
    longitude: bin.longitude ?? "",
    status: bin.is_active ? "Active" : "Inactive",
  });

  const openQrPopup = (payload: Record<string, unknown>) => {
    Swal.fire({
      title: "Bin QR",
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

  const qrTemplate = (bin: BinRecord) => {
    const payload = buildBinQrPayload(bin);
    return (
      <button
        className="p-1 border rounded bg-white shadow-sm hover:bg-gray-50"
        onClick={() => openQrPopup(payload)}
      >
        <QRCode value={JSON.stringify(payload)} size={45} />
      </button>
    );
  };

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Bins</h1>
            <p className="text-gray-500 text-sm">Manage bin records</p>
          </div>

          <Button
            label="Add Bin"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={bins}
          dataKey="unique_id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          filters={filters}
          header={renderHeader()}
          stripedRows
          showGridlines
          emptyMessage="No bins found."
          globalFilterFields={["name", "code", "capacity", "address"]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column field="name" header="Bin Name" sortable />
          <Column
            field="code"
            header="Bin Code"
            sortable
            body={(row: BinRecord) => row.code ?? "--"}
          />
          <Column
            field="capacity"
            header="Capacity"
            sortable
            body={(row: BinRecord) => row.capacity ?? "--"}
          />
          <Column
            field="address"
            header="Address"
            body={(row: BinRecord) => row.address ?? "--"}
          />
          <Column
            field="latitude"
            header="Latitude"
            body={(row: BinRecord) => row.latitude ?? "--"}
            style={{ width: "140px" }}
          />
          <Column
            field="longitude"
            header="Longitude"
            body={(row: BinRecord) => row.longitude ?? "--"}
            style={{ width: "140px" }}
          />
          <Column header="QR" body={qrTemplate} style={{ width: "100px" }} />
          <Column header="Status" body={statusTemplate} style={{ width: "140px" }} />
          <Column
            header="Actions"
            body={actionTemplate}
            style={{ width: "150px", textAlign: "center" }}
          />
        </DataTable>
      </div>
    </div>
  );
}
