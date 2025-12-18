import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

// -----------------------------------------------------------------------------
// MOCK DATA
// -----------------------------------------------------------------------------
const mockEmployees = [
  {
    id: "E001",
    name: "Rajesh Kumar",
    role: "Driver",
    zone: "Zone A",
    status: "active",
    phone: "+91 98765 43210",
    email: "rajesh.k@fleet.com",
    vehicle: "DL-01-AB-1234",
    joinDate: "2024-01-15",
  },
  {
    id: "E002",
    name: "Amit Singh",
    role: "Driver",
    zone: "Zone B",
    status: "on-leave",
    phone: "+91 98765 43211",
    email: "amit.s@fleet.com",
    vehicle: "DL-01-CD-5678",
    joinDate: "2024-02-20",
  },
  {
    id: "E003",
    name: "Suresh Yadav",
    role: "Driver",
    zone: "Zone C",
    status: "active",
    phone: "+91 98765 43212",
    email: "suresh.y@fleet.com",
    vehicle: "DL-01-EF-9012",
    joinDate: "2024-03-10",
  },
  {
    id: "E004",
    name: "Priya Sharma",
    role: "Supervisor",
    zone: "Zone A",
    status: "active",
    phone: "+91 98765 43213",
    email: "priya.s@fleet.com",
    vehicle: "-",
    joinDate: "2023-11-05",
  },
  {
    id: "E005",
    name: "Ravi Verma",
    role: "Helper",
    zone: "Zone B",
    status: "active",
    phone: "+91 98765 43214",
    email: "ravi.v@fleet.com",
    vehicle: "DL-01-CD-5678",
    joinDate: "2024-05-18",
  },
  {
    id: "E006",
    name: "Anita Devi",
    role: "Helper",
    zone: "Zone A",
    status: "active",
    phone: "+91 98765 43215",
    email: "anita.d@fleet.com",
    vehicle: "DL-01-AB-1234",
    joinDate: "2024-06-22",
  },
];

export default function ResourceManagement() {
  // FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [zoneFilter, setZoneFilter] = useState("All Zones");
  const [vehicleFilter, setVehicleFilter] = useState("All Vehicles");
  const [joinDateFilter, setJoinDateFilter] = useState("All Join Dates");

  // CLEAN LABEL OPTIONS
  const zoneOptions = ["All Zones", ...new Set(mockEmployees.map((e) => e.zone))];
  const vehicleOptions = ["All Vehicles", ...new Set(mockEmployees.map((e) => e.vehicle))];
  const joinDateOptions = ["All Join Dates", ...new Set(mockEmployees.map((e) => e.joinDate))];

  // RESET FILTERS
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("All Roles");
    setZoneFilter("All Zones");
    setVehicleFilter("All Vehicles");
    setJoinDateFilter("All Join Dates");
  };

  // FILTER LOGIC
  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "All Roles" || emp.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesZone =
      zoneFilter === "All Zones" || emp.zone === zoneFilter;

    const matchesVehicle =
      vehicleFilter === "All Vehicles" || emp.vehicle === vehicleFilter;

    const matchesJoinDate =
      joinDateFilter === "All Join Dates" || emp.joinDate === joinDateFilter;

    return matchesSearch && matchesRole && matchesZone && matchesVehicle && matchesJoinDate;
  });

  const roleCounts = mockEmployees.reduce(
    (acc, emp) => {
      const key = emp.role.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const workforceStats = [
    {
      label: "Total Workforce",
      value: mockEmployees.length,
      subtext: "All personnel",
      accent: "from-white via-sky-50 to-sky-200 dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-900",
      filterValue: "All Roles",
      border: "border-sky-200/80 dark:border-sky-500/40",
      ringColor: "ring-sky-300 dark:ring-sky-500/60",
      emphasis: true,
      colors: {
        label: "text-sky-500 dark:text-sky-200",
        value: "text-sky-600 dark:text-sky-200",
        sparkle: "text-sky-400 dark:text-sky-200",
      },
    },
    {
      label: "Drivers",
      value: roleCounts["driver"] ?? 0,
      subtext: "Driver roster",
      accent: "from-white via-emerald-50 to-emerald-200 dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900",
      filterValue: "Driver",
      border: "border-emerald-200/80 dark:border-emerald-500/40",
      ringColor: "ring-emerald-300 dark:ring-emerald-500/60",
      colors: {
        label: "text-emerald-500 dark:text-emerald-200",
        value: "text-emerald-600 dark:text-emerald-200",
        sparkle: "text-emerald-400 dark:text-emerald-200",
      },
    },
    {
      label: "Supervisors",
      value: roleCounts["supervisor"] ?? 0,
      subtext: "Leadership",
      accent: "from-white via-amber-50 to-amber-200 dark:from-slate-900 dark:via-amber-950/40 dark:to-slate-900",
      filterValue: "Supervisor",
      border: "border-amber-200/80 dark:border-amber-500/40",
      ringColor: "ring-amber-300 dark:ring-amber-500/60",
      colors: {
        label: "text-amber-500 dark:text-amber-200",
        value: "text-amber-600 dark:text-amber-200",
        sparkle: "text-amber-400 dark:text-amber-200",
      },
    },
    {
      label: "Helpers",
      value: roleCounts["helper"] ?? 0,
      subtext: "Support crew",
      accent: "from-white via-rose-50 to-rose-200 dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900",
      filterValue: "Helper",
      border: "border-rose-200/80 dark:border-rose-500/40",
      ringColor: "ring-rose-300 dark:ring-rose-500/60",
      colors: {
        label: "text-rose-500 dark:text-rose-200",
        value: "text-rose-600 dark:text-rose-200",
        sparkle: "text-rose-400 dark:text-rose-200",
      },
    },
  ];

  const statusCardGradients: Record<string, string> = {
    active: "from-white via-emerald-50 to-emerald-300 dark:from-slate-900 dark:via-emerald-900/30 dark:to-emerald-800",
    "on-leave": "from-white via-amber-50 to-amber-200 dark:from-slate-900 dark:via-amber-900/30 dark:to-amber-800",
  };

  const statusGlowColors: Record<string, string> = {
    active: "bg-emerald-100/70 dark:bg-emerald-900/40",
    "on-leave": "bg-amber-100/70 dark:bg-amber-900/40",
  };

  // BADGE COLORS
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "on-leave":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "driver":
        return "bg-primary/10 text-primary border-primary/20";
      case "supervisor":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "helper":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden pb-4 pr-2 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-slate-50 to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
      <div className="absolute inset-y-0 right-12 -z-10 w-64 blur-3xl opacity-50 bg-gradient-to-b from-sky-100 via-blue-50 to-emerald-100 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-900/30 animate-pulse" />
      <div className="grid grid-cols-12 gap-4 h-full">

        {/* LEFT PANEL — 30% */}
        <div className="col-span-3 border-r border-border/30 pr-4 pl-2 flex flex-col gap-4 overflow-y-auto bg-white/80 dark:bg-slate-950/70 backdrop-blur rounded-3xl shadow-lg shadow-primary/5 dark:shadow-black/30 relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 via-transparent to-transparent dark:from-slate-900/60 opacity-70 pointer-events-none animate-pulse" />

          <div className="space-y-4 relative pt-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Resource Management
              </h2>
              <div className="flex items-center gap-1 text-sky-500 dark:text-sky-300 mt-2 text-sm">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <p className="text-muted-foreground">Search & filter workforce</p>
              </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {/* ROLE FILTER */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Roles">All Roles</SelectItem>
                  <SelectItem value="Driver">Driver</SelectItem>
                  <SelectItem value="Helper">Helper</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>

              {/* ZONE FILTER */}
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zoneOptions.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* VEHICLE FILTER */}
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* JOIN DATE FILTER */}
              <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {joinDateOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CLEAR BUTTON */}
            <Button
              variant="ghost"
              className="w-full border bg-gradient-to-r from-sky-100 to-blue-100 hover:from-sky-200 hover:to-blue-200 transition-colors"
              onClick={clearFilters}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL — 70% */}
        <div className="col-span-9 overflow-y-auto pl-2 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workforceStats.map((stat) => {
              const valueSize = stat.emphasis ? "text-4xl font-bold" : "text-3xl font-semibold";
              const accentOpacity = stat.emphasis ? "opacity-60" : "opacity-35";
              const isActive = roleFilter === (stat.filterValue ?? "All Roles");
              const activeRing = isActive
                ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${stat.ringColor ?? ""}`
                : "";

              return (
                <button
                  type="button"
                  key={stat.label}
                  onClick={() => setRoleFilter(stat.filterValue ?? "All Roles")}
                  className={`relative overflow-hidden rounded-2xl border ${
                    stat.border ?? "border-border/40 dark:border-border/60"
                  } bg-white/80 dark:bg-slate-950/70 backdrop-blur shadow-lg shadow-primary/5 dark:shadow-black/30 p-4 w-full transition-transform duration-500 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:dark:ring-offset-slate-900 ${
                    stat.emphasis ? "shadow-blue-100 dark:shadow-sky-900/30" : ""
                  } ${activeRing} text-left`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${stat.accent} ${accentOpacity} animate-[pulse_6s_ease-in-out_infinite]`}
                  />
                  <div className="relative space-y-2">
                    <p className={`text-sm flex items-center gap-1 ${stat.colors.label}`}>
                      <Sparkles className={`h-3.5 w-3.5 ${stat.colors.sparkle}`} />
                      {stat.label}
                    </p>
                    <p className={`${valueSize} ${stat.colors.value}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 pb-4">

            {filteredEmployees.map((emp, cardIndex) => (
              <Card
                key={emp.id}
                className="group relative overflow-hidden border border-border/40 bg-white/90 dark:bg-slate-900/70 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 shadow-md hover:shadow-2xl dark:hover:shadow-black/50"
              >
                <div className="pointer-events-none absolute inset-0 z-0">
                  <div
                    className={`card-shimmer absolute inset-y-6 -left-1/3 w-1/2 rounded-full blur-3xl ${
                      statusGlowColors[emp.status] ?? "bg-slate-200/70 dark:bg-slate-800/50"
                    } opacity-40`}
                    style={{ animationDelay: `${cardIndex * 0.2}s` }}
                  />
                </div>
                <div
                  className={`absolute inset-x-4 top-2 h-1 rounded-full bg-gradient-to-r z-10 ${
                    statusCardGradients[emp.status] ??
                    "from-white via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
                  } animate-[pulse_3s_ease-in-out_infinite] opacity-60`}
                />
                <CardHeader className="relative z-10">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-sky-50 dark:bg-slate-800 text-primary font-semibold">
                        {emp.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base">{emp.name}</CardTitle>
                      <CardDescription className="text-xs">{emp.id}</CardDescription>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={getRoleColor(emp.role)} variant="outline">{emp.role}</Badge>
                        <Badge className={getStatusColor(emp.status)} variant="outline">{emp.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 relative z-10">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{emp.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zone:</span>
                      <span className="font-medium">{emp.zone}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-medium">{emp.vehicle}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Joined: {emp.joinDate}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
