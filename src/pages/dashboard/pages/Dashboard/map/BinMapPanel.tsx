import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";

import {
  BIN_POINTS,
  BIN_PRIORITY_META,
  createBinIcon,
  getBinPriority,
  initBaseMap,
  type BinPriority,
} from "./mapUtils";

/* ================= TYPES ================= */
type Bin = (typeof BIN_POINTS)[number] & {
  priority: BinPriority;

  city?: string;
  wardNo?: string;
  installedDate?: string;
  lastCollectedOn?: string;
  binType?: "Dry" | "Wet" | "Mixed";
  capacityKg?: number;
  status?: "Active" | "Inactive" | "Maintenance";
  assignedVehicle?: string;
  supervisor?: string;
};

/* ================= COMPONENT ================= */
export function BinMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  /* ================= FILTER STATE ================= */
  const [priorityFilter, setPriorityFilter] = useState<
    Record<BinPriority, boolean>
  >({
    high: true,
    medium: true,
    low: true,
  });

  /* ================= DATA ================= */
  const bins = useMemo(
    () =>
      BIN_POINTS.map((bin) => ({
        ...bin,
        priority: getBinPriority(bin.fill),

        // demo enrichment (replace with API)
        city: "Coimbatore",
        wardNo: "W-12",
        installedDate: "2024-03-12",
        lastCollectedOn: "2025-01-22 08:30",
        binType: "Mixed",
        capacityKg: 120,
        status: "Active",
        assignedVehicle: "TN-38-AQ-2190",
        supervisor: "Zone Inspector",
      })),
    []
  );

  const filteredBins = useMemo(
    () => bins.filter((b) => priorityFilter[b.priority]),
    [bins, priorityFilter]
  );

  const summary = useMemo(
    () =>
      bins.reduce(
        (acc, b) => {
          acc[b.priority] += 1;
          return acc;
        },
        { high: 0, medium: 0, low: 0 }
      ),
    [bins]
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

    filteredBins.forEach((bin) => {
      const pos: LatLngTuple = [bin.lat, bin.lng];
      bounds.push(pos);

      const marker = L.marker(pos, {
        icon: createBinIcon(bin.priority),
        title: bin.name,
      });

      marker.bindPopup(
        `<strong>${bin.name}</strong><br/>
         Fill: ${bin.fill}%<br/>
         Priority: ${BIN_PRIORITY_META[bin.priority].label}`,
        { closeButton: false, autoClose: false, closeOnClick: false }
      );

      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());

      marker.on("click", (e) => {
        e.originalEvent?.preventDefault();
        setSelectedBin(bin);
        setPanelOpen(true);
      });

      marker.addTo(layer);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  }, [filteredBins]);

  /* ================= UI ================= */
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200">
      <div ref={mapDivRef} className="absolute inset-0" />

      {/* TOP FILTER */}
      <div className="absolute left-1/2 top-3 z-[600] -translate-x-1/2">
        <div className="flex gap-2 rounded-lg border bg-white px-3 py-2 shadow text-xs">
          {(Object.keys(priorityFilter) as BinPriority[]).map((key) => {
            const meta = BIN_PRIORITY_META[key];
            return (
              <label
                key={key}
                className="flex items-center gap-2 rounded-full px-3 py-1 font-semibold cursor-pointer"
                style={{
                  background: meta.bg,
                  color: meta.color,
                  opacity: priorityFilter[key] ? 1 : 0.5,
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
                  checked={priorityFilter[key]}
                  onChange={() =>
                    setPriorityFilter((p) => ({ ...p, [key]: !p[key] }))
                  }
                  className="hidden"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* SIDE PANEL */}
      <BinSideDetailsPanel
        bin={selectedBin}
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}

/* ================= SIDE DETAILS PANEL ================= */
function BinSideDetailsPanel({
  bin,
  open,
  onToggle,
  onClose,
}: {
  bin: Bin | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const meta = bin ? BIN_PRIORITY_META[bin.priority] : null;
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
        {bin ? (
          <>
            {/* HEADER WITH BIG ANIMATED BIN ICON */}
            <div className="flex items-center gap-3 border-b p-3">
              <AnimatedBinIcon
                color={meta?.color}
                bg={meta?.bg}
              />
              <div>
                <h3 className="text-sm font-bold">{bin.name}</h3>
                <p className="text-[11px] text-gray-500">
                  {meta?.label} · {bin.fill}%
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 p-3 text-xs">
              <Section title="Bin Info">
                <InfoRow label="Status" value={bin.status} />
                <InfoRow label="Bin Type" value={bin.binType} />
                <InfoRow label="Capacity (Kg)" value={bin.capacityKg} />
              </Section>

              <Section title="Location">
                <InfoRow label="City" value={bin.city} />
                <InfoRow label="Ward No" value={bin.wardNo} />
                <InfoRow label="Latitude" value={bin.lat} />
                <InfoRow label="Longitude" value={bin.lng} />
              </Section>

              <Section title="Operations">
                <InfoRow label="Last Collected" value={bin.lastCollectedOn} />
                <InfoRow label="Vehicle" value={bin.assignedVehicle} />
                <InfoRow label="Supervisor" value={bin.supervisor} />
              </Section>
            </div>
          </>
        ) : (
          <div className="p-3 text-xs text-gray-400">Select a bin</div>
        )}
      </div>
    </div>
  );
}

/* ================= BIG ANIMATED BIN ICON ================= */
function AnimatedBinIcon({
  color = "#16a34a",
  bg = "#dcfce7",
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
      {/* Icon */}
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
          <path d="M3 6h18" />
          <path d="M8 6v14" />
          <path d="M16 6v14" />
          <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
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
