const DATA_KEYS = [
  "data",
  "date_wise_data",
  "day_wise_data",
  "records",
  "result",
  "payload",
  "rows",
  "items",
] as const;

const API_URL =
  import.meta.env.VITE_WASTE_COLLECTION_API ??
  "https://zigma.in/d2d/folders/waste_collected_summary_report/test_waste_collected_data_api.php";

const API_KEY =
  import.meta.env.VITE_WASTE_COLLECTION_KEY ??
  "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

const CORS_PROXY =
  import.meta.env.VITE_WASTE_COLLECTION_CORS_PROXY ?? "";

export type WasteReportAction = "date_wise_data" | "day_wise_data";

export type WasteApiRow = {
  date: string;
  Start_Time?: string | null;
  End_Time?: string | null;
  total_trip?: number;
  dry_weight?: number;
  wet_weight?: number;
  mix_weight?: number;
  total_net_weight?: number;
  average_weight_per_trip?: number;
  [key: string]: any;
};

export type WasteFetchResult<T = WasteApiRow> = {
  rows: T[];
  message?: string;
};

const pickMessage = (payload: any): string | undefined => {
  const candidates = [
    payload?.message,
    payload?.msg,
    payload?.statusMessage,
    payload?.responseMessage,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
};

const findArray = (node: any): any[] | null => {
  if (Array.isArray(node)) return node;
  if (!node || typeof node !== "object") return null;

  for (const key of DATA_KEYS) {
    if (key in node) {
      const found = findArray(node[key]);
      if (found) return found;
    }
  }

  return null;
};

const buildProxyUrl = (target: string): string | null => {
  const proxy = CORS_PROXY?.trim();
  if (!proxy) return null;

  if (/\{url\}/i.test(proxy)) {
    return proxy.replace(/\{url\}/gi, encodeURIComponent(target));
  }

  if (proxy.endsWith("?") || proxy.endsWith("&")) {
    return `${proxy}${target}`;
  }

  return `${proxy}${target}`;
};

const fetchWithFallback = async (url: string): Promise<string> => {
  const attempt = async (endpoint: string): Promise<string> => {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const raw = await response.text();

    if (!response.ok) {
      const snippet = raw.slice(0, 200);
      throw new Error(`HTTP ${response.status}: ${snippet}`);
    }

    return raw;
  };

  try {
    return await attempt(url);
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }

    const proxied = buildProxyUrl(url);
    if (!proxied) {
      throw error;
    }

    console.warn("Waste report request failed, retrying via proxy.");
    return await attempt(proxied);
  }
};

export async function fetchWasteReport<T = WasteApiRow>(
  action: WasteReportAction,
  fromDate: string,
  toDate: string
): Promise<WasteFetchResult<T>> {
  const params = new URLSearchParams({
    action,
    from_date: fromDate,
    to_date: toDate,
    key: API_KEY,
  });

  const url = `${API_URL}?${params.toString()}`;
  const raw = await fetchWithFallback(url);

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON response: ${raw.slice(0, 200)}`);
  }

  if (payload?.status === false || payload?.success === false) {
    const message = pickMessage(payload) ?? "API rejected the request.";
    throw new Error(message);
  }

  const rows = (findArray(payload) ?? []) as T[];
  const message = pickMessage(payload);

  return { rows, message };
}
