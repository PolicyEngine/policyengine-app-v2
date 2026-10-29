import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  CURRENT_LAW_POLICY_METADATA,
  REFORM_POLICY_METADATA,
} from '@/tests/fixtures/api/publicApi/v2ReportPolicyMocks';
import {
  BASELINE_SIMULATION_ID,
  EXISTING_REPORT_ID,
  EXISTING_REPORT_METADATA,
  nationwideSimulationMetadata,
  REFORM_SIMULATION_ID,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

/**
 * The Report page with the real report hooks: a report opened fresh reads
 * its policies as stored, then loads the parameters they name.
 */

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const POLICIES = new Map(
  [REFORM_POLICY_METADATA, CURRENT_LAW_POLICY_METADATA].map((policy) => [policy.id, policy])
);

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async () => EXISTING_REPORT_METADATA,
}));
vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: async (_country: string, simulationId: string) =>
    simulationId === BASELINE_SIMULATION_ID
      ? nationwideSimulationMetadata(BASELINE_SIMULATION_ID, CURRENT_LAW_POLICY_METADATA.id)
      : nationwideSimulationMetadata(REFORM_SIMULATION_ID, REFORM_POLICY_METADATA.id),
}));
vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: async (_country: string, policyId: string) => POLICIES.get(policyId),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => ({
    status: 'complete',
    isComplete: true,
    isError: false,
    result: createMockSocietyWideOutput(),
  }),
}));
vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: () => undefined,
}));
vi.mock('@/hooks/useReportValidationSnapshot', () => ({
  useReportValidationSnapshot: () => undefined,
}));
vi.mock('@/components/flagship/CalibrationMatches', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/CalibrationMatches')>()),
  useCalibrationMatches: () => null,
}));
vi.mock('@/components/flagship/ValidationPanel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ValidationPanel')>()),
  useModelTrackRecord: () => null,
}));

const PARAMETERS_PATH = '/v2/model-catalog/parameters';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={EXISTING_REPORT_ID} />
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage on the v2 routes, with the real report hooks', () => {
  beforeEach(() => {
    store.dispatch(clearMetadata());
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test("given the reform policy's parameters fail to load then the page says so and try again loads them", async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    const fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
          : jsonResponse({
              status: 'ok',
              message: null,
              result: catalogParametersResult(url.searchParams.getAll('name')),
            });
      },
    });
    await seedV2ModelCatalog();
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the reform policy');

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() =>
      expect(screen.queryByText('Could not load the reform policy')).not.toBeInTheDocument()
    );
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
