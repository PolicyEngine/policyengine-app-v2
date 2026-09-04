import { useEffect, useState } from 'react';
import { BillValidation } from '@/api/billFeed';
import { Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  claimsFromBillValidation,
  fetchModelValidation,
  METRIC_LABELS,
  ModelValidationRow,
  PROGRAM_LABELS,
  SCORECARD_URL,
  scorecardProgramsForPaths,
} from '@/libs/flagship/modelValidation';

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
                      style={{ color: colors.primary[700] }}
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

export interface ModelTrackRecord {
  programs: string[];
  /** undefined while loading, null when unavailable */
  rows: ModelValidationRow[] | null | undefined;
}

/**
 * Fetches the track record as soon as the paths are known — call this
 * at page level, not inside a tab panel, so the request runs in
 * parallel with the rest of the report instead of starting on tab
 * click (inactive tab panels are unmounted).
 */
export function useModelTrackRecord(paths: string[]): ModelTrackRecord {
  const [programs, setPrograms] = useState<string[]>([]);
  const [rows, setRows] = useState<ModelValidationRow[] | null | undefined>(undefined);
  const pathsKey = paths.join('\n');

  useEffect(() => {
    let cancelled = false;
    const resolvedPaths = pathsKey ? pathsKey.split('\n') : [];
    if (resolvedPaths.length === 0) {
      setPrograms([]);
      return;
    }
    // The traced dependency map resolves paths to the output variables
    // they move; the scorecard rows follow once the programs are known.
    scorecardProgramsForPaths(resolvedPaths).then(async (resolved) => {
      if (cancelled) {
        return;
      }
      setPrograms(resolved);
      if (resolved.length > 0) {
        const result = await fetchModelValidation(resolved);
        if (!cancelled) {
          setRows(result);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathsKey]);

  return { programs, rows };
}

export function ModelTrackRecordSection({ trackRecord }: { trackRecord: ModelTrackRecord }) {
  const { programs, rows } = trackRecord;
  if (programs.length === 0) {
    return null;
  }
  if (rows === null) {
    return (
      <SectionCard>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          External comparisons are temporarily unavailable — see the{' '}
          <a
            href={SCORECARD_URL}
            target="_blank"
            rel="noreferrer"
            style={{ color: colors.primary[700] }}
          >
            PolicyEngine scorecard
          </a>{' '}
          directly.
        </Text>
      </SectionCard>
    );
  }
  if (rows === undefined) {
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

  return (
    <SectionCard>
      <SectionTitle>
        Program context — {programs.map((p) => PROGRAM_LABELS[p] ?? p).join(', ')}
      </SectionTitle>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        How the model&apos;s baseline representation of the programs this bill touches compares with
        independent external measurement. This is credibility context for the ingredients behind the
        estimate — not a check of this bill&apos;s numbers. From the{' '}
        <a
          href={SCORECARD_URL}
          target="_blank"
          rel="noreferrer"
          style={{ color: colors.primary[700] }}
        >
          PolicyEngine scorecard
        </a>
        . &ldquo;Held out&rdquo; means the dataset was not calibrated to that comparison.
      </Text>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={headCellStyle}>Metric</th>
              <th style={headCellStyle}>External</th>
              <th style={headCellStyle}>PolicyEngine</th>
              <th style={headCellStyle}>Ratio</th>
              <th style={headCellStyle} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.program}-${row.metric}`}>
                <td style={cellStyle}>
                  {PROGRAM_LABELS[row.program] ?? row.program} ·{' '}
                  {METRIC_LABELS[row.metric] ?? row.metric.replaceAll('_', ' ')}
                </td>
                <td style={cellStyle}>{metricValue(row, row.externalValue)}</td>
                <td style={cellStyle}>{metricValue(row, row.peValue)}</td>
                <td style={cellStyle}>{row.ratio.toFixed(2)}×</td>
                <td style={{ ...cellStyle, fontSize: typography.fontSize.xs }}>
                  <span
                    style={{ color: row.heldOut ? colors.primary[700] : colors.text.secondary }}
                  >
                    {row.heldOut ? 'held out' : 'calibrated'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
