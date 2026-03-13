import type { VercelRequest, VercelResponse } from '@vercel/node';

const BETTERSTACK_BASE = 'https://uptime.betterstack.com';
const DAYS_WINDOW = 90;

type DayStatus = 'operational' | 'degraded' | 'down' | 'no-data';

interface DayRecord {
  date: string;
  status: DayStatus;
  downtimeMinutes: number;
}

interface MonitorResult {
  id: string;
  name: string;
  url: string;
  status: string;
  lastCheckedAt: string;
  availability: number;
  totalDowntime: number;
  numberOfIncidents: number;
  days: DayRecord[];
}

function getDateRange(): { from: string; to: string; dates: string[] } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (DAYS_WINDOW - 1));

  const dates: string[] = [];
  for (let i = 0; i < DAYS_WINDOW; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
    dates,
  };
}

async function fetchBetterStack(path: string, token: string): Promise<any> {
  const url = `${BETTERSTACK_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`BetterStack API error: ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json();
}

async function fetchAllIncidents(
  monitorId: string,
  from: string,
  to: string,
  token: string,
): Promise<any[]> {
  const incidents: any[] = [];
  let url: string | null =
    `/api/v3/incidents?monitor_id=${monitorId}&from=${from}&to=${to}&per_page=50`;

  while (url) {
    const data = await fetchBetterStack(url, token);
    if (data.data) {
      incidents.push(...data.data);
    }
    // Handle pagination
    url = data.pagination?.next
      ? data.pagination.next.replace(BETTERSTACK_BASE, '')
      : null;
  }

  return incidents;
}

function computeDayStatuses(
  dates: string[],
  incidents: any[],
  monitorCreatedAt: string,
): DayRecord[] {
  const createdDate = monitorCreatedAt.split('T')[0];

  return dates.map((dateStr) => {
    if (dateStr < createdDate) {
      return { date: dateStr, status: 'no-data' as DayStatus, downtimeMinutes: 0 };
    }

    const dayStart = new Date(`${dateStr}T00:00:00Z`).getTime();
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`).getTime();

    let totalOutageMs = 0;

    for (const incident of incidents) {
      const incStart = new Date(incident.attributes.started_at).getTime();
      const incEnd = incident.attributes.resolved_at
        ? new Date(incident.attributes.resolved_at).getTime()
        : Date.now();

      // Check overlap with this day
      const overlapStart = Math.max(incStart, dayStart);
      const overlapEnd = Math.min(incEnd, dayEnd);

      if (overlapStart < overlapEnd) {
        totalOutageMs += overlapEnd - overlapStart;
      }
    }

    const downtimeMinutes = totalOutageMs / 1000 / 60;

    let status: DayStatus = 'operational';
    if (downtimeMinutes > 60) status = 'down';
    else if (downtimeMinutes > 0) status = 'degraded';

    return { date: dateStr, status, downtimeMinutes };
  });
}

async function fetchMonitorData(
  monitorId: string,
  from: string,
  to: string,
  dates: string[],
  token: string,
): Promise<MonitorResult> {
  const [monitorRes, slaRes, incidents] = await Promise.all([
    fetchBetterStack(`/api/v2/monitors/${monitorId}`, token),
    fetchBetterStack(`/api/v2/monitors/${monitorId}/sla?from=${from}&to=${to}`, token),
    fetchAllIncidents(monitorId, from, to, token),
  ]);

  const attrs = monitorRes.data.attributes;
  const days = computeDayStatuses(dates, incidents, attrs.created_at);

  return {
    id: monitorRes.data.id,
    name: attrs.pronounceable_name || attrs.url,
    url: attrs.url,
    status: attrs.status,
    lastCheckedAt: attrs.last_checked_at,
    availability: slaRes.data?.attributes?.availability ?? 0,
    totalDowntime: slaRes.data?.attributes?.total_downtime ?? 0,
    numberOfIncidents: slaRes.data?.attributes?.number_of_incidents ?? 0,
    days,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BETTERSTACK_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BetterStack API token not configured' });
  }

  const monitorsParam = req.query.monitors;
  if (!monitorsParam || typeof monitorsParam !== 'string') {
    return res.status(400).json({ error: 'Missing monitors query parameter' });
  }

  const monitorIds = monitorsParam.split(',').filter(Boolean);
  if (monitorIds.length === 0) {
    return res.status(400).json({ error: 'No monitor IDs provided' });
  }

  try {
    const { from, to, dates } = getDateRange();

    const monitors = await Promise.all(
      monitorIds.map((id) => fetchMonitorData(id, from, to, dates, token)),
    );

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({
      monitors,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('BetterStack API error:', err);
    return res.status(502).json({ error: 'Failed to fetch status data' });
  }
}
