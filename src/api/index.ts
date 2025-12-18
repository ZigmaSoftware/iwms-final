import axios, { type AxiosInstance } from "axios";

/* --------------------------------------------------------
   ENV
-------------------------------------------------------- */
const IS_PROD = import.meta.env.VITE_PROD === "true";
const API_ROOT = IS_PROD
  ? import.meta.env.VITE_API_PROD
  : import.meta.env.VITE_API_LOCAL;

/* --------------------------------------------------------
   CREATE INSTANCE
-------------------------------------------------------- */
const createApi = (type: "desktop" | "mobile"): AxiosInstance => {
  const api = axios.create({
    baseURL: `${API_ROOT}/${type}`,
    withCredentials: type === "mobile",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  /* ----------------------------------------------------
      AUTH INTERCEPTOR (ATTACHED IMMEDIATELY)
  ---------------------------------------------------- */
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    const isLogin =
      config.url?.includes("/login/login-user");

    if (token && !isLogin) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return api;
};

/* --------------------------------------------------------
   EXPORT SINGLETONS
-------------------------------------------------------- */
export const desktopApi = createApi("desktop");
export const mobileApi = createApi("mobile");
