import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchGrievances } from "@/features/grievances/api";
import { AttachmentPreview } from "@/features/grievances/components/AttachmentPreview";
import { InfoField } from "@/features/grievances/components/InfoField";
import type { Grievance } from "@/features/grievances/types";

export default function Grievances() {
  const [complaints, setComplaints] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Grievance | null>(null);

  const loadComplaints = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchGrievances(signal);
        console.log("data", data)
        setComplaints(data);
      } catch (err) {
        if (signal?.aborted) return;
        console.error("Unable to load complaints", err);
        setError("Unable to load complaints. Please try again.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadComplaints(controller.signal);
    return () => controller.abort();
  }, [loadComplaints]);

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const formatDateTime = (d?: string | null) => {
    if (!d) return "-";
    const dt = new Date(d);

    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();

    let h = dt.getHours();
    const m = String(dt.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    return `${dd}-${mm}-${yyyy} ${h}.${m} ${ampm}`;
  };

  const getDateOnly = (value?: string | null) =>
    value ? value.split("T")[0] : null;

  const formatDateForSearch = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("en-GB").replace(/\//g, "-")
      : "";

  // SEARCH
  const filtered = complaints.filter((g) => {
    const s = searchQuery.toLowerCase();
    const created = formatDateForSearch(g.created);

    return (
      g.title?.toLowerCase().includes(s) ||
      g.category?.toLowerCase().includes(s) ||
      g.zone_name?.toLowerCase().includes(s) ||
      g.description?.toLowerCase().includes(s) ||
      g.unique_id?.toLowerCase().includes(s) ||
      created.toLowerCase().includes(s)
    );
  });

  // KPI LOGIC
  const todayISO = new Date().toISOString().split("T")[0];

  const todayNewCount = complaints.filter(
    (g) => (getDateOnly(g.created) ?? "") === todayISO,
  ).length;

  const openCount = complaints.filter((g) => {
    const st = g.status?.toLowerCase() ?? "";
    const created = getDateOnly(g.created) ?? "";
    if (st === "open") return true;

    if (
      ["processing", "progressing", "in-progress"].includes(st) &&
      created < todayISO
    )
      return true;

    return false;
  }).length;

  const inProgressCount = complaints.filter((g) => {
    const st = g.status?.toLowerCase() ?? "";
    const created = getDateOnly(g.created) ?? "";

    return (
      ["processing", "progressing", "in-progress"].includes(st) &&
      created === todayISO
    );
  }).length;

  const resolvedCount = complaints.filter((g) =>
    ["resolved", "closed"].includes(g.status?.toLowerCase() ?? "")
  ).length;

  // TAB FILTERING
  const tabFiltered = (tab: string) => {
    return filtered.filter((g) => {
      const st = g.status?.toLowerCase() ?? "";
      const created = getDateOnly(g.created) ?? "";

      if (tab === "new") return created === todayISO;

      if (tab === "open") {
        return (
          st === "open" ||
          (["processing", "progressing", "in-progress"].includes(st) &&
            created < todayISO)
        );
      }

      if (tab === "resolved") return ["resolved", "closed"].includes(st);

      return true;
    });
  };

  // STATUS STYLES
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-red-100 text-red-700 border-red-300";
      case "processing":
      case "in-progress":
      case "progressing":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getBorderColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "border-l-4 border-red-500";
      case "processing":
      case "progressing":
      case "in-progress":
        return "border-l-4 border-yellow-500";
      case "resolved":
      case "closed":
        return "border-l-4 border-green-600";
      default:
        return "border-l-4 border-gray-400";
    }
  };

  const handleRefresh = () => loadComplaints();

  // MAIN UI --------------------------------------------------------
  return (
    <div className="space-y-6 h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Grievance Management
        </h2>
        <p className="text-muted-foreground">Track and resolve complaints</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gray-50 border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaints.length}</div>
            <p className="text-xs text-gray-500">All records</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-red-800">
              Open
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {openCount}
            </div>
            <p className="text-xs text-red-700">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              New
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {todayNewCount}
            </div>
            <p className="text-xs text-blue-700">Created today</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-yellow-800">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {inProgressCount}
            </div>
            <p className="text-xs text-yellow-700">Being worked</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-green-800">
              Resolved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {resolvedCount}
            </div>
            <p className="text-xs text-green-700">Successfully closed</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search grievances..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="w-full lg:w-auto"
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-red-800">
            {error}
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {["all", "new", "open", "resolved"].map((tab) => {
          const tabItems = tabFiltered(tab);
          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {tabItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    No grievances found for this filter.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tabItems.map((g) => (
                    <Card
                      key={g.id}
                      className={`p-4 transition-shadow hover:shadow-lg ${getBorderColor(
                        g.status,
                      )}`}
                    >
                      <div className="grid gap-4 text-sm md:grid-cols-5">
                        <InfoField label="ID" value={g.unique_id} />
                        <InfoField
                          label="Category"
                          value={`${cap(g.main_category)} / ${cap(g.sub_category)}`}
                        />

                        <InfoField label="Zone" value={cap(g.zone_name)} />
                        <InfoField label="Ward" value={cap(g.ward_name)} />

                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <Badge className={getStatusColor(g.status)}>
                            {g.status ?? "Unknown"}
                          </Badge>
                        </div>4yoe
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedComplaint(g);
                          setOpenDialog(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="mt-4"
                      >
                        View Details
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* VIEW DETAILS MODAL */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent
          className="max-w-4xl rounded-xl p-0"
          style={{ height: "90vh" }}
        >
          <div className="overflow-y-auto h-full p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Complaint Details
              </DialogTitle>
              <DialogDescription>Full complaint information</DialogDescription>
            </DialogHeader>

            {selectedComplaint && (
              <div className="space-y-8 pt-4">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <InfoField label="Complaint No" value={selectedComplaint.unique_id} />
                    <InfoField label="Zone" value={cap(selectedComplaint.zone_name)} />
                    <InfoField label="Contact" value={selectedComplaint.contact_no} />
                    <InfoField label="Closed At" value={formatDateTime(selectedComplaint.complaint_closed_at)} />
                    <InfoField label="Address" value={selectedComplaint.address} />
                  </div>

                  <div className="space-y-6">
                    <InfoField label="Category" value={cap(selectedComplaint.category)} />
                    <InfoField label="Ward" value={cap(selectedComplaint.ward_name)} />
                    <InfoField label="Created" value={formatDateTime(selectedComplaint.created)} />

                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={getStatusColor(selectedComplaint.status) + " px-3 py-1"}>
                        {selectedComplaint.status ?? "Unknown"}
                      </Badge>
                    </div>

                    <InfoField label="Complaint Details" value={selectedComplaint.details} />
                  </div>
                </div>

                <hr />

                <div className="grid md:grid-cols-2 gap-8">
                  <AttachmentPreview label="Uploaded File" fileUrl={selectedComplaint.image_url} />
                  <AttachmentPreview label="Close File" fileUrl={selectedComplaint.close_image_url} />
                </div>

                <hr />

                <InfoField label="Remarks" value={selectedComplaint.action_remarks || "-"} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
