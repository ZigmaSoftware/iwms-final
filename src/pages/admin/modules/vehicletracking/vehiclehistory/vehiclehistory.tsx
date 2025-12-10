import { JSX, useCallback, useEffect, useRef, useState } from "react";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./vehiclehistory.css";
import { FiCalendar, FiAlertTriangle } from "react-icons/fi";

type RawRecord = Record<string, any>;
type StatusKey = "running" | "idle" | "stopped" | "no_data";

type VehicleOption = {
  id: string;
  label: string;
  status: StatusKey;
  lat: number;
  lng: number;
};

type TrackPoint = {
  lat: number;
  lng: number;
  speedKmph: number;
  status: string;
  address: string;
  timestamp: string;
};

const TRACKING_API_URL =
  "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM";

const HISTORY_API_BASE =
  import.meta.env.VITE_VEHICLE_HISTORY_API ?? "/vamosys/getVehicleHistory";

const HISTORY_DEFAULT_PARAMS = {
  userId: "BLUEPLANET",
  groupName: "BLUEPLANET:VAM",
  interval: "-1",
} as const;

const FALLBACK_VEHICLES: VehicleOption[] = [
  { id: "UP16KT1737", label: "UP16KT1737", status: "running", lat: 28.63, lng: 77.21 },
  { id: "UP16KT1738", label: "UP16KT1738", status: "idle", lat: 28.71, lng: 77.05 },
  { id: "UP16KT1739", label: "UP16KT1739", status: "stopped", lat: 28.48, lng: 77.01 }
];

const STATUS_META: Record<StatusKey, { label: string; color: string }> = {
  running: { label: "Running", color: "#22c55e" },
  idle: { label: "Idle", color: "#f59e0b" },
  stopped: { label: "Stopped", color: "#2563eb" },
  no_data: { label: "No Data", color: "#f87171" },
};

const pad = (v: number) => String(v).padStart(2, "0");
const formatInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;

function pick(source: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const val = source[key];
    if (val !== null && val !== undefined && String(val).trim()) {
      return String(val).trim();
    }
  }
  return fallback;
}

function pickNum(source: RawRecord, keys: string[]): number | null {
  for (const key of keys) {
    const n = Number(source[key]);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function pickRaw(source: RawRecord, keys: string[]): any {
  for (const k of keys) {
    if (source[k] !== undefined && source[k] !== null && source[k] !== "") {
      return source[k];
    }
  }
  return undefined;
}

const firstArray = (candidates: any[]): any[] => {
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
  }
  return [];
};

const fetchJsonSafe = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const snippet = (await res.text()).slice(0, 160);
    throw new Error(`HTTP ${res.status}: ${snippet}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 160)}`);
  }
};

const HISTORY_TIMESTAMP_KEYS = [
  "deviceTime", "timestamp", "gpsTime", "time", "serverTime",
  "_ts", "date", "dateSec", "lastComunicationTime",
];

function parseTs(value: any): Date | null {
  if (!value) return null;

  if (typeof value === "number") {
    let s = value;
    if (s > 1e12) s = s / 1000;
    return new Date(Math.round(s * 1000));
  }

  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      let s = n;
      if (s > 1e12) s = s / 1000;
      return new Date(Math.round(s * 1000));
    }
    const p = Date.parse(value);
    if (!Number.isNaN(p)) return new Date(p);
  }

  return null;
}

function normalizeHistory(rec: RawRecord[]) {
  const out: any[] = [];

  for (const r of rec) {
    const lat = pickNum(r, ["lat", "latitude", "Latitude"]);
    const lng = pickNum(r, ["lng", "lon", "longitude", "Longitude"]);
    if (lat == null || lng == null) continue;

    const tsVal = pickRaw(r, HISTORY_TIMESTAMP_KEYS);
    const ts = parseTs(tsVal);
    if (!ts) continue;

    const speed = pickNum(r, ["speedKmph", "speed", "speedKMH"]) ?? 0;
    const status = pick(r, ["statusCode", "status", "vehicleStatus", "mode"], "");
    const address = pick(r, ["address", "geoAddress", "location"], "");

    out.push({
      lat,
      lng,
      speedKmph: speed,
      statusCode: status,
      address,
      _ts: ts,
    });
  }

  out.sort((a, b) => a._ts - b._ts);
  return out;
}

export default function VehicleHistory(): JSX.Element {
  const [vehicles, setVehicles] = useState<VehicleOption[]>(FALLBACK_VEHICLES);
  const [vehicleId, setVehicleId] = useState(FALLBACK_VEHICLES[0].id);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [historyError, setHistoryError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  // NEW SPEED STATE
  const [playbackSpeed, setPlaybackSpeed] = useState(2); // default 2x

  const initialTo = new Date();
  const initialFrom = new Date(initialTo.getTime() - 6 * 60 * 60 * 1000);

  const [fromDate, setFromDate] = useState(formatInput(initialFrom));
  const [toDate, setToDate] = useState(formatInput(initialTo));

  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const trackLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(TRACKING_API_URL);
        const body = await res.json();
        const arr = Array.isArray(body) ? body : body.data;

        if (!Array.isArray(arr)) {
          setVehicles(FALLBACK_VEHICLES);
          return;
        }

        const normalized = arr
          .map((r) => {
            const id = pick(r, ["vehicleId", "vehicleNo", "regNo"], "");
            const lat = pickNum(r, ["lat", "latitude"]);
            const lng = pickNum(r, ["lng", "lon"]);
            if (!id || lat == null || lng == null) return null;

            return {
              id,
              label: id,
              lat,
              lng,
              status: "running" as StatusKey,
            };
          })
          .filter(Boolean) as VehicleOption[];

        if (normalized.length) {
          setVehicles(normalized);
          setVehicleId(normalized[0].id);
        }
      } catch {
        setVehicles(FALLBACK_VEHICLES);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [28.61, 77.21],
      zoom: 10,
      zoomControl: true,
    });

    const layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
    layer.addTo(map);

    trackLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryError("");
    setTrack([]);

    if (!vehicleId) {
      setHistoryError("Select a vehicle to load history.");
      return;
    }

    try {
      const fromMs = new Date(fromDate).getTime();
      const toMs = new Date(toDate).getTime();

      if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
        setHistoryError("Invalid date range selected.");
        return;
      }

      if (fromMs >= toMs) {
        setHistoryError("From date must be earlier than To date.");
        return;
      }

      const baseParams = { ...HISTORY_DEFAULT_PARAMS, vehicleId };
      const fromMsStr = Math.floor(fromMs).toString();
      const toMsStr = Math.floor(toMs).toString();
      const fromSecStr = Math.floor(fromMs / 1000).toString();
      const toSecStr = Math.floor(toMs / 1000).toString();

      const strategies = [
        {
          label: "utc-ms",
          params: {
            ...baseParams,
            fromDateUTC: fromMsStr,
            toDateUTC: toMsStr,
          },
        },
        {
          label: "datetime-ms",
          params: {
            ...baseParams,
            fromDateTimeUTC: fromMsStr,
            toDateTimeUTC: toMsStr,
          },
        },
        {
          label: "utc-sec",
          params: {
            ...baseParams,
            fromDateUTC: fromSecStr,
            toDateUTC: toSecStr,
          },
        },
        {
          label: "latest",
          params: {
            ...baseParams,
          },
        },
      ];

      let normalized: any[] = [];
      let lastError = "";

      for (const strat of strategies) {
        const params = new URLSearchParams(strat.params as Record<string, string>);
        const url = `${HISTORY_API_BASE}?${params.toString()}`;
        try {
          const json = await fetchJsonSafe(url);
          const source =
            firstArray([
              json.vehicleLocations,
              json.history4Mobile,
              json.totalRecordList,
              json.data,
              json.track,
              json.records,
              json.locations,
            ]) || [];

          normalized = normalizeHistory(source);
          if (normalized.length) {
            lastError = "";
            break;
          }
          lastError = `No data returned (${strat.label})`;
        } catch (err) {
          lastError = `Strategy ${strat.label} failed: ${
            err instanceof Error ? err.message : String(err)
          }`;
          continue;
        }
      }

      const pts: TrackPoint[] = normalized.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        speedKmph: p.speedKmph,
        status: STATUS_META.running.label,
        address: p.address,
        timestamp: p._ts.toISOString(),
      }));

      setTrack(pts);
      setPlaybackIndex(0);
      setIsPlaying(false);

      if (!pts.length) {
        setHistoryError(lastError || "No history available in this range.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load vehicle history.";
      console.error("History fetch failed:", err);
      setHistoryError(message);
    }
  }, [vehicleId, fromDate, toDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!mapRef.current || !trackLayerRef.current) return;

    const layer = trackLayerRef.current;
    layer.clearLayers();

    if (!track.length) return;

    const coords: LatLngTuple[] = track.map((t) => [t.lat, t.lng]);
    const poly = L.polyline(coords, { color: "#2563eb", weight: 4 });
    poly.addTo(layer);

    mapRef.current.fitBounds(poly.getBounds(), { padding: [40, 40] });

    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker(coords[0]).addTo(layer);
  }, [track]);

  /* SPEED-AWARE PLAYBACK */
  useEffect(() => {
    if (!isPlaying || !track.length) return;

    const interval = 400 / playbackSpeed;

    const id = setInterval(() => {
      setPlaybackIndex((idx) => {
        if (idx >= track.length - 1) {
          setIsPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, interval);

    return () => clearInterval(id);
  }, [isPlaying, track.length, playbackSpeed]);

  useEffect(() => {
    const p = track[playbackIndex];
    if (!p || !markerRef.current) return;

    markerRef.current.setLatLng([p.lat, p.lng]);
    markerRef.current.bindPopup(p.address || "Location");
  }, [playbackIndex]);

  return (
    <div className="vh-container fade-in">
      <div className="vh-filter-bar slide-up">
        <div className="vh-filter-item">
          <label>Vehicle</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="vh-filter-item">
          <label>From</label>
          <input
            type="datetime-local"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="vh-filter-item">
          <label>To</label>
          <input
            type="datetime-local"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button className="vh-go-btn" onClick={fetchHistory}>
          Go
        </button>
      </div>

      <h2 className="vh-title slide-up">
        History for <span>{vehicleId}</span>
      </h2>

      <div className="vh-map-wrapper fade-in" ref={mapDivRef}></div>

      <div className="vh-playback floating">
        <button onClick={() => setIsPlaying((p) => !p)} disabled={!track.length}>
          {isPlaying ? "Pause" : "Play"}
        </button>

        {/* SPEED BUTTONS — 2x / 4x / 8x */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setPlaybackSpeed(2)}
            style={{
              background: playbackSpeed === 2 ? "#059669" : "#1d4ed8",
              padding: "8px 12px",
              borderRadius: "12px",
            }}
          >
            2x
          </button>

          <button
            onClick={() => setPlaybackSpeed(4)}
            style={{
              background: playbackSpeed === 4 ? "#059669" : "#1d4ed8",
              padding: "8px 12px",
              borderRadius: "12px",
            }}
          >
            4x
          </button>

          <button
            onClick={() => setPlaybackSpeed(8)}
            style={{
              background: playbackSpeed === 8 ? "#059669" : "#1d4ed8",
              padding: "8px 12px",
              borderRadius: "12px",
            }}
          >
            8x
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(track.length - 1, 0)}
          value={playbackIndex}
          onChange={(e) => setPlaybackIndex(Number(e.target.value))}
          disabled={!track.length}
        />
      </div>

      {historyError && <div className="vh-error">{historyError}</div>}
    </div>
  );
}
