import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Container, Title, Text, Card, Stack, Group, Loader, Progress, Badge, Button, Alert, Box } from '@mantine/core';
import { IconAlertCircle, IconClock, IconUsers, IconHome } from '@tabler/icons-react';
import { useReportCalculation } from '@/hooks/useReportCalculation';
import { EconomyReportOutput } from '@/api/economy';
import { selectBothSimulations } from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Household } from '@/types/ingredients/Household';
import { spacing } from '@/designTokens';
import { countryIds } from '@/libs/countries';

export default function ReportCalculationFrame({ onNavigate }: FlowComponentProps) {
  const reportState = useSelector((state: RootState) => state.report);
  const [simulation1, simulation2] = useSelector((state: RootState) => selectBothSimulations(state));

  // Determine calculation type based on population type
  const isHouseholdCalculation = simulation1?.populationType === 'household';
  const countryId = (reportState.countryId || simulation1?.countryId || 'us') as (typeof countryIds)[number];

  // Extract policy IDs from simulations
  const baselinePolicyId = simulation1?.policyId || '';
  const reformPolicyId = simulation2?.policyId || baselinePolicyId;

  // For household calculations, we need the household ID
  const householdId = isHouseholdCalculation ? (simulation1?.populationId || '') : '';

  // For economy calculations, we might have region parameters
  const economyParams = !isHouseholdCalculation && simulation1?.populationId
    ? { region: simulation1.populationId }
    : undefined;

  // Handle navigation after completion
  const handleSuccess = useCallback((data: EconomyReportOutput | Household) => {
    console.log('Calculation completed:', data);
    setTimeout(() => onNavigate('complete'), 1500);
  }, [onNavigate]);

  const handleError = useCallback((error: Error) => {
    console.error('Calculation failed:', error);
  }, []);

  // Use the unified report calculation hook
  const calculation = useReportCalculation(
    isHouseholdCalculation
      ? {
          reportType: 'household',
          countryId,
          householdId,
          baselinePolicyId,
          reformPolicyId: reformPolicyId !== baselinePolicyId ? reformPolicyId : undefined,
          reportId: reportState.reportId,
          enabled: !!householdId && !!baselinePolicyId,
          onSuccess: handleSuccess,
          onError: handleError,
        }
      : {
          reportType: 'society',
          countryId,
          reformPolicyId,
          baselinePolicyId,
          economyParams,
          reportId: reportState.reportId,
          enabled: !!baselinePolicyId,
          onSuccess: handleSuccess,
          onError: handleError,
        }
  );

  const { calculationProgress, isBaselineOnly, retry } = calculation;

  // Handle retry
  const handleRetry = useCallback(() => {
    retry();
  }, [retry]);

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