import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Container, Stack, Text } from '@mantine/core';
import { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { FloatingAlert } from '@/components/common/FloatingAlert';
import { ReportErrorFallback } from '@/components/report/ReportErrorFallback';
import { CALCULATOR_URL } from '@/constants';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useSaveSharedReport } from '@/hooks/useSaveSharedReport';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { useUserReportById } from '@/hooks/useUserReports';
import { formatReportTimestamp } from '@/utils/dateUtils';
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

  // Active subpage and view from URL params
  const activeTab = subpage || '';
  const activeView = view || '';

  // Format the report creation timestamp using the current country's locale
  const timestamp = formatReportTimestamp(userReport?.createdAt, countryId);

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

  // Handle view button click - navigate to report builder in view mode
  const handleView = () => {
    if (userReportId) {
      navigate(`/${countryId}/reports/create/${userReportId}`, {
        state: {
          from: 'report-output',
          reportPath: `/${countryId}/report-output/${userReportId}`,
        },
      });
    }
  };

  // Handle reproduce button click - navigate to reproduce in Python content
  const handleReproduce = () => {
    const id = isSharedView ? shareDataUserReportId : userReportId;
    if (id) {
      const basePath = `/${countryId}/report-output/${id}/reproduce`;
      if (isSharedView) {
        navigate(`${basePath}?${searchParams.toString()}`);
      } else {
        navigate(basePath);
      }
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
        />
      );
    }

    return <Text c="red">Unknown report type</Text>;
  };

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
        isSharedView={isSharedView}
        onShare={handleShare}
        onSave={handleSave}
        onView={!isSharedView ? handleView : undefined}
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
