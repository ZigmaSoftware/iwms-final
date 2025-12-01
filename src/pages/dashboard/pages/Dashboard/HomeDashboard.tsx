import { DataCard } from "@/components/ui/DataCard";
import { LeafletMapContainer } from "@/components/map/LeafletMapContainer";

import { WastePieChart } from "@/components/ui/WastePieChart";
import { AttendanceMonitor } from "@/components/ui/AttendanceMonitor";
import { VehicleStatusPanel } from "./VehicleStatusPanel";
import { ComplaintsPanel } from "./ComplaintsPanel";
import { RecentActivityTimeline } from "./RecentActivityTimeLine";
import { WeighmentSummary } from "@/components/ui/WeighmentSummary";
import { BinStatus } from "./binStatus";
import { CameraStatus } from "./cameraStatus";
import { MapFilters } from "@/components/map/MapFilters";

import { useEffect, useState } from "react";

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
    <div className="min-h-screen overflow-hidden flex flex-col">

      <DataCard className="h-[780px]">

        <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">


          {/* LEFT PANEL */}
          <div className="col-span-3 space-y-3" style={{ maxHeight: "calc(110vh - 180px)" }}>

            <div className="col-span-3 space-y-4 pr-1" style={{ maxHeight: "calc(110vh - 180px)" }}>
              <WastePieChart />
              <AttendanceMonitor />
              <RecentActivityTimeline />
            </div>

          </div>

          {/* CENTER (MAP) PANEL */}
          <div className="col-span-6 flex flex-col gap-3" style={{ height: "calc(110vh - 180px)" }}>

            <div style={{ height: "70%" }}>
              <DataCard className="h-full overflow-y-auto pt-1" title="Vehicle Map">

                <MapFilters
                  filters={filters}
                  onChange={setFilters}
                  zones={zones}
                  wards={wards}
                  vehicles={vehicleNos}
                  onSearch={applyFilters}
                
                />

                <LeafletMapContainer vehicles={[]} height="100%" />
              </DataCard>
            </div>

            <div style={{ height: "25%" }}>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <BinStatus active={84} inactive={16} />
                <CameraStatus active={42} inactive={5} />
                {/* <TotalStatus active={126} inactive={21}/> */}
              </div>

            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-3 space-y-3" style={{ maxHeight: "calc(110vh - 180px)" }}>
            <ComplaintsPanel />
            <WeighmentSummary />
            <VehicleStatusPanel />
          </div>
        </div>
      </DataCard>
    </div>
  );
}
