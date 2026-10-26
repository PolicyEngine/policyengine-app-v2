import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RelativeChangeByLocalAuthority } from '@/pages/report-output/local-authority/RelativeChangeByLocalAuthority';
import { UK_LOCAL_AREAS_OUTPUT } from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  CARDIFF_CODE,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_DATA,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import { withNullAreaImpacts } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

beforeEach(() => {
  vi.stubGlobal('fetch', mockUKBoundaryFetch());
});

describe('RelativeChangeByLocalAuthority', () => {
  test('given local authority data then renders component', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<RelativeChangeByLocalAuthority output={output} />);

    // Then
    expect(
      screen.getByText('Relative household income change by local authority')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given no local authority data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_LA_DATA;

    // When
    render(<RelativeChangeByLocalAuthority output={output} />);

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });

  test('given local authority data then renders the geographic map', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<RelativeChangeByLocalAuthority output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given UK report output then component renders', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<RelativeChangeByLocalAuthority output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test.each([
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
  ])('given %s local authority impacts then shows no data message', (_label, output) => {
    // When
    render(<RelativeChangeByLocalAuthority output={output} />);

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
  });
});

describe('RelativeChangeByLocalAuthority map type', () => {
  test('given local authority data then the geographic map is the default', async () => {
    // When
    const { container } = render(<RelativeChangeByLocalAuthority output={UK_LOCAL_AREAS_OUTPUT} />);

    // Then
    expect(screen.getByRole('tab', { name: 'Geographic', selected: true })).toBeInTheDocument();
    expect(await screen.findByTestId(`area-${CARDIFF_CODE}`)).toBeInTheDocument();
    expect(container.querySelector('svg polygon')).not.toBeInTheDocument();
  });

  test('given Hex grid chosen then the hex map replaces the geographic map', async () => {
    // Given
    const user = userEvent.setup();
    const { container } = render(<RelativeChangeByLocalAuthority output={UK_LOCAL_AREAS_OUTPUT} />);
    await screen.findByTestId(`area-${CARDIFF_CODE}`);

    // When
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

    // Then
    expect(container.querySelectorAll('svg polygon')).toHaveLength(2);
    expect(screen.queryByTestId(`area-${CARDIFF_CODE}`)).not.toBeInTheDocument();
  });
});
