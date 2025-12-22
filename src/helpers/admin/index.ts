// helpers/admin/index.ts
// --------------------------------------------------------------
// Consolidated Admin Services Export
// --------------------------------------------------------------

import { adminApi } from "./registry";

// Master Data
export const continentApi = adminApi.continents;
export const countryApi = adminApi.countries;
export const binApi = adminApi.bins;
export const stateApi = adminApi.states;
export const districtApi = adminApi.districts;
export const cityApi = adminApi.cities;
export const zoneApi = adminApi.zones;
export const wardApi = adminApi.wards;
export const subPropertiesApi = adminApi.subProperties;
export const propertiesApi = adminApi.properties;

// Staff & User Management
export const staffCreationApi = adminApi.staffCreation;
export const staffUserTypeApi = adminApi.staffUserTypes;
export const userTypeApi = adminApi.userTypes;
export const userCreationApi = adminApi.usercreations;

// Transport & Customer
export const fuelApi = adminApi.fuels;
export const vehicleTypeApi = adminApi.vehicleTypes;
export const vehicleCreationApi = adminApi.vehicleCreation;
export const customerCreationApi = adminApi.customerCreations;

// Operations
export const wasteCollectionApi = adminApi.wasteCollections;
export const complaintApi = adminApi.complaints;
export const feedbackApi = adminApi.feedbacks;

// Screens & Permissions
export const mainScreenTypeApi = adminApi.mainscreentype;
export const mainScreenApi = adminApi.mainscreens;
export const userScreenApi = adminApi.userscreens;
export const userScreenActionApi = adminApi.userscreenaction;
export const userScreenPermissionApi = adminApi.userscreenpermissions;

// Utilities
export * from "./endpoints";
export * from "./crudHelpers";
