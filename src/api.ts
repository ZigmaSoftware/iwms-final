import axios from "axios";

/* --------------------------------------------------------
   ENV-DRIVEN ROOT URLS
   Use IPv4 loopback as fallback because the backend only
   listens on 127.0.0.1 and ignores ::1/localhost.
-------------------------------------------------------- */
const DEV_API_ROOT =
  import.meta.env.VITE_API_URL ?? "http://115.245.93.26:4216/api";

// const DEV_API_ROOT =
//   import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";
const PROD_API_ROOT = import.meta.env.VITE_API_PROD_URL ?? DEV_API_ROOT;
const API_ROOT = import.meta.env.PROD ? PROD_API_ROOT : DEV_API_ROOT;

const DESKTOP_API_URL =
  import.meta.env.VITE_DESKTOP_API_URL ?? `${API_ROOT}/desktop`;
const MOBILE_API_URL =
  import.meta.env.VITE_MOBILE_API_URL ?? `${API_ROOT}/mobile`;
/* --------------------------------------------------------
   AXIOS INSTANCES
-------------------------------------------------------- */

// api/desktopApi.js

export const desktopApi = axios.create({
  baseURL: DESKTOP_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const mobileAPI = axios.create({
  baseURL: MOBILE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* --------------------------------------------------------
   AUTH INTERCEPTOR — Desktop Only
-------------------------------------------------------- */

// desktopApi.interceptors.request.use((config) => {
//   const noAuthRoutes = ["login-user/", "login/", "/auth/login"];

//   const skipAuth = noAuthRoutes.some((r) => config.url?.includes(r));

//   if (!skipAuth) {
//     const token = localStorage.getItem("access_token");
//     if (token) {
//       config.headers = config.headers ?? {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }

//   return config;
// });
