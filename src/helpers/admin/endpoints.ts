/* --------------------------------------------------------
   Admin endpoint registry (Grouped)
-------------------------------------------------------- */
export const adminEndpoints = {
  /* =========================
     MASTERS
  ========================= */
  continents: "masters/continents",
  countries: "masters/countries",
  bins: "masters/bins",
  states: "masters/states",
  districts: "masters/districts",
  cities: "masters/cities",
  zones: "masters/zones",
  wards: "masters/wards",

  /* =========================
     ASSETS
  ========================= */
  fuels: "assets/fuels",
  properties: "assets/properties",
  subProperties: "assets/subproperties",

  /* =========================
     SCREEN MANAGEMENT
  ========================= */
  mainscreentype: "screen-management/mainscreentype",
  mainscreens: "screen-management/mainscreens",
  userscreens: "screen-management/userscreens",
  userscreenaction: "screen-management/userscreen-action",
  userscreenpermissions: "screen-management/userscreenpermissions",

  /* =========================
     ROLE ASSIGNMENT
  ========================= */
  userTypes: "role-assign/user-type",
  staffUserTypes: "role-assign/staffusertypes",

  /* =========================
     USER CREATION
  ========================= */
  usercreations: "user-creation/users-creation",
  staffCreation: "user-creation/staffcreation",

  /* =========================
     Login
  ========================= */
  
  loginUser: "login/login-user",

  /* =========================
     CUSTOMERS
  ========================= */
  customerCreations: "customers/customercreations",
  wasteCollections: "customers/wastecollections",
  feedbacks: "customers/feedbacks",
  complaints: "customers/complaints",

  /* =========================
     VEHICLES
  ========================= */
  vehicleTypes: "vehicles/vehicle-type",
  vehicleCreation: "vehicles/vehicle-creation",
} as const;

export type AdminEntity = keyof typeof adminEndpoints;

export const getAdminEndpointPath = (entity: AdminEntity): string => {
  const path = adminEndpoints[entity];
  return path.startsWith("/") ? path : `/${path}`;
};
