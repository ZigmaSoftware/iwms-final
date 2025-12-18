import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GIcon } from "@/components/ui/gicon";

import {
  PieChart,
  Pie,
  BarChart,
  Bar,
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

/* -----------------------------------------
   TYPES
----------------------------------------- */
interface DashboardStats {
  masterData: Record<string, number>;
  users: Record<string, number>;
  transport: Record<string, number>;
  operations: Record<string, number>;
  system: Record<string, number>;
}

/* -----------------------------------------
   COMPONENT
----------------------------------------- */
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

  /* -----------------------------------------
     DATA FETCH
  ----------------------------------------- */
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const requests = [
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
      ];

      const results = await Promise.allSettled(requests);

      const pick = <T,>(i: number): T[] =>
        results[i]?.status === "fulfilled" ? results[i].value : [];

      const users = pick<any>(9);

      setStats({
        masterData: {
          Continents: pick<any>(0).length,
          Countries: pick<any>(1).length,
          States: pick<any>(2).length,
          Districts: pick<any>(3).length,
          Cities: pick<any>(4).length,
          Zones: pick<any>(5).length,
          Wards: pick<any>(6).length,
          Properties: pick<any>(7).length,
          "Sub Properties": pick<any>(8).length,
        },
        users: {
          "Total Users": users.length,
          Staff: pick<any>(12).length,
          Customers: pick<any>(13).length,
          "User Types": pick<any>(10).length,
          "Staff User Types": pick<any>(11).length,
          "Active Users": users.filter((u) => u?.is_active).length,
        },
        transport: {
          Vehicles: pick<any>(14).length,
          "Vehicle Types": pick<any>(15).length,
          "Fuel Types": pick<any>(16).length,
        },
        operations: {
          "Waste Collections": pick<any>(17).length,
          Complaints: pick<any>(18).length,
          Feedbacks: pick<any>(19).length,
        },
        system: {
          "Main Screen Types": pick<any>(20).length,
          "Main Screens": pick<any>(21).length,
          "User Screens": pick<any>(22).length,
          "Screen Actions": pick<any>(23).length,
          Permissions: pick<any>(24).length,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------
     DERIVED DATA
  ----------------------------------------- */
  const totalMaster = Object.values(stats.masterData).reduce((a, b) => a + b, 0);
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

  const hasUserPieData = userPie.some((d) => d.value > 0);
  const hasMasterBarData = masterBar.some((d) => d.value > 0);
  const hasOpsLineData = opsLine.some((d) => d.value > 0);

  /* -----------------------------------------
     UI
  ----------------------------------------- */
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
        <MetricCard title="Total Master Data" value={totalMaster} icon="public" loading={loading} />
        <MetricCard title="Total Users" value={stats.users["Total Users"] || 0} icon="group" loading={loading} />
        <MetricCard title="Total Operations" value={totalOps} icon="assignment" loading={loading} />
        <MetricCard title="Active Users" value={stats.users["Active Users"] || 0} icon="check_circle" loading={loading} />
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="User Distribution" icon="pie_chart">
          {hasUserPieData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={userPie} dataKey="value" nameKey="name" outerRadius={80} label>
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon="pie_chart" title="No user data" subtitle="No permission or data" />
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
            <EmptyChart icon="bar_chart" title="No master data" subtitle="Permission restricted" />
          )}
        </ChartCard>

        <ChartCard title="Operations Snapshot" icon="show_chart">
          {hasOpsLineData ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={opsLine}>
                <CartesianGrid strokeDasharray="3 6" opacity={0.12} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#6366F1" fill="rgba(99,102,241,0.18)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon="show_chart" title="No operations data" subtitle="No permission or data" />
          )}
        </ChartCard>
      </div>

      {/* DETAIL SECTIONS */}
      <DashboardSection title="Master Data" icon="location_on">
        {Object.entries(stats.masterData).map(([k, v]) => (
          <MetricCard key={k} title={k} value={v} icon="database" loading={loading} />
        ))}
      </DashboardSection>

      <DashboardSection title="User Management" icon="people">
        {Object.entries(stats.users).map(([k, v]) => (
          <MetricCard key={k} title={k} value={v} icon="person" loading={loading} />
        ))}
      </DashboardSection>
    </div>
  );
}

/* -----------------------------------------
   UI HELPERS
----------------------------------------- */

const ChartCard = ({ title, icon, children }: any) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900">
    <div className="mb-3 flex items-center gap-2">
      <GIcon name={icon} className="text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);

const EmptyChart = ({ icon, title, subtitle }: any) => (
  <div className="flex h-[220px] flex-col items-center justify-center text-center">
    <GIcon name={icon} className="mb-2 text-4xl text-muted-foreground" />
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </div>
);
