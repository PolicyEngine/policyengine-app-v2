import { IconChartBar, IconMap2, IconRosetteDiscountCheck, IconUsers } from '@tabler/icons-react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { Stack } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { formatCurrencyAbbr } from '@/utils/formatters';

function povertyChange(values: { baseline: number; reform: number }) {
  const { baseline, reform } = values;
  if (!Number.isFinite(baseline) || !Number.isFinite(reform)) {
    return 'Unavailable';
  }
  if (reform === baseline) {
    return 'No change';
  }
  if (baseline === 0) {
    return 'Relative change unavailable';
  }
  const magnitude = Math.abs((reform - baseline) / baseline) * 100;
  return `${magnitude < 0.1 ? '<0.1' : magnitude.toFixed(1)}% ${reform < baseline ? 'decrease' : 'increase'}`;
}

export default function ReportContents({
  output,
  countryId,
  districtAvailable,
  onOpen,
}: {
  output: SocietyWideReportOutput;
  countryId: Parameters<typeof formatCurrencyAbbr>[1];
  districtAvailable: boolean;
  onOpen: (section: string) => void;
}) {
  const budget = output.budget.budgetary_impact;
  const distribution = output.intra_decile.all;
  const gains = distribution['Gain more than 5%'] + distribution['Gain less than 5%'];
  const metrics = [
    {
      value: Number.isFinite(budget)
        ? formatCurrencyAbbr(Math.abs(budget), countryId, { maximumFractionDigits: 1 })
        : 'Unavailable',
      label:
        budget < 0
          ? 'Annual government cost'
          : budget > 0
            ? 'Annual government savings'
            : 'Annual budget change',
    },
    {
      value: Number.isFinite(gains) ? `${(gains * 100).toFixed(1)}%` : 'Unavailable',
      label: 'Households gaining',
    },
    {
      value: povertyChange(output.poverty.poverty.child),
      label: 'Child poverty · relative change',
    },
  ];
  const sections = [
    {
      id: 'economy',
      title: 'Economic impacts',
      icon: IconChartBar,
      action: 'Explore economic impacts',
      preview: '',
    },
    {
      id: 'districts',
      title: 'District impacts',
      icon: IconMap2,
      action: 'Explore districts',
      preview: districtAvailable
        ? 'Compare income changes across districts on a map.'
        : 'District-level impacts are not available for this report’s scope.',
    },
    {
      id: 'household',
      title: 'Household impacts',
      icon: IconUsers,
      action: 'Explore household impacts',
      preview: 'Add a household to see how its taxes and benefits change.',
    },
    {
      id: 'validation',
      title: 'Validation',
      icon: IconRosetteDiscountCheck,
      action: 'Review validation',
      preview: 'Examine the data fit and evidence behind the estimates.',
    },
  ];
  return (
    <Stack style={{ gap: spacing.md }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
          gap: spacing.lg,
        }}
      >
        {sections.map((section) => (
          <button
            type="button"
            key={section.id}
            onClick={() => onOpen(section.id)}
            aria-label={section.action}
            className="tw:group tw:hover:shadow-md tw:transition-all tw:hover:-translate-y-0.5 tw:motion-reduce:transform-none tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gridColumn: section.id === 'economy' ? '1 / -1' : undefined,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: colors.text.primary,
              background:
                section.id === 'districts'
                  ? colors.primary[50]
                  : section.id === 'household'
                    ? colors.secondary[50]
                    : colors.background.primary,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.feature,
              padding: spacing['2xl'],
              boxShadow:
                section.id === 'economy'
                  ? `0 ${spacing.xs} ${spacing.xl} ${colors.gray[100]}`
                  : undefined,
              gap: spacing.lg,
            }}
          >
            <span
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                gap: spacing.md,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  color: colors.primary[700],
                  fontSize: typography.fontSize.sm,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: typography.fontWeight.normal,
                }}
              >
                <section.icon size={24} stroke={1.5} />
              </span>
              {section.title}
            </span>
            <span
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.lg,
              }}
            >
              {section.id === 'economy' ? (
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xl }}>
                  {metrics.map((metric) => (
                    <span
                      key={metric.label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing.sm,
                        borderLeft: `2px solid ${colors.primary[200]}`,
                        paddingLeft: spacing.lg,
                        flex: '1 1 130px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: typography.fontSize['4xl'],
                          color: colors.text.primary,
                          fontWeight: typography.fontWeight.semibold,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {metric.value}
                      </span>
                      <span
                        style={{ color: colors.text.secondary, fontSize: typography.fontSize.xs }}
                      >
                        {metric.label}
                      </span>
                    </span>
                  ))}
                </span>
              ) : (
                <span
                  style={{
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.sm,
                    lineHeight: 1.6,
                  }}
                >
                  {section.preview}
                </span>
              )}
              <span
                style={{
                  marginTop: 'auto',
                  color: colors.primary[700],
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                }}
              >
                {section.action} →
              </span>
            </span>
          </button>
        ))}
      </div>
    </Stack>
  );
}
