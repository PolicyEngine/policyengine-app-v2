import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { STATE_NAMES } from '@/api/billFeed';
import { Text } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { colors, spacing, typography } from '@/designTokens';
import {
  calibrationFitForGeography,
  CalibrationMatches,
  calibrationMatchesForPaths,
  CalibrationRing,
  calibrationTargetLabel,
  CalibrationTargetRow,
  calibrationVariableLabel,
  CLOSE_FIT_ERROR,
  dashboardTargetsUrl,
  formatCalibrationValue,
  GeographyCalibrationFit,
  geographyForRegion,
} from '@/libs/flagship/calibrationMatching';
import type { ReportValidationSnapshot } from '@/libs/flagship/reportValidation';
import type { RootState } from '@/store';
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
  ValidationSubheading,
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

function gapOf(target: CalibrationTargetRow): string {
  return target.relativeError === null ? '—' : percentText(target.relativeError);
}

/** Calibration diagnostics cover the US model and its targets only, for now. */
export function hasCalibrationDiagnostics(countryId: string | null | undefined): boolean {
  return countryId === 'us';
}

/**
 * Resolves the matches as soon as the paths and region are known — call
 * at page level so the request runs alongside the rest of the report.
 * `undefined` while loading (or while the country is unknown), `null`
 * when the map or dashboard is unavailable, or when the country has no
 * calibration diagnostics: the map and targets are US-only, so another
 * country never asks for them.
 */
export function useCalibrationMatches(
  paths: string[],
  region: string | null | undefined,
  countryId: string | undefined
): CalibrationMatches | null | undefined {
  const [matches, setMatches] = useState<CalibrationMatches | null | undefined>(undefined);
  const pathsKey = paths.join('\n');
  const geography = geographyForRegion(region);

  useEffect(() => {
    let cancelled = false;
    const resolvedPaths = pathsKey ? pathsKey.split('\n') : [];
    if (!countryId) {
      setMatches(undefined);
      return;
    }
    if (!hasCalibrationDiagnostics(countryId)) {
      setMatches(null);
      return;
    }
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
  }, [pathsKey, geography, countryId]);

  return matches;
}

/**
 * A state's overall data fit, whatever the reform changes. `undefined`
 * while loading, `null` when the dashboard is unavailable; a national
 * geography is not asked for.
 */
export function useGeographyCalibrationFit(
  geography: string | null
): GeographyCalibrationFit | null | undefined {
  const [fit, setFit] = useState<GeographyCalibrationFit | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setFit(undefined);
    if (!geography || geography === 'US') {
      return;
    }
    calibrationFitForGeography(geography).then((result) => {
      if (!cancelled) {
        setFit(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [geography]);

  return fit;
}

/** A state code as a reader names it: "DC" reads "District of Columbia". */
export function geographyName(geography: string): string {
  return geography === 'US' ? 'the US' : (STATE_NAMES[geography] ?? geography);
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

/** A target's name, opening its exact values; the dashboard id rides along as a tooltip. */
function TargetDetails({ target, group }: { target: CalibrationTargetRow; group: string }) {
  const label = calibrationTargetLabel(target);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" style={rowButtonStyle} title={target.name}>
          {label}
        </button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Calibration target</DialogTitle>
        <Text style={detailStyle}>
          {group} · {label}
        </Text>
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
            ['Target id', target.name],
            ['Source', target.sourceLabel ?? target.source],
            ['Geography', target.geography],
            ['Period', target.period ?? '—'],
            ['Measure', target.measure ?? '—'],
            ['Official', formatCalibrationValue(target.target, target, 'exact')],
            ['PolicyEngine', formatCalibrationValue(target.estimate, target, 'exact')],
            ['Gap', gapOf(target)],
          ].map(([field, value]) => (
            <div key={field} style={{ display: 'contents' }}>
              <dt>{field}</dt>
              <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{value}</dd>
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

/** A target's period, values and gap, in the table's number columns. */
function TargetCells({ target }: { target: CalibrationTargetRow }) {
  return (
    <>
      <td style={numberCellStyle}>{target.period ?? '—'}</td>
      <td style={numberCellStyle}>{formatCalibrationValue(target.target, target)}</td>
      <td style={numberCellStyle}>{formatCalibrationValue(target.estimate, target)}</td>
      <td style={numberCellStyle}>{gapOf(target)}</td>
    </>
  );
}

/** A target's heading outside a variable group: the variable it measures, else its own label. */
function targetGroup(
  target: CalibrationTargetRow,
  labels: Record<string, { label?: string | null }> | null | undefined
): string {
  const variable = target.policyengineVariables[0];
  return variable
    ? calibrationVariableLabel(variable, labels?.[variable]?.label)
    : calibrationVariableLabel(target.variable.trim().replaceAll(' ', '_'));
}

/**
 * How well the data fits a state overall, whatever the reform changes:
 * how many targets, the share that fits closely, the weighted error, and
 * the worst fits by name, with the dashboard's view of the state. Context
 * after the reform's own targets.
 */
export function GeographyFitSection({ geography }: { geography: string }) {
  const fit = useGeographyCalibrationFit(geography);
  const variables = useSelector((state: RootState) => state.metadata.variables);
  const name = geographyName(geography);
  const heading = <ValidationSubheading>{name} data fit</ValidationSubheading>;
  if (fit === undefined) {
    return (
      <>
        {heading}
        <ValidationLoading label={`Checking ${name} calibration targets`} />
      </>
    );
  }
  if (fit === null || fit.targetCount === 0) {
    return (
      <>
        {heading}
        <ValidationNote>
          {fit === null
            ? `The ${name} calibration targets are temporarily unavailable.`
            : `The data has no calibration target in ${name}.`}
        </ValidationNote>
      </>
    );
  }
  return (
    <>
      {heading}
      <ValidationNote>
        How well the data fits {name} overall, whatever the reform changes.{' '}
        {fit.targetCount.toLocaleString('en-US')} targets, {percentText(fit.closeFitShare)} within{' '}
        {percentText(CLOSE_FIT_ERROR)} of the official value; mean gap{' '}
        {percentText(fit.meanAbsRelativeError)}, weighted by target size.
      </ValidationNote>
      <EvidenceTable
        label={`Worst-fit calibration targets in ${name}`}
        columns={CALIBRATION_COLUMNS}
      >
        {fit.worst.map((target) => {
          const group = targetGroup(target, variables);
          return (
            <tr key={target.name} style={rowStyle}>
              <th scope="row" style={labelCellStyle}>
                <span style={{ display: 'block' }}>{group}</span>
                <CellNote>
                  <TargetDetails target={target} group={group} />
                </CellNote>
              </th>
              <TargetCells target={target} />
            </tr>
          );
        })}
      </EvidenceTable>
      {/* The dashboard reads no geography from its URL, so the reader picks the state there. */}
      <a
        href={dashboardTargetsUrl({ level: 'state' })}
        target="_blank"
        rel="noreferrer"
        style={linkStyle}
      >
        View state targets in dashboard
      </a>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        Choose {geography} under Geography there to see only {name}.
      </Text>
    </>
  );
}

export function CalibrationMatchSection({
  matches,
  pin,
}: {
  matches: CalibrationMatches | null | undefined;
  pin?: CalibrationPin;
}) {
  const variables = useSelector((state: RootState) => state.metadata.variables);
  const level = matches ? (matches.geography === 'US' ? 'national' : 'state') : null;
  const card = (content: React.ReactNode) => (
    <ValidationCard
      id="data-calibration"
      title="Data calibration"
      href={dashboardTargetsUrl({ level })}
      linkLabel="View dashboard"
    >
      {content}
      {/* A state's overall fit follows the reform's own targets, as context. */}
      {matches && matches.geography !== 'US' && (
        <GeographyFitSection geography={matches.geography} />
      )}
    </ValidationCard>
  );
  if (matches === null) {
    return card(<ValidationNote>Calibration checks are temporarily unavailable.</ValidationNote>);
  }
  if (matches === undefined) {
    return card(<ValidationLoading label="Checking calibration targets" />);
  }
  const placeName = geographyName(matches.geography);
  const related = matches.matches.length === 0 ? (matches.related ?? []) : [];
  if (matches.reachedCount === 0) {
    // Not "nothing measures it": the model map has no record of what it moves.
    return card(
      <ValidationNote>
        The model&apos;s dependency map does not trace the parameters this reform changes, so no
        calibration target can be matched to it.
      </ValidationNote>
    );
  }
  if (matches.matches.length === 0 && related.length === 0) {
    // Silence would read as "fine"; loose matches would read as evidence.
    return card(
      <ValidationNote>
        No calibration target measures the programs this reform changes.
      </ValidationNote>
    );
  }
  const table = (label: string, list: typeof matches.matches) => (
    <EvidenceTable label={label} columns={CALIBRATION_COLUMNS} grouped>
      {list.map((match) => {
        const sources = [
          ...new Set(match.targets.map((target) => target.sourceLabel ?? target.source)),
        ].join(', ');
        const group = calibrationVariableLabel(match.variable, variables?.[match.variable]?.label);
        return (
          <tbody key={match.variable}>
            <tr style={rowStyle}>
              <th
                scope="rowgroup"
                colSpan={CALIBRATION_COLUMNS.length}
                style={{ ...labelCellStyle, paddingBottom: 0 }}
              >
                <span style={{ fontWeight: typography.fontWeight.semibold }}>{group}</span>
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
                  <TargetDetails target={target} group={group} />
                </th>
                <TargetCells target={target} />
              </tr>
            ))}
          </tbody>
        );
      })}
    </EvidenceTable>
  );

  return card(
    <>
      {related.length > 0 ? (
        <>
          {/* Not "no target measures it": these targets are measured, just not of a changed program. */}
          <ValidationNote>
            These targets in {placeName} do not measure a program this reform changes, but the
            change reaches them through the model:
          </ValidationNote>
          {table('Related calibration targets', related)}
        </>
      ) : (
        table('Calibration targets', matches.matches)
      )}
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
