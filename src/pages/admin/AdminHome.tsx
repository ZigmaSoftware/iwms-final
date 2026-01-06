import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  vehicleAssigningApi,
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

const RADIAN = Math.PI / 180;

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
  const { t } = useTranslation();
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
        vehicleAssigningApi.list(),
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
          continents: pick<any>(0).length,
          countries: pick<any>(1).length,
          states: pick<any>(2).length,
          districts: pick<any>(3).length,
          cities: pick<any>(4).length,
          zones: pick<any>(5).length,
          wards: pick<any>(6).length,
          properties: pick<any>(7).length,
          subProperties: pick<any>(8).length,
        },
        users: {
          totalUsers: users.length,
          staff: pick<any>(12).length,
          customers: pick<any>(13).length,
          userTypes: pick<any>(10).length,
          staffUserTypes: pick<any>(11).length,
          activeUsers: users.filter((u) => u?.is_active).length,
        },
        transport: {
          vehicles: pick<any>(14).length,
          vehicleTypes: pick<any>(15).length,
          fuelTypes: pick<any>(16).length,
        },
        operations: {
          wasteCollections: pick<any>(17).length,
          complaints: pick<any>(18).length,
          feedbacks: pick<any>(19).length,
        },
        system: {
          mainScreenTypes: pick<any>(20).length,
          mainScreens: pick<any>(21).length,
          userScreens: pick<any>(22).length,
          screenActions: pick<any>(23).length,
          permissions: pick<any>(24).length,
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

  const masterItems = [
    { key: "continents", label: t("admin.nav.continent") },
    { key: "countries", label: t("admin.nav.country") },
    { key: "states", label: t("admin.nav.state") },
    { key: "districts", label: t("admin.nav.district") },
    { key: "cities", label: t("admin.nav.city") },
    { key: "zones", label: t("admin.nav.zone") },
    { key: "wards", label: t("admin.nav.ward") },
    { key: "properties", label: t("admin.nav.property") },
    { key: "subProperties", label: t("admin.nav.sub_property") },
  ];

  const userItems = [
    { key: "totalUsers", label: t("admin.home.kpi_total_users") },
    { key: "staff", label: t("admin.home.label_staff") },
    { key: "customers", label: t("admin.home.label_customers") },
    { key: "userTypes", label: t("admin.home.label_user_types") },
    { key: "staffUserTypes", label: t("admin.home.label_staff_user_types") },
    { key: "activeUsers", label: t("admin.home.kpi_active_users") },
  ];

  const operationItems = [
    { key: "wasteCollections", label: t("admin.home.label_waste_collections") },
    { key: "complaints", label: t("admin.nav.complaints") },
    { key: "feedbacks", label: t("admin.home.label_feedbacks") },
  ];

  const userPie = [
    { name: t("admin.home.label_staff"), value: stats.users.staff || 0 },
    { name: t("admin.home.label_customers"), value: stats.users.customers || 0 },
  ];

  const masterBar = masterItems.map((item) => ({
    name: item.label,
    value: stats.masterData[item.key] || 0,
  }));

  const opsLine = operationItems.map((item) => ({
    name: item.label,
    value: stats.operations[item.key] || 0,
  }));

  const hasUserPieData = userPie.some((d) => d.value > 0);
  const hasMasterBarData = masterBar.some((d) => d.value > 0);
  const hasOpsLineData = opsLine.some((d) => d.value > 0);
  const renderUserPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value } = props;
    if (value === 0 || value === undefined || value === null) return null;

    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";

    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={700}
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {value}
      </text>
    );
  };

  /* -----------------------------------------
     UI
  ----------------------------------------- */
  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.home.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.home.subtitle")}
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData}>
          <GIcon name="refresh" className="mr-2" />
          {t("admin.home.refresh")}
        </Button>
      </div>

      {/* KPI STRIP */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t("admin.home.kpi_total_master")} value={totalMaster} icon="public" loading={loading} />
        <MetricCard title={t("admin.home.kpi_total_users")} value={stats.users.totalUsers || 0} icon="group" loading={loading} />
        <MetricCard title={t("admin.home.kpi_total_operations")} value={totalOps} icon="assignment" loading={loading} />
        <MetricCard title={t("admin.home.kpi_active_users")} value={stats.users.activeUsers || 0} icon="check_circle" loading={loading} />
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ChartCard title={t("admin.home.chart_user_distribution")} icon="pie_chart">
          {hasUserPieData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 16, right: 18, bottom: 16, left: 18 }}>
                <Pie
                  data={userPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  label={renderUserPieLabel}
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
              title={t("admin.home.empty_no_user_data")}
              subtitle={t("admin.home.empty_permission_or_data")}
            />
          )}
        </ChartCard>

        <ChartCard title={t("admin.home.chart_master_overview")} icon="bar_chart">
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
              title={t("admin.home.empty_no_master_data")}
              subtitle={t("admin.home.empty_permission_restricted")}
            />
          )}
        </ChartCard>

        <ChartCard title={t("admin.home.chart_operations_snapshot")} icon="show_chart">
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
            <EmptyChart
              icon="show_chart"
              title={t("admin.home.empty_no_operations_data")}
              subtitle={t("admin.home.empty_permission_or_data")}
            />
          )}
        </ChartCard>
      </div>

      {/* DETAIL SECTIONS */}
      <DashboardSection title={t("admin.home.section_master_data")} icon="location_on">
        {masterItems.map((item) => (
          <MetricCard
            key={item.key}
            title={item.label}
            value={stats.masterData[item.key] || 0}
            icon="database"
            loading={loading}
          />
        ))}
      </DashboardSection>

      <DashboardSection title={t("admin.home.section_user_management")} icon="people">
        {userItems.map((item) => (
          <MetricCard
            key={item.key}
            title={item.label}
            value={stats.users[item.key] || 0}
            icon="person"
            loading={loading}
          />
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
