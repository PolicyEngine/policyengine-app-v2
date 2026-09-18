import { useEffect, useState } from 'react';
import { BillValidation } from '@/api/billFeed';
import { describeDepth, RING_LABELS } from '@/components/flagship/CalibrationMatches';
import { Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  claimsFromBillValidation,
  METRIC_LABELS,
  ModelValidationRow,
  PROGRAM_LABELS,
  SCORECARD_COMPARISON_URL,
  SCORECARD_URL,
  ScorecardMatches,
  scorecardMatchesForPaths,
} from '@/libs/flagship/modelValidation';
import { ScorecardClaimCard } from './ScorecardComparisons';

/**
 * The two validation surfaces for a bill report:
 * - BillValidationSection: the tracker pipeline's external checks for
 *   this bill (official fiscal note, third-party analyses, verdict).
 * - ModelTrackRecordSection: the PolicyEngine scorecard's comparisons
 *   against external analyses for the programs the bill touches.
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
      }}
    >
      {children}
    </Text>
  );
}

/** Teal/gray verdict pill, also reused in the report header. */
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

export function BillValidationSection({
  billId,
  validation,
}: {
  billId: string;
  validation: BillValidation;
}) {
  // External numbers render from scorecard-shaped claims, so tracker
  // rows today and scorecard shard rows tomorrow are interchangeable.
  const claims = claimsFromBillValidation(billId, validation);
  const range =
    typeof validation.targetRangeLow === 'number' && typeof validation.targetRangeHigh === 'number'
      ? [validation.targetRangeLow, validation.targetRangeHigh].sort((a, b) => a - b)
      : null;
  return (
    <SectionCard>
      <SectionTitle>External checks for this bill</SectionTitle>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {typeof validation.peEstimate === 'number' && (
            <tr>
              <td style={headCellStyle}>PolicyEngine estimate</td>
              <td style={cellStyle}>{compactMoney(validation.peEstimate)}</td>
              <td style={cellStyle} />
            </tr>
          )}
          {range && (
            <tr>
              <td style={headCellStyle}>Accepted range</td>
              <td style={cellStyle}>
                {compactMoney(range[0])} to {compactMoney(range[1])}
              </td>
              <td style={cellStyle} />
            </tr>
          )}
          {claims.map((claim) => (
            <tr key={claim.source}>
              <td style={headCellStyle}>{claim.source}</td>
              <td style={cellStyle}>
                {compactMoney(claim.externalValue)}
                {claim.sourceUrl && (
                  <>
                    {' '}
                    <a
                      href={claim.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: colors.primary[700],
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      source
                    </a>
                  </>
                )}
              </td>
              <td style={{ ...cellStyle, color: colors.text.secondary }}>
                {typeof claim.ratio === 'number' ? `${claim.ratio.toFixed(2)}× PE` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ValidationChip validation={validation} />
      {validation.drift && (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          This check predates the current analysis: {validation.drift.reasons.join('; ')}. The
          comparison below describes the earlier estimate until validation is re-run.
        </Text>
      )}
      {validation.verification && (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {
            {
              confirmed: 'Sources and figures independently re-verified',
              partially_confirmed: 'Sources and figures partially re-verified',
              refuted: 'Re-verification disputed these figures — treat with caution',
              unverifiable: 'Sources could not be independently re-verified',
            }[validation.verification.overall]
          }
          {validation.verification.verifiedAt
            ? ` (${validation.verification.verifiedAt.slice(0, 10)})`
            : ''}
          .
        </Text>
      )}
      {validation.discrepancyExplanation && (
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            lineHeight: 1.6,
          }}
        >
          {validation.discrepancyExplanation}
        </Text>
      )}
    </SectionCard>
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

export function ModelTrackRecordSection({
  trackRecord,
  embedded = false,
}: {
  trackRecord: ModelTrackRecord;
  embedded?: boolean;
}) {
  if (trackRecord === null) {
    return (
      <SectionCard>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          External comparisons are temporarily unavailable — see the{' '}
          <a
            href={SCORECARD_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              color: colors.primary[700],
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            PolicyEngine scorecard
          </a>{' '}
          directly.
        </Text>
      </SectionCard>
    );
  }
  if (trackRecord === undefined) {
    return (
      <SectionCard>
        <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Spinner size="sm" />
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            Loading external comparisons…
          </Text>
        </Stack>
      </SectionCard>
    );
  }
  const { programs, rows } = trackRecord;
  if (programs.length === 0) {
    if (trackRecord.reachedCount === 0) {
      return null;
    }
    // Silence would read as "fine". State credits are the usual case: the
    // scorecard measures federal programs and poverty, not state credits.
    return (
      <SectionCard>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          None of the {trackRecord.reachedCount} variables this reform moves is measured by the{' '}
          <a
            href={SCORECARD_COMPARISON_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              color: colors.primary[700],
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            PolicyEngine scorecard
          </a>
          , so there is no external comparison for the programs behind this estimate.
        </Text>
      </SectionCard>
    );
  }

  const cards = (
    <Stack
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: spacing.md,
        alignItems: 'start',
      }}
    >
      {rows.map((row) => {
        const program = programs.find((match) => match.program === row.program)!;
        return (
          <ScorecardClaimCard
            key={`${row.source}-${row.program}-${row.metric}`}
            presentation={{
              title: `${PROGRAM_LABELS[row.program] ?? row.program} — ${metricLabel(row)}`,
              sourceName: row.sourceName ?? row.source,
              externalPeriod: row.period ?? 'Period not recorded',
              modelPeriod: row.pePeriod ?? 'Period not recorded',
              externalValue: metricValue(row, row.externalValue),
              peValue: metricValue(row, row.peValue),
            }}
            row={{
              claim_id: `${row.source}-${row.program}-${row.metric}`,
              country: 'US',
              geography: 'US',
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
            }}
          />
        );
      })}
    </Stack>
  );
  return embedded ? (
    cards
  ) : (
    <SectionCard>
      <SectionTitle>Baseline comparisons</SectionTitle>
      {cards}
    </SectionCard>
  );
}
