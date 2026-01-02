import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, MapPin, Clock, Filter, BellRing, ShieldAlert, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const ALERTS_DATA = [
  {
    id: 1,
    type: "deviation",
    vehicle: "TRK-015",
    messageKey: "dashboard.alerts.message_route_deviation",
    zoneKey: "dashboard.alerts.zone_b",
    timeKey: "dashboard.alerts.time_5_minutes_ago",
    severity: "high",
  },
  {
    id: 2,
    type: "weighbridge",
    vehicle: "TRK-008",
    messageKey: "dashboard.alerts.message_weight_mismatch",
    zoneKey: "dashboard.alerts.zone_c",
    timeKey: "dashboard.alerts.time_12_minutes_ago",
    severity: "critical",
  },
  {
    id: 3,
    type: "missed",
    vehicle: "TRK-022",
    messageKey: "dashboard.alerts.message_missed_pickup",
    zoneKey: "dashboard.alerts.zone_d",
    timeKey: "dashboard.alerts.time_18_minutes_ago",
    severity: "medium",
  },
  {
    id: 4,
    type: "late",
    vehicle: "TRK-001",
    messageKey: "dashboard.alerts.message_staff_late_login",
    zoneKey: "dashboard.alerts.zone_a",
    timeKey: "dashboard.alerts.time_1_hour_ago",
    severity: "low",
  },
  {
    id: 5,
    type: "deviation",
    vehicle: "TRK-019",
    messageKey: "dashboard.alerts.message_extended_idle",
    zoneKey: "dashboard.alerts.zone_e",
    timeKey: "dashboard.alerts.time_1_hour_ago",
    severity: "medium",
  },
];

export default function Alerts() {
  const { t } = useTranslation();
  const severityCounts = ALERTS_DATA.reduce(
    (acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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

  const summaryCards = [
    {
      label: t("dashboard.alerts.summary_total_active_alerts"),
      value: ALERTS_DATA.length,
      subtext: t("dashboard.alerts.summary_records_across_fleet"),
      gradient: "bg-gradient-to-br from-white via-sky-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-900",
      border: "border-sky-200/80 dark:border-sky-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-sky-600 dark:text-sky-200",
      Icon: BellRing,
    },
    {
      label: t("dashboard.alerts.summary_critical_alerts"),
      value: severityCounts["critical"] ?? 0,
      subtext: t("dashboard.alerts.summary_immediate_action"),
      gradient: "bg-gradient-to-br from-white via-rose-50 to-rose-100 dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-900",
      border: "border-rose-200/80 dark:border-rose-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-rose-600 dark:text-rose-200",
      Icon: ShieldAlert,
    },
    {
      label: t("dashboard.alerts.summary_high_priority"),
      value: severityCounts["high"] ?? 0,
      subtext: t("dashboard.alerts.summary_needs_review"),
      gradient: "bg-gradient-to-br from-white via-amber-50 to-amber-100 dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-900",
      border: "border-amber-200/80 dark:border-amber-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-amber-600 dark:text-amber-200",
      Icon: Activity,
    },
    {
      label: t("dashboard.alerts.summary_medium_low"),
      value: (severityCounts["medium"] ?? 0) + (severityCounts["low"] ?? 0),
      subtext: t("dashboard.alerts.summary_monitoring"),
      gradient: "bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900",
      border: "border-emerald-200/80 dark:border-emerald-500/40",
      iconBg: "bg-white/70 dark:bg-slate-900/60",
      iconColor: "text-emerald-600 dark:text-emerald-200",
      Icon: AlertTriangle,
    },
  ];

  const severityTokens: Record<
    typeof alerts[number]["severity"],
    {
      badge: string;
      chip: string;
      ring: string;
      icon: string;
      glow: string;
    }
  > = {
    critical: {
      badge: "border-rose-300 text-rose-600 dark:border-rose-500/50 dark:text-rose-200",
      chip: "bg-white/85 dark:bg-slate-900/60 border border-rose-100/70 dark:border-rose-500/30",
      ring: "ring-1 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-rose-200/70 dark:ring-rose-500/40",
      icon: "text-rose-600 dark:text-rose-200",
      glow: "from-rose-300/30 via-transparent to-transparent dark:from-rose-600/20",
    },
    high: {
      badge: "border-amber-300 text-amber-600 dark:border-amber-500/50 dark:text-amber-200",
      chip: "bg-white/85 dark:bg-slate-900/60 border border-amber-100/70 dark:border-amber-500/30",
      ring: "ring-1 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-amber-200/70 dark:ring-amber-500/40",
      icon: "text-amber-600 dark:text-amber-200",
      glow: "from-amber-300/30 via-transparent to-transparent dark:from-amber-500/20",
    },
    medium: {
      badge: "border-sky-300 text-sky-600 dark:border-sky-500/50 dark:text-sky-200",
      chip: "bg-white/85 dark:bg-slate-900/60 border border-sky-100/70 dark:border-sky-500/30",
      ring: "ring-1 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-sky-200/70 dark:ring-sky-500/40",
      icon: "text-sky-600 dark:text-sky-200",
      glow: "from-sky-300/30 via-transparent to-transparent dark:from-sky-500/20",
    },
    low: {
      badge: "border-emerald-300 text-emerald-600 dark:border-emerald-500/50 dark:text-emerald-200",
      chip: "bg-white/85 dark:bg-slate-900/60 border border-emerald-100/70 dark:border-emerald-500/30",
      ring: "ring-1 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-emerald-200/70 dark:ring-emerald-500/40",
      icon: "text-emerald-600 dark:text-emerald-200",
      glow: "from-emerald-300/30 via-transparent to-transparent dark:from-emerald-500/20",
    },
  };

  return (
    <div className={pageBgClass}>
      <div className="space-y-6 h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-10">
        <div className={heroPanelClass}>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              {t("dashboard.alerts.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("dashboard.alerts.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[190px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("dashboard.alerts.filter_by_zone")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.alerts.all_zones")}</SelectItem>
                <SelectItem value="a">{t("dashboard.alerts.zone_a")}</SelectItem>
                <SelectItem value="b">{t("dashboard.alerts.zone_b")}</SelectItem>
                <SelectItem value="c">{t("dashboard.alerts.zone_c")}</SelectItem>
                <SelectItem value="d">{t("dashboard.alerts.zone_d")}</SelectItem>
                <SelectItem value="e">{t("dashboard.alerts.zone_e")}</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder={t("dashboard.alerts.filter_by_severity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.alerts.all_severities")}</SelectItem>
                <SelectItem value="critical">{t("dashboard.alerts.severity_critical")}</SelectItem>
                <SelectItem value="high">{t("dashboard.alerts.severity_high")}</SelectItem>
                <SelectItem value="medium">{t("dashboard.alerts.severity_medium")}</SelectItem>
                <SelectItem value="low">{t("dashboard.alerts.severity_low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
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

        <Card className={surfaceCardClass}>
          <CardHeader>
            <CardTitle>{t("dashboard.alerts.active_alerts_title")}</CardTitle>
            <CardDescription>{t("dashboard.alerts.active_alerts_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ALERTS_DATA.map((alert, index) => {
                const severity = severityTokens[alert.severity];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "relative border rounded-2xl p-4 flex items-start gap-4 transition-all duration-500 hover:-translate-y-1",
                      "bg-white/90 dark:bg-slate-950/60 backdrop-blur",
                      severity.ring
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={cn("pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r opacity-40 blur-xl", severity.glow)} />
                    <div className={cn("relative p-3 rounded-xl shadow-inner", severity.chip)}>
                      <AlertTriangle className={cn("h-5 w-5", severity.icon)} />
                    </div>
                    <div className="relative flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{alert.vehicle}</span>
                        <Badge variant="outline" className={cn("text-xs font-semibold", severity.badge)}>
                          {t(`dashboard.alerts.severity_${alert.severity}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{t(alert.messageKey)}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t(alert.zoneKey)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t(alert.timeKey)}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="relative">
                      {t("dashboard.alerts.review")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
