import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";

import { adminApi } from "@/helpers/admin/registry";
import { useTranslation } from "react-i18next";

export default function RoutePlanForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const routePlanApi = adminApi.routePlans;
  const districtApi = adminApi.districts;
  const zoneApi = adminApi.zones;
  const vehicleApi = adminApi.vehicleCreations;
  const staffApi = adminApi.staffCreation;

  const [districts, setDistricts] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);

  const [form, setForm] = useState<any>({ district_id: null, zone_id: null, vehicle_id: null, supervisor_id: null, status: "ACTIVE" });

  useEffect(() => {
    districtApi.list().then((res: any) => setDistricts(res?.results ?? res ?? []));
    zoneApi.list().then((res: any) => setZones(res?.results ?? res ?? []));
    vehicleApi.list().then((res: any) => setVehicles(res?.results ?? res ?? []));
    staffApi.list().then((res: any) => setSupervisors(res?.results ?? res ?? []));

    if (id) {
      routePlanApi.get(id as string).then((res: any) => setForm(res ?? {}));
    }
  }, [id]);

  const handleSave = async () => {
    try {
      if (id) {
        await routePlanApi.update(id as string, form);
      } else {
        await routePlanApi.create(form);
      }
      Swal.fire({ icon: "success", title: t("common.saved_success") });
      navigate(-1);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: t("common.error"), text: t("common.request_failed") });
    }
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">{t("admin.route_plan.title")}</h1>
          <p className="text-gray-500 text-sm">{t("admin.route_plan.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">{t("admin.route_plan.district")}</label>
          <Dropdown value={form.district_id} options={districts} onChange={(e) => setForm((f:any)=>({...f, district_id: e.value}))} optionLabel="name" optionValue="unique_id" placeholder="Select district" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">{t("admin.route_plan.zone")}</label>
          <Dropdown value={form.zone_id} options={zones} onChange={(e) => setForm((f:any)=>({...f, zone_id: e.value}))} optionLabel="name" optionValue="unique_id" placeholder="Select zone" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">{t("admin.route_plan.vehicle")}</label>
          <Dropdown value={form.vehicle_id} options={vehicles} onChange={(e) => setForm((f:any)=>({...f, vehicle_id: e.value}))} optionLabel="vehicle_no" optionValue="id" placeholder="Select vehicle" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">{t("admin.route_plan.supervisor")}</label>
          <Dropdown value={form.supervisor_id} options={supervisors} onChange={(e) => setForm((f:any)=>({...f, supervisor_id: e.value}))} optionLabel="employee_name" optionValue="id" placeholder="Select supervisor" />
        </div>
      </div>

      <div className="mt-6">
        <Button label={t("common.save")} className="p-button-primary" onClick={handleSave} />
      </div>
    </div>
  );
}
