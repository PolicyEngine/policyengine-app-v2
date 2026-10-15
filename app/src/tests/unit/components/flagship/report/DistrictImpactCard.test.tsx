import { act, render, screen, userEvent, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DistrictChoroplethMap } from '@/components/flagship/report/DistrictChoroplethMap';
import DistrictImpactCard, {
  districtDetailFigures,
  formatPercentShare,
  percentDecimals,
  rankedEnds,
} from '@/components/flagship/report/DistrictImpactCard';
import {
  MARYLAND_4327_DISTRICTS,
  MARYLAND_DISTRICT_LABELS,
  withTinyRelativeLoss,
} from '@/tests/fixtures/components/flagship/report/districtImpactMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const { mockUseCongressionalDistrictData } = vi.hoisted(() => ({
  mockUseCongressionalDistrictData: vi.fn(),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('@/components/flagship/report/DistrictChoroplethMap', () => ({
  DistrictChoroplethMap: vi.fn(({ visualizationType }) => (
    <div role="img" aria-label={`${visualizationType} district map`} />
  )),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

const output = createMockSocietyWideOutput({
  congressional_district_impact: {
    districts: [
      {
        district: 'AL-01',
        average_household_income_change: 120,
        relative_household_income_change: 0.01,
      },
    ],
  },
});

describe('DistrictImpactCard', () => {
  beforeEach(() => {
    mockUseCongressionalDistrictData.mockReturnValue({
      labelLookup: new Map([['AL-01', "Alabama's 1st congressional district"]]),
      stateCode: null,
      startFetch: vi.fn(),
    });
  });

  test('given the districts tab then one map is visible and its view can be changed without expanding a card', async () => {
    render(<DistrictImpactCard output={output as any} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'geographic district map' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Collapse' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Hex grid' }));
    expect(screen.getByRole('img', { name: 'hex district map' })).toBeVisible();
    expect(screen.getByText('Biggest gains (absolute)')).toBeVisible();
  });
});

describe('DistrictImpactCard with a small state reform', () => {
  beforeEach(() => {
    mockUseCongressionalDistrictData.mockReturnValue({
      labelLookup: MARYLAND_DISTRICT_LABELS,
      stateCode: 'MD',
      startFetch: vi.fn(),
    });
  });

  /** The map's formatter, as the card last handed it to the map. */
  const mapFormatValue = () =>
    vi.mocked(DistrictChoroplethMap).mock.calls.at(-1)?.[0].config?.formatValue;

  test('given relative changes of thousandths of a percent then the view tells districts apart', async () => {
    // Given
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);

    // When
    await userEvent.click(screen.getByRole('tab', { name: 'Relative' }));

    // Then
    expect(screen.getByText('0.0100%')).toBeInTheDocument();
    expect(screen.getByText('0.0016%')).toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
  });

  test('given a change that rounds to zero then it reads zero, with no minus', async () => {
    // Given
    render(
      <DistrictImpactCard districts={withTinyRelativeLoss(MARYLAND_4327_DISTRICTS, 'MD-04')} />
    );

    // When
    await userEvent.click(screen.getByRole('tab', { name: 'Relative' }));

    // Then
    expect(mapFormatValue()?.(-1e-9)).toBe('0.0000%');
    expect(screen.getByText('0.0000%')).toBeInTheDocument();
  });

  test('given eight districts then no district is ranked in both lists', () => {
    // When
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);

    // Then
    for (const label of MARYLAND_DISTRICT_LABELS.values()) {
      const shortLabel = label.replace(' congressional district', '');
      expect(screen.getAllByText(shortLabel)).toHaveLength(1);
    }
  });

  test('given no one loses then the loser view says so instead of ranking zeros', async () => {
    // Given
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);

    // When
    await userEvent.click(screen.getByRole('tab', { name: 'Loser %' }));

    // Then
    expect(screen.getByText('No district has people losing income.')).toBeInTheDocument();
    expect(screen.queryByText('Highest loser share')).not.toBeInTheDocument();
  });
});

describe('district percentages and rankings', () => {
  test.each([
    [[0.12, -0.03], 1],
    [[0.004], 2],
    [[0.0008], 3],
    [[9.98e-5, 1.62e-5], 4],
    [[1e-9], 4],
    [[0, 0], 1],
  ])('given shares %j then they read with %i decimals', (values, decimals) => {
    expect(percentDecimals(values)).toBe(decimals);
  });

  test('given a tiny negative share then it reads zero, with no minus', () => {
    expect(formatPercentShare(-0.00004, 1)).toBe('0.0%');
  });

  test('given one district then it is ranked once', () => {
    const only = { id: 'WY-01', label: "Wyoming's at-large", value: 0.01 };

    expect(rankedEnds([only])).toEqual({ top: [only], bottom: [] });
  });

  test('given twelve districts then each ranking lists five', () => {
    const sorted = Array.from({ length: 12 }, (_, i) => ({
      id: `CA-${i + 1}`,
      label: `District ${i + 1}`,
      value: 12 - i,
    }));

    const { top, bottom } = rankedEnds(sorted);

    expect(top.map((d) => d.value)).toEqual([12, 11, 10, 9, 8]);
    expect(bottom.map((d) => d.value)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('DistrictImpactCard district details', () => {
  beforeEach(() => {
    mockUseCongressionalDistrictData.mockReturnValue({
      labelLookup: MARYLAND_DISTRICT_LABELS,
      stateCode: 'MD',
      startFetch: vi.fn(),
    });
  });

  /** The props the card last handed to the map. */
  const mapProps = () => vi.mocked(DistrictChoroplethMap).mock.calls.at(-1)?.[0];

  test('given a click on a district in the map then its details show and it is outlined', () => {
    // Given
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);

    // When
    act(() => mapProps()?.onDistrictClick?.('MD-03'));

    // Then
    const details = screen.getByRole('region', {
      name: "Maryland's 3rd congressional district details",
    });
    expect(within(details).getByText('MD-03')).toBeInTheDocument();
    expect(within(details).getByText('$11')).toBeInTheDocument();
    expect(within(details).getByText('0.0100%')).toBeInTheDocument();
    expect(within(details).getByText('2.4%')).toBeInTheDocument();
    expect(within(details).getByText('0.0%')).toBeInTheDocument();
    expect(mapProps()?.selectedDistrict).toBe('MD-03');
  });

  test('given a click on a ranked district then its details show, and the close button clears them', async () => {
    // Given
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);
    const row = screen.getByRole('button', {
      name: "Show details for Maryland's 3rd",
    });

    // When
    await userEvent.click(row);

    // Then
    expect(row).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('region', { name: "Maryland's 3rd congressional district details" })
    ).toBeInTheDocument();

    // When
    await userEvent.click(screen.getByRole('button', { name: 'Close district details' }));

    // Then
    expect(screen.queryByRole('region', { name: /details/ })).not.toBeInTheDocument();
    expect(mapProps()?.selectedDistrict).toBeNull();
  });

  test('given a selected district then Escape clears it', async () => {
    // Given
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);
    act(() => mapProps()?.onDistrictClick?.('MD-05'));
    expect(screen.getByRole('region', { name: /details/ })).toBeInTheDocument();

    // When
    await userEvent.keyboard('{Escape}');

    // Then
    expect(screen.queryByRole('region', { name: /details/ })).not.toBeInTheDocument();
  });

  test('given a click on the selected district again then its details close', () => {
    // Given
    render(<DistrictImpactCard districts={MARYLAND_4327_DISTRICTS} />);
    act(() => mapProps()?.onDistrictClick?.('MD-05'));

    // When
    act(() => mapProps()?.onDistrictClick?.('MD-05'));

    // Then
    expect(screen.queryByRole('region', { name: /details/ })).not.toBeInTheDocument();
  });
});

describe('districtDetailFigures', () => {
  test('given every field then each figure is listed', () => {
    expect(
      districtDetailFigures({
        district: 'CA-52',
        average_household_income_change: -612.88,
        relative_household_income_change: -0.041,
        winner_percentage: 0.12,
        loser_percentage: 0.53,
        no_change_percentage: 0.35,
      })
    ).toEqual([
      { label: 'Average household income change', value: '-$613' },
      { label: 'Relative household income change', value: '-4.1%' },
      { label: 'People gaining income', value: '12.0%' },
      { label: 'People losing income', value: '53.0%' },
      { label: 'People with no change', value: '35.0%' },
    ]);
  });

  test('given a stored district with only its average change then only that is listed', () => {
    expect(
      districtDetailFigures({ district: 'WY-01', average_household_income_change: -0.2 })
    ).toEqual([{ label: 'Average household income change', value: '$0' }]);
  });
});
