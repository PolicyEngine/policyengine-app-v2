import { useMemo } from 'react';
import { IconHome, IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import EstimateValidation from '@/components/flagship/EstimateValidation';
import ProvisionList from '@/components/flagship/ProvisionList';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import {
  ModelTrackRecordSection,
  useModelTrackRecord,
} from '@/components/flagship/ValidationPanel';
import { Button, Stack, Text, Title } from '@/components/ui';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useReportProgressDisplay } from '@/hooks/useReportProgressDisplay';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { useUserReportById } from '@/hooks/useUserReports';
import { readReportMeta } from '@/libs/flagship/runReport';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import ErrorPage from '@/pages/report-output/ErrorPage';
import LoadingPage from '@/pages/report-output/LoadingPage';
import { canShowCongressionalDistrictImpactCard } from '@/pages/report-output/MigrationSubPage';
import SocietyWideOverview, {
  StandaloneCongressionalDistrictCard,
} from '@/pages/report-output/SocietyWideOverview';
import type { CalcStartConfig } from '@/types/calculation';
import { getDisplayStatus } from '@/utils/statusMapping';

const SECTIONS = [
  { id: 'policy', label: 'Policy overview' },
  { id: 'economy', label: 'Economic impacts' },
  { id: 'districts', label: 'Districts' },
  { id: 'household', label: 'Household' },
  { id: 'validation', label: 'Validation' },
];

function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <Title
      id={id}
      order={2}
      style={{
        margin: 0,
        fontSize: typography.fontSize.xl,
        scrollMarginTop: 96,
      }}
    >
      {title}
    </Title>
  );
}

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
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const userReportId = propId ?? params.userReportId ?? '';
  const meta = readReportMeta(userReportId);
  const { report, simulations } = useUserReportById(userReportId);

  const calcStatus = useCalculationStatus(report?.id || '', 'report');
  const {
    displayProgress,
    hasCalcStatus,
    message: progressMessage,
  } = useReportProgressDisplay(report?.id);

  const calcConfigs = useMemo(() => {
    if (!report?.id || !simulations?.[0]) {
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
  const region = simulations?.[0]?.populationId;
  const showUSDistricts = canShowCongressionalDistrictImpactCard({
    countryId,
    reformPolicyId,
    baselinePolicyId,
    year: report?.year,
    region,
  });

  const trackRecord = useModelTrackRecord(meta?.provisions.map((p) => p.path) ?? []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const computingState = calcStatus.isError ? (
    <ErrorPage error={new Error(calcStatus.error?.message || 'Calculation failed')} />
  ) : (
    <LoadingPage
      message={progressMessage || `${getDisplayStatus('pending')} society-wide impacts...`}
      progress={hasCalcStatus ? displayProgress : undefined}
    />
  );

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing['2xl'],
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 640px', minWidth: 0 }}>
          <Stack style={{ maxWidth: 1080, margin: '0 auto', gap: spacing.xl }}>
            <Stack style={{ gap: spacing.xs }}>
              <Stack
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: spacing.md,
                  flexWrap: 'wrap',
                }}
              >
                <Title order={1} style={{ margin: 0 }}>
                  {meta?.title || report?.label || 'Impact report'}
                </Title>
                {meta?.sourceNote && (
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                    {meta.sourceNote}
                  </Text>
                )}
              </Stack>
            </Stack>

            <div
              style={{
                position: 'sticky',
                top: -24,
                zIndex: 20,
                display: 'flex',
                gap: spacing.xs,
                flexWrap: 'wrap',
                background: colors.gray[50],
                padding: `${spacing.sm} 0`,
                borderBottom: `1px solid ${colors.border.light}`,
              }}
            >
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: 999,
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.primary,
                    color: colors.text.secondary,
                    cursor: 'pointer',
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <Stack style={{ gap: spacing.md }}>
              <SectionHeading id="policy" title="Policy overview" />
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Baseline: current law · {report?.year ?? '2026'} · Population:{' '}
                {countryId === 'uk' ? 'United Kingdom' : 'United States'} (nationwide)
              </Text>
              {meta && meta.provisions.length > 0 ? (
                <ProvisionList provisions={meta.provisions} />
              ) : (
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  Provision detail is unavailable for this report.
                </Text>
              )}
            </Stack>

            <Stack style={{ gap: spacing.md }}>
              <SectionHeading id="economy" title="Economic impacts" />
              {output ? (
                <SocietyWideOverview output={output} showCongressionalCard={false} />
              ) : (
                computingState
              )}
            </Stack>

            <Stack style={{ gap: spacing.md }}>
              <SectionHeading id="districts" title="Districts" />
              {!output && computingState}
              {output && showUSDistricts && (
                <CongressionalDistrictDataProvider
                  reformPolicyId={reformPolicyId ?? ''}
                  baselinePolicyId={baselinePolicyId ?? ''}
                  year={report?.year ?? ''}
                  region={region}
                >
                  <StandaloneCongressionalDistrictCard output={output} />
                </CongressionalDistrictDataProvider>
              )}
              {output && !showUSDistricts && countryId === 'uk' && (
                <ConstituencySubPage output={output} />
              )}
              {output && !showUSDistricts && countryId !== 'uk' && (
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  District-level impacts are not available for this report's scope.
                </Text>
              )}
            </Stack>

            <Stack style={{ gap: spacing.md }}>
              <SectionHeading id="household" title="Household" />
              <Stack
                style={{
                  gap: spacing.md,
                  padding: spacing.lg,
                  border: `1px dashed ${colors.border.light}`,
                  borderRadius: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Stack style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <IconHome size={18} color={colors.text.secondary} />
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                    No household attached to this report yet.
                  </Text>
                </Stack>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  See how this reform changes taxes and benefits for a specific family — build a
                  household and it will appear here alongside the nationwide results.
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => nav.push(`/${countryId}/households`)}
                >
                  <IconPlus size={14} />
                  Add a household
                </Button>
              </Stack>
            </Stack>

            <Stack style={{ gap: spacing.md, paddingBottom: spacing['2xl'] }}>
              <SectionHeading id="validation" title="Validation" />
              <ModelTrackRecordSection trackRecord={trackRecord} />
              <Stack
                style={{
                  gap: spacing.sm,
                  padding: spacing.lg,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: 12,
                  alignItems: 'stretch',
                }}
              >
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                  }}
                >
                  External checks for this reform
                </Text>
                <EstimateValidation
                  request={{
                    countryId,
                    label: meta?.title || report?.label || 'Drafted reform',
                    provisions: meta?.provisions ?? [],
                    peEstimate: output?.budget?.budgetary_impact,
                    year: report?.year,
                  }}
                />
              </Stack>
            </Stack>
          </Stack>
        </div>
        <div style={{ display: 'flex' }}>
          <ReportAdjustPanel
            title={meta?.title || report?.label || 'Impact report'}
            sourceNote={meta?.sourceNote || ''}
            provisions={meta?.provisions ?? []}
          />
        </div>
      </div>
    </div>
  );
}
