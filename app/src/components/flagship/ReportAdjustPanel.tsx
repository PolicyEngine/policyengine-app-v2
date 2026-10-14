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
import {
  loadProvisionsIntoDraft,
  provisionIntervals,
  sameParameterValue,
} from '@/libs/draftReform';
import { reportProvisionName } from '@/libs/flagship/draftLabels';
import { findMatchingReform } from '@/libs/flagship/reformMatch';
import { RunReportBaseline, RunReportProvision } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
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
  /**
   * The report's baseline policy could not be loaded. A recompute would
   * compare with current law instead, so it is off.
   */
  baselineUnknown?: boolean;
}

/**
 * The report's companion panel: every provision stays editable (or
 * removable) beside the results. Recompute first reconciles with the
 * reforms this browser saved — an exact match is reused, anything new
 * is saved as its own reform — then runs the pipeline and lands on the
 * new report, linked to that reform. Collapses to a slim edge tab.
 *
 * It starts over from the reform whenever the reform changes: a shared
 * link's provisions can arrive after the results, and the values and
 * name it edits must be theirs, not those of the empty reform before.
 */
export default function ReportAdjustPanel(props: ReportAdjustPanelProps) {
  const reform = JSON.stringify([
    props.title,
    props.provisions.map((provision) => [
      provision.path,
      provision.value,
      provision.intervals ?? null,
    ]),
  ]);
  return <AdjustPanel key={reform} {...props} />;
}

function AdjustPanel({
  title,
  sourceNote,
  provisions,
  loading = false,
  region,
  year,
  baseline,
  baselineUnknown = false,
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

  // The year a recompute simulates; the current year when the report has none.
  const runYear = year ? Number(year) : undefined;

  /**
   * The provisions as the panel has them. A value edited here holds from
   * 1 January of the report's year on, over whatever dated values come
   * before it (as Build's inline edit sets it): left on the provision's
   * old dates, or on the current year's, the run would miss the edit.
   */
  const adjustedProvisions = (): RunReportProvision[] =>
    active.map((provision) => {
      const value = values[provision.path];
      if (sameParameterValue(value, provision.value)) {
        return { ...provision };
      }
      const schedule = new ValueIntervalCollection(provisionIntervals(provision));
      schedule.addInterval({
        startDate: `${runYear ?? CURRENT_YEAR}-01-01`,
        endDate: FOREVER,
        value,
      });
      return {
        ...provision,
        value,
        intervals: schedule.getIntervals(),
        // A value held from one year on no longer grows as the old one did.
        growth: undefined,
        growthStart: undefined,
        growthBase: undefined,
        growthRoundTo: undefined,
        growthRound: undefined,
      };
    });

  // Back to Build with the reform as the panel has it, to add to it there.
  const editInBuild = () => {
    const label = name.trim() || title;
    loadProvisionsIntoDraft(countryId, adjustedProvisions(), {
      label: label === 'Draft reform' ? '' : label,
      year: runYear,
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
      // The reform as it runs: every provision with the dated values the
      // run sends (see provisionPeriods), so what is saved is what ran.
      const parameters = adjusted.map((provision) => ({
        name: provision.path,
        values: provisionIntervals(provision),
      }));

      // Reconcile with this browser's saved reforms: reuse one that sets
      // the same values over the same dates, otherwise save this one.
      const store = getReformStore();
      const match = findMatchingReform(await store.findMine(countryId), parameters);

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
          parameters,
          baseline: 'current-law',
          provenance: { source: 'manual', ref: 'report-adjust' },
        });
        queryClient.invalidateQueries({ queryKey: ['reforms'] });
        reformId = created.id!;
        runTitle = created.label || label;
      }

      await runReport.run(runTitle, sourceNote, adjusted, reformId, runYear, {
        region: population,
        baseline,
      });
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
                    // A fingertip wide on a phone, without moving the name.
                    className="tw:max-sm:-my-3 tw:max-sm:-mr-3 tw:max-sm:inline-flex tw:max-sm:size-10 tw:max-sm:items-center tw:max-sm:justify-center"
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
              className="tw:max-sm:min-h-10"
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
        {baselineUnknown && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            The baseline policy could not be loaded, so a recompute cannot compare with it.
          </Text>
        )}
        <Button
          onClick={recompute}
          disabled={baselineUnknown || !isDirty || busy || active.length === 0}
        >
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
