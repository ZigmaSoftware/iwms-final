import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {desktopApi} from "@/api";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { encryptSegment } from "@/utils/routeCrypto";
import { Switch } from "@/components/ui/switch"; // ✅ Toggle import

type City = {
  id: number;
  name: string;
  is_active: boolean;
  country_name: string;
  state_name: string;
  district_name: string;
};

export default function CityList() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encCities = encryptSegment("cities");

  const ENC_NEW_PATH = `/${encMasters}/${encCities}/new`;
  const ENC_EDIT_PATH = (id: number) =>
    `/${encMasters}/${encCities}/${id}/edit`;

  // Fetch data
  const fetchCities = async () => {
    try {
      const res = await desktopApi.get("cities/");
      setCities(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Delete
  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This city will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (!confirm.isConfirmed) return;

    await desktopApi.delete(`cities/${id}/`);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false
    });

    fetchCities();
  };

  // Search
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setFilters({
      ...filters,
      global: { ...filters.global, value }
    });

    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Cities..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const header = renderHeader();

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  // 🔥 Toggle handling (PATCH only)
  const statusTemplate = (city: City) => {
    const updateStatus = async (value: boolean) => {
      try {
        await desktopApi.patch(`cities/${city.id}/`, { is_active: value });
        fetchCities();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    };

    return <Switch checked={city.is_active} onCheckedChange={updateStatus} />;
  };

  // Actions
  const actionTemplate = (city: City) => (
    <div className="flex gap-3">
      <button
        title="Edit"
        onClick={() => navigate(ENC_EDIT_PATH(city.id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        onClick={() => handleDelete(city.id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: City, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  return (
    <div className="p-3">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Cities</h1>
            <p className="text-gray-500 text-sm">Manage city records</p>
          </div>

          <Button
            label="Add City"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        {/* Table */}
        <DataTable
          value={cities}
          paginator
          rows={10}
          loading={loading}
          filters={filters}
          header={header}
          stripedRows
          showGridlines
          emptyMessage="No cities found."
          globalFilterFields={[
            "name",
            "country_name",
            "state_name",
            "district_name"
          ]}
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

          <Column
            field="country_name"
            header="Country"
            body={(row: City) => cap(row.country_name)}
            sortable
          />

          <Column
            field="state_name"
            header="State"
            body={(row: City) => cap(row.state_name)}
            sortable
          />

          <Column
            field="district_name"
            header="District"
            body={(row: City) => cap(row.district_name)}
            sortable
          />

          <Column
            field="name"
            header="City"
            body={(row: City) => cap(row.name)}
            sortable
          />

          {/* 🔥 TOGGLE */}
          <Column
            header="Status"
            body={statusTemplate}
            style={{ width: "140px" }}
          />

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
