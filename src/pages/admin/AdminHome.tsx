import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import {
  ADMIN_VIEW_MODE_DASHBOARD,
  clearAdminViewPreference,
  setAdminViewPreference,
} from "@/types/roles";

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
import { GIcon } from "@/components/ui/gicon";

interface DashboardStats {
  masterData: Record<string, number>;
  users: Record<string, number>;
  transport: Record<string, number>;
  operations: Record<string, number>;
  system: Record<string, number>;
}

const AdminHome = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
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

      const [
        continents,
        countries,
        states,
        districts,
        cities,
        zones,
        wards,
        properties,
        subProperties,
        users,
        userTypes,
        staffUserTypes,
        staff,
        customers,
        vehicles,
        vehicleTypes,
        fuels,
        wasteCollections,
        complaints,
        feedbacks,
        mainScreenTypes,
        mainScreens,
        userScreens,
        screenActions,
        permissions,
      ] = await Promise.all([
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

      const safeCount = (arr: any[]) => (Array.isArray(arr) ? arr.length : 0);

      const activeUsers = Array.isArray(users)
        ? users.filter((u: any) => u.is_active).length
        : 0;

      setStats({
        masterData: {
          Continents: safeCount(continents),
          Countries: safeCount(countries),
          States: safeCount(states),
          Districts: safeCount(districts),
          Cities: safeCount(cities),
          Zones: safeCount(zones),
          Wards: safeCount(wards),
          Properties: safeCount(properties),
          "Sub Properties": safeCount(subProperties),
        },
        users: {
          "Total Users": safeCount(users),
          Staff: safeCount(staff),
          Customers: safeCount(customers),
          "User Types": safeCount(userTypes),
          "Staff User Types": safeCount(staffUserTypes),
          "Active Users": activeUsers,
        },
        transport: {
          Vehicles: safeCount(vehicles),
          "Vehicle Types": safeCount(vehicleTypes),
          "Fuel Types": safeCount(fuels),
        },
        operations: {
          "Waste Collections": safeCount(wasteCollections),
          Complaints: safeCount(complaints),
          Feedbacks: safeCount(feedbacks),
        },
        system: {
          "Main Screen Types": safeCount(mainScreenTypes),
          "Main Screens": safeCount(mainScreens),
          "User Screens": safeCount(userScreens),
          "Screen Actions": safeCount(screenActions),
          Permissions: safeCount(permissions),
        },
      });
    } catch (error) {
      console.error("Dashboard fetch failed", error);
    } finally {
      setLoading(false);
    }
  };


  const totalMasterData = Object.values(stats.masterData).reduce(
    (a, b) => a + b,
    0
  );
  const totalOperations = Object.values(stats.operations).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Centralized operational intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            <GIcon name="refresh" className="mr-2" />
            Refresh
          </Button>
   
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Master Data"
          value={totalMasterData}
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
          value={totalOperations}
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

      {/* SECTIONS */}
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

      <DashboardSection title="Transport Management" icon="local_shipping">
        {Object.entries(stats.transport).map(([k, v]) => (
          <MetricCard
            key={k}
            title={k}
            value={v}
            icon="directions_car"
            loading={loading}
          />
        ))}
      </DashboardSection>

      <DashboardSection title="Operations" icon="assignment">
        {Object.entries(stats.operations).map(([k, v]) => (
          <MetricCard
            key={k}
            title={k}
            value={v}
            icon="analytics"
            loading={loading}
          />
        ))}
      </DashboardSection>

      <DashboardSection title="System Configuration" icon="settings">
        {Object.entries(stats.system).map(([k, v]) => (
          <MetricCard
            key={k}
            title={k}
            value={v}
            icon="settings"
            loading={loading}
          />
        ))}
      </DashboardSection>
    </div>
  );
};

export default AdminHome;
