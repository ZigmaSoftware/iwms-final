import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ChevronDown, LayoutGrid, MoreHorizontal, List, File, PieChart, UserCircle, Trash2 } from "lucide-react";

import { useSidebar } from "../../../contexts/SideBarContext";
import { getEncryptedRoute } from "@/utils/routeCache";

const {
  encMasters,
  encContinents,
  encCountries,
  encStates,
  encDistricts,
  encCities,
  encWards,
  encZones,
  encProperties,
  encSubProperties,
  encStaffCreation,
  encMainUserScreen,
  encAdmins,
  encUserScreen,
  encUserType,
  encUserCreation,
  encUserPermission,
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
} = getEncryptedRoute();

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [{ icon: <LayoutGrid size={18} />, name: "Dashboard", path: "/admin" }];

const adminItems: NavItem[] = [
  {
    name: "Admin",
    icon: <File size={18} />,
    subItems: [
      { name: "MainScreen", path: `/${encAdmins}/${encMainUserScreen}` },
      { name: "User Screen", path: `/${encAdmins}/${encUserScreen}` },
      { name: "User Type", path: `/${encAdmins}/${encUserType}` },
      { name: "User Creation", path: `/${encAdmins}/${encUserCreation}` },
      { name: "User Permission", path: `/${encAdmins}/${encUserPermission}` },
      { name: "Staff User Type", path: `/${encAdmins}/${encStaffUserType}` },
    ],
  },
];

const masterItems: NavItem[] = [
  {
    icon: <List size={18} />,
    name: "Masters",
    subItems: [
      { name: "Staff Creation", path: `/${encMasters}/${encStaffCreation}` },
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

const transportMasters: NavItem[] = [
  {
    icon: <Truck size={18} />,
    name: "Transport Masters",
    subItems: [
      { name: "Fuel", path: `/${encTransportMaster}/${encFuel}` },
      { name: "Vehicle Type", path: `/${encTransportMaster}/${encVehicleType}` },
      { name: "Vehicle Creation", path: `/${encTransportMaster}/${encVehicleCreation}` },
    ],
  },
];

const vehicleTrackingItems: NavItem[] = [
  {
    name: "Vehicle Tracking",
    icon: <File size={18} />,
    subItems: [
      { name: "Vehicle Tracking", path: `/${encVehicleTracking}/${encVehicleTrack}` },
      { name: "Vehicle History", path: `/${encVehicleTracking}/${encVehicleHistory}` },
    ],
  },
];

const customerMasters: NavItem[] = [
  {
    icon: <UserCircle size={18} />,
    name: "Customer Masters",
    subItems: [{ name: "Customer Creation", path: `/${encCustomerMaster}/${encCustomerCreation}` }],
  },
];

const wasteManagementMasters: NavItem[] = [
  {
    icon: <Trash2 size={18} />,
    name: "Waste Management",
    subItems: [
      { name: "WasteCollectedData", path: `/${encWasteManagementMaster}/${encWasteCollectedData}` },
      { name: "CollectionMonitoring", path: `/${encWasteManagementMaster}/${encCollectionMonitoring}` },
    ],
  },
];

const citizenGrievanceItems: NavItem[] = [
  {
    icon: <MoreHorizontal size={18} />,
    name: "Citizen Grievance",
    subItems: [
      { name: "Complaints", path: `/${encCitizenGrivence}/${encComplaint}` },
      { name: "Main Category", path: `/${encCitizenGrivence}/${encMainComplaintCategory}` },
      { name: "Sub Category", path: `/${encCitizenGrivence}/${encSubComplaintCategory}` },
      { name: "Feedback", path: `/${encCitizenGrivence}/${encFeedback}` },
    ],
  },
];

const workforceManagements: NavItem[] = [
  {
    icon: <PieChart size={18} />,
    name: "Workforce Management",
    subItems: [{ name: "WorkForce Management", path: `/${encWorkforceManagement}/${encWorkforceManagement}` }],
  },
];

const reportItems: NavItem[] = [
  {
    icon: <PieChart size={18} />,
    name: "Reports",
    subItems: [
      { name: "Trip Summary", path: `/${encReport}/${encTripSummary}` },
      { name: "Monthly Distance", path: `/${encReport}/${encMonthlyDistance}` },
      { name: "Waste Collected summary", path: `/${encReport}/${encWasteCollectedSummary}` },
    ],
  },
];

const menuButtonBase =
  "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-all duration-300 backdrop-blur";

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
    | "wasteManagementMaster"
    | "citizenGrievance"
    | "workforceManagement";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

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
      wasteManagementMaster: wasteManagementMasters,
      report: reportItems,
      workforceManagement: workforceManagements,
    };

    Object.entries(menus).forEach(([type, items]) => {
      items.forEach((nav, index) => {
        nav.subItems?.forEach((sub) => {
          if (isActive(sub.path)) {
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
    setOpenSubmenu((prev) => (prev && prev.type === type && prev.index === index ? null : { type, index }));
  };

  const renderMenuItems = (items: NavItem[], type: any) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, type)}
              className={`${menuButtonBase} ${openSubmenu?.type === type && openSubmenu?.index === index
                  ? "border-[var(--admin-border)] bg-[var(--admin-primarySoft)]/80 text-[var(--admin-primary)] shadow-[0_18px_40px_rgba(1,62,126,0.16)]"
                  : "border-transparent text-[var(--admin-mutedText)] hover:border-[var(--admin-border)] hover:bg-[var(--admin-surfaceMuted)]/80 hover:text-[var(--admin-primary)]"
                }`}
            >
              <span className={`menu-item-icon-size ${!showFullSidebar ? "mx-auto" : ""}`}>{nav.icon}</span>

              {showFullSidebar && (
                <>
                  <span className="text-base font-semibold">{nav.name}</span>
                  <ChevronDown
                    className={`ml-auto h-5 w-5 transition-transform ${openSubmenu?.type === type && openSubmenu?.index === index
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
                className={`${menuButtonBase} ${isActive(nav.path)
                    ? "border-[var(--admin-border)] bg-[var(--admin-primarySoft)]/80 text-[var(--admin-primary)] shadow-[0_18px_40px_rgba(1,62,126,0.16)]"
                    : "border-transparent text-[var(--admin-mutedText)] hover:border-[var(--admin-border)] hover:bg-[var(--admin-surfaceMuted)]/80 hover:text-[var(--admin-primary)]"
                  }`}
              >
                <span className={`menu-item-icon-size ${!showFullSidebar ? "mx-auto" : ""}`}>{nav.icon}</span>
                {showFullSidebar && <span className="text-sm font-semibold">{nav.name}</span>}
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
              <ul
                className="mt-3 ml-6 space-y-1 rounded-2xl border-l-2 border-[var(--admin-border)]/70 pl-4"
              >
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`block rounded-2xl px-3 py-2 text-sm font-medium transition ${isActive(subItem.path)
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
      className={`fixed top-0 left-0 z-50 h-screen border-r border-[var(--admin-border)]/80 bg-[var(--admin-surfaceAlt)]/95 text-[var(--admin-text)] transition-all duration-300 ease-out backdrop-blur-2xl ${showFullSidebar ? "w-[300px]" : "w-[140px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      style={{
        boxShadow: showFullSidebar ? "var(--admin-cardShadow)" : "0 10px 35px rgba(1,62,126,0.18)",
      }}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--admin-primarySoft)] to-transparent opacity-70" />
      <div className="flex h-full flex-col px-5 pb-8 pt-8">


        <div className="mt-[70px] flex-1 overflow-y-auto pr-2 no-scrollbar">
          <nav className="flex flex-col gap-7">
            <div>{renderMenuItems(navItems, "main")}</div>
            <div>{renderMenuItems(adminItems, "admin")}</div>
            <div>{renderMenuItems(masterItems, "master")}</div>
            <div>{renderMenuItems(transportMasters, "transportMaster")}</div>
            <div>{renderMenuItems(customerMasters, "customerMaster")}</div>
            <div>{renderMenuItems(vehicleTrackingItems, "vehicleTracking")}</div>
            <div>{renderMenuItems(wasteManagementMasters, "wasteManagementMaster")}</div>
            <div>{renderMenuItems(citizenGrievanceItems, "citizenGrievance")}</div>
            <div>{renderMenuItems(workforceManagements, "workforceManagement")}</div>
            <div>
              <h2 className="mb-4 text-xs uppercase tracking-[0.35em] text-[var(--admin-mutedText)]">Report</h2>
              {renderMenuItems(reportItems, "report")}
            </div>
          </nav>
        </div>


      </div>
    </aside>
  );
};

export default AppSidebar;
