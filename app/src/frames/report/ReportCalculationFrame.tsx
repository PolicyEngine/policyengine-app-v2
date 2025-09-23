import { useCallback, useState } from 'react';
import { Container, Title, Text, Card, Stack, Group, Loader, Progress, Badge, Button, Alert, Box, ScrollArea, SimpleGrid, Modal } from '@mantine/core';
import { IconAlertCircle, IconClock, IconUsers, IconHome, IconArrowRight } from '@tabler/icons-react';
import { useReportCalculation } from '@/hooks/useReportCalculation';
import { useUserEconomyCalculations } from '@/hooks/useUserEconomyCalculations';
import { useUserHouseholdCalculations } from '@/hooks/useUserHouseholdCalculations';
import { EconomyReportOutput } from '@/api/economy';
import { FlowComponentProps } from '@/types/flow';
import { Household } from '@/types/ingredients/Household';
import { spacing } from '@/designTokens';
import { countryIds } from '@/libs/countries';

interface NavigationParams {
  countryId?: string;
  baselinePolicyId?: string;
  reformPolicyId?: string;
  householdId?: string;
  region?: string;
  reportId?: string;
}

interface ExtendedFlowComponentProps extends FlowComponentProps {
  route?: {
    params?: NavigationParams;
  };
}

export default function ReportCalculationFrame({ onNavigate, route }: ExtendedFlowComponentProps) {
  const navigationParams = route?.params;

  // Check if we have specific calculation parameters
  if (navigationParams?.baselinePolicyId) {
    return <SpecificCalculationView
      navigationParams={navigationParams}
      onNavigate={onNavigate}
    />;
  } else {
    return <CalculationsDashboard onNavigate={onNavigate} />;
  }
}

function SpecificCalculationView({
  navigationParams,
  onNavigate
}: {
  navigationParams: NavigationParams;
  onNavigate: FlowComponentProps['onNavigate'];
}) {
  const { countryId, baselinePolicyId, reformPolicyId, householdId, region, reportId } = navigationParams;

  // Determine calculation type based on presence of householdId
  const isHouseholdCalculation = !!householdId;
  const effectiveCountryId = (countryId || 'us') as (typeof countryIds)[number];
  const effectiveReformPolicyId = reformPolicyId || baselinePolicyId || '';
  const economyParams = region ? { region } : undefined;

  // Handle navigation after completion
  const handleSuccess = useCallback((data: EconomyReportOutput | Household) => {
    console.log('Calculation completed:', data);
    // Delay navigation to allow user to see the results
    // In production, this would navigate to a proper results view
    setTimeout(() => onNavigate('complete'), 5000); // Increased to 5 seconds for debug view
  }, [onNavigate]);

  const handleError = useCallback((error: Error) => {
    console.error('Calculation failed:', error);
  }, []);

  // Use the unified report calculation hook
  const calculation = useReportCalculation(
    isHouseholdCalculation
      ? {
          reportType: 'household',
          countryId: effectiveCountryId,
          householdId,
          baselinePolicyId: baselinePolicyId || '',
          reformPolicyId: effectiveReformPolicyId !== baselinePolicyId ? effectiveReformPolicyId : undefined,
          reportId,
          enabled: !!householdId && !!baselinePolicyId,
          onSuccess: handleSuccess,
          onError: handleError,
        }
      : {
          reportType: 'society',
          countryId: effectiveCountryId,
          reformPolicyId: effectiveReformPolicyId,
          baselinePolicyId: baselinePolicyId || '',
          economyParams,
          reportId,
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
              <>
                <CompletedDisplay />
                {/* Temporary: Show the result JSON for debugging */}
                {calculation.result && (
                  <Box mt={spacing.md}>
                    <TemporaryResultDisplay result={calculation.result} />
                  </Box>
                )}
              </>
            ) : (
              <LoadingDisplay
                isHouseholdCalculation={isHouseholdCalculation}
                progress={calculationProgress.progress}
                queuePosition={calculationProgress.queuePosition}
                estimatedTime={calculationProgress.estimatedTime}
                countryId={effectiveCountryId}
                baselinePolicyId={baselinePolicyId}
                reformPolicyId={effectiveReformPolicyId}
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
  baselinePolicyId,
  reformPolicyId
}: {
  isHouseholdCalculation: boolean;
  progress?: number;
  queuePosition?: number;
  estimatedTime?: number;
  countryId: string;
  baselinePolicyId?: string;
  reformPolicyId?: string;
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
          {baselinePolicyId && (
            <Text size="xs" c="dimmed">
              Baseline Policy: #{baselinePolicyId}
            </Text>
          )}
          {reformPolicyId && reformPolicyId !== baselinePolicyId && (
            <Text size="xs" c="dimmed">
              Reform Policy: #{reformPolicyId}
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
      <Text size="sm" c="dimmed">Calculation complete! Results will be shown below...</Text>
    </Stack>
  );
}

// Temporary component to display raw JSON result
function TemporaryResultDisplay({
  result
}: {
  result: EconomyReportOutput | Household | any
}) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap={spacing.sm}>
        <Text fw={600}>Result JSON (Temporary Debug View)</Text>
        <ScrollArea h={400} type="auto" offsetScrollbars>
          <Box
            component="pre"
            p={spacing.md}
            style={{
              backgroundColor: 'var(--mantine-color-gray-0)',
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--mantine-color-gray-3)',
              fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              margin: 0,
              overflow: 'auto'
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        </ScrollArea>
      </Stack>
    </Card>
  );
}

// Dashboard view showing all calculations as buttons
function CalculationsDashboard({ onNavigate }: { onNavigate: FlowComponentProps['onNavigate'] }) {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const {
    calculations: economyCalculations,
    pendingCount: economyPendingCount,
    completedCount: economyCompletedCount,
    erroredCount: economyErroredCount
  } = useUserEconomyCalculations();

  const {
    calculations: householdCalculations,
    pendingCount: householdPendingCount,
    completedCount: householdCompletedCount,
    erroredCount: householdErroredCount
  } = useUserHouseholdCalculations();

  const handleShowResult = (calculation: any) => {
    // For economy calculations, use the result field
    // For household calculations, use the data field
    const result = calculation.result || calculation.data;
    if (result) {
      setSelectedResult(result);
      setModalOpened(true);
    }
  };

  return (
    <>
      <Container variant="guttered">
        <Stack gap={spacing.lg}>
          <Box>
            <Title order={2} variant="colored">
              Cached Calculations Dashboard
            </Title>
            <Text c="dimmed" mt={spacing.xs}>
              Click any completed calculation to view its JSON result
            </Text>
          </Box>

          {/* Summary Stats */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={spacing.md}>
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Text fw={600} size="sm">Economy Calculations</Text>
              <Text size="xs" c="dimmed">Pending: {economyPendingCount}</Text>
              <Text size="xs" c="dimmed">Completed: {economyCompletedCount}</Text>
              <Text size="xs" c="dimmed">Errored: {economyErroredCount}</Text>
            </Card>

            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Text fw={600} size="sm">Household Calculations</Text>
              <Text size="xs" c="dimmed">Pending: {householdPendingCount}</Text>
              <Text size="xs" c="dimmed">Completed: {householdCompletedCount}</Text>
              <Text size="xs" c="dimmed">Errored: {householdErroredCount}</Text>
            </Card>

            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Text fw={600} size="sm">Total in Cache</Text>
              <Text size="lg" fw={700}>{economyCalculations.length + householdCalculations.length}</Text>
            </Card>
          </SimpleGrid>

          {/* Economy Calculations List */}
          {economyCalculations.length > 0 && (
            <Box>
              <Title order={4} mb={spacing.sm}>Economy Calculations</Title>
              <Stack gap={spacing.xs}>
                {economyCalculations.map((calc, index) => (
                  <Button
                    key={index}
                    variant="default"
                    fullWidth
                    justify="space-between"
                    rightSection={
                      <Badge
                        color={
                          calc.status === 'pending' ? 'blue' :
                          calc.status === 'completed' ? 'green' :
                          'red'
                        }
                      >
                        {calc.status}
                      </Badge>
                    }
                    onClick={() => handleShowResult(calc)}
                    disabled={calc.status !== 'completed'}
                  >
                    <Box>
                      <Text size="sm" fw={500}>
                        {calc.countryId.toUpperCase()} | Policy {calc.baselinePolicyId} → {calc.reformPolicyId}
                      </Text>
                      {calc.params?.region && (
                        <Text size="xs" c="dimmed">Region: {calc.params.region}</Text>
                      )}
                    </Box>
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          {/* Household Calculations List */}
          {householdCalculations.length > 0 && (
            <Box>
              <Title order={4} mb={spacing.sm}>Household Calculations</Title>
              <Stack gap={spacing.xs}>
                {householdCalculations.map((calc, index) => (
                  <Button
                    key={index}
                    variant="default"
                    fullWidth
                    justify="space-between"
                    rightSection={
                      <Badge
                        color={
                          calc.status === 'pending' ? 'blue' :
                          calc.status === 'completed' ? 'green' :
                          'red'
                        }
                      >
                        {calc.status}
                      </Badge>
                    }
                    onClick={() => handleShowResult(calc)}
                    disabled={calc.status !== 'completed'}
                  >
                    <Text size="sm" fw={500}>
                      {calc.countryId.toUpperCase()} | Household {calc.householdId} | Policy {calc.policyId}
                    </Text>
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          {/* Empty state */}
          {economyCalculations.length === 0 && householdCalculations.length === 0 && (
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Stack align="center" gap={spacing.md}>
                <Text size="lg" fw={500}>No Calculations in Cache</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Run some calculations and they will appear here
                </Text>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>

      {/* Modal to show JSON result */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedResult(null);
        }}
        title="Calculation Result JSON"
        size="xl"
      >
        {selectedResult && <TemporaryResultDisplay result={selectedResult} />}
      </Modal>
    </>
  );
}