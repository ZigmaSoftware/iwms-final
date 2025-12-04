import type { AxiosRequestConfig } from "axios";
import { desktopApi } from "@/api";

const normalizePath = (path: string): string => {
  const trimmed = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return `/${trimmed}/`;
};

export type CrudHelpers<T = any> = {
  list: (config?: AxiosRequestConfig) => Promise<T[]>;
  get: (id: number | string, config?: AxiosRequestConfig) => Promise<T>;
  create: <Payload = unknown>(payload: Payload, config?: AxiosRequestConfig) => Promise<T>;
  update: <Payload = unknown>(
    id: number | string,
    payload: Payload,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  remove: (id: number | string, config?: AxiosRequestConfig) => Promise<void>;
};

export const createCrudHelpers = <T = any>(basePath: string): CrudHelpers<T> => {
  const resource = normalizePath(basePath);

  return {
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
  };
};
