import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Container, Title, Text, Card, Stack, Group, Loader, Progress, Badge, Button, Alert, Box } from '@mantine/core';
import { IconAlertCircle, IconClock, IconUsers, IconHome } from '@tabler/icons-react';
import { useEconomyCalculation } from '@/hooks/useEconomyCalculation';
import { EconomyReportOutput } from '@/api/economy';
import { useHouseholdCalculation } from '@/hooks/useHouseholdCalculation';
import { markReportCompleted, markReportError } from '@/api/report';
import { selectBothSimulations } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Report } from '@/types/ingredients/Report';
import { Household } from '@/types/ingredients/Household';
import { spacing } from '@/designTokens';

interface CalculationProgress {
  status: 'pending' | 'running' | 'completed' | 'error';
  queuePosition?: number;
  estimatedTime?: number;
  progress?: number;
  error?: string;
}

export default function ReportCalculationFrame({ onNavigate }: FlowComponentProps) {
  const reportState = useSelector((state: RootState) => state.report);
  const [simulation1, simulation2] = useSelector((state: RootState) => selectBothSimulations(state));

  const [calculationProgress, setCalculationProgress] = useState<CalculationProgress>({
    status: 'pending'
  });
  const [hasCompletedCalculation, setHasCompletedCalculation] = useState(false);

  // Determine calculation type based on population type
  const isHouseholdCalculation = simulation1?.populationType === 'household';
  const countryId = reportState.countryId || simulation1?.countryId || 'us';

  // Extract policy IDs from simulations
  const baselinePolicyId = simulation1?.policyId || '';
  const reformPolicyId = simulation2?.policyId || baselinePolicyId;

  // For household calculations, we need the household ID
  const householdId = isHouseholdCalculation ? simulation1?.populationId : '';

  // For economy calculations, we might have region parameters
  const economyParams = !isHouseholdCalculation && simulation1?.populationId
    ? { region: simulation1.populationId }
    : undefined;

  // Society-wide calculation hook
  const economyCalculation = useEconomyCalculation({
    countryId,
    reformPolicyId,
    baselinePolicyId,
    params: economyParams,
    enabled: !isHouseholdCalculation && !!baselinePolicyId && !hasCompletedCalculation,
    onSuccess: useCallback(async (data: EconomyReportOutput) => {
      console.log('Economy calculation completed:', data);
      setCalculationProgress({
        status: 'completed',
        progress: 100
      });

      // Update report status in backend
      if (reportState.reportId) {
        try {
          const report: Report = {
            ...reportState,
            status: 'complete',
            output: data
          };
          await markReportCompleted(countryId, reportState.reportId, report);
        } catch (error) {
          console.error('Failed to update report status:', error);
        }
      }

      setHasCompletedCalculation(true);
      setTimeout(() => onNavigate('complete'), 1500);
    }, [countryId, reportState, onNavigate]),
    onError: useCallback(async (error: Error) => {
      console.error('Economy calculation failed:', error);
      setCalculationProgress({
        status: 'error',
        error: error.message
      });

      // Update report status to error
      if (reportState.reportId) {
        try {
          const report: Report = {
            ...reportState,
            status: 'error',
            output: null
          };
          await markReportError(countryId, reportState.reportId, report);
        } catch (err) {
          console.error('Failed to update report error status:', err);
        }
      }
    }, [countryId, reportState]),
    onQueueUpdate: useCallback((position: number, averageTime?: number) => {
      // Progress calculation:
      // - Queue position 0: User is being processed (20-90% based on estimated runtime)
      // - Queue position 1-3: 15-20% (close to processing)
      // - Queue position 4+: 5-15% (waiting in queue)
      // Average runtime is 4-8 minutes, so we estimate progress during processing
      let calculatedProgress: number;

      if (position === 0) {
        // User is being processed - estimate based on time elapsed
        // Start at 20% when processing begins, gradually increase
        // This is a rough estimate since we don't have exact timing
        const baseProgress = 20;
        const processingProgress = 70; // Can go up to 90% (20 + 70)

        // If we have average time, use it to estimate progress
        // Otherwise, assume we're 40% through processing
        calculatedProgress = averageTime && averageTime > 0
          ? baseProgress + Math.min(processingProgress, (processingProgress / 2))
          : 40;
      } else if (position <= 3) {
        // Close to being processed
        calculatedProgress = 20 - (position * 2); // 18%, 16%, 14%
      } else {
        // Further back in queue
        calculatedProgress = Math.max(5, 14 - position); // Minimum 5%
      }

      setCalculationProgress(prev => ({
        ...prev,
        status: 'running',
        queuePosition: position,
        estimatedTime: averageTime,
        progress: calculatedProgress
      }));
    }, [])
  });

  // Household calculation hooks (baseline and reform)
  const baselineHouseholdCalc = useHouseholdCalculation({
    countryId,
    householdId: householdId || '',
    policyId: baselinePolicyId,
    enabled: isHouseholdCalculation && !!householdId && !!baselinePolicyId && !hasCompletedCalculation,
    onSuccess: useCallback(() => {
      console.log('Baseline household calculation completed');
    }, []),
    onError: useCallback((error: Error) => {
      console.error('Baseline household calculation failed:', error);
      setCalculationProgress({
        status: 'error',
        error: error.message
      });
    }, [])
  });

  // Handle baseline-only case
  const isBaselineOnly = !simulation2 || simulation2.policyId === simulation1?.policyId;

  const reformHouseholdCalc = useHouseholdCalculation({
    countryId,
    householdId: householdId || '',
    policyId: reformPolicyId,
    enabled: isHouseholdCalculation && !!householdId && !!reformPolicyId && !isBaselineOnly && !hasCompletedCalculation,
    onSuccess: useCallback(() => {
      console.log('Reform household calculation completed');
    }, []),
    onError: useCallback((error: Error) => {
      console.error('Reform household calculation failed:', error);
      setCalculationProgress({
        status: 'error',
        error: error.message
      });
    }, [])
  });

  // Handle household calculation completion
  useEffect(() => {
    if (isHouseholdCalculation && !hasCompletedCalculation) {
      const baselineComplete = baselineHouseholdCalc.data && !baselineHouseholdCalc.isLoading;
      const reformComplete = isBaselineOnly ||
        (reformHouseholdCalc.data && !reformHouseholdCalc.isLoading);

      if (baselineComplete && reformComplete) {
        setCalculationProgress({
          status: 'completed',
          progress: 100
        });

        // For household calculations, return the household data directly
        // In baseline-only mode, just return the baseline household
        const householdOutput: Household = isBaselineOnly
          ? baselineHouseholdCalc.data
          : (reformHouseholdCalc.data || baselineHouseholdCalc.data);

        // Update report status
        if (reportState.reportId) {
          const report: Report = {
            ...reportState,
            status: 'complete',
            output: householdOutput as any // This will be a Household type for household calculations
          };
          markReportCompleted(countryId, reportState.reportId, report)
            .catch((error: Error) => console.error('Failed to update report status:', error));
        }

        setHasCompletedCalculation(true);
        setTimeout(() => onNavigate('complete'), 1500);
      } else if (baselineComplete) {
        // Update progress for partial completion
        setCalculationProgress({
          status: 'running',
          progress: isBaselineOnly ? 100 : 50
        });
      }
    }
  }, [
    isHouseholdCalculation,
    baselineHouseholdCalc.data,
    baselineHouseholdCalc.isLoading,
    reformHouseholdCalc.data,
    reformHouseholdCalc.isLoading,
    reformPolicyId,
    baselinePolicyId,
    hasCompletedCalculation,
    isBaselineOnly,
    reportState,
    countryId,
    onNavigate
  ]);

  // Handle retry
  const handleRetry = () => {
    setCalculationProgress({ status: 'pending' });
    setHasCompletedCalculation(false);

    if (isHouseholdCalculation) {
      baselineHouseholdCalc.retry();
      if (!isBaselineOnly) {
        reformHouseholdCalc.retry();
      }
    } else {
      economyCalculation.retry();
    }
  };

  return (
    <Container variant="guttered">
      <Stack gap={spacing.lg}>
        <Box>
          <Title order={2} variant="colored">
            {isHouseholdCalculation ? 'Calculating Household Impact' : 'Calculating Society-Wide Impact'}
          </Title>
          <Text c="dimmed" mt={spacing.xs}>
            {calculationProgress.status === 'error'
              ? 'Calculation encountered an error'
              : calculationProgress.status === 'completed'
              ? 'Calculation complete!'
              : 'Please wait while we process your report...'}
          </Text>
        </Box>

        {/* Progress Card */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap={spacing.md}>
            {/* Status Header */}
            <Group justify="space-between" align="center">
              <Group gap={spacing.sm}>
                {isHouseholdCalculation ? (
                  <IconHome size={24} />
                ) : (
                  <IconUsers size={24} />
                )}
                <Text fw={600}>
                  {isHouseholdCalculation ? 'Household Calculation' : 'Economy-Wide Calculation'}
                  {isBaselineOnly && ' (Baseline Only)'}
                </Text>
              </Group>
              <Badge
                size="lg"
                variant="light"
                color={
                  calculationProgress.status === 'error' ? 'red' :
                  calculationProgress.status === 'completed' ? 'green' :
                  calculationProgress.status === 'running' ? 'blue' : 'gray'
                }
              >
                {calculationProgress.status === 'pending' ? 'Initializing' :
                 calculationProgress.status === 'running' ? 'Processing' :
                 calculationProgress.status === 'completed' ? 'Complete' : 'Error'}
              </Badge>
            </Group>

            {/* Conditional Display Components */}
            {calculationProgress.status === 'error' ? (
              <ErrorDisplay
                error={calculationProgress.error}
                onRetry={handleRetry}
                onCancel={() => onNavigate('cancel')}
              />
            ) : calculationProgress.status === 'completed' ? (
              <CompletedDisplay />
            ) : (
              <LoadingDisplay
                isHouseholdCalculation={isHouseholdCalculation}
                progress={calculationProgress.progress}
                queuePosition={calculationProgress.queuePosition}
                estimatedTime={calculationProgress.estimatedTime}
                countryId={countryId}
                simulation1={simulation1}
                simulation2={simulation2}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

// Display component functions
function LoadingDisplay({
  isHouseholdCalculation,
  progress,
  queuePosition,
  estimatedTime,
  countryId,
  simulation1,
  simulation2
}: {
  isHouseholdCalculation: boolean;
  progress?: number;
  queuePosition?: number;
  estimatedTime?: number;
  countryId: string;
  simulation1?: any;
  simulation2?: any;
}) {
  const formatTime = (seconds?: number) => {
    if (!seconds) return 'calculating...';
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes} min ${remainingSeconds} sec`
      : `${minutes} min`;
  };

  return (
    <Stack gap={spacing.md}>
      {/* Progress Bar */}
      <Box>
        <Progress
          value={progress || 5}
          size="xl"
          radius="md"
          animated
          color="blue"
        />
        {progress && (
          <Text size="sm" c="dimmed" mt={spacing.xs} ta="center">
            {progress}% complete
          </Text>
        )}
      </Box>

      {/* Queue Information (for economy calculations) */}
      {!isHouseholdCalculation && queuePosition !== undefined && (
        <Card withBorder p={spacing.sm} radius="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Group gap={spacing.sm}>
            <IconClock size={20} />
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {queuePosition === 0
                  ? 'Processing your calculation...'
                  : `Queue Position: ${queuePosition}`}
              </Text>
              {estimatedTime && (
                <Text size="xs" c="dimmed">
                  Estimated time: {formatTime(estimatedTime)}
                </Text>
              )}
            </Box>
          </Group>
        </Card>
      )}

      {/* Loading Spinner */}
      <Group justify="center" mt={spacing.sm}>
        <Loader size="lg" />
      </Group>

      {/* Calculation Details */}
      <Card withBorder p={spacing.sm} radius="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Stack gap={spacing.xs}>
          <Text size="sm" fw={600}>Calculation Details</Text>
          <Text size="xs" c="dimmed">
            Country: {countryId.toUpperCase()}
          </Text>
          <Text size="xs" c="dimmed">
            Type: {isHouseholdCalculation ? 'Household Impact' : 'Society-Wide Impact'}
          </Text>
          {simulation1?.label && (
            <Text size="xs" c="dimmed">
              Baseline: {simulation1.label}
            </Text>
          )}
          {simulation2?.label && simulation2.policyId !== simulation1?.policyId && (
            <Text size="xs" c="dimmed">
              Reform: {simulation2.label}
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

function ErrorDisplay({ error, onRetry, onCancel }: { error?: string; onRetry: () => void; onCancel: () => void }) {
  return (
    <Stack gap={spacing.md}>
      <Alert
        icon={<IconAlertCircle size={20} />}
        title="Calculation Failed"
        color="red"
        variant="light"
      >
        {error || 'An unexpected error occurred during calculation.'}
      </Alert>

      <Group justify="center" mt={spacing.md}>
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="filled" onClick={onRetry}>
          Retry Calculation
        </Button>
      </Group>
    </Stack>
  );
}

function CompletedDisplay() {
  return (
    <Stack gap={spacing.md} align="center">
      <Progress value={100} size="xl" radius="md" color="green" />
      <Text size="sm" c="dimmed">Calculation complete! Redirecting...</Text>
    </Stack>
  );
}