import { useEffect, useState } from 'react';
import { IconChartBar, IconPencil, IconX } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import { Button, Input, Stack, Text } from '@/components/ui';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { loadProvisionsIntoDraft, sameParameterValue } from '@/libs/draftReform';
import { reportProvisionName } from '@/libs/flagship/draftLabels';
import { RunReportBaseline, RunReportProvision } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import { Reform } from '@/types/ingredients/Reform';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { formatValue } from '@/utils/parameterValues';
import ProvisionSkeleton from './ProvisionSkeleton';
import PopulationPicker from './reform/PopulationPicker';
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
  /** The report's population ("state/ca"), so a recompute runs on it too. */
  region?: string;
  /** The report's year, so a recompute simulates the same year. */
  year?: string;
  /** What the report is compared with, so a recompute is too; current law when unset. */
  baseline?: RunReportBaseline;
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
 * reforms this browser saved — an exact match is reused, anything new
 * is saved as its own reform — then runs the pipeline and lands on the
 * new report, linked to that reform. Collapses to a slim edge tab.
 */
export default function ReportAdjustPanel({
  title,
  sourceNote,
  provisions,
  loading = false,
  region,
  year,
  baseline,
}: ReportAdjustPanelProps) {
  const runReport = useRunFlagshipReport();
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(provisions.map((provision) => [provision.path, provision.value]))
  );
  // Who the recompute runs on: the report's population to start, any other on choice.
  // The whole country is the API's region for it, not a part of it.
  const reportRegion = region && region !== countryId ? region : undefined;
  const [population, setPopulation] = useState<string | undefined>(reportRegion);
  const [populationChosen, setPopulationChosen] = useState(false);
  // The report's population can arrive after the panel does (its simulations
  // load later); follow it until a population is chosen here.
  useEffect(() => {
    if (!populationChosen) {
      setPopulation(reportRegion);
    }
  }, [reportRegion, populationChosen]);
  // What the recomputed reform and its report are called: this report's
  // name to start; left as is, the new one is "… (adjusted)".
  const [name, setName] = useState(title);
  const renamed = name.trim() !== '' && name.trim() !== title.trim();
  const regions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  const active = provisions.filter((provision) => !removed.has(provision.path));
  const isDirty =
    removed.size > 0 ||
    renamed ||
    population !== reportRegion ||
    provisions.some((provision) => values[provision.path] !== provision.value);
  const busy = isReconciling || runReport.isRunning;

  if (provisions.length === 0) {
    return null;
  }

  /**
   * The provisions as the panel has them. A value edited here replaces the
   * provision's own dates — one value, from the report's year on — or the
   * run would keep the dates and ignore the edit.
   */
  const adjustedProvisions = () =>
    active.map((provision) => {
      const value = values[provision.path];
      return sameParameterValue(value, provision.value)
        ? { ...provision }
        : { ...provision, value, intervals: undefined };
    });

  // Back to Build with the reform as the panel has it, to add to it there.
  const editInBuild = () => {
    const label = name.trim() || title;
    loadProvisionsIntoDraft(countryId, adjustedProvisions(), {
      label: label === 'Draft reform' ? '' : label,
      year: year ? Number(year) : undefined,
      region: population,
      baselineReformId: baseline?.reformId,
    });
    nav.push(`/${countryId}/build`);
  };

  const recompute = async () => {
    setReconcileError(null);
    setIsReconciling(true);
    try {
      const adjusted = adjustedProvisions();

      // Reconcile with this browser's saved reforms: reuse an exact
      // match, otherwise save the adjusted set as its own reform.
      const store = getReformStore();
      const existing = await store.findMine(countryId);
      const match = existing.find((reform) => reformMatches(reform, adjusted));

      const label = renamed ? name.trim() : `${title} (adjusted)`;
      let reformId: string;
      let runTitle: string;
      if (match) {
        reformId = match.id!;
        runTitle = renamed ? label : match.label || label;
      } else {
        const created = await store.create({
          countryId,
          label,
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
        runTitle = created.label || label;
      }

      await runReport.run(
        runTitle,
        sourceNote,
        adjusted,
        reformId,
        year ? Number(year) : undefined,
        { region: population, baseline }
      );
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
      {/* The name and population are adjustable too: the same reform, named or run anew. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          padding: `${spacing.md} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            Reform name
          </span>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <PopulationPicker
          value={population ?? ''}
          onChange={(next) => {
            setPopulationChosen(true);
            setPopulation(next);
          }}
          regions={regions}
        />
      </div>
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
                      Baseline: {formatValue(provision.baselineValue, provision.unit)}
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
        <Button variant="outline" onClick={editInBuild} disabled={busy || active.length === 0}>
          <IconPencil size={16} />
          Edit in Build
        </Button>
      </Stack>
    </SidePanel>
  );
}
