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

/**
 * The data-side validation surface for a report: which of the variables
 * this reform moves are calibration targets of the microdata, and how
 * well the current populace release fits them. Nearest variables first;
 * the interacted quantity within the mechanism is the one that bounds
 * the data-side bias of the estimate.
 */

const RING_LABELS: Record<CalibrationRing, string> = {
  primary: 'Primary',
  mechanism: 'Mechanism',
  downstream: 'Downstream',
};

/** The dependency depth in words: 1 is a formula that reads the parameter itself. */
function describeDepth(depth: number): string {
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
  return variable.replaceAll('_', ' ');
}

function worstLabel(row: CalibrationTargetRow): string {
  const source = row.sourceLabel ?? row.source;
  const where = row.level === 'national' ? 'US' : row.geography;
  return `${source} · ${where}`;
}

const cellStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.primary,
  color: colors.text.primary,
  padding: `${spacing.xs} ${spacing.md} ${spacing.xs} 0`,
  textAlign: 'left',
  verticalAlign: 'top',
};

const headCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: typography.fontSize.xs,
  color: colors.text.secondary,
  fontWeight: typography.fontWeight.medium,
};

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      style={{
        gap: spacing.sm,
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
      style={{ color: colors.primary[700] }}
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
        : `Pinned ${when}; since then ${pin.drift.join(' and ')}. The table shows the live comparison; the pinned one is historical.`}
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
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
        }}
      >
        Data calibration — variables this reform moves
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        How well the microdata behind this estimate matches administrative totals {where} for each
        variable the reform reaches, nearest first. A primary or mechanism variable that is far off
        means the base the reform reprices is mis-sized in the data. From the{' '}
        <DashboardLink level={level}>calibration dashboard</DashboardLink>
        {matches.releaseId ? ` (release ${matches.releaseId})` : ''}, matched through the model
        {matches.modelVersion ? ` at policyengine-us ${matches.modelVersion}` : ''}.
      </Text>
      {attention.length > 0 && (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.primary }}>
          Worth a look: {attention.map((m) => humanize(m.variable)).join(', ')}{' '}
          {attention.length === 1 ? 'is' : 'are'} more than {percent(ATTENTION_ERROR)} off on
          average.
        </Text>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={headCellStyle}>Variable</th>
              <th
                style={headCellStyle}
                title="How far the variable sits from the changed parameter: whether its own formula reads the parameter, or how many formula steps separate them"
              >
                Relationship to the reform
              </th>
              <th style={headCellStyle}>Targets</th>
              <th style={headCellStyle}>Mean error</th>
              <th style={headCellStyle}>Worst target</th>
            </tr>
          </thead>
          <tbody>
            {matches.matches.map((match) => (
              <tr key={match.variable}>
                <td style={cellStyle}>{humanize(match.variable)}</td>
                <td style={{ ...cellStyle, color: colors.text.secondary }}>
                  {RING_LABELS[match.ring]} · {describeDepth(match.depth)}
                </td>
                <td style={cellStyle}>
                  <DashboardLink
                    source={match.worst.source}
                    level={level}
                    title={`${match.worst.sourceLabel ?? match.worst.source} targets ${where} on the calibration dashboard`}
                  >
                    {match.targetCount}
                  </DashboardLink>
                </td>
                <td
                  style={{
                    ...cellStyle,
                    color:
                      match.meanAbsRelativeError > ATTENTION_ERROR
                        ? colors.text.primary
                        : colors.text.secondary,
                    fontWeight:
                      match.meanAbsRelativeError > ATTENTION_ERROR
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                  }}
                >
                  {percent(match.meanAbsRelativeError)}
                </td>
                <td style={{ ...cellStyle, color: colors.text.secondary }}>
                  <DashboardLink
                    source={match.worst.source}
                    level={match.worst.level}
                    title={match.worst.name}
                  >
                    {worstLabel(match.worst)}
                  </DashboardLink>{' '}
                  · {percent(match.worst.relativeError ?? 0)}
                  {match.worst.sourceUrl && (
                    <>
                      {' · '}
                      <a
                        href={match.worst.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: colors.primary[700] }}
                      >
                        source
                      </a>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pin && <PinNote pin={pin} />}
    </SectionCard>
  );
}
