import { fireEvent, render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { HexagonalMap, zoomAbout } from '@/components/visualization/HexagonalMap';
import {
  MOCK_HEX_MAP_DATA,
  MOCK_MIXED_VALUES,
  MOCK_NEGATIVE_VALUES,
  MOCK_POSITIVE_VALUES,
  MOCK_TILED_HEX_DATA,
  MOCK_UK_SHAPED_HEX_DATA,
} from '@/tests/fixtures/components/visualization/hexMapMocks';

/** A hexagon polygon's vertices, in drawing order. */
function vertices(polygon: Element): [number, number][] {
  return (polygon.getAttribute('points') ?? '')
    .trim()
    .split(' ')
    .map((pair) => pair.split(',').map(Number) as [number, number]);
}

/** A hexagon polygon's centre. */
function centre(polygon: Element): [number, number] {
  const points = vertices(polygon);
  return [
    points.reduce((sum, [x]) => sum + x, 0) / points.length,
    points.reduce((sum, [, y]) => sum + y, 0) / points.length,
  ];
}

// jsdom has no PointerEvent; a MouseEvent with a pointer id is enough for the map's drag.
if (typeof window.PointerEvent === 'undefined') {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;
}

describe('HexagonalMap', () => {
  test('given a tiled grid then hexagons are pointy-topped and rows sit √3/2 of a column apart', () => {
    // When
    const { container } = render(
      <HexagonalMap data={MOCK_TILED_HEX_DATA} config={{ tiled: true }} onSelect={vi.fn()} />
    );

    // Then
    const [west, east, north] = ['west', 'east', 'north'].map(
      (id) => container.querySelector(`[data-area-id="${id}"]`)!
    );
    const column = centre(east)[0] - centre(west)[0];
    const row = centre(west)[1] - centre(north)[1];
    expect(row / column).toBeCloseTo(Math.sqrt(3) / 2, 5);
    const points = vertices(west);
    // A pointy-top hexagon's top and bottom vertices share an x.
    expect(points[1][0]).toBeCloseTo(points[4][0], 5);
  });

  test('given the default grid then hexagons stay flat-topped on square rows', () => {
    // When
    const { container } = render(<HexagonalMap data={MOCK_TILED_HEX_DATA} onSelect={vi.fn()} />);

    // Then
    const [west, east, north] = ['west', 'east', 'north'].map(
      (id) => container.querySelector(`[data-area-id="${id}"]`)!
    );
    const column = centre(east)[0] - centre(west)[0];
    const row = centre(west)[1] - centre(north)[1];
    expect(row / column).toBeCloseTo(1, 5);
    const points = vertices(west);
    // A flat-top hexagon's left and right vertices share a y.
    expect(points[0][1]).toBeCloseTo(points[3][1], 5);
  });

  test('given minimal data then renders SVG with one hexagon', () => {
    // Given
    const data = [{ id: '1', label: 'Test', value: 100, x: 0, y: 0 }];

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(1);
  });

  test('given empty data then renders SVG with no hexagons', () => {
    // Given
    const data: any[] = [];

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(0);
  });

  test('given standard constituency data then renders correct number of hexagons', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(4);
  });

  test('given positive values then renders hexagons with fill colors', () => {
    // Given
    const data = MOCK_POSITIVE_VALUES;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(3);
    // Each polygon should have a fill attribute
    polygons.forEach((polygon) => {
      expect(polygon.getAttribute('fill')).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  test('given negative values then renders hexagons', () => {
    // Given
    const data = MOCK_NEGATIVE_VALUES;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(3);
  });

  test('given mixed positive and negative values then renders all hexagons', () => {
    // Given
    const data = MOCK_MIXED_VALUES;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(4);
  });

  test('given show color bar true by default then renders color bar', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then — color bar uses a linearGradient
    const gradient = container.querySelector('linearGradient');
    expect(gradient).toBeInTheDocument();
  });

  test('given show color bar false then does not render color bar', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = { showColorBar: false };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    const gradient = container.querySelector('linearGradient');
    expect(gradient).toBeNull();
  });

  test('given user hovers over hexagon then shows tooltip with label', async () => {
    // Given
    const user = userEvent.setup();
    const data = [{ id: '1', label: 'Westminster North', value: 100, x: 0, y: 0 }];
    const { container } = render(<HexagonalMap data={data} />);
    const polygon = container.querySelector('polygon')!;

    // When
    await user.hover(polygon);

    // Then
    expect(screen.getByText(/Westminster North/)).toBeInTheDocument();
  });

  test('given custom format function then uses it in tooltip', async () => {
    // Given
    const user = userEvent.setup();
    const data = [{ id: '1', label: 'Area A', value: 1234, x: 0, y: 0 }];
    const config = {
      formatValue: (val: number) => `£${val.toFixed(0)}`,
    };
    const { container } = render(<HexagonalMap data={data} config={config} />);
    const polygon = container.querySelector('polygon')!;

    // When
    await user.hover(polygon);

    // Then
    expect(screen.getByText(/£1234/)).toBeInTheDocument();
  });

  test('given custom height config then sets SVG height', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = { height: 800 };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('height')).toBe('800');
  });

  test('given symmetric color scale then renders with gradient', () => {
    // Given
    const data = MOCK_MIXED_VALUES;
    const config = {
      colorScale: {
        colors: ['#000000', '#808080', '#ffffff'],
        tickFormat: ',.0f',
        symmetric: true,
      },
    };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(4);
  });

  test('given asymmetric color scale then renders', () => {
    // Given
    const data = MOCK_POSITIVE_VALUES;
    const config = {
      colorScale: {
        colors: ['#000000', '#ffffff'],
        tickFormat: ',.0f',
        symmetric: false,
      },
    };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(3);
  });

  test('given custom hex size then renders hexagons', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = { hexSize: 20 };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(4);
  });
  test('given no selection props then hexagons carry no selection attributes', () => {
    const { container } = render(<HexagonalMap data={MOCK_HEX_MAP_DATA} />);

    expect(container.querySelector('[data-area-id]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-selected]')).not.toBeInTheDocument();
  });

  test('given onSelect then clicking a hexagon passes its id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(<HexagonalMap data={MOCK_HEX_MAP_DATA} onSelect={onSelect} />);

    await user.click(container.querySelector('[data-area-id="edinburgh-central"]')!);

    expect(onSelect).toHaveBeenCalledWith('edinburgh-central');
  });

  test('given a selected id then that hexagon is outlined and drawn last', () => {
    const { container } = render(
      <HexagonalMap data={MOCK_HEX_MAP_DATA} selectedId="westminster-north" onSelect={vi.fn()} />
    );

    const hexagons = container.querySelectorAll('polygon[data-area-id]');
    const selected = container.querySelector('[data-selected]')!;
    expect(selected).toHaveAttribute('data-area-id', 'westminster-north');
    expect(selected).toHaveAttribute('stroke-width', '1.5');
    expect(hexagons[hexagons.length - 1]).toBe(selected);
    expect(screen.getByTestId('hex-selection-ring')).toBeInTheDocument();
  });

  test('given no selected id then no selection ring is drawn', () => {
    render(<HexagonalMap data={MOCK_HEX_MAP_DATA} onSelect={vi.fn()} />);

    expect(screen.queryByTestId('hex-selection-ring')).not.toBeInTheDocument();
  });

  test('given insetWatermark then the logo has padding clear of the frame', () => {
    const { container } = render(<HexagonalMap data={MOCK_HEX_MAP_DATA} insetWatermark />);

    const logoWrapper = container.querySelector('img')!.parentElement!;
    expect(logoWrapper.style.padding).toBe('4px 8px');
  });
  test('given no zoomable prop then the map renders as before, with no zoom controls', () => {
    const { container } = render(<HexagonalMap data={MOCK_HEX_MAP_DATA} />);

    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset view' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('hex-map-zoom-layer')).not.toBeInTheDocument();
    const svg = container.querySelector('svg')!;
    // The hexagons sit directly in the SVG, with no zoom or clip group around them.
    expect([...svg.children].filter((child) => child.tagName === 'polygon')).toHaveLength(4);
    expect(svg.querySelector('clipPath')).not.toBeInTheDocument();
    expect(svg.getAttribute('style')).toBe('display: block;');
  });

  test('given zoomable then zoom in, zoom out and reset change the view', async () => {
    const user = userEvent.setup();
    render(<HexagonalMap data={MOCK_HEX_MAP_DATA} zoomable />);
    const layer = () => screen.getByTestId('hex-map-zoom-layer').getAttribute('transform');

    expect(layer()).toContain('scale(1)');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(layer()).toContain('scale(1.5)');
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(layer()).toBe('translate(0 0) scale(1)');
  });

  test('given zoomable then a drag pans the map and does not select the hexagon under it', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <HexagonalMap data={MOCK_HEX_MAP_DATA} zoomable onSelect={onSelect} />
    );
    const svg = container.querySelector('svg')!;
    const hexagon = container.querySelector('[data-area-id="westminster-north"]')!;

    fireEvent.pointerDown(svg, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.click(hexagon);

    expect(screen.getByTestId('hex-map-zoom-layer')).toHaveAttribute(
      'transform',
      'translate(30 20) scale(1)'
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('given zoomed in then a click still selects a hexagon', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <HexagonalMap data={MOCK_HEX_MAP_DATA} zoomable onSelect={onSelect} />
    );

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(container.querySelector('[data-area-id="belfast-east"]')!);

    expect(onSelect).toHaveBeenCalledWith('belfast-east');
  });

  test('given zoomable and a selection then the outline keeps its screen width', () => {
    const { container } = render(
      <HexagonalMap
        data={MOCK_HEX_MAP_DATA}
        zoomable
        selectedId="cardiff-south"
        onSelect={vi.fn()}
      />
    );

    expect(container.querySelector('[data-selected]')).toHaveAttribute(
      'vector-effect',
      'non-scaling-stroke'
    );
    screen
      .getByTestId('hex-selection-ring')
      .querySelectorAll('polygon')
      .forEach((ring) => expect(ring).toHaveAttribute('vector-effect', 'non-scaling-stroke'));
  });

  test('given formatColorBarTick then the legend ticks use it, and plain numbers without it', () => {
    const { container, unmount } = render(<HexagonalMap data={MOCK_HEX_MAP_DATA} />);
    const ticks = () => [...container.querySelectorAll('text')].map((text) => text.textContent);
    expect(ticks()).not.toContain('£1235');
    unmount();

    const formatted = render(
      <HexagonalMap
        data={MOCK_HEX_MAP_DATA}
        config={{ formatColorBarTick: (value) => `£${Math.round(value)}` }}
      />
    );
    const labels = [...formatted.container.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels).toContain('£1235');
    expect(labels).toContain('£0');
  });
});

/** The extent of every hexagon's corners, in SVG units, before any zoom. */
function hexagonExtent(container: HTMLElement) {
  const corners = [...container.querySelectorAll('polygon[data-area-id], svg > polygon')].flatMap(
    (polygon) =>
      (polygon.getAttribute('points') ?? '')
        .trim()
        .split(/\s+/)
        .map((pair) => pair.split(',').map(Number))
  );
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

describe('zoomAbout', () => {
  test('given a zoom about a point then that point stays where it is', () => {
    const view = zoomAbout({ k: 1, x: 0, y: 0 }, 2, 100, 50);

    expect(view).toEqual({ k: 2, x: -100, y: -50 });
    // The point (100, 50) maps to 100 * 2 - 100 = 100 and 50 * 2 - 50 = 50.
  });

  test('given a zoom past the limits then it stops at 0.5 and 20', () => {
    expect(zoomAbout({ k: 1, x: 0, y: 0 }, 100, 0, 0).k).toBe(20);
    expect(zoomAbout({ k: 1, x: 0, y: 0 }, 0.1, 0, 0).k).toBe(0.5);
  });
});

describe('HexagonalMap default view', () => {
  test('given a centred zoomable map then the default view holds the whole map inside the clip area, centred', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <HexagonalMap data={MOCK_UK_SHAPED_HEX_DATA} zoomable centered onSelect={vi.fn()} />
    );
    const clip = container.querySelector('clipPath rect')!;
    const clipWidth = Number(clip.getAttribute('width'));
    const clipHeight = Number(clip.getAttribute('height'));

    const extent = hexagonExtent(container);
    expect(screen.getByTestId('hex-map-zoom-layer')).toHaveAttribute(
      'transform',
      'translate(0 0) scale(1)'
    );
    expect(extent.minX).toBeGreaterThan(0);
    expect(extent.maxX).toBeLessThan(clipWidth);
    expect(extent.minY).toBeGreaterThan(0);
    expect(extent.maxY).toBeLessThan(clipHeight);
    // Equal margins left and right, and top and bottom.
    expect(extent.minX).toBeCloseTo(clipWidth - extent.maxX, 5);
    expect(extent.minY).toBeCloseTo(clipHeight - extent.maxY, 5);

    // Reset view returns to that view after a zoom.
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(screen.getByTestId('hex-map-zoom-layer')).toHaveAttribute(
      'transform',
      'translate(0 0) scale(1)'
    );
  });

  test('given no centered prop then the map keeps its top-left placement, as in v2', () => {
    const { container } = render(<HexagonalMap data={MOCK_UK_SHAPED_HEX_DATA} />);

    const extent = hexagonExtent(container);
    // The hexagons start one padding (2 x hex size = 16) in from the left and top.
    expect(extent.minX).toBeLessThan(16);
    expect(extent.minY).toBeLessThan(16);
  });
});

describe('HexagonalMap tiled frame', () => {
  test('given a tiled map of a few areas then every hexagon stays inside the frame', () => {
    // When: three areas, so each hexagon is drawn large
    const { container } = render(
      <HexagonalMap data={MOCK_TILED_HEX_DATA} config={{ tiled: true }} onSelect={vi.fn()} />
    );

    // Then
    const extent = hexagonExtent(container);
    expect(extent.minY).toBeGreaterThanOrEqual(0);
    expect(extent.maxY).toBeLessThanOrEqual(380);
    expect(extent.minX).toBeGreaterThanOrEqual(0);
  });

  test('given a tiled UK-shaped map then every hexagon stays inside the frame', () => {
    // When
    const { container } = render(
      <HexagonalMap data={MOCK_UK_SHAPED_HEX_DATA} config={{ tiled: true }} onSelect={vi.fn()} />
    );

    // Then
    const extent = hexagonExtent(container);
    expect(extent.minY).toBeGreaterThanOrEqual(0);
    expect(extent.maxY).toBeLessThanOrEqual(380);
    expect(extent.minX).toBeGreaterThanOrEqual(0);
  });
});

describe('HexagonalMap fillWidth', () => {
  test('given fillWidth then the map takes the frame width and the legend ends at the logo inset', () => {
    // Given a frame 1000 pixels wide
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    const widthSpy = vi
      .spyOn(SVGElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ width: 1000 } as DOMRect);

    try {
      // When
      const { container } = render(
        <HexagonalMap data={MOCK_UK_SHAPED_HEX_DATA} zoomable centered fillWidth />
      );

      // Then
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('viewBox')).toBe('0 0 1000 380');
      const bar = container.querySelector('rect[fill^="url(#hex-color-bar"]')!;
      expect(Number(bar.getAttribute('x'))).toBeGreaterThan(900);
    } finally {
      window.ResizeObserver = original;
      widthSpy.mockRestore();
    }
  });

  test('given no fillWidth then the map keeps its fixed 600-unit width, as in v2', () => {
    const { container } = render(<HexagonalMap data={MOCK_UK_SHAPED_HEX_DATA} />);

    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 600 380');
  });
});
