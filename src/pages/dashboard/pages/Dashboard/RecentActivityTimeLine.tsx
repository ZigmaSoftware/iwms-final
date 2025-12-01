import { DataCard } from "@/components/ui/DataCard";
import type { ActivityData } from "@/types";
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export function RecentActivityTimeline() {
  const activities: ActivityData[] = [
    { id: '1', action: 'Route completed', user: 'Driver #45', timestamp: '10m ago', type: 'success' },
    { id: '2', action: 'Delay reported', user: 'Supervisor', timestamp: '25m ago', type: 'warning' },
    { id: '3', action: 'Weighbridge entry', user: 'Operator #12', timestamp: '1h ago', type: 'info' }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Info className="w-3 h-3 text-blue-500" />;
    }
  };

  return (
    <DataCard title="Recent Activity" compact className="h-[190px]">
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                {getIcon(activity.type)}
              </div>
              {idx < activities.length - 1 && (
                <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {activity.action}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.user} • {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
