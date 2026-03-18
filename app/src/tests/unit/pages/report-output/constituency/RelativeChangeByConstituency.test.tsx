import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { RelativeChangeByConstituency } from '@/pages/report-output/constituency/RelativeChangeByConstituency';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';

describe('RelativeChangeByConstituency', () => {
  test('given constituency data then renders component', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(
      screen.getByText('Relative household income change by constituency')
    ).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;

    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders hexagonal map', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given UK report output then component renders', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
