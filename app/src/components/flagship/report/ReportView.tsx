import { useState, type ReactNode } from 'react';
import { IconHome, IconPlus } from '@tabler/icons-react';
import type { BillChange } from '@/api/billFeed';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  CalibrationMatchSection,
  type CalibrationPin,
} from '@/components/flagship/CalibrationMatches';
import ProvisionList from '@/components/flagship/ProvisionList';
import DistrictImpactCard from '@/components/flagship/report/DistrictImpactCard';
import EconomicImpactCharts from '@/components/flagship/report/EconomicImpactCharts';
import ReportChanges from '@/components/flagship/report/ReportChanges';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import ReportContents, {
  reportMetrics,
  type ReportMetric,
} from '@/components/flagship/ReportContents';
import ScorecardComparisons from '@/components/flagship/ScorecardComparisons';
import {
  hasTrackRecordContent,
  ModelTrackRecordSection,
  type ModelTrackRecord,
} from '@/components/flagship/ValidationPanel';
import {
  Button,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Title,
} from '@/components/ui';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { CalibrationMatches } from '@/libs/flagship/calibrationMatching';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import { canShowCongressionalDistrictImpactCard } from '@/pages/report-output/MigrationSubPage';

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

export interface ReportViewProps {
  /** The reform's name, for the adjust panel. */
  title: string;
  /** The cover heading; defaults to the title. */
  heading?: string;
  /** e.g. "Utah · Introduced" for bills, "Hand-built draft" for drafts. */
  sourceNote: string;
  provisions: RunReportProvision[];
  /**
   * The overview's list of changes, before and after, when the source
   * wrote them up — a tracked bill's as scored. Without them, the list
   * reads the provisions against today's law.
   */
  changes?: BillChange[];
  /**
   * The results compare with the law before the reform, which today's
   * values already include — an enacted bill scored before it passed.
   */
  priorLawBaseline?: boolean;
  customBaselineLabel?: string | null;
  year: string;
  region?: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
  /** Full society-wide results; null while they calculate. */
  output: SocietyWideReportOutput | null;
  /** Headline numbers shown before `output` arrives, e.g. a bill's stored estimates. */
  storedMetrics?: ReportMetric[];
  storedMetricsNote?: ReactNode;
  /** Shown in sections that need the full results while they calculate. */
  pending?: ReactNode;
  /** Shown in economic impacts instead of `pending`, e.g. with stored estimates. */
  economyPending?: ReactNode;
  /** Content above the overview's section cards, e.g. a bill's summary. */
  overviewLead?: ReactNode;
  /** Content below the overview's section cards, e.g. data provenance. */
  overviewFooter?: ReactNode;
  calibration: CalibrationMatches | null | undefined;
  calibrationPin?: CalibrationPin;
  trackRecord: ModelTrackRecord;
  /** Validation content above the data checks, e.g. a bill's external estimates. */
  validationLead?: ReactNode;
}

/**
 * The flagship report layout shared by saved reports and tracked bills:
 * reform cover, overview, economic impacts, districts, household view,
 * and validation, with the adjust panel alongside.
 */
export default function ReportView({
  title,
  heading = title,
  sourceNote,
  provisions,
  changes,
  priorLawBaseline = false,
  customBaselineLabel,
  year,
  region,
  reformPolicyId,
  baselinePolicyId,
  output,
  storedMetrics,
  storedMetricsNote,
  pending,
  economyPending = pending,
  overviewLead,
  overviewFooter,
  calibration,
  calibrationPin,
  trackRecord,
  validationLead,
}: ReportViewProps) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const [activeTab, setActiveTab] = useState('policy');
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['policy']));
  function selectTab(section: string) {
    setVisitedTabs((visited) => (visited.has(section) ? visited : new Set([...visited, section])));
    setActiveTab(section);
  }
  function openReportSection(section: string) {
    selectTab(section);
    requestAnimationFrame(() => {
      const tab = document.querySelector<HTMLButtonElement>('[role="tab"][data-state="active"]');
      tab?.focus();
      tab?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  const showUSDistricts = canShowCongressionalDistrictImpactCard({
    countryId,
    reformPolicyId,
    baselinePolicyId,
    year,
    region,
  });
  const metrics = output
    ? reportMetrics(output, countryId, { stateRevenue: !!region?.startsWith('state/') })
    : (storedMetrics ?? []);

  const tabPanel = (id: string, content: ReactNode) => (
    <TabsContent
      value={id}
      forceMount
      hidden={activeTab !== id}
      style={{ display: activeTab === id ? undefined : 'none' }}
    >
      {visitedTabs.has(id) && content}
    </TabsContent>
  );

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing['2xl'],
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 640px', minWidth: 0 }}>
          <Stack style={{ width: '100%', minWidth: 0, gap: spacing.xl }}>
            <header
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xl,
                borderRadius: spacing.radius.feature,
                padding: `${spacing['4xl']} ${spacing['2xl']}`,
                background: `linear-gradient(105deg, ${colors.primary[900]} 0%, ${colors.primary[800]} 55%, ${colors.primary[700]} 100%)`,
              }}
            >
              <Title
                order={1}
                style={{
                  margin: 0,
                  maxWidth: '32ch',
                  color: colors.text.inverse,
                  fontSize: `clamp(${typography.fontSize['3xl']}, 3.5vw, ${spacing['4xl']})`,
                  lineHeight: typography.lineHeight.tight,
                  letterSpacing: '-0.035em',
                }}
              >
                {heading}
              </Title>
              <Stack style={{ gap: spacing.sm }}>
                {customBaselineLabel && (
                  <Text style={{ margin: 0, color: colors.primary[100] }}>
                    Compared with: {customBaselineLabel}
                  </Text>
                )}
                {sourceNote && (
                  <Text
                    style={{
                      margin: 0,
                      color: colors.primary[100],
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {sourceNote}
                  </Text>
                )}
              </Stack>
            </header>

            <Tabs value={activeTab} onValueChange={selectTab} style={{ gap: spacing.xl }}>
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
              {tabPanel(
                'policy',
                <Stack style={{ gap: spacing.xl }}>
                  {overviewLead}
                  <ReportChanges
                    provisions={provisions}
                    changes={changes}
                    priorLawBaseline={priorLawBaseline}
                  />
                  <ReportContents
                    metrics={metrics}
                    metricsNote={output ? undefined : storedMetricsNote}
                    districtAvailable={showUSDistricts || countryId === 'uk'}
                    onOpen={openReportSection}
                  />
                  {overviewFooter}
                </Stack>
              )}
              {tabPanel(
                'economy',
                <Stack style={{ gap: spacing.md }}>
                  {output ? <EconomicImpactCharts output={output} /> : economyPending}
                </Stack>
              )}
              {tabPanel(
                'districts',
                <Stack style={{ gap: spacing.md }}>
                  <SectionHeading id="districts" title="Districts" />
                  {!output && pending}
                  {output && showUSDistricts && (
                    <CongressionalDistrictDataProvider
                      reformPolicyId={reformPolicyId ?? ''}
                      baselinePolicyId={baselinePolicyId ?? ''}
                      year={year}
                      region={region}
                    >
                      <DistrictImpactCard output={output} />
                    </CongressionalDistrictDataProvider>
                  )}
                  {output && !showUSDistricts && countryId === 'uk' && (
                    <ConstituencySubPage output={output} />
                  )}
                  {output && !showUSDistricts && countryId !== 'uk' && (
                    <Text
                      style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                    >
                      District-level impacts are not available for this report's scope.
                    </Text>
                  )}
                </Stack>
              )}
              {tabPanel(
                'household',
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
                      <Text
                        style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}
                      >
                        No household attached to this report yet.
                      </Text>
                    </Stack>
                    <Text
                      style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                    >
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
              )}
              {tabPanel(
                'validation',
                <Stack style={{ gap: spacing.md, paddingBottom: spacing['2xl'] }}>
                  <SectionHeading id="validation" title="Validation" />
                  {validationLead}
                  <CalibrationMatchSection matches={calibration} pin={calibrationPin} />
                  <ScorecardComparisons
                    reportContext={
                      provisions.length > 0 ? (
                        <Stack style={{ gap: spacing.sm }}>
                          <Text style={{ fontWeight: typography.fontWeight.semibold }}>
                            Your reform · {year}
                          </Text>
                          <ProvisionList
                            provisions={provisions}
                            sameValueNote={priorLawBaseline ? '' : undefined}
                          />
                        </Stack>
                      ) : (
                        <Text>Before-and-after details for your reform are unavailable.</Text>
                      )
                    }
                    baselineContent={
                      hasTrackRecordContent(trackRecord) && (
                        <ModelTrackRecordSection trackRecord={trackRecord} embedded />
                      )
                    }
                    countryId={countryId}
                    paths={provisions.map((p) => p.path)}
                  />
                </Stack>
              )}
            </Tabs>
          </Stack>
        </div>
        <ReportAdjustPanel title={title} sourceNote={sourceNote} provisions={provisions} />
      </div>
    </div>
  );
}
