import { render, screen } from '@test-utils';
import { useParams } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import PopulationPathwayWrapper from '@/pathways/population/PopulationPathwayWrapper';
import { mockUSRegionRecords } from '@/tests/fixtures/utils/regionStrategiesMocks';

const mockNavigate = vi.fn();
const mockUseParams = { countryId: 'us' };
const mockMetadata = { currentLawId: 1, economyOptions: { region: [] } };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(),
  };
});

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: vi.fn(() => mockMetadata),
  };
});

vi.mock('@/hooks/useUserHousehold', () => ({
  useCreateHousehold: vi.fn(() => ({ createHousehold: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useCreateGeographicAssociation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/usePathwayNavigation', () => ({
  usePathwayNavigation: vi.fn(() => ({
    mode: 'SCOPE',
    navigateToMode: vi.fn(),
    goBack: vi.fn(),
  })),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

describe('PopulationPathwayWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue(mockUseParams);
    vi.mocked(useCurrentCountry).mockReturnValue('us');
    vi.mocked(useRegions).mockReturnValue({
      data: mockUSRegionRecords,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRegions>);
  });

  test('given valid countryId then renders without error', () => {
    // When
    const { container } = render(<PopulationPathwayWrapper />);

    // Then
    expect(container).toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  test('given missing countryId then throws error', () => {
    // Given
    vi.mocked(useParams).mockReturnValue({});
    vi.mocked(useCurrentCountry).mockImplementation(() => {
      throw new Error(
        'useCurrentCountry must be used within country routes (protected by CountryGuard). Got countryId: undefined'
      );
    });

    // When/Then - Should throw error since CountryGuard would prevent this in real app
    expect(() => render(<PopulationPathwayWrapper />)).toThrow(
      'useCurrentCountry must be used within country routes'
    );
  });
});
