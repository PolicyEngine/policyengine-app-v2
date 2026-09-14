import { useMemo, useState } from 'react';
import { IconChartBar, IconX } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import { Button, Stack, Text } from '@/components/ui';
import { CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  getEffectiveRunReportProvisions,
  getRunReportProvisionValue,
  RunReportProvision,
} from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import { Reform } from '@/types/ingredients/Reform';
import type { Parameter } from '@/types/subIngredients/parameter';
import { formatCompactBreadcrumb } from '@/utils/parameterLabels';
import { formatValue } from '@/utils/parameterValues';
import {
  NO_EFFECTIVE_POLICY_CHANGES_MESSAGE,
  normalizePolicyParameters,
  policyParametersEqual,
} from '@/utils/policyCurrentLaw';
import { updateParameterValueAtDate } from '@/utils/policyParameterUpdate';
import SidePanel from './SidePanel';
import ValueInput from './ValueInput';

interface ReportAdjustPanelProps {
  /** Title of the report being adjusted; the recomputed one appends "(adjusted)". */
  title: string;
  sourceNote: string;
  provisions: RunReportProvision[];
}

/** True when a saved reform has the same effective parameter intervals. */
function reformMatches(
  reform: Reform,
  effectiveParameters: Parameter[],
  currentLawMetadata: RootState['metadata']['parameters']
): boolean {
  return policyParametersEqual(
    normalizePolicyParameters(reform.parameters, currentLawMetadata),
    effectiveParameters
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
  const metadata = useSelector((state: RootState) => state.metadata);
  const queryClient = useQueryClient();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [adjusted, setAdjusted] = useState<RunReportProvision[]>(() =>
    provisions.map((provision) => ({
      ...provision,
      values: provision.values.map((interval) => ({ ...interval })),
    }))
  );

  const active = useMemo(
    () => adjusted.filter((provision) => !removed.has(provision.path)),
    [adjusted, removed]
  );
  const hasRequiredMetadata =
    !metadata.loading &&
    !metadata.error &&
    metadata.currentCountry === countryId &&
    metadata.version !== null &&
    metadata.currentLawId > 0 &&
    active.every((provision) => metadata.parameters[provision.path]?.values);
  const effectiveProvisions = useMemo(
    () => (hasRequiredMetadata ? getEffectiveRunReportProvisions(active, metadata.parameters) : []),
    [active, hasRequiredMetadata, metadata.parameters]
  );
  const effectiveParameters = effectiveProvisions.map((provision) => ({
    name: provision.path,
    values: provision.values,
  }));
  const isDirty =
    removed.size > 0 ||
    !policyParametersEqual(
      provisions.map((provision) => ({ name: provision.path, values: provision.values })),
      adjusted.map((provision) => ({ name: provision.path, values: provision.values }))
    );
  const busy = isReconciling || runReport.isRunning;

  if (provisions.length === 0) {
    return null;
  }

  const recompute = async () => {
    if (!hasRequiredMetadata || effectiveParameters.length === 0) {
      return;
    }
    setReconcileError(null);
    setIsReconciling(true);
    try {
      // Reconcile with saved reforms: reuse an exact match, otherwise
      // save the adjusted set as its own reform.
      const store = getReformStore();
      const existing = await store.findByUser(MOCK_USER_ID, countryId);
      const match = existing.find((reform) =>
        reformMatches(reform, effectiveParameters, metadata.parameters)
      );

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
          parameters: effectiveParameters,
          baseline: 'current-law',
          provenance: { source: 'manual', ref: 'report-adjust' },
        });
        queryClient.invalidateQueries({ queryKey: ['reforms'] });
        reformId = created.id!;
        runTitle = created.label || `${title} (adjusted)`;
      }

      await runReport.run(runTitle, sourceNote, effectiveProvisions, reformId);
    } catch {
      setReconcileError('Could not start the recompute. Try again.');
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <SidePanel
      title="Adjust parameters"
      meta={`${active.length} provision${active.length === 1 ? '' : 's'}`}
      defaultOpen={false}
    >
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
                value={getRunReportProvisionValue(provision)}
                onChange={(next) =>
                  setAdjusted((current) =>
                    current.map((currentProvision) => {
                      if (currentProvision.path !== provision.path) {
                        return currentProvision;
                      }
                      const updated = updateParameterValueAtDate(
                        { name: currentProvision.path, values: currentProvision.values },
                        `${CURRENT_YEAR}-01-01`,
                        next
                      );
                      return { ...currentProvision, values: updated.values };
                    })
                  )
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
        {isDirty &&
          active.length > 0 &&
          hasRequiredMetadata &&
          effectiveParameters.length === 0 && (
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
              {NO_EFFECTIVE_POLICY_CHANGES_MESSAGE}
            </Text>
          )}
        <Button
          onClick={recompute}
          disabled={
            !isDirty ||
            busy ||
            active.length === 0 ||
            !hasRequiredMetadata ||
            effectiveParameters.length === 0
          }
        >
          <IconChartBar size={16} />
          {busy ? 'Recomputing…' : 'Recompute'}
        </Button>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Reuses a matching saved reform or saves your version as a new one, then runs a fresh
          report.
        </Text>
      </Stack>
    </SidePanel>
  );
}
