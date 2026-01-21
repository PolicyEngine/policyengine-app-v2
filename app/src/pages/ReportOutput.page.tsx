import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Container, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { FloatingAlert } from '@/components/common/FloatingAlert';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import { ReportErrorContext, ReportErrorFallback } from '@/components/report/ReportErrorFallback';
import { CALCULATOR_URL } from '@/constants';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useSaveSharedReport } from '@/hooks/useSaveSharedReport';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { useUpdateReportAssociation } from '@/hooks/useUserReportAssociations';
import { useUserReportById } from '@/hooks/useUserReports';
import type { Geography } from '@/types/ingredients/Geography';
import { formatReportTimestamp } from '@/utils/dateUtils';
import { isUKLocalLevelGeography } from '@/utils/geographyUtils';
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

/**
 * ReportOutputPage - Orchestration layer for report output pages
 *
 * This component:
 * - Fetches report metadata and determines output type
 * - Manages tab navigation
 * - Delegates to type-specific output components (Household or SocietyWide)
 * - Wraps content in ReportOutputLayout for consistent chrome
 *
 * Both owned and shared views now use the same data shape:
 * - useUserReportById: fetches from localStorage associations
 * - useSharedReportData: uses ShareData from URL (same shape)
 */

export default function ReportOutputPage() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const [searchParams] = useSearchParams();
  const {
    reportId: userReportId,
    subpage,
    view,
  } = useParams<{
    reportId?: string;
    subpage?: string;
    view?: string;
  }>();

  // Detect shared view from URL
  const shareData = extractShareDataFromUrl(searchParams);
  const isSharedView = shareData !== null;
  const shareDataUserReportId = shareData ? getShareDataUserReportId(shareData) : null;

  // Alert state for clipboard copy notification
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  // If no userReportId and not a shared view, show error
  if (!userReportId && !isSharedView) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text c="red">Error: Report ID is required</Text>
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

  const DEFAULT_PAGE = 'overview';
  const activeTab = subpage || DEFAULT_PAGE;
  const activeView = view || '';

  // Redirect to overview if no subpage is specified and data is ready
  // For shared views, preserve the share param in the URL
  useEffect(() => {
    if (!subpage && report && simulations) {
      if (isSharedView && shareDataUserReportId) {
        navigate(
          `/${countryId}/report-output/${shareDataUserReportId}/${DEFAULT_PAGE}?${searchParams.toString()}`
        );
      } else if (userReportId) {
        navigate(`/${countryId}/report-output/${userReportId}/${DEFAULT_PAGE}`);
      }
    }
  }, [
    subpage,
    navigate,
    report,
    simulations,
    countryId,
    userReportId,
    isSharedView,
    searchParams,
    shareDataUserReportId,
  ]);

  // Determine which tabs to show based on output type, country, and geography scope
  const tabs = outputType ? getTabsForOutputType(outputType, report?.countryId, geographies) : [];

  // Handle tab navigation (absolute path, preserve search params for shared views)
  const handleTabClick = (tabValue: string) => {
    if (isSharedView && shareDataUserReportId) {
      navigate(
        `/${countryId}/report-output/${shareDataUserReportId}/${tabValue}?${searchParams.toString()}`
      );
    } else {
      navigate(`/${countryId}/report-output/${userReportId}/${tabValue}`);
    }
  };

  // Format the report creation timestamp using the current country's locale
  const timestamp = formatReportTimestamp(userReport?.createdAt, countryId);

  // Add modal state for rename
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);

  // Add mutation hook for rename
  const updateAssociation = useUpdateReportAssociation();

  // Add rename handler
  const handleRename = async (newLabel: string) => {
    if (!userReportId) {
      return;
    }

    try {
      await updateAssociation.mutateAsync({
        userReportId,
        updates: { label: newLabel },
      });
      closeRename();
    } catch (error) {
      console.error('[ReportOutputPage] Failed to rename report:', error);
    }
  };

  // Hook for saving shared reports with all ingredients
  const { saveSharedReport, saveResult, setSaveResult } = useSaveSharedReport();

  // Handle share button click - copy share URL to clipboard
  const handleShare = async () => {
    if (!userReport || !userSimulations?.length) {
      return;
    }

    // Create ShareData from user associations
    const shareDataToEncode = createShareData(
      userReport,
      userSimulations ?? [],
      userPolicies ?? [],
      userHouseholds ?? [],
      userGeographies ?? []
    );

    if (!shareDataToEncode) {
      console.error('[ReportOutputPage] Failed to create share data');
      return;
    }

    const sharePath = buildSharePath(shareDataToEncode);
    const shareUrl = `${CALCULATOR_URL}${sharePath}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyAlert(true);
      // Auto-hide alert after 3 seconds
      setTimeout(() => setShowCopyAlert(false), 3000);
    } catch (error) {
      console.error('[ReportOutputPage] Failed to copy share URL:', error);
    }
  };

  // Handle save button click - create user associations and navigate to owned view
  const handleSave = async () => {
    if (!shareData) {
      return;
    }

    try {
      // ShareData already contains user associations - just pass it directly
      const newUserReport = await saveSharedReport(shareData);
      // Navigate to owned view (same URL pattern but now in localStorage)
      navigate(`/${countryId}/report-output/${newUserReport.id}/${activeTab}`);
    } catch (error) {
      console.error('[ReportOutputPage] Failed to save report:', error);
    }
  };

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text>Loading report...</Text>
        </Stack>
      </Container>
    );
  }

  // Show error if data failed to load
  if (dataError || !report) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text c="red">Error loading report: {dataError?.message || 'Report not found'}</Text>
        </Stack>
      </Container>
    );
  }

  // Determine if sidebar should be shown
  const showSidebar = activeTab === 'comparative-analysis';

  // Handle sidebar navigation (absolute path, preserve search params for shared views)
  const handleSidebarNavigate = (viewName: string) => {
    if (isSharedView && shareDataUserReportId) {
      navigate(
        `/${countryId}/report-output/${shareDataUserReportId}/comparative-analysis/${viewName}?${searchParams.toString()}`
      );
    } else {
      navigate(`/${countryId}/report-output/${userReportId}/comparative-analysis/${viewName}`);
    }
  };

  // Determine the display label and ID for the report
  const displayLabel = userReport?.label;
  const displayReportId = isSharedView ? shareDataUserReportId : userReportId;

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
          userGeographies={userGeographies}
        />
      );
    }

    return <Text c="red">Unknown report type</Text>;
  };

  // Memoize error context to avoid recreating on every render
  const errorContext: ReportErrorContext = useMemo(
    () => ({
      userReport,
      userSimulations,
      userPolicies,
      userHouseholds: userHouseholds as ReportErrorContext['userHouseholds'],
      userGeographies: userGeographies as ReportErrorContext['userGeographies'],
      report,
      simulations,
      policies,
      households,
      geographies,
    }),
    [
      userReport,
      userSimulations,
      userPolicies,
      userHouseholds,
      userGeographies,
      report,
      simulations,
      policies,
      households,
      geographies,
    ]
  );

  return (
    <ReportYearProvider year={report?.year ?? null}>
      {showCopyAlert && (
        <FloatingAlert onClose={() => setShowCopyAlert(false)}>
          Share link copied to clipboard!
        </FloatingAlert>
      )}

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
        timestamp={timestamp}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabClick}
        onEditName={openRename}
        showSidebar={showSidebar}
        outputType={outputType}
        activeView={activeView}
        onSidebarNavigate={handleSidebarNavigate}
        isSharedView={isSharedView}
        onShare={handleShare}
        onSave={handleSave}
      >
        <ErrorBoundary
          fallback={(error, errorInfo) => (
            <ReportErrorFallback error={error} errorInfo={errorInfo} context={errorContext} />
          )}
        >
          {renderContent()}
        </ErrorBoundary>
      </ReportOutputLayout>

      <RenameIngredientModal
        opened={renameOpened}
        onClose={closeRename}
        currentLabel={userReport?.label || `Report #${userReportId}`}
        onRename={handleRename}
        isLoading={updateAssociation.isPending}
        ingredientType="report"
      />
    </ReportYearProvider>
  );
}

/**
 * Determine which tabs to display based on output type and content
 *
 * Uses a common tabs structure that can be easily extended with
 * type-specific tabs in the future (e.g., regional breakdown for
 * society-wide, family structure for household).
 */
function getTabsForOutputType(
  outputType: ReportOutputType,
  countryId?: string,
  geographies?: Geography[]
): Array<{ value: string; label: string }> {
  if (outputType === 'societyWide') {
    const tabs = [
      { value: 'overview', label: 'Overview' },
      { value: 'comparative-analysis', label: 'Comparative analysis' },
      { value: 'policy', label: 'Policy' },
      { value: 'population', label: 'Population' },
      { value: 'dynamics', label: 'Dynamics' },
    ];

    // Only show constituencies and local authorities for UK national or country-level reports
    // Hide these tabs for constituency-level or local authority-level reports
    const hasLocalLevelGeography = geographies?.some((g) => isUKLocalLevelGeography(g));
    if (countryId === 'uk' && !hasLocalLevelGeography) {
      tabs.push({ value: 'constituency', label: 'Constituencies' });
      tabs.push({ value: 'local-authority', label: 'Local authorities' });
    }

    // Congressional districts are now under Comparative Analysis sidebar for US

    return tabs;
  }

  if (outputType === 'household') {
    return [
      { value: 'overview', label: 'Overview' },
      { value: 'comparative-analysis', label: 'Comparative analysis' },
      { value: 'policy', label: 'Policy' },
      { value: 'population', label: 'Population' },
      { value: 'dynamics', label: 'Dynamics' },
    ];
  }

  return [{ value: 'overview', label: 'Overview' }];
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
