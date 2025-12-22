import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BinPriority = "high" | "medium" | "low";

type BinRecord = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  fill: number;
  area: string;
  updatedAt: string;
};

const BIN_DATA: BinRecord[] = [
  { id: "BIN-101", name: "Bin 101", lat: 28.6129, lng: 77.2295, fill: 92, area: "Central Zone", updatedAt: "5 min ago" },
  { id: "BIN-118", name: "Bin 118", lat: 28.6202, lng: 77.2167, fill: 78, area: "Central Zone", updatedAt: "12 min ago" },
  { id: "BIN-130", name: "Bin 130", lat: 28.6059, lng: 77.2402, fill: 64, area: "South Zone", updatedAt: "18 min ago" },
  { id: "BIN-142", name: "Bin 142", lat: 28.5951, lng: 77.2249, fill: 88, area: "South Zone", updatedAt: "9 min ago" },
  { id: "BIN-156", name: "Bin 156", lat: 28.6328, lng: 77.2189, fill: 42, area: "North Zone", updatedAt: "22 min ago" },
  { id: "BIN-171", name: "Bin 171", lat: 28.6404, lng: 77.2321, fill: 55, area: "North Zone", updatedAt: "35 min ago" },
];

const priorityConfig: Record<BinPriority, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "#b91c1c", bg: "rgba(239,68,68,0.15)" },
  medium: { label: "Medium", color: "#b45309", bg: "rgba(245,158,11,0.15)" },
  low: { label: "Low", color: "#15803d", bg: "rgba(34,197,94,0.12)" },
};

const getPriority = (fill: number): BinPriority => {
  if (fill >= 80) return "high";
  if (fill >= 60) return "medium";
  return "low";
};

const createBinIcon = (priority: BinPriority) => {
  const meta = priorityConfig[priority];
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
          background:${meta.color};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 6px 14px rgba(0,0,0,.25);
          border:2px solid #fff;
        "
      >
        <span style="font-size:18px; line-height:1;">🗑️</span>
      </div>
    `,
  });
};

export default function BinMonitoring() {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markerLookupRef = useRef<Record<string, L.Marker>>({});
  const [focusedBin, setFocusedBin] = useState<string | null>(null);
  const [allBinSearch, setAllBinSearch] = useState("");

  const prioritized = useMemo(() => {
    return BIN_DATA.map((bin) => ({
      ...bin,
      priority: getPriority(bin.fill),
    })).sort((a, b) => b.fill - a.fill);
  }, []);

  const highPriority = prioritized.filter((bin) => bin.priority === "high");
  const filteredAllBins = useMemo(() => {
    const term = allBinSearch.trim().toLowerCase();
    if (!term) return prioritized;
    return prioritized.filter(
      (bin) =>
        bin.name.toLowerCase().includes(term) ||
        bin.id.toLowerCase().includes(term) ||
        bin.area.toLowerCase().includes(term),
    );
  }, [allBinSearch, prioritized]);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, {
      center: [28.6129, 77.2295],
      zoom: 12,
      zoomControl: false,
    });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const resizeMap = () => map.invalidateSize();
    const raf = window.requestAnimationFrame(resizeMap);
    const timer = window.setTimeout(resizeMap, 400);
    window.addEventListener("resize", resizeMap);
    return () => {
      window.removeEventListener("resize", resizeMap);
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markersRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    markerLookupRef.current = {};
    const bounds: LatLngTuple[] = [];
    prioritized.forEach((bin) => {
      const position: LatLngTuple = [bin.lat, bin.lng];
      bounds.push(position);
      const marker = L.marker(position, {
        icon: createBinIcon(bin.priority),
        title: bin.name,
      });
      marker.bindPopup(
        `<strong>${bin.name}</strong><br/>Fill: ${bin.fill}%<br/>Priority: ${priorityConfig[bin.priority].label}`,
      );
      marker.on("click", () => setFocusedBin(bin.id));
      marker.addTo(layer);
      markerLookupRef.current[bin.id] = marker;
    });
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [prioritized]);

  useEffect(() => {
    if (!focusedBin) return;
    const map = mapRef.current;
    const marker = markerLookupRef.current[focusedBin];
    if (map && marker) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13));
      marker.openPopup();
    }
  }, [focusedBin]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-sky-500">Bin Monitoring</h2>
        <p className="text-muted-foreground">Live bin fill levels and priority alerts</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-[760px] overflow-hidden">
            <CardHeader>
              <CardTitle>Bin Location Map</CardTitle>
              <CardDescription>Track bins with fill-level priorities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[640px] w-full rounded-lg border-2 border-dashed border-border overflow-hidden bg-gradient-to-br from-secondary to-muted">
                <div ref={mapDivRef} className="absolute inset-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Bins</CardTitle>
              <CardDescription>Live fill levels from the map</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] space-y-2 overflow-y-auto pr-1">
              <div>
                <input
                  type="text"
                  value={allBinSearch}
                  onChange={(event) => setAllBinSearch(event.target.value)}
                  placeholder="Search bins..."
                  className="w-full rounded border border-border/70 px-2 py-1 text-xs outline-none focus:border-sky-500"
                />
              </div>
              {filteredAllBins.length ? (
                filteredAllBins.map((bin) => {
                  const meta = priorityConfig[bin.priority];
                  return (
                    <button
                      key={bin.id}
                      type="button"
                      onClick={() => setFocusedBin(bin.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition hover:border-emerald-300"
                    >
                      <div>
                        <p className="text-sm font-semibold">{bin.name}</p>
                        <p className="text-[11px] text-muted-foreground">{bin.area}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold" style={{ color: meta.color }}>
                          {bin.fill}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No matching bins.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Priority Summary</CardTitle>
                <CardDescription>Bins close to full capacity</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                  <p className="text-xs font-semibold uppercase tracking-wide">High Priority</p>
                  <p className="text-2xl font-bold">{highPriority.length}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                  <p className="text-xs font-semibold uppercase tracking-wide">Medium Priority</p>
                  <p className="text-2xl font-bold">
                    {prioritized.filter((bin) => bin.priority === "medium").length}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                  <p className="text-xs font-semibold uppercase tracking-wide">Low Priority</p>
                  <p className="text-2xl font-bold">
                    {prioritized.filter((bin) => bin.priority === "low").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High Priority Bins</CardTitle>
                <CardDescription>Almost full bins to service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {highPriority.length ? (
                  highPriority.map((bin) => {
                    const meta = priorityConfig[bin.priority];
                    return (
                      <button
                        key={bin.id}
                        type="button"
                        onClick={() => setFocusedBin(bin.id)}
                        className="w-full rounded-lg border border-border px-3 py-3 text-left transition hover:border-emerald-300"
                        style={{ background: meta.bg }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{bin.name}</p>
                            <p className="text-xs text-muted-foreground">{bin.area}</p>
                          </div>
                          <span className="text-sm font-semibold" style={{ color: meta.color }}>
                            {bin.fill}%
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Updated {bin.updatedAt}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No high priority bins right now.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
