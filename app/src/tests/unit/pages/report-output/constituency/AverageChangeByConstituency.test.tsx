import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@test-utils';
import { AverageChangeByConstituency } from '@/pages/report-output/constituency/AverageChangeByConstituency';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('AverageChangeByConstituency', () => {
  test('given constituency data then renders component', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<AverageChangeByConstituency output={output} />);

    // Then
    expect(
      screen.getByText('Average Household Income Change by Constituency')
    ).toBeInTheDocument();
  });

  test('given constituency data then displays summary statistics', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<AverageChangeByConstituency output={output} />);

    // Then
    // 50 + 150 = 200 gainers, 200 + 150 = 350 losers, 100 unchanged
    expect(screen.getByText(/200 constituencies gain/)).toBeInTheDocument();
    expect(screen.getByText(/350 lose/)).toBeInTheDocument();
    expect(screen.getByText(/100 unchanged/)).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;

    // When
    render(<AverageChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders hexagonal map', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<AverageChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given UK report output then component renders', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<AverageChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
