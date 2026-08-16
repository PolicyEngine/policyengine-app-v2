import { useEffect, useState } from 'react';
import { BillValidation } from '@/api/billFeed';
import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  fetchModelValidation,
  METRIC_LABELS,
  ModelValidationRow,
  PROGRAM_LABELS,
  SCORECARD_URL,
  scorecardProgramsFromPaths,
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
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        fontSize: typography.fontSize.xs,
        fontFamily: typography.fontFamily.primary,
        fontWeight: typography.fontWeight.medium,
        color: validation.withinRange ? colors.primary[700] : colors.text.secondary,
        background: validation.withinRange ? colors.primary[50] : colors.gray[50],
        border: `1px solid ${validation.withinRange ? colors.primary[500] : colors.border.light}`,
        borderRadius: 999,
        padding: `2px ${spacing.md}`,
        whiteSpace: 'nowrap',
      }}
    >
      {validation.withinRange
        ? `Within fiscal-note range${delta}`
        : `Outside fiscal-note range${delta}`}
    </span>
  );
}

export function BillValidationSection({ validation }: { validation: BillValidation }) {
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
            </tr>
          )}
          {typeof validation.fiscalNoteEstimate === 'number' && (
            <tr>
              <td style={headCellStyle}>Official fiscal note</td>
              <td style={cellStyle}>
                {compactMoney(validation.fiscalNoteEstimate)}
                {validation.fiscalNoteUrl && (
                  <>
                    {' '}
                    <a
                      href={validation.fiscalNoteUrl}
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
          )}
          {range && (
            <tr>
              <td style={headCellStyle}>Accepted range</td>
              <td style={cellStyle}>
                {compactMoney(range[0])} to {compactMoney(range[1])}
              </td>
            </tr>
          )}
          {(validation.externalAnalyses ?? []).map(
            (analysis, i) =>
              analysis.source && (
                <tr key={`${analysis.source}-${i}`}>
                  <td style={headCellStyle}>{analysis.source}</td>
                  <td style={cellStyle}>
                    {typeof analysis.estimate === 'number' ? compactMoney(analysis.estimate) : '—'}
                    {analysis.url && (
                      <>
                        {' '}
                        <a
                          href={analysis.url}
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
              )
          )}
        </tbody>
      </table>
      <ValidationChip validation={validation} />
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
  const [rows, setRows] = useState<ModelValidationRow[] | null | undefined>(undefined);
  const programsKey = scorecardProgramsFromPaths(paths).join(',');

  useEffect(() => {
    let cancelled = false;
    if (programsKey) {
      fetchModelValidation(programsKey.split(',')).then((result) => {
        if (!cancelled) {
          setRows(result);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [programsKey]);

  return { programs: programsKey ? programsKey.split(',') : [], rows };
}

export function ModelTrackRecordSection({ trackRecord }: { trackRecord: ModelTrackRecord }) {
  const { programs, rows } = trackRecord;
  if (programs.length === 0 || rows === null) {
    return null;
  }
  if (rows === undefined) {
    return (
      <SectionCard>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Loading external comparisons…
        </Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionTitle>
        Model track record — {programs.map((p) => PROGRAM_LABELS[p] ?? p).join(', ')}
      </SectionTitle>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        How PolicyEngine&apos;s calibrated data reproduces independent external analyses of the
        programs this bill touches, from the{' '}
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
