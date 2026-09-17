import { useMemo, useState } from 'react';
import { IconHome, IconPlus } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import {
  CalibrationMatchSection,
  useCalibrationMatches,
} from '@/components/flagship/CalibrationMatches';
import ProvisionList from '@/components/flagship/ProvisionList';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import { ReportUnresolvable } from '@/components/flagship/ReportComputing';
import ReportContents from '@/components/flagship/ReportContents';
import ScorecardComparisons from '@/components/flagship/ScorecardComparisons';
import {
  ModelTrackRecordSection,
  trackRecordPrograms,
  useModelTrackRecord,
} from '@/components/flagship/ValidationPanel';
import {
  Button,
  Spinner,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Title,
} from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { isApiReportId, useFlagshipReport } from '@/hooks/useFlagshipReport';
import { useReportValidationSnapshot } from '@/hooks/useReportValidationSnapshot';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { provenanceFromPolicy } from '@/libs/flagship/reportProvenance';
import { readReportMeta } from '@/libs/flagship/runReport';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import ErrorPage from '@/pages/report-output/ErrorPage';
import { canShowCongressionalDistrictImpactCard } from '@/pages/report-output/MigrationSubPage';
import SocietyWideOverview, {
  StandaloneCongressionalDistrictCard,
} from '@/pages/report-output/SocietyWideOverview';
import { RootState } from '@/store';
import type { CalcStartConfig } from '@/types/calculation';
import { formatValue } from '@/utils/parameterValues';
import { allSimulationsLoaded } from '@/utils/reportSimulations';

const SECTIONS = [
  { id: 'policy', label: 'Overview' },
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
  const [activeTab, setActiveTab] = useState('policy');
  function openReportSection(section: string) {
    setActiveTab(section);
    requestAnimationFrame(() => {
      const tab = document.querySelector<HTMLButtonElement>('[role="tab"][data-state="active"]');
      tab?.focus();
      tab?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }
  const params = useParams<{ userReportId: string }>();
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
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
  const showUSDistricts = canShowCongressionalDistrictImpactCard({
    countryId,
    reformPolicyId,
    baselinePolicyId,
    year: report?.year,
    region,
  });

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

  // The checks start with the run so they are ready when it finishes, but
  // they only render on the completed report: results before the numbers
  // read as a verdict on a report that does not exist yet.
  const dataChecks = (
    <>
      <CalibrationMatchSection matches={calibration} pin={pin} />
    </>
  );

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
            background:
              activeTab === 'policy'
                ? `linear-gradient(155deg, ${colors.primary[50]} 0%, ${colors.gray[50]} 65%)`
                : undefined,
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
          <ErrorPage error={new Error(calcStatus.error?.message || 'Calculation failed')} />
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

  return layout(
    <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xl,
          borderRadius: activeTab === 'policy' ? spacing.radius.feature : undefined,
          padding: activeTab === 'policy' ? `${spacing['4xl']} ${spacing['2xl']}` : 0,
          background:
            activeTab === 'policy'
              ? `linear-gradient(105deg, ${colors.primary[900]} 0%, ${colors.primary[800]} 55%, ${colors.primary[700]} 100%)`
              : undefined,
        }}
      >
        <Title
          order={1}
          style={{
            margin: 0,
            maxWidth: '32ch',
            color: activeTab === 'policy' ? colors.text.inverse : colors.primary[900],
            fontSize:
              activeTab === 'policy'
                ? `clamp(${typography.fontSize['3xl']}, 3.5vw, ${spacing['4xl']})`
                : typography.fontSize['2xl'],
            lineHeight: typography.lineHeight.tight,
            letterSpacing: '-0.035em',
          }}
        >
          {coverTitle}
        </Title>
        {activeTab === 'policy' && (
          <Stack style={{ gap: spacing.sm }}>
            {customBaselineLabel && (
              <Text style={{ margin: 0, color: colors.primary[100] }}>
                Compared with: {customBaselineLabel}
              </Text>
            )}
            {meta?.provisions.map((provision) => (
              <Text
                key={provision.path}
                style={{
                  margin: 0,
                  color: colors.primary[100],
                  fontSize: typography.fontSize.lg,
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                {provision.path.startsWith('gov.irs.credits.ctc.amount.base')
                  ? 'Maximum credit per child'
                  : provision.breadcrumb || provision.path}
                :{' '}
                <strong style={{ color: colors.text.inverse }}>
                  {formatValue(provision.baselineValue, provision.unit)} →{' '}
                  {formatValue(provision.value, provision.unit)}
                </strong>
              </Text>
            ))}
            {meta?.sourceNote && (
              <Text
                style={{ margin: 0, color: colors.primary[100], fontSize: typography.fontSize.sm }}
              >
                {meta.sourceNote}
              </Text>
            )}
          </Stack>
        )}
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} style={{ gap: spacing.xl }}>
        <TabsList
          aria-label="Report sections"
          variant="line"
          style={{
            flexWrap: 'wrap',
            height: 'auto',
            width: '100%',
            justifyContent: 'flex-start',
            borderBottom: `1px solid ${colors.border.light}`,
            paddingBottom: spacing.sm,
          }}
        >
          {SECTIONS.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              style={{
                flex: '0 0 auto',
                padding: `${spacing.sm} ${spacing.md}`,
                fontSize: typography.fontSize.sm,
              }}
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="policy">
          <Stack style={{ gap: spacing.xl }}>
            <ReportContents
              output={output}
              countryId={countryId}
              districtAvailable={showUSDistricts || countryId === 'uk'}
              onOpen={openReportSection}
            />
          </Stack>
        </TabsContent>
        <TabsContent value="economy">
          <Stack style={{ gap: spacing.md }}>
            <SocietyWideOverview output={output} showCongressionalCard={false} groupedCharts />
          </Stack>
        </TabsContent>
        <TabsContent value="districts">
          <Stack style={{ gap: spacing.md }}>
            <SectionHeading id="districts" title="Districts" />
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
        </TabsContent>
        <TabsContent value="household">
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
        </TabsContent>
        <TabsContent value="validation">
          <Stack style={{ gap: spacing.md, paddingBottom: spacing['2xl'] }}>
            <SectionHeading id="validation" title="Validation" />
            {dataChecks}
            <ScorecardComparisons
              reportContext={
                meta && meta.provisions.length > 0 ? (
                  <Stack style={{ gap: spacing.sm }}>
                    <Text style={{ fontWeight: typography.fontWeight.semibold }}>
                      Your reform · {report?.year}
                    </Text>
                    <ProvisionList provisions={meta.provisions} />
                  </Stack>
                ) : (
                  <Text>Before-and-after details for your reform are unavailable.</Text>
                )
              }
              baselineContent={<ModelTrackRecordSection trackRecord={trackRecord} embedded />}
              countryId={countryId}
              paths={meta?.provisions.map((p) => p.path) ?? []}
            />
          </Stack>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
