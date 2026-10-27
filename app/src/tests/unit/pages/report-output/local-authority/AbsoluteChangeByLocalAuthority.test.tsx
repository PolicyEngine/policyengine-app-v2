import { cleanup, render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { AbsoluteChangeByLocalAuthority } from '@/pages/report-output/local-authority/AbsoluteChangeByLocalAuthority';
import {
  UK_LOCAL_AREAS_OUTPUT,
  WALES_REGION,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  CARDIFF_CODE,
  HARTLEPOOL_CODE,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_DATA,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
  MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA,
  MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA_UNCODED,
  MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import {
  areaNames,
  hexagonArrangement,
  hexagonCentre,
  isPointyTopped,
  v2Hexagons,
  v3HexagonArrangement,
} from '@/tests/fixtures/pages/report-output/ukHexMapPlacementMocks';
import { withNullAreaImpacts } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

beforeEach(() => {
  vi.stubGlobal('fetch', mockUKBoundaryFetch());
});

describe('AbsoluteChangeByLocalAuthority', () => {
  test('given local authority data then renders component', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by local authority')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given no local authority data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_LA_DATA;

    // When
    render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });

  test('given local authority data then renders the geographic map', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given UK report output then component renders', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test.each([
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
  ])('given %s local authority impacts then shows no data message', (_label, output) => {
    // When
    render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });
});

describe('AbsoluteChangeByLocalAuthority map type', () => {
  test('given local authority data then the geographic map is the default', async () => {
    // When
    const { container } = render(<AbsoluteChangeByLocalAuthority output={UK_LOCAL_AREAS_OUTPUT} />);

    // Then
    expect(screen.getByRole('tab', { name: 'Geographic', selected: true })).toBeInTheDocument();
    expect(await screen.findByTestId(`area-${CARDIFF_CODE}`)).toBeInTheDocument();
    expect(container.querySelector('svg polygon')).not.toBeInTheDocument();
  });

  test('given Hex grid chosen then the hex map replaces the geographic map', async () => {
    // Given
    const user = userEvent.setup();
    const { container } = render(<AbsoluteChangeByLocalAuthority output={UK_LOCAL_AREAS_OUTPUT} />);
    await screen.findByTestId(`area-${CARDIFF_CODE}`);

    // When
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

    // Then
    expect(container.querySelectorAll('svg polygon')).toHaveLength(2);
    expect(screen.queryByTestId(`area-${CARDIFF_CODE}`)).not.toBeInTheDocument();
  });

  test('given a Wales report then only Welsh local authorities are drawn', async () => {
    // When
    render(<AbsoluteChangeByLocalAuthority output={UK_LOCAL_AREAS_OUTPUT} region={WALES_REGION} />);

    // Then
    expect(await screen.findByTestId(`area-${CARDIFF_CODE}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`area-${HARTLEPOOL_CODE}`)).not.toBeInTheDocument();
  });
});

describe('AbsoluteChangeByLocalAuthority hex map placement', () => {
  /** The chart's hex map of `output`, with the hex grid chosen. */
  async function renderHexMap(output: SocietyWideReportOutput) {
    const user = userEvent.setup();
    const { container } = render(<AbsoluteChangeByLocalAuthority output={output} />);
    await screen.findByRole('img', { name: MAP_LEGEND_NAME });
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));
    return container;
  }

  test('given a saved result with pre-2023 local authority codes then every authority keeps its result’s position, untiled', async () => {
    // Given: the same result without codes, which the map draws at its results' positions
    const uncoded = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA_UNCODED);
    const resultsArrangement = hexagonArrangement(v2Hexagons(uncoded));
    cleanup();

    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA);

    // Then: one grid for every authority, not layout positions mixed with the results'
    expect(hexagonArrangement(v2Hexagons(container))).toEqual(resultsArrangement);
    expect(v2Hexagons(container).some(isPointyTopped)).toBe(false);
  });

  test('given local authorities the results put in one hex then the hex map draws each in its own', async () => {
    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA);

    // Then
    const centres = v2Hexagons(container).map((hexagon) => {
      const centre = hexagonCentre(hexagon);
      return `${centre.x.toFixed(3)},${centre.y.toFixed(3)}`;
    });
    expect(new Set(centres).size).toBe(
      areaNames(MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA, 'local_authority').length
    );
  });

  test('given local authorities with codes then the hex map puts each in the hex v3’s does', async () => {
    // Given
    const v3Arrangement = await v3HexagonArrangement(
      MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA,
      'local_authority'
    );

    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA);

    // Then
    expect(hexagonArrangement(v2Hexagons(container))).toEqual(v3Arrangement);
  });

  test('given local authorities with codes then the hex map draws the tiled grid’s pointy-topped hexagons', async () => {
    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA);

    // Then
    expect(v2Hexagons(container).every(isPointyTopped)).toBe(true);
  });

  test('given local authorities without codes then the hex map keeps their results’ positions, as v3’s does', async () => {
    // Given
    const v3Arrangement = await v3HexagonArrangement(
      MOCK_UK_REPORT_OUTPUT_WITH_LA,
      'local_authority'
    );

    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_LA);

    // Then: on the square grid of flat-topped hexagons those positions were made for
    expect(hexagonArrangement(v2Hexagons(container))).toEqual(v3Arrangement);
    expect(v2Hexagons(container).some(isPointyTopped)).toBe(false);
  });
});
