import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { billRegion, useBillEconomy } from '@/hooks/useBillEconomy';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const { mockCreatePolicy, mockFetchSocietyWide } = vi.hoisted(() => ({
  mockCreatePolicy: vi.fn(),
  mockFetchSocietyWide: vi.fn(),
}));

vi.mock('@/api/policy', () => ({ createPolicy: mockCreatePolicy }));
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: mockFetchSocietyWide,
}));
vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: () => 'us' }));

const BILL = {
  id: 'ut-sb60',
  title: 'Utah SB60',
  state: 'UT',
  provisions: [{ path: 'gov.states.ut.tax.income.rate', value: 0.0445 }],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const store = configureStore({
    reducer: { metadata: () => ({ currentLawId: 2 }) },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}

describe('useBillEconomy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePolicy.mockResolvedValue({ result: { policy_id: '98557' } });
  });

  test('given a state bill then its reform is scored against current law on state data', async () => {
    const output = createMockSocietyWideOutput();
    mockFetchSocietyWide.mockResolvedValue({ status: 'ok', result: output });

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(mockCreatePolicy).toHaveBeenCalledWith('us', {
      data: { 'gov.states.ut.tax.income.rate': { [`${CURRENT_YEAR}-01-01.2100-12-31`]: 0.0445 } },
      label: 'Utah SB60',
    });
    expect(mockFetchSocietyWide).toHaveBeenCalledWith('us', '98557', '2', {
      region: 'state/ut',
      time_period: CURRENT_YEAR,
    });
    expect(result.current.output).toBe(output);
    expect(result.current.reformPolicyId).toBe('98557');
    expect(result.current.baselinePolicyId).toBe('2');
  });

  test('given the run is queued then it stays pending with the queue message', async () => {
    mockFetchSocietyWide.mockResolvedValue({
      status: 'computing',
      queue_position: 3,
      result: null,
    });

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });

    await waitFor(() => expect(mockFetchSocietyWide).toHaveBeenCalled());
    await waitFor(() => expect(result.current.message).toMatch(/3/));
    expect(result.current.status).toBe('pending');
    expect(result.current.output).toBeNull();
  });

  test('given the run fails then the error is reported', async () => {
    mockFetchSocietyWide.mockResolvedValue({ status: 'error', result: null, error: 'Worker lost' });

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.message).toBe('Worker lost');
  });

  test('given the request fails then only the API message is reported', async () => {
    mockFetchSocietyWide.mockRejectedValue(
      new Error(
        'Society-wide calculation failed (502): {"status": "error", "message": "Simulation failed", "result": null}'
      )
    );

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.message).toBe('Simulation failed');
  });

  test('given the policy cannot be created then the error is reported', async () => {
    mockCreatePolicy.mockRejectedValue(new Error('Failed to create policy'));

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(mockFetchSocietyWide).not.toHaveBeenCalled();
  });

  test('given the run failed then retrying runs it again', async () => {
    const output = createMockSocietyWideOutput();
    mockFetchSocietyWide
      .mockResolvedValueOnce({ status: 'error', result: null, error: 'Worker lost' })
      .mockResolvedValueOnce({ status: 'ok', result: output });

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(result.current.output).toBe(output);
  });

  test('given the policy could not be created then retrying creates it again', async () => {
    mockCreatePolicy
      .mockRejectedValueOnce(new Error('Failed to create policy'))
      .mockResolvedValueOnce({ result: { policy_id: '98557' } });
    mockFetchSocietyWide.mockResolvedValue({ status: 'ok', result: createMockSocietyWideOutput() });

    const { result } = renderHook(() => useBillEconomy(BILL), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(mockCreatePolicy).toHaveBeenCalledTimes(2);
  });

  test('given the run is disabled then no policy is created and nothing runs', async () => {
    const { result } = renderHook(() => useBillEconomy(BILL, { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockCreatePolicy).not.toHaveBeenCalled();
    expect(mockFetchSocietyWide).not.toHaveBeenCalled();
    expect(result.current.output).toBeNull();
  });
});

describe('billRegion', () => {
  test('given a state or federal bill then returns the region it is scored on', () => {
    expect(billRegion({ state: 'CA' }, 'us')).toBe('state/ca');
    expect(billRegion({}, 'us')).toBe('us');
  });
});
