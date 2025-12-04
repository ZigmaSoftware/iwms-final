import { adminEndpoints, type AdminEntity } from "./endpoints";
import { createCrudHelpers, type CrudHelpers } from "./crudHelpers";

type AdminApiRegistry = {
  [K in AdminEntity]: CrudHelpers;
};

export const adminApi: AdminApiRegistry = Object.entries(adminEndpoints).reduce(
  (registry, [key, path]) => {
    registry[key as AdminEntity] = createCrudHelpers(path);
    return registry;
  },
  {} as AdminApiRegistry
);

export const getAdminApi = (entity: AdminEntity) => adminApi[entity];

export * from "./endpoints";
export * from "./crudHelpers";
