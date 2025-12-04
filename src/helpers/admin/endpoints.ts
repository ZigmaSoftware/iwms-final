/* --------------------------------------------------------
   Admin endpoint registry
-------------------------------------------------------- */
export const adminEndpoints = {
  continents: "continents",
  countries: "countries",
  states: "states",
  districts: "districts",
  cities: "cities",
  zones: "zones",
  wards: "wards",
  properties: "properties",
  subProperties: "subproperties",
  staffCreation: "staffcreation",
  fuels: "fuels",
  vehicleTypes: "vehicle-type",
  vehicleCreation: "vehicle-creation",
  customerCreations: "customercreations",
  wasteCollections: "wastecollections",
  complaints: "complaints",
  feedbacks: "feedbacks",
  mainUserScreens: "mainuserscreen",
  userScreens: "userscreens",
  userTypes: "user-type",
  users: "user",
  staffUserTypes: "staffusertypes",
  userPermissions: "userpermissions",
} as const;

export type AdminEntity = keyof typeof adminEndpoints;

export const getAdminEndpointPath = (entity: AdminEntity): string => {
  const normalized = adminEndpoints[entity];
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};
