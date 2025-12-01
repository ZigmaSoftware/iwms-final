import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, MapPin, Clock, Filter } from "lucide-react";

const alerts = [
  {
    id: 1,
    type: "deviation",
    vehicle: "TRK-015",
    message: "Route deviation detected - 2.4km off planned route",
    zone: "Zone B",
    time: "5 minutes ago",
    severity: "high",
  },
  {
    id: 2,
    type: "weighbridge",
    vehicle: "TRK-008",
    message: "Weight mismatch: Expected 2.8T, Logged 3.2T (14% difference)",
    zone: "Zone C",
    time: "12 minutes ago",
    severity: "critical",
  },
  {
    id: 3,
    type: "missed",
    vehicle: "TRK-022",
    message: "Missed pickup at location #47",
    zone: "Zone D",
    time: "18 minutes ago",
    severity: "medium",
  },
  {
    id: 4,
    type: "late",
    vehicle: "TRK-001",
    message: "Staff late login - Scheduled: 06:00, Actual: 06:42",
    zone: "Zone A",
    time: "1 hour ago",
    severity: "low",
  },
  {
    id: 5,
    type: "deviation",
    vehicle: "TRK-019",
    message: "Extended idle time at location (45 minutes)",
    zone: "Zone E",
    time: "1 hour ago",
    severity: "medium",
  },
];

export default function Alerts() {
  return (
   <div className="space-y-6 h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Alert Management</h2>
          <p className="text-muted-foreground">Monitor deviations, missed pickups, and system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="a">Zone A</SelectItem>
              <SelectItem value="b">Zone B</SelectItem>
              <SelectItem value="c">Zone C</SelectItem>
              <SelectItem value="d">Zone D</SelectItem>
              <SelectItem value="e">Zone E</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Total Active Alerts</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">2</div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">3</div>
            <p className="text-xs text-muted-foreground">Medium/Low</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Real-time alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all"
              >
                <div
                  className={`p-3 rounded-lg ${
                    alert.severity === "critical"
                      ? "bg-destructive/10"
                      : alert.severity === "high"
                      ? "bg-warning/10"
                      : "bg-primary/10"
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      alert.severity === "critical"
                        ? "text-destructive"
                        : alert.severity === "high"
                        ? "text-warning"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{alert.vehicle}</span>
                    <Badge
                      variant="outline"
                      className={
                        alert.severity === "critical"
                          ? "border-destructive text-destructive"
                          : alert.severity === "high"
                          ? "border-warning text-warning"
                          : ""
                      }
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.zone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
