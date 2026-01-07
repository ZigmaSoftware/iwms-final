import { AlertTriangle, MapPin, Trash2, Users } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import { MetricCard } from "@/components/MetricCard";
import { DataCard } from "@/components/ui/DataCard";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const activityItems = [
    {
      title: t("admin.dashboard_home.activity.route_survey_title"),
      description: t("admin.dashboard_home.activity.route_survey_desc"),
      time: t("admin.dashboard_home.activity.route_survey_time"),
      status: t("admin.dashboard_home.activity.route_survey_status"),
    },
    {
      title: t("admin.dashboard_home.activity.missed_pickup_title"),
      description: t("admin.dashboard_home.activity.missed_pickup_desc"),
      time: t("admin.dashboard_home.activity.missed_pickup_time"),
      status: t("admin.dashboard_home.activity.missed_pickup_status"),
    },
    {
      title: t("admin.dashboard_home.activity.bulk_waste_title"),
      description: t("admin.dashboard_home.activity.bulk_waste_desc"),
      time: t("admin.dashboard_home.activity.bulk_waste_time"),
      status: t("admin.dashboard_home.activity.bulk_waste_status"),
    },
  ];

  const capacitySummary = [
    {
      label: t("admin.dashboard_home.capacity.total_vehicles"),
      value: "214",
      hint: t("admin.dashboard_home.capacity.total_vehicles_hint"),
    },
    {
      label: t("admin.dashboard_home.capacity.field_staff"),
      value: "1,420",
      hint: t("admin.dashboard_home.capacity.field_staff_hint"),
    },
    {
      label: t("admin.dashboard_home.capacity.processing_units"),
      value: "12",
      hint: t("admin.dashboard_home.capacity.processing_units_hint"),
    },
  ];

  return (
    <div className="space-y-6">
      <ComponentCard
        title={t("admin.dashboard_home.title")}
        desc={t("admin.dashboard_home.subtitle")}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title={t("admin.dashboard_home.metrics.daily_collections")}
            value="5,842 tons"
            icon={Trash2}
            trend={t("admin.dashboard_home.metrics.daily_collections_trend")}
            variant="success"
          />
          <MetricCard
            title={t("admin.dashboard_home.metrics.active_vehicles")}
            value="214"
            icon={MapPin}
            trend={t("admin.dashboard_home.metrics.active_vehicles_trend")}
          />
          <MetricCard
            title={t("admin.dashboard_home.metrics.on_ground_staff")}
            value="1,311"
            icon={Users}
            trend={t("admin.dashboard_home.metrics.on_ground_staff_trend")}
            variant="warning"
          />
          <MetricCard
            title={t("admin.dashboard_home.metrics.critical_alerts")}
            value="12"
            icon={AlertTriangle}
            trend={t("admin.dashboard_home.metrics.critical_alerts_trend")}
            variant="destructive"
          />
        </div>
      </ComponentCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title={t("admin.dashboard_home.recent_activity_title")}>
          <div className="divide-y divide-border">
            {activityItems.map((item) => (
              <div key={item.title} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                  <span className="inline-flex rounded-full border px-2 py-0.5 text-xs mt-1">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard title={t("admin.dashboard_home.capacity_snapshot_title")}>
          <div className="grid gap-4">
            {capacitySummary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/60 bg-muted/30 p-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.hint}</p>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}
