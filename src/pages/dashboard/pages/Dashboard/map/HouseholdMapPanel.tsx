import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";

import {
  createHouseIcon,
  DEFAULT_CENTER,
  HOUSEHOLD_POINTS,
  HOUSEHOLD_STATUS_META,
  initBaseMap,
  type HouseholdStatus,
} from "./mapUtils";

/* ================= TYPES ================= */
type Household = (typeof HOUSEHOLD_POINTS)[number];

/* ================= COMPONENT ================= */
export function HouseholdMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [selectedHouse, setSelectedHouse] = useState<Household | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  /* ================= FILTER STATE ================= */
  const [statusFilter, setStatusFilter] = useState<
    Record<HouseholdStatus, boolean>
  >({
    collected: true,
    in_progress: true,
    not_collected: true,
  });

  /* ================= FILTERED DATA ================= */
  const filteredHouseholds = useMemo(
    () => HOUSEHOLD_POINTS.filter((h) => statusFilter[h.status]),
    [statusFilter]
  );

  const summary = useMemo(() => {
    return HOUSEHOLD_POINTS.reduce(
      (acc, h) => {
        acc[h.status] += 1;
        return acc;
      },
      { collected: 0, in_progress: 0, not_collected: 0 }
    );
  }, []);

  /* ================= MAP INIT ================= */
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = initBaseMap(mapDivRef.current);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resize = () => map.invalidateSize();
    const raf = requestAnimationFrame(resize);
    const timer = setTimeout(resize, 300);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  /* ================= MARKERS ================= */
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds: LatLngTuple[] = [];

    filteredHouseholds.forEach((house) => {
      const pos: LatLngTuple = [house.lat, house.lng];
      bounds.push(pos);

      const marker = L.marker(pos, {
        icon: createHouseIcon(house.status),
        title: house.name,
      });

      marker.bindPopup(
        `<strong>${house.name}</strong><br/>
         Ward: ${house.ward}<br/>
         Status: ${HOUSEHOLD_STATUS_META[house.status].label}`,
        { closeButton: false, autoClose: false, closeOnClick: false }
      );

      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());

      marker.on("click", (e) => {
        e.originalEvent?.preventDefault();
        setSelectedHouse(house);
        setPanelOpen(true);
      });

      marker.addTo(layer);
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(DEFAULT_CENTER, 13);
    }
  }, [filteredHouseholds]);

  /* ================= UI ================= */
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200">
      <div ref={mapDivRef} className="absolute inset-0" />

      {/* TOP FILTER BAR */}
      <div className="absolute left-1/2 top-3 z-[600] -translate-x-1/2">
        <div className="flex gap-2 rounded-lg border bg-white px-3 py-2 shadow text-xs">
          {(Object.keys(statusFilter) as HouseholdStatus[]).map((key) => {
            const meta = HOUSEHOLD_STATUS_META[key];
            return (
              <label
                key={key}
                className="flex items-center gap-2 rounded-full px-3 py-1 font-semibold cursor-pointer"
                style={{
                  background: meta.bg,
                  color: meta.color,
                  opacity: statusFilter[key] ? 1 : 0.5,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.label}
                <span className="ml-1 text-[11px] font-bold">
                  {summary[key]}
                </span>
                <input
                  type="checkbox"
                  checked={statusFilter[key]}
                  onChange={() =>
                    setStatusFilter((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  className="hidden"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* SIDE PANEL */}
      <SideDetailsPanel
        house={selectedHouse}
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
      />
    </div>
  );
}

/* ================= SIDE DETAILS PANEL ================= */
function SideDetailsPanel({
  house,
  open,
  onToggle,
}: {
  house: Household | null;
  open: boolean;
  onToggle: () => void;
}) {
  const statusMeta = house ? HOUSEHOLD_STATUS_META[house.status] : null;
  const WIDTH = 240;

  return (
    <div
      className={`absolute left-0 top-0 z-[700] h-full transition-transform duration-300
        ${open ? "translate-x-0" : `-translate-x-[${WIDTH}px]`}`}
      style={{ width: WIDTH }}
    >
      <div className="relative h-full border-r bg-white shadow-xl">
        {/* TOGGLE */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-bold shadow"
        >
          {open ? "❮" : "❯"}
        </button>

        {house ? (
          <>
            {/* HEADER */}
            <div className="flex items-center gap-3 border-b p-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: statusMeta?.bg }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={statusMeta?.color}
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
                </svg>
              </span>

              <div>
                <h3 className="text-sm font-bold">{house.name}</h3>
                <p className="text-[11px] text-gray-500">
                  Ward {house.ward}
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3 text-xs">
              <InfoRow
                label="Status"
                value={HOUSEHOLD_STATUS_META[house.status].label}
              />
              <InfoRow label="Latitude" value={house.lat} />
              <InfoRow label="Longitude" value={house.lng} />
            </div>
          </>
        ) : (
          <div className="p-3 text-xs text-gray-400">
            Select a house
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */
function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
