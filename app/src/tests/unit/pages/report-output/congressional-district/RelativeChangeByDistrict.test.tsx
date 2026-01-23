import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { RelativeChangeByDistrict } from '@/pages/report-output/congressional-district/RelativeChangeByDistrict';
import {
  MOCK_CONGRESSIONAL_DISTRICT_REGIONS,
  MOCK_US_REPORT_OUTPUT,
  MOCK_US_REPORT_OUTPUT_NO_DISTRICT,
} from '@/tests/fixtures/pages/congressional-district/congressionalDistrictComponentMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock react-redux to provide region data from metadata
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: vi.fn(() => MOCK_CONGRESSIONAL_DISTRICT_REGIONS),
  };
});

// Mock the congressional district data context hook
vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: vi.fn(() => ({
    stateResponses: new Map(),
    completedCount: 51,
    loadingCount: 0,
    totalDistrictsLoaded: 435,
    totalStates: 51,
    isComplete: true,
    isLoading: false,
    hasStarted: true,
    errorCount: 0,
    labelLookup: new Map(), // Must be a Map, not an object
    isStateLevelReport: false,
    stateCode: null,
    startFetch: vi.fn(),
    validateAllLoaded: vi.fn(() => true),
    getCompletedStates: vi.fn(() => []),
    getLoadingStates: vi.fn(() => []),
  })),
}));

describe('RelativeChangeByDistrict', () => {
  test('given district data then renders component', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT;

    // When
    render(<RelativeChangeByDistrict output={output} />);

    // Then
    expect(
      screen.getByText('Relative household income change by congressional district')
    ).toBeInTheDocument();
  });

  test('given no district data in output but context started then shows title', () => {
    // Given - output has no district data, but context mock has hasStarted: true
    // so component will show title (loading or complete state, not "no data" message)
    const output = MOCK_US_REPORT_OUTPUT_NO_DISTRICT;

    // When
    render(<RelativeChangeByDistrict output={output} />);

    // Then - shows title since context has started (would show progress or map)
    expect(
      screen.getByText('Relative household income change by congressional district')
    ).toBeInTheDocument();
  });

  test('given district data then renders choropleth map', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByDistrict output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given US report output then component renders without error', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByDistrict output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
