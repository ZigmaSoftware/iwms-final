import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { GIcon } from "../../components/ui/gicon";
import { getEncryptedRoute } from "@/utils/routeCache";

const {
  encMasters,
  encStaffCreation,
  encContinents,
  encVehicleCreation,
  encUserCreation,
} = getEncryptedRoute();

type ModuleTile = {
  name: string;
  description: string;
  icon: string;  // material icon name
  target: string;
};

const modules: ModuleTile[] = [
  {
    name: "Geo Masters",
    description: "Continents, countries, cities, wards, zones.",
    icon: "public",
    target: `/${encMasters}/${encContinents}`,
  },
  {
    name: "Staff & Workforce",
    description: "Staff master and workforce mapping.",
    icon: "badge",
    target: `/${encMasters}/${encStaffCreation}`,
  },
  {
    name: "Transport & Fleet",
    description: "Vehicle master and fleet categorisation.",
    icon: "local_shipping",
    target: `/transport-master/${encVehicleCreation}`, // align with your routes
  },
  {
    name: "User Access",
    description: "User creation and role-based access.",
    icon: "admin_panel_settings",
    target: `/admins/${encUserCreation}`, // align with your routes
  },
];

const pendingConfig = [
  { module: "Ward → Property mapping", owner: "Operations", status: "Not started" },
  { module: "Staff ↔ User mapping", owner: "HR / IT", status: "In progress" },
  { module: "Vehicle ↔ Route linkage", owner: "Transport", status: "In progress" },
  { module: "Citizen grievance taxonomy", owner: "Customer Success", status: "Planned" },
];

const AdminHome: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin & Master Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure core master data and keep every module aligned.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <GIcon name="settings" className="text-base" />
          Global settings
        </Button>
      </div>

      {/* MASTER TILES */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((m) => (
          <Card
            key={m.name}
            className="border-border/60 h-full flex flex-col"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {m.name}
                </CardTitle>
                <span className="rounded-full bg-primary/10 text-primary p-2">
                  <GIcon name={m.icon} className="text-base" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 flex-1">
              <p className="text-xs text-muted-foreground">
                {m.description}
              </p>
              <div className="mt-auto">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <Link to={m.target}>
                    Configure
                    <GIcon name="arrow_forward" className="text-sm" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PENDING CONFIG TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GIcon name="playlist_add_check" className="text-base" />
            Pending configuration items
            <Badge variant="outline">Admin view</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module / Definition</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingConfig.map((row) => (
                <TableRow key={row.module}>
                  <TableCell className="text-sm">{row.module}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.owner}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        row.status === "Not started"
                          ? "outline"
                          : row.status === "In progress"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
