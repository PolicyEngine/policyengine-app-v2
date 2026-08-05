import { useParams } from 'react-router-dom';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useUserReportById } from '@/hooks/useUserReports';
import { readReportMeta } from '@/libs/flagship/runReport';
import { SocietyWideReportOutput } from '@/pages/report-output/SocietyWideReportOutput';
import { formatCompactBreadcrumb } from '@/utils/parameterLabels';
import { formatValue } from '@/utils/parameterValues';

interface FlagshipReportPageProps {
  /** Passed by the Next.js route bridge; react-router falls back to params. */
  userReportId?: string;
}

/**
 * The flagship report — the one output artifact every door leads to.
 * Provenance on top (what exactly is modeled, from the bill or draft),
 * then the full society-wide impact dashboard, in the style of the
 * one-off policy dashboards. The calculation auto-starts and streams
 * in via the standard report machinery.
 */
export default function FlagshipReportPage({ userReportId: propId }: FlagshipReportPageProps) {
  const params = useParams<{ userReportId: string }>();
  const userReportId = propId ?? params.userReportId ?? '';
  const meta = readReportMeta(userReportId);
  const { report, simulations, policies, userPolicies, geographies } =
    useUserReportById(userReportId);

  return (
    <Stack style={{ maxWidth: 1080, margin: '0 auto', gap: spacing.xl }}>
      <Stack style={{ gap: spacing.sm }}>
        <Stack
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <Title order={1} style={{ margin: 0 }}>
            {meta?.title || report?.label || 'Impact report'}
          </Title>
          {meta?.sourceNote && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {meta.sourceNote}
            </Text>
          )}
        </Stack>

        {meta && meta.provisions.length > 0 && (
          <div
            style={{
              background: colors.gray[50],
              borderRadius: 10,
              padding: `${spacing.xs} 0`,
            }}
          >
            {meta.provisions.map((provision) => (
              <div
                key={provision.path}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: spacing.lg,
                  padding: `${spacing.xs} ${spacing.md}`,
                }}
              >
                <Text
                  title={provision.breadcrumb || provision.path}
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCompactBreadcrumb(provision.breadcrumb || provision.path)}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    color: colors.text.secondary,
                  }}
                >
                  {formatValue(provision.baselineValue, provision.unit)} →{' '}
                  <span
                    style={{
                      color: colors.primary[700],
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {formatValue(provision.value, provision.unit)}
                  </span>
                </Text>
              </div>
            ))}
          </div>
        )}
      </Stack>

      <SocietyWideReportOutput
        reportId={userReportId}
        subpage="migration"
        report={report}
        simulations={simulations}
        policies={policies}
        userPolicies={userPolicies}
        geographies={geographies}
      />
    </Stack>
  );
}
