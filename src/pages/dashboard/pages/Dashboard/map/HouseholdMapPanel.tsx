import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
type Household = (typeof HOUSEHOLD_POINTS)[number] & {
  city?: string;
  zone?: string;
  street?: string;
  ownerName?: string;
  mobile?: string;
  houseType?: "Individual" | "Apartment" | "Commercial";
  occupancy?: "Occupied" | "Vacant";
  lastCollectedOn?: string;
  assignedVehicle?: string;
  beatWorker?: string;
};

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

  /* ================= DATA ================= */
  const households = useMemo(
    () =>
      HOUSEHOLD_POINTS.map((h) => ({
        ...h,
        city: "Coimbatore",
        zone: "North Zone",
        street: "Gandhi Nagar",
        ownerName: "Resident",
        mobile: "9XXXXXXXXX",
        houseType: "Individual",
        occupancy: "Occupied",
        lastCollectedOn: "2025-01-22 09:10",
        assignedVehicle: "TN-38-BR-4482",
        beatWorker: "Sanitation Worker",
      })),
    []
  );

  const filteredHouseholds = useMemo(
    () => households.filter((h) => statusFilter[h.status]),
    [households, statusFilter]
  );

  const summary = useMemo(
    () =>
      households.reduce(
        (acc, h) => {
          acc[h.status] += 1;
          return acc;
        },
        { collected: 0, in_progress: 0, not_collected: 0 }
      ),
    [households]
  );

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

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
    else map.setView(DEFAULT_CENTER, 13);
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
                    setStatusFilter((p) => ({ ...p, [key]: !p[key] }))
                  }
                  className="hidden"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* SIDE PANEL */}
      <HouseholdSideDetailsPanel
        house={selectedHouse}
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}

/* ================= SIDE DETAILS PANEL ================= */
function HouseholdSideDetailsPanel({
  house,
  open,
  onToggle,
  onClose,
}: {
  house: Household | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const statusMeta = house ? HOUSEHOLD_STATUS_META[house.status] : null;
  const WIDTH = 240;

  return (
    <div
      className="absolute left-0 top-0 z-[700] h-full bg-white shadow-xl transition-transform duration-300"
      style={{
        width: WIDTH,
        transform: open ? "translateX(0)" : `translateX(-${WIDTH}px)`,
      }}
    >
      {/* CENTER TOGGLE */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-xs font-bold shadow"
      >
        {open ? "❮" : "❯"}
      </button>

      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full border bg-white px-2 py-1 text-xs font-bold shadow"
      >
        ✕
      </button>

      <div className="h-full overflow-y-auto border-r">
        {house ? (
          <>
            {/* HEADER WITH BIG ANIMATED ICON */}
            <div className="flex items-center gap-3 border-b p-3">
              <AnimatedHouseIcon color={statusMeta?.color} bg={statusMeta?.bg} />
              <div>
                <h3 className="text-sm font-bold">{house.name}</h3>
                <p className="text-[11px] text-gray-500">
                  Ward {house.ward} · {statusMeta?.label}
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 p-3 text-xs">
              <Section title="Household Info">
                <InfoRow label="Owner" value={house.ownerName} />
                <InfoRow label="Mobile" value={house.mobile} />
                <InfoRow label="House Type" value={house.houseType} />
                <InfoRow label="Occupancy" value={house.occupancy} />
              </Section>

              <Section title="Location">
                <InfoRow label="City" value={house.city} />
                <InfoRow label="Zone" value={house.zone} />
                <InfoRow label="Street" value={house.street} />
                <InfoRow label="Latitude" value={house.lat} />
                <InfoRow label="Longitude" value={house.lng} />
              </Section>

              <Section title="Collection">
                <InfoRow label="Last Collected" value={house.lastCollectedOn} />
                <InfoRow label="Vehicle" value={house.assignedVehicle} />
                <InfoRow label="Beat Worker" value={house.beatWorker} />
              </Section>
            </div>
          </>
        ) : (
          <div className="p-3 text-xs text-gray-400">Select a household</div>
        )}
      </div>
    </div>
  );
}

/* ================= BIG ANIMATED HOUSE ICON ================= */
function AnimatedHouseIcon({
  color = "#2563eb",
  bg = "#dbeafe",
}: {
  color?: string;
  bg?: string;
}) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      {/* Pulse ring */}
      <span
        className="absolute inline-flex h-full w-full rounded-full animate-ping"
        style={{ backgroundColor: bg, opacity: 0.6 }}
      />
      {/* Icon container */}
      <span
        className="relative flex h-10 w-10 items-center justify-center rounded-lg animate-[bounce_0.6s_ease-out]"
        style={{ backgroundColor: bg }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="h-6 w-6"
        >
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>
      </span>
    </div>
  );
}

/* ================= HELPERS ================= */
function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value ?? "—"}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase text-gray-500">
        {title}
      </div>
      <div className="space-y-1 rounded-md border bg-gray-50 p-2">
        {children}
      </div>
    </div>
  );
}
