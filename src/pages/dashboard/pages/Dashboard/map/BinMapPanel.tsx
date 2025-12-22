import { useEffect, useMemo, useRef } from "react";
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

export function BinMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const prioritizedBins = useMemo(
    () =>
      BIN_POINTS.map((bin) => ({
        ...bin,
        priority: getBinPriority(bin.fill),
      })),
    []
  );

  const summary = useMemo(() => {
    return prioritizedBins.reduce(
      (acc, bin) => {
        acc[bin.priority] += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [prioritizedBins]);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = initBaseMap(mapDivRef.current);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const resizeMap = () => map.invalidateSize();
    const raf = window.requestAnimationFrame(resizeMap);
    const timer = window.setTimeout(resizeMap, 300);
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
    const bounds: LatLngTuple[] = [];
    prioritizedBins.forEach((bin) => {
      const position: LatLngTuple = [bin.lat, bin.lng];
      bounds.push(position);
      const marker = L.marker(position, {
        icon: createBinIcon(bin.priority),
        title: bin.name,
      });
      marker.bindPopup(
        `<strong>${bin.name}</strong><br/>Fill: ${bin.fill}%<br/>Area: ${bin.area}`
      );
      marker.addTo(layer);
    });
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [prioritizedBins]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div ref={mapDivRef} className="absolute inset-0" />
      <div className="absolute left-4 top-4 z-[500] space-y-2 rounded-xl border border-gray-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
        <div>
          <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">
            Bin Priority
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Live Fill Alerts
          </p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(summary) as BinPriority[]).map((key) => {
            const meta = BIN_PRIORITY_META[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-gray-200 px-2 py-1 text-center dark:border-gray-700"
                style={{ background: meta.bg }}
              >
                <div className="text-[10px]" style={{ color: meta.color }}>
                  {meta.label}
                </div>
                <div className="text-sm font-semibold" style={{ color: meta.color }}>
                  {summary[key]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-200">
        <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
        Low fill
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
        Medium fill
        <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
        High fill
      </div>
    </div>
  );
}
