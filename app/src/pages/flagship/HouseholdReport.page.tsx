import { useId, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { SavedHousehold } from '@/api/savedHouseholdStore';
import HouseholdBuilderPanel from '@/components/flagship/household/HouseholdBuilderPanel';
import HouseholdNetIncomeResult from '@/components/flagship/household/HouseholdNetIncomeResult';
import SavedHouseholdPicker from '@/components/flagship/household/SavedHouseholdPicker';
import SaveHouseholdForm from '@/components/flagship/household/SaveHouseholdForm';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import { Button, Label, Spinner, Stack, Text, Title } from '@/components/ui';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { colors, spacing, typography } from '@/designTokens';
import {
  useFlagshipHouseholdPayload,
  useFlagshipHouseholdPolicies,
} from '@/hooks/useFlagshipHousehold';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import { householdAmountInputs, newReportHousehold } from '@/libs/flagship/householdReport';
import type { HouseholdCalculationProvenance } from '@/libs/flagship/householdRun';
import { getTaxYears } from '@/libs/metadataUtils';
import type { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import HouseholdSubPage from '@/pages/report-output/HouseholdSubPage';
import PolicySubPage from '@/pages/report-output/PolicySubPage';
import HouseholdReproducibility from '@/pages/report-output/reproduce-in-python/HouseholdReproducibility';
import { copyHouseholdToYear } from '@/pages/reportBuilder/utils/changeReportYear';
import type { RootState } from '@/store';
import type { Policy } from '@/types/ingredients/Policy';
import { HouseholdValidation } from '@/utils/HouseholdValidation';
import { convertPoliciesToV1Format, type HouseholdReproduction } from '@/utils/reproducibilityCode';

/** Both policies run at once; a household new to the API takes about three minutes. */
const EXPECTED_MS = 3 * 60 * 1000;

export interface HouseholdReportPageProps {
  /** The household's country: its model, currency and inputs. */
  countryId: 'us' | 'uk';
  /** The year the report opens in; the reader can choose another. */
  year: string;
  /** The household the report opens with; a new household when absent. */
  household?: Household;
  /** The saved household the report opens with: the builder holds it, and saving edits it. */
  savedHousehold?: SavedHousehold | null;
  /** The baseline policy: current law unless given. */
  baselinePolicyId?: string;
  /** What the baseline is called: "current law" unless given. */
  baselineLabel?: string;
  /** The reform policy; without it the report is baseline-only. */
  reformPolicyId?: string;
  /** What the reform is called, for the heading. */
  reformLabel?: string;
  title?: string;
}

/** The household and the payload sent for it, fixed when Calculate is pressed. */
interface HouseholdRequest {
  household: Household;
  payload: V1HouseholdCreateEnvelope;
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

/** One section of the report, named for assistive technology. */
function ReportSection({ label, children }: { label: string; children: React.ReactNode }) {
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
 * reform), the v2 breakdowns (net income tree, varying earnings, marginal
 * tax rates), the household's inputs, the policies and Reproduce in Python
 * (with a pandas DataFrame option, issue #1095). With accounts, a saved
 * household can be opened, and the household saved or its edits saved.
 *
 * It calculates through API v1's household routes, as the report section
 * does, until v3's household calculations move to v2. No route renders it
 * yet: see `pages/flagship/householdEntryPoints.ts`.
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
  const [year, setYear] = useState(initialYear);
  const [saved, setSaved] = useState<SavedHousehold | null>(initialSaved);
  const [household, setHousehold] = useState<Household>(
    () => initialSaved?.household ?? initialHousehold ?? newReportHousehold(countryId, initialYear)
  );
  const [yearError, setYearError] = useState<string | null>(null);
  const [requested, setRequested] = useState<HouseholdRequest | null>(null);

  const run = useFlagshipHouseholdPayload({
    year,
    baselinePolicyId,
    reformPolicyId: runsReform ? reformPolicyId! : baselinePolicyId,
    payload: requested?.payload ?? null,
  });
  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;
  const result = requested && !running ? run.data : undefined;

  const policyIds = useMemo(
    () => (runsReform ? [baselinePolicyId, reformPolicyId!] : [baselinePolicyId]),
    [runsReform, baselinePolicyId, reformPolicyId]
  );
  const policyQuery = useFlagshipHouseholdPolicies({
    countryId,
    policyIds,
    enabled: !!result,
  });

  const yearOptions = useMemo(() => {
    const years = taxYears.map((option) => String(option.value));
    return years.includes(year) ? years : [year, ...years];
  }, [taxYears, year]);
  const validation = useMemo(
    () => HouseholdValidation.isReadyForSimulation(household, countryId, year, metadata),
    [household, countryId, year, metadata]
  );

  /** A household moved into the report's year, or the reason it cannot be. */
  const inYear = (next: Household, nextYear: string): Household | null => {
    try {
      setYearError(null);
      return copyHouseholdToYear(next, nextYear);
    } catch (error) {
      setYearError(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const changeYear = (nextYear: string) => {
    const moved = inYear(household, nextYear);
    if (moved) {
      setYear(nextYear);
      setHousehold(moved);
      // A result belongs to its year: the next one waits for Calculate.
      setRequested(null);
    }
  };

  const openSaved = (next: SavedHousehold) => {
    const moved = inYear(next.household, year);
    if (moved) {
      setSaved(next);
      setHousehold(moved);
      setRequested(null);
    }
  };

  const calculate = () => {
    setRequested({ household, payload: household.toV1CreationPayload() });
  };

  const summary = `${describeHousehold(household, year, countryId, metadata?.variables)} · ${year}`;
  const comparison = runsReform
    ? `${reformLabel ?? 'Reform'} compared with ${baselineLabel}`
    : `Under ${baselineLabel}`;

  const reproductions: HouseholdReproduction[] =
    result && requested && !policyQuery.isLoading
      ? (runsReform ? (['baseline', 'reform'] as const) : (['baseline'] as const)).map(
          (role, index) => {
            const provenance = result.provenance[role];
            const policy = policyQuery.policies[index] as Policy | undefined;
            return {
              role,
              household: requested.household,
              policy: policy ? convertPoliciesToV1Format([policy]).baseline.data : null,
              spmConfig: provenance.spmConfig,
              spmProvenance: provenance.spmProvenance,
              ...versionsOf(provenance, countryId),
            };
          }
        )
      : [];

  const quiet = { margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary };

  return (
    <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
      <Stack style={{ gap: spacing.xs }}>
        <Title order={1} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text style={quiet}>{comparison}</Text>
      </Stack>

      <ReportSection label="Household">
        <Stack style={{ gap: spacing.lg }}>
          <Stack style={{ gap: spacing.sm }}>
            <Title order={2} style={{ margin: 0, fontSize: typography.fontSize.lg }}>
              Saved households
            </Title>
            <SavedHouseholdPicker
              countryId={countryId}
              year={year}
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
              <Text role="alert" style={{ ...quiet, color: colors.error }}>
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
            <Button size="sm" onClick={calculate} disabled={running || !validation.isValid}>
              Calculate
            </Button>
            {!validation.isValid && validation.errors[0] && (
              <span style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                {validation.errors[0].message}
              </span>
            )}
          </div>

          <SaveHouseholdForm
            key={saved?.id ?? 'new'}
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
            run.error?.message && (
              <span style={{ overflowWrap: 'anywhere' }}>{run.error.message}</span>
            )
          }
          onRetry={calculate}
        />
      )}

      {result && requested && (
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
              breakdowns={{
                countryId,
                year,
                householdId: result.householdId,
                baselinePolicyId,
                reformPolicyId: reformPolicyId!,
                baseline: result.baseline,
                reform: result.reform,
                gains: Math.round(result.netIncome.change) > 0,
                householdInputs: householdAmountInputs(requested.household),
              }}
            />
          ) : (
            <HouseholdNetIncomeResult
              netIncome={result.netIncome.baseline}
              countryId={countryId}
              summary={summary}
              methodology={result.provenance.baseline}
              breakdowns={{
                countryId,
                year,
                householdId: result.householdId,
                baselinePolicyId,
                reformPolicyId: baselinePolicyId,
                baseline: result.baseline,
                reform: result.baseline,
                gains: false,
                householdInputs: householdAmountInputs(requested.household),
              }}
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
                <Text style={quiet}>Loading the report&apos;s policies...</Text>
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
