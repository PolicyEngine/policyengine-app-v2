import { render, screen, userEvent, waitFor } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { ReportErrorContext, ReportErrorFallback } from '@/components/report/ReportErrorFallback';

// Mock Plotly to avoid errors
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

const createTestError = (message: string): Error => {
  const error = new Error(message);
  error.stack = `Error: ${message}\n    at TestComponent (test.tsx:10:5)`;
  return error;
};

const createTestErrorInfo = () => ({
  componentStack: '\n    at TestComponent\n    at ErrorBoundary\n    at App',
});

const createTestContext = (): ReportErrorContext => ({
  userReport: {
    id: 'sur-123',
    userId: 'user-secret-id',
    reportId: '456',
    countryId: 'us',
    label: 'Test Report',
    createdAt: '2025-01-01T00:00:00Z',
  },
  userSimulations: [
    {
      id: 'sus-789',
      userId: 'user-secret-id',
      simulationId: '101',
      countryId: 'us',
      label: 'Test Simulation',
    },
  ],
  userPolicies: [
    {
      id: 'sup-111',
      userId: 'user-secret-id',
      policyId: '222',
      countryId: 'us',
      label: 'Test Policy',
    },
  ],
  userHouseholds: null,
  userGeographies: null,
  report: {
    id: '456',
    countryId: 'us',
    year: '2025',
    apiVersion: '0.104.0',
    simulationIds: ['101'],
    status: 'error',
  },
  simulations: [
    {
      id: '101',
      populationType: 'geography',
      populationId: 'us',
      policyId: '222',
      countryId: 'us',
      label: 'Test Simulation',
      isCreated: true,
    },
  ],
  policies: null,
  households: null,
  geographies: null,
});

describe('ReportErrorFallback', () => {
  test('given error then displays heading with details collapsed by default', () => {
    // Given
    const error = createTestError('Something went wrong in the component');

    // When
    render(<ReportErrorFallback error={error} errorInfo={null} />);

    // Then - heading is visible and show button is present (meaning details are collapsed)
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show technical details/i })).toBeInTheDocument();
  });

  test('given error then technical details are initially collapsed', () => {
    // Given
    const error = createTestError('Test error');

    // When
    render(<ReportErrorFallback error={error} errorInfo={createTestErrorInfo()} />);

    // Then
    // The button should say "Show" (not "Hide")
    expect(screen.getByRole('button', { name: /show technical details/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /hide technical details/i })
    ).not.toBeInTheDocument();
  });

  test('given user clicks show details button then technical details are displayed', async () => {
    // Given
    const user = userEvent.setup();
    const error = createTestError('Test error');

    render(<ReportErrorFallback error={error} errorInfo={createTestErrorInfo()} />);

    // When
    await user.click(screen.getByRole('button', { name: /show technical details/i }));

    // Then
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Stack trace')).toBeInTheDocument();
    expect(screen.getByText('Component stack')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide technical details/i })).toBeInTheDocument();
  });

  test('given context with userId then userId is scrubbed in display', async () => {
    // Given
    const user = userEvent.setup();
    const error = createTestError('Test error');
    const context = createTestContext();

    render(<ReportErrorFallback error={error} errorInfo={null} context={context} />);

    // When
    await user.click(screen.getByRole('button', { name: /show technical details/i }));

    // Then
    // The original userId should not appear
    expect(screen.queryByText(/user-secret-id/)).not.toBeInTheDocument();
    // The scrubbed placeholder should appear (multiple times for multiple associations)
    expect(screen.getAllByText(/\[scrubbed\]/).length).toBeGreaterThan(0);
  });

  test('given context with report data then report context is displayed', async () => {
    // Given
    const user = userEvent.setup();
    const error = createTestError('Test error');
    const context = createTestContext();

    render(<ReportErrorFallback error={error} errorInfo={null} context={context} />);

    // When
    await user.click(screen.getByRole('button', { name: /show technical details/i }));

    // Then
    expect(screen.getByText('User report association')).toBeInTheDocument();
    expect(screen.getByText(/User simulation associations/)).toBeInTheDocument();
    expect(screen.getByText(/User policy associations/)).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText(/Simulations/)).toBeInTheDocument();
  });

  test('given no context then context sections are not displayed', async () => {
    // Given
    const user = userEvent.setup();
    const error = createTestError('Test error');

    render(<ReportErrorFallback error={error} errorInfo={createTestErrorInfo()} />);

    // When
    await user.click(screen.getByRole('button', { name: /show technical details/i }));

    // Then
    expect(screen.queryByText('User report association')).not.toBeInTheDocument();
    expect(screen.queryByText(/Report context/)).not.toBeInTheDocument();
  });

  test('given user toggles details twice then details are hidden again', async () => {
    // Given
    const user = userEvent.setup();
    const error = createTestError('Test error');

    render(<ReportErrorFallback error={error} errorInfo={createTestErrorInfo()} />);

    // When - show details
    await user.click(screen.getByRole('button', { name: /show technical details/i }));
    expect(screen.getByText('Stack trace')).toBeInTheDocument();

    // When - hide details
    await user.click(screen.getByRole('button', { name: /hide technical details/i }));

    // Then - the button text should change back to "Show"
    // Note: Mantine Collapse uses CSS transitions, so we check button state instead
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show technical details/i })).toBeInTheDocument();
    });
  });
});
