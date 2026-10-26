import { QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ReformsPage from '@/pages/flagship/Reforms.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { STANDARD_DEDUCTION_SINGLE } from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import type { Reform } from '@/types/ingredients/Reform';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockFindMine = vi.fn();
vi.mock('@/api/reformStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/reformStore')>()),
  getReformStore: () => ({ findMine: mockFindMine }),
}));

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: vi.fn(), isRunning: false, error: null }),
}));

vi.mock('@/api/flagshipReportStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/flagshipReportStore')>()),
  getFlagshipReportStore: () => ({ findMine: async () => [] }),
}));

vi.mock('@/api/billFeed', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/billFeed')>()),
  fetchTrackerBills: async () => [],
}));

const PARAMETERS_PATH = '/v2/model-catalog/parameters';

const DEDUCTION_REFORM: Reform = {
  id: 'rf-1',
  countryId: 'us',
  label: 'A larger standard deduction',
  parameters: [
    {
      name: STANDARD_DEDUCTION_SINGLE,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 20000 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'manual' },
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('ReformsPage with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;
  /** Answers the held parameters request. */
  let releaseParameters: () => void;

  beforeEach(async () => {
    const held = new Promise<void>((resolve) => {
      releaseParameters = resolve;
    });
    fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: async (url) => {
        await held;
        return jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        });
      },
    });
    await seedV2ModelCatalog();
    mockFindMine.mockResolvedValue([DEDUCTION_REFORM]);
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given a saved reform opens then its parameters load in one request, rows waiting for them', async () => {
    // Given
    const user = userEvent.setup();
    renderWithCountry(
      <QueryClientProvider client={testQueryClient()}>
        <ReformsPage />
      </QueryClientProvider>,
      'us',
      '/us/reforms?filter=yours'
    );

    // When
    await user.click(await screen.findByText('A larger standard deduction'));

    // Then
    const table = screen.getByRole('table', { name: 'Parameters' });
    expect(within(table).getByRole('status', { name: 'Loading parameters' })).toBeInTheDocument();
    releaseParameters();
    await waitFor(() =>
      expect(
        within(table).queryByRole('status', { name: 'Loading parameters' })
      ).not.toBeInTheDocument()
    );
    const requests = requestsTo(fetchStub, PARAMETERS_PATH);
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.getAll('name')).toEqual([STANDARD_DEDUCTION_SINGLE]);
    // Current law, from the catalog: $15,000 since 2025.
    expect(within(table).getByText('$15,000')).toBeInTheDocument();
  });
});
