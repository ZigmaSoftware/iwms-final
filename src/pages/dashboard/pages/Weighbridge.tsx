import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const weighbridgeData = [
  {
    id: 1,
    vehicle: "TRK-008",
    time: "14:23",
    expected: "2.8",
    actual: "3.2",
    difference: "+14%",
    status: "critical",
    zone: "Zone C",
  },
  {
    id: 2,
    vehicle: "TRK-001",
    time: "13:45",
    expected: "2.4",
    actual: "2.5",
    difference: "+4%",
    status: "normal",
    zone: "Zone A",
  },
  {
    id: 3,
    vehicle: "TRK-015",
    time: "13:12",
    expected: "3.1",
    actual: "2.9",
    difference: "-6%",
    status: "warning",
    zone: "Zone B",
  },
  {
    id: 4,
    vehicle: "TRK-022",
    time: "12:38",
    expected: "2.7",
    actual: "2.7",
    difference: "0%",
    status: "normal",
    zone: "Zone D",
  },
  {
    id: 5,
    vehicle: "TRK-019",
    time: "11:56",
    expected: "2.2",
    actual: "2.8",
    difference: "+27%",
    status: "critical",
    zone: "Zone E",
  },
  {
    id: 6,
    vehicle: "TRK-012",
    time: "11:23",
    expected: "3.0",
    actual: "2.9",
    difference: "-3%",
    status: "normal",
    zone: "Zone A",
  },
];

const statusStyles = {
  normal: {
    badge: "border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-200 dark:bg-emerald-950/30",
    difference: "text-emerald-600 dark:text-emerald-200",
    row: "",
    button: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-950/40",
  },
  warning: {
    badge: "border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-500/40 dark:text-amber-200 dark:bg-amber-950/30",
    difference: "text-amber-600 dark:text-amber-200",
    row: "bg-amber-50/30 dark:bg-amber-950/10",
    button: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-200 dark:hover:bg-amber-950/40",
  },
  critical: {
    badge: "border-rose-300 text-rose-600 bg-rose-50 dark:border-rose-500/50 dark:text-rose-200 dark:bg-rose-950/30",
    difference: "text-rose-600 dark:text-rose-200",
    row: "bg-rose-50/50 dark:bg-rose-950/20",
    button: "border-rose-300 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 dark:border-rose-500/50 dark:text-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
  },
} as const;

const toleranceBlocks = [
  {
    label: "Normal Tolerance",
    value: "±5%",
    description: "No alerts generated",
    accent: "from-emerald-200/70 via-emerald-300/80 to-emerald-500/70 dark:from-emerald-500/30 dark:via-emerald-600/30 dark:to-emerald-400/20",
    background: "from-white via-emerald-50 to-emerald-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900",
    textColor: "text-emerald-600 dark:text-emerald-200",
  },
  {
    label: "Warning Threshold",
    value: "±10%",
    description: "Requires verification",
    accent: "from-amber-200/70 via-amber-300/80 to-amber-500/70 dark:from-amber-600/40 dark:via-amber-500/30 dark:to-amber-400/20",
    background: "from-white via-amber-50 to-amber-100 dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-900",
    textColor: "text-amber-600 dark:text-amber-200",
  },
  {
    label: "Critical Threshold",
    value: ">10%",
    description: "Immediate investigation",
    accent: "from-rose-200/70 via-rose-300/80 to-rose-500/70 dark:from-rose-700/40 dark:via-rose-600/30 dark:to-rose-500/20",
    background: "from-white via-rose-50 to-rose-100 dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-900",
    textColor: "text-rose-600 dark:text-rose-200",
  },
];

export default function Weighbridge() {
  const criticalCount = weighbridgeData.filter((d) => d.status === "critical").length;
  const warningCount = weighbridgeData.filter((d) => d.status === "warning").length;
  const normalCount = weighbridgeData.filter((d) => d.status === "normal").length;

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const pageBgClass = cn(
    "min-h-screen p-6 transition-colors duration-300",
    isDarkMode
      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-slate-100"
      : "bg-white text-slate-900"
  );

  const heroPanelClass = cn(
    "flex flex-wrap gap-4 items-center justify-between rounded-2xl p-6 border shadow-sm",
    isDarkMode
      ? "bg-slate-900/80 backdrop-blur border-slate-800"
      : "bg-gradient-to-r from-white via-sky-50 to-slate-100 backdrop-blur border-slate-200"
  );

  const surfaceCardClass = cn(
    "relative overflow-hidden rounded-2xl border backdrop-blur transition-all duration-500",
    isDarkMode
      ? "bg-slate-900/70 border-slate-800 shadow-2xl shadow-black/30"
      : "bg-white/90 border-slate-200 shadow-lg"
  );

  const headerButtonClass = "gap-2 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white border-0";
  const tableHeadRowClass = cn(
    "text-xs font-semibold uppercase tracking-wide",
    isDarkMode ? "bg-slate-900/60 text-slate-200" : "bg-slate-50 text-slate-600"
  );
  const tableRowHoverClass = isDarkMode ? "hover:bg-slate-900/50" : "hover:bg-slate-50";

  const statCards = [
    {
      label: "Total Entries Today",
      value: weighbridgeData.length,
      subtext: "Records logged",
      Icon: Scale,
      gradient: "bg-gradient-to-br from-white via-sky-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-900",
      accent: "from-sky-300/80 via-blue-400/80 to-indigo-400/80 dark:from-sky-500/70 dark:via-blue-500/70 dark:to-indigo-400/70",
      border: "border-sky-200/80 dark:border-sky-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-sky-600 dark:text-sky-200",
    },
    {
      label: "Within Tolerance",
      value: normalCount,
      subtext: "Stable weighments",
      Icon: CheckCircle,
      gradient: "bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900",
      accent: "from-emerald-200/70 via-emerald-300/70 to-emerald-500/70 dark:from-emerald-500/40 dark:via-emerald-600/40 dark:to-emerald-400/30",
      border: "border-emerald-200/80 dark:border-emerald-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-emerald-600 dark:text-emerald-200",
    },
    {
      label: "Minor Deviations",
      value: warningCount,
      subtext: "Needs manual check",
      Icon: Clock,
      gradient: "bg-gradient-to-br from-white via-amber-50 to-amber-100 dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-900",
      accent: "from-amber-200/70 via-amber-300/80 to-amber-500/70 dark:from-amber-600/40 dark:via-amber-500/40 dark:to-amber-400/30",
      border: "border-amber-200/80 dark:border-amber-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-amber-600 dark:text-amber-200",
    },
    {
      label: "Critical Mismatch",
      value: criticalCount,
      subtext: "Immediate follow-up",
      Icon: AlertTriangle,
      gradient: "bg-gradient-to-br from-white via-rose-50 to-rose-100 dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-900",
      accent: "from-rose-200/80 via-rose-300/80 to-rose-500/70 dark:from-rose-600/40 dark:via-rose-500/40 dark:to-rose-400/30",
      border: "border-rose-200/80 dark:border-rose-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-rose-600 dark:text-rose-200",
    },
  ];

  return (
    <div className={pageBgClass}>
      <div className="space-y-6 h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-10">
        <div className={heroPanelClass}>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Weighbridge Log
            </h2>
            <p className="text-muted-foreground">
              Real-time weight tracking and discrepancy monitoring
            </p>
          </div>
          <Button className={headerButtonClass}>
            <Download className="h-4 w-4" />
            Export Log
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.Icon;
            return (
              <Card
                key={card.label}
                className={cn(
                  surfaceCardClass,
                  card.gradient,
                  card.border,
                  "text-slate-900 dark:text-slate-100 hover:-translate-y-1"
                )}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="card-shimmer absolute -right-10 top-10 h-24 w-24 rounded-full bg-white/40 dark:bg-white/5 blur-3xl" />
                </div>
                <CardContent className="relative pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{card.label}</p>
                      <p className="text-4xl font-bold mt-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.subtext}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl shadow-inner", card.iconBg)}>
                      <Icon className={cn("h-6 w-6", card.iconColor)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className={cn(surfaceCardClass, "overflow-hidden")}>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-semibold">Weight Entries Log</CardTitle>
            <CardDescription>
              Real-time weighbridge integration with automatic discrepancy detection
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={cn("rounded-xl border overflow-hidden", isDarkMode ? "border-slate-800" : "border-slate-100")}>
              <Table>
                <TableHeader>
                  <TableRow className={tableHeadRowClass}>
                    <TableHead>Time</TableHead>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Expected Weight</TableHead>
                    <TableHead>Actual Weight</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weighbridgeData.map((entry) => {
                    const styles = statusStyles[entry.status as keyof typeof statusStyles] ?? statusStyles.normal;
                    return (
                      <TableRow
                        key={entry.id}
                        className={cn("text-sm transition-colors", tableRowHoverClass, styles.row)}
                      >
                        <TableCell className="font-medium">{entry.time}</TableCell>
                        <TableCell>{entry.vehicle}</TableCell>
                        <TableCell>{entry.zone}</TableCell>
                        <TableCell>{entry.expected} tons</TableCell>
                        <TableCell className="font-semibold">{entry.actual} tons</TableCell>
                        <TableCell>
                          <span className={cn("font-semibold", styles.difference)}>{entry.difference}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("px-3 py-1 text-xs font-semibold", styles.badge)}>
                            {entry.status === "critical" ? (
                              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            ) : entry.status === "normal" ? (
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 mr-1" />
                            )}
                            {entry.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("px-4 rounded-full border", styles.button)}
                          >
                            {entry.status === "critical" ? "Investigate" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className={surfaceCardClass}>
          <CardHeader className="relative z-10">
            <CardTitle>Tolerance Settings</CardTitle>
            <CardDescription>Current weighbridge tolerance limits and alert thresholds</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-4 md:grid-cols-3">
              {toleranceBlocks.map((block) => (
                <div
                  key={block.label}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border px-4 py-5 text-sm font-medium",
                    "shadow-inner",
                    block.background,
                    "border-white/60 dark:border-white/10"
                  )}
                >
                  <div className="relative space-y-2">
                    <p className="text-muted-foreground">{block.label}</p>
                    <p className={cn("text-3xl font-bold", block.textColor)}>{block.value}</p>
                    <p className="text-xs text-muted-foreground">{block.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
