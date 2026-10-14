import dayjs from 'dayjs';
import { IconArrowRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { fetchReportById } from '@/api/report';
import { Badge, Button, Stack, Text } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';

/**
 * Where a report stands, as the API's record says. A report whose page
 * closed before its results arrived still reads "pending" there until it
 * is opened again (the page saves the result), so only a known outcome
 * gets a badge.
 */
function ReportStatus({ countryId, apiReportId }: { countryId: CountryId; apiReportId: string }) {
  const { data } = useQuery({
    queryKey: ['flagship-report-status', countryId, apiReportId],
    queryFn: () => fetchReportById(countryId, apiReportId),
    staleTime: 60_000,
    retry: false,
  });
  if (data?.status === 'complete') {
    return <Badge variant="secondary">Done</Badge>;
  }
  if (data?.status === 'error') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return null;
}

/**
 * The reports run from one saved reform, newest first: the year each
 * scored, when it ran, how it ended when the API knows, and a way back
 * to it — the reform is where its reports are found again.
 */
export default function ReformReports({
  countryId,
  reports,
}: {
  countryId: CountryId;
  reports: FlagshipReportRecord[];
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
            <div
              key={report.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: `${spacing.sm} 0`,
                borderTop: index > 0 ? `1px solid ${colors.border.light}` : undefined,
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  whiteSpace: 'nowrap',
                }}
              >
                {report.year} report
              </span>
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                Run {dayjs(report.createdAt).format('MMM D, YYYY')}
              </span>
              <ReportStatus countryId={countryId} apiReportId={report.apiReportId} />
              <Button
                size="sm"
                variant="ghost"
                style={{ marginLeft: 'auto' }}
                onClick={() => nav.push(`/${countryId}/report/${report.apiReportId}`)}
              >
                Open
                <IconArrowRight size={14} />
              </Button>
            </div>
          ))}
        </Stack>
      )}
    </section>
  );
}
