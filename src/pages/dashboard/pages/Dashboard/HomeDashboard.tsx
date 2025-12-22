import { DataCard } from "@/components/ui/DataCard";
import { LeafletMapContainer } from "@/components/map/LeafletMapContainer";

import { WastePieChart } from "@/components/ui/WastePieChart";
import { AttendanceMonitor } from "@/components/ui/AttendanceMonitor";
import { VehicleStatusPanel } from "./VehicleStatusPanel";
import { ComplaintsPanel } from "./ComplaintsPanel";
import { RecentActivityTimeline } from "./RecentActivityTimeLine";
import { WeighmentSummary } from "@/components/ui/WeighmentSummary";
import { CameraStatus } from "./cameraStatus";
import { MapFilters } from "@/components/map/MapFilters";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";

const mockVehicles = [
  {
    vehicle_no: "TN38AB1234",
    driver: "Ravi",
    lat: 11.0185,
    lng: 76.9552,
    speed: 32,
    status: "Active",
    geo: {
      continent: "Asia",
      country: "India",
      state: "Tamil Nadu",
      district: "Coimbatore",
      zone: "East Zone",
      ward: "Ward 23",
    },
  },
  {
    vehicle_no: "TN37CD5678",
    driver: "Suresh",
    lat: 11.0054,
    lng: 76.9481,
    speed: 0,
    status: "Idle",
    geo: {
      continent: "Asia",
      country: "India",
      state: "Tamil Nadu",
      district: "Coimbatore",
      zone: "West Zone",
      ward: "Ward 45",
    },
  },
];

export function HomeDashboard() {
  const binStats = { active: 84, inactive: 16 };
  const binTotal = binStats.active + binStats.inactive;
  const householdStats = { total: 1200, collected: 980, notCollected: 220 };
  const { encDashboardBins } = getEncryptedRoute();
  const binsPath = `/dashboard/${encDashboardBins}`;

  // ------------------------
  // FILTER STATES
  // ------------------------
  const [filters, setFilters] = useState({
    country: "India",
    state: "Tamil Nadu",
    district: "Coimbatore",
    zone: "All Zones",
    ward: "All Wards",
    vehicle_no: "All Vehicles",
  });

  const [zones] = useState(["All Zones", "East Zone", "West Zone"]);
  const [wards] = useState(["All Wards", "Ward 23", "Ward 45"]);
  const [vehicleNos, setVehicleNos] = useState<string[]>([]);

  // Extract vehicle numbers from mockVehicles
  useEffect(() => {
    setVehicleNos(["All Vehicles", ...mockVehicles.map((v) => v.vehicle_no)]);
  }, []);

  function applyFilters() {
    console.log("Filters applied:", filters);
  }


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
              <DataCard title="Household Status" compact>
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

            <div style={{ height: "80%" }}>
              <DataCard className="h-full overflow-y-auto pt-1" title="Vehicle Map">

                {/* <MapFilters
                  filters={filters}
                  onChange={setFilters}
                  zones={zones}
                  wards={wards}
                  vehicles={vehicleNos}
                  onSearch={applyFilters}
                
                /> */}

                <LeafletMapContainer height="100%" />
              </DataCard>
            </div>

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
