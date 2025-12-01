import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reports() {
  return (
   <div className="space-y-6 h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive fleet performance and operational reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="today">
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2.4% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2 km/L</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +5.1% improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847 tons</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
            <CardDescription>Staff attendance and punctuality analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">On-time arrivals</span>
                  <span className="font-medium">89%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-success" style={{ width: "89%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Late arrivals (within 30min)</span>
                  <span className="font-medium">8%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-warning" style={{ width: "8%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Absent/No show</span>
                  <span className="font-medium">3%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: "3%" }} />
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Export Attendance Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Efficiency Trends</CardTitle>
            <CardDescription>Fuel consumption analysis by vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { vehicle: "TRK-001", efficiency: "9.2 km/L", status: "excellent" },
                { vehicle: "TRK-015", efficiency: "8.1 km/L", status: "good" },
                { vehicle: "TRK-008", efficiency: "7.4 km/L", status: "average" },
                { vehicle: "TRK-022", efficiency: "6.8 km/L", status: "poor" },
              ].map((data, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{data.vehicle}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.status === "excellent"
                        ? "Excellent"
                        : data.status === "good"
                        ? "Good"
                        : data.status === "average"
                        ? "Average"
                        : "Needs Attention"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{data.efficiency}</p>
                    <div
                      className={`h-1 w-20 rounded-full mt-1 ${
                        data.status === "excellent"
                          ? "bg-success"
                          : data.status === "good"
                          ? "bg-primary"
                          : data.status === "average"
                          ? "bg-warning"
                          : "bg-destructive"
                      }`}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                <Download className="h-4 w-4 mr-2" />
                Export Fuel Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Waste Collection Summary</CardTitle>
          <CardDescription>Waste collection statistics and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Routes Completed</p>
              <p className="text-3xl font-bold">142</p>
              <p className="text-xs text-success">+12% vs last week</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average Load per Trip</p>
              <p className="text-3xl font-bold">2.8 tons</p>
              <p className="text-xs text-muted-foreground">Within optimal range</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Collection Efficiency</p>
              <p className="text-3xl font-bold">94.2%</p>
              <p className="text-xs text-success">+3.1% improvement</p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
