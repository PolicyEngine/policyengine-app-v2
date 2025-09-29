import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Progress,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useReportOutput } from '@/hooks/useReportOutput';

export default function ReportOutputFrame() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  if (!reportId) {
    return (
      <Container variant="guttered">
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Missing Report ID"
          color="red"
          variant="light"
        >
          No report ID was provided. Please go back and create a report first.
        </Alert>
        <Button mt={spacing.md} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  return <ReportOutputView reportId={reportId} navigate={navigate} countryId={countryId} />;
}

function ReportOutputView({
  reportId,
  navigate,
  countryId,
}: {
  reportId: string;
  navigate: ReturnType<typeof useNavigate>;
  countryId: string;
}) {
  const result = useReportOutput({ reportId });
  const { status, data, isPending, error } = result;

  // Extract progress information if status is pending
  const progress = status === 'pending' ? (result as any).progress : undefined;
  const message = status === 'pending' ? (result as any).message : undefined;
  const queuePosition = status === 'pending' ? (result as any).queuePosition : undefined;
  const estimatedTimeRemaining =
    status === 'pending' ? (result as any).estimatedTimeRemaining : undefined;

  return (
    <Container variant="guttered">
      <Stack gap={spacing.lg}>
        <Box>
          <Title order={2} variant="colored">
            Report Results
          </Title>
          <Text c="dimmed" mt={spacing.xs}>
            {status === 'error'
              ? 'Calculation encountered an error'
              : status === 'complete'
                ? 'Calculation complete!'
                : 'Please wait while we process your report...'}
          </Text>
        </Box>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap={spacing.md}>
            {/* Status Header */}
            <Group justify="space-between" align="center">
              <Text fw={600}>Report #{reportId}</Text>
              <Badge
                size="lg"
                variant="light"
                color={status === 'error' ? 'red' : status === 'complete' ? 'green' : 'blue'}
              >
                {status === 'pending' ? 'Processing' : status === 'complete' ? 'Complete' : 'Error'}
              </Badge>
            </Group>

            {/* Content based on status */}
            {status === 'error' ? (
              <ErrorDisplay error={error} onBack={() => navigate(-1)} />
            ) : status === 'complete' ? (
              <>
                <CompletedDisplay />
                {data && (
                  <Box mt={spacing.md}>
                    <ResultDisplay result={data} />
                  </Box>
                )}
                <Button
                  mt={spacing.md}
                  fullWidth
                  onClick={() => navigate(`/${countryId}/reports/${reportId}`)}
                  rightSection={<IconCheck size={18} />}
                >
                  Continue to Report View
                </Button>
              </>
            ) : (
              <LoadingDisplay
                isPending={isPending}
                progress={progress}
                message={message}
                queuePosition={queuePosition}
                estimatedTimeRemaining={estimatedTimeRemaining}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

function LoadingDisplay({
  isPending,
  progress,
  message,
  queuePosition,
  estimatedTimeRemaining,
}: {
  isPending: boolean;
  progress?: number;
  message?: string;
  queuePosition?: number;
  estimatedTimeRemaining?: number;
}) {
  // Calculate progress value
  const progressValue = progress ? progress * 100 : queuePosition ? 100 - queuePosition : 50;

  // Format estimated time
  const formatTime = (ms?: number) => {
    if (!ms) {
      return null;
    }
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const estimatedTime = formatTime(estimatedTimeRemaining);

  return (
    <Stack gap={spacing.md}>
      <Box>
        <Progress value={progressValue} size="xl" radius="md" animated color="blue" />
        <Text size="sm" c="dimmed" mt={spacing.xs} ta="center">
          {message ||
            (queuePosition
              ? `Queue position: ${queuePosition}`
              : isPending
                ? 'Processing calculation...'
                : 'Fetching results...')}
        </Text>
        {estimatedTime && (
          <Text size="xs" c="dimmed" ta="center" mt={4}>
            Estimated time remaining: {estimatedTime}
          </Text>
        )}
      </Box>

      <Group justify="center" mt={spacing.sm}>
        <Loader size="lg" />
      </Group>

      <Card
        withBorder
        p={spacing.sm}
        radius="sm"
        style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
      >
        <Text size="sm" c="dimmed">
          {queuePosition
            ? `Your calculation is queued. You are currently at position ${queuePosition} in the queue.`
            : 'Your calculation is being processed. This may take a few moments for complex analyses.'}{' '}
          The page will automatically update when the results are ready.
        </Text>
      </Card>
    </Stack>
  );
}

function ErrorDisplay({ error, onBack }: { error: any; onBack: () => void }) {
  return (
    <Stack gap={spacing.md}>
      <Alert
        icon={<IconAlertCircle size={20} />}
        title="Calculation Failed"
        color="red"
        variant="light"
      >
        {typeof error === 'string'
          ? error
          : error?.message || 'An unexpected error occurred during calculation.'}
      </Alert>

      <Button variant="default" onClick={onBack} fullWidth>
        Go Back
      </Button>
    </Stack>
  );
}

function CompletedDisplay() {
  return (
    <Stack gap={spacing.md} align="center">
      <Progress value={100} size="xl" radius="md" color="green" />
      <Group gap={spacing.xs}>
        <IconCheck size={20} color="var(--mantine-color-green-6)" />
        <Text size="sm" c="green.6" fw={500}>
          Calculation complete!
        </Text>
      </Group>
    </Stack>
  );
}

function ResultDisplay({ result }: { result: any }) {
  // For now, show a summary view of the results
  // This will be replaced with proper result visualization components later

  const isHouseholdResult = !result.budget;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap={spacing.sm}>
        <Text fw={600}>
          {isHouseholdResult ? 'Household Impact Results' : 'Society-Wide Impact Results'}
        </Text>

        {!isHouseholdResult && result.budget && (
          <Box>
            <Text size="sm" c="dimmed" mb={spacing.xs}>
              Budget Impact
            </Text>
            <Text size="lg" fw={600}>
              ${Math.abs(result.budget.budgetary_impact / 1000000000).toFixed(2)}B
            </Text>
            <Text size="xs" c={result.budget.budgetary_impact < 0 ? 'red' : 'green'}>
              {result.budget.budgetary_impact < 0 ? 'Cost to government' : 'Revenue to government'}
            </Text>
          </Box>
        )}

        {!isHouseholdResult && result.poverty && (
          <Box>
            <Text size="sm" c="dimmed" mb={spacing.xs}>
              Poverty Impact
            </Text>
            <Text size="md" fw={500}>
              {(result.poverty.poverty_rate_change * 100).toFixed(2)}% change in poverty rate
            </Text>
          </Box>
        )}

        {/* Debug view - temporary */}
        <ScrollArea h={200} type="auto" offsetScrollbars>
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
              overflow: 'auto',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        </ScrollArea>
      </Stack>
    </Card>
  );
}
