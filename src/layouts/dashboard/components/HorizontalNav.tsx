import { LayoutDashboard, MapPin, Bell, FileText, Scale, Truck, Trash2, Users, MessageSquare, Archive } from "lucide-react";
import { NavLink } from "react-router-dom";
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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Live Map", url: `/dashboard/${encDashboardLiveMap}`, icon: MapPin },
  { title: "Vehicle", url: `/dashboard/${encDashboardVehicleManagement}`, icon: Truck },
  { title: "Waste Collection", url: `/dashboard/${encDashboardWasteCollection}`, icon: Trash2 },
  { title: "Resources", url: `/dashboard/${encDashboardResources}`, icon: Users },
  { title: "Grievances", url: `/dashboard/${encDashboardGrievances}`, icon: MessageSquare },
  { title: "Alerts", url: `/dashboard/${encDashboardAlerts}`, icon: Bell },
  { title: "Reports", url: `/dashboard/${encDashboardReports}`, icon: FileText },
  { title: "Weighbridge", url: `/dashboard/${encDashboardWeighBridge}`, icon: Scale },
  { title: "Bins", url: `/dashboard/${encDashboardBins}`, icon: Archive },
];


export function HorizontalNav() {
  return (
    <nav className="flex items-center gap-1">
      {menuItems.map((item) => (
        <NavLink
          key={item.title}
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
              <span className="text-sm">{item.title}</span>
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
