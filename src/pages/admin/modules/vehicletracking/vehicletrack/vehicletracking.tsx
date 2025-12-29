import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./vehicletracking.css";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

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
const createVehicleIcon = (status: Status, isFocused: boolean) => {
  const size = isFocused ? 42 : 34;
  const statusClass = status.toLowerCase().replace(" ", "");
  const pulseSize = Math.round(size * 1.2);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="vehicle-icon ${statusClass} ${isFocused ? "focused" : ""}" style="width:${size}px;height:${size}px;">
        ${
          isFocused
            ? `<span class="vehicle-pulse" style="width:${pulseSize}px;height:${pulseSize}px;"></span>`
            : ""
        }
        <span class="vehicle-emoji">🚚</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function VehicleTracking() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [focusedVehicleId, setFocusedVehicleId] = useState("");
  const [filters, setFilters] = useState<Record<Status, boolean>>({
    Running: true,
    Idle: true,
    Parked: true,
    "No Data": true,
  });

  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerLookupRef = useRef<Record<string, L.Marker>>({});
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const statusControlRef = useRef<HTMLDivElement | null>(null);

  const statusLabels = useMemo(
    () => ({
      running: t("dashboard.live_map.status_running"),
      idle: t("dashboard.live_map.status_idle"),
      parked: t("dashboard.live_map.status_parked"),
      no_data: t("dashboard.live_map.status_no_data"),
    }),
    [i18n.language, t],
  );

  const formatStatusLabel = (status: Status) => {
    const key = status.toLowerCase().replace(" ", "_") as keyof typeof statusLabels;
    return statusLabels[key] ?? status;
  };

  const speedUnit = t("dashboard.live_map.units.kmh");

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
          <label class="running"><input type="checkbox" checked /> <span data-status="running">${statusLabels.running}</span></label>
          <label class="idle"><input type="checkbox" checked /> <span data-status="idle">${statusLabels.idle}</span></label>
          <label class="parked"><input type="checkbox" checked /> <span data-status="parked">${statusLabels.parked}</span></label>
          <label class="nodata"><input type="checkbox" checked /> <span data-status="no_data">${statusLabels.no_data}</span></label>
        `;

        L.DomEvent.disableClickPropagation(div);
        statusControlRef.current = div;

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

  useEffect(() => {
    const control = statusControlRef.current;
    if (!control) return;
    Object.entries(statusLabels).forEach(([key, label]) => {
      const span = control.querySelector(`span[data-status="${key}"]`);
      if (span) span.textContent = label;
    });
  }, [statusLabels]);

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
    markerLookupRef.current = {};

    filteredVehicles.forEach((v) => {
      const popupHtml = `
        <div class="vehicle-popup">
          <div class="popup-title">${v.label}</div>
          <div class="popup-row">
            <span class="popup-label">${t("dashboard.live_map.labels.status")}:</span>
            <span class="popup-value">${formatStatusLabel(v.status)}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">${t("dashboard.live_map.labels.speed")}:</span>
            <span class="popup-value">${v.speed.toFixed(1)} ${speedUnit}</span>
          </div>
        </div>
      `;

      const isFocused = v.id === focusedVehicleId;
      const marker = L.marker([v.lat, v.lng], {
        icon: createVehicleIcon(v.status, isFocused),
      })
        .bindPopup(popupHtml, {
          closeButton: true,
          autoPan: true,
          offset: [0, -8],
        })
        .addTo(layerRef.current!);
      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());
      marker.on("click", () => setFocusedVehicleId(v.id));
      markerLookupRef.current[v.id] = marker;
    });
  }, [filteredVehicles, focusedVehicleId, formatStatusLabel, speedUnit, t]);

  /* ================= AUTO FIT ================= */
  useEffect(() => {
    if (!mapRef.current || filteredVehicles.length === 0) return;

    const bounds = L.latLngBounds(
      filteredVehicles.map((v) => [v.lat, v.lng] as [number, number])
    );

    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [filteredVehicles]);

  useEffect(() => {
    if (!mapRef.current || !focusedVehicleId) return;
    const target = filteredVehicles.find((v) => v.id === focusedVehicleId);
    if (!target) return;
    const marker = markerLookupRef.current[focusedVehicleId];
    if (marker) {
      marker.openPopup();
    }
    const currentZoom = mapRef.current.getZoom();
    mapRef.current.setView([target.lat, target.lng], Math.max(currentZoom, 15), {
      animate: true,
    });
  }, [focusedVehicleId, filteredVehicles]);

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
          <div className="carousel-header">
            {t("admin.vehicle_tracking.carousel_title", {
              count: Math.min(filteredVehicles.length, 12),
            })}
          </div>

          <div className="vehicle-search-group">
            <input
              className="vehicle-search"
              placeholder={t("admin.vehicle_tracking.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="vehicle-dropdown"
              value={selectedVehicle}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedVehicle(value);
                setFocusedVehicleId(value);
              }}
            >
              <option value="">{t("admin.vehicle_tracking.all_vehicles")}</option>
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
                <span className="status">{formatStatusLabel(v.status)}</span>
              </div>
              <div className="vehicle-body">
                <p>
                  {t("admin.vehicle_tracking.labels.speed")}: {v.speed} {speedUnit}
                </p>
                <p>
                  {t("admin.vehicle_tracking.labels.ignition")}: {v.ignition}
                </p>
                <p>
                  {t("admin.vehicle_tracking.labels.distance")}: {v.distance.toFixed(1)} km
                </p>
                <p>
                  {t("admin.vehicle_tracking.labels.updated")}: {v.updatedAt}
                </p>
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
