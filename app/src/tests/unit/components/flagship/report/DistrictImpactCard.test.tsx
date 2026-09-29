import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DistrictImpactCard from '@/components/flagship/report/DistrictImpactCard';
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
