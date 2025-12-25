import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  ChevronDown,
  LayoutGrid,
  Settings,
  Layers3,
  Archive,
  Users,
  UserCircle,
  Truck,
  Navigation,
  Recycle,
  AlertTriangle,
  Building2,
  BarChart3,
} from "lucide-react";

import { useSidebar } from "@/contexts/SideBarContext";
import { getEncryptedRoute } from "@/utils/routeCache";
import { decryptSegment } from "@/utils/routeCrypto";

const {
  encMasters,
  encContinents,
  encCountries,
  encBins,
  encStates,
  encDistricts,
  encCities,
  encWards,
  encZones,
  encProperties,
  encSubProperties,
  encStaffCreation,
  encAdmins,
  encUserScreen,
  encUserType,
  encUserCreation,
  encCustomerMaster,
  encCustomerCreation,
  encReport,
  encMonthlyDistance,
  encTripSummary,
  encWasteCollectedSummary,
  encCitizenGrivence,
  encComplaint,
  encFeedback,
  encTransportMaster,
  encFuel,
  encVehicleCreation,
  encVehicleHistory,
  encVehicleTrack,
  encVehicleTracking,
  encVehicleType,
  encCollectionMonitoring,
  encWasteCollectedData,
  encWasteManagementMaster,
  encWorkforceManagement,
  encStaffUserType,
  encMainComplaintCategory,
  encSubComplaintCategory,
  encMainScreenType,
  encUserScreenAction,
  encMainScreen,
  encUserScreenPermission,
} = getEncryptedRoute();

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

/* =====================
   MENU DEFINITIONS
===================== */

const navItems: NavItem[] = [
  { name: "Dashboard", icon: <LayoutGrid size={18} />, path: "/admin" },
];

const adminItems: NavItem[] = [
  {
    name: "Admin",
    icon: <Settings size={18} />,
    subItems: [
      { name: "MainScreen Type", path: `/${encAdmins}/${encMainScreenType}` },
      { name: "UserScreen Action", path: `/${encAdmins}/${encUserScreenAction}` },
      { name: "MainScreen", path: `/${encAdmins}/${encMainScreen}` },
      { name: "User Screen", path: `/${encAdmins}/${encUserScreen}` },
      {
        name: "User Screen Permission",
        path: `/${encAdmins}/${encUserScreenPermission}`,
      },
      { name: "User Type", path: `/${encAdmins}/${encUserType}` },
      { name: "User Creation", path: `/${encAdmins}/${encUserCreation}` },
      { name: "Staff User Type", path: `/${encAdmins}/${encStaffUserType}` },
    ],
  },
];

const masterItems: NavItem[] = [
  {
    name: "Masters",
    icon: <Layers3 size={18} />,
    subItems: [
      { name: "Continent", path: `/${encMasters}/${encContinents}` },
      { name: "Country", path: `/${encMasters}/${encCountries}` },
      { name: "State", path: `/${encMasters}/${encStates}` },
      { name: "District", path: `/${encMasters}/${encDistricts}` },
      { name: "City", path: `/${encMasters}/${encCities}` },
      { name: "Zone", path: `/${encMasters}/${encZones}` },
      { name: "Ward", path: `/${encMasters}/${encWards}` },
      { name: "Property", path: `/${encMasters}/${encProperties}` },
      { name: "SubProperty", path: `/${encMasters}/${encSubProperties}` },
    ],
  },
];

const staffCreationItems: NavItem[] = [
  {
    name: "Staff Master",
    icon: <Users size={18} />,
    subItems: [
      { name: "Staff Creation", path: `/${encMasters}/${encStaffCreation}` },
    ],
  },
];

const customerMasters: NavItem[] = [
  {
    name: "Customer Masters",
    icon: <UserCircle size={18} />,
    subItems: [
      {
        name: "Customer Creation",
        path: `/${encCustomerMaster}/${encCustomerCreation}`,
      },
    ],
  },
];

const transportMasters: NavItem[] = [
  {
    name: "Transport Masters",
    icon: <Truck size={18} />,
    subItems: [
      { name: "Fuel", path: `/${encTransportMaster}/${encFuel}` },
      {
        name: "Vehicle Type",
        path: `/${encTransportMaster}/${encVehicleType}`,
      },
      {
        name: "Vehicle Creation",
        path: `/${encTransportMaster}/${encVehicleCreation}`,
      },
    ],
  },
];

const vehicleTrackingItems: NavItem[] = [
  {
    name: "Vehicle Tracking",
    icon: <Navigation size={18} />,
    subItems: [
      {
        name: "Vehicle Tracking",
        path: `/${encVehicleTracking}/${encVehicleTrack}`,
      },
      {
        name: "Vehicle History",
        path: `/${encVehicleTracking}/${encVehicleHistory}`,
      },
    ],
  },
];

const binItems: NavItem[] = [
  {
    name: "Bin Master",
    icon: <Archive size={18} />,
    subItems: [{ name: "Bin Creation", path: `/${encMasters}/${encBins}` }],
  },
];

const wasteManagementMasters: NavItem[] = [
  {
    name: "Waste Management",
    icon: <Recycle size={18} />,
    subItems: [
      {
        name: "WasteCollectedData",
        path: `/${encWasteManagementMaster}/${encWasteCollectedData}`,
      },
      {
        name: "CollectionMonitoring",
        path: `/${encWasteManagementMaster}/${encCollectionMonitoring}`,
      },
    ],
  },
];

const citizenGrievanceItems: NavItem[] = [
  {
    name: "Citizen Grievance",
    icon: <AlertTriangle size={18} />,
    subItems: [
      { name: "Complaints", path: `/${encCitizenGrivence}/${encComplaint}` },
      {
        name: "Main Category",
        path: `/${encCitizenGrivence}/${encMainComplaintCategory}`,
      },
      {
        name: "Sub Category",
        path: `/${encCitizenGrivence}/${encSubComplaintCategory}`,
      },
      { name: "Feedback", path: `/${encCitizenGrivence}/${encFeedback}` },
    ],
  },
];

const workforceManagements: NavItem[] = [
  {
    name: "Workforce Management",
    icon: <Building2 size={18} />,
    subItems: [
      {
        name: "WorkForce Management",
        path: `/${encWorkforceManagement}/${encWorkforceManagement}`,
      },
    ],
  },
];

const reportItems: NavItem[] = [
  {
    name: "Reports",
    icon: <BarChart3 size={18} />,
    subItems: [
      { name: "Trip Summary", path: `/${encReport}/${encTripSummary}` },
      { name: "Monthly Distance", path: `/${encReport}/${encMonthlyDistance}` },
      {
        name: "Waste Collected Summary",
        path: `/${encReport}/${encWasteCollectedSummary}`,
      },
    ],
  },
];

const menuButtonBase =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const location = useLocation();
  const showFullSidebar = isExpanded || isMobileOpen;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type:
      | "main"
      | "admin"
      | "master"
      | "entry"
      | "report"
      | "others"
      | "transportMaster"
      | "customerMaster"
      | "vehicleTracking"
      | "binMaster"
      | "wasteManagementMaster"
      | "citizenGrievance"
      | "workforceManagement";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentDecodedPath = useMemo(() => {
    const [master, module] = location.pathname.split("/").filter(Boolean);
    return {
      master: decryptSegment(master || "") ?? null,
      module: decryptSegment(module || "") ?? null,
    };
  }, [location.pathname]);

  const isActive = useCallback(
    (path: string, allowNestedRoutes = false) => {
      if (!path) return false;

      const segments = path.split("/").filter(Boolean);
      const [encMaster, encModule] = segments;
      const decodedMaster = decryptSegment(encMaster || "");
      const decodedModule = decryptSegment(encModule || "");

      // If decoding fails, fall back to direct path match (e.g., plain routes)
      if (!decodedMaster && !decodedModule) {
        if (location.pathname === path) return true;
        return (
          allowNestedRoutes &&
          location.pathname.startsWith(path.endsWith("/") ? path : `${path}/`)
        );
      }

      if (decodedMaster !== currentDecodedPath.master) return false;
      if (!decodedModule) return true;

      if (currentDecodedPath.module === decodedModule) return true;
      return allowNestedRoutes && currentDecodedPath.module?.startsWith(decodedModule);
    },
    [currentDecodedPath, location.pathname]
  );

  useEffect(() => {
    let matched = false;

    const menus: Record<string, NavItem[]> = {
      main: navItems,
      admin: adminItems,
      master: masterItems,
      entry: [],
      citizenGrievance: citizenGrievanceItems,
      transportMaster: transportMasters,
      customerMaster: customerMasters,
      vehicleTracking: vehicleTrackingItems,
      binMaster: binItems,
      wasteManagementMaster: wasteManagementMasters,
      report: reportItems,
      workforceManagement: workforceManagements,
    };

    Object.entries(menus).forEach(([type, items]) => {
      items.forEach((nav, index) => {
        nav.subItems?.forEach((sub) => {
          if (isActive(sub.path, true)) {
            setOpenSubmenu({ type: type as any, index });
            matched = true;
          }
        });
      });
    });

    if (!matched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: el.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, type: any) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === type && prev.index === index
        ? null
        : { type, index }
    );
  };

  const renderMenuItems = (items: NavItem[], type: any) => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, type)}
              className={`${menuButtonBase} ${
                openSubmenu?.type === type && openSubmenu?.index === index
                  ? "border-[var(--admin-border)] bg-[var(--admin-primarySoft)]/80 text-[var(--admin-primary)] shadow-[0_18px_40px_rgba(1,62,126,0.16)]"
                  : "border-transparent text-[var(--admin-mutedText)] hover:border-[var(--admin-border)] "
              }`}
            >
              <span
                className={`menu-item-icon-size ${!showFullSidebar ? "mx-auto" : ""}`}
              >
                {nav.icon}
              </span>

              {showFullSidebar && (
                <>
                  <span className="text-sm font-semibold">{nav.name}</span>
                  <ChevronDown
                    className={`ml-auto h-5 w-5 transition-transform ${
                      openSubmenu?.type === type && openSubmenu?.index === index
                        ? "rotate-180 text-[var(--admin-primary)]"
                        : "text-[var(--admin-mutedText)]"
                    }`}
                  />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`${menuButtonBase} ${
                  isActive(nav.path, true)
                    ? "border-[var(--admin-border)] bg-[var(--admin-primarySoft)]/80 text-[var(--admin-primary)] shadow-[0_18px_40px_rgba(1,62,126,0.16)]"
                    : "border-transparent text-[var(--admin-mutedText)] hover:border-[var(--admin-border)] hover:bg-[var(--admin-surfaceMuted)]/80 hover:text-[var(--admin-primary)]"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${!showFullSidebar ? "mx-auto" : ""}`}
                >
                  {nav.icon}
                </span>
                {showFullSidebar && (
                  <span className="text-sm font-semibold">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && showFullSidebar && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${type}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === type && openSubmenu?.index === index
                    ? `${subMenuHeight[`${type}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 ml-5 space-y-1 rounded-xl border-l-2 border-[var(--admin-border)]/70 pl-3">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`block rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                        isActive(subItem.path, true)
                          ? "bg-[var(--admin-accentSoft)] text-[var(--admin-accent)]"
                          : "text-[var(--admin-mutedText)] hover:bg-[var(--admin-primarySoft)] hover:text-[var(--admin-primary)]"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`mt -10 fixed top-0 left-0 z-50 h-screen border-r border-[var(--admin-border)]/80 bg-[var(--admin-surfaceAlt)]/95 text-[var(--admin-text)] transition-all duration-300 ease-out backdrop-blur-2xl ${
        showFullSidebar ? "w-[300px]" : "w-[140px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      style={{
        boxShadow: showFullSidebar
          ? "var(--admin-cardShadow)"
          : "0 10px 35px rgba(1,62,126,0.18)",
      }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--admin-primarySoft)] to-transparent opacity-70" />
      <div className="flex h-full flex-col px-4 pb-6 pt-6">
        <div className="mt-[70px] flex-1 overflow-y-auto pr-2 no-scrollbar">
          <nav className="flex flex-col gap-4">
            <div>{renderMenuItems(navItems, "main")}</div>
            <div>{renderMenuItems(adminItems, "admin")}</div>
            <div>{renderMenuItems(masterItems, "master")}</div>
            <div>{renderMenuItems(staffCreationItems, "staffCreation")}</div>
            <div>{renderMenuItems(customerMasters, "customerMaster")}</div>
            <div>{renderMenuItems(transportMasters, "transportMaster")}</div>
            <div>
              {renderMenuItems(vehicleTrackingItems, "vehicleTracking")}
            </div>
            <div>{renderMenuItems(binItems, "binMaster")}</div>
            <div>
              {renderMenuItems(wasteManagementMasters, "wasteManagementMaster")}
            </div>
            <div>
              {renderMenuItems(citizenGrievanceItems, "citizenGrievance")}
            </div>
            <div>
              {renderMenuItems(workforceManagements, "workforceManagement")}
            </div>
            <div>
              {renderMenuItems(reportItems, "report")}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
