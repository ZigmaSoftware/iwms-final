import axios, { type AxiosInstance } from "axios";

/* --------------------------------------------------------
   ROOT URL SWITCH USING TRUE/FALSE FLAG
-------------------------------------------------------- */
const IS_PROD: boolean = import.meta.env.VITE_PROD === "true";

const API_ROOT: string = IS_PROD
  ? import.meta.env.VITE_API_PROD
  : import.meta.env.VITE_API_LOCAL;

/* --------------------------------------------------------
   HELPER FUNCTION TO CREATE AXIOS INSTANCE
-------------------------------------------------------- */
const createApi = (type: "desktop" | "mobile" = "desktop"): AxiosInstance => {
  const baseURL: string = `${API_ROOT}/${type}`;
  return axios.create({
    baseURL,
    withCredentials: type === "mobile",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

/* --------------------------------------------------------
   EXPORT INSTANCES
-------------------------------------------------------- */
export const desktopApi: AxiosInstance = createApi("desktop");
export const mobileApi: AxiosInstance = createApi("mobile");
