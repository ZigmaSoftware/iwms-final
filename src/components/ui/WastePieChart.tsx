import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { DataCard } from "../ui/DataCard";

export function WastePieChart() {
    const COLORS = ["#43A047", "#1E88E5", "#FB8C00"]; // Wet, Dry, Mixed

    const [data, setData] = useState([
        { name: "Wet Waste", value: 0 },
        { name: "Dry Waste", value: 0 },
        { name: "Mixed Waste", value: 0 },
    ]);

    const total = data.reduce((sum, i) => sum + i.value, 0);

    const dummyData = [
        { name: "Wet Waste", value: 52 },
        { name: "Dry Waste", value: 35 },
        { name: "Mixed Waste", value: 20 },
    ];

    // API + FALLBACK
    useEffect(() => {
        async function loadData() {
            console.log("API_CALL");
            try {
                const url =
                    "https://zigma.in/d2d/folders/waste_collected_summary_report/waste_collected_data_api.php?from_date=2025-10-01&key=ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

                const res = await fetch(url);
                const json = await res.json();
                console.log("API_RESPONSE:", json);

                if (!json.status || !json.data || json.data.length === 0) {
                    console.warn("API returned no data → using dummy values");
                    setData(dummyData);
                    return;
                }

                const d = json.data[0];

                const mapped = [
                    { name: "Wet Waste", value: d.wet_weight || dummyData[0].value },
                    { name: "Dry Waste", value: d.dry_weight || dummyData[1].value },
                    { name: "Mixed Waste", value: d.mix_weight || dummyData[2].value },
                ];

                setData(mapped);
            } catch (error) {
                console.error("API_ERROR:", error);
                console.warn("API failed → using dummy data");
                setData(dummyData);
            }
        }

        loadData();
    }, []);

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        const item = payload[0];

        return (
            <div className="relative">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs shadow-lg px-3 py-2 rounded-md">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {item.name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                        {item.value} tons ({((item.value / total) * 100).toFixed(1)}%)
                    </div>
                </div>

                <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 
                                w-0 h-0 border-l-6 border-r-6 border-t-8 
                                border-l-transparent border-r-transparent 
                                border-t-white dark:border-t-gray-800"></div>
            </div>
        );
    };

    return (
        <DataCard title="Daily Waste Collection" compact>
            <div className="w-full h-48 relative flex">

                {/* PIE CHART */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-full h-36 md:h-40">

                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    innerRadius={45}
                                    outerRadius={70}
                                    strokeWidth={0}
                                    paddingAngle={3}
                                >
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i]} />
                                    ))}
                                </Pie>

                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* TOTAL */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                {total}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                Total (tons)
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI RIGHT */}   
                <div className="w-32 flex flex-col justify-center pl-3 gap-2">
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className="p-2 rounded-md border border-gray-200 dark:border-gray-700"
                            style={{
                                backgroundColor:
                                    i === 0 ? "rgba(67,160,71,0.12)" :       // Wet (Green)
                                    i === 1 ? "rgba(30,136,229,0.12)" :       // Dry (Blue)
                                            "rgba(251,140,0,0.12)",          // Mixed (Orange)
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[i] }}
                                ></span>

                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {item.name}
                                </span>
                            </div>

                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">
                                {item.value} tons
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DataCard>
    );
}
