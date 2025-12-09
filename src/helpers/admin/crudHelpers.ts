import type { AxiosRequestConfig } from "axios";
import { desktopApi } from "@/api";

/* ----------------------------------------------------
   Normalize API path
---------------------------------------------------- */
const normalizePath = (path: string): string => {
  const trimmed = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return `/${trimmed}/`;
};

/* ----------------------------------------------------
   CRUD + Custom Helpers
---------------------------------------------------- */
export type CrudHelpers<T = any> = {
  list: (config?: AxiosRequestConfig) => Promise<T[]>;
  get: (id: string | number, config?: AxiosRequestConfig) => Promise<T>;
  create: <P = unknown>(payload: P, config?: AxiosRequestConfig) => Promise<T>;
  update: <P = unknown>(
    id: string | number,
    payload: P,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  remove: (id: string | number, config?: AxiosRequestConfig) => Promise<void>;

  /* NEW → dynamic custom action support */
  action: <R = any, P = any>(
    action: string,
    payload?: P,
    config?: AxiosRequestConfig
  ) => Promise<R>;
};

/* ----------------------------------------------------
   Factory
---------------------------------------------------- */
export const createCrudHelpers = <T = any>(basePath: string): CrudHelpers<T> => {
  const resource = normalizePath(basePath);

  return {
    /* ---------------------------
       CRUD
    ---------------------------- */
    list: async (config) => {
      const { data } = await desktopApi.get<T[]>(resource, config);
      return data;
    },

    get: async (id, config) => {
      const { data } = await desktopApi.get<T>(`${resource}${id}/`, config);
      return data;
    },

    create: async (payload, config) => {
      const { data } = await desktopApi.post<T>(resource, payload, config);
      return data;
    },

    update: async (id, payload, config) => {
      const { data } = await desktopApi.put<T>(`${resource}${id}/`, payload, config);
      return data;
    },

    remove: async (id, config) => {
      await desktopApi.delete(`${resource}${id}/`, config);
    },

    /* ---------------------------
       CUSTOM ENDPOINTS
       Example:
       api.action("bulk-create", payload)
       → POST /resource/bulk-create/
    ---------------------------- */
    action: async (action, payload, config) => {
      const url = `${resource}${action}/`;

      if (payload) {
        const { data } = await desktopApi.post(url, payload, config);
        return data;
      }

      const { data } = await desktopApi.get(url, config);
      return data;
    },
  };
};
