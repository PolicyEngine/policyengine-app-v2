import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import {
  BREAKDOWN_CONSTITUENCY_NAME,
  BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY,
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  UNVERSIONED_OUTPUT_WITHOUT_AREAS,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { COMPUTE_BUTTON_LABEL } from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  HEX_MAP_TAB,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import { COMPLETE_RESPONSE } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { MOCK_UK_REPORT_OUTPUT } from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';
import {
  V2_UK_LOCAL_AREA_REQUEST_PROPS,
  withNullAreaImpacts,
} from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchLocalAreaBreakdown: vi.fn(),
}));

vi.mock('@/hooks/useRegions', async () => {
  const { UK_METADATA_REGIONS } =
    await import('@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks');
  return { useRegions: () => ({ data: UK_METADATA_REGIONS }) };
});

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);
const NOT_AVAILABLE = 'Constituency analysis not available for this region';

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, 'uk');
}

describe('ConstituencySubPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockUKBoundaryFetch());
    vi.clearAllMocks();
  });

  test('given saved constituency data then it shows the absolute change map', async () => {
    // When
    render(<ConstituencySubPage output={MOCK_UK_REPORT_OUTPUT} />, 'uk');

    // Then
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test.each([
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
  ])(
    'given %s constituency data then it offers to compute instead of saying it is not available',
    (_label, output) => {
      // When
      renderWithQueryClient(
        <ConstituencySubPage output={output} {...V2_UK_LOCAL_AREA_REQUEST_PROPS} />
      );

      // Then
      expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
      expect(screen.queryByText(NOT_AVAILABLE)).not.toBeInTheDocument();
      expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
    }
  );

  test('given the areas computed then they reach the constituency charts', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const { container } = renderWithQueryClient(
      <ConstituencySubPage
        output={NATIONAL_OUTPUT_WITHOUT_AREAS}
        {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
      />
    );

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(
      await screen.findByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
    // The map's one hexagon is the computed area: hovering it names it.
    await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));
    const hexagons = container.querySelectorAll('svg polygon');
    expect(hexagons).toHaveLength(1);
    await user.hover(hexagons[0]);
    expect(screen.getByText(new RegExp(`^${BREAKDOWN_CONSTITUENCY_NAME}:`))).toBeInTheDocument();
  });

  test('given no constituency data and no report to compute it for then it is not available', () => {
    // When
    render(<ConstituencySubPage output={NATIONAL_OUTPUT_WITHOUT_AREAS} />, 'uk');

    // Then
    expect(screen.getByText(NOT_AVAILABLE)).toBeInTheDocument();
  });

  test('given the areas computed for a UK-wide report then the charts say how many constituencies were not reported', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    renderWithQueryClient(
      <ConstituencySubPage
        output={NATIONAL_OUTPUT_WITHOUT_AREAS}
        {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
      />
    );

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(
      await screen.findByText(/^2 of 3 constituencies are not reported\./)
    ).toBeInTheDocument();
    expect(screen.getByText(/^1 constituency is approximate:/)).toBeInTheDocument();
  });

  test('given a breakdown release result with constituencies only then the tab shows them, as the section does', async () => {
    // When
    renderWithQueryClient(
      <ConstituencySubPage
        output={BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY}
        {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
      />
    );

    // Then
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given a stored result with no version and no area data then the tab says it is not available and offers no compute', () => {
    // When
    renderWithQueryClient(
      <ConstituencySubPage
        output={UNVERSIONED_OUTPUT_WITHOUT_AREAS}
        {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
      />
    );

    // Then
    expect(screen.getByText(NOT_AVAILABLE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });
});
