import { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { FloatingAlert } from '@/components/common/FloatingAlert';
import { ReportErrorFallback } from '@/components/report/ReportErrorFallback';
import { Container, Stack, Text } from '@/components/ui';
import { CALCULATOR_URL } from '@/constants';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useSaveSharedReport } from '@/hooks/useSaveSharedReport';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { useUserReportById } from '@/hooks/useUserReports';
import type { EconomyOutput, Report } from '@/types/ingredients/Report';
import { formatReportTimestamp } from '@/utils/dateUtils';
import { resolveDefaultReportOutputSubpage } from '@/utils/reportOutputSubpage';
import { getReportConfigPath } from '@/utils/reportRouting';
import {
  buildSharePath,
  createShareData,
  extractShareDataFromUrl,
  getShareDataUserReportId,
} from '@/utils/shareUtils';
import { HouseholdReportOutput } from './report-output/HouseholdReportOutput';
import ReportOutputLayout from './report-output/ReportOutputLayout';
import { SocietyWideReportOutput } from './report-output/SocietyWideReportOutput';

/**
 * Type discriminator for output types
 */
export type ReportOutputType = 'household' | 'societyWide';

interface ReportVersionMetadata {
  modelVersion: string | null;
  dataVersion: string | null;
}

function extractReportVersionMetadata(output: Report['output']): ReportVersionMetadata | null {
  if (!output || typeof output !== 'object') {
    return null;
  }

  if (!('model_version' in output) && !('data_version' in output)) {
    return null;
  }

  const economyOutput = output as Partial<EconomyOutput>;

  return {
    modelVersion:
      typeof economyOutput.model_version === 'string' ? economyOutput.model_version : null,
    dataVersion: typeof economyOutput.data_version === 'string' ? economyOutput.data_version : null,
  };
}

/**
 * ReportOutputPage - Orchestration layer for report output pages
 *
 * This component:
 * - Fetches report metadata and determines output type
 * - Manages tab navigation
 * - Delegates to type-specific output components (Household or SocietyWide)
 * - Wraps content in ReportOutputLayout for consistent chrome
 *
 * Both owned and shared views use the same data shape:
 * - useUserReportById: fetches from localStorage associations
 * - useSharedReportData: uses ShareData from URL (same shape)
 */

interface ReportOutputPageProps {
  reportId?: string;
  subpage?: string;
  view?: string;
}

export default function ReportOutputPage({
  reportId: userReportId,
  subpage,
  view,
}: ReportOutputPageProps) {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    (window as any).__journeyProfiler?.markEvent('report-output-render', 'render');
  }
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const location = useAppLocation();
  const searchParams = new URLSearchParams(location.search);
  const shareParam = searchParams.get('share');
  const shareSearch = shareParam ? `?${new URLSearchParams({ share: shareParam }).toString()}` : '';

  // Detect shared view from URL
  const shareData = extractShareDataFromUrl(searchParams);
  const isSharedView = shareData !== null;
  const shareDataUserReportId = shareData ? getShareDataUserReportId(shareData) : null;

  // If no userReportId and not a shared view, show error
  if (!userReportId && !isSharedView) {
    return (
      <Container size="xl" style={{ paddingLeft: spacing.xl, paddingRight: spacing.xl }}>
        <Stack gap="xl">
          <Text style={{ color: colors.error }}>Error: Report ID is required</Text>
        </Stack>
      </Container>
    );
  }

  // Fetch report data - use appropriate hook based on view type
  // Both hooks return the same shape, so we can select the active one directly
  const ownedData = useUserReportById(userReportId ?? '', {
    enabled: !isSharedView && !!userReportId,
  });
  const sharedData = useSharedReportData(shareData, { enabled: isSharedView });
  const data = isSharedView ? sharedData : ownedData;

  const {
    userReport,
    report,
    simulations,
    policies,
    households,
    geographies,
    userSimulations,
    userPolicies,
    userHouseholds,
    userGeographies,
    isLoading: dataLoading,
    error: dataError,
  } = data;

  // Derive output type from simulation (needed for target type determination)
  const outputType: ReportOutputType | undefined =
    simulations?.[0]?.populationType === 'household'
      ? 'household'
      : simulations?.[0]?.populationType === 'geography'
        ? 'societyWide'
        : undefined;

  // Active subpage and view from URL params
  const activeTab = resolveDefaultReportOutputSubpage(outputType, subpage);
  const activeView = view || '';
  const versionMetadata = extractReportVersionMetadata(report?.output);

  // Format the report creation timestamp using the current country's locale
  const timestamp = formatReportTimestamp(userReport?.createdAt, countryId);

  // Hook for saving shared reports with all ingredients
  const { saveSharedReport, saveResult, setSaveResult } = useSaveSharedReport();

  const shareUrl = (() => {
    if (isSharedView) {
      const sharedReportId = shareDataUserReportId ?? userReportId;
      if (!sharedReportId) {
        return undefined;
      }

      return `${CALCULATOR_URL}/${countryId}/report-output/${sharedReportId}${shareSearch}`;
    }

    if (!userReport || !userSimulations?.length) {
      return undefined;
    }

    const shareDataToEncode = createShareData(
      userReport,
      userSimulations ?? [],
      userPolicies ?? [],
      userHouseholds ?? [],
      userGeographies ?? []
    );

    return shareDataToEncode ? `${CALCULATOR_URL}${buildSharePath(shareDataToEncode)}` : undefined;
  })();

  // Handle save button click - create user associations and navigate to owned view
  const handleSave = async () => {
    if (!shareData) {
      return;
    }

    try {
      // ShareData already contains user associations - just pass it directly
      const newUserReport = await saveSharedReport(shareData, policies ?? []);
      // Navigate to owned view (same URL pattern but now in localStorage)
      nav.push(`/${countryId}/report-output/${newUserReport.id}/${activeTab}`);
    } catch (error) {
      console.error('[ReportOutputPage] Failed to save report:', error);
    }
  };

  // Handle view button click - navigate to report builder in view mode
  const handleView = () => {
    const id = isSharedView ? shareDataUserReportId : userReportId;
    if (!id) {
      return;
    }

    if (isSharedView) {
      nav.push(`${getReportConfigPath(countryId, id)}${shareSearch}`);
    } else {
      nav.push(getReportConfigPath(countryId, userReportId!));
    }
  };

  // Handle reproduce button click - navigate to reproduce in Python content
  const handleReproduce = () => {
    const id = isSharedView ? shareDataUserReportId : userReportId;
    if (id) {
      const basePath = `/${countryId}/report-output/${id}/reproduce`;
      if (isSharedView) {
        nav.push(`${basePath}${shareSearch}`);
      } else {
        nav.push(basePath);
      }
    }
  };

  // Show loading state while fetching data
  if (import.meta.env.DEV && typeof window !== 'undefined' && dataLoading) {
    (window as any).__journeyProfiler?.markEvent('report-output-data-loading', 'render');
  }
  if (dataLoading) {
    return (
      <Container size="xl" style={{ paddingLeft: spacing.xl, paddingRight: spacing.xl }}>
        <Stack gap="xl">
          <Text>Loading report...</Text>
        </Stack>
      </Container>
    );
  }

  // Show error if data failed to load
  if (dataError || !report) {
    return (
      <Container size="xl" style={{ paddingLeft: spacing.xl, paddingRight: spacing.xl }}>
        <Stack gap="xl">
          <Text style={{ color: colors.error }}>
            Error loading report: {dataError?.message || 'Report not found'}
          </Text>
        </Stack>
      </Container>
    );
  }

  // Determine the display label and ID for the report
  const displayLabel = userReport?.label;
  const displayReportId = isSharedView ? shareDataUserReportId : userReportId;
  const reportOutputBackPath =
    activeTab === 'reproduce' && displayReportId
      ? `/${countryId}/report-output/${displayReportId}${shareSearch}`
      : undefined;
  const reportOutputBackLabel =
    activeTab === 'reproduce' && displayReportId ? (displayLabel ?? displayReportId) : undefined;

  // Render content based on output type
  // Both shared and owned views now use the same user associations shape
  const renderContent = () => {
    if (outputType === 'household') {
      return (
        <HouseholdReportOutput
          report={report}
          simulations={simulations}
          userSimulations={userSimulations}
          userPolicies={userPolicies}
          policies={policies}
          households={households}
          userHouseholds={userHouseholds}
          subpage={activeTab}
          activeView={activeView}
          isLoading={dataLoading}
          error={dataError}
        />
      );
    }

    if (outputType === 'societyWide') {
      return (
        <SocietyWideReportOutput
          reportId={displayReportId ?? report.id!}
          subpage={activeTab}
          activeView={activeView}
          report={report}
          simulations={simulations}
          userSimulations={userSimulations}
          userPolicies={userPolicies}
          policies={policies}
          geographies={geographies}
        />
      );
    }

    return <Text style={{ color: colors.error }}>Unknown report type</Text>;
  };

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    (window as any).__journeyProfiler?.markEvent('report-output-ready', 'render');
  }

  return (
    <ReportYearProvider year={report?.year ?? null}>
      {saveResult && (
        <FloatingAlert
          type={saveResult === 'success' || saveResult === 'already_saved' ? 'success' : 'warning'}
          onClose={() => setSaveResult(null)}
        >
          {saveResult === 'success'
            ? 'Report and all ingredients saved!'
            : saveResult === 'already_saved'
              ? 'This report is already saved to your list!'
              : 'Report saved. Some ingredients could not be added to your lists.'}
        </FloatingAlert>
      )}

      <ReportOutputLayout
        reportId={displayReportId ?? ''}
        reportLabel={displayLabel ?? undefined}
        reportYear={report?.year}
        modelVersion={versionMetadata?.modelVersion ?? undefined}
        dataVersion={versionMetadata?.dataVersion ?? undefined}
        timestamp={timestamp}
        backPath={reportOutputBackPath}
        backLabel={reportOutputBackLabel}
        isSharedView={isSharedView}
        shareUrl={shareUrl}
        onSave={handleSave}
        onView={handleView}
        onReproduce={handleReproduce}
      >
        <ErrorBoundary
          fallback={(error, errorInfo) => (
            <ReportErrorFallback error={error} errorInfo={errorInfo} />
          )}
        >
          {renderContent()}
        </ErrorBoundary>
      </ReportOutputLayout>
    </ReportYearProvider>
  );
}

/**
 * Type guard to check if society-wide output is US-specific
 */
export function isUSSocietyWideOutput(output: SocietyWideOutput): boolean {
  return 'poverty_by_race' in output && output.poverty_by_race !== null;
}

/**
 * Type guard to check if society-wide output is UK-specific
 */
export function isUKSocietyWideOutput(output: SocietyWideOutput): boolean {
  return 'constituency_impact' in output && output.constituency_impact !== null;
}
