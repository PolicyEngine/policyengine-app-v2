import { useEffect, useState } from 'react';
import { Text } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  CellNote,
  detailStyle,
  EvidenceTable,
  labelCellStyle,
  linkStyle,
  numberCellStyle,
  percentText,
  rowButtonStyle,
  rowStyle,
  summaryStyle,
  ValidationCard,
  ValidationLoading,
  ValidationNote,
} from './ValidationDisplay';

/**
 * The data-side validation surface for a report: which of the variables
 * this reform moves are calibration targets of the microdata, and how
 * well the current populace release fits them — the model's baseline
 * totals against the official ones. Nearest variables first; the
 * interacted quantity within the mechanism is the one that bounds the
 * data-side bias of the estimate.
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

const CALIBRATION_COLUMNS = ['Target', 'Period', 'Official', 'PolicyEngine', 'Gap'];

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

function compactNumber(value: number | null): string {
  return value === null
    ? '—'
    : value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
}

function exactNumber(value: number | null): string {
  return value?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '—';
}

function gapOf(target: CalibrationTargetRow): string {
  return target.relativeError === null ? '—' : percentText(target.relativeError);
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

/** A target's name, opening its exact values. */
function TargetDetails({ target }: { target: CalibrationTargetRow }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" style={rowButtonStyle}>
          {target.name}
        </button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Calibration target</DialogTitle>
        <Text style={{ ...detailStyle, overflowWrap: 'anywhere' }}>{target.name}</Text>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: spacing.sm,
            margin: 0,
            fontSize: typography.fontSize.sm,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {[
            ['Source', target.sourceLabel ?? target.source],
            ['Geography', target.geography],
            ['Period', target.period ?? '—'],
            ['Measure', target.measure ?? '—'],
            ['Official', exactNumber(target.target)],
            ['PolicyEngine', exactNumber(target.estimate)],
            ['Gap', gapOf(target)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt>{label}</dt>
              <dd style={{ margin: 0 }}>{value}</dd>
            </div>
          ))}
        </dl>
        {target.sourceUrl && (
          <a href={target.sourceUrl} target="_blank" rel="noreferrer" style={linkStyle}>
            Read source
          </a>
        )}
        <a
          href={dashboardTargetsUrl({ source: target.source, level: target.level })}
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
        >
          View target group in dashboard
        </a>
      </DialogContent>
    </Dialog>
  );
}

export function CalibrationMatchSection({
  matches,
  pin,
}: {
  matches: CalibrationMatches | null | undefined;
  pin?: CalibrationPin;
}) {
  const level = matches ? (matches.geography === 'US' ? 'national' : 'state') : null;
  const card = (content: React.ReactNode) => (
    <ValidationCard
      id="data-calibration"
      title="Data calibration"
      href={dashboardTargetsUrl({ level })}
      linkLabel="View dashboard"
    >
      {content}
    </ValidationCard>
  );
  if (matches === null) {
    return card(<ValidationNote>Calibration checks are temporarily unavailable.</ValidationNote>);
  }
  if (matches === undefined) {
    return card(<ValidationLoading label="Checking calibration targets" />);
  }
  if (matches.matches.length === 0) {
    const where = matches.geography === 'US' ? 'nationally' : `in ${matches.geography}`;
    // Silence would read as "fine". State credits are the usual case: the
    // dashboard's state income tax targets carry no model-variable mapping.
    return card(
      <ValidationNote>
        {matches.reachedCount > 0
          ? `None of the ${matches.reachedCount} variables this reform moves is a calibration target ${where}.`
          : 'No calibration target covers this reform.'}
      </ValidationNote>
    );
  }

  return card(
    <>
      <EvidenceTable label="Calibration targets" columns={CALIBRATION_COLUMNS} grouped>
        {matches.matches.map((match) => {
          const sources = [
            ...new Set(match.targets.map((target) => target.sourceLabel ?? target.source)),
          ].join(', ');
          return (
            <tbody key={match.variable}>
              <tr style={rowStyle}>
                <th
                  scope="rowgroup"
                  colSpan={CALIBRATION_COLUMNS.length}
                  style={{ ...labelCellStyle, paddingBottom: 0 }}
                >
                  <span style={{ fontWeight: typography.fontWeight.semibold }}>
                    {humanize(match.variable)}
                  </span>
                  <CellNote>
                    <span>
                      {sources} · {matches.geography}
                    </span>{' '}
                    ·{' '}
                    <a
                      href={dashboardTargetsUrl({ source: match.worst.source, level })}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...linkStyle, fontSize: typography.fontSize.xs }}
                    >
                      View targets
                    </a>
                  </CellNote>
                </th>
              </tr>
              {match.targets.map((target) => (
                <tr key={target.name}>
                  <th scope="row" style={labelCellStyle}>
                    <TargetDetails target={target} />
                  </th>
                  <td style={numberCellStyle}>{target.period ?? '—'}</td>
                  <td style={numberCellStyle}>{compactNumber(target.target)}</td>
                  <td style={numberCellStyle}>{compactNumber(target.estimate)}</td>
                  <td style={numberCellStyle}>{gapOf(target)}</td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </EvidenceTable>
      <details style={detailStyle}>
        <summary style={summaryStyle}>Data release</summary>
        <Text style={detailStyle}>
          {matches.releaseId ?? 'Not recorded'}
          {matches.modelVersion ? ` · policyengine-us ${matches.modelVersion}` : ''}
        </Text>
      </details>
      {pin && <PinNote pin={pin} />}
    </>
  );
}
