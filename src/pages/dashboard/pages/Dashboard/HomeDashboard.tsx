import { DataCard } from "@/components/ui/DataCard";
import { LeafletMapContainer } from "@/components/map/LeafletMapContainer";

import { WastePieChart } from "@/components/ui/WastePieChart";
import { AttendanceMonitor } from "@/components/ui/AttendanceMonitor";
import { VehicleStatusPanel } from "./VehicleStatusPanel";
import { ComplaintsPanel } from "./ComplaintsPanel";
import { RecentActivityTimeline } from "./RecentActivityTimeLine";
import { WeighmentSummary } from "@/components/ui/WeighmentSummary";
import { CameraStatus } from "./cameraStatus";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Square, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";
import { BinMapPanel } from "./map/BinMapPanel";
import { HouseholdMapPanel } from "./map/HouseholdMapPanel";
import { MapTabs } from "./map/MapTabs";
import { MAP_TABS, type MapTabKey } from "./map/mapUtils";
import { binApi, customerCreationApi, wasteCollectionApi } from "@/helpers/admin";
import { filterActiveCustomers, normalizeCustomerArray } from "@/utils/customerUtils";

export function HomeDashboard() {
  const [binStats, setBinStats] = useState({ active: 0, inactive: 0 });
  const binTotal = binStats.active + binStats.inactive;
  const { encDashboardBins } = getEncryptedRoute();
  const binsPath = `/dashboard/${encDashboardBins}`;
  const [activeMapTab, setActiveMapTab] = useState<MapTabKey>("all");
  const [mapSize, setMapSize] = useState<"mid" | "max">("mid");
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [householdStats, setHouseholdStats] = useState({
    total: 0,
    collected: 0,
    notCollected: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHouseholdStats = async () => {
      try {
        const customerResponse = await customerCreationApi.list();
        const normalized = normalizeCustomerArray(customerResponse);
        const activeCustomers = filterActiveCustomers(normalized);
        const total = activeCustomers.length;

        const today = new Date().toISOString().split("T")[0];
        let collectedIds: string[] = [];
        try {
          const collectionResponse = await wasteCollectionApi.list({
            params: { collection_date: today },
          });
          if (Array.isArray(collectionResponse)) {
            collectedIds = Array.from(
              new Set(
                collectionResponse
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

        const collected = collectedIds.length;
        const notCollected = Math.max(total - collected, 0);
        if (isMounted) {
          setHouseholdStats({ total, collected, notCollected });
        }
      } catch (error) {
        console.error("Failed to fetch household summary:", error);
      }
    };

    fetchHouseholdStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const isBinActive = (bin: any) => {
    const raw = bin?.is_active;
    if (raw === undefined || raw === null) return true;
    if (raw === true || raw === 1 || raw === "1" || raw === "true") return true;
    if (raw === false || raw === 0 || raw === "0" || raw === "false") return false;
    return Boolean(raw);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBinStats = async () => {
      try {
        const data = await binApi.list();
        const bins = Array.isArray(data) ? data : [];
        const active = bins.filter(isBinActive).length;
        const inactive = Math.max(bins.length - active, 0);
        if (isMounted) {
          setBinStats({ active, inactive });
        }
      } catch (error) {
        console.error("Failed to fetch bin summary:", error);
        if (isMounted) {
          setBinStats({ active: 0, inactive: 0 });
        }
      }
    };

    fetchBinStats();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 80);
    return () => window.clearTimeout(timer);
  }, [mapSize]);

  const handleHouseholdViewAll = () => {
    setActiveMapTab("households");
    setMapSize("mid");
    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const isMapMaximized = mapSize === "max";
  const mapContainerHeight = "80%";
  const mapCard = (
    <DataCard
      className={`h-full overflow-hidden flex flex-col ${
        isMapMaximized ? "bg-white dark:bg-white" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Operations Map
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {MAP_TABS.find((tab) => tab.key === activeMapTab)?.summary}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MapTabs activeKey={activeMapTab} onChange={setActiveMapTab} />
          <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setMapSize("mid")}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${
                mapSize === "mid" ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
              aria-label="Default map size"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMapSize("max")}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${
                mapSize === "max" ? "bg-gray-100 dark:bg-gray-800" : ""
              }`}
              aria-label="Maximize map"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeMapTab === "all" && (
          <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <LeafletMapContainer height="100%" />
          </div>
        )}
        {activeMapTab === "bins" && <BinMapPanel />}
        {activeMapTab === "households" && <HouseholdMapPanel />}
      </div>
    </DataCard>
  );

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">

      <DataCard className="h-full overflow-hidden">

        <div className="grid grid-cols-12 gap-3 h-full overflow-hidden">


          {/* LEFT PANEL */}
          <div className="col-span-3 space-y-3 h-full overflow-y-auto pr-1">

            <div className="space-y-4">
              <WastePieChart />
              <AttendanceMonitor />
              <RecentActivityTimeline />
              <DataCard
                title="Household Status"
                compact
                action={
                  <button
                    type="button"
                    onClick={handleHouseholdViewAll}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View all
                  </button>
                }
              >
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-medium">
                  <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <div className="text-blue-700 dark:text-blue-400">Total</div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {householdStats.total}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                    <div className="text-green-700 dark:text-green-400">Collected</div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">
                      {householdStats.collected}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                    <div className="text-red-700 dark:text-red-400">Not Collected</div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-400">
                      {householdStats.notCollected}
                    </div>
                  </div>
                </div>
              </DataCard>
            </div>

          </div>

          {/* CENTER (MAP) PANEL */}
          <div className="col-span-6 flex flex-col gap-3 h-full">

            {isMapMaximized ? (
              <div className="fixed inset-0 z-50 bg-white">
                {mapCard}
              </div>
            ) : (
              <div ref={mapSectionRef} style={{ height: mapContainerHeight }}>
                {mapCard}
              </div>
            )}

            <div style={{ height: "16%" }}>

              <div className="grid gap-3 mt-1 md:grid-cols-2">
                <div className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <h3 className="text-sm font-semibold">Bin Sensors</h3>
                    </div>
                    <Link
                      to={binsPath}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View all
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs font-medium">
                    <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                      <div className="text-green-700 dark:text-green-400">Active</div>
                      <div className="text-lg font-bold text-green-700 dark:text-green-400">
                        {binStats.active}
                      </div>
                    </div>

                    <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                      <div className="text-red-700 dark:text-red-400">Inactive</div>
                      <div className="text-lg font-bold text-red-700 dark:text-red-400">
                        {binStats.inactive}
                      </div>
                    </div>

                    <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                      <div className="text-yellow-700 dark:text-yellow-400">Total</div>
                      <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                        {binTotal}
                      </div>
                    </div>
                  </div>
                </div>

                <CameraStatus active={42} inactive={5} /> 
                {/* <TotalStatus active={126} inactive={21}/>  */}
              </div>

            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-3 space-y-3 h-full overflow-y-auto">
            <ComplaintsPanel />
            <VehicleStatusPanel />
            <WeighmentSummary />
            
          </div>
        </div>
      </DataCard>
    </div>
  );
}
