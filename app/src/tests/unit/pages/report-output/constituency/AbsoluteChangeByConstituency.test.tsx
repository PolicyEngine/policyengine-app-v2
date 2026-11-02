import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { AbsoluteChangeByConstituency } from '@/pages/report-output/constituency/AbsoluteChangeByConstituency';
import { UK_WIDE_WITHHELD_CONSTITUENCIES } from '@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks';
import {
  UK_LOCAL_AREAS_OUTPUT,
  UK_LOCAL_AREAS_OUTPUT_GOWER_UNCODED,
  UK_LOCAL_AREAS_OUTPUT_NO_CODES,
  WALES_REGION,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { SOME_WITHHELD_CONSTITUENCIES } from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  ALDERSHOT_CODE,
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
  MIN_MISSING_AREA_STRIPE_PIXELS,
  mockRenderedSvgWidth,
  PHONE_WIDTH_PIXELS,
  stripeSpacingOnScreen,
} from '@/tests/fixtures/components/visualization/hexMapMocks';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';
import {
  HEX_MAP_OMISSION_NOTE_PATTERN,
  hexagonArrangement,
  hexagonVertices,
  isPointyTopped,
  v2Hexagons,
  v3HexagonArrangement,
} from '@/tests/fixtures/pages/report-output/ukHexMapPlacementMocks';
import {
  BREAKDOWN_CONSTITUENCY_IMPACT,
  V2_UK_REGION,
  withNullAreaImpacts,
} from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

beforeEach(() => {
  vi.stubGlobal('fetch', mockUKBoundaryFetch());
});

describe('AbsoluteChangeByConstituency', () => {
  test('given constituency data then renders component', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;

    // When
    render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders the geographic map', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given UK report output then component renders', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<AbsoluteChangeByConstituency output={output} />);

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
    render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given withheld constituencies then the chart says how many were not reported', async () => {
    // When
    render(
      <AbsoluteChangeByConstituency
        output={MOCK_UK_REPORT_OUTPUT}
        withheld={SOME_WITHHELD_CONSTITUENCIES}
      />
    );

    // Then
    expect(screen.getByText(/^12 of 650 constituencies are not reported\./)).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given a saved result then the chart has no disclosure note', async () => {
    // When
    render(<AbsoluteChangeByConstituency output={MOCK_UK_REPORT_OUTPUT} />);

    // Then
    expect(screen.queryByText(/not reported/)).not.toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });
});

describe('AbsoluteChangeByConstituency map type', () => {
  test('given constituency data then the geographic map is the default', async () => {
    // When
    const { container } = render(<AbsoluteChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} />);

    // Then
    expect(screen.getByRole('tab', { name: 'Geographic', selected: true })).toBeInTheDocument();
    expect(await screen.findByTestId(`area-${GOWER_CODE}`)).toBeInTheDocument();
    expect(container.querySelector('svg polygon')).not.toBeInTheDocument();
  });

  test('given Hex grid chosen then the hex map replaces the geographic map', async () => {
    // Given
    const user = userEvent.setup();
    const { container } = render(<AbsoluteChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} />);
    await screen.findByTestId(`area-${GOWER_CODE}`);

    // When
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

    // Then
    expect(container.querySelectorAll('svg polygon')).toHaveLength(3);
    expect(screen.queryByTestId(`area-${GOWER_CODE}`)).not.toBeInTheDocument();
  });

  test('given a Wales report then only Welsh constituencies are drawn', async () => {
    // When
    render(<AbsoluteChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} region={WALES_REGION} />);

    // Then
    expect(await screen.findByTestId(`area-${GOWER_CODE}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`area-${ALDERSHOT_CODE}`)).not.toBeInTheDocument();
  });

  test('given withheld constituencies then a boundary without a result reads not reported', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <AbsoluteChangeByConstituency
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

describe('AbsoluteChangeByConstituency saved results', () => {
  test('given a saved result that still carries x and y then its geographic map draws its areas by name', async () => {
    // When: an older keyed result, with no codes and each area's x and y
    render(<AbsoluteChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT_NO_CODES} />);

    // Then
    expect(await screen.findByTestId(`area-${GOWER_CODE}`)).toHaveAttribute('fill');
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
  });
});

describe('AbsoluteChangeByConstituency hex map placement', () => {
  /** The chart's hex map of `output`, with the hex grid chosen. */
  async function renderHexMap(output: SocietyWideReportOutput) {
    const user = userEvent.setup();
    const { container } = render(<AbsoluteChangeByConstituency output={output} />);
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

  test('given a nation’s few constituencies then the hex map draws every hexagon inside its frame', async () => {
    // When: three Welsh constituencies, so each hexagon is drawn large
    const container = await renderHexMap(UK_LOCAL_AREAS_OUTPUT);

    // Then
    const hexagons = v2Hexagons(container);
    const frameHeight = Number((hexagons[0] as SVGElement).ownerSVGElement!.getAttribute('height'));
    const vertexYs = hexagons.flatMap((hexagon) =>
      hexagonVertices(hexagon).map(([, vertexY]) => vertexY)
    );
    expect(Math.min(...vertexYs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...vertexYs)).toBeLessThanOrEqual(frameHeight);
  });

  test('given constituencies without codes then the hex map draws none of them, as v3’s does', async () => {
    // When
    const container = await renderHexMap(UK_LOCAL_AREAS_OUTPUT_NO_CODES);

    // Then
    expect(v2Hexagons(container)).toHaveLength(0);
  });

  test('given constituencies without codes then no note says the hex map leaves them out', async () => {
    // When
    await renderHexMap(UK_LOCAL_AREAS_OUTPUT_NO_CODES);

    // Then
    expect(screen.queryByText(HEX_MAP_OMISSION_NOTE_PATTERN)).not.toBeInTheDocument();
  });
});

describe('AbsoluteChangeByConstituency withheld areas on the hex map', () => {
  /** The chart's hex map, with the hex grid chosen. */
  async function renderHexMap(props: Parameters<typeof AbsoluteChangeByConstituency>[0]) {
    const user = userEvent.setup();
    const { container } = render(<AbsoluteChangeByConstituency {...props} />);
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

describe('AbsoluteChangeByConstituency withheld hatching on a phone', () => {
  test('given a UK-wide breakdown drawn 375 pixels wide then the withheld hatching’s stripes are at least 4 screen pixels apart', async () => {
    // Given: the chart's 600-unit hex map measures a phone's width
    const restoreWidth = mockRenderedSvgWidth(PHONE_WIDTH_PIXELS);
    const output = {
      ...NATIONAL_OUTPUT_WITHOUT_AREAS,
      constituency_impact: BREAKDOWN_CONSTITUENCY_IMPACT,
    } as SocietyWideReportOutput;

    try {
      const user = userEvent.setup();
      const { container } = render(
        <AbsoluteChangeByConstituency
          output={output}
          region={V2_UK_REGION}
          withheld={UK_WIDE_WITHHELD_CONSTITUENCIES}
        />
      );
      await screen.findByRole('img', { name: MAP_LEGEND_NAME });

      // When
      await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

      // Then
      expect(stripeSpacingOnScreen(container, PHONE_WIDTH_PIXELS)).toBeGreaterThanOrEqual(
        MIN_MISSING_AREA_STRIPE_PIXELS
      );
    } finally {
      restoreWidth();
    }
  });
});
