import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* =========================================================
   API CONFIG (UNCHANGED)
========================================================= */
const API_BASE =
  "https://zigma.in/d2d/folders/waste_collected_summary_report/test_waste_collected_data_api.php";
const API_KEY = "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

/* =========================================================
   TYPES (UNCHANGED)
========================================================= */
type StatusType = "all" | "normal" | "warning" | "critical";

type WeighbridgeRow = {
  id: number;
  vehicle: string;
  time: string;
  expected: string;
  actual: string;
  difference: string;
  status: "normal" | "warning" | "critical";
  zone: string;
};

/* =========================================================
   STATUS STYLES (UNCHANGED)
========================================================= */
const statusStyles = {
  normal: {
    row: "bg-emerald-50/40 dark:bg-emerald-950/20",
    diff: "text-emerald-600 dark:text-emerald-300",
    badge:
      "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    button:
      "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
  },
  warning: {
    row: "bg-amber-50/40 dark:bg-amber-950/20",
    diff: "text-amber-600 dark:text-amber-300",
    badge:
      "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    button:
      "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40",
  },
  critical: {
    row: "bg-rose-50/40 dark:bg-rose-950/20",
    diff: "text-rose-600 dark:text-rose-300",
    badge:
      "border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    button:
      "border-rose-300 text-rose-600 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40",
  },
} as const;

/* =========================================================
   COMPONENT
========================================================= */
export default function Weighbridge() {
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const today = formatDate(new Date());
  const fallbackAppliedRef = useRef(false);
  const initialLoadRef = useRef(true);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState<WeighbridgeRow[]>([]);
  const [activeStatus, setActiveStatus] = useState<StatusType>("all");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ================= FETCH (UNCHANGED) ================= */
  useEffect(() => {
    const url = `${API_BASE}?action=day_wise_data&from_date=${fromDate}&to_date=${toDate}&key=${API_KEY}`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        const rows = Array.isArray(json.data) ? json.data : [];
        if (!rows.length) {
          setData([]);
          if (
            initialLoadRef.current &&
            !fallbackAppliedRef.current &&
            fromDate === today &&
            toDate === today
          ) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const fallbackDate = formatDate(yesterday);
            fallbackAppliedRef.current = true;
            setFromDate(fallbackDate);
            setToDate(fallbackDate);
          }
          return;
        }

        const EXPECTED = 500;

        const mapped = rows.map((r: any, i: number) => {
          const actualKg = Number(String(r.Net_Wt ?? "0").replace(/,/g, ""));
          const diffPct = ((actualKg - EXPECTED) / EXPECTED) * 100;

          let status: WeighbridgeRow["status"] = "normal";
          if (Math.abs(diffPct) > 10) status = "critical";
          else if (Math.abs(diffPct) > 5) status = "warning";

          return {
            id: i + 1,
            vehicle: r.Vehicle_No ?? "--",
            time: r.Date?.split(" ")[1]?.slice(0, 5) ?? "--",
            zone: r.Zone ?? "Delhi",
            expected: (EXPECTED / 1000).toFixed(1),
            actual: (actualKg / 1000).toFixed(1),
            difference: `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(0)}%`,
            status,
          };
        });

        setData(mapped);
        setPage(1);
        setActiveStatus("all");
      })
      .catch(() => setData([]))
      .finally(() => {
        initialLoadRef.current = false;
      });
  }, [fromDate, toDate]);

  const filtered =
    activeStatus === "all" ? data : data.filter(d => d.status === activeStatus);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  /* ================= RENDER ================= */
  return (
    <div className="p-6 space-y-6 bg-white dark:bg-slate-950 min-h-screen">

      {/* HEADER (UNCHANGED) */}
      <div className="flex items-center justify-between p-6 rounded-2xl border bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 dark:border-slate-800">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            Weighbridge Log
          </h2>
          <p className="text-muted-foreground">
            Real-time weight tracking and discrepancy monitoring
          </p>
        </div>

        <Button
          onClick={() => window.location.reload()}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* STATS — COLOR ADDED HERE ONLY */}
      <div className="grid md:grid-cols-4 gap-4">
        <Stat
          title="Total Entries Today"
          value={data.length}
          icon={Scale}
          active={activeStatus === "all"}
          onClick={() => setActiveStatus("all")}
          gradient="from-white to-blue-100 dark:from-slate-900 dark:to-blue-950/40"
        />
        <Stat
          title="Within Tolerance"
          value={data.filter(d => d.status === "normal").length}
          icon={CheckCircle}
          active={activeStatus === "normal"}
          onClick={() => setActiveStatus("normal")}
          gradient="from-white to-emerald-100 dark:from-slate-900 dark:to-emerald-950/40"
        />
        <Stat
          title="Minor Deviations"
          value={data.filter(d => d.status === "warning").length}
          icon={Clock}
          active={activeStatus === "warning"}
          onClick={() => setActiveStatus("warning")}
          gradient="from-white to-amber-100 dark:from-slate-900 dark:to-amber-950/40"
        />
        <Stat
          title="Critical Mismatch"
          value={data.filter(d => d.status === "critical").length}
          icon={AlertTriangle}
          active={activeStatus === "critical"}
          onClick={() => setActiveStatus("critical")}
          gradient="from-white to-rose-100 dark:from-slate-900 dark:to-rose-950/40"
        />
      </div>

      {/* TABLE (UNCHANGED) */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle>Weight Entries Log</CardTitle>
            <CardDescription>
              Real-time weighbridge integration with automatic discrepancy detection
            </CardDescription>
          </div>

          {/* CALENDAR (UNCHANGED) */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="h-9 rounded-md border bg-white dark:bg-slate-950 dark:border-slate-700 px-3 text-sm"
            />
            <span className="text-sm font-medium dark:text-slate-300">to</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="h-9 rounded-md border bg-white dark:bg-slate-950 dark:border-slate-700 px-3 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 dark:bg-slate-800">
                <TableHead>Time</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageData.map(row => {
                const s = statusStyles[row.status];
                return (
                  <TableRow key={row.id} className={s.row}>
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.vehicle}</TableCell>
                    <TableCell>{row.zone}</TableCell>
                    <TableCell>{row.expected} tons</TableCell>
                    <TableCell className="font-semibold">
                      {row.actual} tons
                    </TableCell>
                    <TableCell className={s.diff}>{row.difference}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.badge}>
                        {row.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className={s.button}>
                        {row.status === "critical" ? "Investigate" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* PAGINATION (UNCHANGED) */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2 text-sm">
              Rows per page
              <select
                value={rowsPerPage}
                onChange={e => setRowsPerPage(Number(e.target.value))}
                className="border rounded px-2 py-1 bg-white dark:bg-slate-950 dark:border-slate-700"
              >
                {[10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" disabled={page === 1}
                onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              Page {page} of {totalPages}
              <Button size="icon" variant="ghost" disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TOLERANCE (UNCHANGED) */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Tolerance Settings</CardTitle>
          <CardDescription>
            Current weighbridge tolerance limits and alert thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <ToleranceCard title="Normal Tolerance" value="±5%" description="No alerts generated" />
          <ToleranceCard title="Warning Threshold" value="±10%" description="Requires verification" />
          <ToleranceCard title="Critical Threshold" value=">10%" description="Immediate investigation" />
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================
   STAT CARD (COLOR ONLY HERE)
========================================================= */
function Stat({ title, value, icon: Icon, active, onClick, gradient }: any) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border bg-gradient-to-br transition",
        gradient,
        active && "ring-2 ring-blue-400"
      )}
    >
      <CardContent className="flex justify-between items-center p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
      </CardContent>
    </Card>
  );
}
/* =========================================================
   TOLERANCE CARD (UNCHANGED)
========================================================= */
function ToleranceCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-950 dark:border-slate-800 p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
