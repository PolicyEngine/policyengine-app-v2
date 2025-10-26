import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Stack, Text } from '@mantine/core';
import { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { spacing } from '@/designTokens';
import { useUserReportById } from '@/hooks/useUserReports';
import { HouseholdReportOutput } from './report-output/HouseholdReportOutput';
import { SocietyWideReportOutput } from './report-output/SocietyWideReportOutput';
import ReportOutputLayout from './report-output/ReportOutputLayout';

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
  const { reportId: userReportId, subpage } = useParams<{ reportId?: string; subpage?: string }>();

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
    isLoading: dataLoading,
    error: dataError,
  } = useUserReportById(userReportId);

  console.log('[ReportOutputPage] Fetched user report and simulations:', {
    userReport,
    report,
    simulations,
    userSimulations,
    dataLoading,
    dataError,
    userHouseholds,
    geographies
  });

  // Derive output type from simulation (needed for target type determination)
  const outputType: ReportOutputType | undefined =
    simulations?.[0]?.populationType === 'household'
      ? 'household'
      : simulations?.[0]?.populationType === 'geography'
        ? 'societyWide'
        : undefined;

  // Debug logging for household reports
  if (outputType === 'household') {
    console.log('Household Report Data:', {
      outputType,
      report,
      simulations,
    });
  }

  const DEFAULT_PAGE = 'overview';
  const activeTab = subpage || DEFAULT_PAGE;

  // Redirect to overview if no subpage is specified and data is ready
  useEffect(() => {
    if (!subpage && report && simulations) {
      navigate(DEFAULT_PAGE, { replace: true });
    }
  }, [subpage, navigate, report, simulations]);

  // Determine which tabs to show based on output type
  const tabs = outputType ? getTabsForOutputType(outputType) : [];

  // Handle tab navigation (relative navigation)
  const handleTabClick = (tabValue: string) => {
    navigate(tabValue);
  };

  // Format timestamp (placeholder for now)
  const timestamp = 'Ran today at 05:23:41';

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

  // Render content based on output type
  const renderContent = () => {
    if (outputType === 'household') {
      return (
        <HouseholdReportOutput
          reportId={userReportId}
          report={report}
          simulations={simulations}
          userSimulations={userSimulations}
          userPolicies={userPolicies}
          policies={policies}
          households={households}
          userHouseholds={userHouseholds}
          subpage={activeTab}
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
    <ReportOutputLayout
      reportId={userReportId}
      reportLabel={userReport?.label}
      timestamp={timestamp}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabClick}
    >
      {renderContent()}
    </ReportOutputLayout>
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
  outputType: ReportOutputType
): Array<{ value: string; label: string }> {
  // Common tabs shared by all report types
  const commonTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'policy', label: 'Policy' },
    { value: 'population', label: 'Population' },
    { value: 'dynamics', label: 'Dynamics' },
  ];

  if (outputType === 'societyWide') {
    return [
      ...commonTabs,
      // Add society-wide specific tabs here in the future
      // e.g., { value: 'regional', label: 'Regional Breakdown' },
    ];
  }

  if (outputType === 'household') {
    return [
      ...commonTabs,
      // Add household-specific tabs here in the future
      // e.g., { value: 'family-structure', label: 'Family Details' },
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
