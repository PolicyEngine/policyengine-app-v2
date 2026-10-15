import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DistrictChoroplethMap } from '@/components/flagship/report/DistrictChoroplethMap';
import DistrictImpactCard, {
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
