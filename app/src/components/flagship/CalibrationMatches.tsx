import { useEffect, useState } from 'react';
import { Spinner, Stack, Text } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { colors, spacing, typography } from '@/designTokens';
import {
  CalibrationMatches,
  calibrationMatchesForPaths,
  CalibrationRing,
  dashboardTargetsUrl,
  geographyForRegion,
} from '@/libs/flagship/calibrationMatching';
import type { ReportValidationSnapshot } from '@/libs/flagship/reportValidation';
import {
  cardStyle,
  detailStyle,
  EvidenceHeader,
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

  return (
    <SectionCard>
      <EvidenceHeader
        title="Data calibration"
        href={dashboardTargetsUrl({ level })}
        linkLabel="View dashboard"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
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
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: typography.fontSize.sm,
                }}
              >
                <thead>
                  <tr>
                    {['Target', 'Period', 'Target value', 'Model value', 'Gap'].map((label) => (
                      <th
                        key={label}
                        style={{
                          textAlign: label === 'Target' ? 'left' : 'right',
                          padding: spacing.sm,
                          fontWeight: typography.fontWeight.medium,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {match.targets.map((target) => (
                    <tr key={target.name} style={{ borderTop: `1px solid ${colors.border.light}` }}>
                      <td style={{ padding: spacing.sm, maxWidth: 360, overflowWrap: 'anywhere' }}>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              style={{
                                ...linkStyle,
                                background: 'none',
                                border: 0,
                                padding: 0,
                                textAlign: 'left',
                                font: 'inherit',
                                overflowWrap: 'anywhere',
                                cursor: 'pointer',
                              }}
                            >
                              {target.name}
                            </button>
                          </DialogTrigger>
                          <DialogContent aria-describedby={undefined}>
                            <DialogTitle>Calibration target</DialogTitle>
                            <Text style={{ ...detailStyle, overflowWrap: 'anywhere' }}>
                              {target.name}
                            </Text>
                            <dl
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: spacing.sm,
                                margin: 0,
                                fontSize: typography.fontSize.sm,
                              }}
                            >
                              {[
                                ['Source', target.sourceLabel ?? target.source],
                                ['Geography', target.geography],
                                ['Period', target.period ?? '—'],
                                ['Measure', target.measure ?? '—'],
                                [
                                  'Target value',
                                  target.target?.toLocaleString('en-US', {
                                    maximumFractionDigits: 2,
                                  }) ?? '—',
                                ],
                                [
                                  'Model value',
                                  target.estimate?.toLocaleString('en-US', {
                                    maximumFractionDigits: 2,
                                  }) ?? '—',
                                ],
                                [
                                  'Gap',
                                  target.relativeError === null
                                    ? '—'
                                    : percent(target.relativeError),
                                ],
                              ].map(([label, value]) => (
                                <div key={label} style={{ display: 'contents' }}>
                                  <dt>{label}</dt>
                                  <dd style={{ margin: 0 }}>{value}</dd>
                                </div>
                              ))}
                            </dl>
                            {target.sourceUrl && (
                              <a
                                href={target.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={linkStyle}
                              >
                                Read source
                              </a>
                            )}
                            <DashboardLink source={target.source} level={target.level}>
                              View target group in dashboard
                            </DashboardLink>
                          </DialogContent>
                        </Dialog>
                        <Text style={{ ...detailStyle, margin: 0 }}>
                          {target.sourceLabel ?? target.source} · {target.geography}
                          {target.measure ? ` · ${target.measure}` : ''}
                        </Text>
                      </td>
                      <td style={{ padding: spacing.sm, textAlign: 'right' }}>
                        {target.period ?? '—'}
                      </td>
                      <td style={{ padding: spacing.sm, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {target.target === null
                          ? '—'
                          : target.target.toLocaleString('en-US', {
                              notation: 'compact',
                              maximumFractionDigits: 1,
                            })}
                      </td>
                      <td style={{ padding: spacing.sm, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {target.estimate === null
                          ? '—'
                          : target.estimate.toLocaleString('en-US', {
                              notation: 'compact',
                              maximumFractionDigits: 1,
                            })}
                      </td>
                      <td style={{ padding: spacing.sm, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {target.relativeError === null ? '—' : percent(target.relativeError)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Stack>
        ))}
      </div>
      <details style={detailStyle}>
        <summary style={summaryStyle}>Data release</summary>
        <Text style={detailStyle}>
          {matches.releaseId ? `Data release ${matches.releaseId}` : 'Release not recorded'}
          {matches.modelVersion ? ` · Matched at policyengine-us ${matches.modelVersion}` : ''}.
        </Text>
      </details>
      {pin && <PinNote pin={pin} />}
    </SectionCard>
  );
}
