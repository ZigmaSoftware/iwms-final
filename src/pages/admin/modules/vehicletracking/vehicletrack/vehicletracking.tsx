import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./vehicletracking.css";


type RawRecord = Record<string, any>;

type Status = "Running" | "Idle" | "Parked" | "No Data";

type Vehicle = {
  id: string;
  label: string;
  name: string;
  lat: number;
  lng: number;
  speedKmph: number;
  ignition: "ON" | "OFF" | "NA";
  status: Status;
  distanceKm: number | null;
  updatedAt: string;
};

const STATUS_ORDER: readonly Status[] = ["Running", "Idle", "Parked", "No Data"];

const STATUS_COLOR: Record<Status, string> = {
  Running: "#16a34a",
  Idle: "#f59e0b",
  Parked: "#3b82f6",
  "No Data": "#ef4444",
};

const API_URL = "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const createIcon = (color: string) =>
  L.divIcon({
    html: `<div class="truck-marker" style="background:${color}">&#128666;</div>`,
    className: "custom-marker",
    iconSize: [28, 28],
  });

const STATUS_ICON: Record<Status, L.DivIcon> = {
  Running: createIcon(STATUS_COLOR.Running),
  Idle: createIcon(STATUS_COLOR.Idle),
  Parked: createIcon(STATUS_COLOR.Parked),
  "No Data": createIcon(STATUS_COLOR["No Data"]),
};

const pickStr = (source: RawRecord, keys: string[], fallback = ""): string => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null) {
      const str = String(value).trim();
      if (str) return str;
    }
  }
  return fallback;
};

const pickNum = (source: RawRecord, keys: string[], fallback = Number.NaN): number => {
  for (const key of keys) {
    const value = source?.[key];
    if (value === 0 || value === "0") return 0;
    if (value !== undefined && value !== null && value !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return fallback;
};

const normalizeIgnition = (value: string): "ON" | "OFF" | "NA" => {
  const normalized = value.trim().toUpperCase();
  if (["ON", "1", "TRUE", "YES"].includes(normalized)) return "ON";
  if (["OFF", "0", "FALSE", "NO"].includes(normalized)) return "OFF";
  return "NA";
};

const deriveStatus = (speed: number, ignition: "ON" | "OFF" | "NA", raw: RawRecord): Status => {
  const rawStatus = pickStr(raw, ["status", "vehicleStatus", "vehicleMode", "mode"], "").toLowerCase();
  const noData = Number(pickNum(raw, ["noDataStatus"], 0)) === 1;

  if (noData || rawStatus.includes("no data") || rawStatus.includes("nodata")) {
    return "No Data";
  }

  if (speed > 0.5 || rawStatus.includes("run") || rawStatus.includes("move")) {
    return "Running";
  }

  if (ignition === "OFF" || rawStatus.includes("park") || rawStatus.includes("stop")) {
    return "Parked";
  }

  return "Idle";
};

const normalizeVehicle = (record: RawRecord): Vehicle | null => {
  const id = pickStr(record, [
    "vehicleId",
    "vehicle_id",
    "vehicleID",
    "vehicle",
    "vehicle_number",
    "vehicleNo",
    "regNo",
    "shortName",
  ]);

  const lat = pickNum(record, ["lat", "latitude", "Latitude"]);
  const lng = pickNum(record, ["lng", "lon", "longitude", "Longitude"]);

  if (!id || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const speed = pickNum(record, ["speed", "speedKmph", "speedKMH", "maxSpeed"]);
  const ignition = normalizeIgnition(pickStr(record, ["ignitionStatus", "ignition", "ign", "engineStatus"], "NA"));
  const distance = pickNum(record, ["distance", "distanceCovered", "odoDistance", "todayDistance"]);
  const updated =
    pickStr(record, ["updatedTime", "lastSeen", "lastComunicationTime", "date", "timestamp"], "") ||
    new Date().toLocaleString();

  const status = deriveStatus(speed, ignition, record);

  return {
    id,
    label: pickStr(record, ["vehicle_number", "vehicleNo", "regNo", "vehicleId"], id),
    name: pickStr(record, ["vehicle_name", "vehicleName", "description", "vehicleTypeLabel"], "Unknown"),
    lat,
    lng,
    speedKmph: Number.isFinite(speed) ? speed : 0,
    ignition,
    status,
    distanceKm: Number.isFinite(distance) ? distance : null,
    updatedAt: updated,
  };
};

export default function VehicleTracking(): React.ReactElement {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<Record<Status, boolean>>({
    Running: true,
    Idle: true,
    Parked: true,
    "No Data": true,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const previousPositionsRef = useRef<Map<string, L.LatLngTuple>>(new Map());
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = await response.json();
      const payload = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];

      const normalized = payload
        .map((item: RawRecord) => normalizeVehicle(item))
        .filter((item:any): item is Vehicle => Boolean(item));

      setVehicles(normalized);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Vehicle tracking fetch failed:", error);
      setVehicles([]);
      setErrorMsg("Unable to load live tracking data.");
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = window.setInterval(fetchData, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) {
      return;
    }

    const map = L.map(mapDivRef.current).setView([28.476, 77.51], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      markersRef.current.clear();
      previousPositionsRef.current.clear();
      layerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  const filteredVehicles = useMemo(() => vehicles.filter((v) => filters[v.status]), [vehicles, filters]);

  const counts = useMemo(() => {
    const base: Record<Status, number> = {
      Running: 0,
      Idle: 0,
      Parked: 0,
      "No Data": 0,
    };
    vehicles.forEach((v) => {
      base[v.status] += 1;
    });
    return base;
  }, [vehicles]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }

    const activeIds = new Set(filteredVehicles.map((v) => v.id));

    for (const [id, marker] of markersRef.current.entries()) {
      if (!activeIds.has(id)) {
        layer.removeLayer(marker);
        markersRef.current.delete(id);
        previousPositionsRef.current.delete(id);
      }
    }

    const highlightMarker = (marker: L.Marker) => {
      const el = marker.getElement();
      if (!el) return;
      el.classList.add("pulse");
      window.setTimeout(() => el.classList.remove("pulse"), 900);
    };

    filteredVehicles.forEach((vehicle) => {
      const position: L.LatLngTuple = [vehicle.lat, vehicle.lng];
      const popup = `
        <strong>${vehicle.label}</strong><br/>
        ${vehicle.name}<br/>
        Status: ${vehicle.status}<br/>
        Speed: ${vehicle.speedKmph.toFixed(0)} km/h<br/>
        Ignition: ${vehicle.ignition}<br/>
        Distance: ${(vehicle.distanceKm ?? 0).toFixed(1)} km<br/>
        Updated: ${vehicle.updatedAt}
      `;

      const existing = markersRef.current.get(vehicle.id);
      if (existing) {
        const previous = previousPositionsRef.current.get(vehicle.id);
        existing.setLatLng(position);
        existing.setIcon(STATUS_ICON[vehicle.status]);
        existing.setPopupContent(popup);
        if (
          previous &&
          (Math.abs(previous[0] - position[0]) > 0.00005 || Math.abs(previous[1] - position[1]) > 0.00005)
        ) {
          highlightMarker(existing);
        }
      } else {
        const marker = L.marker(position, { icon: STATUS_ICON[vehicle.status], title: vehicle.label }).bindPopup(
          popup
        );
        marker.addTo(layer);
        markersRef.current.set(vehicle.id, marker);
        highlightMarker(marker);
      }

      previousPositionsRef.current.set(vehicle.id, position);
    });

    if (filteredVehicles.length && markersRef.current.size === filteredVehicles.length) {
      try {
        const group = L.featureGroup(Array.from(markersRef.current.values()));
        map.fitBounds(group.getBounds().pad(0.2));
      } catch (err) {
        console.debug("Unable to fit bounds", err);
      }
    }
  }, [filteredVehicles]);

  const toggleFilter = (status: Status) => {
    setFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <div className="dashboard">
      <div id="map" ref={mapDivRef}>
        <div className="filter-bar">
          {STATUS_ORDER.map((status) => (
            <label key={status}>
              <input
                type="checkbox"
                checked={filters[status]}
                onChange={() => toggleFilter(status)}
              />
              <span className={status.toLowerCase().replace(" ", "")}>
                {status} ({counts[status]})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar">
        <div className="vehicle-list">
          {loading && !vehicles.length && (
            <div className="vehicle-card">Loading live vehicles...</div>
          )}
          {errorMsg && (
            <div className="vehicle-card nodata">{errorMsg}</div>
          )}
          {!filteredVehicles.length && !loading && !errorMsg && (
            <div className="vehicle-card nodata">No vehicles for selected filters.</div>
          )}
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`vehicle-card ${vehicle.status.toLowerCase().replace(" ", "")}`}
            >
              <div className="vehicle-header">
                <span>{vehicle.label}</span>
                <span className="status">{vehicle.status}</span>
              </div>
              <div className="vehicle-body">
                <p>{vehicle.name}</p>
                <p>Speed: {vehicle.speedKmph.toFixed(0)} km/h</p>
                <p>
                  Ignition: {" "}
                  <span className={vehicle.ignition === "ON" ? "on" : "off"}>{vehicle.ignition}</span>
                </p>
                <p>Distance: {(vehicle.distanceKm ?? 0).toFixed(1)} km</p>
                <p className="text-xs text-gray-500 mt-1">Updated: {vehicle.updatedAt}</p>
              </div>
            </div>
          ))}
        </div>
        {lastUpdated && (
          <div className="px-3 py-2 text-xs text-gray-500 border-t">Last refreshed at {lastUpdated}</div>
        )}
      </div>
    </div>
  );
}
