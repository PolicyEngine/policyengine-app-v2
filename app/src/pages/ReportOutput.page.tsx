import { useEffect } from 'react';
import {
  IconChevronLeft,
  IconClock,
  IconPencil,
  IconRefresh,
  IconShare,
  IconStack2,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { SocietyWideReportOutput as SocietyWideOutput } from '@/api/societyWideCalculation';
import { colors, spacing, typography } from '@/designTokens';
import { useUserReportById } from '@/hooks/useUserReports';
import { HouseholdReportOutput } from './report-output/HouseholdReportOutput';
import { SocietyWideReportOutput } from './report-output/SocietyWideReportOutput';

/**
 * Type discriminator for output types
 */
export type ReportOutputType = 'household' | 'societyWide';

/**
 * ReportOutputPage - Structural page component that provides layout chrome
 * for displaying report calculation outputs.
 *
 * This component serves as a container that:
 * - Fetches output artifacts from report calculations
 * - Provides consistent layout and navigation structure
 * - Conditionally renders appropriate sub-pages based on output type
 * - Acts as the main structural wrapper for all report output views
 *
 * Sub-page components will be implemented separately and integrated here.
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
  });

  // Derive output type from simulation (needed for target type determination)
  const outputType: ReportOutputType | undefined =
    simulations?.[0]?.populationType === 'household'
      ? 'household'
      : simulations?.[0]?.populationType === 'geography'
        ? 'societyWide'
        : undefined;

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

  // Render content based on active tab and output type
  const renderContent = () => {
    if (outputType === 'household') {
      return (
        <HouseholdReportOutput
          reportId={userReportId}
          report={report}
          simulations={simulations}
          userSimulations={userSimulations}
          userPolicies={userPolicies}
          activeTab={activeTab}
          isLoading={dataLoading}
          error={dataError}
        />
      );
    }

    if (outputType === 'societyWide') {
      return <SocietyWideReportOutput />;
    }

    return <Text c="red">Unknown report type</Text>;
  };

  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
        {/* Back navigation */}
        <Group gap={spacing.xs} align="center">
          <IconChevronLeft size={20} color={colors.text.secondary} />
          <Text size="md" c={colors.text.secondary}>
            Reports
          </Text>
        </Group>

        {/* Header Section */}
        <Box>
          {/* Title row with actions */}
          <Group justify="space-between" align="flex-start" mb={spacing.xs}>
            <Group gap={spacing.xs} align="center">
              <Title
                order={1}
                variant="colored"
                fw={typography.fontWeight.semibold}
                fz={typography.fontSize['3xl']}
              >
                {userReport?.label || userReportId}
              </Title>
              <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Edit report name">
                <IconPencil size={18} />
              </ActionIcon>
            </Group>

            <Group gap={spacing.sm}>
              <Button
                variant="filled"
                leftSection={<IconRefresh size={18} />}
                bg={colors.warning}
                c={colors.black}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: colors.warning,
                      filter: 'brightness(0.95)',
                    },
                  },
                }}
              >
                Run Again
              </Button>
              <Button variant="default" leftSection={<IconShare size={18} />}>
                Share
              </Button>
            </Group>
          </Group>

          {/* Timestamp and View All */}
          <Group gap={spacing.xs} align="center">
            <IconClock size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              {timestamp}
            </Text>
            <Anchor size="sm" underline="always" c={colors.blue[700]}>
              View All
            </Anchor>
          </Group>
        </Box>

        {/* Navigation Tabs */}
        <Box
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          <Box
            style={{
              display: 'flex',
              position: 'relative',
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            {tabs.map((tab, index) => (
              <Box
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                style={{
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  paddingBottom: spacing.xs,
                  paddingTop: spacing.xs,
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  position: 'relative',
                  borderRight:
                    index < tabs.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                  marginBottom: '-1px',
                }}
              >
                <Text
                  span
                  variant="tab"
                  style={{
                    color: activeTab === tab.value ? colors.text.primary : colors.gray[700],
                    fontWeight:
                      activeTab === tab.value
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                  }}
                >
                  {tab.label}
                </Text>
                <IconStack2 size={14} color={colors.gray[500]} />
                {activeTab === tab.value && (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: colors.primary[700],
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Content Area */}
        {renderContent()}
      </Stack>
    </Container>
  );
}

/**
 * Determine which tabs to display based on output type and content
 */
function getTabsForOutputType(
  outputType: ReportOutputType
): Array<{ value: string; label: string }> {
  if (outputType === 'societyWide') {
    return [
      { value: 'overview', label: 'Overview' },
      { value: 'baseline-results', label: 'Baseline Simulation Results' },
      { value: 'reform-results', label: 'Reform Results' },
      { value: 'dynamics', label: 'Dynamics' },
      { value: 'parameters', label: 'Parameters' },
      { value: 'population', label: 'Population' },
    ];
  }

  if (outputType === 'household') {
    return [
      { value: 'overview', label: 'Overview' },
      { value: 'baseline-results', label: 'Baseline Simulation Results' },
      { value: 'reform-results', label: 'Reform Results' },
      { value: 'parameters', label: 'Parameters' },
      { value: 'population', label: 'Population' },
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
