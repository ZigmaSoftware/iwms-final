import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { VehicleData } from "./VehicleData";

interface LeafletMapContainerProps {
  vehicles: VehicleData[];
  height?: string;
}

export function LeafletMapContainer({
  vehicles,
  height = "100%",
}: LeafletMapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      [11.0168, 76.9558],
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker) mapRef.current?.removeLayer(layer);
    });

    vehicles.forEach((v) => {
      const marker = L.marker([v.lat, v.lng]).addTo(mapRef.current!);
      marker.bindPopup(`
        <strong>${v.vehicle_no}</strong><br/>
        Driver: ${v.driver}<br/>
        Status: ${v.status}<br/>
        Speed: ${v.speed} km/h
      `);
    });
  }, [vehicles]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%", borderRadius: "0.75rem" }}
    />
  );
}
