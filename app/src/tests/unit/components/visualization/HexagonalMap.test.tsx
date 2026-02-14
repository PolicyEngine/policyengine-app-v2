import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import {
  MOCK_HEX_MAP_DATA,
  MOCK_MIXED_VALUES,
  MOCK_NEGATIVE_VALUES,
  MOCK_POSITIVE_VALUES,
} from '@/tests/fixtures/components/visualization/hexMapMocks';

describe('HexagonalMap', () => {
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
});
