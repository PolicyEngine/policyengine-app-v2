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
import { EconomyReportOutput } from '@/api/economy';
import { colors, spacing, typography } from '@/designTokens';
import { useCalculationStatus } from '@/hooks/useCalculationStatus';
import { useUserReportById } from '@/hooks/useUserReports';
import { Household, HouseholdData } from '@/types/ingredients/Household';
import ErrorPage from './report-output/ErrorPage';
import LoadingPage from './report-output/LoadingPage';
import NotFoundSubPage from './report-output/NotFoundSubPage';
import OverviewSubPage from './report-output/OverviewSubPage';

/**
 * Type discriminator for output types
 */
export type ReportOutputType = 'household' | 'economy';

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

// Valid sub-pages registry
const VALID_SUBPAGES = ['overview', 'loading', 'error'] as const;
type ValidSubPage = (typeof VALID_SUBPAGES)[number];

function isValidSubPage(subpage: string | undefined): subpage is ValidSubPage {
  return VALID_SUBPAGES.includes(subpage as ValidSubPage);
}

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
  const { userReport, report, simulations, isLoading: dataLoading, error: dataError } =
    useUserReportById(userReportId);

  // Derive output type from simulation (needed for target type determination)
  const outputType: ReportOutputType | undefined = simulations?.[0]?.populationType === 'household'
    ? 'household'
    : simulations?.[0]?.populationType === 'geography'
    ? 'economy'
    : undefined;

  // Get calculation status
  // WHY: Unified hook handles both single and multiple calculations internally.
  // - Household reports: Pass array of simulation IDs → aggregates N simulations
  // - Economy reports: Pass single report ID → reads single calculation
  const isHouseholdReport = outputType === 'household';

  const calcIds = isHouseholdReport
    ? simulations?.map(s => s.id).filter((id): id is string => !!id) || []
    : report?.id || '';

  const targetType = isHouseholdReport ? 'simulation' : 'report';

  const calcStatus = useCalculationStatus(calcIds, targetType);

  // Prepare output data - wrap household data if needed
  let output: EconomyReportOutput | Household | null | undefined = undefined;

  if (outputType === 'household' && calcStatus.result && report?.countryId) {
    const wrappedOutput: Household = {
      id: report.id,
      countryId: report.countryId,
      householdData: calcStatus.result as HouseholdData,
    };
    output = wrappedOutput;
  } else if (outputType === 'economy' && calcStatus.result) {
    output = calcStatus.result as EconomyReportOutput;
  }

  const DEFAULT_PAGE = 'overview';

  // Use URL param for active tab, default to 'overview'
  const activeTab = subpage || DEFAULT_PAGE;

  // Redirect to overview if no subpage is specified and data is ready
  useEffect(() => {
    if (!subpage && calcStatus.isComplete && output) {
      navigate(DEFAULT_PAGE, { replace: true });
    }
  }, [subpage, navigate, output, calcStatus.isComplete]);

  // Determine which tabs to show based on output type
  const tabs = output && outputType ? getTabsForOutputType(outputType) : [];

  // Format timestamp (placeholder for now)
  const timestamp = 'Ran today at 05:23:41';

  // Handler for tab clicks - navigate to sibling route
  const handleTabClick = (tabValue: string) => {
    navigate(tabValue);
  };

  // Render the appropriate sub-page based on status and URL param
  const renderSubPage = () => {
    // Show loading if data is still being fetched
    if (dataLoading) {
      return <LoadingPage message="Loading report..." />;
    }

    // Show error if report data failed to load
    if (dataError || !report) {
      return <ErrorPage error={dataError || new Error('Report not found')} />;
    }

    // Show loading page if calculation is still running
    if (calcStatus.isComputing) {
      return (
        <LoadingPage
          progress={calcStatus.progress}
          message={calcStatus.message}
          queuePosition={calcStatus.queuePosition}
          estimatedTimeRemaining={calcStatus.estimatedTimeRemaining}
        />
      );
    }

    // Show error page if calculation failed
    if (calcStatus.isError) {
      return <ErrorPage error={calcStatus.error || new Error('Calculation failed')} />;
    }

    // Show not found if invalid subpage
    if (!isValidSubPage(activeTab)) {
      return <NotFoundSubPage />;
    }

    // Map valid sub-pages to their components
    switch (activeTab) {
      case 'overview':
        return output && outputType ? (
          <OverviewSubPage output={output} outputType={outputType} />
        ) : (
          <NotFoundSubPage />
        );
      case 'loading':
        return (
          <LoadingPage
            progress={calcStatus.progress}
            message={calcStatus.message}
            queuePosition={calcStatus.queuePosition}
            estimatedTimeRemaining={calcStatus.estimatedTimeRemaining}
          />
        );
      case 'error':
        return <ErrorPage error={calcStatus.error || new Error('Calculation error')} />;
      default:
        return <NotFoundSubPage />;
    }
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
                      height: '3px',
                      backgroundColor: colors.warning,
                      zIndex: 1,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Tab Panels */}
          <Box pt={spacing.xl}>{renderSubPage()}</Box>
        </Box>
      </Stack>
    </Container>
  );
}

/**
 * Type guard to check if economy output is US-specific
 */
export function isUSEconomyOutput(output: EconomyReportOutput): boolean {
  return 'poverty_by_race' in output && output.poverty_by_race !== null;
}

/**
 * Type guard to check if economy output is UK-specific
 */
export function isUKEconomyOutput(output: EconomyReportOutput): boolean {
  return 'constituency_impact' in output && output.constituency_impact !== null;
}

/**
 * Determine which tabs to display based on output type and content
 * Note: The output type is determined from cached CalculationMeta, not from type guards
 */
function getTabsForOutputType(
  outputType: ReportOutputType
): Array<{ value: string; label: string }> {
  if (outputType === 'economy') {
    // Economy report tabs matching the design
    const baseTabs = [
      { value: 'overview', label: 'Overview' },
      { value: 'baseline-results', label: 'Baseline Simulation Results' },
      { value: 'reform-results', label: 'Reform Results' },
      { value: 'dynamics', label: 'Dynamics' },
      { value: 'parameters', label: 'Parameters' },
      { value: 'population', label: 'Population' },
    ];

    return baseTabs;
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

  // Fallback
  return [{ value: 'overview', label: 'Overview' }];
}
