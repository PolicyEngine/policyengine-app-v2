import { useEffect, useState } from 'react';
import { Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  CalibrationMatches,
  calibrationMatchesForPaths,
  CalibrationRing,
  CalibrationTargetRow,
  dashboardTargetsUrl,
  geographyForRegion,
} from '@/libs/flagship/calibrationMatching';
import type { ReportValidationSnapshot } from '@/libs/flagship/reportValidation';
import {
  cardStyle,
  detailStyle,
  EvidenceHeader,
  EvidenceValues,
  linkStyle,
  panelStyle,
  summaryStyle,
} from './ValidationDisplay';

/**
 * The data-side validation surface for a report: which of the variables
 * this reform moves are calibration targets of the microdata, and how
 * well the current populace release fits them. Nearest variables first;
 * the interacted quantity within the mechanism is the one that bounds
 * the data-side bias of the estimate.
 */

export const RING_LABELS: Record<CalibrationRing, string> = {
  primary: 'Primary',
  mechanism: 'Mechanism',
  downstream: 'Downstream',
};

/** The dependency depth in words: 1 is a formula that reads the parameter itself. */
export function describeDepth(depth: number): string {
  if (depth <= 1) {
    return 'reads the parameter directly';
  }
  return `${depth} formula steps from the parameter`;
}

/** Above this the fit is worth calling out; the diagnostics skill's escalation bar. */
export const ATTENTION_ERROR = 0.25;

function percent(fraction: number): string {
  const value = fraction * 100;
  return `${Math.abs(value) >= 100 ? Math.round(value) : value.toFixed(1)}%`;
}

function humanize(variable: string): string {
  const labels: Record<string, string> = {
    refundable_ctc: 'Refundable Child Tax Credit',
    ctc: 'Child Tax Credit',
    income_tax: 'Income tax',
    assigned_aca_ptc: 'Assigned ACA premium tax credit',
  };
  const label = labels[variable] ?? variable.replaceAll('_', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function worstLabel(row: CalibrationTargetRow): string {
  const source = row.sourceLabel ?? row.source;
  const where = row.level === 'national' ? 'US' : row.geography;
  return `${source} · ${where}`;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <Stack style={panelStyle}>{children}</Stack>;
}

function DashboardLink({
  children,
  source,
  level,
  title,
}: {
  children: React.ReactNode;
  source?: string | null;
  level?: 'national' | 'state' | null;
  title?: string;
}) {
  return (
    <a
      href={dashboardTargetsUrl({ source, level })}
      target="_blank"
      rel="noreferrer"
      title={title}
      style={linkStyle}
    >
      {children}
    </a>
  );
}

/**
 * Resolves the matches as soon as the paths and region are known — call
 * at page level so the request runs alongside the rest of the report.
 * `undefined` while loading, `null` when the map or dashboard is
 * unavailable.
 */
export function useCalibrationMatches(
  paths: string[],
  region: string | null | undefined
): CalibrationMatches | null | undefined {
  const [matches, setMatches] = useState<CalibrationMatches | null | undefined>(undefined);
  const pathsKey = paths.join('\n');
  const geography = geographyForRegion(region);

  useEffect(() => {
    let cancelled = false;
    const resolvedPaths = pathsKey ? pathsKey.split('\n') : [];
    if (resolvedPaths.length === 0) {
      setMatches({ releaseId: null, geography, modelVersion: '', reachedCount: 0, matches: [] });
      return;
    }
    calibrationMatchesForPaths(resolvedPaths, geography).then((result) => {
      if (!cancelled) {
        setMatches(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathsKey, geography]);

  return matches;
}

/** The pin a report carries, and why it may no longer describe the live check. */
export interface CalibrationPin {
  snapshot: ReportValidationSnapshot | null;
  drift: string[];
}

function PinNote({ pin }: { pin: CalibrationPin }) {
  if (!pin.snapshot) {
    return null;
  }
  const when = pin.snapshot.matchedAt.slice(0, 10);
  return (
    <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
      {pin.drift.length === 0
        ? `Pinned ${when}; the release and model it was matched against are still current.`
        : `Pinned ${when}; since then ${pin.drift.join(' and ')}. The cards show the live comparison; the pinned one is historical.`}
    </Text>
  );
}

export function CalibrationMatchSection({
  matches,
  pin,
}: {
  matches: CalibrationMatches | null | undefined;
  pin?: CalibrationPin;
}) {
  if (matches === null) {
    return (
      <SectionCard>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Calibration checks are temporarily unavailable — see the{' '}
          <DashboardLink>calibration dashboard</DashboardLink> directly.
        </Text>
      </SectionCard>
    );
  }
  if (matches === undefined) {
    return (
      <SectionCard>
        <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Spinner size="sm" />
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            Checking the calibration of the variables this reform moves…
          </Text>
        </Stack>
      </SectionCard>
    );
  }
  const where = matches.geography === 'US' ? 'nationally' : `in ${matches.geography}`;
  const level = matches.geography === 'US' ? 'national' : 'state';
  if (matches.matches.length === 0) {
    if (matches.reachedCount === 0) {
      return null;
    }
    // Silence would read as "fine". State credits are the usual case: the
    // dashboard's state income tax targets carry no model-variable mapping.
    return (
      <SectionCard>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          None of the {matches.reachedCount} variables this reform moves is a calibration target{' '}
          {where}, so the data behind this estimate is unvalidated on that side. See the{' '}
          <DashboardLink level={level}>calibration dashboard</DashboardLink> for what is covered.
        </Text>
      </SectionCard>
    );
  }

  const attention = matches.matches.filter((m) => m.meanAbsRelativeError > ATTENTION_ERROR);

  return (
    <SectionCard>
      <EvidenceHeader
        title="Data calibration"
        href={dashboardTargetsUrl({ level })}
        linkLabel="View dashboard"
      />
      <Text style={detailStyle}>
        How closely the model’s data matches the administrative totals used to calibrate it {where}.
        Smaller gaps mean a closer fit. {matches.matches.length} measures ·{' '}
        {matches.matches.reduce((sum, match) => sum + match.targetCount, 0)} targets · largest
        average gap{' '}
        {percent(Math.max(...matches.matches.map((match) => match.meanAbsRelativeError)))}.
      </Text>
      {attention.length > 0 && (
        <Text style={detailStyle}>
          Worth a look: {attention.map((m) => humanize(m.variable)).join(', ')}{' '}
          {attention.length === 1 ? 'is' : 'are'} more than {percent(ATTENTION_ERROR)} off on
          average.
        </Text>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: spacing.md,
          alignItems: 'start',
        }}
      >
        {matches.matches.map((match) => (
          <Stack key={match.variable} style={cardStyle}>
            <EvidenceHeader
              title={humanize(match.variable)}
              subtitle={`${match.worst.sourceLabel ?? match.worst.source} · ${matches.geography}`}
              href={dashboardTargetsUrl({ source: match.worst.source, level })}
              linkLabel="View targets"
            />
            <EvidenceValues
              left={{
                label: 'Average absolute gap',
                value: percent(match.meanAbsRelativeError),
                note: `${match.targetCount} calibration targets`,
              }}
              right={{
                label: 'Largest target gap',
                value:
                  match.worst.relativeError === null
                    ? 'Unavailable'
                    : percent(match.worst.relativeError),
                note: match.worst.period
                  ? `Target period: ${match.worst.period}`
                  : 'Target period not recorded',
              }}
            />
            <details style={detailStyle}>
              <summary style={summaryStyle}>How to interpret these gaps</summary>
              <Stack style={{ gap: spacing.sm }}>
                <Text style={{ ...detailStyle, margin: 0 }}>
                  {RING_LABELS[match.ring]} · {describeDepth(match.depth)}
                </Text>
                <Text style={{ ...detailStyle, margin: 0 }}>
                  Compares modeled {humanize(match.variable).toLowerCase()} with {match.targetCount}{' '}
                  administrative targets used to fit the dataset. This measures the existing
                  program, before your reform.
                </Text>
                <Text style={{ ...detailStyle, margin: 0 }}>
                  <strong>Target with the largest gap:</strong> {match.worst.name}
                </Text>
                <Text style={detailStyle}>
                  The average uses the size of each target as its weight. The largest gap compares
                  the model with one target; a negative value means the model is below that target.
                </Text>
                <Text style={detailStyle}>
                  Largest-gap target:{' '}
                  <DashboardLink
                    source={match.worst.source}
                    level={match.worst.level}
                    title={match.worst.name}
                  >
                    {worstLabel(match.worst)}
                  </DashboardLink>
                  .
                </Text>
                <Text style={detailStyle}>{match.worst.name}</Text>
                {match.worst.sourceUrl && (
                  <a
                    href={match.worst.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={linkStyle}
                  >
                    Read source
                  </a>
                )}
                <Text style={detailStyle}>
                  These targets were used to fit the data. A close match measures calibration fit,
                  not independent validation of this reform.
                </Text>
              </Stack>
            </details>
          </Stack>
        ))}
      </div>
      <details style={detailStyle}>
        <summary style={summaryStyle}>Data release and matching method</summary>
        <Text style={detailStyle}>
          {matches.releaseId ? `Data release ${matches.releaseId}` : 'Release not recorded'}
          {matches.modelVersion ? ` · Matched at policyengine-us ${matches.modelVersion}` : ''}.
        </Text>
        <Text style={detailStyle}>
          Variables are ordered by their distance from the changed parameter in the model.
        </Text>
      </details>
      {pin && <PinNote pin={pin} />}
    </SectionCard>
  );
}
