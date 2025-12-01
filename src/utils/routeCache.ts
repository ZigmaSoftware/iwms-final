export type EncryptedRoutes = {
  encMasters: string;
  encStaffCreation: string;
  encContinents: string;
  encVehicleCreation: string;
  encUserCreation: string;
};

const defaultRoutes: EncryptedRoutes = {
  encMasters: "masters",
  encStaffCreation: "staff-creation",
  encContinents: "continents",
  encVehicleCreation: "vehicle-creation",
  encUserCreation: "user-creation",
};

export function getEncryptedRoute(
  overrides?: Partial<EncryptedRoutes>,
): EncryptedRoutes {
  return {
    ...defaultRoutes,
    ...overrides,
  };
}
