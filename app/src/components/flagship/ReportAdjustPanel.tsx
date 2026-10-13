import { useState } from 'react';
import { IconChartBar, IconX } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Stack, Text } from '@/components/ui';
import { CURRENT_YEAR, FOREVER, MOCK_USER_ID } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useReformStore } from '@/hooks/useFlagshipStores';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { sameParameterValue } from '@/libs/draftReform';
import { reportProvisionName } from '@/libs/flagship/draftLabels';
import { RunReportProvision } from '@/libs/flagship/runReport';
import { Reform } from '@/types/ingredients/Reform';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { formatValue } from '@/utils/parameterValues';
import ProvisionSkeleton from './ProvisionSkeleton';
import NumberInput from './reform/ValueInput';
import SidePanel from './SidePanel';
import ValueInput from './ValueInput';

interface ReportAdjustPanelProps {
  /** Title of the report being adjusted; the recomputed one appends "(adjusted)". */
  title: string;
  sourceNote: string;
  provisions: RunReportProvision[];
  /** The parameters' names and units are still loading: placeholders, not raw paths. */
  loading?: boolean;
}

/**
 * True when the reform's parameter set is exactly the given provisions. A
 * reform whose changes could not be loaded matches nothing: its empty
 * parameter list is not its real changes.
 */
function reformMatches(reform: Reform, provisions: { path: string; value: any }[]): boolean {
  if (reform.parametersUnavailable || reform.parameters.length !== provisions.length) {
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
  loading = false,
}: ReportAdjustPanelProps) {
  const runReport = useRunFlagshipReport();
  const countryId = useCurrentCountry();
  const store = useReformStore();
  const queryClient = useQueryClient();
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

  return (
    <SidePanel
      title="Adjust parameters"
      meta={`${active.length} provision${active.length === 1 ? '' : 's'}`}
      defaultOpen={false}
    >
      {loading ? (
        <div style={{ padding: `0 ${spacing.lg}` }}>
          <ProvisionSkeleton count={active.length} />
        </div>
      ) : (
        <Stack style={{ gap: 0 }}>
          {active.map((provision) => {
            const name = reportProvisionName(provision);
            return (
              <Stack
                key={provision.path}
                style={{
                  gap: spacing.sm,
                  padding: `${spacing.md} ${spacing.lg}`,
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
                  {/* The name in full, wrapping; the parameter's place in the tree on hover. */}
                  <Text
                    title={provision.breadcrumb || provision.path}
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      lineHeight: typography.lineHeight.tight,
                      color: colors.text.primary,
                    }}
                  >
                    {name}
                  </Text>
                  <button
                    type="button"
                    onClick={() => setRemoved((current) => new Set([...current, provision.path]))}
                    aria-label={`Remove ${name}`}
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
                {/* The value to edit; what it was, quietly beside it, as Build shows it. */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: spacing.sm,
                  }}
                >
                  {typeof values[provision.path] === 'boolean' ? (
                    <ValueInput
                      value={values[provision.path]}
                      onChange={(next) =>
                        setValues((current) => ({ ...current, [provision.path]: next }))
                      }
                      ariaLabel={`New value for ${name}`}
                    />
                  ) : (
                    // Build's box: rates as percentages, amounts with their currency.
                    <div style={{ width: 150 }}>
                      <NumberInput
                        param={{ unit: provision.unit } as ParameterMetadata}
                        value={values[provision.path]}
                        onChange={(next) =>
                          setValues((current) => ({ ...current, [provision.path]: next }))
                        }
                        ariaLabel={`New value for ${name}`}
                      />
                    </div>
                  )}
                  {!sameParameterValue(values[provision.path], provision.baselineValue) && (
                    <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      was {formatValue(provision.baselineValue, provision.unit)}
                    </Text>
                  )}
                </div>
              </Stack>
            );
          })}
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
      )}

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
      </Stack>
    </SidePanel>
  );
}
