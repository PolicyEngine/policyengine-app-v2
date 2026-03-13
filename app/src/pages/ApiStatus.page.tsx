import { IconAlertTriangle, IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { Alert, AlertDescription, AlertTitle, Spinner, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { DayRecord, DayStatus, MonitorData, MonitorStatus, StatusPageData } from '@/types/betterstack';

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

const DAY_STATUS_COLORS: Record<DayStatus, string> = {
  operational: colors.primary[500],
  degraded: colors.warning,
  down: colors.error,
  'no-data': colors.gray[200],
};

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
            title={`${day.date}: ${day.status}`}
            style={{
              flex: 1,
              backgroundColor: DAY_STATUS_COLORS[day.status],
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
  const items: { label: string; color: string }[] = [
    { label: 'Operational', color: DAY_STATUS_COLORS.operational },
    { label: 'Degraded', color: DAY_STATUS_COLORS.degraded },
    { label: 'Down', color: DAY_STATUS_COLORS.down },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.lg,
        justifyContent: 'center',
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: item.color,
            }}
          />
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            {item.label}
          </Text>
        </div>
      ))}
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
