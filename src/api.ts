import axios from "axios";

/* --------------------------------------------------------
   ENV-DRIVEN ROOT URL
   Fallback to localhost backend
-------------------------------------------------------- */
const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

/* --------------------------------------------------------
   AXIOS INSTANCES
-------------------------------------------------------- */

export const desktopApi = axios.create({
  baseURL: `${API_ROOT}/desktop`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const mobileAPI = axios.create({
  baseURL: `${API_ROOT}/mobile`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* --------------------------------------------------------
   AUTH INTERCEPTOR — Desktop Only
-------------------------------------------------------- */

desktopApi.interceptors.request.use((config) => {
  const noAuthRoutes = ["login-user/", "login/", "/auth/login"];

  const skipAuth = noAuthRoutes.some((r) => config.url?.includes(r));

  if (!skipAuth) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
