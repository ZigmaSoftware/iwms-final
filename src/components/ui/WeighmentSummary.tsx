import { DataCard } from "../ui/DataCard";

export function WeighmentSummary() {
  const summary = {
    trips: 128,
    totalTons: 642.5,
    avgTons: (642.5 / 128).toFixed(2),
  };

  return (
    <DataCard title="Weighment Summary" compact>
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-[10px] text-gray-600 dark:text-gray-400">Trips</div>
          <div className="text-lg font-bold text-green-700 dark:text-green-400">
            {summary.trips}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-[10px] text-gray-600 dark:text-gray-400">Total (Tons)</div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
            {summary.totalTons}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="text-[10px] text-gray-600 dark:text-gray-400">Avg Tons/Trip</div>
          <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
            {summary.avgTons}
          </div>
        </div>
      </div>

    </DataCard>
  );
}
