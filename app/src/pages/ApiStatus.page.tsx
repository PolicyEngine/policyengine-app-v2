import { IconAlertTriangle, IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { Alert, AlertDescription, AlertTitle, Spinner, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { DayRecord, MonitorData, MonitorStatus, StatusPageData } from '@/types/betterstack';

const MONITOR_IDS = ['1160318', '4160084'];

// --- Status helpers ---

type AggregateStatus = 'operational' | 'degraded' | 'down';

function getAggregateStatus(monitors: MonitorData[]): AggregateStatus {
  if (monitors.some((m) => m.status === 'down')) return 'down';
  if (monitors.some((m) => m.status === 'maintenance' || m.status === 'validating'))
    return 'degraded';
  return 'operational';
}

const STATUS_CONFIG: Record<
  AggregateStatus,
  { label: string; bg: string; text: string; icon: typeof IconCircleCheck }
> = {
  operational: {
    label: 'All systems operational',
    bg: colors.primary[50],
    text: colors.primary[700],
    icon: IconCircleCheck,
  },
  degraded: {
    label: 'Some systems experiencing issues',
    bg: '#FEF9E7',
    text: '#92400E',
    icon: IconAlertTriangle,
  },
  down: {
    label: 'System outage detected',
    bg: '#FEF2F2',
    text: '#991B1B',
    icon: IconCircleX,
  },
};

// --- Continuous gradient color computation (Atlassian-style) ---

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: RGB): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

const COLOR_STOPS: RGB[] = [
  hexToRgb(colors.primary[500]), // green (operational)
  hexToRgb('#DBAB09'), // yellow
  hexToRgb('#E36209'), // orange
  hexToRgb(colors.error), // red
];

const NO_DATA_COLOR = colors.gray[200];

function colorForDay(day: DayRecord): string {
  if (day.status === 'no-data') return NO_DATA_COLOR;
  if (day.downtimeMinutes === 0) return rgbToHex(COLOR_STOPS[0]);

  // Linear interpolation across 3 bands: green→yellow (0-20), yellow→orange (20-40), orange→red (40-60)
  const minutes = Math.min(day.downtimeMinutes, 60);

  if (minutes <= 20) {
    const t = minutes / 20;
    return rgbToHex(lerpRgb(COLOR_STOPS[0], COLOR_STOPS[1], t));
  }
  if (minutes <= 40) {
    const t = (minutes - 20) / 20;
    return rgbToHex(lerpRgb(COLOR_STOPS[1], COLOR_STOPS[2], t));
  }
  const t = (minutes - 40) / 20;
  return rgbToHex(lerpRgb(COLOR_STOPS[2], COLOR_STOPS[3], t));
}

function formatMonitorStatus(status: MonitorStatus): { label: string; color: string } {
  if (status === 'up') return { label: 'Operational', color: colors.primary[500] };
  if (status === 'down') return { label: 'Down', color: colors.error };
  if (status === 'maintenance') return { label: 'Maintenance', color: colors.info };
  return { label: 'Unknown', color: colors.text.tertiary };
}

// --- Components ---

function AggregateStatusBanner({ monitors }: { monitors: MonitorData[] }) {
  const aggregate = getAggregateStatus(monitors);
  const config = STATUS_CONFIG[aggregate];
  const Icon = config.icon;

  return (
    <div
      style={{
        backgroundColor: config.bg,
        padding: spacing['2xl'],
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Icon size={28} color={config.text} />
        <span
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: config.text,
          }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

function UptimeBar({ days }: { days: DayRecord[] }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '2px',
          height: '32px',
          alignItems: 'stretch',
        }}
      >
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.downtimeMinutes > 0 ? `${Math.round(day.downtimeMinutes)}min downtime` : day.status}`}
            style={{
              flex: 1,
              backgroundColor: colorForDay(day),
              borderRadius: '2px',
              minWidth: '2px',
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: spacing.xs,
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          90 days ago
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          Today
        </Text>
      </div>
    </div>
  );
}

function MonitorRow({ monitor }: { monitor: MonitorData }) {
  const statusInfo = formatMonitorStatus(monitor.status);

  return (
    <div
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        padding: spacing['2xl'],
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <span
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: colors.text.primary,
            }}
          >
            {monitor.name}
          </span>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: statusInfo.color,
            }}
          >
            {statusInfo.label}
          </span>
        </div>
        <span
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
          }}
        >
          {monitor.availability.toFixed(2)}% uptime
        </span>
      </div>
      <UptimeBar days={monitor.days} />
    </div>
  );
}

function StatusLegend() {
  const gradientStops = COLOR_STOPS.map((rgb) => rgbToHex(rgb));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
      }}
    >
      <Text
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
        }}
      >
        No downtime
      </Text>
      <div
        style={{
          width: '120px',
          height: '12px',
          borderRadius: '2px',
          background: `linear-gradient(to right, ${gradientStops.join(', ')})`,
        }}
      />
      <Text
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
        }}
      >
        60+ min downtime
      </Text>
    </div>
  );
}

// --- Data fetching ---

function useStatusData(): {
  monitors: MonitorData[] | null;
  loading: boolean;
  error: string | null;
} {
  const [monitors, setMonitors] = useState<MonitorData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/betterstack?monitors=${MONITOR_IDS.join(',')}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch status data (${res.status})`);
        }
        const data: StatusPageData = await res.json();
        setMonitors(data.monitors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { monitors, loading, error };
}

// --- Page ---

export default function ApiStatusPage() {
  const { monitors, loading, error } = useStatusData();

  return (
    <StaticPageLayout title="API status">
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <HeroSection
          title="API status"
          description="Monitor the current status and availability of PolicyEngine API services."
        />

        {loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background.tertiary,
              padding: spacing['4xl'],
            }}
          >
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div
            style={{
              flex: 1,
              backgroundColor: colors.background.tertiary,
              padding: spacing['4xl'],
              paddingLeft: '6.125%',
              paddingRight: '6.125%',
            }}
          >
            <Alert variant="destructive">
              <AlertTitle>Unable to load status data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {monitors && (
          <div
            style={{
              flex: 1,
              backgroundColor: colors.background.tertiary,
              paddingTop: spacing['4xl'],
              paddingBottom: spacing['4xl'],
              paddingLeft: '6.125%',
              paddingRight: '6.125%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.lg,
              }}
            >
              <AggregateStatusBanner monitors={monitors} />
            </div>

            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
                color: colors.text.primary,
                marginTop: spacing['2xl'],
                marginBottom: spacing.sm,
              }}
            >
              Uptime over the past 90 days
            </Text>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.lg,
              }}
            >
              {monitors.map((monitor) => (
                <MonitorRow key={monitor.id} monitor={monitor} />
              ))}
            </div>

            <StatusLegend />
          </div>
        )}
      </div>
    </StaticPageLayout>
  );
}
