import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@test-utils';
import { RelativeChangeByConstituency } from '@/pages/report-output/constituency/RelativeChangeByConstituency';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
  MOCK_METADATA,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('RelativeChangeByConstituency', () => {
  test('given constituency data then renders component', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;
    const metadata = MOCK_METADATA;

    // When
    render(<RelativeChangeByConstituency output={output} metadata={metadata} />);

    // Then
    expect(
      screen.getByText('Relative Household Income Change by Constituency')
    ).toBeInTheDocument();
  });

  test('given constituency data then displays summary statistics', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;
    const metadata = MOCK_METADATA;

    // When
    render(<RelativeChangeByConstituency output={output} metadata={metadata} />);

    // Then
    // 50 + 150 = 200 gainers, 200 + 150 = 350 losers, 100 unchanged
    expect(screen.getByText(/200 constituencies gain/)).toBeInTheDocument();
    expect(screen.getByText(/350 lose/)).toBeInTheDocument();
    expect(screen.getByText(/100 unchanged/)).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;
    const metadata = MOCK_METADATA;

    // When
    render(<RelativeChangeByConstituency output={output} metadata={metadata} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders hexagonal map', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;
    const metadata = MOCK_METADATA;

    // When
    const { container } = render(
      <RelativeChangeByConstituency output={output} metadata={metadata} />
    );

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given UK metadata then uses UK country ID', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;
    const metadata = { ...MOCK_METADATA, countryId: 'uk' };

    // When
    const { container } = render(
      <RelativeChangeByConstituency output={output} metadata={metadata} />
    );

    // Then
    expect(container).toBeInTheDocument();
  });
});
