import { fireEvent, render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { StandaloneCongressionalDistrictCard } from '@/pages/report-output/SocietyWideOverview';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const { mockUseCongressionalDistrictData } = vi.hoisted(() => ({
  mockUseCongressionalDistrictData: vi.fn(),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  useCongressionalDistrictData: mockUseCongressionalDistrictData,
}));

vi.mock('@/components/visualization/USDistrictChoroplethMap', () => ({
  USDistrictChoroplethMap: vi.fn(() => <div data-testid="district-map" />),
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

describe('StandaloneCongressionalDistrictCard', () => {
  beforeEach(() => {
    mockUseCongressionalDistrictData.mockReturnValue({
      labelLookup: new Map([['AL-01', "Alabama's 1st congressional district"]]),
      stateCode: null,
      startFetch: vi.fn(),
    });
  });

  test('given the flagship districts section then the card opens expanded and collapses on demand', () => {
    render(<StandaloneCongressionalDistrictCard output={output as any} />);

    const collapse = screen.getByRole('button', { name: 'Collapse' });
    fireEvent.click(collapse);

    expect(screen.getByRole('button', { name: 'See detailed analysis' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collapse' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'See detailed analysis' }));

    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });
});
