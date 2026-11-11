import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useReportYearEconomy } from '@/hooks/useReportYearEconomy';

const execute = vi.fn();
vi.mock('@/libs/calculations/economy/SocietyWideCalcStrategy', () => ({
  SocietyWideCalcStrategy: class {
    execute = (...args: unknown[]) => execute(...args);
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const args = {
  countryId: 'us',
  reformPolicyId: '98746',
  baselinePolicyId: '2',
  region: 'state/ny',
  year: '2027',
};

describe('useReportYearEconomy', () => {
  beforeEach(() => execute.mockReset());

  test('given no year picked then nothing runs', () => {
    const { result } = renderHook(() => useReportYearEconomy({ ...args, enabled: false }), {
      wrapper,
    });

    expect(result.current.status).toBe('idle');
    expect(execute).not.toHaveBeenCalled();
  });

  test('given a year picked then that year is scored for the same reform, comparison and population', async () => {
    execute.mockResolvedValue({ status: 'complete', result: { budget: { budgetary_impact: -5 } } });

    const { result } = renderHook(() => useReportYearEconomy({ ...args, enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(execute.mock.calls[0][0]).toMatchObject({
      year: '2027',
      region: 'state/ny',
      policyIds: { reform: '98746', baseline: '2' },
    });
    expect(result.current.output).toEqual({ budget: { budgetary_impact: -5 } });
  });
});
