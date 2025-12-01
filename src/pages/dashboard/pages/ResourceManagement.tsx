import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone } from "lucide-react";
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
    <div className="h-[calc(100vh-80px)] overflow-hidden pb-4 pr-2">
      <div className="grid grid-cols-12 gap-4 h-full">

        {/* LEFT PANEL — 30% */}
        <div className="col-span-3 border-r pr-4 pl-2 flex flex-col gap-4 overflow-y-auto bg-white p-4 rounded-lg">

          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Resource Management
          </h2>
          <p className="text-muted-foreground mt-1">Search & filter workforce</p>

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

          {/* CLEAR BUTTON */}
          <Button variant="ghost" className="w-full border" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        {/* RIGHT PANEL — 70% */}
        <div className="col-span-9 overflow-y-auto pl-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {filteredEmployees.map((emp) => (
              <Card key={emp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {emp.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base">{emp.name}</CardTitle>
                      <CardDescription className="text-xs">{emp.id}</CardDescription>

                      <div className="flex gap-2">
                        <Badge className={getRoleColor(emp.role)} variant="outline">{emp.role}</Badge>
                        <Badge className={getStatusColor(emp.status)} variant="outline">{emp.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
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
