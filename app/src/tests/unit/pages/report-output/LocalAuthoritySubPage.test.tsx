import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { LocalAuthoritySubPage } from '@/pages/report-output/LocalAuthoritySubPage';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('LocalAuthoritySubPage', () => {
  test('given UK report with local authority data then renders tabs', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(screen.getByText('Absolute change')).toBeInTheDocument();
    expect(screen.getByText('Relative change')).toBeInTheDocument();
  });

  test('given UK report with local authority data then renders absolute change by default', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by local authority')
    ).toBeInTheDocument();
  });

  test('given report without local_authority_impact field then shows not available message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(
      screen.getByText('Local authority analysis not available for this region')
    ).toBeInTheDocument();
  });

  test('given UK report then component renders without error', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });
});
