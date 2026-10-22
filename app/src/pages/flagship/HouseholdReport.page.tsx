import { useId, useMemo, useState, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { SavedHousehold } from '@/api/savedHouseholdStore';
import HouseholdBuilderPanel from '@/components/flagship/household/HouseholdBuilderPanel';
import HouseholdNetIncomeResult from '@/components/flagship/household/HouseholdNetIncomeResult';
import SavedHouseholdPicker from '@/components/flagship/household/SavedHouseholdPicker';
import SaveHouseholdForm from '@/components/flagship/household/SaveHouseholdForm';
import type { HouseholdBreakdownSource } from '@/components/flagship/report/household/HouseholdBreakdowns';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import { Button, Label, Spinner, Stack, Text, Title } from '@/components/ui';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { colors, spacing, typography } from '@/designTokens';
import {
  useFlagshipHouseholdPolicies,
  useRequestedHouseholdRun,
} from '@/hooks/useFlagshipHousehold';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import { householdAmountInputs, newV3Household } from '@/libs/flagship/householdReport';
import type { HouseholdCalculationProvenance } from '@/libs/flagship/householdRun';
import { getTaxYears } from '@/libs/metadataUtils';
import type { Household } from '@/models/Household';
import HouseholdSubPage from '@/pages/report-output/HouseholdSubPage';
import PolicySubPage from '@/pages/report-output/PolicySubPage';
import HouseholdReproducibility from '@/pages/report-output/reproduce-in-python/HouseholdReproducibility';
import { copyHouseholdToYear } from '@/pages/reportBuilder/utils/changeReportYear';
import type { RootState } from '@/store';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { convertPoliciesToV1Format, type HouseholdReproduction } from '@/utils/reproducibilityCode';

/** Both policies run at once; a household new to the Public API takes about three minutes. */
const EXPECTED_MS = 3 * 60 * 1000;

export interface HouseholdReportPageProps {
  /** The household's country: its model, currency and inputs. */
  countryId: 'us' | 'uk';
  /**
   * The year the report opens in; the household it opens with moves to it.
   * The reader can choose another.
   */
  year: string;
  /** The household the report opens with; a new household when absent. */
  household?: Household;
  /** The saved household the report opens with: the builder holds it, and saving edits it. */
  savedHousehold?: SavedHousehold | null;
  /** The baseline policy: current law unless given. */
  baselinePolicyId?: string;
  /** What the baseline is called: "current law" unless given. */
  baselineLabel?: string;
  /** The reform policy; without it, or when it is the baseline, the report is baseline-only. */
  reformPolicyId?: string;
  /** What the reform is called, for the heading. */
  reformLabel?: string;
  title?: string;
}

/** A calculation's model versions, from its .py bundle, else its SPM receipt. */
function versionsOf(provenance: HouseholdCalculationProvenance, countryId: string) {
  return {
    policyengineVersion:
      provenance.policyengineBundle?.policyengine_version ??
      provenance.spmProvenance?.runtime_versions?.policyengine ??
      null,
    modelVersion:
      provenance.policyengineBundle?.model_version ??
      provenance.spmProvenance?.runtime_versions?.[`policyengine-${countryId}`] ??
      null,
  };
}

/** A household moved into a year, or the reason it cannot move (inputs in several years). */
function moveToYear(
  household: Household,
  year: string
): { household: Household; error: null } | { household: null; error: string } {
  try {
    return { household: copyHouseholdToYear(household, year), error: null };
  } catch (error) {
    return { household: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The household the report opens with, moved into the year it opens in,
 * as choosing a year or a saved household moves it. A household that
 * cannot move opens in its own year, with the reason, so the year shown
 * is always the one its inputs are in.
 */
function openingHousehold(
  household: Household,
  year: string
): { household: Household; year: string; yearError: string | null } {
  const moved = moveToYear(household, year);
  if (moved.household) {
    return { household: moved.household, year, yearError: null };
  }
  return {
    household,
    year: household.year === null ? year : String(household.year),
    yearError: moved.error,
  };
}

/** One section of the report, named for assistive technology. */
function ReportSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      style={{
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
        minWidth: 0,
      }}
    >
      {children}
    </section>
  );
}

/**
 * v3's standalone household report: one household, run under a baseline
 * and, optionally, a reform, in a year the reader chooses (issue #498).
 * It shows the net income headline (the change in it when there is a
 * reform), the v2 breakdowns (net income tree, varying earnings with the
 * household's own amounts offered, issue #1096, and marginal tax rates),
 * the household's inputs, the policies and Reproduce in Python (with a
 * pandas DataFrame option, issue #1095). With accounts, a saved household
 * can be opened, and the household saved or its changes saved.
 *
 * It calculates through the Public API's v1 household routes, as the
 * report section does, until v3's household calculations move to v2. No
 * route renders it yet: see `pages/flagship/householdEntryPoints.ts`.
 */
export default function HouseholdReportPage({
  countryId,
  year: initialYear,
  household: initialHousehold,
  savedHousehold: initialSaved = null,
  baselinePolicyId: givenBaselinePolicyId,
  baselineLabel = 'current law',
  reformPolicyId,
  reformLabel,
  title = 'Household report',
}: HouseholdReportPageProps) {
  const yearId = useId();
  const metadata = useSelector((state: RootState) => state.metadata);
  const taxYears = useSelector(getTaxYears);
  const baselinePolicyId = givenBaselinePolicyId ?? String(metadata.currentLawId);
  const runsReform = !!reformPolicyId && reformPolicyId !== baselinePolicyId;
  const [opening] = useState(() =>
    openingHousehold(
      initialSaved?.household ?? initialHousehold ?? newV3Household(countryId, initialYear),
      initialYear
    )
  );
  const [year, setYear] = useState(opening.year);
  const [household, setHousehold] = useState<Household>(opening.household);
  const [yearError, setYearError] = useState<string | null>(opening.yearError);
  const [saved, setSaved] = useState<SavedHousehold | null>(initialSaved);
  // The save form's key: how many saved households the picker has opened.
  // The form starts again, with the opened household's label, only then; a
  // save keeps it, so its confirmation or its error stays on screen.
  const [savedHouseholdOpenings, setSavedHouseholdOpenings] = useState(0);
  const { requested, run, running, failed, result, request, retry, clear, shows } =
    useRequestedHouseholdRun({
      year,
      baselinePolicyId,
      reformPolicyId: runsReform ? reformPolicyId : baselinePolicyId,
    });

  const policyIds = useMemo(
    () => (runsReform ? [baselinePolicyId, reformPolicyId] : [baselinePolicyId]),
    [runsReform, baselinePolicyId, reformPolicyId]
  );
  const policyQuery = useFlagshipHouseholdPolicies({ countryId, policyIds, enabled: !!result });

  // The amounts the calculated household sets, once per calculation: a new
  // list on every render would make the earnings variation rebuild its
  // options from every model variable each time the page renders.
  const householdInputs = useMemo(
    () => (requested ? householdAmountInputs(requested.household) : []),
    [requested]
  );
  const yearOptions = useMemo(() => {
    const years = taxYears.map((option) => String(option.value));
    return years.includes(year) ? years : [year, ...years];
  }, [taxYears, year]);
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, countryId, year, metadata),
    [household, countryId, year, metadata]
  );

  /** A household moved into the report's year; null, with the reason shown, when it cannot be. */
  const inReportYear = (next: Household, nextYear: string): Household | null => {
    const moved = moveToYear(next, nextYear);
    setYearError(moved.error);
    return moved.household;
  };

  const changeYear = (nextYear: string) => {
    const moved = inReportYear(household, nextYear);
    if (moved) {
      setYear(nextYear);
      setHousehold(moved);
      // A result belongs to its year: the next one waits for Calculate.
      clear();
    }
  };

  const openSaved = (next: SavedHousehold) => {
    const moved = inReportYear(next.household, year);
    if (moved) {
      setSaved(next);
      setSavedHouseholdOpenings((openings) => openings + 1);
      setHousehold(moved);
      clear();
    }
  };

  // Who the result is for: the household calculated, not the builder's
  // household if the reader has edited it since (a year change clears the result).
  const summary = requested
    ? `${describeHousehold(requested.household, year, countryId, metadata?.variables)} · ${year}`
    : '';
  const comparison = runsReform
    ? `${reformLabel ?? 'Reform'} compared with ${baselineLabel}`
    : `Under ${baselineLabel}`;

  const breakdowns: HouseholdBreakdownSource | null = result
    ? {
        countryId,
        year,
        householdId: result.householdId,
        baselinePolicyId,
        reformPolicyId: runsReform ? reformPolicyId : baselinePolicyId,
        baseline: result.baseline,
        reform: runsReform ? result.reform : result.baseline,
        gains: runsReform && Math.round(result.netIncome.change) > 0,
        householdInputs,
      }
    : null;

  const reproductions: HouseholdReproduction[] =
    result && requested && !policyQuery.isLoading
      ? policyIds.map((policyId, index) => {
          const role = index === 0 ? 'baseline' : 'reform';
          const provenance = result.provenance[role];
          // Each block's own policy, by id: when one policy fails to load,
          // the other is never given to its block, which says it cannot load.
          const policy = policyQuery.policies.find((loaded) => loaded.id === policyId);
          return {
            role,
            household: requested.household,
            policy: policy ? convertPoliciesToV1Format([policy]).baseline.data : null,
            spmConfig: provenance.spmConfig,
            spmProvenance: provenance.spmProvenance,
            ...versionsOf(provenance, countryId),
          };
        })
      : [];

  const quietText = { margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary };

  return (
    <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
      <Stack style={{ gap: spacing.xs }}>
        <Title order={1} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text style={quietText}>{comparison}</Text>
      </Stack>

      <ReportSection label="Household">
        <Stack style={{ gap: spacing.lg }}>
          <Stack style={{ gap: spacing.sm }}>
            <Title order={2} style={{ margin: 0, fontSize: typography.fontSize.lg }}>
              Saved households
            </Title>
            <SavedHouseholdPicker
              countryId={countryId}
              selectedId={saved?.id}
              onSelect={openSaved}
            />
          </Stack>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: spacing.md }}>
            <Stack style={{ gap: spacing.xs }}>
              <Label htmlFor={yearId}>Year</Label>
              <select
                id={yearId}
                value={year}
                disabled={running}
                onChange={(event) => changeYear(event.target.value)}
                className="tw:rounded-md tw:border tw:border-input tw:bg-background tw:p-sm"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Stack>
            {yearError && (
              <Text role="alert" style={{ ...quietText, color: colors.error }}>
                {yearError}
              </Text>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <HouseholdBuilderPanel
              household={household}
              countryId={countryId}
              year={year}
              onChange={setHousehold}
              disabled={running}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
            <Button
              size="sm"
              onClick={() => request(household)}
              disabled={running || !validation.isValid || shows(household)}
            >
              Calculate
            </Button>
            {!validation.isValid && validation.errors[0] && (
              <span style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                {validation.errors[0].message}
              </span>
            )}
          </div>

          <SaveHouseholdForm
            key={savedHouseholdOpenings}
            household={household}
            saved={saved}
            onSaved={setSaved}
          />
        </Stack>
      </ReportSection>

      {running && <RunProgress title="Calculating this household" expectedMs={EXPECTED_MS} />}

      {failed && (
        <ErrorState
          compact
          title="This household could not be calculated"
          description={
            // A Public API message can carry a long unbroken path.
            run.error?.message && (
              <span style={{ overflowWrap: 'anywhere' }}>{run.error.message}</span>
            )
          }
          onRetry={() => retry(household, validation.isValid)}
        />
      )}

      {result && requested && breakdowns && (
        <>
          {runsReform ? (
            <HouseholdImpactResult
              impact={result}
              countryId={countryId}
              summary={summary}
              methodology={{
                baseline: result.provenance.baseline,
                reform: result.provenance.reform,
              }}
              breakdowns={breakdowns}
            />
          ) : (
            <HouseholdNetIncomeResult
              netIncome={result.netIncome.baseline}
              countryId={countryId}
              summary={summary}
              methodology={result.provenance.baseline}
              breakdowns={breakdowns}
            />
          )}

          <ReportSection label="Household inputs">
            <HouseholdSubPage baselineHousehold={requested.household} />
          </ReportSection>

          <ReportSection label="Policy">
            {policyQuery.error ? (
              <ErrorState
                compact
                title="The report's policies could not be loaded"
                description={policyQuery.error.message}
                onRetry={policyQuery.retry}
              />
            ) : policyQuery.isLoading ? (
              <div role="status" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Spinner size="sm" />
                <Text style={quietText}>Loading the report&apos;s policies...</Text>
              </div>
            ) : (
              <ReportYearProvider year={year}>
                <PolicySubPage policies={policyQuery.policies} reportType="household" />
              </ReportYearProvider>
            )}
          </ReportSection>

          <ReportSection label="Reproduce in Python">
            <HouseholdReproducibility
              countryId={countryId}
              year={year}
              simulations={reproductions}
              offerDataFrame
            />
          </ReportSection>
        </>
      )}
    </Stack>
  );
}
