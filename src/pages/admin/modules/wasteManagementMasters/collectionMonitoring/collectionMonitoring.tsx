import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import flatpickr from "flatpickr";
import type { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance";
import { desktopApi } from "@/api";
import "./collectionMonitor.css";
import "flatpickr/dist/flatpickr.min.css";
import {
  filterActiveCustomers,
  normalizeCustomerArray,
} from "@/utils/customerUtils";
import type { CustomerRecord as CustomerRecordBase } from "@/utils/customerUtils";

interface Vehicle {
  id: string;
  number: string;
  lat: number;
  lon: number;
  status: "Running" | "Idle" | "Parked" | "No Data";
  speed: number;
  ignition: boolean;
  location: string;
  distance: number;
  updatedAt: string;
}

type CustomerRecord = CustomerRecordBase & {
  customer_name?: string;
  zone_name?: string;
  ward_name?: string;
  latitude?: string;
  longitude?: string;
  building_no?: string;
  street?: string;
  area?: string;
};

interface CustomerLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  zone?: string;
  ward?: string;
}

const WasteCollectionMonitor: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [zone, setZone] = useState<string>("");
  const [ward, setWard] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const datepickerRef = useRef<HTMLInputElement | null>(null);
  const fpInstance = useRef<FlatpickrInstance | null>(null);

  const [collectedCount, setCollectedCount] = useState<number>(0);
  const [notCollectedCount, setNotCollectedCount] = useState<number>(0);
  const [totalHouseholdCount, setTotalHouseholdCount] = useState<number>(0);
  const [customerLocations, setCustomerLocations] = useState<CustomerLocation[]>([]);
  const [collectedCustomerIds, setCollectedCustomerIds] = useState<string[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);

  const [selectedStatus, setSelectedStatus] = useState<string>("not_collected");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [map, setMap] = useState<L.Map | null>(null);
  const statusOptions = [
    {
      label: "Not Collected",
      value: "not_collected",
      count: notCollectedCount,
      activeBg: "bg-red-100",
      activeText: "text-red-800",
      activeDot: "bg-red-500",
    },
    {
      label: "Collected",
      value: "collected",
      count: collectedCount,
      activeBg: "bg-green-100",
      activeText: "text-green-800",
      activeDot: "bg-green-500",
    },
    {
      label: "Total Household",
      value: "total_household",
      count: totalHouseholdCount,
      activeBg: "bg-blue-100",
      activeText: "text-blue-800",
      activeDot: "bg-blue-500",
    },
  ];

  const collectedCustomerLocations = useMemo(() => {
    const idSet = new Set(collectedCustomerIds);
    return customerLocations.filter((location) => idSet.has(location.id));
  }, [customerLocations, collectedCustomerIds]);

  const notCollectedCustomerLocations = useMemo(() => {
    const idSet = new Set(collectedCustomerIds);
    return customerLocations.filter((location) => !idSet.has(location.id));
  }, [customerLocations, collectedCustomerIds]);

  const zoneOptions = useMemo(() => {
    const zones = Array.from(
      new Set(
        allCustomers
          .map((customer) => customer.zone_name)
          .filter((value) => typeof value === "string" && value.trim())
      )
    ).sort();
    return zones.map((value) => ({ value, label: value }));
  }, [allCustomers]);

  const wardOptions = useMemo(() => {
    const filtered = zone
      ? allCustomers.filter((customer) => customer.zone_name === zone)
      : allCustomers;
    const wards = Array.from(
      new Set(
        filtered
          .map((customer) => customer.ward_name)
          .filter((value) => typeof value === "string" && value.trim())
      )
    ).sort();
    return wards.map((value) => ({ value, label: value }));
  }, [allCustomers, zone]);

  const customerOptions = useMemo(() => {
    const filteredByZone = zone
      ? allCustomers.filter((customer) => customer.zone_name === zone)
      : allCustomers;
    const filteredByWard = ward
      ? filteredByZone.filter((customer) => customer.ward_name === ward)
      : filteredByZone;
    return filteredByWard.map((customer) => ({
      value: String(customer.unique_id ?? customer.id ?? ""),
      label: customer.customer_name,
    }));
  }, [allCustomers, zone, ward]);

  const hasSelectedCustomer = !!customerId;

  const selectedCustomerLocation = useMemo(() => {
    if (!hasSelectedCustomer) return null;
    return customerLocations.find((location) => location.id === customerId) ?? null;
  }, [customerLocations, hasSelectedCustomer, customerId]);

  const selectedCustomerStatusLabel = hasSelectedCustomer
    ? collectedCustomerIds.includes(customerId)
      ? "Collected"
      : "Not Collected"
    : null;

  // Fetch vehicle data from Vamosys
  const fetchVamosysData = async () => {
    try {
      const response = await fetch(
        "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response);
      

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("Raw API data:", data);

      const parsedData: Vehicle[] =
        data?.data?.map((v: any, index: number) => ({
          id: index.toString(),
          number: v.vehicleNumber || "Unknown",
          lat: parseFloat(v.latitude) || 28.61,
          lon: parseFloat(v.longitude) || 77.23,
          status: v.status || "Idle",
          speed: v.speed || 0,
          ignition: v.ignitionStatus === "ON",
          location: v.location || "Unknown Area",
          distance: v.distance || 0,
          updatedAt: v.updatedAt || new Date().toISOString(),
        })) || [];

      setVehicles(parsedData);
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
    }
  };

  

  // Load vehicle data once
  useEffect(() => {
    fetchVamosysData();
  }, []);

  const fetchSummaryCounts = useCallback(async () => {
    let households = 0;
    let customerData: CustomerRecord[] = [];
    const resolveId = (c: any) => String(c?.unique_id ?? c?.id ?? "");

    try {
      const response = await desktopApi.get("customercreations/");
      const normalized = normalizeCustomerArray(response.data) as CustomerRecord[];
      const activeCustomers = filterActiveCustomers(normalized) as CustomerRecord[];
      households = activeCustomers.length;
      customerData = activeCustomers;
    } catch (error) {
      console.error("Failed to fetch household summary:", error);
    }

    const locations = customerData
      .map((customer) => {
        const lat = parseFloat(customer.latitude ?? "");
        const lon = parseFloat(customer.longitude ?? "");
        return {
          id: resolveId(customer),
          name: customer.customer_name ?? "Unknown",
          lat,
          lon,
          address: `${customer.building_no || ""} ${customer.street || ""} ${customer.area || ""}`.trim(),
          zone: customer.zone_name,
          ward: customer.ward_name,
        };
      })
      .filter(
        (loc) =>
          loc.id &&
          !Number.isNaN(loc.lat) &&
          !Number.isNaN(loc.lon) &&
          typeof loc.lat === "number" &&
          typeof loc.lon === "number"
      );

    setCustomerLocations(locations);
    setTotalHouseholdCount(households);
    setAllCustomers(customerData);

    let collectedIds: string[] = [];
    try {
      const params: Record<string, string> = {};
      if (fromDate) {
        params.collection_date = fromDate;
      }
      const response = await desktopApi.get("wastecollections/", { params });
      if (Array.isArray(response.data)) {
        collectedIds = Array.from(
          new Set(
            response.data
              .map((entry: any) =>
                String(
                  entry.customer ??
                  entry.customer_id ??
                  entry.customer_unique_id ??
                  ""
                )
              )
              .filter((id: string) => id.trim())
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch waste collection summary:", error);
    }

    setCollectedCustomerIds(collectedIds);
    setCollectedCount(collectedIds.length);
    setNotCollectedCount(Math.max(households - collectedIds.length, 0));
  }, [fromDate]);

  useEffect(() => {
    fetchSummaryCounts();
  }, [fetchSummaryCounts]);

  useEffect(() => {
    if (!datepickerRef.current) return;
    fpInstance.current = flatpickr(datepickerRef.current, {
      dateFormat: "Y-m-d",
      maxDate: "today",
      defaultDate: new Date(fromDate),
      allowInput: true,
      onChange: (selectedDates) => {
        if (selectedDates.length) {
          setFromDate(
            selectedDates[0].toISOString().split("T")[0]
          );
        }
      },
    });
    return () => {
      fpInstance.current?.destroy();
      fpInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!fpInstance.current) return;
    if (!fromDate) return;
    const targetDate = new Date(`${fromDate}T00:00:00`);
    const current = fpInstance.current.selectedDates[0];
    if (
      !current ||
      current.toISOString().split("T")[0] !== fromDate
    ) {
      fpInstance.current.setDate(targetDate, false);
    }
  }, [fromDate]);

  // Initialize map
  useEffect(() => {
    const leafletMap = L.map("map", { center: [28.6, 77.2], zoom: 8 });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Add truck markers
  useEffect(() => {
    if (!map) return;
    const vehicleLayer = L.layerGroup();

    vehicles.forEach((v) => {
      const color =
        v.status === "Running"
          ? "#66E066"
          : v.status === "Idle"
          ? "#FFB03F"
          : v.status === "Parked"
          ? "#808080"
          : "#999";

      const truckIcon = L.divIcon({
        html: `<div class="truck-marker" style="color:${color}">🚛</div>`,
        iconSize: [28, 28],
        className: "custom-marker",
      });

      L.marker([v.lat, v.lon], { icon: truckIcon })
        .addTo(vehicleLayer)
        .bindPopup(
          `<b>${v.number}</b><br>Status: ${v.status}<br>Speed: ${v.speed} km/h<br>${v.location}`
        );
    });

    vehicleLayer.addTo(map);
    return () => {
      vehicleLayer.remove();
    };
  }, [map, vehicles]);

  useEffect(() => {
    if (!map) return;
    const dataLayer = L.layerGroup();
    const selectedLocations =
      selectedStatus === "collected"
        ? collectedCustomerLocations
        : selectedStatus === "not_collected"
        ? notCollectedCustomerLocations
        : customerLocations;

    const color =
      selectedStatus === "collected"
        ? "#16a34a"
        : selectedStatus === "not_collected"
        ? "#dc2626"
        : "#2563eb";

    selectedLocations.forEach((location) => {
      L.circleMarker([location.lat, location.lon], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2,
      })
        .addTo(dataLayer)
        .bindPopup(
          `<strong>${location.name}</strong><br>${location.address}<br>${location.zone || ""} ${
            location.ward || ""
          }`
        );
    });

    dataLayer.addTo(map);
    return () => {
      dataLayer.remove();
    };
  }, [
    map,
    selectedStatus,
    customerLocations,
    collectedCustomerLocations,
    notCollectedCustomerLocations,
  ]);

  useEffect(() => {
    if (!map) return;
    const highlightLayer = L.layerGroup();

    if (selectedCustomerLocation) {
      const highlightColor =
        selectedCustomerStatusLabel === "Collected" ? "#16a34a" : "#dc2626";

      L.circleMarker([selectedCustomerLocation.lat, selectedCustomerLocation.lon], {
        radius: 10,
        color: highlightColor,
        fillColor: highlightColor,
        fillOpacity: 0.4,
        weight: 2,
      })
        .addTo(highlightLayer)
        .bindPopup(
          `<strong>${selectedCustomerLocation.name}</strong><br>${selectedCustomerLocation.address}`
        )
        .openPopup();

      map.setView([selectedCustomerLocation.lat, selectedCustomerLocation.lon], 15);
    }

    highlightLayer.addTo(map);
    return () => {
      highlightLayer.remove();
    };
  }, [map, selectedCustomerLocation, selectedCustomerStatusLabel]);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h5 className="text-lg font-semibold flex items-center">
            Waste Collection Monitoring
          </h5>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              ref={datepickerRef}
              type="text"
              className="form-input w-full border rounded-md p-2"
              value={fromDate}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <select
              className="form-select w-full border rounded-md p-2"
              value={zone}
              onChange={(e) => {
                setZone(e.target.value);
                setWard("");
                setCustomerId("");
              }}
            >
              <option value="">Select the Zone</option>
              {zoneOptions.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ward</label>
            <select
              className="form-select w-full border rounded-md p-2"
              value={ward}
              onChange={(e) => {
                setWard(e.target.value);
                setCustomerId("");
              }}
            >
              <option value="">Select the Ward</option>
              {wardOptions.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              className="form-select w-full border rounded-md p-2"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select Customer</option>
              {customerOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchSummaryCounts}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Go
            </button>
          </div>
        </div>

        {/* Status Radio Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          {statusOptions.map((status) => {
            const isSelected = selectedStatus === status.value;
            return (
              <label key={status.value} className="control cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={isSelected}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="hidden"
                />
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full transition ${
                    isSelected
                      ? `${status.activeBg} ${status.activeText}`
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span
                    className={`w-4 h-4 mr-2 rounded-full ${
                      isSelected ? status.activeDot : "bg-gray-300"
                    }`}
                  ></span>
                  {status.label} ({status.count})
                </span>
              </label>
            );
          })}
        </div>

        <hr className="my-4" />
        <div id="vehicle_id_text" className="font-semibold text-gray-600 mb-2">
          {customerId ? `Vehicle ID: ${customerId}` : ""}
        </div>

        {/* Map */}
        <div className="map-wrapper">
          <div id="map" style={{ height: "600px", width: "100%" }}></div>
          <div className="map-status-badge">
            {selectedCustomerLocation ? (
              <>
                <span className="map-status-badge__title">
                  {selectedCustomerLocation.name}
                </span>
                <span
                  className={`map-status-pill ${
                    selectedCustomerStatusLabel === "Collected"
                      ? "collected"
                      : "not-collected"
                  }`}
                >
                  {selectedCustomerStatusLabel}
                </span>
              </>
            ) : (
              <span className="map-status-badge__hint">
                Select a customer to view location
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteCollectionMonitor;
