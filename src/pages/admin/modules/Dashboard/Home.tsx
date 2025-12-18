import { AlertTriangle, MapPin, Trash2, Users } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import { MetricCard } from "@/components/MetricCard";
import { DataCard } from "@/components/ui/DataCard";

const activityItems = [
  {
    title: "Route Survey Completed",
    description: "Zone 4 • Ward 18 • 42 households mapped",
    time: "3 mins ago",
    status: "Completed",
  },
  {
    title: "Missed Pickup Alert",
    description: "Zone 2 • Ward 07 • Vehicle TN38 AA 1234",
    time: "12 mins ago",
    status: "Exception",
  },
  {
    title: "Bulk Waste Request",
    description: "Coimbatore North • Industrial estate",
    time: "30 mins ago",
    status: "In-progress",
  },
];

const capacitySummary = [
  { label: "Total Vehicles", value: "214", hint: "34 routes running" },
  { label: "Field Staff", value: "1,420", hint: "1,311 checked-in" },
  { label: "Processing Units", value: "12", hint: "Avg load 78%" },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <ComponentCard
        title="Operations Overview"
        desc="Live snapshot of fleet, crew, and citizen services across the corporation."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Daily Collections"
            value="5,842 tons"
            icon={Trash2}
            trend="+6% vs last week"
            variant="success"
          />
          <MetricCard
            title="Active Vehicles"
            value="214"
            icon={MapPin}
            trend="34 routes in transit"
          />
          <MetricCard
            title="On-ground Staff"
            value="1,311"
            icon={Users}
            trend="92% attendance today"
            variant="warning"
          />
          <MetricCard
            title="Critical Alerts"
            value="12"
            icon={AlertTriangle}
            trend="4 new in the last hour"
            variant="destructive"
          />
        </div>
      </ComponentCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Recent Activity">
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

        <DataCard title="Capacity Snapshot">
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
