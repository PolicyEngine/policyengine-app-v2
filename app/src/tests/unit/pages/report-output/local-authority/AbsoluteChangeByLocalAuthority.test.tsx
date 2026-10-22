import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { AbsoluteChangeByLocalAuthority } from '@/pages/report-output/local-authority/AbsoluteChangeByLocalAuthority';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_DATA,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import { withNullAreaImpacts } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

describe('AbsoluteChangeByLocalAuthority', () => {
  test('given local authority data then renders component', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by local authority')
    ).toBeInTheDocument();
  });

  test('given no local authority data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_LA_DATA;

    // When
    render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });

  test('given local authority data then renders hexagonal map', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test('given UK report output then component renders', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  test.each([
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
  ])('given %s local authority impacts then shows no data message', (_label, output) => {
    // When
    render(<AbsoluteChangeByLocalAuthority output={output} />);

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });
});
