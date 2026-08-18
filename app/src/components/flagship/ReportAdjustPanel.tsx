import { useState } from 'react';
import {
  IconAdjustments,
  IconChartBar,
  IconLayoutSidebarRightCollapse,
  IconX,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { getReformStore } from '@/api/reformStore';
import { Button, Stack, Text } from '@/components/ui';
import { CURRENT_YEAR, FOREVER, MOCK_USER_ID } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { RunReportProvision } from '@/libs/flagship/runReport';
import { Reform } from '@/types/ingredients/Reform';
import { formatCompactBreadcrumb } from '@/utils/parameterLabels';
import { formatValue } from '@/utils/parameterValues';
import ValueInput from './ValueInput';

interface ReportAdjustPanelProps {
  /** Title of the report being adjusted; the recomputed one appends "(adjusted)". */
  title: string;
  sourceNote: string;
  provisions: RunReportProvision[];
}

/** True when the reform's parameter set is exactly the given provisions. */
function reformMatches(reform: Reform, provisions: { path: string; value: any }[]): boolean {
  if (reform.parameters.length !== provisions.length) {
    return false;
  }
  return provisions.every((provision) =>
    reform.parameters.some(
      (parameter) =>
        parameter.name === provision.path &&
        String(parameter.values[0]?.value) === String(provision.value)
    )
  );
}

/**
 * The report's companion panel: every provision stays editable (or
 * removable) beside the results. Recompute first reconciles with the
 * saved reforms — an exact match is reused, anything new is saved as
 * its own reform — then runs the pipeline and lands on the new
 * report, linked to that reform. Collapses to a slim edge tab.
 */
export default function ReportAdjustPanel({
  title,
  sourceNote,
  provisions,
}: ReportAdjustPanelProps) {
  const runReport = useRunFlagshipReport();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(provisions.map((provision) => [provision.path, provision.value]))
  );

  const active = provisions.filter((provision) => !removed.has(provision.path));
  const isDirty =
    removed.size > 0 || provisions.some((provision) => values[provision.path] !== provision.value);
  const busy = isReconciling || runReport.isRunning;

  if (provisions.length === 0) {
    return null;
  }

  const recompute = async () => {
    setReconcileError(null);
    setIsReconciling(true);
    try {
      const adjusted = active.map((provision) => ({
        ...provision,
        value: values[provision.path],
      }));

      // Reconcile with saved reforms: reuse an exact match, otherwise
      // save the adjusted set as its own reform.
      const store = getReformStore();
      const existing = await store.findByUser(MOCK_USER_ID, countryId);
      const match = existing.find((reform) => reformMatches(reform, adjusted));

      let reformId: string;
      let runTitle: string;
      if (match) {
        reformId = match.id!;
        runTitle = match.label || `${title} (adjusted)`;
      } else {
        const created = await store.create({
          userId: MOCK_USER_ID,
          countryId,
          label: `${title} (adjusted)`,
          parameters: adjusted.map((provision) => ({
            name: provision.path,
            values: [
              {
                startDate: `${CURRENT_YEAR}-01-01`,
                endDate: FOREVER,
                value: provision.value,
              },
            ],
          })),
          baseline: 'current-law',
          provenance: { source: 'manual', ref: 'report-adjust' },
        });
        queryClient.invalidateQueries({ queryKey: ['reforms'] });
        reformId = created.id!;
        runTitle = created.label || `${title} (adjusted)`;
      }

      await runReport.run(runTitle, sourceNote, adjusted, reformId);
    } catch {
      setReconcileError('Could not start the recompute. Try again.');
    } finally {
      setIsReconciling(false);
    }
  };

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
        {active.map((provision) => (
          <Stack
            key={provision.path}
            style={{
              gap: spacing.xs,
              padding: `${spacing.sm} ${spacing.lg}`,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <Stack
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: spacing.sm,
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
              <button
                type="button"
                onClick={() => setRemoved((current) => new Set([...current, provision.path]))}
                aria-label={`Remove ${provision.breadcrumb || provision.path}`}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: colors.text.secondary,
                  padding: 2,
                  flexShrink: 0,
                }}
              >
                <IconX size={14} />
              </button>
            </Stack>
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
        {active.length === 0 && (
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              padding: `${spacing.md} ${spacing.lg}`,
            }}
          >
            All provisions removed — restore some to recompute.
          </Text>
        )}
        {removed.size > 0 && (
          <button
            type="button"
            onClick={() => setRemoved(new Set())}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: colors.text.secondary,
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.primary,
              padding: `${spacing.sm} ${spacing.lg}`,
              textAlign: 'left',
            }}
          >
            Restore {removed.size} removed provision{removed.size === 1 ? '' : 's'}
          </button>
        )}
      </Stack>

      <Stack style={{ gap: spacing.sm, padding: spacing.lg }}>
        {(reconcileError || runReport.error) && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
            {reconcileError || runReport.error}
          </Text>
        )}
        <Button onClick={recompute} disabled={!isDirty || busy || active.length === 0}>
          <IconChartBar size={16} />
          {busy ? 'Recomputing…' : 'Recompute'}
        </Button>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Reuses a matching saved reform or saves your version as a new one, then runs a fresh
          report.
        </Text>
      </Stack>
    </Stack>
  );
}
