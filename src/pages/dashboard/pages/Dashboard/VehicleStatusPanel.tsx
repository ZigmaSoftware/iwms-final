import { useEffect, useState } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Truck, Gauge, PauseCircle, Square } from "lucide-react";

interface VehicleStats {
  all: number;
  running: number;
  idle: number;
  stopped: number;
  overspeeding: number;
  
}

export function VehicleStatusPanel() {
  const [stats, setStats] = useState<VehicleStats>({
    all: 0,
    running: 0,
    idle: 0,
    stopped: 0,
    overspeeding: 0,
  });

  // ----------- FETCH FUNCTION -----------
  async function loadData() {
    try {
      const res = await fetch(
        "https://api.vamosys.com/mobile/getGrpDataForTrustedClients?providerName=BLUEPLANET&fcode=VAM"
      );
      const data = await res.json();
      console.log(data);

      let running = 0;
      let idle = 0;
      let stopped = 0;
      let overspeeding = 0;

      data.forEach((v: any) => {
        const speed = Number(v.speed || 0);
        const ignition = v.ignitionStatus?.toUpperCase() || "";
        const position = v.position || "";
        const movingTime = Number(v.movingTime || 0);
        const idleTime = Number(v.idleTime || 0);
        const speedLimit = Number(v.overSpeedLimit || 60);

        // Running condition
        if (speed > 0 || position === "M" || movingTime > 0) {
          running++;
          return;
        }

        // Idle condition
        if (speed === 0 && ignition === "ON" && idleTime > 0) {
          idle++;
          return;
        }

        // Stopped condition
        if (speed === 0 && ignition === "OFF") {
          stopped++;
          return;
        }

        // Overspeed
        if (speed > speedLimit) overspeeding++;
      });

      setStats({
        all: data.length,
        running,
        idle,
        stopped,
        overspeeding,
      });
    } catch (err) {
      console.error("Vehicle API fetch failed:", err);
    }
  }

  // ----------- AUTO REFRESH EVERY 1 MINUTE -----------
  useEffect(() => {
    loadData(); // initial load

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval); // cleanup
  }, []);

  const items = [
    {
      label: "All Vehicles",
      value: stats.all,
      icon: Truck,
      bg: "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900",
      color: "text-gray-800 dark:text-gray-200",
      dot: "bg-gray-400",
    },
    {
      label: "Running",
      value: stats.running,
      icon: Gauge,
      bg: "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10",
      color: "text-green-700 dark:text-green-400",
      dot: "bg-green-500",
    },
    {
      label: "Idle",
      value: stats.idle,
      icon: PauseCircle,
      bg: "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10",
      color: "text-yellow-700 dark:text-yellow-400",
      dot: "bg-yellow-500",
    },
    {
      label: "Stopped",
      value: stats.stopped,
      icon: Square,
      bg: "bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10",
      color: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    },
  ];

  return (
    <DataCard title="Vehicle Status" compact className="h-[240px]">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-between p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer ${item.bg}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div className={`text-sm font-semibold ${item.color}`}>
                {item.label}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.dot}`}></div>
              <span className={`text-lg font-bold ${item.color}`}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
