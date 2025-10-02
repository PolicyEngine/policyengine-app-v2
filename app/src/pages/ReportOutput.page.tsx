import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Stack,
  Title,
  Text,
  Box,
  Group,
  Button,
  ActionIcon,
  Anchor,
} from '@mantine/core';
import { IconPencil, IconClock, IconShare, IconRefresh, IconChevronLeft, IconStack2 } from '@tabler/icons-react';
import { EconomyReportOutput } from '@/api/economy';
import { colors, spacing, typography } from '@/designTokens';
import { Household } from '@/types/ingredients/Household';
import { useUserReportById } from '@/hooks/useUserReports';
import { useReportOutput } from '@/hooks/useReportOutput';
import { MOCK_USER_ID } from '@/constants';
import {
  MOCK_ECONOMY_REPORT_OUTPUT,
  MOCK_HOUSEHOLD_OUTPUT,
  MOCK_DEMO_REPORT_ID,
  MOCK_DEMO_HOUSEHOLD_ID,
} from '@/tests/fixtures/report/mockReportOutput';
import OverviewSubPage from './report-output/subpages/OverviewSubPage';
import NotFoundSubPage from './report-output/subpages/NotFoundSubPage';
import LoadingPage from './report-output/subpages/LoadingPage';
import ErrorPage from './report-output/subpages/ErrorPage';

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

/**
 * Hook to fetch and manage report output data
 * If the report ID matches a demo ID, returns mock data instead of fetching
 */
function useReportData(reportId: string) {
  // Check if this is a demo report
  const isDemoEconomyReport = reportId === MOCK_DEMO_REPORT_ID;
  const isDemoHouseholdReport = reportId === MOCK_DEMO_HOUSEHOLD_ID;

  // If demo economy report, return mock economy data
  if (isDemoEconomyReport) {
    const userId = MOCK_USER_ID.toString();
    const normalizedReport = useUserReportById(userId, reportId);

    return {
      status: 'complete' as const,
      output: MOCK_ECONOMY_REPORT_OUTPUT,
      outputType: 'economy' as ReportOutputType,
      error: undefined,
      normalizedReport,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    };
  }

  // If demo household report, return mock household data
  if (isDemoHouseholdReport) {
    const userId = MOCK_USER_ID.toString();
    const normalizedReport = useUserReportById(userId, reportId);

    return {
      status: 'complete' as const,
      output: MOCK_HOUSEHOLD_OUTPUT,
      outputType: 'household' as ReportOutputType,
      error: undefined,
      normalizedReport,
      progress: undefined,
      message: undefined,
      queuePosition: undefined,
      estimatedTimeRemaining: undefined,
    };
  }

  // Otherwise, fetch real data
  const result = useReportOutput({ reportId });
  const { status, data, error } = result;
  const userId = MOCK_USER_ID.toString();
  const normalizedReport = useUserReportById(userId, reportId);

  // Extract progress information if status is pending
  const progress = status === 'pending' ? (result as any).progress : undefined;
  const message = status === 'pending' ? (result as any).message : undefined;
  const queuePosition = status === 'pending' ? (result as any).queuePosition : undefined;
  const estimatedTimeRemaining = status === 'pending' ? (result as any).estimatedTimeRemaining : undefined;

  // Determine output type
  const output = data;
  const outputType: ReportOutputType | undefined = output
    ? isHouseholdOutput(output)
      ? 'household'
      : 'economy'
    : undefined;

  return {
    status,
    output,
    outputType,
    error,
    normalizedReport,
    progress,
    message,
    queuePosition,
    estimatedTimeRemaining,
  };
}

export default function ReportOutputPage() {
  const navigate = useNavigate();
  const { reportId, subpage } = useParams<{ reportId?: string; subpage?: string }>();

  // If no reportId, show error
  if (!reportId) {
    return (
      <Container size="xl" px={spacing.xl}>
        <Stack gap={spacing.xl}>
          <Text c="red">Error: Report ID is required</Text>
        </Stack>
      </Container>
    );
  }

  const {
    status,
    output,
    outputType,
    error,
    normalizedReport,
    progress,
    message,
    queuePosition,
    estimatedTimeRemaining,
  } = useReportData(reportId);

  const { report } = normalizedReport;
  const DEFAULT_PAGE = 'overview';

  // Use URL param for active tab, default to 'overview'
  const activeTab = subpage || DEFAULT_PAGE;

  // Redirect to overview if no subpage is specified and data is ready
  useEffect(() => {
    if (!subpage && status === 'complete' && output) {
      navigate(DEFAULT_PAGE, { replace: true });
    }
  }, [subpage, navigate, output, status]);

  // Determine which tabs to show based on output type
  const tabs = output && outputType ? getTabsForOutputType(outputType, output) : [];

  // Format timestamp (placeholder for now)
  const timestamp = 'Ran today at 05:23:41';

  // Handler for tab clicks - navigate to sibling route
  const handleTabClick = (tabValue: string) => {
    navigate(tabValue);
  };

  // Render the appropriate sub-page based on status and URL param
  const renderSubPage = () => {
    // Show loading page if still pending
    if (status === 'pending') {
      return (
        <LoadingPage
          progress={progress}
          message={message}
          queuePosition={queuePosition}
          estimatedTimeRemaining={estimatedTimeRemaining}
        />
      );
    }

    // Show error page if there's an error
    if (status === 'error') {
      return <ErrorPage error={error} />;
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
            progress={progress}
            message={message}
            queuePosition={queuePosition}
            estimatedTimeRemaining={estimatedTimeRemaining}
          />
        );
      case 'error':
        return <ErrorPage error={error} />;
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
                {report?.label || `Report ${String(report?.id || '').padStart(4, '0')}`}
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
                  borderRight: index < tabs.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                  marginBottom: '-1px',
                }}
              >
                <Text
                  span
                  variant="tab"
                  style={{
                    color: activeTab === tab.value ? colors.text.primary : colors.gray[700],
                    fontWeight:
                      activeTab === tab.value ? typography.fontWeight.medium : typography.fontWeight.normal,
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
 * Type guard to check if output is an economy report
 */
export function isEconomyOutput(output: EconomyReportOutput | Household): output is EconomyReportOutput {
  return 'budget' in output && 'budgetary_impact' in (output as any).budget;
}

/**
 * Type guard to check if output is a household
 */
export function isHouseholdOutput(output: EconomyReportOutput | Household): output is Household {
  return 'householdData' in output;
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
 */
function getTabsForOutputType(
  outputType: ReportOutputType,
  output: EconomyReportOutput | Household
): Array<{ value: string; label: string }> {
  if (outputType === 'economy' && isEconomyOutput(output)) {
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

  if (outputType === 'household' && isHouseholdOutput(output)) {
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


