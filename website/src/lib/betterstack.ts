import type {
  DayRecord,
  DayStatus,
  MonitorData,
  MonitorStatus,
  StatusPageData,
} from "@/types/betterstack";

const BETTERSTACK_BASE = "https://uptime.betterstack.com";
const DAYS_WINDOW = 90;

interface BetterStackIncident {
  attributes: {
    started_at: string;
    resolved_at: string | null;
  };
}

interface BetterStackMonitorResponse {
  data: {
    id: string;
    attributes: {
      pronounceable_name: string | null;
      url: string;
      status: MonitorStatus;
      last_checked_at: string;
      created_at: string;
    };
  };
}

interface BetterStackSlaResponse {
  data?: {
    attributes?: {
      availability?: number;
      total_downtime?: number;
      number_of_incidents?: number;
    };
  };
}

interface BetterStackIncidentResponse {
  data?: BetterStackIncident[];
  pagination?: {
    next?: string | null;
  };
}

function getDateRange(now = new Date()): {
  from: string;
  to: string;
  dates: string[];
} {
  const today = new Date(now);
  const from = new Date(today);
  from.setDate(from.getDate() - (DAYS_WINDOW - 1));

  const dates: string[] = [];
  for (let i = 0; i < DAYS_WINDOW; i += 1) {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return {
    from: from.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
    dates,
  };
}

async function fetchBetterStack<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${BETTERSTACK_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `BetterStack API error: ${response.status} ${response.statusText} for ${path}`,
    );
  }

  return (await response.json()) as T;
}

async function fetchAllIncidents(
  monitorId: string,
  from: string,
  to: string,
  token: string,
): Promise<BetterStackIncident[]> {
  const incidents: BetterStackIncident[] = [];
  let path: string | null =
    `/api/v3/incidents?monitor_id=${monitorId}&from=${from}&to=${to}&per_page=50`;

  while (path) {
    const data: BetterStackIncidentResponse = await fetchBetterStack(path, token);
    if (data.data) {
      incidents.push(...data.data);
    }

    path = data.pagination?.next
      ? data.pagination.next.replace(BETTERSTACK_BASE, "")
      : null;
  }

  return incidents;
}

export function computeDayStatuses(
  dates: string[],
  incidents: BetterStackIncident[],
  monitorCreatedAt: string,
  nowMs = Date.now(),
): DayRecord[] {
  const createdDate = monitorCreatedAt.split("T")[0];

  return dates.map((dateStr) => {
    if (dateStr < createdDate) {
      return {
        date: dateStr,
        status: "no-data" as DayStatus,
        downtimeMinutes: 0,
      };
    }

    const dayStart = new Date(`${dateStr}T00:00:00Z`).getTime();
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`).getTime();
    let totalOutageMs = 0;

    for (const incident of incidents) {
      const incidentStart = new Date(incident.attributes.started_at).getTime();
      const incidentEnd = incident.attributes.resolved_at
        ? new Date(incident.attributes.resolved_at).getTime()
        : nowMs;

      const overlapStart = Math.max(incidentStart, dayStart);
      const overlapEnd = Math.min(incidentEnd, dayEnd);

      if (overlapStart < overlapEnd) {
        totalOutageMs += overlapEnd - overlapStart;
      }
    }

    const downtimeMinutes = totalOutageMs / 1000 / 60;

    let status: DayStatus = "operational";
    if (downtimeMinutes > 60) {
      status = "down";
    } else if (downtimeMinutes > 0) {
      status = "degraded";
    }

    return {
      date: dateStr,
      status,
      downtimeMinutes,
    };
  });
}

async function fetchMonitorData(
  monitorId: string,
  from: string,
  to: string,
  dates: string[],
  token: string,
): Promise<MonitorData> {
  const [monitorRes, slaRes, incidents] = await Promise.all([
    fetchBetterStack<BetterStackMonitorResponse>(`/api/v2/monitors/${monitorId}`, token),
    fetchBetterStack<BetterStackSlaResponse>(
      `/api/v2/monitors/${monitorId}/sla?from=${from}&to=${to}`,
      token,
    ),
    fetchAllIncidents(monitorId, from, to, token),
  ]);

  const attrs = monitorRes.data.attributes;

  return {
    id: monitorRes.data.id,
    name: attrs.pronounceable_name || attrs.url,
    url: attrs.url,
    status: attrs.status,
    lastCheckedAt: attrs.last_checked_at,
    availability: slaRes.data?.attributes?.availability ?? 0,
    totalDowntime: slaRes.data?.attributes?.total_downtime ?? 0,
    numberOfIncidents: slaRes.data?.attributes?.number_of_incidents ?? 0,
    days: computeDayStatuses(dates, incidents, attrs.created_at),
  };
}

export async function fetchStatusPageData(
  monitorIds: readonly string[],
): Promise<StatusPageData> {
  const token = process.env.BETTERSTACK_API_TOKEN;
  if (!token) {
    throw new Error("BetterStack API token not configured");
  }

  if (monitorIds.length === 0) {
    throw new Error("No monitor IDs provided");
  }

  const { from, to, dates } = getDateRange();
  const monitors = await Promise.all(
    monitorIds.map((monitorId) => fetchMonitorData(monitorId, from, to, dates, token)),
  );

  return {
    monitors,
    fetchedAt: new Date().toISOString(),
  };
}
