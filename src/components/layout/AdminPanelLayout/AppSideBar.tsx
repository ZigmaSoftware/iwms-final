import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  ChevronDown,
  LayoutGrid,
  MoreHorizontal,
  List,
  File,
  PieChart,
  UserCircle,
  Trash2,
} from "lucide-react";

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

// Main menu
const navItems: NavItem[] = [
  { icon: <LayoutGrid size={18} />, name: "Dashboard", path: "/admin" },
];

// Admin
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

// Master
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

// Transport
const transportMasters: NavItem[] = [
  {
    icon: <List size={18} />,
    name: "Transport Masters",
    subItems: [
      { name: "Fuel", path: `/${encTransportMaster}/${encFuel}` },
      { name: "Vehicle Type", path: `/${encTransportMaster}/${encVehicleType}` },
      { name: "Vehicle Creation", path: `/${encTransportMaster}/${encVehicleCreation}` },
    ],
  },
];

// Vehicle Tracking
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

// Customer Master
const customerMasters: NavItem[] = [
  {
    icon: <UserCircle size={18} />,
    name: "Customer Masters",
    subItems: [
      { name: "Customer Creation", path: `/${encCustomerMaster}/${encCustomerCreation}` },
    ],
  },
];

// Waste Management
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

// Citizen Grievance
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

// Workforce
const workforceManagements: NavItem[] = [
  {
    icon: <PieChart size={18} />,
    name: "Workforce Management",
    subItems: [
      { name: "WorkForce Management", path: `/${encWorkforceManagement}/${encWorkforceManagement}` },
    ],
  },
];

// Reports
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
  "flex items-center w-full gap-3 rounded-xl border transition-all text-sm font-medium";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

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

  // Auto-open submenu on route change
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

  // Measure submenu height
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
      prev && prev.type === type && prev.index === index ? null : { type, index }
    );
  };

  const renderMenuItems = (items: NavItem[], type: any) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, type)}
              className={`${menuButtonBase} ${
                openSubmenu?.type === type && openSubmenu?.index === index
                  ? "bg-[#eef7ff] border-[#cfe4ff] text-[#1f4d90]"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  !isExpanded && !isHovered && !isMobileOpen ? "mx-auto" : ""
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text text-base font-semibold">
                    {nav.name}
                  </span>
                  <ChevronDown
                    className={`ml-auto w-5 h-5 transition-transform ${
                      openSubmenu?.type === type && openSubmenu?.index === index
                        ? "rotate-180 text-[#1f4d90]"
                        : "text-gray-400"
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
                  isActive(nav.path)
                    ? "bg-[#eef7ff] border-[#cfe4ff] text-[#1f4d90]"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    !isExpanded && !isHovered && !isMobileOpen ? "mx-auto" : ""
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text text-sm font-semibold">
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
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
              <ul className="mt-2 ml-9 space-y-1 border-l border-gray-100 pl-4">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(subItem.path)
                          ? "bg-[#e8f5e9] text-[#2f855a]"
                          : "text-gray-500 hover:bg-gray-50"
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
      className={`fixed  bg-white border-r border-gray-100 shadow-sm
      transition-all duration-300 h-screen z-50
      ${isExpanded || isMobileOpen ? "w-[280px]" : isHovered ? "w-[280px]" : "w-[96px]"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-center"
        }`}
      >
        {/* <Link to="/admin" className="flex items-center justify-center">
          <img src="/logo.png" className="w-[130px] h-auto mx-auto" />
        </Link> */}
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar px-4 pb-8">
        <nav className="mb-4 flex flex-col gap-6">
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
            <h2 className="mb-4 text-xs uppercase text-gray-400">Report</h2>
            {renderMenuItems(reportItems, "report")}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
