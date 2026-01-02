import { LayoutDashboard, MapPin, Bell, FileText, Scale, Truck, Trash2, Users, MessageSquare, Archive } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getEncryptedRoute } from "@/utils/routeCache";

const {
  encDashboardLiveMap,
  encDashboardVehicleManagement,
  encDashboardWasteCollection,
  encDashboardResources,
  encDashboardGrievances,
  encDashboardAlerts,
  encDashboardReports,
  encDashboardWeighBridge,
  encDashboardBins,
} = getEncryptedRoute();

const menuItems = [
  { labelKey: "dashboard.nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { labelKey: "dashboard.nav.live_map", url: `/dashboard/${encDashboardLiveMap}`, icon: MapPin },
  { labelKey: "dashboard.nav.vehicle", url: `/dashboard/${encDashboardVehicleManagement}`, icon: Truck },
  { labelKey: "dashboard.nav.waste_collection", url: `/dashboard/${encDashboardWasteCollection}`, icon: Trash2 },
  { labelKey: "dashboard.nav.resources", url: `/dashboard/${encDashboardResources}`, icon: Users },
  { labelKey: "dashboard.nav.grievances", url: `/dashboard/${encDashboardGrievances}`, icon: MessageSquare },
  { labelKey: "dashboard.nav.alerts", url: `/dashboard/${encDashboardAlerts}`, icon: Bell },
  { labelKey: "dashboard.nav.reports", url: `/dashboard/${encDashboardReports}`, icon: FileText },
  { labelKey: "dashboard.nav.weighbridge", url: `/dashboard/${encDashboardWeighBridge}`, icon: Scale },
  { labelKey: "dashboard.nav.bins", url: `/dashboard/${encDashboardBins}`, icon: Archive },
];


export function HorizontalNav() {
  const { t } = useTranslation();

  return (
    <nav className="flex items-center gap-1">
      {menuItems.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          end={item.url === "/dashboard"}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 px-2 text-lg py-2 rounded-lg font-medium transition-all duration-300 after:absolute after:left-2 after:right-2 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary/60 after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100 ${
              isActive
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
                : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon 
                className={`h-4 w-4 transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`} 
              />
              <span className="text-sm">{t(item.labelKey)}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground/50 rounded-t-full" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
