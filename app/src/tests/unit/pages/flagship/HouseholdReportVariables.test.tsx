import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdBuilderPanel from '@/components/flagship/household/HouseholdBuilderPanel';
import HouseholdReportPage from '@/pages/flagship/HouseholdReport.page';
import metadataReducer from '@/reducers/metadataReducer';
import { FAMILY_HOUSEHOLD } from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  BASELINE_POLICY_ID,
  HOUSEHOLD_YEAR,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import { READY_TO_RUN } from '@/tests/fixtures/pages/flagship/householdReportPageMocks';

/**
 * v3's household report and its household builder read the model's
 * variables. On the v2 routes these load in the background, so both wait
 * for them, and a failed load says so and asks again, as the other v3
 * views that read variables do (V3VariablesGate). The variables' status is
 * set by each test here; on the v1 routes it is always "ready".
 */

const mockVariables = vi.fn();
const mockRetryVariables = vi.fn();
vi.mock('@/hooks/useV3Variables', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useV3Variables')>()),
  useV3Variables: () => mockVariables(),
}));
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => ({ account: null, scope: 'browser' }),
}));
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: () => <div aria-label="Household builder" />,
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => READY_TO_RUN },
}));

function withStore(children: React.ReactNode) {
  const store = configureStore({ reducer: { metadata: metadataReducer } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}

function renderReport() {
  render(
    withStore(
      <HouseholdReportPage
        countryId="us"
        year={HOUSEHOLD_YEAR}
        household={FAMILY_HOUSEHOLD}
        baselinePolicyId={BASELINE_POLICY_ID}
      />
    )
  );
}

function renderBuilderPanel() {
  render(
    withStore(
      <HouseholdBuilderPanel
        household={FAMILY_HOUSEHOLD}
        countryId="us"
        year={HOUSEHOLD_YEAR}
        onChange={() => {}}
      />
    )
  );
}

describe('the household report and builder while the model variables load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVariables.mockReturnValue({ status: 'ready', message: null, retry: mockRetryVariables });
  });

  test('given the variables still loading then the household report waits behind a placeholder', () => {
    // Given
    mockVariables.mockReturnValue({ status: 'loading', message: null, retry: mockRetryVariables });

    // When
    renderReport();

    // Then
    expect(
      screen.getByRole('status', { name: 'Loading the household report' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Calculate' })).not.toBeInTheDocument();
  });

  test('given the variables failed to load then the household report says so and asks for them again', async () => {
    // Given
    const user = userEvent.setup();
    mockVariables.mockReturnValue({
      status: 'error',
      message: 'The catalog version is not published.',
      retry: mockRetryVariables,
    });
    renderReport();

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByText("Could not load the model's variables")).toBeInTheDocument();
    expect(mockRetryVariables).toHaveBeenCalledTimes(1);
  });

  test('given the variables loaded then the household report shows its household', () => {
    // When
    renderReport();

    // Then
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument();
  });

  test('given the variables still loading then the household builder waits behind a placeholder', () => {
    // Given
    mockVariables.mockReturnValue({ status: 'loading', message: null, retry: mockRetryVariables });

    // When
    renderBuilderPanel();

    // Then
    expect(
      screen.getByRole('status', { name: 'Loading the household builder' })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Household builder')).not.toBeInTheDocument();
  });
});
