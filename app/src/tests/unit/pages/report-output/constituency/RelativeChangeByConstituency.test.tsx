import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RelativeChangeByConstituency } from '@/pages/report-output/constituency/RelativeChangeByConstituency';
import { UK_LOCAL_AREAS_OUTPUT } from '@/tests/fixtures/components/flagship/report/ukLocalAreaMapsMocks';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  GOWER_CODE,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import {
  MOCK_UK_REPORT_OUTPUT,
  MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY,
} from '@/tests/fixtures/pages/constituency/constituencyComponentMocks';
import { withNullAreaImpacts } from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

beforeEach(() => {
  vi.stubGlobal('fetch', mockUKBoundaryFetch());
});

describe('RelativeChangeByConstituency', () => {
  test('given constituency data then renders component', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(
      screen.getByText('Relative household income change by constituency')
    ).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given no constituency data then shows no data message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY;

    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });

  test('given constituency data then renders the geographic map', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given UK report output then component renders', async () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT;

    // When
    const { container } = render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(container).toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test.each([
    ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
  ])('given %s constituency impacts then shows no data message', (_label, output) => {
    // When
    render(<RelativeChangeByConstituency output={output} />);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
  });
});

describe('RelativeChangeByConstituency map type', () => {
  test('given constituency data then the geographic map is the default', async () => {
    // When
    const { container } = render(<RelativeChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} />);

    // Then
    expect(screen.getByRole('tab', { name: 'Geographic', selected: true })).toBeInTheDocument();
    expect(await screen.findByTestId(`area-${GOWER_CODE}`)).toBeInTheDocument();
    expect(container.querySelector('svg polygon')).not.toBeInTheDocument();
  });

  test('given Hex grid chosen then the hex map replaces the geographic map', async () => {
    // Given
    const user = userEvent.setup();
    const { container } = render(<RelativeChangeByConstituency output={UK_LOCAL_AREAS_OUTPUT} />);
    await screen.findByTestId(`area-${GOWER_CODE}`);

    // When
    await user.click(screen.getByRole('tab', { name: 'Hex grid' }));

    // Then
    expect(container.querySelectorAll('svg polygon')).toHaveLength(3);
    expect(screen.queryByTestId(`area-${GOWER_CODE}`)).not.toBeInTheDocument();
  });
});
