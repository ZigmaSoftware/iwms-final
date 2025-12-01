import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/desktop";

export const desktopApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

desktopApi.interceptors.request.use((config) => {
  const noAuthRoutes = ["login-user/", "login/", "/auth/login"];

  if (!noAuthRoutes.some((r) => config.url?.includes(r))) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
