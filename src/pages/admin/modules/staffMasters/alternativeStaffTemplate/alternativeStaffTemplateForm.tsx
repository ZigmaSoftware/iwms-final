import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import InputField from "@/components/form/input/InputField";

import { getEncryptedRoute } from "@/utils/routeCache";
import {
  alternativeStaffTemplateApi,
  staffTemplateApi,
  userCreationApi,
} from "@/helpers/admin";

type Option = { value: string; label: string };

type FormState = {
  staff_template: string;
  effective_date: string;
  driver: string;
  operator: string;
  extra_operator: string | null;
  change_reason: string;
  change_remarks: string;
};

const initialFormState: FormState = {
  staff_template: "",
  effective_date: "",
  driver: "",
  operator: "",
  extra_operator: null,
  change_reason: "",
  change_remarks: "",
};

export default function AlternativeStaffTemplateForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);

  const [staffTemplateOptions, setStaffTemplateOptions] = useState<Option[]>([]);
  const [driverOptions, setDriverOptions] = useState<Option[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<Option[]>([]);

  // tracks if template was chosen by user (not programmatic)
  const templateSelectedByUser = useRef(false);

  const { encStaffMasters, encAlternativeStaffTemplate } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encStaffMasters}/${encAlternativeStaffTemplate}`;

  /* =====================================================
     HARD RESET ON EVERY CREATE PAGE ENTRY
  ===================================================== */
  useEffect(() => {
    if (!isEdit) {
      setFormData(initialFormState);
      templateSelectedByUser.current = false;
    }
  }, [location.key, isEdit]);

  /* =====================================================
     LOAD MASTER DATA
  ===================================================== */
  useEffect(() => {
    staffTemplateApi.list().then((res: any) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      setStaffTemplateOptions(
        data.map((tpl: any) => ({
          value: String(tpl.unique_id),
          label: tpl.unique_id,
        }))
      );
    });

    userCreationApi.list({ params: { active_status: 1 } }).then((res: any) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];

      const staff = data.filter(
        (u: any) =>
          u.user_type_name === "Staff" &&
          u.is_active === true &&
          u.is_deleted === false &&
          u.unique_id
      );

      const toOption = (u: any) => ({
        value: String(u.unique_id),
        label: u.staff_name || u.employee_name || u.username,
      });

      setDriverOptions(
        staff.filter((s: any) => s.staffusertype_name === "driver").map(toOption)
      );

      setOperatorOptions(
        staff.filter((s: any) => s.staffusertype_name === "operator").map(toOption)
      );
    });
  }, []);

  /* =====================================================
     EDIT MODE LOAD
  ===================================================== */
  useEffect(() => {
    if (!isEdit || !id) return;

    setLoading(true);
    alternativeStaffTemplateApi
      .get(id)
      .then((rec: any) => {
        templateSelectedByUser.current = true;
        setFormData({
          staff_template: String(rec.staff_template),
          effective_date: rec.effective_date,
          driver: String(rec.driver),
          operator: String(rec.operator),
          extra_operator: rec.extra_operator ? String(rec.extra_operator) : null,
          change_reason: rec.change_reason ?? "",
          change_remarks: rec.change_remarks ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /* =====================================================
     CLEAR DEPENDENT FIELDS WHEN TEMPLATE CLEARS
  ===================================================== */
  useEffect(() => {
    if (formData.staff_template !== "") return;

    setFormData((prev) => ({
      ...prev,
      driver: "",
      operator: "",
      extra_operator: null,
    }));
  }, [formData.staff_template]);

  /* =====================================================
     AUTO-FILL ONLY AFTER USER SELECTS TEMPLATE
  ===================================================== */
  useEffect(() => {
    if (!templateSelectedByUser.current) return;
    if (!formData.staff_template) return;

    staffTemplateApi.get(formData.staff_template).then((tpl: any) => {
      setFormData((prev) => ({
        ...prev,
        driver: tpl.driver_id ?? tpl.driver?.unique_id ?? "",
        operator: tpl.operator_id ?? tpl.operator?.unique_id ?? "",
        extra_operator:
          Array.isArray(tpl.extra_operator) && tpl.extra_operator.length
            ? String(tpl.extra_operator[0])
            : null,
      }));
    });
  }, [formData.staff_template]);

  /* =====================================================
     SUBMIT
  ===================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.driver && formData.driver === formData.operator) {
      Swal.fire("Error", "Driver and Operator cannot be same", "warning");
      return;
    }

    const body = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== null && v !== "") body.append(k, String(v));
    });

    setLoading(true);
    try {
      if (isEdit && id) {
        await alternativeStaffTemplateApi.update(id, body);
      } else {
        await alternativeStaffTemplateApi.create(body);
      }
      Swal.fire("Success", "Saved successfully", "success");
      navigate(ENC_LIST_PATH);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="p-6">
      <ComponentCard title="Add Alternative Staff Template">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label>Staff Template</Label>
              <Select
                value={formData.staff_template}
                placeholder="Select staff template"
                options={staffTemplateOptions}
                onChange={(v) => {
                  templateSelectedByUser.current = true;
                  setFormData((p) => ({ ...p, staff_template: v }));
                }}
                required
              />
            </div>

            <div>
              <Label>Effective Date</Label>
              <InputField
                type="date"
                value={formData.effective_date}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    effective_date: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <Label>Driver</Label>
              <Select
                value={formData.driver}
                placeholder="Select driver"
                options={driverOptions}
                onChange={(v) => setFormData((p) => ({ ...p, driver: v }))}
                required
              />
            </div>

            <div>
              <Label>Operator</Label>
              <Select
                value={formData.operator}
                placeholder="Select operator"
                options={operatorOptions}
                onChange={(v) => setFormData((p) => ({ ...p, operator: v }))}
                required
              />
            </div>

            <div>
              <Label>Extra Operator</Label>
              <Select
                value={formData.extra_operator ?? ""}
                placeholder="Select extra operator"
                options={operatorOptions}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, extra_operator: v || null }))
                }
              />
            </div>

            <div>
              <Label>Change Reason</Label>
              <InputField
                value={formData.change_reason}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    change_reason: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div>
            <Label>Remarks</Label>
            <InputField
              value={formData.change_remarks}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  change_remarks: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-green-custom text-white px-5 py-2 rounded-lg"
              disabled={loading}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="border px-5 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
