import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Input } from "@/components/ui/input";

import { adminApi } from "@/helpers/admin/registry";
import { getEncryptedRoute } from "@/utils/routeCache";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      Swal.fire(
        t("common.warning"),
        t("admin.citizen_grievance.feedback_form.customer_required"),
        "warning"
      );
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

      Swal.fire(
        t("common.success"),
        t("admin.citizen_grievance.feedback_form.saved"),
        "success"
      );
      navigate(LIST_PATH);
    } catch {
      Swal.fire(
        t("common.error"),
        t("admin.citizen_grievance.feedback_form.save_failed"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <ComponentCard
      title={
        isEdit
          ? t("admin.citizen_grievance.feedback_form.title_edit")
          : t("admin.citizen_grievance.feedback_form.title_add")
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Customer */}
          <div>
            <Label>
              {t("admin.citizen_grievance.feedback_form.customer")}{" "}
              <span className="text-red-500">*</span>
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
            <Label>{t("admin.citizen_grievance.feedback_form.customer_address")}</Label>
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
            <Label>{t("admin.citizen_grievance.feedback_form.customer_zone")}</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.zone_name || ""} />
          </div>

          {/* Ward */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.customer_ward")}</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.ward_name || ""} />
          </div>

          {/* City */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.customer_city")}</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.city_name || ""} />
          </div>

          {/* District */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.customer_district")}</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.district_name || ""} />
          </div>

          {/* State */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.customer_state")}</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.state_name || ""} />
          </div>

          {/* Country */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.customer_country")}</Label>
            <Input disabled className="bg-gray-100"
              value={selectedCustomer?.country_name || ""} />
          </div>

          {/* Feedback Category */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.feedback_category")}</Label>
            <Select
              value={feedbackCategory}
              onChange={(val) => setFeedbackCategory(val)}
              options={[
                { value: "Excellent", label: t("admin.citizen_grievance.feedback_form.categories.excellent") },
                { value: "Satisfied", label: t("admin.citizen_grievance.feedback_form.categories.satisfied") },
                { value: "Not Satisfied", label: t("admin.citizen_grievance.feedback_form.categories.not_satisfied") },
                { value: "Poor", label: t("admin.citizen_grievance.feedback_form.categories.poor") },
              ]}
            />
          </div>

          {/* Feedback Details */}
          <div>
            <Label>{t("admin.citizen_grievance.feedback_form.feedback_details")}</Label>
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
            {loading ? t("admin.citizen_grievance.feedback_form.saving") : t("common.save")}
          </button>
          <button
            type="button"
            onClick={() => navigate(LIST_PATH)}
            className="bg-red-400 text-white px-4 py-2 rounded"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default FeedBackForm;
