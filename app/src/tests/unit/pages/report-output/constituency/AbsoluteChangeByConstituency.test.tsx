import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { AbsoluteChangeByConstituency } from '@/pages/report-output/constituency/AbsoluteChangeByConstituency';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';
import { withNullAreaImpacts } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

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

  test.each([
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
  ])('given %s constituency impacts then shows no data message', (_label, output) => {
    // When
    render(<AbsoluteChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given withheld constituencies then the chart says how many were not published', () => {
    // When
    render(
      <AbsoluteChangeByConstituency
        output={MOCK_UK_REPORT_OUTPUT}
        withheld={{ withheld: 12, total: 650 }}
      />
    );

    // Then
    expect(screen.getByText(/^12 of 650 constituencies are not shown\./)).toBeInTheDocument();
  });

  test('given a saved result then the chart has no disclosure note', () => {
    // When
    render(<AbsoluteChangeByConstituency output={MOCK_UK_REPORT_OUTPUT} />);

    // Then
    expect(screen.queryByText(/not shown/)).not.toBeInTheDocument();
  });
});
