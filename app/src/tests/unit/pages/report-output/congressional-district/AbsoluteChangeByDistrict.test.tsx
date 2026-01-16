import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { AbsoluteChangeByDistrict } from '@/pages/report-output/congressional-district/AbsoluteChangeByDistrict';
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

describe('AbsoluteChangeByDistrict', () => {
  test('given district data then renders component', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT;

    // When
    render(<AbsoluteChangeByDistrict output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by congressional district')
    ).toBeInTheDocument();
  });

  test('given no district data then shows no data message', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT_NO_DISTRICT;

    // When
    render(<AbsoluteChangeByDistrict output={output} />);

    // Then
    expect(screen.getByText('No congressional district data available')).toBeInTheDocument();
  });

  test('given district data then renders choropleth map', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT;

    // When
    const { container } = render(<AbsoluteChangeByDistrict output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given US report output then component renders without error', () => {
    // Given
    const output = MOCK_US_REPORT_OUTPUT;

    // When
    const { container } = render(<AbsoluteChangeByDistrict output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
