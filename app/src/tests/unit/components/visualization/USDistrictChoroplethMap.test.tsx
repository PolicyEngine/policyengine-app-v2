import { render } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { USDistrictChoroplethMap } from '@/components/visualization/USDistrictChoroplethMap';
import {
  MOCK_DISTRICT_CHOROPLETH_DATA,
  MOCK_GEOJSON_FEATURE_COLLECTION,
  MOCK_MIXED_VALUES,
  MOCK_NEGATIVE_VALUES,
  MOCK_POSITIVE_VALUES,
} from '@/tests/fixtures/components/visualization/usDistrictChoroplethMapMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock fetch to return GeoJSON data
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('USDistrictChoroplethMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GEOJSON_FEATURE_COLLECTION),
    });
  });

  test('given minimal data then renders without crashing', async () => {
    // Given
    const data = [{ geoId: 'AL-01', label: 'Test District', value: 100 }];

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given empty data then renders without crashing', async () => {
    // Given
    const data: any[] = [];

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given standard district data then renders', async () => {
    // Given
    const data = MOCK_DISTRICT_CHOROPLETH_DATA;

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given positive values then renders', async () => {
    // Given
    const data = MOCK_POSITIVE_VALUES;

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given negative values then renders', async () => {
    // Given
    const data = MOCK_NEGATIVE_VALUES;

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given mixed positive and negative values then renders', async () => {
    // Given
    const data = MOCK_MIXED_VALUES;

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given custom height config then renders', async () => {
    // Given
    const data = MOCK_DISTRICT_CHOROPLETH_DATA;
    const config = { height: 800 };

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given custom format function then renders', async () => {
    // Given
    const data = MOCK_DISTRICT_CHOROPLETH_DATA;
    const config = {
      formatValue: (val: number) => `$${val.toFixed(0)}`,
    };

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given symmetric color scale config then renders', async () => {
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
    const { container } = render(<USDistrictChoroplethMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given show color bar false then renders', async () => {
    // Given
    const data = MOCK_DISTRICT_CHOROPLETH_DATA;
    const config = { showColorBar: false };

    // When
    const { container } = render(<USDistrictChoroplethMap data={data} config={config} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
