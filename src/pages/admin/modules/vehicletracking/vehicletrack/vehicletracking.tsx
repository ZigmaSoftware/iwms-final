import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./vehicletracking.css";
import { useTheme } from "@/contexts/ThemeContext";

type Status = "Running" | "Idle" | "Parked" | "No Data";

type Vehicle = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: "ON" | "OFF" | "NA";
  status: Status;
  distance: number;
  updatedAt: string;
};

const API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

/* ================= MAP ICON ================= */
const createVehicleIcon = (status: Status) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div class="vehicle-icon ${status
      .toLowerCase()
      .replace(" ", "")}">🚚</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

export default function VehicleTracking() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [filters, setFilters] = useState<Record<Status, boolean>>({
    Running: true,
    Idle: true,
    Parked: true,
    "No Data": true,
  });

  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    const res = await fetch(API_URL);
    const json = await res.json();

    const rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : [];

    const normalized: Vehicle[] = rows
      .map((r: any) => {
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        const speed = Number(r.speedKmph ?? r.speed ?? 0);
        const ignitionRaw = String(
          r.ignitionStatus ?? r.ignition ?? ""
        ).toUpperCase();

        const ignition: "ON" | "OFF" | "NA" =
          ignitionRaw === "ON" || ignitionRaw === "1"
            ? "ON"
            : ignitionRaw === "OFF" || ignitionRaw === "0"
            ? "OFF"
            : "NA";

        let status: Status = "Idle";
        if (Number(r.noDataStatus) === 1) status = "No Data";
        else if (speed > 2) status = "Running";
        else if (ignition === "OFF") status = "Parked";

        return {
          id: r.vehicleNo || r.vehicle_number || r.regNo,
          label: r.vehicleNo || r.vehicle_number || r.regNo,
          lat,
          lng,
          speed,
          ignition,
          status,
          distance: Number(r.distanceCovered ?? r.distance ?? 0),
          updatedAt:
            r.updatedTime ||
            r.lastComunicationTime ||
            new Date().toLocaleString(),
        };
      })
      .filter(Boolean) as Vehicle[];

    setVehicles(normalized);
  };

  /* ================= MAP INIT ================= */
  useEffect(() => {
    fetchData();

    const map = L.map(mapDivRef.current!).setView([28.61, 77.23], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    /* -------- STATUS FILTER (KEEP) -------- */
    const StatusControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create(
          "div",
          "leaflet-control vehicle-status-control"
        );

        div.innerHTML = `
          <label class="running"><input type="checkbox" checked /> Running</label>
          <label class="idle"><input type="checkbox" checked /> Idle</label>
          <label class="parked"><input type="checkbox" checked /> Parked</label>
          <label class="nodata"><input type="checkbox" checked /> No Data</label>
        `;

        L.DomEvent.disableClickPropagation(div);

        const statuses: Status[] = ["Running", "Idle", "Parked", "No Data"];
        div.querySelectorAll("input").forEach((input, i) => {
          input.addEventListener("change", () => {
            setFilters((prev) => ({
              ...prev,
              [statuses[i]]: (input as HTMLInputElement).checked,
            }));
          });
        });

        return div;
      },
    });

    map.addControl(new StatusControl({ position: "topleft" }));

    const timer = setInterval(fetchData, 15000);
    return () => {
      clearInterval(timer);
      map.remove();
    };
  }, []);

  /* ================= FILTER PIPELINE ================= */
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        filters[v.status] &&
        (!selectedVehicle || v.id === selectedVehicle) &&
        v.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, filters, search, selectedVehicle]);

  /* ================= MARKERS + POPUP ================= */
  useEffect(() => {
    if (!layerRef.current || !mapRef.current) return;

    layerRef.current.clearLayers();

    filteredVehicles.forEach((v) => {
      const popupHtml = `
        <div class="vehicle-popup">
          <div class="popup-title">${v.label}</div>
          <div class="popup-row">
            <span class="popup-label">Status:</span>
            <span class="popup-value">${v.status}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Speed:</span>
            <span class="popup-value">${v.speed.toFixed(1)} km/h</span>
          </div>
        </div>
      `;

      L.marker([v.lat, v.lng], {
        icon: createVehicleIcon(v.status),
      })
        .bindPopup(popupHtml, {
          closeButton: true,
          autoPan: true,
          offset: [0, -8],
        })
        .addTo(layerRef.current!);
    });
  }, [filteredVehicles]);

  /* ================= AUTO FIT ================= */
  useEffect(() => {
    if (!mapRef.current || filteredVehicles.length === 0) return;

    const bounds = L.latLngBounds(
      filteredVehicles.map((v) => [v.lat, v.lng] as [number, number])
    );

    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [filteredVehicles]);

  /* ================= SCROLL ================= */
  const scroll = (dir: "left" | "right") => {
    carouselRef.current?.scrollBy({
      left: dir === "left" ? -340 : 340,
      behavior: "smooth",
    });
  };

  /* ================= JSX ================= */
  return (
    <div className={`tracking-page ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="map-wrap">
        <div id="map" ref={mapDivRef} />
      </div>

      <div className="carousel-wrap">
        <div className="carousel-header-row">
          <div className="carousel-header">(12) Vehicles details</div>

          <div className="vehicle-search-group">
            <input
              className="vehicle-search"
              placeholder="Search vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="vehicle-dropdown"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="carousel-btn left" onClick={() => scroll("left")}>
          ‹
        </button>

        <div className="vehicle-carousel" ref={carouselRef}>
          {filteredVehicles.slice(0, 12).map((v) => (
            <div key={v.id} className={`vehicle-card ${v.status.toLowerCase()}`}>
              <div className="vehicle-header">
                <span>{v.label}</span>
                <span className="status">{v.status}</span>
              </div>
              <div className="vehicle-body">
                <p>Speed: {v.speed} km/h</p>
                <p>Ignition: {v.ignition}</p>
                <p>Distance: {v.distance.toFixed(1)} km</p>
                <p>Updated: {v.updatedAt}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-btn right" onClick={() => scroll("right")}>
          ›
        </button>
      </div>
    </div>
  );
}
