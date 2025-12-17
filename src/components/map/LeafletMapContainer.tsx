import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

/* ================= API ================= */
const VEHICLE_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const GEOFENCE_API_URL =
  "https://api.vamosys.com/v2/viewSiteV2?userId=BLUEPLANET";

/* ================= TYPES ================= */
type VehicleStatus = "Running" | "Idle" | "Parked" | "No Data";

interface VehicleData {
  vehicle_no: string;
  lat: number;
  lng: number;
  speed: number;
  status: VehicleStatus;
  driver: string;
  updated_at: string;
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

/* ================= COMPONENT ================= */
export function LeafletMapContainer() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const vehicleLayerRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [geofenceSites, setGeofenceSites] = useState<GeofenceSite[]>([]);

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
      const res = await fetch(VEHICLE_API_URL);
      const json = await res.json();

      const list = Array.isArray(json) ? json : [];

      const normalized: VehicleData[] = list
        .map((v: any) => {
          const lat = parseFloat(v.lat ?? v.latitude);
          const lng = parseFloat(v.lng ?? v.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

          let status: VehicleStatus = "No Data";
          if (v.ignitionStatus === "ON") status = "Running";
          else if (v.ignitionStatus === "OFF") status = "Parked";
          else if (v.speed > 0) status = "Idle";

          return {
            vehicle_no: v.regNo || "UNKNOWN",
            lat,
            lng,
            speed: Number(v.speed ?? 0),
            status,
            driver: v.driverName || "-",
            updated_at: v.lastSeen || "",
          };
        })
        .filter(Boolean);

      setVehicles(normalized);
    };

    fetchVehicles();
    const t = setInterval(fetchVehicles, 15000);
    return () => clearInterval(t);
  }, []);

  /* ================= DRAW VEHICLES ================= */
  useEffect(() => {
    if (!vehicleLayerRef.current) return;
    vehicleLayerRef.current.clearLayers();

    vehicles
      .filter((v) => statusFilter[v.status])
      .forEach((v) => {
        L.marker([v.lat, v.lng], {
          icon: getVehicleIcon(v.status),
        })
          .bindPopup(`
            <strong>${v.vehicle_no}</strong><br/>
            Driver: ${v.driver}<br/>
            Status: ${v.status}<br/>
            Speed: ${v.speed} km/h
          `)
          .addTo(vehicleLayerRef.current!);
      });
  }, [vehicles, statusFilter]);

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

    vehicles.forEach((v) => bounds.push([v.lat, v.lng]));

    if (bounds.length) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [geofenceSites, vehicles]);

  /* ================= UI ================= */
  return (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      {/* STATUS FILTER */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "#fff",
          padding: "6px 10px",
          borderRadius: 8,
          display: "flex",
          gap: 10,
          fontSize: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,.15)",
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
