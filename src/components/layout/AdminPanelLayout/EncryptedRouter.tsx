import { useMemo, type ComponentType } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

import { decryptSegment } from "@/utils/routeCrypto";

// Import your actual page components
import ContinentList from "@/pages/admin/modules/masters/continent/ContinentListPage";
import ContinentForm from "@/pages/admin/modules/masters/continent/ContinentForm";
import CountryList from "@/pages/admin/modules/masters/CountryListPage";
import CountryForm from "@/pages/admin/modules/masters/CountryForm";
import StateList from "@/pages/admin/modules/masters/StateListPage";
import StateForm from "@/pages/admin/modules/masters/StateForm";
import DistrictList from "@/pages/admin/modules/masters/DistrictListPage";
import DistrictForm from "@/pages/admin/modules/masters/DistrictForm";
import CityList from "@/pages/admin/modules/masters/CityListPage";
import CityForm from "@/pages/admin/modules/masters/CityForm";
import ZoneList from "@/pages/admin/modules/masters/ZoneListPage";
import ZoneForm from "@/pages/admin/modules/masters/ZoneForm";
import WardList from "@/pages/admin/modules/masters/WardListPage";
import WardForm from "@/pages/admin/modules/masters/WardForm";
import PropertyList from "@/pages/admin/modules/masters/PropertyListPage";
import PropertyForm from "@/pages/admin/modules/masters/PropertyForm";
import SubPropertyList from "@/pages/admin/modules/masters/SubPropertyListPage";
import SubPropertyForm from "@/pages/admin/modules/masters/SubPropertyForm";
import StaffCreationList from "@/pages/admin/modules/masters/staffcreationlist";
import StaffCreationForm from "@/pages/admin/modules/masters/staffcreationForm";
// Admin
import MainUserScreenList from "@/pages/admin/modules/admin/mainUserScreen/mainUserScreenList";
import MainUserScreenForm from "@/pages/admin/modules/admin/mainUserScreen/mainUserScreenForm";
import UserScreenList from "@/pages/admin/modules/admin/userscreen/userscreenList";
import UserScreenForm from "@/pages/admin/modules/admin/userscreen/userscreenForm";
import UserTypeList from "@/pages/admin/modules/admin/userType/user-typeList";
import UserTypeForm from "@/pages/admin/modules/admin/userType/user-typeForm";
import UserCreationList from "@/pages/admin/modules/admin/userCreation/user-creationList";
import UserCreationForm from "@/pages/admin/modules/admin/userCreation/user-creationForm";
import UserPermissionList from "@/pages/admin/modules/admin/userpermission/userpermissionForm";
import UserPermissionForm from "@/pages/admin/modules/admin/userpermission/userpermissionList";

// Customer Master
import CustomerCreationList from "@/pages/admin/modules/customerMasters/customerCreations/customerCreationListPage";
import CustomerCreationForm from "@/pages/admin/modules/customerMasters/customerCreations/customerCreationForm";

// Reports (Single components)
import TripSummary from "@/pages/admin/modules/reports/tripsummary/tripsummary";
import MonthlyDistance from "@/pages/admin/modules/reports/monthlydistance/monthlydistance";
import WasteSummary from "@/pages/admin/modules/reports/wasteCollectedSummary/wastesummary";
import ComplaintsList from "@/pages/admin/modules/citizienGrievance/complaints/complaints";
import ComplaintAddForm from "@/pages/admin/modules/citizienGrievance/complaints/complaintsForm";
import ComplaintEditForm from "@/pages/admin/modules/citizienGrievance/complaints/complaintsEditForm";
import FeedBackFormList from "@/pages/admin/modules/citizienGrievance/feedback/feedBackFormListPage";
import FeedBackForm from "@/pages/admin/modules/citizienGrievance/feedback/feedBackForm";
import FuelList from "@/pages/admin/modules/transportMasters/fuel/fuelListPage";
import FuelForm from "@/pages/admin/modules/transportMasters/fuel/fuelForm";
import VehicleTypeCreation from "@/pages/admin/modules/transportMasters/vehicleTypecreation/vehicle-typeCreation";
import VehicleTypeCreationForm from "@/pages/admin/modules/transportMasters/vehicleTypecreation/vechicle-typeCreationForm";
import VehicleCreation from "@/pages/admin/modules/transportMasters/vehicleCreation/vehicleCreation";
import VehicleCreationForm from "@/pages/admin/modules/transportMasters/vehicleCreation/vehicleCreationForm";
import VehicleTracking from "@/pages/admin/modules/vehicletracking/vehicletrack/vehicletracking";
import VehicleHistory from "@/pages/admin/modules/vehicletracking/vehiclehistory/vehiclehistory";
import WorkforceManagement from "@/pages/admin/modules/workforcemanagement/workforcemanagement";
import DateReport from "@/pages/admin/modules/workforcemanagement/datereport";
import DayReport from "@/pages/admin/modules/workforcemanagement/dayreport";

import WasteCollectionMonitor from "@/pages/admin/modules/wasteManagementMasters/collectionMonitoring/collectionMonitoring";
import WasteCollectedDataList from "@/pages/admin/modules/wasteManagementMasters/wasteCollectedData/wasteCollectedDataListPage";
import WasteCollectedForm from "@/pages/admin/modules/wasteManagementMasters/wasteCollectedData/wasteCollectedDataForm";
import StaffUserTypeForm from "@/pages/admin/modules/admin/staffUserType/staffUserTypeForm";
import StaffUserTypeList from "@/pages/admin/modules/admin/staffUserType/staffUserTypeList";

import MainComplaintCategoryList from "@/pages/admin/modules/citizienGrievance/complaints/mainCategory/main-categoryList";
import { MainComplaintCategoryForm } from "@/pages/admin/modules/citizienGrievance/complaints/mainCategory/main-categoryForm";
import SubCategoryComplaintList from "@/pages/admin/modules/citizienGrievance/complaints/subCategory/sub-categoryList";
import SubCategoryComplaintForm from "@/pages/admin/modules/citizienGrievance/complaints/subCategory/sub-categoryForm";

type ModuleComponent = ComponentType | undefined;

type RouteConfig = {
  list?: ModuleComponent;
  form?: ModuleComponent;
  editForm?: ModuleComponent;
  component?: ModuleComponent;
};

type RouteMap = Record<string, Record<string, RouteConfig>>;

const ROUTES: RouteMap = {
  admins: {
    "main-user-screen": { list: MainUserScreenList, form: MainUserScreenForm },
    "user-screen": { list: UserScreenList, form: UserScreenForm },
    "user-type": { list: UserTypeList, form: UserTypeForm },
    "user-creation": { list: UserCreationList, form: UserCreationForm },
    "user-permission": { list: UserPermissionList, form: UserPermissionForm },
    "staff-user-type": { list: StaffUserTypeList, form: StaffUserTypeForm },
  },
  masters: {
    continents: { list: ContinentList, form: ContinentForm },
    countries: { list: CountryList, form: CountryForm },
    states: { list: StateList, form: StateForm },
    districts: { list: DistrictList, form: DistrictForm },
    cities: { list: CityList, form: CityForm },
    zones: { list: ZoneList, form: ZoneForm },
    wards: { list: WardList, form: WardForm },
    properties: { list: PropertyList, form: PropertyForm },
    "sub-properties": { list: SubPropertyList, form: SubPropertyForm },
    "staff-creation": { list: StaffCreationList, form: StaffCreationForm },
  },
  "transport-master": {
    fuel: { list: FuelList, form: FuelForm },
    "vehicle-type": { list: VehicleTypeCreation, form: VehicleTypeCreationForm },
    "vehicle-creation": { list: VehicleCreation, form: VehicleCreationForm },
  },
  "customer-master": {
    "customer-creation": { list: CustomerCreationList, form: CustomerCreationForm },
  },
  "vehicle-tracking": {
    "vehicle-track": { component: VehicleTracking },
    "vehicle-history": { component: VehicleHistory },
  },
  "waste-management": {
    "waste-collected-data": { list: WasteCollectedDataList, form: WasteCollectedForm },
    "collection-monitoring": { component: WasteCollectionMonitor },
  },
  "workforce-management": {
    "workforce-management": { component: WorkforceManagement },
    "date-report": { component: DateReport },
    "day-report": { component: DayReport },
  },
  "citizen-grievance": {
    complaint: { list: ComplaintsList, form: ComplaintAddForm, editForm: ComplaintEditForm },
    "main-complaint-category": { list: MainComplaintCategoryList, form: MainComplaintCategoryForm },
    "sub-complaint-category": { list: SubCategoryComplaintList, form: SubCategoryComplaintForm },
    feedback: { list: FeedBackFormList, form: FeedBackForm },
  },
  reports: {
    "trip-summary": { component: TripSummary },
    "monthly-distance": { component: MonthlyDistance },
    "waste-collected-summary": { component: WasteSummary },
  },
};

const resolveComponent = (config: RouteConfig | undefined, mode: "view" | "new" | "edit"): ModuleComponent => {
  if (!config) return undefined;

  if (config.component) return config.component;
  if (mode === "edit") return config.editForm ?? config.form;
  if (mode === "new") return config.form;
  return config.list;
};

export default function EncryptedRouter() {
  const { encMaster, encModule, id } = useParams();
  const location = useLocation();

  const { master, moduleName } = useMemo(() => {
    return {
      master: decryptSegment(encMaster ?? ""),
      moduleName: decryptSegment(encModule ?? ""),
    };
  }, [encMaster, encModule]);

  if (!master || !moduleName) {
    return <Navigate to="/" replace />;
  }

  const moduleRoutes = ROUTES[master]?.[moduleName];
  if (!moduleRoutes) {
    return <Navigate to="/" replace />;
  }

  const mode: "view" | "new" | "edit" = id ? "edit" : location.pathname.endsWith("/new") ? "new" : "view";
  const Component = resolveComponent(moduleRoutes, mode);

  if (!Component) {
    return <Navigate to="/" replace />;
  }

  return <Component />;
}
