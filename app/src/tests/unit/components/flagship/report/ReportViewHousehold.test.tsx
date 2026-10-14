import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportView from '@/components/flagship/report/ReportView';
import {
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  CUSTOM_BASELINE_POLICY_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const mockCreateHousehold = vi.fn();
const mockFetchHouseholdCalculation = vi.fn();

vi.mock('@/api/household', () => ({
  createHousehold: (...args: unknown[]) => mockCreateHousehold(...args),
}));
vi.mock('@/api/householdCalculation', () => ({
  fetchHouseholdCalculation: (...args: unknown[]) => mockFetchHouseholdCalculation(...args),
}));
vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
}));

function renderReport(policies: { baselinePolicyId?: string; reformPolicyId?: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportView
        title="Bigger CTC"
        sourceNote="Hand-built"
        provisions={[]}
        year={HOUSEHOLD_YEAR}
        region="state/ny"
        {...policies}
        output={null}
        pending={<p>Waiting for the full results</p>}
        calibration={null}
        trackRecord={null}
      />
    </QueryClientProvider>
  );
}

describe('ReportView household', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateHousehold.mockResolvedValue({ result: { household_id: CREATED_HOUSEHOLD_ID } });
    mockFetchHouseholdCalculation.mockImplementation(
      async (_country: string, _household: string, policyId: string) =>
        policyId === CUSTOM_BASELINE_POLICY_ID ? BASELINE_RESULT : REFORM_RESULT
    );
  });

  test("given a custom baseline then the household runs against the report's baseline", async () => {
    const user = userEvent.setup();
    renderReport({
      baselinePolicyId: CUSTOM_BASELINE_POLICY_ID,
      reformPolicyId: REFORM_POLICY_ID,
    });

    await user.click(screen.getByRole('tab', { name: 'Household' }));
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveTextContent('New York');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    await waitFor(() => expect(mockFetchHouseholdCalculation).toHaveBeenCalledTimes(2));
    expect(mockFetchHouseholdCalculation.mock.calls.map(([, , policyId]) => policyId)).toEqual([
      CUSTOM_BASELINE_POLICY_ID,
      REFORM_POLICY_ID,
    ]);
    expect(await screen.findByRole('region', { name: 'Household impact' })).toHaveTextContent(
      `New York · ${HOUSEHOLD_YEAR}`
    );
  });

  test('given no policies yet then the household tab waits with the report', async () => {
    const user = userEvent.setup();
    renderReport({});

    await user.click(screen.getByRole('tab', { name: 'Household' }));

    expect(screen.getByText('Waiting for the full results')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Calculate' })).not.toBeInTheDocument();
  });
});
