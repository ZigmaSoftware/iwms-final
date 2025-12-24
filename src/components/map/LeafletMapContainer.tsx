import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/contexts/ThemeContext";

/* ================= API ================= */
const VEHICLE_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const GEOFENCE_API_URL =
  "https://api.vamosys.com/v2/viewSiteV2?userId=BLUEPLANET";

/* ================= TYPES ================= */
type VehicleStatus = "Running" | "Idle" | "Parked" | "No Data";

export interface VehicleData {
  vehicle_no: string;
  lat: number;
  lng: number;
  speed: number;
  status: VehicleStatus;
  driver: string;
  updated_at: string;
  location?: string;
}

interface GeofenceSite {
  siteName: string;
  latlong: string[];
  type: "Polygon" | "Circle";
}

/* ================= CONSTANTS ================= */
const STATUS_COLORS: Record<VehicleStatus, string> = {
  Running: "#22c55e",
  Idle: "#facc15",
  Parked: "#3b82f6",
  "No Data": "#ef4444",
};

/* ================= HELPERS ================= */
function parseLatLng(latlong: string[]): LatLngTuple[] {
  return latlong
    .map((p) => {
      const [lat, lng] = p.split(",").map(Number);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return [lat, lng] as LatLngTuple;
    })
    .filter(Boolean) as LatLngTuple[];
}

type RawRecord = Record<string, any>;

function pickString(
  source: RawRecord,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return fallback;
}

function pickNumber(source: RawRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null || value === "") continue;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return null;
}

const VEHICLE_COLLECTION_KEYS = [
  "data",
  "vehicles",
  "vehicleData",
  "vehicleList",
  "vehicleDetails",
];

function extractVehicleRows(payload: any): RawRecord[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    for (const key of VEHICLE_COLLECTION_KEYS) {
      const candidate = payload[key];
      if (Array.isArray(candidate)) return candidate;
    }

    for (const key of VEHICLE_COLLECTION_KEYS) {
      const nestedParent = payload[key];
      if (!nestedParent || typeof nestedParent !== "object") continue;
      for (const nestedKey of VEHICLE_COLLECTION_KEYS) {
        const nested = nestedParent[nestedKey];
        if (Array.isArray(nested)) return nested;
      }
    }
  }

  return [];
}

/* ================= VEHICLE ICON ================= */
function getVehicleIcon(status: VehicleStatus) {
  const color = STATUS_COLORS[status];

  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `
      <div
        style="
          width:34px;
          height:34px;
          border-radius:50%;
          background:${color};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 10px rgba(0,0,0,.35);
          border:2px solid #fff;
        "
      >
        <span style="font-size:18px; line-height:1;">🚚</span>
      </div>
    `,
  });
}

interface LeafletMapContainerProps {
  vehicles?: VehicleData[];
  height?: string;
}

/* ================= COMPONENT ================= */
export function LeafletMapContainer({
  vehicles: overrideVehicles,
  height = "600px",
}: LeafletMapContainerProps = {}) {
  const { theme } = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const vehicleLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);

  const [fetchedVehicles, setFetchedVehicles] = useState<VehicleData[]>([]);
  const [geofenceSites, setGeofenceSites] = useState<GeofenceSite[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const isDarkMode = theme === "dark";

  const [statusFilter, setStatusFilter] = useState<Record<VehicleStatus, boolean>>({
    Running: true,
    Idle: true,
    Parked: true,
    "No Data": true,
  });

  /* ================= MAP INIT ================= */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      preferCanvas: true,
    }).setView([28.476, 77.507], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    vehicleLayerRef.current = L.layerGroup().addTo(map);
    geofenceLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ================= FETCH GEOFENCES ================= */
  useEffect(() => {
    fetch(GEOFENCE_API_URL)
      .then((r) => r.json())
      .then((json) => {
        const sites =
          json?.data?.siteParent?.flatMap((p: any) => p.site) ?? [];
        setGeofenceSites(sites);
      })
      .catch(console.error);
  }, []);

  /* ================= FETCH VEHICLES ================= */
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(VEHICLE_API_URL);
        const json = await res.json();

        const rows = extractVehicleRows(json);

        const normalized: VehicleData[] = rows
          .map((entry: RawRecord) => {
            const lat = pickNumber(entry, ["lat", "Lat", "latitude", "Latitude"]);
            const lng = pickNumber(entry, ["lng", "lon", "longitude", "Longitude"]);
            if (lat == null || lng == null) return null;

            const speed =
              pickNumber(entry, ["speedKmph", "speed", "speed_kmph", "speedKMH"]) ?? 0;
            const ignitionRaw = pickString(
              entry,
              ["ignitionStatus", "ignition", "ign"],
              ""
            ).toUpperCase();

            const ignition =
              ignitionRaw === "ON" || ignitionRaw === "1"
                ? "ON"
                : ignitionRaw === "OFF" || ignitionRaw === "0"
                ? "OFF"
                : "NA";

            const noData =
              Number(entry.noDataStatus ?? entry.noData ?? entry.statusNoData ?? 0) === 1;

            let status: VehicleStatus = "Idle";
            if (noData) status = "No Data";
            else if (speed > 2) status = "Running";
            else if (ignition === "OFF") status = "Parked";

            return {
              vehicle_no:
                pickString(
                  entry,
                  [
                    "vehicle_no",
                    "vehicleNo",
                    "vehicle_number",
                    "vehicleNumber",
                    "regNo",
                  ],
                  "UNKNOWN"
                ) || "UNKNOWN",
              lat,
              lng,
              speed,
              status,
              driver:
                pickString(entry, ["driverName", "driver_name", "driver"], "-") || "-",
              location: pickString(entry, ["location", "address", "lastLocation"], ""),
              updated_at:
                pickString(
                  entry,
                  [
                    "updatedTime",
                    "lastComunicationTime",
                    "lastCommunication",
                    "gpsTime",
                    "deviceTime",
                    "serverTime",
                    "lastSeen",
                    "updated_at",
                  ],
                  ""
                ) || "",
            };
          })
          .filter(Boolean) as VehicleData[];

        setFetchedVehicles(normalized);
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
      }
    };

    fetchVehicles();
    const t = setInterval(fetchVehicles, 15000);
    return () => clearInterval(t);
  }, []);

  const displayedVehicles = useMemo(
    () => overrideVehicles ?? fetchedVehicles,
    [overrideVehicles, fetchedVehicles],
  );

  /* ================= DRAW VEHICLES ================= */
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    vehicleLayerRef.current.clearLayers();

    displayedVehicles
      .filter((v) => statusFilter[v.status])
      .forEach((v) => {
        const marker = L.marker([v.lat, v.lng], {
          icon: getVehicleIcon(v.status),
        });
        marker.on("click", () => {
          setSelectedVehicle(v);
          setInfoOpen(true);
          setPanelOpen(true);
        });
        marker.bindTooltip(
            `
              <div style="min-width:140px;">
                <div style="font-weight:600;">${v.vehicle_no}</div>
                <div>Driver: ${v.driver}</div>
                <div>Status: ${v.status}</div>
                <div>Speed: ${v.speed} km/h</div>
              </div>
            `,
            { direction: "top", offset: [0, -12], opacity: 0.95 }
          ).addTo(vehicleLayerRef.current!);
      });
  }, [displayedVehicles, statusFilter]);

  /* ================= DRAW GEOFENCES ================= */
  useEffect(() => {
    if (!mapRef.current || !geofenceLayerRef.current) return;
    geofenceLayerRef.current.clearLayers();

    const bounds: LatLngTuple[] = [];

    geofenceSites
      .filter((s) => s.type === "Polygon")
      .forEach((site) => {
        const coords = parseLatLng(site.latlong);
        if (!coords.length) return;

        L.polygon(coords, {
          color: "#2563eb",
          fillOpacity: 0.25,
        })
          .bindTooltip(site.siteName)
          .addTo(geofenceLayerRef.current!);

        bounds.push(...coords);
      });

    displayedVehicles.forEach((v) => bounds.push([v.lat, v.lng]));

    if (bounds.length) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [geofenceSites, displayedVehicles]);

  /* ================= UI ================= */
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        backgroundColor: isDarkMode ? "#0f172a" : "#fff",
      }}
    >
      {selectedVehicle && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 1100,
              width: "30%",
              minWidth: 260,
              maxWidth: "90vw",
              height: "100%",
              overflow: "visible",
              transform: panelOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.8s ease",
              pointerEvents: panelOpen ? "auto" : "none",
            }}
          >
            <div
              style={{
                height: "100%",
                overflow: "auto",
                borderRadius: 0,
                padding: 20,
                background: isDarkMode ? "rgba(15,23,42,.96)" : "#fff",
                color: isDarkMode ? "#f8fafc" : "#0f172a",
                border: isDarkMode ? "1px solid rgba(148,163,184,.35)" : "1px solid #e5e7eb",
                boxShadow: isDarkMode
                  ? "0 16px 30px rgba(0,0,0,.45)"
                  : "0 12px 24px rgba(15,23,42,.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.7 }}>
                    Vehicle
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {selectedVehicle.vehicle_no}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicle(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 18,
                    cursor: "pointer",
                    color: isDarkMode ? "#f8fafc" : "#0f172a",
                  }}
                  aria-label="Close vehicle details"
                >
                  ×
                </button>
              </div>

          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
              }}
            >
              🚚
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600 }}>Live Vehicle</div>
              <div style={{ opacity: 0.8 }}>{selectedVehicle.location || "Location unavailable"}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5 }}>
            <div>
              <strong>Status:</strong> {selectedVehicle.status}
            </div>
            <div>
              <strong>Driver:</strong> {selectedVehicle.driver || "-"}
            </div>
            <div>
              <strong>Speed:</strong> {selectedVehicle.speed} km/h
            </div>
            <div>
              <strong>Coordinates:</strong> {selectedVehicle.lat.toFixed(5)}, {selectedVehicle.lng.toFixed(5)}
            </div>
            {selectedVehicle.location ? (
              <div>
                <strong>Location:</strong> {selectedVehicle.location}
              </div>
            ) : null}
            {selectedVehicle.updated_at ? (
              <div>
                <strong>Last Updated:</strong> {selectedVehicle.updated_at}
              </div>
            ) : null}
          </div>

            <div
              style={{
                marginTop: 16,
                borderTop: isDarkMode ? "1px solid rgba(148,163,184,.25)" : "1px solid #e5e7eb",
                paddingTop: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setInfoOpen((prev) => !prev)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isDarkMode ? "#f8fafc" : "#0f172a",
                  padding: 0,
                }}
                aria-expanded={infoOpen}
              >
                <span>Vehicle Information</span>
                <span style={{ fontSize: 16 }}>{infoOpen ? "−" : "+"}</span>
              </button>

              {infoOpen && (
                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>
                  <div>
                    <strong>Vehicle No:</strong> {selectedVehicle.vehicle_no}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedVehicle.status}
                  </div>
                  <div>
                    <strong>Driver:</strong> {selectedVehicle.driver || "-"}
                  </div>
                  <div>
                    <strong>Speed:</strong> {selectedVehicle.speed} km/h
                  </div>
                  {selectedVehicle.updated_at ? (
                    <div>
                      <strong>Last Updated:</strong> {selectedVehicle.updated_at}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPanelOpen((prev) => !prev)}
            style={{
              position: "absolute",
              left: panelOpen ? "30%" : 12,
              top: "50%",
              transform: panelOpen ? "translate(-18px, -50%)" : "translate(0, -50%)",
              width: 42,
              height: 64,
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: isDarkMode ? "#f8fafc" : "#0f172a",
              boxShadow: isDarkMode
                ? "0 12px 24px rgba(0,0,0,.35)"
                : "0 10px 20px rgba(15,23,42,.15)",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
              zIndex: 1200,
            }}
            aria-label={panelOpen ? "Collapse vehicle details" : "Expand vehicle details"}
          >
            {panelOpen ? "‹" : "›"}
          </button>
        </>
      )}

      {/* STATUS FILTER */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: isDarkMode ? "rgba(15,23,42,.96)" : "#fff",
          padding: "6px 10px",
          borderRadius: 8,
          display: "flex",
          gap: 10,
          fontSize: 12,
          boxShadow: isDarkMode
            ? "0 10px 30px rgba(0,0,0,.45)"
            : "0 4px 10px rgba(0,0,0,.15)",
          color: isDarkMode ? "#f8fafc" : "#0f172a",
          border: isDarkMode ? "1px solid rgba(148,163,184,.35)" : undefined,
        }}
      >
        {(Object.keys(statusFilter) as VehicleStatus[]).map((s) => (
          <label key={s} style={{ color: STATUS_COLORS[s] }}>
            <input
              type="checkbox"
              checked={statusFilter[s]}
              onChange={() =>
                setStatusFilter((p) => ({ ...p, [s]: !p[s] }))
              }
            />{" "}
            {s}
          </label>
        ))}
      </div>

      {/* MAP */}
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
