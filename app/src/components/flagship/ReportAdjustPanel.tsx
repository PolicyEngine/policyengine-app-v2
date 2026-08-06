import { useState } from 'react';
import { IconAdjustments, IconChartBar, IconLayoutSidebarRightCollapse } from '@tabler/icons-react';
import { Button, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { RunReportProvision } from '@/libs/flagship/runReport';
import { formatCompactBreadcrumb } from '@/utils/parameterLabels';
import { formatValue } from '@/utils/parameterValues';
import ValueInput from './ValueInput';

interface ReportAdjustPanelProps {
  /** Title of the report being adjusted; the recomputed one appends "(adjusted)". */
  title: string;
  sourceNote: string;
  provisions: RunReportProvision[];
}

/**
 * The report's companion panel: every provision stays editable beside
 * the results, and Recompute runs the pipeline with the adjusted
 * values — landing on the new report. Collapses to a slim edge tab.
 */
export default function ReportAdjustPanel({
  title,
  sourceNote,
  provisions,
}: ReportAdjustPanelProps) {
  const runReport = useRunFlagshipReport();
  const [collapsed, setCollapsed] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(provisions.map((provision) => [provision.path, provision.value]))
  );

  const isDirty = provisions.some((provision) => values[provision.path] !== provision.value);

  if (provisions.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Adjust parameters"
        style={{
          position: 'sticky',
          top: spacing.md,
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          padding: `${spacing.sm} ${spacing.md}`,
          border: `1px solid ${colors.border.light}`,
          borderRadius: 10,
          background: colors.background.primary,
          cursor: 'pointer',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
          whiteSpace: 'nowrap',
        }}
      >
        <IconAdjustments size={16} color={colors.primary[700]} />
        Adjust
      </button>
    );
  }

  return (
    <Stack
      aria-label="Adjust parameters"
      style={{
        gap: 0,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
        overflow: 'hidden',
        position: 'sticky',
        top: spacing.md,
        alignSelf: 'flex-start',
        width: '100%',
      }}
    >
      <Stack
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          padding: `${spacing.md} ${spacing.lg}`,
          background: colors.gray[50],
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Adjust parameters
        </Text>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse the adjust panel"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: colors.text.secondary,
            display: 'inline-flex',
            padding: 2,
          }}
        >
          <IconLayoutSidebarRightCollapse size={16} />
        </button>
      </Stack>

      <Stack style={{ gap: 0 }}>
        {provisions.map((provision) => (
          <Stack
            key={provision.path}
            style={{
              gap: spacing.xs,
              padding: `${spacing.sm} ${spacing.lg}`,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <Text
              title={provision.breadcrumb || provision.path}
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatCompactBreadcrumb(provision.breadcrumb || provision.path)}
            </Text>
            <Stack
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                flexWrap: 'wrap',
              }}
            >
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatValue(provision.baselineValue, provision.unit)} →
              </Text>
              <ValueInput
                value={values[provision.path]}
                onChange={(next) =>
                  setValues((current) => ({ ...current, [provision.path]: next }))
                }
                ariaLabel={`Adjusted value for ${provision.path}`}
              />
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Stack style={{ gap: spacing.sm, padding: spacing.lg }}>
        {runReport.error && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
            {runReport.error}
          </Text>
        )}
        <Button
          onClick={() =>
            runReport.run(
              `${title} (adjusted)`,
              sourceNote,
              provisions.map((provision) => ({
                ...provision,
                value: values[provision.path],
              }))
            )
          }
          disabled={!isDirty || runReport.isRunning}
        >
          <IconChartBar size={16} />
          {runReport.isRunning ? 'Recomputing…' : 'Recompute'}
        </Button>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Runs a fresh nationwide report with your values.
        </Text>
      </Stack>
    </Stack>
  );
}
