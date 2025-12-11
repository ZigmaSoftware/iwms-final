import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/input";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { getEncryptedRoute } from "@/utils/routeCache";
import {
  filterActiveCustomers,
  normalizeCustomerArray,
} from "@/utils/customerUtils";
import { adminApi } from "@/helpers/admin/registry";

const customerApi = adminApi.customerCreations;
const feedbackApi = adminApi.feedbacks;

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

function FeedBackForm() {
  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [feedbackCategory, setFeedBackCategory] = useState<string>(""); // use string, not String
  const [feedbackDetails, setFeedBackDetails] = useState<string>(""); // use string, not String
  const [loading, setLoading] = useState(false);
  const [customerFallbackId, setCustomerFallbackId] = useState<string | null>(null);

  const navigate = useNavigate();

  const { encCitizenGrivence, encFeedback } = getEncryptedRoute();

  const ENC_LIST_PATH = `/${encCitizenGrivence}/${encFeedback}`;

  const loadCustomers = useCallback(async (includeId?: string) => {
    try {
      const response = await customerApi.list();
      const normalized = normalizeCustomerArray(response);
      setCustomers(
        filterActiveCustomers(normalized, includeId ? [includeId] : [])
      );
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  }, []);

  const resolveId = (c: any) =>
    c?.unique_id ?? (c?.id !== undefined ? String(c.id) : "");

  useEffect(() => {
    loadCustomers(customerFallbackId ?? undefined);
  }, [customerFallbackId, loadCustomers]);

  const { id } = useParams();
  const isEdit = Boolean(id);

  // Fetch feedback for edit mode
  useEffect(() => {
    if (isEdit) {
      feedbackApi
        .get(id as string)
        .then((res) => {
          const customerValue = String(
            res.customer ?? res.customer_id ?? res.customer_unique_id ?? ""
          );
          setCustomerId(customerValue);
          setFeedBackCategory(res.category || "");
          setFeedBackDetails(res.feedback_details || "");
          if (customerValue) {
            setCustomerFallbackId(customerValue);
          }
        })
        .catch((err) => {
          Swal.fire({
            icon: "error",
            title: "Failed to load data",
            text: err.response?.data?.detail || "Something went wrong!",
          });
        });
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      setCustomerFallbackId(null);
    }
  }, [isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || !feedbackCategory) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please select a customer and feedback category.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: customerId,
        category: feedbackCategory,
        feedback_details: feedbackDetails,
      };

      if (isEdit) {
        await feedbackApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await feedbackApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data && typeof data === "object"
          ? Object.entries(data)
            .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
            .join("\n")
          : "Something went wrong while saving.";
      Swal.fire({ icon: "error", title: "Save failed", text: message });
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(
    (c) => resolveId(c) === customerId
  );

  return (
    <ComponentCard title={isEdit ? "Edit Feedback" : "Add Feedback"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Select */}
          <div>
            <Label htmlFor="customer">
              Customer <span className="text-red-500">*</span>
            </Label>
            <Select
              id="customer"
              value={customerId}
              onChange={(val) => setCustomerId(val)}
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
                    .filter(Boolean)
                    .join(", ")
                  : ""
              }
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* Zone, Ward, City, etc. */}
          {[
            ["Zone", "zone_name"],
            ["Ward", "ward_name"],
            ["City", "city_name"],
            ["District", "district_name"],
            ["State", "state_name"],
            ["Country", "country_name"],
          ].map(([label, key]) => (
            <div key={key}>
              <Label htmlFor={`customer${label}`}>{`Customer ${label}`}</Label>
              <Input
                id={`customer${label}`}
                type="text"
                value={selectedCustomer?.[key as keyof Customer] || ""}
                disabled
                className="w-full bg-gray-100"
              />
            </div>
          ))}

          {/* Feedback Category */}
          <div>
            <Label htmlFor="feedbackCategory">Feedback Category</Label>
            <Select
              id="feedbackCategory"
              value={feedbackCategory}
              onChange={(val) => setFeedBackCategory(val)}
              options={[
                { value: "Excellent", label: "Excellent" },
                { value: "Satisfied", label: "Satisfied" },
                { value: "Not Satisfied", label: "Not Satisfied" },
                { value: "Poor", label: "Poor" },
              ]}
              className="w-full"
              required
            />
          </div>

          {/* Feedback Details */}
          <div>
            <Label htmlFor="feedbackDetails">Feedback Details</Label>
            <Input
              id="feedbackDetails"
              type="text"
              value={feedbackDetails}
              onChange={(e) => setFeedBackDetails(e.target.value)}
              className="w-full"
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
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default FeedBackForm;
