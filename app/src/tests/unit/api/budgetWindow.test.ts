import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchBudgetWindow } from '@/api/budgetWindow';

const COMPUTING = {
  status: 'computing',
  message: 'Scoring 2026, 2027 (0 of 10 complete)...',
  result: null,
  progress: 0,
};

describe('fetchBudgetWindow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a window then it asks the budget-window route for that region, start and length', async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify(COMPUTING)));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchBudgetWindow('us', '123', '2', {
      region: 'state/de',
      startYear: 2026,
      windowSize: 10,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.policyengine.org/us/economy/123/over/2/budget-window?region=state%2Fde&start_year=2026&window_size=10'
    );
    expect(response).toEqual(COMPUTING);
  });

  test('given a refused request then the API message is the error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'window_size must be at most 75' }), {
            status: 400,
          })
      )
    );

    await expect(
      fetchBudgetWindow('us', '123', '2', { region: 'us', startYear: 2026, windowSize: 99 })
    ).rejects.toThrow('window_size must be at most 75');
  });
});
