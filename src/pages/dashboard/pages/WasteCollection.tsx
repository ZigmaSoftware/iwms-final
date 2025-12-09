import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartData } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// shadcn components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// lucide icons
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
  ArrowLeft,
} from "lucide-react";

// ---------------------- API Types ----------------------
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

// ---------------------- Fallback Samples ----------------------
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
const ZONE_WASTE_SUMMARY: Record<
  string,
  { household: number; ewaste: number; medical: number }
> = {
  "Zone A": { household: 120, ewaste: 15, medical: 8 },
  "Zone B": { household: 80, ewaste: 10, medical: 5 },
  "Zone C": { household: 150, ewaste: 12, medical: 7 },
  "Zone X": { household: 60, ewaste: 5, medical: 3 },
  "Zone Y": { household: 90, ewaste: 7, medical: 4 },
};

const FALLBACK_MONTHLY_STATS: MonthlyStat[] = [
  { month: "October 2025", wet: 245, dry: 156, total: 401, avgDaily: 13.4 },
];

const WEIGHMENT_API_URL =
  "https://zigma.in/d2d/folders/waste_collected_summary_report/waste_collected_data_api.php";
const WEIGHMENT_API_KEY = "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

// ---------------------- Utility ----------------------
const toTons = (v: number | undefined | null) =>
  Number(((v ?? 0) / 1000).toFixed(2));

const formatMonthLabel = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "Current Month";
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
};

// ---------------------- Drilldown Dummy Data ----------------------
const CITY_DATA: Record<string, { zones: Record<string, string[]> }> = {
  Delhi: {
    zones: {
      "Zone A": ["Ward 1", "Ward 2", "Ward 3"],
      "Zone B": ["Ward 4", "Ward 5"],
      "Zone C": ["Ward 6", "Ward 7", "Ward 8"],
    },
  },
  Chennai: {
    zones: {
      "Zone X": ["Ward 10", "Ward 11"],
      "Zone Y": ["Ward 12"],
    },
  },
};

const PROPERTY_OPTIONS = {
  All: ["All"],
  Household: ["Apartments", "Residents"],
  Commercial: ["Hospitals", "Theatres", "Shops"],
};

const WASTE_TYPES = [
  {
    type: "Wet Waste",
    icon: <Droplets className="h-5 w-5 text-emerald-600" />,
    value: "12.5 Tons",
  },
  {
    type: "Dry Waste",
    icon: <Recycle className="h-5 w-5 text-sky-600" />,
    value: "6.4 Tons",
  },
  {
    type: "Mixed Waste",
    icon: <Trash2 className="h-5 w-5 text-indigo-600" />,
    value: "4.1 Tons",
  },
];

// ------------------------- MAIN COMPONENT -------------------------
export default function WasteCollection() {
  // Core data states
  const [dailyData, setDailyData] = useState<DailyRow[]>(FALLBACK_DAILY_DATA);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>(
    FALLBACK_MONTHLY_STATS
  );

  // Zone → Ward → Property drilldown states
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zoneDialog, setZoneDialog] = useState(false);

  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [wardDialog, setWardDialog] = useState(false);

  const [propertyDialog, setPropertyDialog] = useState(false);
  const [property, setProperty] =
    useState<keyof typeof PROPERTY_OPTIONS>("All");
  const [subProperty, setSubProperty] = useState("All");

  // ---------------------- Fetch block (same as your old code) ----------------------
  useEffect(() => {
    const today = new Date();
    const monthVal = today.toISOString().slice(0, 7);
    const primaryFromDate = `${monthVal}-01`;

    const load = async () => {
      const ok = await fetchWaste(primaryFromDate);
      if (!ok) await fetchWaste("2025-10-01");
    };

    load();
  }, []);

  const fetchWaste = async (fromDate: string) => {
    try {
      const params = new URLSearchParams({
        from_date: fromDate,
        key: WEIGHMENT_API_KEY,
      });

      const r = await fetch(`${WEIGHMENT_API_URL}?${params}`);
      if (!r.ok) throw new Error("Bad API Response");
      const data = await r.json();

      const rows: ApiWasteRow[] = Array.isArray(data?.data) ? data.data : [];
      if (!rows.length) return false;

      // Daily
      const formatted = rows
        .map((row) => {
          const wet = toTons(row.wet_weight);
          const dry = toTons(row.dry_weight);
          const mix = toTons(row.mix_weight);
          const total = row.total_net_weight
            ? toTons(row.total_net_weight)
            : wet + dry + mix;

          return {
            date: row.date ?? "",
            zone: data?.site ?? "All Zones",
            wet,
            dry,
            total,
            target: Number((total * 1.05).toFixed(2)),
            households: Number(row.no_of_household ?? 0),
          };
        })
        .filter((r) => r.date)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      if (formatted.length) setDailyData(formatted);

      // Monthly
      const totals = rows.reduce(
        (a, r) => {
          a.wet += r.wet_weight ?? 0;
          a.dry += r.dry_weight ?? 0;
          a.total += r.total_net_weight ?? 0;
          return a;
        },
        { wet: 0, dry: 0, total: 0 }
      );

      const actDays =
        rows.filter((r) => Number(r.total_net_weight ?? 0) > 0).length ||
        rows.length ||
        1;

      setMonthlyStats([
        {
          month: formatMonthLabel(fromDate),
          wet: toTons(totals.wet),
          dry: toTons(totals.dry),
          total: toTons(totals.total),
          avgDaily: toTons(totals.total / actDays),
        },
      ]);

      return true;
    } catch {
      return false;
    }
  };

  // Latest KPI hooks
  const latestEntry = useMemo(
    () => (dailyData.length ? dailyData[0] : null),
    [dailyData]
  );
  const monthStat = useMemo(
    () => (monthlyStats.length ? monthlyStats[0] : null),
    [monthlyStats]
  );

  const formatTons = (v: number) => `${v.toFixed(1)} Tons`;
  const getPieChartData = (): ChartData<"pie", number[], string> => {
    // If a zone is selected use its data, otherwise aggregate totals across all zones
    const zoneData = selectedZone
      ? ZONE_WASTE_SUMMARY[selectedZone] || {
          household: 0,
          ewaste: 0,
          medical: 0,
        }
      : Object.values(ZONE_WASTE_SUMMARY).reduce(
          (acc, z) => {
            acc.household += z.household;
            acc.ewaste += z.ewaste;
            acc.medical += z.medical;
            return acc;
          },
          { household: 0, ewaste: 0, medical: 0 }
        );

    return {
      labels: ["Household Waste", "E-Waste", "Medical Waste"],
      datasets: [
        {
          data: [zoneData.household, zoneData.ewaste, zoneData.medical],
          backgroundColor: ["#60A5FA", "#F59E0B", "#EF4444"],
          hoverBackgroundColor: ["#3B82F6", "#D97706", "#DC2626"],
        },
      ],
    };
  };

  // -----------------------------------------------------------------------
  // ---------------------------- RENDER START ------------------------------
  // -----------------------------------------------------------------------
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
          {/* TODAY TOTAL */}
          <Card className="border-0 bg-gradient-to-br from-[#D8B4FE] to-[#C084FC] text-white shadow-md hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm text-white/90">
                Today's Collection
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Trash2 className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestEntry ? formatTons(latestEntry.total) : "44.3 Tons"}
              </div>
            </CardContent>
          </Card>

          {/* WET */}
          <Card className="border-0 bg-gradient-to-br from-[#A7F3D0] to-[#6EE7B7] text-white shadow-md hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm text-white/90">Wet Waste</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Droplets className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestEntry ? formatTons(latestEntry.wet) : "27.2 Tons"}
              </div>
            </CardContent>
          </Card>

          {/* DRY */}
          <Card className="border-0 bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] text-white shadow-md hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm text-white/90">Dry Waste</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Recycle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestEntry ? formatTons(latestEntry.dry) : "17.1 Tons"}
              </div>
            </CardContent>
          </Card>

          {/* MONTHLY */}
          <Card className="border-0 bg-gradient-to-br from-[#FDE68A] to-[#FCD34D] text-white shadow-md hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm text-white/90">
                Monthly Total
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {monthStat ? formatTons(monthStat.total) : "401 Tons"}
              </div>
            </CardContent>
          </Card>

          {/* HOUSEHOLDS */}
          <Card className="border-0 bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4] text-white shadow-md hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm text-white/90">
                Households
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Home className="h-5 w-5" />
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
                className="rounded-lg data-[state=active]:bg-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Daily Data
              </TabsTrigger>

              <TabsTrigger
                value="monthly"
                className="rounded-lg data-[state=active]:bg-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Monthly Summary
              </TabsTrigger>

              <TabsTrigger
                value="zone"
                className="rounded-lg data-[state=active]:bg-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Zone Analysis
              </TabsTrigger>
            </TabsList>

            {/* ---------------- DAILY ---------------- */}
            <TabsContent value="daily" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">
                    Daily Collection Records
                  </h3>
                  <p className="text-slate-600">
                    Comprehensive waste collection performance metrics
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border shadow bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Wet (Tons)</TableHead>
                        <TableHead>Dry (Tons)</TableHead>
                        <TableHead>Total (Tons)</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {dailyData.map((row, index) => (
                        <TableRow key={index} className="hover:bg-indigo-50">
                          <TableCell>
                            {new Date(row.date).toLocaleDateString("en-US")}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">{row.zone}</Badge>
                          </TableCell>

                          <TableCell className="font-bold text-emerald-700">
                            {row.wet.toFixed(1)}
                          </TableCell>

                          <TableCell className="font-bold text-sky-700">
                            {row.dry.toFixed(1)}
                          </TableCell>

                          <TableCell className="font-bold text-indigo-700">
                            {row.total.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ---------------- MONTHLY ---------------- */}
            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Monthly Summary</h3>

                <div className="rounded-xl border shadow bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Month</TableHead>
                        <TableHead>Wet (Tons)</TableHead>
                        <TableHead>Dry (Tons)</TableHead>
                        <TableHead>Total (Tons)</TableHead>
                        <TableHead>Avg Daily</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {monthlyStats.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell>{row.wet.toFixed(1)}</TableCell>
                          <TableCell>{row.dry.toFixed(1)}</TableCell>
                          <TableCell>{row.total.toFixed(1)}</TableCell>
                          <TableCell>{row.avgDaily.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ---------------- ZONE ANALYSIS (NEW FULL UI) ---------------- */}
            <TabsContent value="zone" className="mt-6">
              <div className="space-y-6">
                {/* City Dropdown */}
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold">Zone Analysis</h3>

                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CITY_DATA).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                  {Object.keys(CITY_DATA[selectedCity].zones).map((zone) => (
                    <Card
                      key={zone}
                      onClick={() => {
                        setSelectedZone(zone);
                        setZoneDialog(true);
                      }}
                      className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all bg-indigo-50"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" /> {zone}
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        <div className="flex justify-between">
                          <span>Total Collected</span>
                          <span className="font-bold">13.7 Tons</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* DIALOG 1 — WARDS */}
                <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
                  <DialogContent className="h-[700px] overflow-y-auto lg:max-w-7xl">
                    <DialogHeader>
                      <DialogTitle>
                        <button
                          className="flex items-center gap-2 mb-2 text-sm text-slate-500"
                          onClick={() => setZoneDialog(false)}
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        Zone: {selectedZone}
                      </DialogTitle>
                    </DialogHeader>

                    {/* -------------------- PIE CHART -------------------- */}
                    <div className="bg-white rounded-xl p-4 shadow border mb-6">
                      <h3 className="text-lg font-semibold mb-4 text-center">
                        Total Waste Summary for {selectedZone}
                      </h3>

                      <div className="w-full flex items-center justify-center gap-6">
                        <div className="h-64 w-64">
                          <Pie data={getPieChartData()} />
                        </div>
                      </div>
                      <div className=" items-center justify-center mt-4 flex">
                        <div className="flex justify-between w-48">
                          <span>Total Collected</span>
                          <span className="font-bold">13.7 Tons</span>
                        </div>
                      </div>
                    </div>

                    {/* -------------------- WARD LIST -------------------- */}
                    <div className="space-y-3">
                      {selectedZone &&
                        CITY_DATA[selectedCity].zones[selectedZone].map(
                          (ward) => (
                            <Button
                              key={ward}
                              variant="outline"
                              className="w-full justify-between"
                              onClick={() => {
                                setSelectedWard(ward);
                                setZoneDialog(false);
                                setWardDialog(true);
                              }}
                            >
                              {ward}
                              <Home className="h-4 w-4 text-slate-500" />
                            </Button>
                          )
                        )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* DIALOG 2 — WARD VIEW */}
                <Dialog open={wardDialog} onOpenChange={setWardDialog}>
                  <DialogContent className="h-[700px]  overflow-y-auto lg:max-w-7xl">
                    <DialogHeader>
                      <DialogTitle>
                        <button
                          className="flex items-center gap-2 mb-2 text-sm text-slate-500"
                          onClick={() => {
                            setWardDialog(false);
                            setZoneDialog(true);
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        Ward: {selectedWard}
                      </DialogTitle>
                    </DialogHeader>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setWardDialog(false);
                        setPropertyDialog(true);
                      }}
                    >
                      View Waste Categories
                    </Button>
                  </DialogContent>
                </Dialog>

                {/* DIALOG 3 — PROPERTY → SUBPROPERTY → WASTE TYPES */}
                <Dialog open={propertyDialog} onOpenChange={setPropertyDialog}>
                  <DialogContent className="max-w-lg h-[600px]">
                    <DialogHeader>
                      <DialogTitle>
                        <button
                          className="flex items-center gap-2 mb-2 text-sm text-slate-500"
                          onClick={() => {
                            setPropertyDialog(false);
                            setWardDialog(true);
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        Select Property Type
                      </DialogTitle>
                    </DialogHeader>

                    {/* Property Dropdown */}
                    <Select
                      value={property}
                      onValueChange={(v) =>
                        setProperty(v as keyof typeof PROPERTY_OPTIONS)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Property" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(PROPERTY_OPTIONS) as Array<
                            keyof typeof PROPERTY_OPTIONS
                          >
                        ).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Subproperty Dropdown */}
                    <Select
                      value={subProperty}
                      onValueChange={(v) => setSubProperty(v)}
                    >
                      <SelectTrigger className="mt-4">
                        <SelectValue placeholder="Subproperty" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_OPTIONS[property].map((sp) => (
                          <SelectItem key={sp} value={sp}>
                            {sp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Waste Types */}
                    <div className="mt-6 space-y-4">
                      {WASTE_TYPES.map((w) => (
                        <Card
                          key={w.type}
                          className="border shadow p-3 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {w.icon}
                              <span className="font-semibold">{w.type}</span>
                            </div>
                            <Badge className="text-base">{w.value}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
