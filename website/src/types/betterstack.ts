export type MonitorStatus =
  | "up"
  | "down"
  | "paused"
  | "pending"
  | "maintenance"
  | "validating";

export type DayStatus = "operational" | "degraded" | "down" | "no-data";

export interface DayRecord {
  date: string;
  status: DayStatus;
  downtimeMinutes: number;
}

export interface MonitorData {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: string;
  availability: number;
  totalDowntime: number;
  numberOfIncidents: number;
  days: DayRecord[];
}

export interface StatusPageData {
  monitors: MonitorData[];
  fetchedAt: string;
}
