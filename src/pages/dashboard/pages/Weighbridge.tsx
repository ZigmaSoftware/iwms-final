import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react";

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

export default function Weighbridge() {
  const criticalCount = weighbridgeData.filter((d) => d.status === "critical").length;
  const warningCount = weighbridgeData.filter((d) => d.status === "warning").length;
  const normalCount = weighbridgeData.filter((d) => d.status === "normal").length;        

  return (
   <div className="space-y-6 h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Weighbridge Log</h2>
          <p className="text-muted-foreground">Real-time weight tracking and discrepancy monitoring</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{weighbridgeData.length}</p>
                <p className="text-xs text-muted-foreground">Total Entries Today</p>
              </div>
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/50 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{normalCount}</p>
                <p className="text-xs text-muted-foreground">Within Tolerance</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Minor Deviation</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical Mismatch</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weight Entries Log</CardTitle>
          <CardDescription>Real-time weighbridge integration with automatic discrepancy detection</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Vehicle ID</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Expected Weight</TableHead>
                <TableHead>Actual Weight</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weighbridgeData.map((entry) => (
                <TableRow key={entry.id} className={entry.status === "critical" ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{entry.time}</TableCell>
                  <TableCell>{entry.vehicle}</TableCell>
                  <TableCell>{entry.zone}</TableCell>
                  <TableCell>{entry.expected} tons</TableCell>
                  <TableCell className="font-semibold">{entry.actual} tons</TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        entry.status === "critical"
                          ? "text-destructive"
                          : entry.status === "warning"
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      {entry.difference}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        entry.status === "critical"
                          ? "border-destructive text-destructive bg-destructive/10"
                          : entry.status === "warning"
                          ? "border-warning text-warning bg-warning/10"
                          : "border-success text-success bg-success/10"
                      }
                    >
                      {entry.status === "critical" ? (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      ) : entry.status === "normal" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {entry.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={entry.status === "critical" ? "destructive" : "outline"}
                      size="sm"
                    >
                      {entry.status === "critical" ? "Investigate" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tolerance Settings</CardTitle>
          <CardDescription>Current weighbridge tolerance limits and alert thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Normal Tolerance</p>
              <p className="text-2xl font-bold text-success">±5%</p>
              <p className="text-xs text-muted-foreground">No alerts generated</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Warning Threshold</p>
              <p className="text-2xl font-bold text-warning">±10%</p>
              <p className="text-xs text-muted-foreground">Requires verification</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Critical Threshold</p>
              <p className="text-2xl font-bold text-destructive">&gt;10%</p>
              <p className="text-xs text-muted-foreground">Immediate investigation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
