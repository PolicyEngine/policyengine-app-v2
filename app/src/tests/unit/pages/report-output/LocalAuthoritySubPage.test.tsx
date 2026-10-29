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
import {
  COMPLETE_RESPONSE,
  COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY,
  FAILED_RESPONSE,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
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
      // The map's one hexagon is the computed area: hovering it names it.
      await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));
      const hexagons = container.querySelectorAll('svg polygon');
      expect(hexagons).toHaveLength(1);
      await user.hover(hexagons[0]);
      expect(
        screen.getByText(new RegExp(`^${BREAKDOWN_LOCAL_AUTHORITY_NAME}:`))
      ).toBeInTheDocument();
    });

    test('given the areas computed for a UK-wide report then the charts say how many local authorities were not published', async () => {
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
        await screen.findByText(/^2 of 3 local authorities are not published\./)
      ).toBeInTheDocument();
    });

    test('given a computed local authority the region list does not name then the charts say local authorities may be withheld, with no count', async () => {
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
        await screen.findByText(
          /^Local authorities whose estimates fail the survey data’s disclosure rules are not published\./
        )
      ).toBeInTheDocument();
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
