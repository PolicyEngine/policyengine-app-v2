import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { RenameIngredientModal } from '@/components/common/RenameIngredientModal';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUpdateReportAssociation } from '@/hooks/useUserReportAssociations';
import { useUserReportById } from '@/hooks/useUserReports';
import type { Geography } from '@/types/ingredients/Geography';
import { formatReportTimestamp } from '@/utils/dateUtils';
import { isUKLocalLevelGeography } from '@/utils/geographyUtils';
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
 */

export default function ReportOutputPage() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();
  const {
    reportId: userReportId,
    subpage,
    view,
  } = useParams<{
    reportId?: string;
    subpage?: string;
    view?: string;
  }>();
  // If no userReportId, show error
  if (!userReportId) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text c="red">Error: Report ID is required</Text>
        </Stack>
      </Container>
    );
  }

  // Fetch report structure and metadata
  const {
    userReport,
    report,
    simulations,
    userSimulations,
    userPolicies,
    policies,
    households,
    userHouseholds,
    geographies,
    userGeographies,
    isLoading: dataLoading,
    error: dataError,
  } = useUserReportById(userReportId);

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
  useEffect(() => {
    if (!subpage && report && simulations) {
      navigate(`/${countryId}/report-output/${userReportId}/${DEFAULT_PAGE}`);
    }
  }, [subpage, navigate, report, simulations, countryId, userReportId]);

  // Determine which tabs to show based on output type, country, and geography scope
  const tabs = outputType ? getTabsForOutputType(outputType, report?.countryId, geographies) : [];

  // Handle tab navigation (absolute path)
  const handleTabClick = (tabValue: string) => {
    navigate(`/${countryId}/report-output/${userReportId}/${tabValue}`);
  };

  // Format timestamp from userReport createdAt
  const timestamp = formatReportTimestamp(userReport?.createdAt);

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

  // Handle sidebar navigation (absolute path)
  const handleSidebarNavigate = (viewName: string) => {
    navigate(`/${countryId}/report-output/${userReportId}/comparative-analysis/${viewName}`);
  };

  // Render content based on output type
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
          reportId={userReportId}
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

  return (
    <ReportYearProvider year={report?.year ?? null}>
      <ReportOutputLayout
        reportId={userReportId}
        reportLabel={userReport?.label}
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
      >
        {renderContent()}
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
    // US does not have this capability
    const hasLocalLevelGeography = geographies?.some((g) => isUKLocalLevelGeography(g));
    if (countryId === 'uk' && !hasLocalLevelGeography) {
      tabs.push({ value: 'constituency', label: 'Constituencies' });
      tabs.push({ value: 'local-authority', label: 'Local authorities' });
    }

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

// Duplicate getTabsForOutputType removed - using the one defined above at line 304
