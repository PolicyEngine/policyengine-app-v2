import dayjs from 'dayjs';
import { IconArrowRight, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { reportLink, type FlagshipReportRecord } from '@/api/flagshipReportStore';
import { fetchReportById } from '@/api/report';
import { Badge, Button, Stack, Text } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';
import { flagshipReportQueryKeys, readReportMeta } from '@/libs/flagship/runReport';
import type { RootState } from '@/store';

/** The model version a report's stored results were computed on, when they say. */
function modelVersionOf(output: unknown): string | null {
  try {
    const parsed = typeof output === 'string' ? JSON.parse(output) : output;
    const version = (parsed as { model_version?: unknown } | null)?.model_version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}

/** The API's record of a report: its year, how it ended, and when. */
function useApiReport(countryId: CountryId, apiReportId: string) {
  return useQuery({
    queryKey: flagshipReportQueryKeys.status(countryId, apiReportId),
    queryFn: () => fetchReportById(countryId, apiReportId),
    staleTime: 60_000,
    retry: false,
  }).data;
}

/**
 * Where a report stands, as the API's record says. A report whose page
 * closed before its results arrived still reads "pending" there until it
 * is opened again (the page saves the result), so only a known outcome
 * gets a badge.
 */
function ReportStatus({ status }: { status?: string }) {
  if (status === 'complete') {
    return <Badge variant="secondary">Done</Badge>;
  }
  if (status === 'error') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return null;
}

/**
 * A saved reform's latest report on its library card: done, failed, or
 * still running (any other state the API's record is in).
 */
export function LatestReportBadge({
  countryId,
  apiReportId,
}: {
  countryId: CountryId;
  apiReportId: string;
}) {
  const api = useApiReport(countryId, apiReportId);
  if (!api) {
    return null;
  }
  if (api.status === 'complete' || api.status === 'error') {
    return <ReportStatus status={api.status} />;
  }
  return <Badge variant="outline">In progress</Badge>;
}

/**
 * What a report compared the reform with, when not current law: the same
 * reform against a saved reform is another report, and reads as one. The
 * run's details name it in the session that ran it; otherwise an account
 * record links the saved reform, named from this session's reforms.
 */
function ReportBaseline({
  report,
  reformName,
}: {
  report: FlagshipReportRecord;
  reformName?: (reformId: string) => string | null | undefined;
}) {
  const label =
    readReportMeta(reportLink(report))?.baseline?.label ??
    (report.baselineReformId ? reformName?.(report.baselineReformId) || 'a saved reform' : null);
  if (!label) {
    return null;
  }
  return (
    <span
      className="tw:truncate"
      style={{ minWidth: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}
    >
      Compared with {label}
    </span>
  );
}

/**
 * One report: what it scored, when its results are from, and the two ways
 * on — its stored results as of that run, or a fresh run of the same
 * report on today's model.
 */
function ReportRow({
  countryId,
  report,
  first,
  onOpen,
  onRerun,
  rerunning,
  reformName,
}: {
  countryId: CountryId;
  report: FlagshipReportRecord;
  first: boolean;
  onOpen: () => void;
  onRerun?: () => void;
  rerunning: boolean;
  reformName?: (reformId: string) => string | null | undefined;
}) {
  const api = useApiReport(countryId, report.apiReportId);
  // A record saved through the API keeps no year (the report itself
  // carries it), so it is read from the API's record.
  const year = report.year ?? api?.year;
  const done = api?.status === 'complete';
  const currentModel = useSelector((state: RootState) => state.metadata.version);
  // The same reform on the same model gives the same results: a re-run
  // is offered only once the model has moved on from the one that ran it.
  const ranModel = done ? modelVersionOf(api?.output) : null;
  const upToDate = !!ranModel && !!currentModel && ranModel === currentModel;
  const finished = done && api?.finished_at ? api.finished_at : null;
  return (
    <div
      data-report-row=""
      // Fixed columns, so every report's date, status and actions line up.
      className="tw:grid tw:grid-cols-[minmax(0,1fr)_72px_96px_132px] tw:max-sm:grid-cols-[minmax(0,1fr)_auto]"
      style={{
        alignItems: 'center',
        columnGap: spacing.md,
        rowGap: spacing.xs,
        padding: `${spacing.sm} 0`,
        borderTop: first ? undefined : `1px solid ${colors.border.light}`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
          }}
        >
          {year ? `${year} report` : 'Report'}
        </span>
        <span
          className="tw:truncate"
          style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
        >
          {finished
            ? `Results from ${dayjs(finished).format('MMM D, YYYY')}`
            : `Run ${dayjs(report.createdAt).format('MMM D, YYYY')}`}
        </span>
        <ReportBaseline report={report} reformName={reformName} />
      </div>
      <span>
        <ReportStatus status={api?.status} />
      </span>
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {onRerun && upToDate && (
          <span
            title={`Ran on model ${ranModel}, the current one`}
            style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
          >
            Up to date
          </span>
        )}
        {onRerun && !upToDate && (
          <Button size="sm" variant="ghost" onClick={onRerun} disabled={rerunning}>
            <IconRefresh size={14} />
            Re-run
          </Button>
        )}
      </span>
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="sm" variant="outline" onClick={onOpen} style={{ width: '100%' }}>
          {done ? 'View results' : 'Open'}
          <IconArrowRight size={14} />
        </Button>
      </span>
    </div>
  );
}

/**
 * The reports run from one saved reform, newest first: the year each
 * scored, what it compared the reform with when not current law, when
 * it ran, how it ended when the API knows, and a way back to it — the
 * reform is where its reports are found again.
 */
export default function ReformReports({
  countryId,
  reports,
  onRerun,
  rerunning = false,
  reformName,
}: {
  countryId: CountryId;
  reports: FlagshipReportRecord[];
  /** Runs the report again: same reform, year, population and comparison. */
  onRerun?: (report: FlagshipReportRecord) => void;
  /** A run is starting; Re-run waits for it. */
  rerunning?: boolean;
  /** A saved reform's name, for the reform a report was compared with. */
  reformName?: (reformId: string) => string | null | undefined;
}) {
  const nav = useAppNavigate();
  const sorted = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section
      aria-label="Reports"
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        Reports
      </Text>
      {sorted.length === 0 ? (
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          No reports yet. Run one with “View full impact report”.
        </Text>
      ) : (
        <Stack style={{ gap: 0 }}>
          {sorted.map((report, index) => (
            <ReportRow
              key={report.id}
              countryId={countryId}
              report={report}
              first={index === 0}
              // A report opens at its link: the account row's ID, which anyone
              // can open, or in this browser the v1 report's number.
              onOpen={() => nav.push(`/${countryId}/report/${reportLink(report)}`)}
              onRerun={onRerun && (() => onRerun(report))}
              rerunning={rerunning}
              reformName={reformName}
            />
          ))}
        </Stack>
      )}
    </section>
  );
}
