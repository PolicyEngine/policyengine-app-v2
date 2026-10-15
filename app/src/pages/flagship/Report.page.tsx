import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { isAccountId } from '@/api/v2Associations';
import { useCalibrationMatches } from '@/components/flagship/CalibrationMatches';
import { populationLabel } from '@/components/flagship/reform/PopulationPicker';
import ReportCalculationError from '@/components/flagship/report/ReportCalculationError';
import ReportDetailsError from '@/components/flagship/report/ReportDetailsError';
import ReportLoadError from '@/components/flagship/report/ReportLoadError';
import ReportView from '@/components/flagship/report/ReportView';
import RunProgress, { RunLoading } from '@/components/flagship/report/RunProgress';
import { ReportUnresolvable } from '@/components/flagship/ReportComputing';
import { ErrorState } from '@/components/flagship/states';
import { trackRecordPrograms, useModelTrackRecord } from '@/components/flagship/ValidationPanel';
import { Stack, Title } from '@/components/ui';
import { getDurationForCountry } from '@/constants/calculationDurations';
import { colors, spacing } from '@/designTokens';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { isApiReportId, useFlagshipReport } from '@/hooks/useFlagshipReport';
import {
  useFlagshipReportStore,
  useReportRecord,
  useSharedReport,
} from '@/hooks/useFlagshipStores';
import { useReportValidationSnapshot } from '@/hooks/useReportValidationSnapshot';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { useUnreadableReportMeta } from '@/hooks/useUnreadableReportMeta';
import { clearDraftAfterRun, loadProvisionsIntoDraft } from '@/libs/draftReform';
import { reportBaselineLabel, reportRunBaseline } from '@/libs/flagship/reportBaseline';
import { provenanceFromPolicy } from '@/libs/flagship/reportProvenance';
import { readReportMeta, reportMetaFromRecord } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import type { CalcStartConfig } from '@/types/calculation';
import { allSimulationsLoaded } from '@/utils/reportSimulations';

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
  // This session's own record, when it ran the report: it names the saved
  // reform the report was run from, and holds the validation pin.
  const reportRecord = useReportRecord(unresolvable ? undefined : userReportId);
  // Provenance: the run's details, else the saved report's (the same for
  // anyone holding the link), else rebuilt from the reform policy.
  const reformPolicy = policies.find((policy) => policy.id === simulations?.[1]?.policyId);
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
  // Without metadata the rebuilt provisions would show raw paths and no
  // baseline, so they count as still loading until it arrives.
  const meta =
    readReportMeta(userReportId) ??
    reportMetaFromRecord(shared?.record, report?.year, sharedBaseline) ??
    (parameters ? provenanceFromPolicy(reformPolicy, parameters, report?.label) : null);

  const calcStatus = useCalculationStatus(report?.id || '', 'report');
  // Stored provenance that can't be read: readReportMeta answers none for it.
  const unreadableMeta = useUnreadableReportMeta(userReportId);
  // The reform's provisions are rebuilt from metadata; without it they cannot show.
  const metadata = useFlagshipMetadataStatus();

  // The run handed its draft over to this report; Build starts fresh.
  useEffect(() => {
    clearDraftAfterRun(userReportId);
  }, [userReportId]);

  const calcConfigs = useMemo(() => {
    // Wait for the reform simulation too: starting on the baseline alone
    // scores current law against itself and persists zeros as the result.
    if (!report?.id || !allSimulationsLoaded(report, simulations)) {
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
        populations: {
          household1: null,
          household2: null,
          geography1: geography,
          geography2: null,
        },
      } as CalcStartConfig,
    ];
  }, [report, simulations]);

  useStartCalculationOnLoad({
    enabled: !!report && !!calcConfigs,
    configs: calcConfigs || [],
    isComplete: calcStatus.isComplete,
  });

  const output = calcStatus.isComplete ? (calcStatus.result as SocietyWideOutput) : null;

  const reformPolicyId = simulations?.[1]?.policyId;
  const baselinePolicy = policies.find((policy) => policy.id === baselinePolicyId);
  const customBaselineLabel = reportBaselineLabel(meta, baselinePolicy);
  // Adjusted, the report keeps what it was compared with.
  const runBaseline = reportRunBaseline(meta, baselinePolicyId, customBaselineLabel);
  const region = simulations?.[0]?.populationId;
  // A report on part of the country names it: "California".
  const regionLabel =
    region && report && region !== report.countryId
      ? populationLabel(region, economyRegions)
      : undefined;
  const provisionPaths = meta?.provisions.map((p) => p.path) ?? [];
  const trackRecord = useModelTrackRecord(provisionPaths);
  const calibration = useCalibrationMatches(provisionPaths, region);
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

  if (!output || isLoading || (!meta && !!reformPolicy)) {
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
                      label: meta.title === 'Draft reform' ? '' : meta.title,
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
            detail={
              typeof calcStatus.queuePosition === 'number' && calcStatus.queuePosition > 0
                ? `In queue, position ${calcStatus.queuePosition}`
                : undefined
            }
            expectedMs={getDurationForCountry(report?.countryId ?? 'us')}
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
        !meta && metadata.status === 'error' ? (
          <div
            style={{
              padding: spacing.lg,
              border: `1px dashed ${colors.border.light}`,
              borderRadius: spacing.radius.feature,
            }}
          >
            <ErrorState compact title="Could not load the parameters" onRetry={metadata.retry} />
          </div>
        ) : undefined
      }
      customBaselineLabel={customBaselineLabel}
      baseline={runBaseline}
      year={report?.year ?? ''}
      region={region}
      reformPolicyId={reformPolicyId}
      baselinePolicyId={baselinePolicyId}
      output={output}
      calibration={calibration}
      calibrationPin={pin}
      trackRecord={trackRecord}
    />
  );
}
