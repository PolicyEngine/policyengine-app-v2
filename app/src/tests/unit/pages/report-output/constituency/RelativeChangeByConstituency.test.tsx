import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { RelativeChangeByConstituency } from '@/pages/report-output/constituency/RelativeChangeByConstituency';
import {
  UK_LOCAL_AREAS_OUTPUT,
  UK_LOCAL_AREAS_OUTPUT_GOWER_UNCODED,
  UK_LOCAL_AREAS_OUTPUT_NO_CODES,
  WALES_REGION,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { SOME_WITHHELD_CONSTITUENCIES } from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  CARDIFF_EAST_CODE,
  GOWER_CODE,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
  NOT_REPORTED_TEXT,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import {
  CARDIFF_EAST_NAME,
  WELSH_CONSTITUENCY_COUNT,
} from '@/tests/fixtures/components/visualization/choropleth/ukHexLayoutMocks';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';
import {
  hexagonArrangement,
  isPointyTopped,
  v2Hexagons,
  v3HexagonArrangement,
} from '@/tests/fixtures/pages/report-output/ukHexMapPlacementMocks';
import { withNullAreaImpacts } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

beforeEach(() => {
  vi.stubGlobal('fetch', mockUKBoundaryFetch());
});

describe('RelativeChangeByConstituency', () => {
  test('given constituency data then renders component', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(
      screen.getByText('Relative household income change by constituency')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;

    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders the geographic map', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given UK report output then component renders', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test.each([
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
  ])('given %s constituency impacts then shows no data message', (_label, output) => {
    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });
});

describe('RelativeChangeByConstituency map type', () => {
  test('given constituency data then the geographic map is the default', async () => {
    // When
    const { container } = render(<RelativeChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} />);

    // Then
    expect(screen.getByRole('tab', { name: 'Geographic', selected: true })).toBeInTheDocument();
    expect(await screen.findByTestId(`area-${GOWER_CODE}`)).toBeInTheDocument();
    expect(container.querySelector('svg polygon')).not.toBeInTheDocument();
  });

  test('given Hex grid chosen then the hex map replaces the geographic map', async () => {
    // Given
    const user = userEvent.setup();
    const { container } = render(<RelativeChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} />);
    await screen.findByTestId(`area-${GOWER_CODE}`);

    // When
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

    // Then
    expect(container.querySelectorAll('svg polygon')).toHaveLength(3);
    expect(screen.queryByTestId(`area-${GOWER_CODE}`)).not.toBeInTheDocument();
  });
});

describe('RelativeChangeByConstituency hex map placement', () => {
  /** The chart's hex map of `output`, with the hex grid chosen. */
  async function renderHexMap(output: SocietyWideReportOutput) {
    const user = userEvent.setup();
    const { container } = render(<RelativeChangeByConstituency output={output} />);
    await screen.findByRole('img', { name: MAP_LEGEND_NAME });
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));
    return container;
  }

  test('given constituencies with codes then the hex map puts each in the hex v3’s does', async () => {
    // Given
    const v3Arrangement = await v3HexagonArrangement(UK_LOCAL_AREAS_OUTPUT, 'constituency');

    // When
    const container = await renderHexMap(UK_LOCAL_AREAS_OUTPUT);

    // Then
    expect(hexagonArrangement(v2Hexagons(container))).toEqual(v3Arrangement);
  });

  test('given constituencies with codes then the hex map draws the tiled grid’s pointy-topped hexagons', async () => {
    // When
    const container = await renderHexMap(UK_LOCAL_AREAS_OUTPUT);

    // Then
    expect(v2Hexagons(container).every(isPointyTopped)).toBe(true);
  });

  test('given constituencies without codes then the hex map keeps their results’ positions, as v3’s does', async () => {
    // Given
    const v3Arrangement = await v3HexagonArrangement(
      UK_LOCAL_AREAS_OUTPUT_NO_CODES,
      'constituency'
    );

    // When
    const container = await renderHexMap(UK_LOCAL_AREAS_OUTPUT_NO_CODES);

    // Then: on the square grid of flat-topped hexagons those positions were made for
    expect(hexagonArrangement(v2Hexagons(container))).toEqual(v3Arrangement);
    expect(v2Hexagons(container).some(isPointyTopped)).toBe(false);
  });
});

describe('RelativeChangeByConstituency disclosure control', () => {
  test('given withheld constituencies then the chart says how many were not reported', async () => {
    // When
    render(
      <RelativeChangeByConstituency
        output={UK_LOCAL_AREAS_OUTPUT}
        region={WALES_REGION}
        withheld={SOME_WITHHELD_CONSTITUENCIES}
      />
    );

    // Then
    expect(screen.getByText(/^12 of 650 constituencies are not reported\./)).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given withheld constituencies then a boundary without a result reads not reported', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <RelativeChangeByConstituency
        output={UK_LOCAL_AREAS_OUTPUT}
        region={WALES_REGION}
        withheld={SOME_WITHHELD_CONSTITUENCIES}
      />
    );

    // When
    await user.hover(await screen.findByTestId(`area-${CARDIFF_EAST_CODE}`));

    // Then
    expect(screen.getByRole('tooltip')).toHaveTextContent(`Cardiff East${NOT_REPORTED_TEXT}`);
  });
});

describe('RelativeChangeByConstituency withheld areas on the hex map', () => {
  /** The chart's hex map, with the hex grid chosen. */
  async function renderHexMap(props: Parameters<typeof RelativeChangeByConstituency>[0]) {
    const user = userEvent.setup();
    const { container } = render(<RelativeChangeByConstituency {...props} />);
    await screen.findByRole('img', { name: MAP_LEGEND_NAME });
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));
    return { container, user };
  }

  /** The hexagons of areas the result leaves out, which have no value. */
  function withheldHexagons(container: HTMLElement): Element[] {
    return [...container.querySelectorAll('[data-missing-area-id]')];
  }

  test('given withheld constituencies then the hex map draws every Welsh constituency, the withheld ones without a value', async () => {
    // When
    const { container } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT,
      region: WALES_REGION,
      withheld: SOME_WITHHELD_CONSTITUENCIES,
    });

    // Then: three with results, and Wales's other 29 withheld
    expect(v2Hexagons(container).length).toBe(WELSH_CONSTITUENCY_COUNT);
    expect(withheldHexagons(container).length).toBe(WELSH_CONSTITUENCY_COUNT - 3);
  });

  test('given a withheld hexagon hovered then its tooltip names it and reads not reported', async () => {
    // Given
    const { container, user } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT,
      region: WALES_REGION,
      withheld: SOME_WITHHELD_CONSTITUENCIES,
    });

    // When
    await user.hover(container.querySelector(`[data-missing-area-id="${CARDIFF_EAST_CODE}"]`)!);

    // Then
    expect(screen.getByText(`${CARDIFF_EAST_NAME}: ${NOT_REPORTED_TEXT}`)).toBeInTheDocument();
  });

  test('given a saved result then the hex map draws only its areas, with no withheld ones', async () => {
    // When
    const { container } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT,
      region: WALES_REGION,
    });

    // Then
    expect(v2Hexagons(container)).toHaveLength(3);
    expect(withheldHexagons(container).length).toBe(0);
  });

  test('given withheld constituencies and one without a code then the hex map draws no withheld areas', async () => {
    // When
    const { container } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT_GOWER_UNCODED,
      region: WALES_REGION,
      withheld: SOME_WITHHELD_CONSTITUENCIES,
    });

    // Then
    expect(withheldHexagons(container).length).toBe(0);
  });
});
