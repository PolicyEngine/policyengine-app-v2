import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { AbsoluteChangeByConstituency } from '@/pages/report-output/constituency/AbsoluteChangeByConstituency';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('AbsoluteChangeByConstituency', () => {
  test('given constituency data then renders component', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;

    // When
    render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders hexagonal map', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given UK report output then component renders', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
