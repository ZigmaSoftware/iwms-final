import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { Input } from "@/components/ui/input";

import { adminApi } from "@/helpers/admin/registry";
import { getEncryptedRoute } from "@/utils/routeCache";

type SelectOption = { value: string; label: string };

type HouseholdPickupFormState = {
  customer_id: string;
  zone_id: string;
  property_id: string;
  sub_property_id: string;
  pickup_time: string;
  weight_kg: string;
  collector_staff_id: string;
  vehicle_id: string;
  source: string;
};

const sourceOptions: SelectOption[] = [
  { value: "HOUSEHOLD_WASTE", label: "Household Waste" },
  { value: "HOUSEHOLD_BIN", label: "Household Bin" },
  { value: "OTHERS", label: "Others" },
];

const normalizeList = (payload: any): any[] =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload?.results ?? [];

const toOptions = (items: any[], valueKey: string, labelKey: string): SelectOption[] =>
  items
    .map((item) => ({
      value: String(item?.[valueKey] ?? ""),
      label: String(item?.[labelKey] ?? item?.[valueKey] ?? ""),
    }))
    .filter((option) => option.value);

const toDateTimeLocal = (value?: string | null) =>
  value ? String(value).slice(0, 16) : "";

export default function HouseholdPickupEventForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const householdPickupEventApi = adminApi.householdPickupEvents;
  const customerApi = adminApi.customerCreations;
  const zoneApi = adminApi.zones;
  const propertyApi = adminApi.properties;
  const subPropertyApi = adminApi.subProperties;
  const userApi = adminApi.usercreations;
  const vehicleApi = adminApi.vehicleCreations;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [zones, setZones] = useState<SelectOption[]>([]);
  const [properties, setProperties] = useState<SelectOption[]>([]);
  const [subProperties, setSubProperties] = useState<SelectOption[]>([]);
  const [collectors, setCollectors] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);

  const [formData, setFormData] = useState<HouseholdPickupFormState>({
    customer_id: "",
    zone_id: "",
    property_id: "",
    sub_property_id: "",
    pickup_time: "",
    weight_kg: "",
    collector_staff_id: "",
    vehicle_id: "",
    source: "",
  });

  const { encCustomerMaster, encHouseholdPickupEvent } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encCustomerMaster}/${encHouseholdPickupEvent}`;

  useEffect(() => {
    setFetching(true);
    Promise.all([
      customerApi.list(),
      zoneApi.list(),
      propertyApi.list(),
      subPropertyApi.list(),
      userApi.list(),
      vehicleApi.list(),
    ])
      .then(([customerRes, zoneRes, propertyRes, subPropertyRes, userRes, vehicleRes]) => {
        const staffUsers = normalizeList(userRes).filter(
          (u: any) => String(u?.user_type_name ?? "").toLowerCase() === "staff"
        );

        setCustomers(toOptions(normalizeList(customerRes), "unique_id", "customer_name"));
        setZones(toOptions(normalizeList(zoneRes), "unique_id", "name"));
        setProperties(toOptions(normalizeList(propertyRes), "unique_id", "property_name"));
        setSubProperties(toOptions(normalizeList(subPropertyRes), "unique_id", "sub_property_name"));
        setCollectors(toOptions(staffUsers, "unique_id", "staff_name"));
        setVehicles(toOptions(normalizeList(vehicleRes), "unique_id", "vehicle_no"));
      })
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      })
      .finally(() => setFetching(false));
  }, [customerApi, propertyApi, subPropertyApi, t, userApi, vehicleApi, zoneApi]);

  useEffect(() => {
    if (!isEdit || !id) return;

    householdPickupEventApi
      .get(id)
      .then((res: any) => {
        setFormData({
          customer_id: res?.customer_id ?? "",
          zone_id: res?.zone_id ?? "",
          property_id: res?.property_id ?? "",
          sub_property_id: res?.sub_property_id ?? "",
          pickup_time: toDateTimeLocal(res?.pickup_time),
          weight_kg: res?.weight_kg ? String(res.weight_kg) : "",
          collector_staff_id: res?.collector_staff_id ?? "",
          vehicle_id: res?.vehicle_id ?? "",
          source: res?.source ?? "",
        });
      })
      .catch(() => {
        Swal.fire(t("common.error"), t("common.load_failed"), "error");
      });
  }, [householdPickupEventApi, id, isEdit, t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formData.customer_id ||
      !formData.zone_id ||
      !formData.property_id ||
      !formData.sub_property_id ||
      !formData.pickup_time ||
      !formData.collector_staff_id ||
      !formData.vehicle_id ||
      !formData.source
    ) {
      Swal.fire(t("common.warning"), t("common.missing_fields"), "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: formData.customer_id,
        zone_id: formData.zone_id,
        property_id: formData.property_id,
        sub_property_id: formData.sub_property_id,
        pickup_time: formData.pickup_time,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        collector_staff_id: formData.collector_staff_id,
        vehicle_id: formData.vehicle_id,
        source: formData.source,
      };

      if (isEdit && id) {
        await householdPickupEventApi.update(id, payload);
      } else {
        await householdPickupEventApi.create(payload);
      }

      Swal.fire(
        t("common.success"),
        isEdit ? t("common.updated_success") : t("common.added_success"),
        "success"
      );
      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message = error?.response?.data?.detail || t("common.save_failed_desc");
      Swal.fire(t("common.save_failed"), message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <ComponentCard
        title={
          isEdit
            ? t("admin.household_pickup_event.title_edit")
            : t("admin.household_pickup_event.title_add")
        }
        desc={t("admin.household_pickup_event.subtitle")}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>{t("admin.household_pickup_event.customer")}</Label>
              <Select
                value={formData.customer_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, customer_id: value }))}
                options={customers}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.zone")}</Label>
              <Select
                value={formData.zone_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, zone_id: value }))}
                options={zones}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.property")}</Label>
              <Select
                value={formData.property_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, property_id: value }))}
                options={properties}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.sub_property")}</Label>
              <Select
                value={formData.sub_property_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, sub_property_id: value }))}
                options={subProperties}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.collector")}</Label>
              <Select
                value={formData.collector_staff_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, collector_staff_id: value }))}
                options={collectors}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.vehicle")}</Label>
              <Select
                value={formData.vehicle_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, vehicle_id: value }))}
                options={vehicles}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.pickup_time")}</Label>
              <Input
                type="datetime-local"
                value={formData.pickup_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, pickup_time: e.target.value }))}
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.weight_kg")}</Label>
              <Input
                type="number"
                min={0}
                value={formData.weight_kg}
                onChange={(e) => setFormData((prev) => ({ ...prev, weight_kg: e.target.value }))}
              />
            </div>

            <div>
              <Label>{t("admin.household_pickup_event.source")}</Label>
              <Select
                value={formData.source}
                onChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
                options={sourceOptions}
                placeholder={t("common.select_option")}
                disabled={fetching}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading || fetching}
              className="rounded-lg bg-green-custom px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? t("common.saving") : isEdit ? t("common.update") : t("common.save")}
            </button>

            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
