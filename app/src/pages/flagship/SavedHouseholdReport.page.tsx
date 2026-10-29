import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchV2Household } from '@/api/v2HouseholdCalculations';
import {
  householdRunFromV2Report,
  readSharedHouseholdReport,
  waitForV2HouseholdReport,
} from '@/api/v2HouseholdReports';
import HouseholdNetIncomeResult from '@/components/flagship/household/HouseholdNetIncomeResult';
import type { HouseholdBreakdownSource } from '@/components/flagship/report/household/HouseholdBreakdowns';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import { householdResultCardStyle } from '@/components/flagship/report/household/householdResultParts';
import { HOUSEHOLD_RUN_EXPECTED_MS } from '@/components/flagship/report/household/householdRunParts';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import V3VariablesGate from '@/components/flagship/V3VariablesGate';
import { Spinner, Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { describeHousehold } from '@/libs/flagship/householdDescription';
import { householdAmountInputs } from '@/libs/flagship/householdReport';
import { plainV2HouseholdError } from '@/libs/flagship/v2HouseholdRun';
import { v2StoredHouseholdKeys } from '@/libs/queryKeys';
import { householdFromV2Item } from '@/models/household/v2DocumentCodec';
import HouseholdSubPage from '@/pages/report-output/HouseholdSubPage';
import type { RootState } from '@/store';
import type { AssociationCountryId } from '@/types/v2User';

export interface SavedHouseholdReportPageProps {
  /** The country the report was saved in. */
  countryId: AssociationCountryId;
  /** The saved report's ID (a `/v2/user-reports` row): the report's link. */
  savedReportId: string;
}

/** A short wait the page names: opening the link, or reading the household. */
function LoadingStatus({ children }: { children: ReactNode }) {
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
      <Spinner size="sm" />
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm }}>{children}</Text>
    </div>
  );
}

/** One section of the report, named for assistive technology. */
function ReportSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} style={{ ...householdResultCardStyle, minWidth: 0 }}>
      {children}
    </section>
  );
}

/**
 * A saved household report, opened by its link, by anyone holding it: the
 * saved report (`/v2/shared-reports`, read with no credential) names a
 * household report on `/v2/reports`, which is read until its run has
 * succeeded; the household it names (`/v2/households`) gives the people's
 * names and the inputs. It shows the report's name, the net income
 * headline (the change in it when the report has a reform), the v2
 * breakdowns, which calculate the stored household across earnings on the
 * v2 routes, and the household's inputs.
 *
 * It works only on the Public API's v2 routes, so no route renders it until
 * v3 moves to them: see `pages/flagship/householdEntryPoints.ts`.
 */
export default function SavedHouseholdReportPage({
  countryId,
  savedReportId,
}: SavedHouseholdReportPageProps) {
  const metadata = useSelector((state: RootState) => state.metadata);
  const shared = useQuery({
    queryKey: ['shared-household-report', countryId, savedReportId],
    queryFn: () => readSharedHouseholdReport(countryId, savedReportId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const reportId = shared.data?.reportId ?? null;
  const report = useQuery({
    queryKey: ['v2-household-report', countryId, reportId],
    queryFn: ({ signal }) => waitForV2HouseholdReport(countryId, reportId!, { signal }),
    enabled: !!reportId,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const householdId = report.data?.household_id ?? null;
  const stored = useQuery({
    queryKey: v2StoredHouseholdKeys.byId(countryId, householdId ?? ''),
    queryFn: () => fetchV2Household(countryId, householdId!),
    enabled: !!householdId,
    staleTime: Infinity,
    retry: false,
  });
  const opened = useMemo(() => {
    if (!report.data || !stored.data) {
      return null;
    }
    try {
      return {
        run: householdRunFromV2Report(report.data, stored.data),
        household: householdFromV2Item(stored.data),
        error: null,
      };
    } catch (error) {
      return { run: null, household: null, error: plainV2HouseholdError(error) };
    }
  }, [report.data, stored.data]);
  const householdInputs = useMemo(
    () => (opened?.household ? householdAmountInputs(opened.household) : []),
    [opened]
  );

  const quietText = { margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary };
  const heading = (
    <Title order={1} style={{ margin: 0 }}>
      {shared.data?.name || 'Household report'}
    </Title>
  );

  // A read that failed with nothing to show. A background re-read that fails
  // (on window focus, once stale) keeps what is on screen.
  const failedQuery = [shared, report, stored].find(
    (query) => query.error && query.data === undefined
  );
  let body: ReactNode;
  if (shared.isSuccess && !shared.data) {
    body = (
      <ErrorState
        title="This report could not be found"
        description="It may have been deleted, or the link may be incomplete."
      />
    );
  } else if (failedQuery || opened?.error) {
    body = (
      <ErrorState
        title="This household report could not be opened"
        description={
          <span style={{ overflowWrap: 'anywhere' }}>
            {plainV2HouseholdError(failedQuery?.error ?? opened?.error).message}
          </span>
        }
        onRetry={failedQuery ? () => failedQuery.refetch() : undefined}
      />
    );
  } else if (shared.data === undefined) {
    body = <LoadingStatus>Opening the saved report</LoadingStatus>;
  } else if (!report.data?.run) {
    body = (
      <RunProgress
        title="Calculating this household report"
        expectedMs={HOUSEHOLD_RUN_EXPECTED_MS}
      />
    );
  } else if (!opened?.run || !opened.household) {
    body = <LoadingStatus>Reading the household</LoadingStatus>;
  } else {
    const { run, household } = opened;
    const reportRun = report.data.run;
    const year = String(report.data.year);
    const runsReform = !!reportRun.reform;
    // The policies as v3 holds them: the catalog's current-law ID for none.
    const currentLaw = String(metadata.currentLawId);
    const baselinePolicyId = reportRun.baseline.policy_id ?? currentLaw;
    const reformPolicyId = runsReform
      ? (reportRun.reform?.policy_id ?? currentLaw)
      : baselinePolicyId;
    const summary = `${describeHousehold(household, year, countryId, metadata?.variables)} · ${year}`;
    const breakdowns: HouseholdBreakdownSource = {
      countryId,
      year,
      householdId: run.householdId,
      baselinePolicyId,
      reformPolicyId,
      baseline: run.baseline,
      reform: runsReform ? run.reform : run.baseline,
      gains: runsReform && Math.round(run.netIncome.change) > 0,
      householdInputs,
    };
    body = (
      <V3VariablesGate label="Loading the household report">
        <Text style={quietText}>
          {runsReform
            ? `Reform compared with ${reportRun.baseline.policy_id ? 'its baseline policy' : 'current law'}`
            : 'Under one policy'}
        </Text>
        {runsReform ? (
          <HouseholdImpactResult
            impact={run}
            countryId={countryId}
            summary={summary}
            methodology={{ baseline: run.provenance.baseline, reform: run.provenance.reform }}
            breakdowns={breakdowns}
          />
        ) : (
          <HouseholdNetIncomeResult
            netIncome={run.netIncome.baseline}
            countryId={countryId}
            summary={summary}
            methodology={run.provenance.baseline}
            breakdowns={breakdowns}
          />
        )}
        <ReportSection label="Household inputs">
          <HouseholdSubPage baselineHousehold={household} />
        </ReportSection>
      </V3VariablesGate>
    );
  }

  return (
    <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
      {heading}
      {body}
    </Stack>
  );
}
