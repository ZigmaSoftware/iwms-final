import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GIcon } from "@/components/ui/gicon";

import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  Cell,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

import {
  continentApi,
  countryApi,
  stateApi,
  districtApi,
  cityApi,
  zoneApi,
  wardApi,
  propertiesApi,
  subPropertiesApi,
  staffCreationApi,
  staffUserTypeApi,
  userTypeApi,
  userCreationApi,
  fuelApi,
  vehicleTypeApi,
  vehicleCreationApi,
  customerCreationApi,
  wasteCollectionApi,
  complaintApi,
  feedbackApi,
  mainScreenTypeApi,
  mainScreenApi,
  userScreenApi,
  userScreenActionApi,
  userScreenPermissionApi,
} from "@/helpers/admin";

import { MetricCard } from "./MetricCard";
import { DashboardSection } from "./DashboardSection";

interface DashboardStats {
  masterData: Record<string, number>;
  users: Record<string, number>;
  transport: Record<string, number>;
  operations: Record<string, number>;
  system: Record<string, number>;
}

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    masterData: {},
    users: {},
    transport: {},
    operations: {},
    system: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const r = await Promise.all([
        continentApi.list(),
        countryApi.list(),
        stateApi.list(),
        districtApi.list(),
        cityApi.list(),
        zoneApi.list(),
        wardApi.list(),
        propertiesApi.list(),
        subPropertiesApi.list(),
        userCreationApi.list(),
        userTypeApi.list(),
        staffUserTypeApi.list(),
        staffCreationApi.list(),
        customerCreationApi.list(),
        vehicleCreationApi.list(),
        vehicleTypeApi.list(),
        fuelApi.list(),
        wasteCollectionApi.list(),
        complaintApi.list(),
        feedbackApi.list(),
        mainScreenTypeApi.list(),
        mainScreenApi.list(),
        userScreenApi.list(),
        userScreenActionApi.list(),
        userScreenPermissionApi.list(),
      ]);

      const safe = (a: any[]) => (Array.isArray(a) ? a.length : 0);
      const users = r[9];

      setStats({
        masterData: {
          Continents: safe(r[0]),
          Countries: safe(r[1]),
          States: safe(r[2]),
          Districts: safe(r[3]),
          Cities: safe(r[4]),
          Zones: safe(r[5]),
          Wards: safe(r[6]),
          Properties: safe(r[7]),
          "Sub Properties": safe(r[8]),
        },
        users: {
          "Total Users": safe(r[9]),
          Staff: safe(r[12]),
          Customers: safe(r[13]),
          "User Types": safe(r[10]),
          "Staff User Types": safe(r[11]),
          "Active Users": users?.filter((u: any) => u.is_active)?.length || 0,
        },
        transport: {
          Vehicles: safe(r[14]),
          "Vehicle Types": safe(r[15]),
          "Fuel Types": safe(r[16]),
        },
        operations: {
          "Waste Collections": safe(r[17]),
          Complaints: safe(r[18]),
          Feedbacks: safe(r[19]),
        },
        system: {
          "Main Screen Types": safe(r[20]),
          "Main Screens": safe(r[21]),
          "User Screens": safe(r[22]),
          "Screen Actions": safe(r[23]),
          Permissions: safe(r[24]),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const totalMaster = Object.values(stats.masterData).reduce(
    (a, b) => a + b,
    0
  );
  const totalOps = Object.values(stats.operations).reduce((a, b) => a + b, 0);

  const userPie = [
    { name: "Staff", value: stats.users.Staff || 0 },
    { name: "Customers", value: stats.users.Customers || 0 },
  ];

  const masterBar = Object.entries(stats.masterData).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const opsLine = Object.entries(stats.operations).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const hasUserPieData =
    Array.isArray(userPie) && userPie.some((d) => d.value > 0);

  const hasMasterBarData =
    Array.isArray(masterBar) && masterBar.some((d) => d.value > 0);

  const hasOpsLineData =
    Array.isArray(opsLine) && opsLine.some((d) => d.value > 0);
  console.log("ops", opsLine);

  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Centralized operational intelligence
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData}>
          <GIcon name="refresh" className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI STRIP */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Master Data"
          value={totalMaster}
          icon="public"
          loading={loading}
        />
        <MetricCard
          title="Total Users"
          value={stats.users["Total Users"] || 0}
          icon="group"
          loading={loading}
        />
        <MetricCard
          title="Total Operations"
          value={totalOps}
          icon="assignment"
          loading={loading}
        />
        <MetricCard
          title="Active Users"
          value={stats.users["Active Users"] || 0}
          icon="check_circle"
          loading={loading}
        />
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="User Distribution" icon="pie_chart">
          {hasUserPieData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={userPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              icon="pie_chart"
              title="No user data available"
              subtitle=" Add staff or customers to see insights"
            />
          )}
        </ChartCard>

        <ChartCard title="Master Data Overview" icon="bar_chart">
          {hasMasterBarData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={masterBar}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              icon="bar_chart"
              title="No master data available"
              subtitle="Add locations or properties to view analytics"
            />
          )}
        </ChartCard>

        <ChartCard title="Operations Snapshot" icon="show_chart">
          {hasOpsLineData ? (
            <div className="group relative">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={opsLine}
                  margin={{ top: 20, right: 20, left: 0, bottom: 50 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 6"
                    opacity={0.12}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={40}
                    angle={-100}
                    textAnchor="end"
                    tickFormatter={(value: string) =>
                      value.length > 14 ? value.slice(0, 14) + "…" : value
                    }
                    tick={{ fontSize: 11, opacity: 0.75 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis hide />

                  <Tooltip
                    cursor={{
                      stroke: "#6366F1",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                      padding: "10px 14px",
                    }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(value: number) => [value, "Total Count"]}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    fill="rgba(99,102,241,0.18)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: "#6366F1",
                      fill: "hsl(var(--background))",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart
              icon="show_chart"
              title="No operations data available"
              subtitle="Data will appear once operations start"
            />
          )}
        </ChartCard>
      </div>

      {/* DETAIL SECTIONS */}
      <DashboardSection title="Master Data" icon="location_on">
        {Object.entries(stats.masterData).map(([k, v]) => (
          <MetricCard
            key={k}
            title={k}
            value={v}
            icon="database"
            loading={loading}
          />
        ))}
      </DashboardSection>

      <DashboardSection title="User Management" icon="people">
        {Object.entries(stats.users).map(([k, v]) => (
          <MetricCard
            key={k}
            title={k}
            value={v}
            icon="person"
            loading={loading}
          />
        ))}
      </DashboardSection>
    </div>
  );
}

/* ---------- Chart Card ---------- */

const ChartCard = ({ title, icon, children }: any) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900">
    <div className="mb-3 flex items-center gap-2">
      <GIcon name={icon} className="text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);

const EmptyChart = ({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) => (
  <div className="flex h-[220px] flex-col items-center justify-center text-center">
    <GIcon name={icon} className="mb-2 text-4xl text-muted-foreground" />
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </div>
);
