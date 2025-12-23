import { useEffect, useMemo, useRef, useState } from "react";
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
      })),
    []
  );

  const filteredBins = useMemo(
    () => bins.filter((b) => priorityFilter[b.priority]),
    [bins, priorityFilter]
  );

  const summary = useMemo(() => {
    return bins.reduce(
      (acc, b) => {
        acc[b.priority] += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [bins]);

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

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
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
                    setPriorityFilter((prev) => ({
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
        bin={selectedBin}
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
      />
    </div>
  );
}

/* ================= SIDE DETAILS PANEL ================= */
function SideDetailsPanel({
  bin,
  open,
  onToggle,
}: {
  bin: Bin | null;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = bin ? BIN_PRIORITY_META[bin.priority] : null;
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

        {bin ? (
          <>
            {/* HEADER */}
            <div className="flex items-center gap-3 border-b p-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: meta?.bg }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={meta?.color}
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6v14" />
                  <path d="M16 6v14" />
                  <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
                </svg>
              </span>

              <div>
                <h3 className="text-sm font-bold">{bin.name}</h3>
                <p className="text-[11px] text-gray-500">
                  {meta?.label}
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3 text-xs">
              <InfoRow label="Fill Level" value={`${bin.fill}%`} />
              <InfoRow label="Latitude" value={bin.lat} />
              <InfoRow label="Longitude" value={bin.lng} />
              <InfoRow label="Area" value={bin.area} />
            </div>
          </>
        ) : (
          <div className="p-3 text-xs text-gray-400">
            Select a bin
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
