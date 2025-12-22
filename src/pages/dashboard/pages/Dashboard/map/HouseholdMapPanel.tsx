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

export function HouseholdMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [statusFilter, setStatusFilter] = useState<Record<HouseholdStatus, boolean>>({
    collected: true,
    in_progress: true,
    not_collected: true,
  });

  const filteredHouseholds = useMemo(
    () => HOUSEHOLD_POINTS.filter((h) => statusFilter[h.status]),
    [statusFilter]
  );

  const summary = useMemo(() => {
    return HOUSEHOLD_POINTS.reduce(
      (acc, house) => {
        acc[house.status] += 1;
        return acc;
      },
      { collected: 0, in_progress: 0, not_collected: 0 }
    );
  }, []);

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
    filteredHouseholds.forEach((house) => {
      const position: LatLngTuple = [house.lat, house.lng];
      bounds.push(position);
      const marker = L.marker(position, {
        icon: createHouseIcon(house.status),
        title: house.name,
      });
      marker.bindPopup(
        `<strong>${house.name}</strong><br/>Ward: ${house.ward}<br/>Status: ${HOUSEHOLD_STATUS_META[house.status].label}`
      );
      marker.addTo(layer);
    });
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(DEFAULT_CENTER, 13);
    }
  }, [filteredHouseholds]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div ref={mapDivRef} className="absolute inset-0" />
      <div className="absolute left-4 top-4 z-[500] w-56 rounded-xl border border-gray-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
        <p className="text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">
          Household Filters
        </p>
        <div className="mt-2 space-y-2">
          {(Object.keys(statusFilter) as HouseholdStatus[]).map((key) => {
            const meta = HOUSEHOLD_STATUS_META[key];
            return (
              <label
                key={key}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2 py-1 dark:border-gray-700"
                style={{ background: meta.bg }}
              >
                <span
                  className="flex items-center gap-2 text-[11px] font-semibold"
                  style={{ color: meta.color }}
                >
                  <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                  {meta.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                    {summary[key]}
                  </span>
                  <input
                    type="checkbox"
                    checked={statusFilter[key]}
                    onChange={() =>
                      setStatusFilter((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className={`h-3.5 w-3.5 ${
                      key === "collected"
                        ? "accent-emerald-500"
                        : key === "in_progress"
                          ? "accent-amber-500"
                          : "accent-red-500"
                    }`}
                  />
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-200">
        <span className="inline-flex h-3 w-3 items-center justify-center rounded bg-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2 w-2"
          >
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </span>
        Collected
        <span className="inline-flex h-3 w-3 items-center justify-center rounded bg-amber-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2 w-2"
          >
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </span>
        In progress
        <span className="inline-flex h-3 w-3 items-center justify-center rounded bg-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2 w-2"
          >
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </span>
        Not collected
      </div>
    </div>
  );
}
