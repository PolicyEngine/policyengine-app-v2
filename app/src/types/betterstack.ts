export type MonitorStatus = 'up' | 'down' | 'paused' | 'pending' | 'maintenance' | 'validating';
export type DayStatus = 'operational' | 'degraded' | 'down' | 'no-data';

export interface DayRecord {
  date: string; // YYYY-MM-DD
  status: DayStatus;
}

export interface MonitorData {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: string;
  availability: number; // percentage, e.g. 99.95
  totalDowntime: number; // seconds
  numberOfIncidents: number;
  days: DayRecord[]; // 90 entries, oldest first
}

export interface StatusPageData {
  monitors: MonitorData[];
  fetchedAt: string;
}
