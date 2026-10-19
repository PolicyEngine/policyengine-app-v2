import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { isAccountId } from '@/api/v2Associations';
import { useCalibrationMatches } from '@/components/flagship/CalibrationMatches';
import { populationLabel } from '@/components/flagship/reform/PopulationPicker';
import AllYearsView from '@/components/flagship/report/AllYearsView';
import ReportCalculationError from '@/components/flagship/report/ReportCalculationError';
import ReportDetailsError from '@/components/flagship/report/ReportDetailsError';
import ReportLoadError from '@/components/flagship/report/ReportLoadError';
import ReportNotSocietyWide from '@/components/flagship/report/ReportNotSocietyWide';
import ReportView from '@/components/flagship/report/ReportView';
import ReportYearSwitcher, {
  ALL_YEARS,
  type YearStatus,
} from '@/components/flagship/report/ReportYearSwitcher';
import RunProgress, { RunLoading } from '@/components/flagship/report/RunProgress';
import { ReportUnresolvable } from '@/components/flagship/ReportComputing';
import { ErrorState } from '@/components/flagship/states';
import { trackRecordPrograms, useModelTrackRecord } from '@/components/flagship/ValidationPanel';
import { Stack, Title } from '@/components/ui';
import { getDurationForRegion } from '@/constants/calculationDurations';
import { colors, spacing } from '@/designTokens';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { isApiReportId, useFlagshipReport } from '@/hooks/useFlagshipReport';
import {
  useFlagshipReportStore,
  useReportRecord,
  useSharedReport,
} from '@/hooks/useFlagshipStores';
import { useHydrateCalculationCache } from '@/hooks/useHydrateCalculationCache';
import { useReportValidationSnapshot } from '@/hooks/useReportValidationSnapshot';
import { useReportYearEconomies } from '@/hooks/useReportYearEconomy';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { useUnreadableReportMeta } from '@/hooks/useUnreadableReportMeta';
import { clearDraftAfterRun, loadProvisionsIntoDraft } from '@/libs/draftReform';
import { isUntitledReform } from '@/libs/flagship/draftLabels';
import {
  reportBaselineLabel,
  reportBaselineUnknown,
  reportRunBaseline,
  UNKNOWN_BASELINE_LABEL,
} from '@/libs/flagship/reportBaseline';
import { provenanceFromPolicy } from '@/libs/flagship/reportProvenance';
import { readReportMeta, reportMetaFromRecord } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import type { CalcStartConfig } from '@/types/calculation';
import { allSimulationsLoaded } from '@/utils/reportSimulations';

/** A failed load at the top of the overview, in a dashed box. */
function LeadError({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: spacing.lg,
        border: `1px dashed ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The budget-window years asked for on reports opened by a saved report's
 * link, kept for this page session only: the link opens the report for
 * anyone, so it is never left in this browser's storage for the next
 * person here to find.
 */
const sharedLinkRequestedYears = new Map<string, string[]>();

interface FlagshipReportPageProps {
  /** Passed by the Next.js route bridge; react-router falls back to params. */
  userReportId?: string;
}

/**
 * The flagship report — the one output artifact every door leads to,
 * structured like the one-off policy dashboards: policy overview,
 * economic impacts, district impacts, household view, and validation.
 * The calculation auto-starts and streams in via the standard report
 * machinery.
 */
/** When the report's run started: the details this browser saved, else the API's record. */
function runStartedAt(...stamps: Array<string | null | undefined>): number | undefined {
  // The latest one: a report asked for again (its earlier run lost or
  // failed) starts its clock over, not from when it was first created.
  const times = stamps
    .map((stamp) => (stamp ? Date.parse(stamp) : Number.NaN))
    .filter((time) => Number.isFinite(time));
  return times.length > 0 ? Math.max(...times) : undefined;
}

export default function FlagshipReportPage({ userReportId: propId }: FlagshipReportPageProps) {
  const params = useParams<{ userReportId: string }>();
  const userReportId = propId ?? params.userReportId ?? '';
  // A report's link is its saved report's ID, which anyone can open with its
  // owner's details. Without accounts (sign-in off, or outside the US and
  // UK) nothing is shared, so the link is the v1 report's number; where
  // accounts exist, such a link is an old one and no longer opens, nor does
  // an old browser-only "sur-" link.
  const { isAccount } = useFlagshipReportStore();
  const sharedLink = isAccountId(userReportId);
  const browserLink = !isAccount && isApiReportId(userReportId);
  const unresolvable = !!userReportId && !sharedLink && !browserLink;
  const sharedQuery = useSharedReport(sharedLink ? userReportId : undefined);
  const shared = sharedQuery.data ?? null;
  const {
    report,
    simulations,
    policies,
    isLoading,
    error: reportLoadError,
    notFound: reportNotFound,
    failedPolicyIds,
    retry: retryReport,
  } = useFlagshipReport(
    (sharedLink ? shared?.record.apiReportId : browserLink ? userReportId : undefined) ?? ''
  );
  // No saved report has the link's ID (deleted, or a bad link).
  const sharedNotFound = sharedLink && sharedQuery.isSuccess && !shared;
  const sharedLoadError = sharedLink ? sharedQuery.error : null;
  const loadError = sharedLoadError ?? reportLoadError;
  const notFound = sharedNotFound || reportNotFound;
  const retry = sharedLoadError ? sharedQuery.refetch : retryReport;
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const economyRegions = useSelector((state: RootState) => state.metadata.economyOptions.region);
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  // This session's own record, when it ran the report: it names the saved
  // reform the report was run from, and holds the validation pin.
  const reportRecord = useReportRecord(unresolvable ? undefined : userReportId);
  // Provenance: the run's details, else the saved report's (the same for
  // anyone holding the link), else rebuilt from the reform policy so a
  // link without accounts validates like the original — read in the
  // report's year, with every dated value the run had.
  const reformPolicyId = simulations?.[1]?.policyId;
  const reformPolicy = policies.find((policy) => policy.id === reformPolicyId);
  const baselinePolicyId = simulations?.[0]?.policyId;
  // The saved report names the reform it was compared with; only its owner
  // links to that reform.
  const sharedBaseline =
    shared?.baselineReform && baselinePolicyId
      ? {
          reformId: reportRecord?.baselineReformId ?? null,
          policyId: String(baselinePolicyId),
          label: shared.baselineReform.name || 'Untitled reform',
        }
      : undefined;
  const meta =
    readReportMeta(userReportId) ??
    reportMetaFromRecord(shared?.record, report?.year, sharedBaseline) ??
    provenanceFromPolicy(reformPolicy, parameters, report?.label, report?.year || undefined);

  const calcStatus = useCalculationStatus(report?.id || '', 'report');
  // Stored provenance that can't be read: readReportMeta answers none for it.
  const unreadableMeta = useUnreadableReportMeta(userReportId);
  // The reform's provisions are rebuilt from metadata; without it they cannot show.
  const metadata = useFlagshipMetadataStatus();
  // Rebuilt, the provisions are on their way until the reform policy loads
  // (it waits for the parameter metadata, so names and current law come
  // with it): the report waits for them rather than show an empty reform
  // to adjust. A policy or metadata that failed lets it show without them.
  const awaitingProvisions =
    !meta &&
    !unresolvable &&
    !!reformPolicyId &&
    !failedPolicyIds.includes(reformPolicyId) &&
    metadata.status !== 'error';

  // A household report is the classic calculator's: this page shows
  // society-wide results only. Run here, it would score one household
  // and write that over the report's stored outputs.
  const householdReport = simulations.some(
    (simulation) => simulation.populationType === 'household'
  );

  // The run handed its draft over to this report; Build starts fresh.
  useEffect(() => {
    clearDraftAfterRun(userReportId);
  }, [userReportId]);

  const calcConfigs = useMemo(() => {
    // Wait for the reform simulation too: starting on the baseline alone
    // scores current law against itself and persists zeros as the result.
    if (!report?.id || householdReport || !allSimulationsLoaded(report, simulations)) {
      return null;
    }
    const simulation1 = simulations[0];
    const geography = {
      id: `${report.countryId}-${simulation1.populationId}`,
      countryId: report.countryId,
      scope: 'national' as const,
      geographyId: simulation1.populationId || '',
    };
    return [
      {
        calcId: report.id,
        targetType: 'report' as const,
        countryId: report.countryId,
        year: report.year,
        simulations: { simulation1, simulation2: simulations[1] || null },
        // The bar follows a typical run for this region, not the country.
        estimateByRegion: true,
        // A failed run says so on its record, so Your reforms can say Failed.
        recordReportErrors: true,
        populations: {
          household1: null,
          household2: null,
          geography1: geography,
          geography2: null,
        },
      } as CalcStartConfig,
    ];
  }, [report, simulations, householdReport]);

  // A report whose record is complete opens from the results stored on
  // it: run again, each open would ask for the economy once more and
  // write the same results back over the public record. Seeded before
  // the start below looks, so no run starts for it.
  useHydrateCalculationCache({
    report,
    outputType: calcConfigs && report?.status === 'complete' ? 'societyWide' : undefined,
  });

  useStartCalculationOnLoad({
    enabled: !!report && !!calcConfigs,
    configs: calcConfigs || [],
    isComplete: calcStatus.isComplete,
  });

  const output = calcStatus.isComplete ? (calcStatus.result as SocietyWideOutput) : null;

  const baselinePolicy = policies.find((policy) => policy.id === baselinePolicyId);
  // A baseline policy that failed to load is unknown, not current law.
  const baselineUnknown = reportBaselineUnknown(meta, baselinePolicyId, {
    currentLawId,
    failedPolicyIds,
  });
  const customBaselineLabel = baselineUnknown
    ? UNKNOWN_BASELINE_LABEL
    : reportBaselineLabel(meta, baselinePolicy);
  // Adjusted, the report keeps what it was compared with; an unknown one gives it nothing to keep.
  const runBaseline = baselineUnknown
    ? undefined
    : reportRunBaseline(meta, baselinePolicyId, customBaselineLabel);
  const region = simulations?.[0]?.populationId;
  // A report on part of the country names it: "California".
  const regionLabel =
    region && report && region !== report.countryId
      ? populationLabel(region, economyRegions)
      : undefined;
  // A budget window's years. The run scored the first in full; another
  // year runs once it is opened, or with the rest from the All years view.
  const windowYears =
    meta?.budgetWindow && meta.budgetWindow.windowSize > 1 && report?.year
      ? Array.from({ length: meta.budgetWindow.windowSize }, (_, index) =>
          String(meta.budgetWindow!.startYear + index)
        )
      : [];
  const reportYear = report?.year ?? '';
  const [view, setView] = useState<string | null>(null);
  // The years asked for keep running on the server after the page closes,
  // so the browser remembers them: back on the report, they show where they
  // stand rather than as never run. A saved report's link keeps them for
  // this page session only (see sharedLinkRequestedYears).
  const yearsKey = `pe-flagship-report-years-${userReportId}`;
  const [requestedYears, setRequestedYearsState] = useState<string[]>(() => {
    if (sharedLink) {
      return sharedLinkRequestedYears.get(userReportId) ?? [];
    }
    try {
      const stored = JSON.parse(localStorage.getItem(yearsKey) ?? '[]');
      return Array.isArray(stored) ? stored.filter((year) => typeof year === 'string') : [];
    } catch {
      return [];
    }
  });
  const setRequestedYears = (update: (current: string[]) => string[]) =>
    setRequestedYearsState((current) => {
      const next = update(current);
      if (sharedLink) {
        sharedLinkRequestedYears.set(userReportId, next);
        return next;
      }
      try {
        localStorage.setItem(yearsKey, JSON.stringify(next));
      } catch {
        // A private window keeps them for this visit only.
      }
      return next;
    });
  const yearEconomies = useReportYearEconomies({
    countryId: report?.countryId ?? 'us',
    reformPolicyId: reformPolicyId ? String(reformPolicyId) : undefined,
    baselinePolicyId: baselinePolicyId ? String(baselinePolicyId) : undefined,
    region,
    years: requestedYears.filter((year) => year !== reportYear),
  });
  const provisionPaths = meta?.provisions.map((p) => p.path) ?? [];
  const trackRecord = useModelTrackRecord(provisionPaths, report?.countryId);
  const calibration = useCalibrationMatches(provisionPaths, region, report?.countryId);
  const pin = useReportValidationSnapshot(
    unresolvable ? undefined : userReportId,
    {
      calibration,
      programs: trackRecordPrograms(trackRecord),
    },
    shared?.record.validation ?? null
  );

  const title = meta?.title || report?.label || 'Impact report';

  // Until the results are in, the page is the wait (or what went wrong):
  // adjusting a reform that has no results yet has nothing to adjust
  // against, so the side panel comes with the finished report.
  const layout = (main: React.ReactNode) => (
    <div style={{ width: '100%', minWidth: 0 }}>{main}</div>
  );

  // Unreadable stored provenance says so, until the report is opened without it.
  if (unreadableMeta.error) {
    return layout(
      <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
        <Title order={1} style={{ margin: 0 }}>
          {title}
        </Title>
        <ReportDetailsError error={unreadableMeta.error} onOpenWithout={unreadableMeta.setAside} />
      </Stack>
    );
  }

  if (householdReport) {
    return layout(
      <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
        <Title order={1} style={{ margin: 0 }}>
          {title}
        </Title>
        <ReportNotSocietyWide />
      </Stack>
    );
  }

  if (!output || isLoading || awaitingProvisions) {
    if (unresolvable) {
      return layout(
        <Stack
          style={{
            width: `calc(100% + ${spacing['2xl']} + ${spacing['2xl']})`,
            minWidth: 0,
            minHeight: `calc(100vh - ${spacing['2xl']})`,
            margin: `-${spacing['2xl']} -${spacing['2xl']} 0`,
            padding: spacing['2xl'],
            gap: spacing.xl,
            background: `linear-gradient(155deg, ${colors.primary[50]} 0%, ${colors.gray[50]} 65%)`,
          }}
        >
          <Title order={1} style={{ margin: 0 }}>
            {title}
          </Title>
          <ReportUnresolvable />
        </Stack>
      );
    }
    // A report that failed to load would otherwise wait here for good.
    if (loadError || notFound) {
      return layout(
        <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
          <Title order={1} style={{ margin: 0 }}>
            {title}
          </Title>
          <ReportLoadError notFound={notFound} onRetry={retry} />
        </Stack>
      );
    }
    if (calcStatus.isError) {
      return layout(
        <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
          <Title order={1} style={{ margin: 0 }}>
            {title}
          </Title>
          <ReportCalculationError
            message={calcStatus.error?.message}
            // The reform comes back as a draft to edit; without it, Build starts blank.
            onEdit={
              meta?.provisions.length && report
                ? () =>
                    loadProvisionsIntoDraft(report.countryId, meta.provisions, {
                      label: isUntitledReform(meta.title) ? '' : meta.title,
                      year: Number(report.year) || undefined,
                      // Back in Build on the population it ran on.
                      region: region && region !== report.countryId ? region : undefined,
                      // Saving the edit changes the reform it was run from.
                      reformId: reportRecord?.reformId,
                      baselineReformId: meta.baseline?.reformId,
                    })
                : undefined
            }
          />
        </Stack>
      );
    }
    // The run card and its placeholder are each a status of their own.
    return layout(
      <Stack
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: spacing['2xl'],
          gap: spacing.md,
          alignItems: 'center',
        }}
      >
        {calcStatus.status === 'pending' ? (
          <RunProgress
            title={
              regionLabel
                ? `Calculating the results for ${regionLabel}`
                : 'Calculating the nationwide results'
            }
            progress={calcStatus.progress}
            runStage={'runStage' in calcStatus ? calcStatus.runStage : undefined}
            detail={
              typeof calcStatus.queuePosition === 'number' && calcStatus.queuePosition > 0
                ? `In queue, position ${calcStatus.queuePosition}`
                : undefined
            }
            expectedMs={getDurationForRegion(report?.countryId ?? 'us', region)}
            // A run begun from Build, then opened again, keeps its clock.
            startedAt={runStartedAt(meta?.createdAt, report?.requestedAt)}
          />
        ) : (
          <RunLoading label="Loading report" />
        )}
      </Stack>
    );
  }

  const singleProvision = meta?.provisions.length === 1 ? meta.provisions[0] : null;
  const isSingleCtc = singleProvision?.path.startsWith('gov.irs.credits.ctc.amount.base');
  // Against a saved reform, current law says nothing of the direction.
  const coverTitle =
    isSingleCtc && singleProvision
      ? customBaselineLabel
        ? 'Changing the Child Tax Credit'
        : `${Number(singleProvision.value) > Number(singleProvision.baselineValue) ? 'Increasing' : Number(singleProvision.value) < Number(singleProvision.baselineValue) ? 'Reducing' : 'Setting'} the Child Tax Credit`
      : title;

  const shownView = view ?? (windowYears.length > 1 ? ALL_YEARS : reportYear);
  const allYears = shownView === ALL_YEARS;
  const year = allYears || !windowYears.includes(shownView) ? reportYear : shownView;
  const otherYear = year !== reportYear;
  const yearEconomy = yearEconomies[year];
  const statusByYear: Record<string, YearStatus> = Object.fromEntries(
    windowYears.map((windowYear) => {
      if (windowYear === reportYear) {
        return [windowYear, output ? 'done' : 'computing'];
      }
      const economy = yearEconomies[windowYear];
      return [
        windowYear,
        !economy
          ? 'not-run'
          : economy.status === 'complete'
            ? 'done'
            : economy.status === 'error'
              ? 'error'
              : 'computing',
      ];
    })
  );
  const requestYears = (years: string[]) =>
    setRequestedYears((current) => [...new Set([...current, ...years])]);
  const selectView = (next: string) => {
    setView(next);
    if (next !== ALL_YEARS && next !== reportYear) {
      requestYears([next]);
    }
  };
  const shownOutput = otherYear ? (yearEconomy?.output ?? null) : output;
  const yearPending =
    otherYear && yearEconomy?.status !== 'complete' ? (
      yearEconomy?.status === 'error' ? (
        <ErrorState
          compact
          title={`Could not calculate ${year}`}
          description={yearEconomy.message}
          onRetry={yearEconomy.retry}
        />
      ) : (
        <RunProgress
          title={`Calculating ${year}`}
          progress={yearEconomy?.progress}
          runStage={yearEconomy?.runStage}
          expectedMs={getDurationForRegion(report?.countryId ?? 'us', region)}
        />
      )
    ) : undefined;

  return (
    <ReportView
      title={title}
      heading={coverTitle}
      sourceNote={meta?.sourceNote || ''}
      populationLabel={regionLabel ?? 'Nationwide'}
      // A window asked for in Build opens running.
      budgetWindow={meta?.budgetWindow}
      provisions={meta?.provisions ?? []}
      overviewLead={
        <>
          {!meta && metadata.status === 'error' && (
            <LeadError>
              <ErrorState compact title="Could not load the parameters" onRetry={metadata.retry} />
            </LeadError>
          )}
          {baselineUnknown && (
            <LeadError>
              <ErrorState
                compact
                title="Could not load the baseline policy"
                description="The results compare with it, but its name and values are missing."
                onRetry={retry}
              />
            </LeadError>
          )}
        </>
      }
      customBaselineLabel={customBaselineLabel}
      baselineUnknown={baselineUnknown}
      baseline={runBaseline}
      year={year}
      region={region}
      reformPolicyId={reformPolicyId}
      baselinePolicyId={baselinePolicyId}
      output={shownOutput}
      pending={yearPending}
      coverYear={allYears ? `${windowYears[0]}–${windowYears[windowYears.length - 1]}` : year}
      yearSwitcher={
        windowYears.length > 1 ? (
          <ReportYearSwitcher
            years={windowYears}
            value={shownView}
            onChange={selectView}
            statusByYear={statusByYear}
          />
        ) : undefined
      }
      sectionsOverride={
        allYears ? (
          <AllYearsView
            countryId={report?.countryId ?? 'us'}
            reformPolicyId={reformPolicyId ? String(reformPolicyId) : undefined}
            baselinePolicyId={baselinePolicyId ? String(baselinePolicyId) : undefined}
            region={region}
            years={windowYears}
            outputs={Object.fromEntries(
              windowYears.map((windowYear) => [
                windowYear,
                windowYear === reportYear ? output : (yearEconomies[windowYear]?.output ?? null),
              ])
            )}
            statusByYear={statusByYear}
            onCalculateAll={() => requestYears(windowYears)}
          />
        ) : undefined
      }
      calibration={calibration}
      calibrationPin={pin}
      trackRecord={trackRecord}
    />
  );
}
