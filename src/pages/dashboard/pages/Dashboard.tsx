import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">Real-time fleet monitoring and analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Vehicles"
          value={24}
          icon={Truck}
          trend="+2 from yesterday"
          variant="success"
        />
        <MetricCard
          title="Idle Vehicles"
          value={5}
          icon={Clock}
          trend="Normal range"
          variant="warning"
        />
        <MetricCard
          title="Active Alerts"
          value={8}
          icon={AlertTriangle}
          trend="3 critical"
          variant="destructive"
        />
        <MetricCard
          title="Completed Routes"
          value={142}
          icon={CheckCircle}
          trend="+12% this week"
          variant="success"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest fleet updates and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { vehicle: "TRK-001", status: "Completed route", time: "2 min ago", type: "success" },
                { vehicle: "TRK-015", status: "Deviation alert", time: "5 min ago", type: "warning" },
                { vehicle: "TRK-008", status: "Weight mismatch", time: "12 min ago", type: "destructive" },
                { vehicle: "TRK-022", status: "Started route", time: "18 min ago", type: "default" },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.vehicle}</p>
                    <p className="text-xs text-muted-foreground">{activity.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-success"
                          : activity.type === "warning"
                          ? "bg-warning"
                          : activity.type === "destructive"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status Distribution</CardTitle>
            <CardDescription>Current fleet status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Running</span>
                  <span className="font-medium">24 vehicles</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-success" style={{ width: "65%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Idle</span>
                  <span className="font-medium">5 vehicles</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-warning" style={{ width: "14%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">8 vehicles</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: "21%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
