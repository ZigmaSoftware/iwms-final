import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Auth from "@/pages/dashboard/pages/Auth";
import Dashboard from "@/pages/dashboard/pages/Dashboard";
import MapView from "@/pages/dashboard/pages/MapView";
import Vehicle from "@/pages/dashboard/pages/Vehicle";
import WasteCollection from "@/pages/dashboard/pages/WasteCollection";
import ResourceManagement from "@/pages/dashboard/pages/ResourceManagement";
import Grievances from "@/pages/dashboard/pages/Grievances";
import Alerts from "@/pages/dashboard/pages/Alerts";
import Reports from "@/pages/dashboard/pages/Reports";
import Weighbridge from "@/pages/dashboard/pages/Weighbridge";
import NotFound from "@/pages/dashboard/pages/NotFound";
import { HomeDashboard } from "@/pages/dashboard/pages/Dashboard/HomeDashboard";
import AdminHome from "@/pages/admin/AdminHome";

import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function withDashboard(children: ReactNode) {
  return (
    <ProtectedRoute>
      <DashboardRouteGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardRouteGuard>
    </ProtectedRoute>
  );
}

function withAdmin(children: ReactNode) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}

function DashboardRouteGuard({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      setRole(localStorage.getItem("user_role"));
    } finally {
      setChecked(true);
    }
  }, []);

  if (!checked) {
    return null;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={withDashboard(<HomeDashboard />)} />
      <Route path="/dashboard" element={withDashboard(<Dashboard />)} />
      <Route path="/map" element={withDashboard(<MapView />)} />
      <Route path="/vehicle" element={withDashboard(<Vehicle />)} />
      <Route
        path="/waste-collection"
        element={withDashboard(<WasteCollection />)}
      />
      <Route
        path="/resources"
        element={withDashboard(<ResourceManagement />)}
      />
      <Route path="/grievances" element={withDashboard(<Grievances />)} />
      <Route path="/alerts" element={withDashboard(<Alerts />)} />
      <Route path="/reports" element={withDashboard(<Reports />)} />
      <Route path="/weighbridge" element={withDashboard(<Weighbridge />)} />
      <Route path="/admin" element={withAdmin(<AdminHome />)} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
