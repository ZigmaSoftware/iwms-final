import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartData } from "chart.js";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip, Legend);

// shadcn components
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// lucide icons
import {
  Trash2,
  Calendar,
  Download,
  Home,
  Droplets,
  Recycle,
  BarChart3,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ---------------------- API Types ----------------------
type ApiWasteRow = {
  date?: string;
  dry_weight?: number;
  wet_weight?: number;
  mix_weight?: number;
  total_net_weight?: number;
  no_of_household?: number;
};

type DailyRow = {
  date: string;
  zone: string;
  wet: number;
  dry: number;
  mix: number;
  total: number;
  target: number;
  households: number;
};

type MonthlyStat = {
  month: string;
  wet: number;
  dry: number;
  mix: number;
  total: number;
  avgDaily: number;
};

// ---------------------- Fallback Samples ----------------------
const FALLBACK_DAILY_DATA: DailyRow[] = [
  {
    date: "2025-10-15",
    zone: "Zone A",
    wet: 8.5,
    dry: 5.2,
    mix: 2.1,
    total: 13.7,
    target: 15.0,
    households: 1200,
  },
];
const ZONE_WASTE_SUMMARY: Record<
  string,
  { household: number; ewaste: number; medical: number }
> = {
  "Zone A": { household: 120, ewaste: 15, medical: 8 },
  "Zone B": { household: 80, ewaste: 10, medical: 5 },
  "Zone C": { household: 150, ewaste: 12, medical: 7 },
  "Zone X": { household: 60, ewaste: 5, medical: 3 },
  "Zone Y": { household: 90, ewaste: 7, medical: 4 },
};

const FALLBACK_MONTHLY_STATS: MonthlyStat[] = [
  { month: "October 2025", wet: 245, dry: 156, total: 401, avgDaily: 13.4 , mix: 0},
];

const WEIGHMENT_API_URL =
  "https://zigma.in/d2d/folders/waste_collected_summary_report/waste_collected_data_api.php";
const WEIGHMENT_API_KEY = "ZIGMA-DELHI-WEIGHMENT-2025-SECURE";

// ---------------------- Utility ----------------------
const toTons = (v: number | undefined | null) =>
  Number(((v ?? 0) / 1000).toFixed(2));

const formatTons = (v: number) => `${v.toFixed(1)} Tons`;

const formatMonthLabel = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "Current Month";
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
};

// ---------------------- Drilldown Dummy Data ----------------------
const CITY_DATA: Record<string, { zones: Record<string, string[]> }> = {
  Delhi: {
    zones: {
      "Zone A": ["Ward 1", "Ward 2", "Ward 3"],
      "Zone B": ["Ward 4", "Ward 5"],
      "Zone C": ["Ward 6", "Ward 7", "Ward 8"],
    },
  },
  Chennai: {
    zones: {
      "Zone X": ["Ward 10", "Ward 11"],
      "Zone Y": ["Ward 12"],
    },
  },
};

const PROPERTY_OPTIONS = {
  All: ["All"],
  Household: ["Apartments", "Residences / Villas"],
  Commercial: ["Theatre Waste", "Medical Waste"],
};

type WasteCategoryKey = "household" | "ewaste" | "medical";

type WardWasteCategory = {
  total: number;
  breakdown: Record<string, number>;
};

type WardWasteMap = Record<WasteCategoryKey, WardWasteCategory>;

const WARD_WASTE_SUMMARY: Record<string, Record<string, WardWasteMap>> = {
  "Zone A": {
    "Ward 1": {
      household: {
        total: 42,
        breakdown: { "Dry Waste": 14, "Wet Waste": 20, "Mixed Waste": 8 },
      },
      ewaste: {
        total: 6.5,
        breakdown: {
          "Consumer Electronics": 2.5,
          Batteries: 1.5,
          "Large Appliances": 2.5,
        },
      },
      medical: {
        total: 3.2,
        breakdown: { Infectious: 1.9, "General Medical": 1.3 },
      },
    },
    "Ward 2": {
      household: {
        total: 37,
        breakdown: { "Dry Waste": 11, "Wet Waste": 18, "Mixed Waste": 8 },
      },
      ewaste: {
        total: 5,
        breakdown: {
          "Consumer Electronics": 2,
          Batteries: 1.2,
          "Large Appliances": 1.8,
        },
      },
      medical: {
        total: 2.6,
        breakdown: { Infectious: 1.4, "General Medical": 1.2 },
      },
    },
    "Ward 3": {
      household: {
        total: 48,
        breakdown: { "Dry Waste": 15, "Wet Waste": 22, "Mixed Waste": 11 },
      },
      ewaste: {
        total: 6.8,
        breakdown: {
          "Consumer Electronics": 2.8,
          Batteries: 1.6,
          "Large Appliances": 2.4,
        },
      },
      medical: {
        total: 3.4,
        breakdown: { Infectious: 1.7, "General Medical": 1.7 },
      },
    },
  },
  "Zone B": {
    "Ward 4": {
      household: {
        total: 31,
        breakdown: { "Dry Waste": 10, "Wet Waste": 15, "Mixed Waste": 6 },
      },
      ewaste: {
        total: 4.4,
        breakdown: {
          "Consumer Electronics": 1.6,
          Batteries: 1.1,
          "Large Appliances": 1.7,
        },
      },
      medical: {
        total: 2.1,
        breakdown: { Infectious: 1, "General Medical": 1.1 },
      },
    },
    "Ward 5": {
      household: {
        total: 35,
        breakdown: { "Dry Waste": 12, "Wet Waste": 16, "Mixed Waste": 7 },
      },
      ewaste: {
        total: 4.9,
        breakdown: {
          "Consumer Electronics": 1.9,
          Batteries: 1.3,
          "Large Appliances": 1.7,
        },
      },
      medical: {
        total: 2.3,
        breakdown: { Infectious: 1.1, "General Medical": 1.2 },
      },
    },
  },
  "Zone C": {
    "Ward 6": {
      household: {
        total: 44,
        breakdown: { "Dry Waste": 13, "Wet Waste": 21, "Mixed Waste": 10 },
      },
      ewaste: {
        total: 6.2,
        breakdown: {
          "Consumer Electronics": 2.2,
          Batteries: 1.6,
          "Large Appliances": 2.4,
        },
      },
      medical: {
        total: 3,
        breakdown: { Infectious: 1.5, "General Medical": 1.5 },
      },
    },
    "Ward 7": {
      household: {
        total: 36,
        breakdown: { "Dry Waste": 11, "Wet Waste": 17, "Mixed Waste": 8 },
      },
      ewaste: {
        total: 5.1,
        breakdown: {
          "Consumer Electronics": 1.9,
          Batteries: 1.3,
          "Large Appliances": 1.9,
        },
      },
      medical: {
        total: 2.4,
        breakdown: { Infectious: 1.2, "General Medical": 1.2 },
      },
    },
    "Ward 8": {
      household: {
        total: 39,
        breakdown: { "Dry Waste": 13, "Wet Waste": 18, "Mixed Waste": 8 },
      },
      ewaste: {
        total: 5.6,
        breakdown: {
          "Consumer Electronics": 2,
          Batteries: 1.4,
          "Large Appliances": 2.2,
        },
      },
      medical: {
        total: 2.7,
        breakdown: { Infectious: 1.3, "General Medical": 1.4 },
      },
    },
  },
  "Zone X": {
    "Ward 10": {
      household: {
        total: 28,
        breakdown: { "Dry Waste": 9, "Wet Waste": 13, "Mixed Waste": 6 },
      },
      ewaste: {
        total: 3.8,
        breakdown: {
          "Consumer Electronics": 1.4,
          Batteries: 0.9,
          "Large Appliances": 1.5,
        },
      },
      medical: {
        total: 1.8,
        breakdown: { Infectious: 0.9, "General Medical": 0.9 },
      },
    },
    "Ward 11": {
      household: {
        total: 30,
        breakdown: { "Dry Waste": 10, "Wet Waste": 14, "Mixed Waste": 6 },
      },
      ewaste: {
        total: 4.1,
        breakdown: {
          "Consumer Electronics": 1.5,
          Batteries: 1,
          "Large Appliances": 1.6,
        },
      },
      medical: {
        total: 1.9,
        breakdown: { Infectious: 0.95, "General Medical": 0.95 },
      },
    },
  },
  "Zone Y": {
    "Ward 12": {
      household: {
        total: 33,
        breakdown: { "Dry Waste": 11, "Wet Waste": 15, "Mixed Waste": 7 },
      },
      ewaste: {
        total: 4.5,
        breakdown: {
          "Consumer Electronics": 1.7,
          Batteries: 1.1,
          "Large Appliances": 1.7,
        },
      },
      medical: {
        total: 2.2,
        breakdown: { Infectious: 1, "General Medical": 1.2 },
      },
    },
  },
};

const PROPERTY_IMPACT: Record<
  keyof typeof PROPERTY_OPTIONS,
  Record<string, number>
> = {
  All: { All: 1 },
  Household: { Apartments: 1.08, "Residences / Villas": 0.97 },
  Commercial: { "Theatre Waste": 1.12, "Medical Waste": 1.25 },
};

const WASTE_CATEGORY_META: Record<
  WasteCategoryKey,
  {
    label: string;
    description: string;
    icon: ReactNode;
    gradient: string;
  }
> = {
  household: {
    label: "Household Waste",
    description: "Dry, wet & mixed streams",
    icon: <Home className="h-4 w-4 text-blue-600" />,
    gradient: "from-blue-50 to-blue-100",
  },
  ewaste: {
    label: "E-Waste",
    description: "Electronics, batteries & appliances",
    icon: <Recycle className="h-4 w-4 text-amber-600" />,
    gradient: "from-amber-50 to-amber-100",
  },
  medical: {
    label: "Medical Waste",
    description: "Infectious and general medical ",
    icon: <BarChart3 className="h-4 w-4 text-rose-600" />,
    gradient: "from-rose-50 to-rose-100",
  },
};

const WASTE_CATEGORY_KEYS: WasteCategoryKey[] = [
  "household",
  "ewaste",
  "medical",
];

type PropertyCollectionRecord = {
  id: string;
  name: string;
  zone: string;
  ward: string;
  dry: number;
  wet: number;
  mixed: number;
  lastPickup: string;
};

const PROPERTY_COLLECTION_DATA: Record<
  keyof typeof PROPERTY_OPTIONS,
  Record<string, PropertyCollectionRecord[]>
> = {
  All: {
    All: [
      {
        id: "GEN-01",
        name: "Central Transfer Hub",
        zone: "Zone A",
        ward: "Ward 1",
        dry: 2.1,
        wet: 3.4,
        mixed: 1.1,
        lastPickup: "Today · 05:10 AM",
      },
      {
        id: "GEN-02",
        name: "North Collection Point",
        zone: "Zone B",
        ward: "Ward 4",
        dry: 1.8,
        wet: 2.7,
        mixed: 0.9,
        lastPickup: "Today · 05:30 AM",
      },
      {
        id: "GEN-03",
        name: "East Yard",
        zone: "Zone C",
        ward: "Ward 7",
        dry: 2.4,
        wet: 3.1,
        mixed: 1.2,
        lastPickup: "Today · 05:45 AM",
      },
      {
        id: "GEN-04",
        name: "South Metro Loop",
        zone: "Zone X",
        ward: "Ward 10",
        dry: 1.6,
        wet: 2.3,
        mixed: 0.7,
        lastPickup: "Yesterday · 06:20 PM",
      },
      {
        id: "GEN-05",
        name: "West Extension",
        zone: "Zone Y",
        ward: "Ward 12",
        dry: 1.9,
        wet: 2.5,
        mixed: 0.8,
        lastPickup: "Yesterday · 04:55 PM",
      },
      {
        id: "GEN-06",
        name: "Market Ring",
        zone: "Zone B",
        ward: "Ward 5",
        dry: 2.2,
        wet: 3,
        mixed: 1,
        lastPickup: "Yesterday · 03:40 PM",
      },
      {
        id: "GEN-07",
        name: "Harbor Line",
        zone: "Zone C",
        ward: "Ward 6",
        dry: 2,
        wet: 2.8,
        mixed: 0.9,
        lastPickup: "Yesterday · 02:10 PM",
      },
      {
        id: "GEN-08",
        name: "Old City Loop",
        zone: "Zone A",
        ward: "Ward 3",
        dry: 1.7,
        wet: 2.4,
        mixed: 0.6,
        lastPickup: "Yesterday · 12:45 PM",
      },
      {
        id: "GEN-09",
        name: "Tech Park Bay",
        zone: "Zone C",
        ward: "Ward 8",
        dry: 2.6,
        wet: 3.6,
        mixed: 1.1,
        lastPickup: "Yesterday · 11:15 AM",
      },
      {
        id: "GEN-10",
        name: "Metro Depot",
        zone: "Zone X",
        ward: "Ward 11",
        dry: 1.5,
        wet: 2.1,
        mixed: 0.5,
        lastPickup: "Yesterday · 09:30 AM",
      },
    ],
  },
  Household: {
    Apartments: [
      {
        id: "APT-101",
        name: "Riverfront Heights",
        zone: "Zone A",
        ward: "Ward 1",
        dry: 0.9,
        wet: 1.6,
        mixed: 0.4,
        lastPickup: "Today · 06:10 AM",
      },
      {
        id: "APT-102",
        name: "Skyline Towers",
        zone: "Zone A",
        ward: "Ward 2",
        dry: 0.8,
        wet: 1.4,
        mixed: 0.3,
        lastPickup: "Today · 05:55 AM",
      },
      {
        id: "APT-103",
        name: "Metro Residency",
        zone: "Zone B",
        ward: "Ward 4",
        dry: 0.7,
        wet: 1.3,
        mixed: 0.3,
        lastPickup: "Today · 05:40 AM",
      },
      {
        id: "APT-104",
        name: "Lotus Greens",
        zone: "Zone B",
        ward: "Ward 5",
        dry: 0.95,
        wet: 1.65,
        mixed: 0.45,
        lastPickup: "Today · 05:20 AM",
      },
      {
        id: "APT-105",
        name: "Harbor View Residency",
        zone: "Zone C",
        ward: "Ward 6",
        dry: 1,
        wet: 1.7,
        mixed: 0.5,
        lastPickup: "Yesterday · 06:00 PM",
      },
      {
        id: "APT-106",
        name: "Park Avenue Suites",
        zone: "Zone C",
        ward: "Ward 7",
        dry: 0.85,
        wet: 1.45,
        mixed: 0.35,
        lastPickup: "Yesterday · 05:10 PM",
      },
      {
        id: "APT-107",
        name: "Silver Meadows",
        zone: "Zone C",
        ward: "Ward 8",
        dry: 0.92,
        wet: 1.5,
        mixed: 0.4,
        lastPickup: "Yesterday · 04:30 PM",
      },
      {
        id: "APT-108",
        name: "Crescent Residency",
        zone: "Zone X",
        ward: "Ward 10",
        dry: 0.78,
        wet: 1.35,
        mixed: 0.32,
        lastPickup: "Yesterday · 03:15 PM",
      },
      {
        id: "APT-109",
        name: "Lakefront Blocks",
        zone: "Zone X",
        ward: "Ward 11",
        dry: 0.81,
        wet: 1.38,
        mixed: 0.34,
        lastPickup: "Yesterday · 01:55 PM",
      },
      {
        id: "APT-110",
        name: "Sunrise Residences",
        zone: "Zone Y",
        ward: "Ward 12",
        dry: 0.87,
        wet: 1.42,
        mixed: 0.36,
        lastPickup: "Yesterday · 12:25 PM",
      },
    ],
    "Residences / Villas": [
      {
        id: "VIL-201",
        name: "Palm Grove Villas",
        zone: "Zone A",
        ward: "Ward 3",
        dry: 0.6,
        wet: 0.9,
        mixed: 0.25,
        lastPickup: "Today · 06:20 AM",
      },
      {
        id: "VIL-202",
        name: "Kingsley Estates",
        zone: "Zone B",
        ward: "Ward 4",
        dry: 0.55,
        wet: 0.82,
        mixed: 0.21,
        lastPickup: "Today · 05:50 AM",
      },
      {
        id: "VIL-203",
        name: "Imperial Villas",
        zone: "Zone B",
        ward: "Ward 5",
        dry: 0.58,
        wet: 0.88,
        mixed: 0.24,
        lastPickup: "Today · 05:10 AM",
      },
      {
        id: "VIL-204",
        name: "Fern Residency",
        zone: "Zone C",
        ward: "Ward 6",
        dry: 0.62,
        wet: 0.95,
        mixed: 0.26,
        lastPickup: "Yesterday · 06:10 PM",
      },
      {
        id: "VIL-205",
        name: "Orchid Enclave",
        zone: "Zone C",
        ward: "Ward 7",
        dry: 0.57,
        wet: 0.89,
        mixed: 0.23,
        lastPickup: "Yesterday · 05:30 PM",
      },
      {
        id: "VIL-206",
        name: "Emerald Meadows",
        zone: "Zone C",
        ward: "Ward 8",
        dry: 0.64,
        wet: 0.97,
        mixed: 0.27,
        lastPickup: "Yesterday · 04:40 PM",
      },
      {
        id: "VIL-207",
        name: "Ruby Hills",
        zone: "Zone X",
        ward: "Ward 10",
        dry: 0.5,
        wet: 0.78,
        mixed: 0.2,
        lastPickup: "Yesterday · 03:05 PM",
      },
      {
        id: "VIL-208",
        name: "Galaxy Greens",
        zone: "Zone X",
        ward: "Ward 11",
        dry: 0.53,
        wet: 0.81,
        mixed: 0.22,
        lastPickup: "Yesterday · 01:40 PM",
      },
      {
        id: "VIL-209",
        name: "Hillcrest Manor",
        zone: "Zone Y",
        ward: "Ward 12",
        dry: 0.59,
        wet: 0.9,
        mixed: 0.25,
        lastPickup: "Yesterday · 12:50 PM",
      },
      {
        id: "VIL-210",
        name: "Cedar Park",
        zone: "Zone A",
        ward: "Ward 2",
        dry: 0.61,
        wet: 0.92,
        mixed: 0.26,
        lastPickup: "Yesterday · 11:35 AM",
      },
    ],
  },
  Commercial: {
    "Theatre Waste": [
      {
        id: "TH-301",
        name: "Galaxy Cinemas",
        zone: "Zone A",
        ward: "Ward 1",
        dry: 1.1,
        wet: 0.6,
        mixed: 0.3,
        lastPickup: "Today · 07:15 AM",
      },
      {
        id: "TH-302",
        name: "Starplex",
        zone: "Zone A",
        ward: "Ward 2",
        dry: 1.05,
        wet: 0.55,
        mixed: 0.28,
        lastPickup: "Today · 06:45 AM",
      },
      {
        id: "TH-303",
        name: "Metro Screens",
        zone: "Zone B",
        ward: "Ward 4",
        dry: 0.98,
        wet: 0.5,
        mixed: 0.25,
        lastPickup: "Today · 06:05 AM",
      },
      {
        id: "TH-304",
        name: "Regal Theatres",
        zone: "Zone B",
        ward: "Ward 5",
        dry: 1.15,
        wet: 0.62,
        mixed: 0.33,
        lastPickup: "Yesterday · 08:20 PM",
      },
      {
        id: "TH-305",
        name: "Studio Drive-In",
        zone: "Zone C",
        ward: "Ward 6",
        dry: 0.9,
        wet: 0.48,
        mixed: 0.22,
        lastPickup: "Yesterday · 07:15 PM",
      },
      {
        id: "TH-306",
        name: "Grand Playhouse",
        zone: "Zone C",
        ward: "Ward 7",
        dry: 0.96,
        wet: 0.5,
        mixed: 0.24,
        lastPickup: "Yesterday · 06:25 PM",
      },
      {
        id: "TH-307",
        name: "Liberty Screens",
        zone: "Zone C",
        ward: "Ward 8",
        dry: 1.02,
        wet: 0.57,
        mixed: 0.29,
        lastPickup: "Yesterday · 05:30 PM",
      },
      {
        id: "TH-308",
        name: "Sunset Plaza Cinema",
        zone: "Zone X",
        ward: "Ward 10",
        dry: 0.88,
        wet: 0.46,
        mixed: 0.21,
        lastPickup: "Yesterday · 04:30 PM",
      },
      {
        id: "TH-309",
        name: "Citylight Multiplex",
        zone: "Zone X",
        ward: "Ward 11",
        dry: 0.93,
        wet: 0.5,
        mixed: 0.23,
        lastPickup: "Yesterday · 03:20 PM",
      },
      {
        id: "TH-310",
        name: "Velvet Cinema",
        zone: "Zone Y",
        ward: "Ward 12",
        dry: 0.99,
        wet: 0.52,
        mixed: 0.25,
        lastPickup: "Yesterday · 02:00 PM",
      },
    ],
    "Medical Waste": [
      {
        id: "MED-401",
        name: "CityCare Hospital",
        zone: "Zone A",
        ward: "Ward 3",
        dry: 0.4,
        wet: 1.5,
        mixed: 0.2,
        lastPickup: "Today · 07:30 AM",
      },
      {
        id: "MED-402",
        name: "Sunrise Diagnostics",
        zone: "Zone B",
        ward: "Ward 4",
        dry: 0.35,
        wet: 1.3,
        mixed: 0.18,
        lastPickup: "Today · 06:50 AM",
      },
      {
        id: "MED-403",
        name: "North Medical Center",
        zone: "Zone B",
        ward: "Ward 5",
        dry: 0.38,
        wet: 1.4,
        mixed: 0.2,
        lastPickup: "Today · 06:25 AM",
      },
      {
        id: "MED-404",
        name: "Green Cross Clinic",
        zone: "Zone C",
        ward: "Ward 6",
        dry: 0.33,
        wet: 1.2,
        mixed: 0.17,
        lastPickup: "Yesterday · 08:00 PM",
      },
      {
        id: "MED-405",
        name: "Starlight Medical",
        zone: "Zone C",
        ward: "Ward 7",
        dry: 0.36,
        wet: 1.3,
        mixed: 0.18,
        lastPickup: "Yesterday · 07:10 PM",
      },
      {
        id: "MED-406",
        name: "Wellness Labs",
        zone: "Zone C",
        ward: "Ward 8",
        dry: 0.34,
        wet: 1.25,
        mixed: 0.19,
        lastPickup: "Yesterday · 06:05 PM",
      },
      {
        id: "MED-407",
        name: "Central Cancer Care",
        zone: "Zone X",
        ward: "Ward 10",
        dry: 0.42,
        wet: 1.55,
        mixed: 0.22,
        lastPickup: "Yesterday · 04:50 PM",
      },
      {
        id: "MED-408",
        name: "Pulse Heart Center",
        zone: "Zone X",
        ward: "Ward 11",
        dry: 0.39,
        wet: 1.45,
        mixed: 0.2,
        lastPickup: "Yesterday · 03:30 PM",
      },
      {
        id: "MED-409",
        name: "Lotus Children Hospital",
        zone: "Zone Y",
        ward: "Ward 12",
        dry: 0.37,
        wet: 1.4,
        mixed: 0.19,
        lastPickup: "Yesterday · 02:25 PM",
      },
      {
        id: "MED-410",
        name: "Grace Geriatric Care",
        zone: "Zone A",
        ward: "Ward 2",
        dry: 0.35,
        wet: 1.32,
        mixed: 0.18,
        lastPickup: "Yesterday · 01:15 PM",
      },
    ],
  },
};
const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};


// ------------------------- MAIN COMPONENT -------------------------
export default function WasteCollection() {
  // Core data states
  const [dailyData, setDailyData] = useState<DailyRow[]>(FALLBACK_DAILY_DATA);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>(
    FALLBACK_MONTHLY_STATS
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
    "flex items-center justify-between rounded-2xl p-6 shadow-lg border",
    isDarkMode
      ? "bg-slate-900/80 backdrop-blur border-slate-800 shadow-[0_35px_80px_rgba(2,6,23,0.65)]"
      : "bg-gradient-to-r from-white via-sky-50 to-slate-100 backdrop-blur border-slate-200 shadow-blue-100"
  );

  const tabsCardClass = cn(
    "border-0 shadow-xl",
    isDarkMode
      ? "bg-slate-900/70 border border-slate-800 text-slate-100"
      : "bg-white/85 backdrop-blur-sm text-slate-900 border border-slate-100"
  );

  const tableContainerClass = isDarkMode
    ? "rounded-xl overflow-hidden border border-slate-800 bg-slate-900/70 shadow-lg"
    : "rounded-xl overflow-hidden border shadow bg-white";

  const tableHeadClass = isDarkMode ? "bg-slate-900/60 text-slate-200" : "bg-slate-50";
  const tableRowHoverClass = isDarkMode ? "hover:bg-slate-800/60" : "hover:bg-slate-50";
  const paginationFooterClass = cn(
    "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border-t",
    isDarkMode ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-slate-50"
  );
  const paginationButtonClass = cn(
    "transition-colors",
    isDarkMode
      ? "bg-slate-900/40 border-slate-700 text-slate-200 hover:bg-slate-800/80"
      : ""
  );
  const paginationLabelClass = cn(
    "text-sm",
    isDarkMode ? "text-slate-300" : "text-slate-600"
  );

  // Zone → Ward → Property drilldown states
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zoneDialog, setZoneDialog] = useState(false);

  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [wardDialog, setWardDialog] = useState(false);

  const [property, setProperty] =
    useState<keyof typeof PROPERTY_OPTIONS>("All");
  const [subProperty, setSubProperty] = useState("All");
  const [selectedWasteType, setSelectedWasteType] =
    useState<WasteCategoryKey>("household");
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyPageSize, setDailyPageSize] = useState(10);
  const [dailyDateFilter, setDailyDateFilter] = useState("");

  // ---------------------- Fetch block (same as your old code) ----------------------
  useEffect(() => {
    const available = PROPERTY_OPTIONS[property];
    if (!available.includes(subProperty)) {
      setSubProperty(available[0] ?? "All");
    }
  }, [property, subProperty]);

  useEffect(() => {
    const today = new Date();
    const monthVal = today.toISOString().slice(0, 7);
    const primaryFromDate = `${monthVal}-01`;

    const load = async () => {
      const ok = await fetchWaste(primaryFromDate);
      if (!ok) await fetchWaste("2025-10-01");
    };

    load();
  }, []);

  const fetchWaste = async (fromDate: string) => {
    try {
      const params = new URLSearchParams({
        from_date: fromDate,
        key: WEIGHMENT_API_KEY,
      });

      const r = await fetch(`${WEIGHMENT_API_URL}?${params}`);
      console.log(r);
      if (!r.ok) throw new Error("Bad API Response");
      const data = await r.json();
      console.log(data);

      const rows: ApiWasteRow[] = Array.isArray(data?.data) ? data.data : [];
      if (!rows.length) return false;

      // Daily
      const formatted = rows
        .map((row) => {
          const wet = toTons(row.wet_weight);
          const dry = toTons(row.dry_weight);
          const mix = toTons(row.mix_weight);
          const total = row.total_net_weight
            ? toTons(row.total_net_weight)
            : wet + dry + mix;

          return {
            date: row.date ?? "",
            zone: data?.site ?? "All Zones",
            wet,
            dry,
            total,
            mix,
            target: Number((total * 1.05).toFixed(2)),
            households: Number(row.no_of_household ?? 0),
          };
        })
        .filter((r) => r.date)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      if (formatted.length) setDailyData(formatted);

      // Monthly
      const totals = rows.reduce(
        (a, r) => {
          a.wet += r.wet_weight ?? 0;
          a.dry += r.dry_weight ?? 0;
          a.mix += r.mix_weight ?? 0;
          a.total += r.total_net_weight ?? 0;
          return a;
        },
        { wet: 0, dry: 0, total: 0, mix: 0 }
      );

      const actDays =
        rows.filter((r) => Number(r.total_net_weight ?? 0) > 0).length ||
        rows.length ||
        1;

      setMonthlyStats([
        {
          month: formatMonthLabel(fromDate),
          wet: toTons(totals.wet),
          dry: toTons(totals.dry),
          mix: toTons(totals.mix),
          total: toTons(totals.total),
          avgDaily: toTons(totals.total / actDays),
        },
      ]);

      return true;
    } catch {
      return false;
    }
  };

  const wardBaseData = useMemo(() => {
    if (!selectedZone || !selectedWard) return null;
    return WARD_WASTE_SUMMARY[selectedZone]?.[selectedWard] ?? null;
  }, [selectedZone, selectedWard]);

  const wardWasteData = wardBaseData;

  const getZonePieChartData = (
    zoneName?: string
  ): ChartData<"pie", number[], string> => {
    const summary = zoneName
      ? ZONE_WASTE_SUMMARY[zoneName]
      : Object.values(ZONE_WASTE_SUMMARY).reduce(
        (acc, zone) => {
          acc.household += zone.household;
          acc.ewaste += zone.ewaste;
          acc.medical += zone.medical;
          return acc;
        },
        { household: 0, ewaste: 0, medical: 0 }
      );

    return {
      labels: ["Household Waste", "E-Waste", "Medical Waste"],
      datasets: [
        {
          data: [
            summary?.household ?? 0,
            summary?.ewaste ?? 0,
            summary?.medical ?? 0,
          ],
          backgroundColor: ["#60A5FA", "#F59E0B", "#EF4444"],
          hoverBackgroundColor: ["#3B82F6", "#D97706", "#DC2626"],
        },
      ],
    };
  };

  const getWardPieChartData = (
    wardData?: WardWasteMap | null
  ): ChartData<"pie", number[], string> => {
    const data = wardData
      ? [
        wardData.household.total,
        wardData.ewaste.total,
        wardData.medical.total,
      ]
      : [0, 0, 0];

    return {
      labels: ["Household Waste", "E-Waste", "Medical Waste"],
      datasets: [
        {
          data,
          backgroundColor: ["#60A5FA", "#F59E0B", "#EF4444"],
          hoverBackgroundColor: ["#3B82F6", "#D97706", "#DC2626"],
        },
      ],
    };
  };

  const computeZoneTotals = (zoneName: string) => {
    const summary = ZONE_WASTE_SUMMARY[zoneName];
    if (!summary) return 0;
    return summary.household + summary.ewaste + summary.medical;
  };

  const wardPieData = useMemo(
    () => getWardPieChartData(wardWasteData),
    [wardWasteData]
  );

  const selectedWardBreakdown =
    wardWasteData && selectedWasteType
      ? wardWasteData[selectedWasteType]
      : null;

  const propertyDescriptor =
    property === "All" ? "All Properties" : `${property} - ${subProperty}`;

  const zonePieData = useMemo(
    () => getZonePieChartData(selectedZone ?? undefined),
    [selectedZone]
  );

  const zoneTotalDisplay = selectedZone
    ? formatTons(computeZoneTotals(selectedZone))
    : formatTons(0);

  const propertyRecords = useMemo(() => {
    const data =
      PROPERTY_COLLECTION_DATA[property]?.[subProperty] ??
      PROPERTY_COLLECTION_DATA.All?.All ??
      [];
    return data.slice(0, 10);
  }, [property, subProperty]);

  const handleWardSelection = (ward: string) => {
    setSelectedWard(ward);
    setSelectedWasteType("household");
    setProperty("All");
    setSubProperty("All");
    setZoneDialog(false);
    setWardDialog(true);
  };

  // Latest KPI hooks
  // const latestEntry = useMemo(
  //   () => (dailyData.length ? dailyData[0] : null),
  //   [dailyData]
  // );
  const monthStat = useMemo(
    () => (monthlyStats.length ? monthlyStats[0] : null),
    [monthlyStats]
  );
  const filteredDailyData = useMemo(() => {
    if (!dailyDateFilter) return dailyData;
    return dailyData.filter(
      (row) => row.date.slice(0, 10) === dailyDateFilter
    );
  }, [dailyData, dailyDateFilter]);

  const totalDailyPages = Math.max(
    1,
    Math.ceil(filteredDailyData.length / dailyPageSize)
  );

  const paginatedDailyData = useMemo(() => {
    const start = (dailyPage - 1) * dailyPageSize;
    return filteredDailyData.slice(start, start + dailyPageSize);
  }, [filteredDailyData, dailyPage, dailyPageSize]);

  useEffect(() => {
    setDailyPage(1);
  }, [dailyPageSize, dailyDateFilter]);
  const latestEntry = useMemo(
    () => (dailyData.length ? dailyData[0] : null),
    [dailyData]
  );
  const yesterdayEntry = useMemo(() => {
    const yesterday = getYesterdayISO();
    return (
      dailyData.find(
        (row) => row.date.slice(0, 10) === yesterday
      ) || null
    );
  }, [dailyData]);



  // -----------------------------------------------------------------------
  // ---------------------------- RENDER START ------------------------------
  // -----------------------------------------------------------------------
  return (
    <div className={pageBgClass}>
      <div className="space-y-6">
        {/* Header */}
        <div className={heroPanelClass}>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Waste Collection Dashboard
            </h2>
            <p className={cn("mt-2 text-lg", isDarkMode ? "text-slate-300" : "text-slate-600")}>
              Real-time tracking and analytics for waste management
            </p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white shadow-lg">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* KPI GRID */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* TODAY TOTAL */}
          <Card className="border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-indigo-100 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-sky-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 shadow-lg shadow-sky-200 dark:shadow-slate-900/50 hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-semibold text-sky-600 dark:text-sky-200">
                Today's Collection
              </CardTitle>
              <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded-lg">
                <Trash2 className="h-5 w-5 text-sky-600 dark:text-sky-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {yesterdayEntry ? formatTons(yesterdayEntry.total) : "--"}
              </div>

            </CardContent>
          </Card>

          {/* WET */}
          <Card className="border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 shadow-lg shadow-emerald-200 dark:shadow-slate-900/50 hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-200">Wet Waste</CardTitle>
              <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded-lg">
                <Droplets className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {yesterdayEntry ? formatTons(yesterdayEntry.wet) : "--"}
              </div>

            </CardContent>
          </Card>

          {/* DRY */}
          <Card className="border border-rose-200 bg-gradient-to-br from-white via-rose-50 to-rose-100 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 shadow-lg shadow-rose-200 dark:shadow-slate-900/50 hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-semibold text-rose-600 dark:text-rose-200">Dry Waste</CardTitle>
              <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded-lg">
                <Recycle className="h-5 w-5 text-rose-600 dark:text-rose-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {yesterdayEntry ? formatTons(yesterdayEntry.dry) : "--"}
              </div>

            </CardContent>
          </Card>
          <Card className="border border-purple-200 bg-gradient-to-br from-white via-purple-50 to-purple-100 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 shadow-lg shadow-purple-200 dark:shadow-slate-900/50 hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-semibold text-purple-600 dark:text-purple-200">Mixed Waste</CardTitle>
              <div className="p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg">
                <Recycle className="h-5 w-5 text-purple-600 dark:text-purple-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {yesterdayEntry ? formatTons(yesterdayEntry.mix) : "--"}
              </div>

            </CardContent>
          </Card>

          {/* MONTHLY */}
          <Card className="border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-amber-100 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 shadow-lg shadow-amber-200 dark:shadow-slate-900/50 hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-200">
                Monthly Total
              </CardTitle>
              <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {monthStat ? formatTons(monthStat.total) : "401 Tons"}
              </div>
            </CardContent>
          </Card>

          {/* HOUSEHOLDS */}
          {/* <Card className="border-0 bg-gradient-to-br from-[#FBCFE8] to-[#F9A8D4] text-white shadow-md hover:-translate-y-1 transition-all">
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm text-white/90">
                Households
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Home className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestEntry ? latestEntry.households.toLocaleString() : "0"}
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* TABS SECTION */}
        <Card className={tabsCardClass}>
          <Tabs defaultValue="daily" className="p-6">
            <TabsList
              className={cn(
                "grid w-full grid-cols-3 p-1 rounded-xl",
                isDarkMode ? "bg-slate-900/60" : "bg-slate-100"
              )}
            >
              <TabsTrigger
                value="daily"
                className={cn(
                  "rounded-lg transition-colors",
                  isDarkMode
                    ? "text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                    : "text-slate-600 data-[state=active]:bg-white"
                )}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Daily Data
              </TabsTrigger>

              <TabsTrigger
                value="monthly"
                className={cn(
                  "rounded-lg transition-colors",
                  isDarkMode
                    ? "text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                    : "text-slate-600 data-[state=active]:bg-white"
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Monthly Summary
              </TabsTrigger>

              <TabsTrigger
                value="zone"
                className={cn(
                  "rounded-lg transition-colors",
                  isDarkMode
                    ? "text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                    : "text-slate-600 data-[state=active]:bg-white"
                )}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Zone Analysis
              </TabsTrigger>
            </TabsList>

            {/* ---------------- DAILY ---------------- */}
            <TabsContent value="daily" className="mt-6">
              <div className="space-y-4">
                {/* Header + Date Filter */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      Daily Collection Records
                    </h3>
                    <p className="text-slate-600">
                      Comprehensive waste collection performance metrics
                    </p>
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2">
                    {/* <Calendar className="h-4 w-4 text-slate-500" /> */}
                    <Input
                      type="date"
                      value={dailyDateFilter}
                      onChange={(e) => setDailyDateFilter(e.target.value)}
                      className="w-44"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className={tableContainerClass}>
                  <Table>
                    <TableHeader>
                      <TableRow className={tableHeadClass}>
                        <TableHead>Date</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Wet (Tons)</TableHead>
                        <TableHead>Dry (Tons)</TableHead>
                        <TableHead>Mix (Tons)</TableHead>
                        <TableHead>Total (Tons)</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedDailyData.map((row, index) => (
                        <TableRow key={index} className={tableRowHoverClass}>
                          <TableCell>
                            {new Date(row.date).toLocaleDateString("en-US")}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={isDarkMode ? "border-slate-600 text-slate-200" : undefined}
                            >
                              {row.zone}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-bold text-emerald-700">
                            {row.wet.toFixed(1)}
                          </TableCell>

                          <TableCell className="font-bold text-sky-700">
                            {row.dry.toFixed(1)}
                          </TableCell>

                          <TableCell className="font-bold text-sky-700">
                            {row.mix.toFixed(1)}
                          </TableCell>

                          <TableCell className="font-bold text-indigo-700">
                            {row.total.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Footer */}
                  <div className={paginationFooterClass}>
                    {/* Rows per page */}
                    <div className="flex items-center gap-2 text-sm">
                      <span>Rows per page</span>
                      <Select
                        value={String(dailyPageSize)}
                        onValueChange={(v) => setDailyPageSize(Number(v))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 20, 50].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={dailyPage === 1}
                        onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                        className={paginationButtonClass}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className={paginationLabelClass}>
                        Page {dailyPage} of {totalDailyPages}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={dailyPage >= totalDailyPages}
                        onClick={() =>
                          setDailyPage((p) => Math.min(totalDailyPages, p + 1))
                        }
                        className={paginationButtonClass}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>


            {/* ---------------- MONTHLY ---------------- */}
            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Monthly Summary</h3>

                <div className={tableContainerClass}>
                  <Table>
                    <TableHeader>
                      <TableRow className={tableHeadClass}>
                        <TableHead>Month</TableHead>
                        <TableHead>Wet (Tons)</TableHead>
                        <TableHead>Dry (Tons)</TableHead>
                        <TableHead>Mix (Tons)</TableHead>
                        <TableHead>Total (Tons)</TableHead>
                        <TableHead>Avg Daily</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {monthlyStats.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell>{row.wet.toFixed(1)}</TableCell>
                          <TableCell>{row.dry.toFixed(1)}</TableCell>
                          <TableCell>{row.mix.toFixed(1)}</TableCell>
                          <TableCell>{row.total.toFixed(1)}</TableCell>
                          <TableCell>{row.avgDaily.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ---------------- ZONE ANALYSIS (NEW FULL UI) ---------------- */}
            <TabsContent value="zone" className="mt-6">
              <div className="space-y-6">
                {/* City Dropdown */}
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold">Zone Analysis</h3>

                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CITY_DATA).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                  {Object.keys(CITY_DATA[selectedCity].zones).map((zone) => (
                    <Card
                      key={zone}
                      onClick={() => {
                        setSelectedZone(zone);
                        setSelectedWard(null);
                        setSelectedWasteType("household");
                        setProperty("All");
                        setSubProperty("All");
                        setWardDialog(false);
                        setZoneDialog(true);
                      }}
                      className={cn(
                        "cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all",
                        isDarkMode
                          ? "bg-slate-900/70 border border-slate-800 text-slate-100"
                          : "bg-indigo-50"
                      )}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" /> {zone}
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        <div className="flex justify-between">
                          <span>Total Collected</span>
                          <span className="font-bold">
                            {formatTons(computeZoneTotals(zone))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* DIALOG 1 — WARDS */}
                <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
                  <DialogContent
                    className={cn(
                      "h-[700px] overflow-y-auto lg:max-w-7xl",
                      isDarkMode ? "bg-slate-950 text-slate-100" : ""
                    )}
                  >
                    <DialogHeader>
                      <DialogTitle>
                        <button
                          className="flex items-center gap-2 mb-2 text-sm text-slate-500"
                          onClick={() => setZoneDialog(false)}
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        Zone: {selectedZone}
                      </DialogTitle>
                    </DialogHeader>

                    {/* -------------------- PIE CHART -------------------- */}
                    <div
                      className={cn(
                        "rounded-xl p-4 shadow border mb-6",
                        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white"
                      )}
                    >
                      <h3 className="text-lg font-semibold mb-4 text-center">
                        Total Waste Summary for {selectedZone}
                      </h3>

                      <div className="w-full flex items-center justify-center gap-6">
                        <div className="h-64 w-64">
                          <Pie data={zonePieData} />
                        </div>
                      </div>
                      <div className=" items-center justify-center mt-4 flex">
                        <div className="flex justify-between w-48">
                          <span>Total Collected</span>
                          <span className="font-bold">{zoneTotalDisplay}</span>
                        </div>
                      </div>
                    </div>

                    {/* -------------------- WARD LIST -------------------- */}
                    <div className="space-y-3">
                      {selectedZone &&
                        CITY_DATA[selectedCity].zones[selectedZone].map(
                          (ward) => (
                            <Button
                              key={ward}
                              variant="outline"
                              className={cn(
                                "w-full justify-between",
                                isDarkMode
                                  ? "border-slate-700 text-slate-100 hover:bg-slate-900/60"
                                  : undefined
                              )}
                              onClick={() => handleWardSelection(ward)}
                            >
                              {ward}
                              <Home className="h-4 w-4 text-slate-500" />
                            </Button>
                          )
                        )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* DIALOG 2 — WARD VIEW */}
                <Dialog open={wardDialog} onOpenChange={setWardDialog}>
                  <DialogContent
                    className={cn(
                      "h-[700px]  overflow-y-auto lg:max-w-7xl",
                      isDarkMode ? "bg-slate-950 text-slate-100" : ""
                    )}
                  >
                    <DialogHeader>
                      <DialogTitle>
                        <button
                          className="flex items-center gap-2 mb-2 text-sm text-slate-500"
                          onClick={() => {
                            setWardDialog(false);
                            setZoneDialog(true);
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        Ward: {selectedWard}
                      </DialogTitle>
                    </DialogHeader>

                    {selectedWard ? (
                      <div className="space-y-6">
                        <div
                          className={cn(
                            "rounded-xl p-4 shadow border",
                            isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white"
                          )}
                        >
                          <h3 className="text-lg font-semibold mb-4 text-center">
                            Ward Waste Mix · {selectedWard}
                          </h3>
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-64 w-64">
                              <Pie data={wardPieData} />
                            </div>
                            <div className="flex gap-6 text-sm">
                              {WASTE_CATEGORY_KEYS.map((key) => (
                                <div key={key} className="text-center">
                                  <p className="text-slate-500">
                                    {WASTE_CATEGORY_META[key].label}
                                  </p>
                                  <p className="font-bold">
                                    {formatTons(
                                      wardWasteData
                                        ? wardWasteData[key].total
                                        : 0
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* <div className="grid gap-4 md:grid-cols-3">
                          {WASTE_CATEGORY_KEYS.map((key) => {
                            const meta = WASTE_CATEGORY_META[key];
                            const total = wardWasteData
                              ? wardWasteData[key].total
                              : 0;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedWasteType(key)}
                                className={`rounded-xl p-4 text-left border shadow-sm bg-gradient-to-br ${meta.gradient} ${
                                  selectedWasteType === key
                                    ? "ring-2 ring-indigo-500"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  {meta.icon}
                                  <div>
                                    <p className="font-semibold">
                                      {meta.label}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {meta.description}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-lg font-bold">
                                  {formatTons(total)}
                                </p>
                              </button>
                            );
                          })}
                        </div> */}
                        {/* 
                        <Card className="border shadow-sm">
                          <CardHeader>
                            <CardTitle>
                              {WASTE_CATEGORY_META[selectedWasteType].label}{" "}
                              Breakdown
                            </CardTitle>
                            <CardDescription>
                              {selectedWard} · {propertyDescriptor}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {selectedWardBreakdown ? (
                              Object.entries(
                                selectedWardBreakdown.breakdown
                              ).map(([label, value]) => {
                                const percent = selectedWardBreakdown.total
                                  ? Math.round(
                                      (value / selectedWardBreakdown.total) *
                                        100
                                    )
                                  : 0;
                                return (
                                  <div key={label} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-slate-600">
                                      <span>{label}</span>
                                      <span>
                                        {value.toFixed(2)} Tons · {percent}%
                                      </span>
                                    </div>
                                    <Progress value={percent} className="h-2" />
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-slate-500 text-sm">
                                No breakdown data available.
                              </p>
                            )}
                          </CardContent>
                        </Card> */}

                        <Card className="border shadow-sm">
                          <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                              <div>
                                <CardTitle>
                                  Collection Runs · {propertyDescriptor}
                                </CardTitle>
                                <CardDescription>
                                  Latest 10 pickups tagged to{" "}
                                  {property === "All"
                                    ? "all property types"
                                    : `${subProperty} (${property})`}
                                </CardDescription>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <Label>Property</Label>
                                  <Select
                                    value={property}
                                    onValueChange={(v) =>
                                      setProperty(
                                        v as keyof typeof PROPERTY_OPTIONS
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Property" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(
                                        Object.keys(
                                          PROPERTY_OPTIONS
                                        ) as Array<
                                          keyof typeof PROPERTY_OPTIONS
                                        >
                                      ).map((p) => (
                                        <SelectItem key={p} value={p}>
                                          {p}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Subproperty</Label>
                                  <Select
                                    value={subProperty}
                                    onValueChange={(v) => setSubProperty(v)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Subproperty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PROPERTY_OPTIONS[property].map((sp) => (
                                        <SelectItem key={sp} value={sp}>
                                          {sp}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="rounded-xl border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className={tableHeadClass}>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Dry</TableHead>
                                    <TableHead>Wet</TableHead>
                                    <TableHead>Mixed</TableHead>
                                    <TableHead>Last Pickup</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {propertyRecords.map((record) => (
                                    <TableRow key={record.id} className={tableRowHoverClass}>
                                      <TableCell className="font-semibold">
                                        {record.id}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span>{record.name}</span>
                                          <span className="text-xs text-slate-500">
                                            {record.zone} · {record.ward}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {record.dry.toFixed(2)} t
                                      </TableCell>
                                      <TableCell>
                                        {record.wet.toFixed(2)} t
                                      </TableCell>
                                      <TableCell>
                                        {record.mixed.toFixed(2)} t
                                      </TableCell>
                                      <TableCell
                                        className={cn(
                                          "text-sm",
                                          isDarkMode ? "text-slate-300" : "text-slate-600"
                                        )}
                                      >
                                        {record.lastPickup}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <p className="text-center text-slate-500">
                        Select a ward to view detailed information.
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
