import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { RelativeChangeByDistrict } from '@/pages/report-output/congressional-district/RelativeChangeByDistrict';
import {
  MOCK_CONGRESSIONAL_DISTRICT_REGIONS,
  MOCK_US_REPORT_OUTPUT,
  MOCK_US_REPORT_OUTPUT_NO_DISTRICT,
  TEST_COUNTRY_US,
} from '@/tests/fixtures/pages/congressional-district/congressionalDistrictComponentMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock static metadata hooks to provide region data
vi.mock('@/hooks/useStaticMetadata', () => ({
  useRegionsList: vi.fn(() => MOCK_CONGRESSIONAL_DISTRICT_REGIONS),
}));

// Mock useCurrentCountry hook
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => TEST_COUNTRY_US),
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

  test('given no district data then shows no data message', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT_NO_DISTRICT;

    // When
    render(<RelativeChangeByDistrict output={output} />);

    // Then
    expect(screen.getByText('No congressional district data available')).toBeInTheDocument();
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
