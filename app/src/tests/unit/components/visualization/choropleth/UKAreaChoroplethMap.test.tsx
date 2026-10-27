import { createRef } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { UK_BOUNDARY_ATTRIBUTION } from '@/components/visualization/choropleth/ukAreaBoundaries';
import { UKAreaChoroplethMap } from '@/components/visualization/choropleth/UKAreaChoroplethMap';
import { colors } from '@/designTokens';
import {
  ALDERSHOT_CODE,
  CARDIFF_CODE,
  CARDIFF_EAST_CODE,
  CLWYD_EAST_CODE,
  GOWER_CODE,
  HARTLEPOOL_CODE,
  MISNAMED_AREA_POINT,
  MOCK_UK_CONSTITUENCY_POINTS,
  MOCK_UK_CONSTITUENCY_POINTS_WITHOUT_CODES,
  mockUKBoundaryFetch,
  MONMOUTHSHIRE_CODE,
  NOT_REPORTED_TEXT,
  POWYS_CODE,
  RENAMED_AREA_POINT,
  UK_CONSTITUENCY_BOUNDARY_PATH,
  UK_LOCAL_AUTHORITY_BOUNDARY_PATH,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';

const NO_DATA_FILL = colors.gray[300];

function boundary(code: string): Promise<HTMLElement> {
  return screen.findByTestId(`area-${code}`);
}

function tooltipLines(): string[] {
  return within(screen.getByRole('tooltip'))
    .getAllByText(/./)
    .map((line) => line.textContent ?? '');
}

describe('UKAreaChoroplethMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockUKBoundaryFetch());
  });

  test('given the constituency level then it loads the 2024 constituency boundaries', async () => {
    // When
    render(<UKAreaChoroplethMap data={MOCK_UK_CONSTITUENCY_POINTS} level="constituency" />);

    // Then
    expect(await boundary(GOWER_CODE)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(UK_CONSTITUENCY_BOUNDARY_PATH);
  });

  test('given the local authority level then it loads the 2023 local authority boundaries', async () => {
    // When
    render(
      <UKAreaChoroplethMap
        data={[{ id: 'Cardiff', label: 'Cardiff', value: -197.4, code: CARDIFF_CODE }]}
        level="local_authority"
      />
    );

    // Then
    expect(await boundary(CARDIFF_CODE)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(UK_LOCAL_AUTHORITY_BOUNDARY_PATH);
  });

  test('given a result whose name differs from its boundary then its code joins it', async () => {
    // When
    render(<UKAreaChoroplethMap data={[RENAMED_AREA_POINT]} level="constituency" />);
    const clwydEast = await boundary(CLWYD_EAST_CODE);
    fireEvent.mouseEnter(clwydEast);

    // Then
    expect(clwydEast).not.toHaveAttribute('fill', NO_DATA_FILL);
    expect(tooltipLines()[0]).toBe(RENAMED_AREA_POINT.label);
  });

  test('given a result named after one boundary but coded as another then the code decides', async () => {
    // When
    render(<UKAreaChoroplethMap data={[MISNAMED_AREA_POINT]} level="constituency" />);

    // Then
    expect(await boundary(CLWYD_EAST_CODE)).not.toHaveAttribute('fill', NO_DATA_FILL);
    expect(await boundary(GOWER_CODE)).toHaveAttribute('fill', NO_DATA_FILL);
  });

  test('given results without codes then they join their boundaries by name', async () => {
    // When
    render(
      <UKAreaChoroplethMap data={MOCK_UK_CONSTITUENCY_POINTS_WITHOUT_CODES} level="constituency" />
    );

    // Then
    expect(await boundary(GOWER_CODE)).not.toHaveAttribute('fill', NO_DATA_FILL);
    expect(await boundary(MONMOUTHSHIRE_CODE)).not.toHaveAttribute('fill', NO_DATA_FILL);
    expect(await boundary(CLWYD_EAST_CODE)).toHaveAttribute('fill', NO_DATA_FILL);
  });

  test('given a withheld area then its boundary is grey and reads not reported', async () => {
    // Given
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        missingAreaText={NOT_REPORTED_TEXT}
      />
    );
    const cardiffEast = await boundary(CARDIFF_EAST_CODE);

    // When
    fireEvent.mouseEnter(cardiffEast);

    // Then: the boundary file names it, as the result does not.
    expect(cardiffEast).toHaveAttribute('fill', NO_DATA_FILL);
    expect(tooltipLines()).toEqual(['Cardiff East', NOT_REPORTED_TEXT]);
  });

  test('given an approximate area with a 90% range then its tooltip gives both', async () => {
    // Given
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        config={{ formatValue: (value) => `£${value}` }}
      />
    );

    // When
    fireEvent.mouseEnter(await boundary(MONMOUTHSHIRE_CODE));

    // Then
    expect(tooltipLines()).toEqual([
      'Monmouthshire',
      '£-90.78',
      '90% range £-150 to £-30',
      'Approximate estimate',
    ]);
  });

  test('given a nation to focus then only its areas are drawn', async () => {
    // When
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        focusNation="wales"
      />
    );

    // Then
    expect(await boundary(GOWER_CODE)).toBeInTheDocument();
    expect(screen.queryByTestId(`area-${ALDERSHOT_CODE}`)).not.toBeInTheDocument();
  });

  test('given no nation to focus then every UK area is drawn', async () => {
    // When
    render(<UKAreaChoroplethMap data={MOCK_UK_CONSTITUENCY_POINTS} level="constituency" />);

    // Then
    expect(await boundary(ALDERSHOT_CODE)).toBeInTheDocument();
    expect(await boundary(GOWER_CODE)).toBeInTheDocument();
  });

  test('given an English local authority report then Welsh local authorities are not drawn', async () => {
    // When
    render(
      <UKAreaChoroplethMap
        data={[{ id: 'Hartlepool', label: 'Hartlepool', value: 40, code: HARTLEPOOL_CODE }]}
        level="local_authority"
        focusNation="england"
      />
    );

    // Then
    expect(await boundary(HARTLEPOOL_CODE)).toBeInTheDocument();
    expect(screen.queryByTestId(`area-${POWYS_CODE}`)).not.toBeInTheDocument();
  });

  test('given a click handler then clicking an area passes its id, and a withheld one takes no click', async () => {
    // Given
    const onAreaClick = vi.fn();
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        onAreaClick={onAreaClick}
      />
    );

    // When
    fireEvent.click(await boundary(GOWER_CODE));
    fireEvent.click(await boundary(CARDIFF_EAST_CODE));

    // Then
    expect(onAreaClick).toHaveBeenCalledTimes(1);
    expect(onAreaClick).toHaveBeenCalledWith('Gower');
  });

  test('given a selected area then it alone is outlined and drawn last', async () => {
    // Given
    const { container } = render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        selectedId="Gower"
        navigable
      />
    );

    // When
    const gower = await boundary(GOWER_CODE);

    // Then
    expect(gower).toHaveAttribute('data-selected', 'true');
    expect(gower).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    expect(container.querySelectorAll('[data-selected]')).toHaveLength(1);
    const paths = container.querySelectorAll('path.rsm-geography');
    expect(paths[paths.length - 1]).toBe(gower);
  });

  test('given a navigable map then it has the district map’s zoom and reset buttons', async () => {
    // When
    render(
      <UKAreaChoroplethMap data={MOCK_UK_CONSTITUENCY_POINTS} level="constituency" navigable />
    );

    // Then
    expect(await screen.findByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeInTheDocument();
  });

  test('given a map that is not navigable then it has no zoom buttons, as the v2 district map', async () => {
    // When
    render(<UKAreaChoroplethMap data={MOCK_UK_CONSTITUENCY_POINTS} level="constituency" />);
    await boundary(GOWER_CODE);

    // Then
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
  });

  test('given the map then its legend gives the scale’s two ends in the value format', async () => {
    // When
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        config={{ formatValue: (value) => `£${Math.round(value)}` }}
      />
    );

    // Then: the scale is symmetric about zero, from the largest change.
    const legend = await screen.findByRole('img', { name: 'Color scale legend' });
    expect(within(legend).getByText('£355')).toBeInTheDocument();
    expect(within(legend).getByText('£-355')).toBeInTheDocument();
  });

  test('given an export ref then the exported node holds the map and its licence credit', async () => {
    // Given
    const exportRef = createRef<HTMLDivElement>();

    // When
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        exportRef={exportRef}
      />
    );

    // Then
    const area = await boundary(GOWER_CODE);
    expect(exportRef.current).toContainElement(area);
    expect(exportRef.current).toContainElement(
      screen.getByText(UK_BOUNDARY_ATTRIBUTION.constituency)
    );
  });

  test('given boundaries that fail to load then the map says so', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 404 }))
    );

    // When
    render(
      <UKAreaChoroplethMap
        data={MOCK_UK_CONSTITUENCY_POINTS}
        level="constituency"
        geoDataPath="/data/geojson/missing.geojson"
      />
    );

    // Then
    await waitFor(() =>
      expect(screen.getByText('Failed to load geo data: 404')).toBeInTheDocument()
    );
  });
});
