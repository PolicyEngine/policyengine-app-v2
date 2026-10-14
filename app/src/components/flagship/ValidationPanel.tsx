import { useEffect, useState } from 'react';
import { BillValidation } from '@/api/billFeed';
import { describeDepth, RING_LABELS } from '@/components/flagship/CalibrationMatches';
import { Stack } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { relevantComparisons, type ReformScope } from '@/libs/flagship/comparisonRelevance';
import {
  claimsFromBillValidation,
  fiscalNoteLabel,
  METRIC_LABELS,
  ModelValidationRow,
  PROGRAM_LABELS,
  SCORECARD_COMPARISON_URL,
  scorecardEntryUrl,
  ScorecardMatches,
  scorecardMatchesForPaths,
} from '@/libs/flagship/modelValidation';
import { loadParameterDependencies, readersOfPath } from '@/libs/flagship/parameterDependencies';
import type { RelatedScorecardClaim } from '@/libs/flagship/scorecardComparisons';
import { ScorecardClaimTable, type ScorecardClaimEntry } from './ScorecardComparisons';
import {
  CellNote,
  EvidenceTable,
  gapText,
  labelCellStyle,
  linkStyle,
  NotComparable,
  numberCellStyle,
  rowStyle,
  ValidationCard,
  ValidationLoading,
  ValidationNote,
} from './ValidationDisplay';

/**
 * The scorecard side of a report's validation:
 * - BillExternalEstimates: the tracker pipeline's external checks for a
 *   bill (official fiscal note, third-party analyses, verdict).
 * - BaselineComparisons: the PolicyEngine scorecard's comparisons of the
 *   model's baseline with published measures, for the programs the
 *   reform changes in the report's jurisdiction.
 */

function compactMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) {
    return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function metricLabel(row: ModelValidationRow): string {
  if (row.metric.endsWith('_count') && row.unitConcept?.replaceAll(' ', '_') === 'tax_units') {
    return row.metric === 'eligible_count'
      ? 'Eligible tax units (proxy)'
      : `${row.metric.replaceAll('_count', '').replaceAll('_', ' ')} tax units`;
  }
  return METRIC_LABELS[row.metric] ?? row.metric.replaceAll('_', ' ');
}

function metricValue(row: ModelValidationRow, value: number): string {
  if (row.metric.endsWith('_rate')) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (row.metric.includes('benefit')) {
    return compactMoney(value);
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  return Math.round(value).toLocaleString();
}

/** Teal/gray verdict pill, shown with the bill's external estimates only. */
export function ValidationChip({ validation }: { validation: BillValidation }) {
  if (validation.withinRange === undefined) {
    return null;
  }
  const delta =
    typeof validation.differencePct === 'number' ? ` · Δ ${validation.differencePct}%` : '';
  // "Fiscal-note" only when an official note anchors the range; scaled
  // third-party scores get the honest generic label.
  const rangeLabel =
    validation.fiscalNoteEstimate !== undefined || validation.fiscalNoteUrl !== undefined
      ? 'fiscal-note'
      : 'external-estimate';
  // A stale check must not read as a current verdict, so the chip drops
  // its pass/fail coloring and says a re-check is due.
  const stale = validation.drift?.stale === true;
  const withinRange = validation.withinRange && !stale;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        fontSize: typography.fontSize.xs,
        fontFamily: typography.fontFamily.primary,
        fontWeight: typography.fontWeight.medium,
        color: withinRange ? colors.primary[700] : colors.text.secondary,
        background: withinRange ? colors.primary[50] : colors.gray[50],
        border: `1px solid ${withinRange ? colors.primary[500] : colors.border.light}`,
        borderRadius: 999,
        padding: `2px ${spacing.md}`,
        whiteSpace: 'nowrap',
      }}
    >
      {stale
        ? `Validated against an earlier run · re-check needed`
        : validation.withinRange
          ? `Within ${rangeLabel} range${delta}`
          : `Outside ${rangeLabel} range${delta}`}
    </span>
  );
}

const VERIFICATION_COPY: Record<NonNullable<BillValidation['verification']>['overall'], string> = {
  confirmed: 'Sources and figures independently re-verified',
  partially_confirmed: 'Sources and figures partially re-verified',
  refuted: 'Re-verification disputed these figures — treat with caution',
  unverifiable: 'Sources could not be independently re-verified',
};

/** A link to an estimate's source, under its name. */
function ReadSource({ href }: { href: string }) {
  return (
    <CellNote>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ ...linkStyle, fontSize: typography.fontSize.xs }}
      >
        Read source
      </a>
    </CellNote>
  );
}

/**
 * A bill's external estimates beside PolicyEngine's, in one table, with
 * the range verdict and what the pipeline noted about the comparison.
 * A fiscal note stored without a single estimate still names and links
 * its source: under the accepted range it sets, or in a row of its own.
 */
export function BillExternalEstimates({
  billId,
  validation,
}: {
  billId: string;
  validation: BillValidation;
}) {
  // External numbers render from scorecard-shaped claims, so tracker
  // rows today and scorecard shard rows tomorrow are interchangeable.
  const claims = claimsFromBillValidation(billId, validation);
  const peEstimate = validation.peEstimate;
  const range =
    typeof validation.targetRangeLow === 'number' && typeof validation.targetRangeHigh === 'number'
      ? [validation.targetRangeLow, validation.targetRangeHigh].sort((a, b) => a - b)
      : null;
  const noteSource = validation.fiscalNoteSource?.trim();
  const noteWithoutEstimate =
    typeof validation.fiscalNoteEstimate !== 'number' &&
    (validation.fiscalNoteUrl !== undefined || Boolean(noteSource));
  return (
    <Stack style={{ gap: spacing.md }}>
      <EvidenceTable label="Estimates for this bill" columns={['Source', 'Estimate', 'Gap']}>
        {typeof peEstimate === 'number' && (
          <tr style={rowStyle}>
            <th scope="row" style={labelCellStyle}>
              <span style={{ fontWeight: typography.fontWeight.medium }}>PolicyEngine</span>
            </th>
            <td style={{ ...numberCellStyle, fontWeight: typography.fontWeight.medium }}>
              {compactMoney(peEstimate)}
            </td>
            <td style={numberCellStyle}>—</td>
          </tr>
        )}
        {claims.map((claim, index) => (
          <tr key={`${index}-${claim.source}`} style={rowStyle}>
            <th scope="row" style={labelCellStyle}>
              <span>{claim.source}</span>
              {claim.sourceUrl && <ReadSource href={claim.sourceUrl} />}
            </th>
            <td style={numberCellStyle}>{compactMoney(claim.externalValue)}</td>
            <td style={numberCellStyle}>{gapText(peEstimate, claim.externalValue)}</td>
          </tr>
        ))}
        {noteWithoutEstimate && !range && (
          <tr style={rowStyle}>
            <th scope="row" style={labelCellStyle}>
              <span>{fiscalNoteLabel(validation)}</span>
              {validation.fiscalNoteUrl && <ReadSource href={validation.fiscalNoteUrl} />}
            </th>
            <td style={numberCellStyle}>No estimate</td>
            <td style={numberCellStyle}>—</td>
          </tr>
        )}
        {range && (
          <tr style={rowStyle}>
            <th scope="row" style={labelCellStyle}>
              <span>Accepted range</span>
              {noteWithoutEstimate && noteSource && <CellNote>{noteSource}</CellNote>}
              {noteWithoutEstimate && validation.fiscalNoteUrl && (
                <ReadSource href={validation.fiscalNoteUrl} />
              )}
            </th>
            <td style={numberCellStyle}>
              {compactMoney(range[0])} to {compactMoney(range[1])}
            </td>
            <td style={numberCellStyle} />
          </tr>
        )}
      </EvidenceTable>
      <ValidationChip validation={validation} />
      {validation.drift && (
        <ValidationNote>
          This check predates the current analysis: {validation.drift.reasons.join('; ')}. The
          comparison describes the earlier estimate until validation is re-run.
        </ValidationNote>
      )}
      {validation.verification && (
        <ValidationNote>
          {VERIFICATION_COPY[validation.verification.overall]}
          {validation.verification.verifiedAt
            ? ` (${validation.verification.verifiedAt.slice(0, 10)})`
            : ''}
          .
        </ValidationNote>
      )}
      {validation.discrepancyExplanation && (
        <ValidationNote>{validation.discrepancyExplanation}</ValidationNote>
      )}
    </Stack>
  );
}

/**
 * The scorecard matches for a report: `undefined` while loading, `null`
 * when the map or the scorecard is unavailable.
 */
export type ModelTrackRecord = ScorecardMatches | null | undefined;

/** The program ids of a resolved track record, for the pin and the run's stages. */
export function trackRecordPrograms(trackRecord: ModelTrackRecord): string[] | null | undefined {
  return trackRecord ? trackRecord.programs.map((match) => match.program) : trackRecord;
}

/**
 * Fetches the track record as soon as the paths are known — call this
 * at page level, not inside a tab panel, so the request runs in
 * parallel with the rest of the report instead of starting on tab
 * click (inactive tab panels are unmounted).
 */
export function useModelTrackRecord(paths: string[]): ModelTrackRecord {
  const [trackRecord, setTrackRecord] = useState<ModelTrackRecord>(undefined);
  const pathsKey = paths.join('\n');

  useEffect(() => {
    let cancelled = false;
    const resolvedPaths = pathsKey ? pathsKey.split('\n') : [];
    if (resolvedPaths.length === 0) {
      setTrackRecord({ modelVersion: '', reachedCount: 0, programs: [], rows: [] });
      return;
    }
    // The traced dependency map resolves paths to the variables they
    // move; the scorecard rows computed from those variables follow.
    scorecardMatchesForPaths(resolvedPaths).then((result) => {
      if (!cancelled) {
        setTrackRecord(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathsKey]);

  return trackRecord;
}

/** The track record's comparison rows, in the scorecard claim shape the tables render. */
export function trackRecordClaims(trackRecord: ScorecardMatches): ScorecardClaimEntry[] {
  return trackRecord.rows.map((row) => {
    const program = trackRecord.programs.find((match) => match.program === row.program)!;
    const claimId = `${row.source}-${row.program}-${row.metric}-${row.period ?? ''}`;
    const claim: RelatedScorecardClaim = {
      claim_id: claimId,
      country: 'US',
      geography: 'US',
      program: row.program,
      name: metricLabel(row),
      source: row.source,
      url: row.sourceUrl ?? undefined,
      metric: row.metric,
      unit_concept: row.unitConcept ?? '',
      period: row.period ?? '',
      reform_framework: 'baseline',
      reform_key: 'baseline',
      external_value: row.externalValue,
      calibration_relationship: row.heldOut ? 'held_out' : 'consumed_as_target',
      matchBasis: 'variable',
      diagnosis: row.diagnosis ? { title: row.diagnosis } : null,
      latest: {
        value: row.peValue,
        status: row.status,
        construction: row.construction ?? undefined,
        engine_version: row.engineVersion ?? undefined,
        data_bundle: row.dataBundle ?? undefined,
        annotations: [
          `${RING_LABELS[program.ring]} · ${describeDepth(program.depth)}`,
          `Matched at policyengine-us ${trackRecord.modelVersion}.`,
          ...(row.notes ?? []).filter((note) => !note.startsWith('The 2026 column')),
          ...(row.calibrationBasis ? [row.calibrationBasis] : []),
        ],
        ratio: row.ratio,
      },
    };
    return {
      row: claim,
      presentation: {
        title: `${PROGRAM_LABELS[row.program] ?? row.program} — ${metricLabel(row)}`,
        sourceName: row.sourceName ?? row.source,
        // A period shows only when the scorecard records it.
        externalPeriod: row.period ?? undefined,
        modelPeriod: row.pePeriod ?? undefined,
        externalValue: metricValue(row, row.externalValue),
        peValue: metricValue(row, row.peValue),
        // Comparison rows live in the scorecard's comparison table.
        scorecardUrl: scorecardEntryUrl('scorecard', 'US'),
      },
    };
  });
}

const NO_READERS: Record<string, string[]> = {};

/**
 * The variables that read each reform path directly, from the traced
 * dependency map: `undefined` while it loads. The map is US-only, so
 * another country, or a map that fails to load, matches on the paths alone.
 */
export function useReformReaders(
  countryId: string,
  paths: string[]
): Record<string, string[]> | undefined {
  const requestKey = JSON.stringify({ countryId, paths });
  const needsMap = countryId === 'us' && paths.length > 0;
  const [state, setState] = useState<{ key: string; readers: Record<string, string[]> }>();
  useEffect(() => {
    if (!needsMap) {
      return;
    }
    const request = JSON.parse(requestKey) as { paths: string[] };
    let cancelled = false;
    loadParameterDependencies()
      .then((map) =>
        Object.fromEntries(request.paths.map((path) => [path, readersOfPath(path, map)]))
      )
      .catch(() => NO_READERS)
      .then((readers) => {
        if (!cancelled) {
          setState({ key: requestKey, readers });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, needsMap]);
  if (!needsMap) {
    return NO_READERS;
  }
  return state?.key === requestKey ? state.readers : undefined;
}

/**
 * How the model's baseline compares with published measures of the
 * programs the reform changes: the scorecard's track record for those
 * programs, then its other baseline claims linked to the reform. Only
 * comparisons of a program the reform changes, in the report's
 * jurisdiction, show; a loose link through the dependency graph does not.
 */
export function BaselineComparisons({
  trackRecord,
  scorecardRows,
  baselineLabel,
  reform,
}: {
  trackRecord: ModelTrackRecord;
  /** The published scorecard's baseline claims for the reform; undefined while loading. */
  scorecardRows: RelatedScorecardClaim[] | null | undefined;
  /**
   * What the report compares with, when not current law. The scorecard
   * measures current law, so its comparisons do not apply.
   */
  baselineLabel?: string | null;
  /** The reform and the report's region, which pick the comparisons; undefined while loading. */
  reform: ReformScope | undefined;
}) {
  const candidates = [
    ...(trackRecord ? trackRecordClaims(trackRecord) : []),
    ...(scorecardRows ?? []).map((row) => ({ row })),
  ];
  const relevant = new Set(
    reform
      ? relevantComparisons(
          candidates.map((entry) => entry.row),
          reform
        )
      : []
  );
  const entries = candidates.filter((entry) => relevant.has(entry.row));
  let content;
  if (baselineLabel) {
    content = (
      <NotComparable>
        The scorecard measures current law. This report compares with {baselineLabel}.
      </NotComparable>
    );
  } else if (entries.length > 0) {
    content = <ScorecardClaimTable label="Baseline comparisons" entries={entries} />;
  } else if (trackRecord === undefined || scorecardRows === undefined || reform === undefined) {
    content = <ValidationLoading label="Loading baseline comparisons" />;
  } else if (trackRecord === null || scorecardRows === null) {
    content = <ValidationNote>Baseline comparisons are temporarily unavailable.</ValidationNote>;
  } else {
    // Silence would read as "fine"; loose matches would read as evidence.
    content = (
      <ValidationNote>
        No scorecard comparison measures the programs this reform changes.
      </ValidationNote>
    );
  }
  return (
    <ValidationCard
      id="baseline-comparisons"
      title="Baseline comparisons"
      href={SCORECARD_COMPARISON_URL}
      linkLabel="View scorecard"
    >
      {content}
    </ValidationCard>
  );
}
