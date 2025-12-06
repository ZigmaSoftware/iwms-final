import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  TrendingUp,
  Calendar,
  Download,
  Home,
  Droplets,
  Recycle,
  BarChart3,
  MapPin,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ApiWasteRow = {
  date?: string;
  dry_weight?: number;
  wet_weight?: number;
  mix_weight?: number;
  total_net_weight?: number;
  no_of_household?: number;
};

type DailyRow = {
  date: string;
  zone: string;
  wet: number;
  dry: number;
  total: number;
  target: number;
  households: number;
};

type MonthlyStat = {
  month: string;
  wet: number;
  dry: number;
  total: number;
  avgDaily: number;
};

const FALLBACK_DAILY_DATA: DailyRow[] = [
  {
    date: "2025-10-15",
    zone: "Zone A",
    wet: 8.5,
    dry: 5.2,
    total: 13.7,
    target: 15.0,
    households: 1200,
  },
];

const FALLBACK_MONTHLY_STATS: MonthlyStat[] = [
  { month: "October 2025", wet: 245, dry: 156, total: 401, avgDaily: 13.4 },
];

const WEIGHMENT_API_URL =
  "https://zigma.in/d2d/folders/waste_collected_summary_report/waste_collected_data_api.php";
const WEIGHMENT_API_KEY = "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";
const FALLBACK_FROM_DATE = "2025-10-01";

const toTons = (value: number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Number((num / 1000).toFixed(2));
};

const formatMonthLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Current Month";
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

export default function WasteCollection() {
  const [dailyData, setDailyData] = useState<DailyRow[]>(FALLBACK_DAILY_DATA);
  const [monthlyStats, setMonthlyStats] =
    useState<MonthlyStat[]>(FALLBACK_MONTHLY_STATS);

  useEffect(() => {
    const today = new Date();
    const monthValue = today.toISOString().slice(0, 7);
    const primaryFromDate = `${monthValue}-01`;

    const fetchWasteData = async (fromDate: string) => {
      const params = new URLSearchParams({
        from_date: fromDate,
        key: WEIGHMENT_API_KEY,
      });
      try {
        const response = await fetch(
          `${WEIGHMENT_API_URL}?${params.toString()}`
        );
        if (!response.ok)
          throw new Error(`Weighment API error (${response.status})`);
        const data = await response.json();

        const rows: ApiWasteRow[] = Array.isArray(data?.data)
          ? data.data
          : [];
        if (!rows.length) return false;

        const formattedDaily: DailyRow[] = rows
          .map((row) => {
            const wet = toTons(row.wet_weight);
            const dry = toTons(row.dry_weight);
            const mix = toTons(row.mix_weight);
            const total = row.total_net_weight
              ? toTons(row.total_net_weight)
              : wet + dry + mix;
            const target =
              total > 0 ? Number((total * 1.05).toFixed(2)) : 0;

            return {
              date: row.date ?? "",
              zone: data?.site ?? "All Zones",
              wet,
              dry,
              total,
              target,
              households: Number(row.no_of_household ?? 0),
            };
          })
          .filter((row) => row.date)
          .sort(
            (a, b) =>
              new Date(b.date).getTime() -
              new Date(a.date).getTime()
          );

        if (formattedDaily.length) {
          setDailyData(formattedDaily);
        }

        const totals = rows.reduce(
          (acc, row) => {
            acc.wet += Number(row.wet_weight ?? 0);
            acc.dry += Number(row.dry_weight ?? 0);
            acc.total += Number(row.total_net_weight ?? 0);
            return acc;
          },
          { wet: 0, dry: 0, total: 0 }
        );

        const activeDays =
          rows.filter(
            (row) => Number(row.total_net_weight ?? 0) > 0
          ).length ||
          rows.length ||
          1;

        const monthLabel = formatMonthLabel(fromDate);

        setMonthlyStats([
          {
            month: monthLabel,
            wet: toTons(totals.wet),
            dry: toTons(totals.dry),
            total: toTons(totals.total),
            avgDaily: toTons(totals.total / activeDays),
          },
        ]);

        return true;
      } catch (error) {
        console.error("Waste data fetch failed", error);
        return false;
      }
    };

    const load = async () => {
      const ok = await fetchWasteData(primaryFromDate);
      if (!ok) {
        await fetchWasteData(FALLBACK_FROM_DATE);
      }
    };

    load();
  }, []);

  const latestEntry = useMemo(
    () => (dailyData.length ? dailyData[0] : null),
    [dailyData]
  );

  const monthStat = useMemo(
    () => (monthlyStats.length ? monthlyStats[0] : null),
    [monthlyStats]
  );

  const formatTons = (value: number) => `${value.toFixed(1)} Tons`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Waste Collection Dashboard
            </h2>
            <p className="text-slate-600 mt-2 text-lg">
              Real-time tracking and analytics for waste management
            </p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* KPI GRID */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* TODAY'S COLLECTION */}
          {/* TODAY'S COLLECTION - Pastel Violet */}
<Card className="border-0 bg-gradient-to-br from-[#D8B4FE] to-[#C084FC] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-white/90">
      Today's Collection
    </CardTitle>
    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Trash2 className="h-5 w-5 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {latestEntry ? formatTons(latestEntry.total) : "44.3 Tons"}
    </div>
  </CardContent>
</Card>

{/* WET WASTE – Pastel Mint */}
<Card className="border-0 bg-gradient-to-br from-[#A7F3D0] to-[#6EE7B7] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-white/90">
      Wet Waste
    </CardTitle>
    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Droplets className="h-5 w-5 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {latestEntry ? formatTons(latestEntry.wet) : "27.2 Tons"}
    </div>
  </CardContent>
</Card>

{/* DRY WASTE – Pastel Sky */}
<Card className="border-0 bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-white/90">
      Dry Waste
    </CardTitle>
    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Recycle className="h-5 w-5 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {latestEntry ? formatTons(latestEntry.dry) : "17.1 Tons"}
    </div>
  </CardContent>
</Card>

{/* MONTHLY TOTAL – Pastel Amber */}
<Card className="border-0 bg-gradient-to-br from-[#FDE68A] to-[#FCD34D] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-white/90">
      Monthly Total
    </CardTitle>
    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Calendar className="h-5 w-5 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {monthStat ? formatTons(monthStat.total) : "401 Tons"}
    </div>
  </CardContent>
</Card>

{/* HOUSEHOLDS – Pastel Rose */}
<Card className="border-0 bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4] text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-white/90">
      Households
    </CardTitle>
    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Home className="h-5 w-5 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">
      {latestEntry ? latestEntry.households.toLocaleString() : "0"}
    </div>
  </CardContent>
</Card>

        </div>

        {/* TABS SECTION */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <Tabs defaultValue="daily" className="p-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger 
                value="daily" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Daily Data
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Monthly Summary
              </TabsTrigger>
              <TabsTrigger 
                value="zone"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Zone Analysis
              </TabsTrigger>
            </TabsList>

            {/* DAILY DATA */}
            <TabsContent value="daily" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Daily Collection Records</h3>
                  <p className="text-slate-600">Comprehensive waste collection performance metrics</p>
                </div>
                
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                        <TableHead className="font-bold text-slate-700">Date</TableHead>
                        <TableHead className="font-bold text-slate-700">Zone</TableHead>
                        <TableHead className="font-bold text-slate-700">Households</TableHead>
                        <TableHead className="font-bold text-emerald-700">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4" />
                            Wet (Tons)
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-sky-700">
                          <div className="flex items-center gap-2">
                            <Recycle className="h-4 w-4" />
                            Dry (Tons)
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-indigo-700">
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Total (Tons)
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {dailyData.map((row, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer"
                        >
                          <TableCell className="font-semibold text-slate-800">
                            {new Date(row.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>

                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className="px-3 py-1 text-xs bg-gradient-to-r from-violet-100 to-purple-100 border-violet-300 text-violet-700 font-medium"
                            >
                              {row.zone}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-slate-400" />
                              {row.households.toLocaleString()}
                            </div>
                          </TableCell>

                          <TableCell className="text-emerald-700 font-bold text-base">
                            {row.wet.toFixed(1)}
                          </TableCell>

                          <TableCell className="text-sky-700 font-bold text-base">
                            {row.dry.toFixed(1)}
                          </TableCell>

                          <TableCell className="font-bold text-indigo-700 text-lg">
                            {row.total.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* MONTHLY SUMMARY */}
            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Monthly Summary</h3>
                  <p className="text-slate-600">Aggregated waste collection data by month</p>
                </div>
                
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100">
                        <TableHead className="font-bold text-slate-700">Month</TableHead>
                        <TableHead className="font-bold text-emerald-700">Wet (Tons)</TableHead>
                        <TableHead className="font-bold text-sky-700">Dry (Tons)</TableHead>
                        <TableHead className="font-bold text-indigo-700">Total (Tons)</TableHead>
                        <TableHead className="font-bold text-amber-700">Avg Daily (Tons)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyStats.map((row, index) => (
                        <TableRow 
                          key={index}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all"
                        >
                          <TableCell className="font-semibold text-slate-800">
                            {row.month}
                          </TableCell>
                          <TableCell className="text-emerald-700 font-bold text-base">
                            {row.wet.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-sky-700 font-bold text-base">
                            {row.dry.toFixed(1)}
                          </TableCell>
                          <TableCell className="font-bold text-indigo-700 text-lg">
                            {row.total.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-amber-700 font-bold text-base">
                            {row.avgDaily.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ZONE ANALYSIS */}
            <TabsContent value="zone" className="mt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {["Zone A", "Zone B", "Zone C"].map((zone, idx) => (
                  <Card 
                    key={zone}
                    className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                      idx === 0 ? 'bg-gradient-to-br from-violet-50 to-purple-50' :
                      idx === 1 ? 'bg-gradient-to-br from-emerald-50 to-teal-50' :
                      'bg-gradient-to-br from-amber-50 to-orange-50'
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-800">
                        <MapPin className="h-5 w-5" />
                        {zone}
                      </CardTitle>
                      <CardDescription>Today's performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">
                            Total Collected
                          </span>
                          <span className="font-bold text-slate-800 text-base">13.7 Tons</span>
                        </div>
                        <Progress value={91} className="h-3" />
                        <p className="text-xs text-slate-600 text-right">91% of target</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}