import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Search, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
const mockVehicles = [
  {
    vehicleId: "VH001",
    id: "V001",
    registration: "DL-01-AB-1234",
    type: "Compactor",
    capacity: "10 Tons",
    status: "active",
    driver: "Rajesh Kumar",
    zone: "Zone A",
    lastMaintenance: "2025-10-10",
    fuelEfficiency: "8.5 km/l",
  },
  {
    vehicleId: "VH002",
    id: "V002",
    registration: "DL-01-CD-5678",
    type: "Tipper",
    capacity: "15 Tons",
    status: "maintenance",
    driver: "Amit Singh",
    zone: "Zone B",
    lastMaintenance: "2025-10-12",
    fuelEfficiency: "7.2 km/l",
  },
  {
    vehicleId: "VH003",
    id: "V003",
    registration: "DL-01-EF-9012",
    type: "Compactor",
    capacity: "10 Tons",
    status: "active",
    driver: "Suresh Yadav",
    zone: "Zone C",
    lastMaintenance: "2025-10-08",
    fuelEfficiency: "8.8 km/l",
  },
  {
    vehicleId: "VH004",
    id: "V004",
    registration: "DL-01-GH-3456",
    type: "Hook Loader",
    capacity: "20 Tons",
    status: "inactive",
    driver: "Unassigned",
    zone: "-",
    lastMaintenance: "2025-10-05",
    fuelEfficiency: "6.5 km/l",
  },
];

export default function Vehicle() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState("all");



  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vehicleId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;

    const matchesType =
      typeFilter === "all" || vehicle.type === typeFilter;

    const matchesCapacity =
      capacityFilter === "all" || vehicle.capacity === capacityFilter;

    const matchesMaintenance =
      maintenanceFilter === "all" ||
      vehicle.lastMaintenance === maintenanceFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesCapacity &&
      matchesMaintenance
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "maintenance":
        return "bg-warning/10 text-warning border-warning/20";
      case "inactive":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCapacityFilter("all");
    setMaintenanceFilter("all");
  };



  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden pb-4 pr-2">
      <div className="grid grid-cols-12 gap-4 h-full">

        {/* LEFT COLUMN 30% */}
        <div className="col-span-3 border-r pr-4 pl-2 flex flex-col gap-4 overflow-y-auto bg-white p-4 rounded-lg">

          <div className="ml-3">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Vehicle Management
            </h2>
            <p className="text-muted-foreground mt-1">Search & filter your fleet</p>
          </div>

          {/* SEARCH */}

          <div className="relative ml-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>


          {/* STATUS FILTER */}
          <div className="ml-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* TYPE FILTER */}

          <div className="ml-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Compactor">Compactor</SelectItem>
                <SelectItem value="Tipper">Tipper</SelectItem>
                <SelectItem value="Hook Loader">Hook Loader</SelectItem>
              </SelectContent>
            </Select>


          </div>


          {/* CAPACITY FILTER */}

          <div className="ml-3">
            <Select value={capacityFilter} onValueChange={setCapacityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Capacities</SelectItem>
                <SelectItem value="10 Tons">10 Tons</SelectItem>
                <SelectItem value="15 Tons">15 Tons</SelectItem>
                <SelectItem value="20 Tons">20 Tons</SelectItem>
              </SelectContent>
            </Select>

          </div>


          {/* LAST MAINTENANCE FILTER */}

          <div className="ml-3">
            <Select
              value={maintenanceFilter}
              onValueChange={setMaintenanceFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Last Maintenance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Date</SelectItem>
                {mockVehicles.map((v) => (
                  <SelectItem key={v.vehicleId} value={v.lastMaintenance}>
                    {v.lastMaintenance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>


          <div className="ml-3">
            <Button variant="ghost" className="w-full border" onClick={clearFilters}>
              Clear
            </Button>

          </div>
        </div>

        {/* RIGHT COLUMN 70% */}
        <div className="col-span-9 overflow-y-auto pl-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.vehicleId} className="hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{vehicle.registration}</CardTitle>
                        <CardDescription>{vehicle.type}</CardDescription>
                        <p className="text-xs text-muted-foreground">
                          ID: {vehicle.vehicleId}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Capacity</p>
                      <p className="font-medium">{vehicle.capacity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fuel Efficiency</p>
                      <p className="font-medium">{vehicle.fuelEfficiency}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium ">{vehicle.zone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="font-medium">{vehicle.driver}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last Maintenance: {vehicle.lastMaintenance}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Track
                    </Button>
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
