import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Input } from "@/components/ui/input";

import { adminApi } from "@/helpers/admin/registry";
import { getEncryptedRoute } from "@/utils/routeCache";

const customerApi = adminApi.customerCreations;
const feedbackApi = adminApi.feedbacks;

type Customer = {
  id: number;
  unique_id?: string;
  customer_name: string;
  building_no: string;
  street: string;
  area: string;
  zone_name: string;
  ward_name: string;
  city_name: string;
  district_name: string;
  state_name: string;
  country_name: string;
};

function FeedBackForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [feedbackCategory, setFeedbackCategory] = useState("Excellent");
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encCitizenGrivence, encFeedback } = getEncryptedRoute();
  const LIST_PATH = `/${encCitizenGrivence}/${encFeedback}`;

  const resolveId = (c: Customer) => c.unique_id ?? String(c.id);

  /* ---------------- LOAD CUSTOMERS ---------------- */
  useEffect(() => {
    customerApi.list().then((res) => {
      setCustomers(res || []);
      if (!isEdit && res?.length) {
        setCustomerId(resolveId(res[0])); // SAFE default
      }
    });
  }, [isEdit]);

  /* ---------------- EDIT MODE ---------------- */
  useEffect(() => {
    if (!isEdit) return;

    feedbackApi.get(id as string).then((res) => {
      setCustomerId(
        res.customer ?? res.customer_id ?? res.customer_unique_id
      );
      setFeedbackCategory(res.category || "Excellent");
      setFeedbackDetails(res.feedback_details || "");
    });
  }, [id, isEdit]);

  const selectedCustomer = customers.find(
    (c) => resolveId(c) === customerId
  );

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      Swal.fire("Warning", "Customer is required", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: customerId,
        category: feedbackCategory,
        feedback_details: feedbackDetails,
      };

      isEdit
        ? await feedbackApi.update(id as string, payload)
        : await feedbackApi.create(payload);

      Swal.fire("Success", "Saved successfully", "success");
      navigate(LIST_PATH);
    } catch {
      Swal.fire("Error", "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <ComponentCard title="Add Feedback">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Customer */}
          <div>
            <Label>
              Customer <span className="text-red-500">*</span>
            </Label>
            <Select
              value={customerId}
              onChange={(val) => setCustomerId(val)}
              options={customers.map((c) => ({
                value: resolveId(c),
                label: c.customer_name,
              }))}
            />
          </div>

          {/* Address */}
          <div>
            <Label>Customer Address</Label>
            <Input
              disabled
              className="bg-gray-100"
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
            />
          </div>

          {/* Zone */}
          <div>
            <Label>Customer Zone</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.zone_name || ""} />
          </div>

          {/* Ward */}
          <div>
            <Label>Customer Ward</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.ward_name || ""} />
          </div>

          {/* City */}
          <div>
            <Label>Customer City</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.city_name || ""} />
          </div>

          {/* District */}
          <div>
            <Label>Customer District</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.district_name || ""} />
          </div>

          {/* State */}
          <div>
            <Label>Customer State</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.state_name || ""} />
          </div>

          {/* Country */}
          <div>
            <Label>Customer Country</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.country_name || ""} />
          </div>

          {/* Feedback Category */}
          <div>
            <Label>Feedback Category</Label>
            <Select
              value={feedbackCategory}
              onChange={(val) => setFeedbackCategory(val)}
              options={[
                { value: "Excellent", label: "Excellent" },
                { value: "Satisfied", label: "Satisfied" },
                { value: "Not Satisfied", label: "Not Satisfied" },
                { value: "Poor", label: "Poor" },
              ]}
            />
          </div>

          {/* Feedback Details */}
          <div>
            <Label>Feedback Details</Label>
            <Input
              value={feedbackDetails}
              onChange={(e) => setFeedbackDetails(e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate(LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default FeedBackForm;
