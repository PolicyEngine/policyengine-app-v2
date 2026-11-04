import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useRegions } from '@/hooks/useRegions';
import { RelativeChangeByDistrict } from '@/pages/report-output/congressional-district/RelativeChangeByDistrict';
import { COMPUTE_DISTRICTS_LABEL } from '@/tests/fixtures/components/flagship/report/stateDistrictComputePanelMocks';
import {
  economyWhere,
  fakeStateDistrictApi,
  STATE_COMPUTING,
  stateOk,
  US_STATE_REGIONS,
  UTAH,
  type FakeStateApi,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';
import {
  MOCK_CONGRESSIONAL_DISTRICT_REGIONS,
  MOCK_US_REPORT_OUTPUT,
  MOCK_US_REPORT_OUTPUT_NO_DISTRICT,
} from '@/tests/fixtures/pages/congressional-district/congressionalDistrictComponentMocks';
import {
  californiaDistrictContext,
  nationwideDistrictContext,
  NO_DISTRICT_DATA_MESSAGE,
} from '@/tests/fixtures/pages/congressional-district/stateRunsPageMocks';

const { mockUseCongressionalDistrictData } = vi.hoisted(() => ({
  mockUseCongressionalDistrictData: vi.fn(),
}));

// Mock react-redux to provide region data from metadata
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: vi.fn(() => MOCK_CONGRESSIONAL_DISTRICT_REGIONS),
  };
});

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

const TITLE = 'Relative household income change by congressional district';

let api: FakeStateApi;

function renderPage(output: Parameters<typeof RelativeChangeByDistrict>[0]['output']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RelativeChangeByDistrict output={output} />
    </QueryClientProvider>
  );
}

function serve(options: Parameters<typeof fakeStateDistrictApi>[0] = {}) {
  api = fakeStateDistrictApi(options);
  vi.stubGlobal('fetch', api.fetch);
}

describe('RelativeChangeByDistrict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCongressionalDistrictData.mockReturnValue(californiaDistrictContext());
    vi.mocked(useRegions).mockReturnValue({
      data: US_STATE_REGIONS,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRegions>);
    serve();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a state report with district data then renders its map', () => {
    // When
    renderPage(MOCK_US_REPORT_OUTPUT);

    // Then
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(api.simulationRequests()).toHaveLength(0);
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given a state report with no district data then shows unavailable state', () => {
    // When
    renderPage(MOCK_US_REPORT_OUTPUT_NO_DISTRICT);

    // Then
    expect(screen.getByText(NO_DISTRICT_DATA_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  test('given a nationwide report then it offers Compute in place of the unavailable text, and ignores the result’s districts', async () => {
    // Given
    mockUseCongressionalDistrictData.mockReturnValue(nationwideDistrictContext());

    // When
    renderPage(MOCK_US_REPORT_OUTPUT);

    // Then
    expect(
      await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL })
    ).toBeInTheDocument();
    expect(screen.queryByText(NO_DISTRICT_DATA_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });

  test('given Compute then the finished states are mapped, with how many are in', async () => {
    // Given
    const user = userEvent.setup();
    mockUseCongressionalDistrictData.mockReturnValue(nationwideDistrictContext());
    serve({ economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING) });
    renderPage(MOCK_US_REPORT_OUTPUT);

    // When
    await user.click(await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL }));

    // Then
    expect(await screen.findByText(TITLE)).toBeInTheDocument();
    expect(screen.getByText('1 of 51 states')).toBeInTheDocument();
  });
});
