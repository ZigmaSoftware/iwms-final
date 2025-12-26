import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, Search, ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type RawRecord = Record<string, unknown>;
type StatusKey = "running" | "idle" | "stopped" | "no_data";
type StatusFilterKey = StatusKey | "all";

type StatusSurface = { bg: string; border: string };
type StatusBadge = { bg: string; color: string };

const STATUS_META: Record<
  StatusFilterKey,
  {
    label: string;
    accent: string;
    textLight: string;
    textDark: string;
    surfaceLight: StatusSurface;
    surfaceDark: StatusSurface;
    badgeLight: StatusBadge;
    badgeDark: StatusBadge;
  }
> = {
  all: {
    label: "All Vehicles",
    accent: "#6366f1",
    textLight: "#312e81",
    textDark: "#c7d2fe",
    surfaceLight: { bg: "#eef2ff", border: "#c7d2fe" },
    surfaceDark: { bg: "rgba(99,102,241,0.16)", border: "rgba(129,140,248,0.45)" },
    badgeLight: { bg: "#6366f1", color: "#ffffff" },
    badgeDark: { bg: "rgba(79,70,229,0.75)", color: "#e0e7ff" },
  },
  running: {
    label: "Running",
    accent: "#16a34a",
    textLight: "#14532d",
    textDark: "#4ade80",
    surfaceLight: { bg: "#e6f5ec", border: "#a3e0b9" },
    surfaceDark: { bg: "rgba(34,197,94,0.28)", border: "rgba(74,222,128,0.7)" },
    badgeLight: { bg: "#16a34a", color: "#ffffff" },
    badgeDark: { bg: "#22c55e", color: "#052e16" },
  },
  idle: {
    label: "Idle",
    accent: "#f59e0b",
    textLight: "#92400e",
    textDark: "#fde68a",
    surfaceLight: { bg: "#fff8e1", border: "#fcd34d" },
    surfaceDark: { bg: "rgba(245,158,11,0.14)", border: "rgba(251,191,36,0.45)" },
    badgeLight: { bg: "#facc15", color: "#1f2937" },
    badgeDark: { bg: "#b45309", color: "#fff7ed" },
  },
  stopped: {
    label: "Stopped",
    accent: "#ef4444",
    textLight: "#991b1b",
    textDark: "#fecaca",
    surfaceLight: { bg: "#ffe5e5", border: "#fca5a5" },
    surfaceDark: { bg: "rgba(239,68,68,0.15)", border: "rgba(248,113,113,0.45)" },
    badgeLight: { bg: "#ef4444", color: "#ffffff" },
    badgeDark: { bg: "#b91c1c", color: "#fee2e2" },
  },
  no_data: {
    label: "No Data",
    accent: "#9ca3af",
    textLight: "#374151",
    textDark: "#d1d5db",
    surfaceLight: { bg: "#f3f4f6", border: "#d1d5db" },
    surfaceDark: { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.35)" },
    badgeLight: { bg: "#9ca3af", color: "#1f2937" },
    badgeDark: { bg: "#4b5563", color: "#e5e7eb" },
  },
};

const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "idle", label: "Idle" },
  { key: "stopped", label: "Stopped" },
];

const VEHICLE_ICON_EMOJI = "🚚";

function createVehicleIcon(status: StatusKey, isFocused: boolean) {
  const meta = STATUS_META[status];
  const size = isFocused ? 40 : 32;
  const border = isFocused ? 3 : 2;
  const shadow = isFocused ? "0 8px 18px rgba(0,0,0,.35)" : "0 4px 12px rgba(0,0,0,.3)";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${meta.accent};
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-size:${isFocused ? 20 : 16}px;
          box-shadow:${shadow};
          border:${border}px solid #fff;
        "
      >
        <span style="line-height:1;">${VEHICLE_ICON_EMOJI}</span>
      </div>
    `,
  });
}

const TRACKING_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const HISTORY_TIMESTAMP_KEYS = [
  "deviceTime",
  "timestamp",
  "gpsTime",
  "time",
  "serverTime",
  "_ts",
  "date",
  "dateSec",
  "lastComunicationTime",
];

function pick(source: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return fallback;
}

function pickNum(source: RawRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null || value === "") continue;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return null;
}

function pickRaw(source: RawRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (!source?.hasOwnProperty(key)) continue;
    const value = source[key];
    if (value === undefined || value === null || value === "") continue;
    return value;
  }
  return undefined;
}

function parseVamosysTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    let seconds = value;
    if (seconds > 1e12) seconds = seconds / 1000;
    return new Date(Math.round(seconds * 1000));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      let seconds = numeric;
      if (seconds > 1e12) seconds = seconds / 1000;
      return new Date(Math.round(seconds * 1000));
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

function mapStatusKey(value: string): StatusKey {
  const raw = value.toLowerCase();
  if (raw.includes("run") || raw.includes("on")) return "running";
  if (raw.includes("idle")) return "idle";
  if (raw.includes("park") || raw.includes("stop") || raw.includes("complete") || raw.includes("off")) return "stopped";
  return "no_data";
}

function deriveVehicleStatus(record: RawRecord, speed: number): StatusKey {
  if (speed > 2) return "running";
  const ignition = pick(record, ["ignitionStatus", "vehicleMode"], "").toLowerCase();
  if (ignition.includes("on")) {
    return "idle";
  }
  if (ignition.includes("off")) {
    return "stopped";
  }
  return mapStatusKey(pick(record, ["status", "vehicleStatus", "mode"], ""));
}

type LiveVehicle = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: StatusKey;
  speed: number;
  lastUpdate: string;
  driver?: string;
  location?: string;
};

function normalizeVehicle(record: RawRecord): LiveVehicle | null {
  const id = pick(record, ["vehicleId", "vehicle_id", "vehicleNo", "regNo", "vehicle_number"]);
  const lat = pickNum(record, ["lat", "latitude", "Latitude"]);
  const lng = pickNum(record, ["lng", "lon", "longitude", "Longitude"]);
  if (!id || lat === null || lng === null) return null;
  const timestampValue = pickRaw(record, HISTORY_TIMESTAMP_KEYS);
  const timestamp = parseVamosysTimestamp(timestampValue) ?? new Date();
  const speed = pickNum(record, ["speedKmph", "speed", "speedKMH", "speedKmH", "speedMs"]) ?? 0;
  const driver = pick(record, ["driverName", "driver_name", "driver", "staffName", "staff"], "");
  const location = pick(record, ["location", "address", "lastLocation", "last_location"], "");
  return {
    id,
    label: id,
    lat,
    lng,
    status: deriveVehicleStatus(record, speed),
    speed: Math.max(0, speed),
    lastUpdate: timestamp.toISOString(),
    driver: driver || undefined,
    location: location || undefined,
  };
}

export default function MapView() {
  const { theme, palette } = useTheme();
  const isDarkMode = theme === "dark";
  const preferredVehicleId = "UP16KT1737";
  const [vehicleId, setVehicleId] = useState(preferredVehicleId);
  const [liveVehicles, setLiveVehicles] = useState<LiveVehicle[]>([]);
  const [focusedVehicleId, setFocusedVehicleId] = useState<string>(preferredVehicleId);
  const [statusFilter, setStatusFilter] = useState<"all" | StatusKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());
  const [panelOpen, setPanelOpen] = useState(false);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const statusCounts = useMemo(() => {
    const base: Record<StatusKey, number> = { running: 0, idle: 0, stopped: 0, no_data: 0 };
    liveVehicles.forEach((vehicle) => {
      base[vehicle.status] += 1;
    });
    return base;
  }, [liveVehicles]);

  const filteredVehicles = useMemo<LiveVehicle[]>(() => {
    const filteredByStatus = liveVehicles.filter((vehicle) => statusFilter === "all" || vehicle.status === statusFilter);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredByStatus;
    return filteredByStatus.filter((vehicle) => vehicle.label.toLowerCase().includes(term));
  }, [liveVehicles, statusFilter, searchTerm]);

  const displayVehicles = filteredVehicles.slice(0, 12);

  const searchDropdownVehicles = liveVehicles.slice(0, 12).filter((vehicle) =>
    vehicle.label.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current?.contains(event.target as Node) ||
        searchDropdownRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    if (!liveVehicles.length) return;
    const initialVehicle =
      liveVehicles.find((vehicle) => vehicle.id === preferredVehicleId) ?? liveVehicles[0];
    const map = L.map(mapDivRef.current, {
      center: [initialVehicle.lat, initialVehicle.lng],
      zoom: 11,
      zoomControl: false,
    });
    L.control.zoom({ position: "topright" }).addTo(map);
    const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });
    tiles.addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 0);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [liveVehicles, preferredVehicleId]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!filteredVehicles.length) return;
    const bounds: LatLngTuple[] = [];
    filteredVehicles.forEach((vehicle) => {
      const position: LatLngTuple = [vehicle.lat, vehicle.lng];
      bounds.push(position);
      const statusMeta = STATUS_META[vehicle.status];
      const isFocused = vehicle.id === focusedVehicleId;
      const marker = L.marker(position, {
        icon: createVehicleIcon(vehicle.status, isFocused),
        title: vehicle.label,
      });
      marker
        .bindPopup(
          `<strong>${vehicle.label}</strong><br/>Status: ${statusMeta.label}<br/>Speed: ${vehicle.speed.toFixed(
            1,
          )} km/h`,
        )
        .addTo(layer);
      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());
      marker.on("click", () => handleVehicleClick(vehicle.id));
    });
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [32, 32] });
    }
  }, [filteredVehicles, focusedVehicleId]);

  useEffect(() => {
    if (!mapRef.current) return;
    const target = liveVehicles.find((vehicle) => vehicle.id === focusedVehicleId);
    if (!target) return;
    mapRef.current.setView([target.lat, target.lng], mapRef.current.getZoom(), { animate: true });
  }, [focusedVehicleId, liveVehicles]);

  useEffect(() => {
    if (!mapRef.current) return;
    const zoomControl = mapRef.current.getContainer().querySelector(".leaflet-control-zoom") as HTMLElement | null;
    if (!zoomControl) return;
    zoomControl.style.pointerEvents = isDropdownOpen ? "none" : "";
    zoomControl.style.opacity = isDropdownOpen ? "0.45" : "1";
    zoomControl.style.visibility = isDropdownOpen ? "hidden" : "visible";
  }, [isDropdownOpen]);

  useEffect(() => {
    let isMounted = true;
    const fetchLive = async () => {
      setLoadingLive(true);
      try {
        const response = await fetch(TRACKING_API_URL);
        if (!response.ok) {
          throw new Error(`Live data error (${response.status})`);
        }
        const body = await response.json();
        const payload = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
          ? body.data
          : [];
        const normalized = payload
          .map((record: RawRecord) => normalizeVehicle(record))
          .filter(
            (vehicle: LiveVehicle | null | undefined): vehicle is LiveVehicle => Boolean(vehicle),
          ) as LiveVehicle[];
        if (!isMounted) return;
        if (normalized.length) {
          let limited = normalized.slice(0, 20);
          const preferred = normalized.find((vehicle) => vehicle.id === preferredVehicleId);
          if (preferred && !limited.some((vehicle) => vehicle.id === preferredVehicleId)) {
            limited = [preferred, ...limited.slice(0, 19)];
          }
          setLiveVehicles(limited);
          if (preferred && limited.some((vehicle) => vehicle.id === preferredVehicleId)) {
            setVehicleId(preferredVehicleId);
            setFocusedVehicleId(preferredVehicleId);
          } else {
            setFocusedVehicleId((prev) =>
              limited.some((vehicle) => vehicle.id === prev) ? prev : limited[0]?.id ?? prev,
            );
            setVehicleId((prev) =>
              limited.some((vehicle) => vehicle.id === prev) ? prev : limited[0]?.id ?? prev,
            );
          }
          setLiveError("");
          setLastUpdatedAt(new Date());
        } else {
          setLiveError("No live vehicles available.");
        }
      } catch (err) {
        console.error("Live vehicle fetch failed:", err);
        if (!isMounted) return;
        setLiveError("Unable to load live positions.");
      } finally {
        if (isMounted) {
          setLoadingLive(false);
        }
      }
    };
    fetchLive();
    const intervalId = window.setInterval(fetchLive, 60_000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!filteredVehicles.length) return;
    const hasSelected = filteredVehicles.some((vehicle) => vehicle.id === vehicleId);
    if (!hasSelected) {
      const fallbackId = filteredVehicles[0]?.id;
      if (fallbackId) {
        setVehicleId(fallbackId);
        setFocusedVehicleId(fallbackId);
      }
    }
  }, [filteredVehicles, vehicleId]);

  const handleVehicleClick = (id: string) => {
    setVehicleId(id);
    if (liveVehicles.some((vehicle) => vehicle.id === id)) {
      setFocusedVehicleId(id);
    }
    setPanelOpen(true);
  };

  const lastUpdatedLabel = lastUpdatedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const selectedVehicle = liveVehicles.find((vehicle) => vehicle.id === vehicleId);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-3xl font-bold text-sky-500">Live Map View</h2>
        <p className="text-muted-foreground">Real-time GPS tracking of all vehicles</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 -mt-2">
        <div className="lg:col-span-2">
          <Card
            className="h-[760px] overflow-visible"
            style={{
              background: isDarkMode ? "#0f172a" : undefined,
              borderColor: isDarkMode ? "rgba(148,163,184,0.2)" : undefined,
              boxShadow: isDarkMode ? "0 25px 45px rgba(2,6,23,0.85)" : undefined,
            }}
          >
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              {/* <div>
                <CardTitle>Fleet Location Map</CardTitle>
                <CardDescription>GPS-tracked vehicles with current status</CardDescription>
              </div> */}
              <div className="relative ml-auto flex w-full max-w-xs lg:w-auto">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground shadow-sm outline-none"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                  <span className="flex items-center gap-2 text-[13px]">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{searchTerm || "All Vehicles"}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {isDropdownOpen && (
                  <div
                    ref={searchDropdownRef}
                    className="absolute left-0 top-full z-[1000] mt-2 w-[240px] rounded-lg border border-border bg-card text-card-foreground text-[13px] shadow-xl dark:shadow-slate-900/50"
                  >
                    <div className="border-b border-border px-3 py-2 text-xs uppercase text-muted-foreground tracking-wide">
                      Search vehicle ID
                    </div>
                    <div className="px-3 py-2">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Type to filter..."
                        className="w-full rounded border border-border/70 px-2 py-1 text-xs outline-none focus:border-primary"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          className="mt-2 w-full rounded border border-border/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground transition hover:text-foreground"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-none border-t border-border px-3 py-2 text-left text-foreground transition hover:bg-primary/10"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSearchTerm("");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span>All Vehicles</span>
                        <span className="text-[10px] text-muted-foreground">
                          {`Showing ${liveVehicles.length}`}
                        </span>
                      </button>
                      {searchDropdownVehicles.length ? (
                        searchDropdownVehicles.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-none border-t border-border px-3 py-2 text-left text-foreground transition hover:bg-primary/10"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setSearchTerm(vehicle.label);
                              setIsDropdownOpen(false);
                              handleVehicleClick(vehicle.id);
                            }}
                          >
                            <span>{vehicle.label}</span>
                            <span className="text-[10px] text-muted-foreground">{STATUS_META[vehicle.status]?.label}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted-foreground">No matching vehicles</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-[640px] bg-gradient-to-br from-secondary to-muted rounded-lg border-2 border-dashed border-border overflow-hidden">
                <div ref={mapDivRef} className="absolute inset-0" />
                <VehicleSidePanel
                  vehicle={selectedVehicle}
                  open={panelOpen}
                  onToggle={() => setPanelOpen((prev) => !prev)}
                  onClose={() => setPanelOpen(false)}
                  isDarkMode={isDarkMode}
                />
                <div className="absolute left-3 bottom-3 rounded-md bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow">
                  <div>{`Live vehicles: ${liveVehicles.length}`}</div>
                  <div>{`Updated ${lastUpdatedLabel}`}</div>
                </div>
                {loadingLive && (
                  <div className="absolute right-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    Refreshing live data…
                  </div>
                )}
                {liveError && (
                  <div className="absolute left-3 top-3 rounded-md bg-error/90 px-2 py-1 text-[11px] font-medium text-white">
                    {liveError}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            style={{
              background: isDarkMode ? "#0f172a" : undefined,
              borderColor: isDarkMode ? "rgba(148,163,184,0.15)" : undefined,
              boxShadow: isDarkMode ? "0 25px 45px rgba(2,6,23,0.75)" : undefined,
            }}
          >
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <CardTitle className="text-lg font-semibold">Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STATUS_FILTERS.map((filter) => {
                    const isActive = statusFilter === filter.key;
                    const count = filter.key === "all" ? liveVehicles.length : statusCounts[filter.key];
                    const meta = filter.key === "all" ? STATUS_META.all : STATUS_META[filter.key];
                    const surface = isDarkMode ? meta.surfaceDark : meta.surfaceLight;
                    const labelColor = isDarkMode ? meta.textDark : meta.textLight;
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setStatusFilter(filter.key)}
                        className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-center text-[11px] font-semibold tracking-wide transition shadow-sm hover:shadow ${
                          isActive ? "ring-1 ring-primary" : ""
                        }`}
                        style={{
                          background: surface.bg,
                          borderColor: surface.border,
                        }}
                      >
                        <span
                          className="text-[16px]"
                          style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}
                        >
                          {count}
                        </span>
                        <span className="text-[11px]" style={{ color: labelColor }}>
                          {filter.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            style={{
              background: isDarkMode ? "#0f172a" : undefined,
              borderColor: isDarkMode ? "rgba(148,163,184,0.15)" : undefined,
              boxShadow: isDarkMode ? "0 25px 45px rgba(2,6,23,0.75)" : undefined,
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                  Active Vehicles
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-3 max-h-[495px] overflow-y-auto pr-1">
              {displayVehicles.map((vehicle) => {
                const statusMeta = STATUS_META[vehicle.status];
                const isSelected = vehicle.id === vehicleId;
                const surface = isDarkMode ? statusMeta.surfaceDark : statusMeta.surfaceLight;
                const badge = isDarkMode ? statusMeta.badgeDark : statusMeta.badgeLight;
                return (
                  <div
                    key={vehicle.id}
                    className="p-3 rounded-xl border hover:shadow-md transition-all cursor-pointer"
                    style={{
                      background: surface.bg,
                      borderColor: isSelected ? palette.primary : surface.border,
                      boxShadow: isSelected ? palette.cardShadow : undefined,
                    }}
                    onClick={() => handleVehicleClick(vehicle.id)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-sm">{vehicle.label}</span>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-medium"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {statusMeta?.label ?? "Unknown"}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Speed:</span>
                        <span>{vehicle.speed.toFixed(1)} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Coords:</span>
                        <span>
                          {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Updated:</span>
                        <span>{new Date(vehicle.lastUpdate).toLocaleTimeString("en-US")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VehicleSidePanel({
  vehicle,
  open,
  onToggle,
  onClose,
  isDarkMode,
}: {
  vehicle?: LiveVehicle;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  isDarkMode: boolean;
}) {
  const [infoOpen, setInfoOpen] = useState(true);
  const meta = vehicle ? STATUS_META[vehicle.status] : null;
  const surface = meta ? (isDarkMode ? meta.surfaceDark : meta.surfaceLight) : null;
  const WIDTH = 280;
  const locationLabel = vehicle?.location?.trim() ? vehicle.location : "Location unavailable";
  const driverLabel = vehicle?.driver?.trim() ? vehicle.driver : "-";
  const lastUpdatedLabel = vehicle
    ? new Date(vehicle.lastUpdate).toLocaleString("en-US")
    : "—";

  return (
    <div
      className={`absolute left-0 top-0 z-[700] h-full shadow-xl transition-transform duration-300 ${
        isDarkMode ? "bg-slate-950/95 text-slate-100" : "bg-white text-slate-900"
      }`}
      style={{
        width: WIDTH,
        transform: open ? "translateX(0)" : `translateX(-${WIDTH}px)`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-bold shadow ${
          isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        {open ? "❮" : "❯"}
      </button>

      <button
        type="button"
        onClick={onClose}
        className={`absolute right-2 top-2 rounded-full border px-2 py-1 text-xs font-bold shadow ${
          isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        ✕
      </button>

      <div className="h-full overflow-y-auto border-l border-border/60">
        {vehicle ? (
          <>
            <div className="flex items-start justify-between border-b border-border px-3 py-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Vehicle
                </div>
                <div className="text-base font-semibold">{vehicle.label}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 pt-3">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-xl border text-2xl"
                style={{
                  background: surface?.bg ?? (isDarkMode ? "rgba(148,163,184,0.12)" : "#f1f5f9"),
                  borderColor: surface?.border ?? "transparent",
                }}
              >
                🚚
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-semibold">Live Vehicle</div>
                <div className="text-muted-foreground">{locationLabel}</div>
              </div>
            </div>

            <div className="space-y-3 px-3 pt-3 text-xs">
              <div className="space-y-1">
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  <span className="text-muted-foreground">{meta?.label ?? "Unknown"}</span>
                </div>
                <div>
                  <span className="font-semibold">Driver:</span>{" "}
                  <span className="text-muted-foreground">{driverLabel}</span>
                </div>
                <div>
                  <span className="font-semibold">Speed:</span>{" "}
                  <span className="text-muted-foreground">{vehicle.speed.toFixed(1)} km/h</span>
                </div>
                <div>
                  <span className="font-semibold">Coordinates:</span>{" "}
                  <span className="text-muted-foreground">
                    {vehicle.lat.toFixed(5)}, {vehicle.lng.toFixed(5)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{" "}
                  <span className="text-muted-foreground">{locationLabel}</span>
                </div>
                <div>
                  <span className="font-semibold">Last Updated:</span>{" "}
                  <span className="text-muted-foreground">{lastUpdatedLabel}</span>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => setInfoOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-xs font-semibold"
                >
                  <span>Vehicle Information</span>
                  <span className="text-base">{infoOpen ? "−" : "+"}</span>
                </button>
                {infoOpen && (
                  <div className="mt-2 space-y-1 rounded-md border border-border/60 bg-background/60 p-2">
                    <InfoRow label="Vehicle No" value={vehicle.label} />
                    <InfoRow label="Status" value={meta?.label ?? "Unknown"} />
                    <InfoRow label="Driver" value={driverLabel} />
                    <InfoRow label="Speed" value={`${vehicle.speed.toFixed(1)} km/h`} />
                    <InfoRow label="Last Updated" value={lastUpdatedLabel} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-3 text-xs text-muted-foreground">Select a vehicle</div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value ?? "—"}</span>
    </div>
  );
}
