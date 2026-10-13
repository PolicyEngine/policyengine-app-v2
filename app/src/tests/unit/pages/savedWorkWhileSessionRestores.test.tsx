import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import ReportOutputPage from '@/pages/ReportOutput.page';
import ReportsPage from '@/pages/Reports.page';
import { AuthTestProvider, makeAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

/**
 * Pages that show saved work, rendered with the real association hooks
 * while the sign-in session is still being restored: they must show a
 * loading state, never "not found" or an empty list.
 */

vi.mock('@/pages/report-output/useHouseholdCalculations', () => ({
  useHouseholdCalculations: vi.fn(),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: vi.fn(() => ({
    status: 'initializing',
    isInitializing: true,
    isPending: false,
    isComplete: false,
    isError: false,
    result: null,
    error: null,
  })),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: vi.fn(),
}));

const LOCAL_REPORT_ID = 'sur-local1';

function renderWithSession(ui: React.ReactNode, auth: AuthContextValue) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthTestProvider value={auth}>{ui}</AuthTestProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('saved work while the sign-in session is being restored', () => {
  test('given a report link then the report output page shows loading, not "Report not found"', () => {
    // When
    renderWithSession(
      <ReportOutputPage reportId={LOCAL_REPORT_ID} subpage="overview" />,
      makeAuthValue({ status: 'loading' })
    );

    // Then
    expect(screen.getByText('Loading report...')).toBeInTheDocument();
    expect(screen.queryByText(/Report not found/)).not.toBeInTheDocument();
  });

  test('given the reports list then it shows loading, not an empty list', () => {
    // When
    renderWithSession(<ReportsPage />, makeAuthValue({ status: 'loading' }));

    // Then
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('No report found.')).not.toBeInTheDocument();
  });

  test('given the session settled signed out with nothing saved then the list is empty', async () => {
    // When
    renderWithSession(<ReportsPage />, makeAuthValue({ status: 'anonymous' }));

    // Then
    expect(await screen.findByText('No report found.')).toBeInTheDocument();
  });
});
