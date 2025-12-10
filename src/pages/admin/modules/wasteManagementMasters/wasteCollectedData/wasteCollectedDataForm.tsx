import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { adminApi } from "@/helpers/admin";
import { Input } from "@/components/ui/input";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { getEncryptedRoute } from "@/utils/routeCache";
import {
  filterActiveCustomers,
  normalizeCustomerArray,
} from "@/utils/customerUtils";

type Customer = {
  id: number;
  customer_name: string;
  contact_no: string;
  building_no: string;
  street: string;
  area: string;
  pincode: string;
  zone_name: string;
  city_name: string;
  ward_name: string;
  country_name: string;
  district_name: string;
  state_name: string;
};

function WasteCollectedForm() {

  const [customerId, setCustomerId] = useState<string>(""); // always a string

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [wetWaste, setWetWaste] = useState<number>(0);
  const [dryWaste, setDryWaste] = useState<number>(0);
  const [mixedWaste, setMixedWaste] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [totalQuantity, setTotalQuantity] = useState<number>();

  const navigate = useNavigate();


  const { encWasteManagementMaster, encWasteCollectedData } = getEncryptedRoute();

  const ENC_LIST_PATH = `/${encWasteManagementMaster}/${encWasteCollectedData}`;
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Calculate total quantity whenever individual quantities change
  useEffect(() => {
    setTotalQuantity(wetWaste + dryWaste + mixedWaste);
  }, [wetWaste, dryWaste, mixedWaste]);

  const fetchCustomers = async (includeCustomerId?: number | string) => {
    try {
      const res = await adminApi.customerCreations.list();
      const data = normalizeCustomerArray(res as any);
      setCustomers(
        filterActiveCustomers(
          data,
          includeCustomerId ? [includeCustomerId] : []
        )
      );
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch existing waste collection if editing
  useEffect(() => {
    if (isEdit) {
      adminApi.wasteCollections
        .get(id as string)
        .then((res: any) => {
          const customerIdFromApi = res.customer ?? res.customer_id ?? "";
          setCustomerId(String(customerIdFromApi));
          setWetWaste(res.wet_waste);
          setDryWaste(res.dry_waste);
          setMixedWaste(res.mixed_waste);
          fetchCustomers(customerIdFromApi);
        })
        .catch((err: any) => {
          console.error("Failed to fetch waste collection:", err);
          Swal.fire({
            icon: "error",
            title: "Failed to load data",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please select a customer.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: customerId,
        wet_waste: wetWaste,
        dry_waste: dryWaste,
        mixed_waste: mixedWaste,
        total_quantity: totalQuantity,
      };

      if (isEdit) {
        await adminApi.wasteCollections.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await adminApi.wasteCollections.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      console.error("Failed to save:", err);
      let message = "Something went wrong while saving.";
      const data = err.response?.data;
      if (data && typeof data === "object") {
        message = Object.entries(data)
          .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
          .join("\n");
      }
      Swal.fire({ icon: "error", title: "Save failed", text: message });
    } finally {
      setLoading(false);
    }
  };

  // Get selected customer object for display
  const resolveId = (c: any) =>
    c?.unique_id ?? (c?.id !== undefined ? String(c.id) : "");

  const selectedCustomer = customers.find((c: any) => resolveId(c) === customerId);

  return (
    <ComponentCard
      title={isEdit ? "Edit Waste Collection" : "Add Waste Collection"}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Select */}
          <div>
            <Label htmlFor="customer">
              Customer <span className="text-red-500">*</span>
            </Label>
            <Select
              id="customer"
              value={customerId}                          // string
              onChange={(val) => setCustomerId(val)}      // keep as string
              options={customers.map((c: any) => ({
                value: resolveId(c),
                label: c.customer_name,
              }))}
              className="w-full"
              required
            />

          </div>

          {/* Address */}
          <div>
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Input
              id="customerAddress"
              type="text"
              value={
                selectedCustomer
                  ? [
                    selectedCustomer.building_no,
                    selectedCustomer.street,
                    selectedCustomer.area,
                  ]
                    .filter(Boolean) // removes undefined or empty parts
                    .join(", ")
                  : ""
              }
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* Zone (Auto-filled) */}
          <div>
            <Label htmlFor="customerZone">Customer Zone</Label>
            <Input
              id="customerZone"
              type="text"
              value={selectedCustomer?.zone_name || ""}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* Ward (Auto-filled) */}
          <div>
            <Label htmlFor="customerWard">Customer Ward</Label>
            <Input
              id="customerWard"
              type="text"
              value={selectedCustomer?.ward_name || ""}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* City (Auto-filled) */}
          <div>
            <Label htmlFor="customerCity">Customer City</Label>
            <Input
              id="customerCity"
              type="text"
              value={selectedCustomer?.city_name || ""}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* District (Auto-filled) */}
          <div>
            <Label htmlFor="customerDistrict">Customer District</Label>
            <Input
              id="customerDistrict"
              type="text"
              value={selectedCustomer?.district_name || ""}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* State (Auto-filled) */}
          <div>
            <Label htmlFor="customerState">Customer State</Label>
            <Input
              id="customerState"
              type="text"
              value={selectedCustomer?.state_name || ""}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* Country (Auto-filled) */}
          <div>
            <Label htmlFor="customerCountry">Customer Country</Label>
            <Input
              id="customerCountry"
              type="text"
              value={selectedCustomer?.country_name || ""}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* Dry Waste */}
          <div>
            <Label htmlFor="dryWaste">Dry Waste (kg)</Label>
            <Input
              id="dryWaste"
              type="number"
              value={dryWaste}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setDryWaste(value);
              }}
              className="input-validate w-full"
              required
            />
          </div>

          {/* Wet Waste */}
          <div>
            <Label htmlFor="wetWaste">Wet Waste (kg)</Label>
            <Input
              id="wetWaste"
              type="number"
              value={wetWaste}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setWetWaste(value);
              }}
              className="w-full"
              required
            />
          </div>

          {/* Mixed Waste */}
          <div>
            <Label htmlFor="mixedWaste">Mixed Waste (kg)</Label>
            <Input
              id="mixedWaste"
              type="number"
              value={mixedWaste}
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value) || 0);
                setMixedWaste(value);
              }}
              className="w-full"
              required
            />
          </div>

          {/* Total Quantity */}
          <div>
            <Label htmlFor="totalQuantity">Total Quantity (kg)</Label>
            <Input
              id="totalQuantity"
              type="number"
              value={totalQuantity}
              disabled
              className="w-full bg-gray-100"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
          >
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(ENC_LIST_PATH)
            }
            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default WasteCollectedForm;
