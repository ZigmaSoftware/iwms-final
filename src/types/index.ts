export interface VehicleData {
  vehicle_no: string;
  lat: number;
  lng: number;
  status: 'Running' | 'Idle' | 'Stopped' | 'Overspeeding';
  speed?: number;
  driver?: string;
}

export interface LocationData {
  country: string;
  state: string;
  city: string;
  zone: string;
  ward: string;
  vehicles: VehicleData[];
}

export interface KPIData {
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  icon?: string;
}

export interface ComplaintData {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  timestamp: string;
  year: string;
}

export interface ActivityData {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type ModuleType =
  | 'collection'
  | 'd2d'
  | 'resource'
  | 'weighbridge'
  | 'waste'
  | 'landfill'
  | 'grievance'
  | 'attendance'
  | 'asset';

export interface ModuleConfig {
  id: ModuleType;
  name: string;
  icon: string;
  color: string;
}
