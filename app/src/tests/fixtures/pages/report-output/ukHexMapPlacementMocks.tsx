import { render, screen, userEvent, within } from '@test-utils';
import type { UKAreaLevel } from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import UKLocalAreaMaps from '@/components/flagship/report/UKLocalAreaMaps';
import { MAP_LEGEND_NAME } from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';

export interface HexagonCentre {
  x: number;
  y: number;
}

/** A hexagon polygon's vertices, in drawing order. */
export function hexagonVertices(polygon: Element): [number, number][] {
  return (polygon.getAttribute('points') ?? '')
    .trim()
    .split(' ')
    .map((pair) => pair.split(',').map(Number) as [number, number]);
}

/** A hexagon polygon's centre: the mean of its vertices. */
export function hexagonCentre(polygon: Element): HexagonCentre {
  const vertices = hexagonVertices(polygon);
  return {
    x: vertices.reduce((sum, [vertexX]) => sum + vertexX, 0) / vertices.length,
    y: vertices.reduce((sum, [, vertexY]) => sum + vertexY, 0) / vertices.length,
  };
}

/**
 * Whether a hexagon is pointy-topped, as on the tiled grid: its top and
 * bottom vertices share an x. A flat-topped one's left and right share a y.
 */
export function isPointyTopped(polygon: Element): boolean {
  const vertices = hexagonVertices(polygon);
  return Math.abs(vertices[1][0] - vertices[4][0]) < 1e-6;
}

/** Rounded to six places, and never -0, so arrangements compare with toEqual. */
function roundCoordinate(value: number): number {
  return Math.round(value * 1e6) / 1e6 + 0;
}

/**
 * The hexagons' centres moved so the first sits at the origin and scaled so
 * the first two sit one unit apart. Two maps that put every area in the
 * same hex give the same arrangement, whatever size they draw at.
 */
export function hexagonArrangement(polygons: Element[]): HexagonCentre[] {
  const centres = polygons.map(hexagonCentre);
  const [origin, second] = centres;
  const unit = Math.hypot(second.x - origin.x, second.y - origin.y);
  return centres.map((centre) => ({
    x: roundCoordinate((centre.x - origin.x) / unit),
    y: roundCoordinate((centre.y - origin.y) / unit),
  }));
}

/** A level's areas in a result, by name, in the result's order. */
export function areaNames(output: SocietyWideReportOutput, level: UKAreaLevel): string[] {
  const uk = output as ReportOutputSocietyWideUK;
  const areas =
    level === 'constituency'
      ? uk.constituency_impact?.by_constituency
      : uk.local_authority_impact?.by_local_authority;
  return Object.keys(areas ?? {});
}

/**
 * The hexagons of v3's hex map of a level's areas, in the result's order:
 * the arrangement v2's hex map must match. Renders v3's local-area map,
 * reads it and unmounts it.
 */
export async function v3HexagonArrangement(
  output: SocietyWideReportOutput,
  level: UKAreaLevel
): Promise<HexagonCentre[]> {
  const user = userEvent.setup();
  const { container, unmount } = render(<UKLocalAreaMaps output={output} />, 'uk');
  const v3Map = within(container);
  if (level === 'local_authority') {
    await user.click(v3Map.getByRole('tab', { name: 'Local authorities' }));
  }
  await screen.findByRole('img', { name: MAP_LEGEND_NAME });
  await user.click(v3Map.getByRole('tab', { name: 'Hex grid' }));
  const hexagons = areaNames(output, level).map(
    (name) => container.querySelector(`[data-area-id="${name}"]`)!
  );
  const arrangement = hexagonArrangement(hexagons);
  unmount();
  return arrangement;
}

/** v2's hexagons: its hex map is not selectable, so they carry no ids, and draw in the result's order. */
export function v2Hexagons(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('svg polygon')];
}
