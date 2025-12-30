import { encryptSegment } from "./routeCrypto";

export type EncryptedRoutes = {
  encAdmins: string;
  encCities: string;
  encCitizenGrivence: string;
  encCollectionMonitoring: string;
  encComplaint: string;
  encContinents: string;
  encCountries: string;
  encBins: string;
  encCustomerCreation: string;
  encCustomerMaster: string;
  encDistricts: string;
  encFeedback: string;
  encFuel: string;
  encMainComplaintCategory: string;
  encMasters: string;
  encStaffMasters: string;
  encStaffTemplate: string;
  encMonthlyDistance: string;
  encProperties: string;
  encReport: string;
  encStaffCreation: string;
  encStaffUserType: string;
  encStates: string;
  encSubComplaintCategory: string;
  encSubProperties: string;
  encTripSummary: string;
  encUserCreation: string;
  encUserScreenPermission: string;

  encUserType: string;
  encVehicleCreation: string;
  encVehicleHistory: string;
  encVehicleTrack: string;
  encVehicleTracking: string;
  encVehicleType: string;
  encWasteCollectedData: string;
  encWasteCollectedSummary: string;
  encWasteManagementMaster: string;
  encWards: string;
  encDateReport: string;
  encDayReport: string;
  encWorkforceManagement: string;
  encZones: string;
  encTransportMaster: string;
  encMainScreenType: string;
  encUserScreenAction: string;
  encMainScreen: string;
  encUserScreen: string;

  // dashboard
  encDashboardLiveMap: string;
  encDashboardVehicleManagement: string;
  encDashboardWasteCollection: string;
  encDashboardResources: string;
  encDashboardGrievances: string;
  encDashboardAlerts: string;
  encDashboardReports: string;
  encDashboardWeighBridge: string;
  encDashboardBins: string;
};

const plainRoutes: EncryptedRoutes = {
  encAdmins: "admins",
  encCities: "cities",
  encCitizenGrivence: "citizen-grievance",
  encCollectionMonitoring: "collection-monitoring",
  encComplaint: "complaint",
  encContinents: "continents",
  encCountries: "countries",
  encBins: "bins",
  encCustomerCreation: "customer-creation",
  encCustomerMaster: "customer-master",
  encDistricts: "districts",
  encFeedback: "feedback",
  encFuel: "fuel",
  encMainComplaintCategory: "main-complaint-category",
  encMasters: "masters",
  encStaffMasters: "staff-masters",
  encStaffTemplate: "staff-template",
  encMonthlyDistance: "monthly-distance",
  encProperties: "properties",
  encReport: "reports",
  encStaffCreation: "staff-creation",
  encStaffUserType: "staff-user-type",
  encStates: "states",
  encSubComplaintCategory: "sub-complaint-category",
  encSubProperties: "sub-properties",
  encTripSummary: "trip-summary",
  encUserCreation: "user-creation",

  encUserType: "user-type",
  encVehicleCreation: "vehicle-creation",
  encVehicleHistory: "vehicle-history",
  encVehicleTrack: "vehicle-track",
  encVehicleTracking: "vehicle-tracking",
  encVehicleType: "vehicle-type",
  encWasteCollectedData: "waste-collected-data",
  encWasteCollectedSummary: "waste-collected-summary",
  encWasteManagementMaster: "waste-management",
  encWards: "wards",
  encDateReport: "date-report",
  encDayReport: "day-report",
  encWorkforceManagement: "workforce-management",
  encZones: "zones",
  encTransportMaster: "transport-master",
  encMainScreenType: "mainscreen-type",
  encUserScreenAction: "userscreen-action",
  encMainScreen: "mainscreens",
  encUserScreen: "userscreens",
  encUserScreenPermission: "userscreenpermissions",

  //dashboard

  encDashboardLiveMap: "dashboard-map",
  encDashboardVehicleManagement: "dashboard-vehicle",
  encDashboardWasteCollection: "dashboard-waste-collection",
  encDashboardResources: "dashboard-resources",
  encDashboardGrievances: "dashboard-grievances",
  encDashboardAlerts: "dashboard-alerts",
  encDashboardReports: "dashboard-reports",
  encDashboardWeighBridge: "dashboard-weighbridge",
  encDashboardBins: "dashboard-bins"
};

const encryptRoutes = (routes: EncryptedRoutes): EncryptedRoutes => {
  return Object.fromEntries(
    Object.entries(routes).map(([key, value]) => [key, encryptSegment(value)]),
  ) as EncryptedRoutes;
};

const encryptedDefaults = encryptRoutes(plainRoutes);

export function getEncryptedRoute(
  overrides?: Partial<EncryptedRoutes>,
): EncryptedRoutes {
  if (!overrides || Object.keys(overrides).length === 0) {
    return encryptedDefaults;
  }

  const merged = {
    ...plainRoutes,
    ...overrides,
  };

  return encryptRoutes(merged as EncryptedRoutes);
}
