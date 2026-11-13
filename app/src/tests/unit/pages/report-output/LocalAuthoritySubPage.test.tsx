import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import { LocalAuthoritySubPage } from '@/pages/report-output/LocalAuthoritySubPage';
import {
  BREAKDOWN_LOCAL_AUTHORITY_NAME,
  BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY,
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  COMPUTE_BUTTON_LABEL,
  ERROR_MESSAGE,
} from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  HEX_MAP_TAB,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import { EXPECTED_LOCAL_AUTHORITY_COUNT } from '@/tests/fixtures/data/uk_geography/ukGeographyReference';
import {
  COMPLETE_RESPONSE,
  COMPLETE_RESPONSE_WITH_ARDS_AND_NORTH_DOWN,
  COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY,
  COMPLETE_RESPONSE_WITH_WITHHELD_LISTS,
  FAILED_RESPONSE,
  UK_LISTED_WITHHELD_LOCAL_AUTHORITY_CODES,
  WITHHELD_LOCAL_AUTHORITIES_WITH_ARDS_AND_NORTH_DOWN,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import {
  hatchedAreaCodes,
  noDataHexagons,
} from '@/tests/fixtures/pages/report-output/ukHexMapPlacementMocks';
import {
  V2_UK_LOCAL_AREA_REQUEST_PROPS,
  withNullAreaImpacts,
} from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchLocalAreaBreakdown: vi.fn(),
}));

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, 'uk');
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockUKBoundaryFetch());
});

describe('LocalAuthoritySubPage', () => {
  test('given UK report with local authority data then renders tabs', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(screen.getByText('Absolute change')).toBeInTheDocument();
    expect(screen.getByText('Relative change')).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given UK report with local authority data then renders absolute change by default', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by local authority')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given report without local_authority_impact field then shows not available message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(
      screen.getByText('Local authority analysis not available for this region')
    ).toBeInTheDocument();
  });

  test('given UK report then component renders without error', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  describe('given a report whose result has no local authority data', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test.each([
      ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
      ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ])(
      'given %s local authority data then it offers to compute instead of saying it is not available',
      (_label, output) => {
        // When
        renderWithQueryClient(
          <LocalAuthoritySubPage output={output} {...V2_UK_LOCAL_AREA_REQUEST_PROPS} />
        );

        // Then
        expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
        expect(
          screen.queryByText('Local authority analysis not available for this region')
        ).not.toBeInTheDocument();
        expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
      }
    );

    test('given the areas computed then they reach the local authority charts', async () => {
      // Given
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
      const { container } = renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

      // Then
      expect(
        await screen.findByText('Absolute household income change by local authority')
      ).toBeInTheDocument();
      // The map's one hexagon with a value is the computed area: hovering
      // it names it. The UK's other 360 local authorities are drawn as withheld.
      await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));
      const hexagons = container.querySelectorAll('svg polygon:not([data-missing-area-id])');
      expect(hexagons).toHaveLength(1);
      expect(container.querySelectorAll('[data-missing-area-id]').length).toBe(
        EXPECTED_LOCAL_AUTHORITY_COUNT - 1
      );
      await user.hover(hexagons[0]);
      expect(
        screen.getByText(new RegExp(`^${BREAKDOWN_LOCAL_AUTHORITY_NAME}:`))
      ).toBeInTheDocument();
    });

    test('given the areas computed for a UK-wide report then the charts say how many local authorities were not reported', async () => {
      // Given
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
      renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

      // Then
      expect(
        await screen.findByText(/^360 of 361 local authorities are not reported\./)
      ).toBeInTheDocument();
    });

    test('given a computed local authority under a name the region list lacks then the charts count it by its code', async () => {
      // Given
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(
        COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY
      );
      renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

      // Then
      expect(
        await screen.findByText(/^359 of 361 local authorities are not reported\./)
      ).toBeInTheDocument();
    });

    test('given Ards and North Down computed for a UK-wide report then the note counts the local authorities the hex map draws as withheld', async () => {
      // Given: Ards and North Down, which a region list before PolicyEngine/policyengine-api#4024 lacks
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE_WITH_ARDS_AND_NORTH_DOWN);
      const { container } = renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
      await screen.findByText('Absolute household income change by local authority');

      // When
      await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));

      // Then
      const hatched = container.querySelectorAll('[data-missing-area-id]').length;
      expect(hatched).toBe(WITHHELD_LOCAL_AUTHORITIES_WITH_ARDS_AND_NORTH_DOWN);
      expect(
        screen.getByText(new RegExp(`^${hatched} of 361 local authorities are not reported\\.`))
      ).toBeInTheDocument();
    });

    test('given the areas computed with a list of withheld local authorities then the note counts the list and the hex map hatches only those', async () => {
      // Given
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE_WITH_WITHHELD_LISTS);
      const { container } = renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

      // When
      expect(
        await screen.findByText(/^1 of 361 local authorities is not reported\./)
      ).toBeInTheDocument();
      await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));

      // Then: Swansea hatched, and the UK's other 359 absent local authorities without data
      expect(hatchedAreaCodes(container)).toEqual(UK_LISTED_WITHHELD_LOCAL_AUTHORITY_CODES);
      expect(noDataHexagons(container)).toHaveLength(
        EXPECTED_LOCAL_AUTHORITY_COUNT - 1 - UK_LISTED_WITHHELD_LOCAL_AUTHORITY_CODES.length
      );
    });

    test('given a breakdown release result with constituencies only then the tab offers to compute, as the section does', () => {
      // When
      renderWithQueryClient(
        <LocalAuthoritySubPage
          output={BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
    });

    test('given an older stored result without local authorities then the tab says it is not available and offers no compute', () => {
      // When
      renderWithQueryClient(
        <LocalAuthoritySubPage
          output={OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );

      // Then
      expect(
        screen.getByText('Local authority analysis not available for this region')
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
      expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
    });

    test('given the breakdown failed in the tab then Retry sends the request again and the charts show', async () => {
      // Given
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown
        .mockResolvedValueOnce(FAILED_RESPONSE)
        .mockResolvedValueOnce(COMPLETE_RESPONSE);
      renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
      expect(await screen.findByText(ERROR_MESSAGE)).toBeInTheDocument();

      // When
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      // Then
      expect(
        await screen.findByText('Absolute household income change by local authority')
      ).toBeInTheDocument();
      expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(2);
    });
  });
});
