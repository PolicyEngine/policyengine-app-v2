import { describe, test, expect, vi } from 'vitest';
import { render } from '@test-utils';
import { HexagonalMap } from '@/components/visualization/HexagonalMap';
import {
  MOCK_HEX_MAP_DATA,
  MOCK_POSITIVE_VALUES,
  MOCK_NEGATIVE_VALUES,
  MOCK_MIXED_VALUES,
} from '@/tests/fixtures/components/visualization/hexMapMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('HexagonalMap', () => {
  test('given minimal data then renders without crashing', () => {
    // Given
    const data = [{ id: '1', label: 'Test', value: 100, x: 0, y: 0 }];

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given empty data then renders without crashing', () => {
    // Given
    const data: any[] = [];

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given standard constituency data then renders', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given positive values then renders', () => {
    // Given
    const data = MOCK_POSITIVE_VALUES;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given negative values then renders', () => {
    // Given
    const data = MOCK_NEGATIVE_VALUES;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given mixed positive and negative values then renders', () => {
    // Given
    const data = MOCK_MIXED_VALUES;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given custom height config then renders', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = { height: 800 };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given custom hex size then renders', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = { hexSize: 20 };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given custom format function then renders', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = {
      formatValue: (val: number) => `£${val.toFixed(0)}`,
    };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given symmetric color scale config then renders', () => {
    // Given
    const data = MOCK_MIXED_VALUES;
    const config = {
      colorScale: {
        colors: ['#000000', '#FFFFFF'],
        tickFormat: ',.0f',
        symmetric: true,
      },
    };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given asymmetric color scale config then renders', () => {
    // Given
    const data = MOCK_POSITIVE_VALUES;
    const config = {
      colorScale: {
        colors: ['#000000', '#FFFFFF'],
        tickFormat: ',.0f',
        symmetric: false,
      },
    };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given show color bar false then renders', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = { showColorBar: false };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given data then renders component', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;

    // When
    const { container } = render(<HexagonalMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given layout overrides then renders', () => {
    // Given
    const data = MOCK_HEX_MAP_DATA;
    const config = {
      layoutOverrides: {
        title: { text: 'Custom Title' },
      },
    };

    // When
    const { container } = render(<HexagonalMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
