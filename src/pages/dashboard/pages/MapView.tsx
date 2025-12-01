import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, Search, ChevronDown } from "lucide-react";

type RawRecord = Record<string, unknown>;
type StatusKey = "running" | "idle" | "stopped" | "no_data";
type StatusFilterKey = StatusKey | "all";

const STATUS_META: Record<StatusFilterKey, { label: string; color: string; accent: string; bg: string }> = {
  all: { label: "All Vehicles", color: "#0f172a", accent: "#6366f1", bg: "#eef2ff" },
  running: { label: "Running", color: "#1f8b34", accent: "#16a34a", bg: "#e6f5ec" },
  idle: { label: "Idle", color: "#b27700", accent: "#f59e0b", bg: "#fff8e0" },
  stopped: { label: "Stopped", color: "#c21c1c", accent: "#ef4444", bg: "#ffe5e5" },
  no_data: { label: "No Data", color: "#6b7280", accent: "#9ca3af", bg: "#f3f4f6" },
};

const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "idle", label: "Idle" },
  { key: "stopped", label: "Stopped" },
];

const FALLBACK_VEHICLE_INFO = [
  { id: "TRK-001", lat: 40.7128, lng: -74.006, status: "Running", staff: "John Doe", route: "Zone A", weight: "2.4 tons" },
  { id: "TRK-015", lat: 40.758, lng: -73.9855, status: "Idle", staff: "Jane Smith", route: "Zone B", weight: "1.8 tons" },
  { id: "TRK-008", lat: 40.7489, lng: -73.968, status: "Completed", staff: "Mike Johnson", route: "Zone C", weight: "3.1 tons" },
  { id: "TRK-022", lat: 40.7614, lng: -73.9776, status: "Running", staff: "Sarah Williams", route: "Zone D", weight: "2.7 tons" },
];

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
};

const FALLBACK_TRACKED_VEHICLES: LiveVehicle[] = FALLBACK_VEHICLE_INFO.map((vehicle) => ({
  id: vehicle.id,
  label: vehicle.id,
  lat: vehicle.lat,
  lng: vehicle.lng,
  status: mapStatusKey(vehicle.status),
  speed: 0,
  lastUpdate: new Date().toISOString(),
}));

function normalizeVehicle(record: RawRecord): LiveVehicle | null {
  const id = pick(record, ["vehicleId", "vehicle_id", "vehicleNo", "regNo", "vehicle_number"]);
  const lat = pickNum(record, ["lat", "latitude", "Latitude"]);
  const lng = pickNum(record, ["lng", "lon", "longitude", "Longitude"]);
  if (!id || lat === null || lng === null) return null;
  const timestampValue = pickRaw(record, HISTORY_TIMESTAMP_KEYS);
  const timestamp = parseVamosysTimestamp(timestampValue) ?? new Date();
  const speed = pickNum(record, ["speedKmph", "speed", "speedKMH", "speedKmH", "speedMs"]) ?? 0;
  return {
    id,
    label: id,
    lat,
    lng,
    status: deriveVehicleStatus(record, speed),
    speed: Math.max(0, speed),
    lastUpdate: timestamp.toISOString(),
  };
}

export default function MapView() {
  const [vehicleId, setVehicleId] = useState(FALLBACK_TRACKED_VEHICLES[0].id);
  const [liveVehicles, setLiveVehicles] = useState<LiveVehicle[]>(FALLBACK_TRACKED_VEHICLES);
  const [focusedVehicleId, setFocusedVehicleId] = useState<string>(FALLBACK_TRACKED_VEHICLES[0].id);
  const [statusFilter, setStatusFilter] = useState<"all" | StatusKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(new Date());

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
    const map = L.map(mapDivRef.current, {
      center: [40.75, -73.98],
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
  }, []);

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
      const marker = L.circleMarker(position, {
        radius: vehicle.id === focusedVehicleId ? 9 : 6,
        fillColor: statusMeta.color,
        color: statusMeta.color,
        weight: 2,
        fillOpacity: 0.85,
      });
      marker
        .bindPopup(
          `<strong>${vehicle.label}</strong><br/>Status: ${statusMeta.label}<br/>Speed: ${vehicle.speed.toFixed(
            1,
          )} km/h`,
        )
        .addTo(layer);
      if (vehicle.id === focusedVehicleId) {
        marker.openPopup();
      }
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
          const limited = normalized.slice(0, 20);
          setLiveVehicles(limited);
          setFocusedVehicleId((prev) =>
            limited.some((vehicle) => vehicle.id === prev) ? prev : limited[0]?.id ?? prev,
          );
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
  };

  const lastUpdatedLabel = lastUpdatedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Live Map View</h2>
        <p className="text-muted-foreground">Real-time GPS tracking of all vehicles</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 -mt-2">
        <div className="lg:col-span-2">
          <Card className="h-[540px] overflow-visible">
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Fleet Location Map</CardTitle>
                <CardDescription>GPS-tracked vehicles with current status</CardDescription>
              </div>
              <div className="relative ml-auto flex w-full max-w-xs lg:w-auto">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground shadow-sm outline-none"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                  <span className="flex items-center gap-2 text-[13px]">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{searchTerm || "Select Vehicle ID"}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {isDropdownOpen && (
                  <div
                    ref={searchDropdownRef}
                    className="absolute left-0 top-full z-[1000] mt-2 w-[240px] rounded-lg border border-border bg-white text-[13px] shadow-xl"
                  >
                    <div className="border-b border-border px-3 py-2 text-xs uppercase text-muted-foreground tracking-wide">
                      Search vehicle ID
                    </div>
                    <div className="px-3 py-2">
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Type to filter..."
                        className="w-full rounded border border-border/70 px-2 py-1 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
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
                              setVehicleId(vehicle.id);
                              setFocusedVehicleId(vehicle.id);
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
              <div className="relative h-[440px] bg-gradient-to-br from-secondary to-muted rounded-lg border-2 border-dashed border-border overflow-hidden">
                <div ref={mapDivRef} className="absolute inset-0" />
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
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <CardTitle className="text-lg font-semibold">Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vehicle Status</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STATUS_FILTERS.map((filter) => {
                    const isActive = statusFilter === filter.key;
                    const count = filter.key === "all" ? liveVehicles.length : statusCounts[filter.key];
                    const meta = filter.key === "all" ? STATUS_META.running : STATUS_META[filter.key];
                    const baseBg =
                      filter.key === "running"
                        ? "bg-green-50 border-green-200"
                        : filter.key === "idle"
                        ? "bg-amber-50 border-amber-200"
                        : filter.key === "stopped"
                        ? "bg-rose-50 border-rose-200"
                        : "bg-slate-50 border-slate-200";
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setStatusFilter(filter.key)}
                        className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center text-[11px] font-semibold tracking-wide transition shadow-sm hover:shadow ${
                          isActive ? "ring-1 ring-primary" : ""
                        } ${baseBg}`}
                      >
                        <span className="text-[16px] text-slate-900">{count}</span>
                        <span className="text-[11px]" style={{ color: meta.color }}>
                          {filter.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                  Active Vehicles
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-3 max-h-[270px] overflow-y-auto pr-1">
              {displayVehicles.map((vehicle) => {
                const statusMeta = STATUS_META[vehicle.status];
                const isSelected = vehicle.id === vehicleId;
                const statusBg =
                  vehicle.status === "running"
                    ? "bg-green-50 border-green-200"
                    : vehicle.status === "idle"
                    ? "bg-amber-50 border-amber-200"
                    : vehicle.status === "stopped"
                    ? "bg-[#fff1f1] border-[#f4b8b8]"
                    : "bg-slate-50 border-slate-200";
                return (
                  <div
                    key={vehicle.id}
                    className={`p-3 rounded-xl border ${statusBg} hover:shadow-md transition-all cursor-pointer ${
                      isSelected ? "border-primary/80 shadow-lg" : "border-border"
                    }`}
                    onClick={() => handleVehicleClick(vehicle.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{vehicle.label}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                          vehicle.status === "stopped"
                            ? "bg-rose-600 text-white"
                            : vehicle.status === "running"
                            ? "bg-success text-white"
                            : "bg-warning text-black"
                        }`}
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
