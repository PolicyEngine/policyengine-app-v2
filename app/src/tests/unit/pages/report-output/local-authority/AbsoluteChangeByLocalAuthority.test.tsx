import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { AbsoluteChangeByLocalAuthority } from '@/pages/report-output/local-authority/AbsoluteChangeByLocalAuthority';
import {
  UK_LOCAL_AREAS_OUTPUT,
  WALES_REGION,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { SOME_WITHHELD_LOCAL_AUTHORITIES } from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  CARDIFF_CODE,
  HARTLEPOOL_CODE,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
  NOT_REPORTED_TEXT,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import {
  SWANSEA_CODE,
  SWANSEA_NAME,
  WELSH_LOCAL_AUTHORITY_COUNT,
} from '@/tests/fixtures/components/visualization/choropleth/ukHexLayoutMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_DATA,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
  MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA,
  MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import {
  areaNames,
  HEX_MAP_OMISSION_NOTE_PATTERN,
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

  test('given a saved result with pre-2023 local authority codes then the hex map leaves those authorities out and draws the others, tiled', async () => {
    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA);

    // Then: Hartlepool and Darlington, at their layout positions; not Allerdale, Craven or Mendip
    expect(v2Hexagons(container)).toHaveLength(2);
    expect(v2Hexagons(container).every(isPointyTopped)).toBe(true);
  });

  test('given a saved result with pre-2023 local authority codes then no note says the hex map leaves them out', async () => {
    // When
    await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA);

    // Then
    expect(screen.queryByText(HEX_MAP_OMISSION_NOTE_PATTERN)).not.toBeInTheDocument();
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

  test('given local authorities without codes then the hex map draws none of them, as v3’s does', async () => {
    // When
    const container = await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_LA);

    // Then
    expect(v2Hexagons(container)).toHaveLength(0);
  });

  test('given local authorities without codes then no note says the hex map leaves them out', async () => {
    // When
    await renderHexMap(MOCK_UK_REPORT_OUTPUT_WITH_LA);

    // Then
    expect(screen.queryByText(HEX_MAP_OMISSION_NOTE_PATTERN)).not.toBeInTheDocument();
  });
});

describe('AbsoluteChangeByLocalAuthority disclosure control', () => {
  test('given withheld local authorities then the chart says how many were not reported', async () => {
    // When
    render(
      <AbsoluteChangeByLocalAuthority
        output={UK_LOCAL_AREAS_OUTPUT}
        withheld={SOME_WITHHELD_LOCAL_AUTHORITIES}
      />
    );

    // Then
    expect(screen.getByText(/^2 of 361 local authorities are not reported\./)).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given withheld local authorities then a boundary without a result reads not reported', async () => {
    // Given: a UK-wide report, whose map draws Hartlepool, which has no result
    const user = userEvent.setup();
    render(
      <AbsoluteChangeByLocalAuthority
        output={UK_LOCAL_AREAS_OUTPUT}
        withheld={SOME_WITHHELD_LOCAL_AUTHORITIES}
      />
    );

    // When
    await user.hover(await screen.findByTestId(`area-${HARTLEPOOL_CODE}`));

    // Then
    expect(screen.getByRole('tooltip')).toHaveTextContent(`Hartlepool${NOT_REPORTED_TEXT}`);
  });
});

describe('AbsoluteChangeByLocalAuthority withheld areas on the hex map', () => {
  /** The chart's hex map, with the hex grid chosen. */
  async function renderHexMap(props: Parameters<typeof AbsoluteChangeByLocalAuthority>[0]) {
    const user = userEvent.setup();
    const { container } = render(<AbsoluteChangeByLocalAuthority {...props} />);
    await screen.findByRole('img', { name: MAP_LEGEND_NAME });
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));
    return { container, user };
  }

  /** The hexagons of areas the result leaves out, which have no value. */
  function withheldHexagons(container: HTMLElement): Element[] {
    return [...container.querySelectorAll('[data-missing-area-id]')];
  }

  test('given withheld local authorities then the hex map draws every Welsh local authority, the withheld ones without a value', async () => {
    // When
    const { container } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT,
      region: WALES_REGION,
      withheld: SOME_WITHHELD_LOCAL_AUTHORITIES,
    });

    // Then: Cardiff and Powys with results, and Wales's other 20 withheld
    expect(v2Hexagons(container).length).toBe(WELSH_LOCAL_AUTHORITY_COUNT);
    expect(withheldHexagons(container).length).toBe(WELSH_LOCAL_AUTHORITY_COUNT - 2);
  });

  test('given a withheld hexagon hovered then its tooltip names it and reads not reported', async () => {
    // Given
    const { container, user } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT,
      region: WALES_REGION,
      withheld: SOME_WITHHELD_LOCAL_AUTHORITIES,
    });

    // When
    await user.hover(container.querySelector(`[data-missing-area-id="${SWANSEA_CODE}"]`)!);

    // Then
    expect(screen.getByText(`${SWANSEA_NAME}: ${NOT_REPORTED_TEXT}`)).toBeInTheDocument();
  });

  test('given a saved result then the hex map draws only its areas, with no withheld ones', async () => {
    // When
    const { container } = await renderHexMap({
      output: UK_LOCAL_AREAS_OUTPUT,
      region: WALES_REGION,
    });

    // Then
    expect(v2Hexagons(container)).toHaveLength(2);
    expect(withheldHexagons(container).length).toBe(0);
  });

  test('given withheld local authorities on pre-2023 codes then the hex map draws no withheld areas', async () => {
    // When
    const { container } = await renderHexMap({
      output: MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA,
      withheld: SOME_WITHHELD_LOCAL_AUTHORITIES,
    });

    // Then
    expect(withheldHexagons(container).length).toBe(0);
  });
});
