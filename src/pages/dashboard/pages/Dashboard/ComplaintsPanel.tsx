import { useMemo } from 'react';
import { DataCard } from "@/components/ui/DataCard";
import type { ComplaintData } from "@/types";

export function ComplaintsPanel() {
    const complaints: ComplaintData[] = [
        { id: '1', title: 'Missed Collection', status: 'Open', priority: 'High', timestamp: '2h ago', year: '2024' },
        { id: '2', title: 'Vehicle Breakdown', status: 'In Progress', priority: 'High', timestamp: '4h ago', year: '2024' },
        { id: '4', title: 'Equipment Issue', status: 'Resolved', priority: 'Low', timestamp: '1d ago', year: '2025' },
    ];

    // Compute totals
    const summary = useMemo(() => {
        const total = complaints.length;
        const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
        const resolved = complaints.filter((c) => c.status === 'Resolved').length;

        return { total, inProgress, resolved };
    }, [complaints]);

    const CARD_STYLE =
        "flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700";

    return (
        <DataCard title="Grievances" compact>
            <div className="grid grid-cols-3 gap-2 mt-2">

                {/* TOTAL */}
                <div className={`${CARD_STYLE} bg-blue-50 dark:bg-blue-900/20`}>
                <div className="text-[10px] text-gray-600 dark:text-gray-300">
                        Total
                    </div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {summary.total}
                    </div>
                    
                </div>

                {/* IN PROGRESS */}
                <div className={`${CARD_STYLE} bg-yellow-50 dark:bg-yellow-900/20`}>
                <div className="text-[10px] text-gray-600 dark:text-gray-300">
                        In Progress
                    </div>
                    <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                        {summary.inProgress}
                    </div>
                    
                </div>

                {/* RESOLVED */}
                <div className={`${CARD_STYLE} bg-green-50 dark:bg-green-900/20`}>
                 <div className="text-[10px] text-gray-600 dark:text-gray-300">
                        Resolved
                    </div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                        {summary.resolved}
                    </div>
                   
                </div>

            </div>
        </DataCard>
    );
}
