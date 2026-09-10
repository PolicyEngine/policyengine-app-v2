import { useEffect, useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import ProvisionList from '@/components/flagship/ProvisionList';
import { Progress, Spinner, Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { formatElapsed, ReportStage } from '@/libs/flagship/reportStages';
import type { RunReportProvision } from '@/libs/flagship/runReport';

/**
 * The flagship report while its society-wide run is in progress: the
 * reform it is scoring, a stage list driven by the real state of the
 * run, and the validation cards below as they arrive. Sections that
 * need results (economic impacts, districts, household) wait until
 * there are results, instead of rendering placeholders.
 */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      style={{
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      {children}
    </Stack>
  );
}

function StageMark({ state }: { state: ReportStage['state'] }) {
  const size = 18;
  if (state === 'done') {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: colors.primary[50],
          color: colors.primary[700],
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconCheck size={12} stroke={3} />
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0 }}>
        <Spinner size="sm" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `1.5px solid ${colors.border.light}`,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

/** Seconds since mount, ticking, for the status line. */
function useElapsed(): number {
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(started);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now - started;
}

export function ReportComputingScreen({
  title,
  sourceNote,
  baselineLine,
  provisions,
  stages,
  progress,
  children,
}: {
  title: string;
  sourceNote?: string;
  /** e.g. "Baseline: current law · 2026 · United States (nationwide)" */
  baselineLine: string;
  /** null while the reform is still loading */
  provisions: RunReportProvision[] | null;
  stages: ReportStage[];
  /** 0–100 for the run stage, when the calculation reports it. */
  progress?: number;
  /** The validation section, rendered below once it has something to say. */
  children?: React.ReactNode;
}) {
  const elapsed = useElapsed();
  const active = stages.find((stage) => stage.state === 'active');

  return (
    <Stack style={{ maxWidth: 1080, margin: '0 auto', gap: spacing.xl }}>
      <Stack style={{ gap: spacing.xs }}>
        <Stack
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <Title order={1} style={{ margin: 0 }}>
            {title}
          </Title>
          {sourceNote && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {sourceNote}
            </Text>
          )}
        </Stack>
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {baselineLine}
        </Text>
      </Stack>

      <Card>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
          }}
        >
          What this report scores
        </Text>
        {provisions === null ? (
          <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Spinner size="sm" />
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              Loading the reform…
            </Text>
          </Stack>
        ) : provisions.length > 0 ? (
          <ProvisionList provisions={provisions} />
        ) : (
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            Provision detail is unavailable for this report.
          </Text>
        )}
      </Card>

      <Card>
        <Stack style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            {active ? active.label : 'Finishing up'}
          </Text>
          <Text
            style={{
              marginLeft: 'auto',
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatElapsed(elapsed)}
            {typeof progress === 'number' && active?.id === 'run'
              ? ` · ${Math.round(progress)}%`
              : ''}
          </Text>
        </Stack>
        {typeof progress === 'number' && active?.id === 'run' && (
          <Progress value={progress} className="tw:h-1.5" />
        )}
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {stages.map((stage) => (
            <li
              key={stage.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.sm,
                padding: `${spacing.xs} 0`,
              }}
            >
              <StageMark state={stage.state} />
              <Stack style={{ gap: 2 }}>
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: stage.state === 'pending' ? colors.text.secondary : colors.text.primary,
                    fontWeight:
                      stage.state === 'active'
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                  }}
                >
                  {stage.label}
                </Text>
                {stage.detail && (
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    {stage.detail}
                  </Text>
                )}
              </Stack>
            </li>
          ))}
        </ol>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Budgetary impact, distribution by income decile, winners and losers, and poverty appear
          when the run finishes, usually within a few minutes. The data checks are ready sooner and
          show below as they complete.
        </Text>
      </Card>

      {children}
    </Stack>
  );
}

/** A link this browser cannot resolve: the report id belongs to another browser's local records. */
export function ReportUnresolvable() {
  return (
    <Card>
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
        }}
      >
        This link only opens in the browser that ran the report.
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        It carries a local report id. Reports run from now on carry a shareable id in their link;
        ask for the link again from the browser that created this one, or run the reform afresh from
        Build.
      </Text>
    </Card>
  );
}
