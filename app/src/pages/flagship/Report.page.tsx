import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { useCalibrationMatches } from '@/components/flagship/CalibrationMatches';
import ReportCalculationError from '@/components/flagship/report/ReportCalculationError';
import ReportView from '@/components/flagship/report/ReportView';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import { ReportUnresolvable } from '@/components/flagship/ReportComputing';
import { trackRecordPrograms, useModelTrackRecord } from '@/components/flagship/ValidationPanel';
import { Spinner, Stack, Text, Title } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { colors, spacing } from '@/designTokens';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { isApiReportId, useFlagshipReport } from '@/hooks/useFlagshipReport';
import { useReportValidationSnapshot } from '@/hooks/useReportValidationSnapshot';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { clearDraftAfterRun, loadProvisionsIntoDraft } from '@/libs/draftReform';
import { provenanceFromPolicy } from '@/libs/flagship/reportProvenance';
import { readReportMeta } from '@/libs/flagship/runReport';
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
  const { report, simulations, policies, isLoading } = useFlagshipReport(userReportId);
  // A local association id from another browser resolves to nothing.
  const unresolvable = !isLoading && !report && !!userReportId && !isApiReportId(userReportId);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  // Provenance: the local stash from the run, else rebuilt from the reform
  // policy so a shared link validates like the original.
  const reformPolicy = policies.find((policy) => policy.id === simulations?.[1]?.policyId);
  // Without metadata the rebuilt provisions would show raw paths and no
  // baseline, so they count as still loading until it arrives.
  const meta =
    readReportMeta(userReportId) ??
    (parameters ? provenanceFromPolicy(reformPolicy, parameters, report?.label) : null);

  const calcStatus = useCalculationStatus(report?.id || '', 'report');

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
  const baselinePolicyId = simulations?.[0]?.policyId;
  const baselinePolicy = policies.find((policy) => policy.id === baselinePolicyId);
  const customBaselineLabel = baselinePolicy?.parameters?.length
    ? baselinePolicy.label || 'Custom baseline policy'
    : null;
  const region = simulations?.[0]?.populationId;
  const provisionPaths = meta?.provisions.map((p) => p.path) ?? [];
  const trackRecord = useModelTrackRecord(provisionPaths);
  const calibration = useCalibrationMatches(provisionPaths, region);
  // The store keys records by the API report id as a string.
  const pin = useReportValidationSnapshot(
    MOCK_USER_ID,
    report?.id !== undefined && report?.id !== null ? String(report.id) : undefined,
    { calibration, programs: trackRecordPrograms(trackRecord) }
  );

  const title = meta?.title || report?.label || 'Impact report';

  const layout = (main: React.ReactNode) => (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing['2xl'],
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 640px', minWidth: 0 }}>{main}</div>
        <ReportAdjustPanel
          title={title}
          sourceNote={meta?.sourceNote || ''}
          provisions={meta?.provisions ?? []}
        />
      </div>
    </div>
  );

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
                    })
                : undefined
            }
          />
        </Stack>
      );
    }
    return layout(
      <Stack
        role="status"
        aria-live="polite"
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: spacing['2xl'],
          gap: spacing.md,
          alignItems: 'center',
        }}
      >
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>
          {calcStatus.status === 'pending' ? 'Calculating report results…' : 'Loading report…'}
        </Text>
      </Stack>
    );
  }

  const singleProvision = meta?.provisions.length === 1 ? meta.provisions[0] : null;
  const isSingleCtc = singleProvision?.path.startsWith('gov.irs.credits.ctc.amount.base');
  const coverTitle =
    isSingleCtc && singleProvision
      ? `${Number(singleProvision.value) > Number(singleProvision.baselineValue) ? 'Increasing' : Number(singleProvision.value) < Number(singleProvision.baselineValue) ? 'Reducing' : 'Setting'} the Child Tax Credit`
      : title;

  return (
    <ReportView
      title={title}
      heading={coverTitle}
      sourceNote={meta?.sourceNote || ''}
      provisions={meta?.provisions ?? []}
      customBaselineLabel={customBaselineLabel}
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
