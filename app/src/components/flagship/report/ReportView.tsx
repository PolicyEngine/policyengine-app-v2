import { useState, type ReactNode } from 'react';
import type { BillChange } from '@/api/billFeed';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { CalibrationPin } from '@/components/flagship/CalibrationMatches';
import BudgetWindowCard from '@/components/flagship/report/BudgetWindowCard';
import BudgetWindowSummary from '@/components/flagship/report/BudgetWindowSummary';
import DistrictImpactCard from '@/components/flagship/report/DistrictImpactCard';
import EconomicImpactCharts from '@/components/flagship/report/EconomicImpactCharts';
import HouseholdImpactSection from '@/components/flagship/report/household/HouseholdImpactSection';
import NoChangeNotice from '@/components/flagship/report/NoChangeNotice';
import ReportChanges from '@/components/flagship/report/ReportChanges';
import ReportValidation from '@/components/flagship/report/ReportValidation';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import ReportContents, {
  leadsWithStateRevenue,
  reportMetrics,
  type ReportMetric,
} from '@/components/flagship/ReportContents';
import type { ModelTrackRecord } from '@/components/flagship/ValidationPanel';
import { Stack, Tabs, TabsContent, TabsList, TabsTrigger, Text, Title } from '@/components/ui';
import { CongressionalDistrictDataProvider } from '@/contexts/CongressionalDistrictDataContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { CalibrationMatches } from '@/libs/flagship/calibrationMatching';
import type { RunReportBaseline, RunReportProvision } from '@/libs/flagship/runReport';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import { canShowCongressionalDistrictImpactCard } from '@/pages/report-output/MigrationSubPage';
import { isSocietyWideReportNoOp } from '@/utils/isSocietyWideReportNoOp';

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
  /** How the reform came about, e.g. "Hand-built"; carried to the adjust panel's runs. */
  sourceNote: string;
  /**
   * Who the report ran on, e.g. "Nationwide" or "California". With it, the
   * cover reads the population and the year under the title: "California · 2026".
   */
  populationLabel?: string;
  /** A budget window asked for with the run (in Build): its section opens running. */
  budgetWindow?: { startYear: number; windowSize: number };
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
  /**
   * The parameters' names and units are still loading. Lists of
   * provisions show placeholders meanwhile, not raw parameter paths.
   */
  provisionsLoading?: boolean;
  /** What the results are compared with, by name; current law when unset. */
  customBaselineLabel?: string | null;
  /**
   * The baseline policy could not be loaded: the adjust panel cannot
   * recompute against it.
   */
  baselineUnknown?: boolean;
  /** What the adjust panel's runs compare with; current law when unset. */
  baseline?: RunReportBaseline;
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
  /** Shown in districts instead of `pending`, e.g. with stored district estimates. */
  districtsPending?: ReactNode;
  /** Content above the overview's section cards, e.g. a bill's summary. */
  overviewLead?: ReactNode;
  /** Above the section tabs: which year the results show, for a budget window. */
  yearSwitcher?: ReactNode;
  /** In place of the section tabs, e.g. a budget window's all-years view. */
  sectionsOverride?: ReactNode;
  /** The cover's year, when it differs from `year` (a window's span). */
  coverYear?: string;
  /** Content below the overview's section cards, e.g. data provenance. */
  overviewFooter?: ReactNode;
  calibration: CalibrationMatches | null | undefined;
  calibrationPin?: CalibrationPin;
  trackRecord: ModelTrackRecord;
  /**
   * The report's own external estimates, e.g. a bill's fiscal note.
   * Without them, validation says no external estimate is available.
   */
  externalEstimates?: ReactNode;
  /** A line under the external estimates, e.g. where the bill's estimate came from. */
  externalEstimatesNote?: ReactNode;
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
  populationLabel,
  budgetWindow,
  provisions,
  changes,
  priorLawBaseline = false,
  provisionsLoading = false,
  customBaselineLabel,
  baselineUnknown = false,
  baseline,
  year,
  region,
  reformPolicyId,
  baselinePolicyId,
  output,
  storedMetrics,
  storedMetricsNote,
  pending,
  economyPending = pending,
  districtsPending = pending,
  overviewLead,
  yearSwitcher,
  sectionsOverride,
  coverYear,
  overviewFooter,
  calibration,
  calibrationPin,
  trackRecord,
  externalEstimates,
  externalEstimatesNote,
}: ReportViewProps) {
  const countryId = useCurrentCountry();
  const [activeTab, setActiveTab] = useState('policy');
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['policy']));
  function selectTab(section: string) {
    setVisitedTabs((visited) => (visited.has(section) ? visited : new Set([...visited, section])));
    setActiveTab(section);
  }
  /** The Economic impacts tab, at its Budget window section. */
  function openBudgetWindow() {
    selectTab('economy');
    // The tab draws its content on first visit: scroll once it is there.
    window.setTimeout(() => {
      document
        .getElementById('budget-window-heading')
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 60);
  }

  function openReportSection(section: string) {
    selectTab(section);
    requestAnimationFrame(() => {
      const tab = document.querySelector<HTMLButtonElement>('[role="tab"][data-state="active"]');
      tab?.focus();
      tab?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  // Whether the report's scope has districts at all, results loaded or not:
  // nationwide or one state. showUSDistricts also needs the run's policies.
  const districtScope =
    countryId === 'us' &&
    (!region || region.toLowerCase() === 'us' || region.toLowerCase().startsWith('state/'));
  const showUSDistricts = canShowCongressionalDistrictImpactCard({
    countryId,
    reformPolicyId,
    baselinePolicyId,
    year,
    region,
  });
  const metrics = output
    ? reportMetrics(output, countryId, {
        stateRevenue: leadsWithStateRevenue(region, provisions),
      })
    : (storedMetrics ?? []);

  const tabPanel = (id: string, content: ReactNode) => (
    <TabsContent
      value={id}
      forceMount
      hidden={activeTab !== id}
      // Shown again, a section fades in rather than snapping into place.
      className="tw:motion-safe:fade-in-soft"
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
                    Compared with {customBaselineLabel}
                  </Text>
                )}
                {populationLabel && (
                  <Text
                    style={{
                      margin: 0,
                      color: colors.primary[100],
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {[populationLabel, coverYear ?? year].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </Stack>
            </header>

            {yearSwitcher}

            {sectionsOverride ?? (
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
                    {/* Said first, before a page of results that all read "no change". */}
                    {output && isSocietyWideReportNoOp(output) && (
                      <NoChangeNotice
                        year={year}
                        provisions={provisions}
                        baselineLabel={customBaselineLabel}
                      />
                    )}
                    {overviewLead}
                    <ReportChanges
                      provisions={provisions}
                      changes={changes}
                      priorLawBaseline={priorLawBaseline}
                      loading={provisionsLoading}
                      beforeLabel={customBaselineLabel ? 'Current law' : undefined}
                    />
                    <ReportContents
                      metrics={metrics}
                      metricsNote={output ? undefined : storedMetricsNote}
                      districtAvailable={districtScope || countryId === 'uk'}
                      onOpen={openReportSection}
                    />
                    {/* A window asked for in Build: its progress, then its total, here too. */}
                    {budgetWindow && !yearSwitcher && reformPolicyId && baselinePolicyId && (
                      <BudgetWindowSummary
                        countryId={countryId}
                        reformPolicyId={reformPolicyId}
                        baselinePolicyId={baselinePolicyId}
                        region={region}
                        window={budgetWindow}
                        onOpen={openBudgetWindow}
                      />
                    )}
                    {overviewFooter}
                  </Stack>
                )}
                {tabPanel(
                  'economy',
                  <Stack style={{ gap: spacing.md }}>
                    {output ? <EconomicImpactCharts output={output} /> : economyPending}
                    {/* The budget over the report's years, when it scores more than one. */}
                    {budgetWindow && reformPolicyId && baselinePolicyId && (
                      <BudgetWindowCard
                        countryId={countryId}
                        reformPolicyId={reformPolicyId}
                        baselinePolicyId={baselinePolicyId}
                        region={region}
                        window={budgetWindow}
                      />
                    )}
                  </Stack>
                )}
                {tabPanel(
                  'districts',
                  <Stack style={{ gap: spacing.md }}>
                    <SectionHeading id="districts" title="Districts" />
                    {!output && districtsPending}
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
                    {/* A household runs on the report's own policies, once they exist. */}
                    {reformPolicyId && baselinePolicyId ? (
                      <HouseholdImpactSection
                        // New policies, year or region start a new form, with nothing run.
                        key={`${year}:${baselinePolicyId}:${reformPolicyId}:${region ?? ''}`}
                        countryId={countryId}
                        year={year}
                        region={region}
                        baselinePolicyId={baselinePolicyId}
                        reformPolicyId={reformPolicyId}
                        reformPaths={provisions.map((provision) => provision.path)}
                      />
                    ) : (
                      <>
                        <Text
                          style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}
                        >
                          A household runs once the full results start.
                        </Text>
                        {pending}
                      </>
                    )}
                  </Stack>
                )}
                {tabPanel(
                  'validation',
                  <Stack style={{ gap: spacing.md, paddingBottom: spacing['2xl'] }}>
                    <SectionHeading id="validation" title="Validation" />
                    <ReportValidation
                      countryId={countryId}
                      paths={provisions.map((p) => p.path)}
                      region={region}
                      calibration={calibration}
                      calibrationPin={calibrationPin}
                      trackRecord={trackRecord}
                      externalEstimates={externalEstimates}
                      externalEstimatesNote={externalEstimatesNote}
                      baselineLabel={customBaselineLabel}
                    />
                  </Stack>
                )}
              </Tabs>
            )}
          </Stack>
        </div>
        <ReportAdjustPanel
          title={title}
          sourceNote={sourceNote}
          provisions={provisions}
          loading={provisionsLoading}
          region={region}
          year={year}
          baseline={baseline}
          baselineUnknown={baselineUnknown}
          budgetWindow={budgetWindow}
        />
      </div>
    </div>
  );
}
