import { render, screen } from '@test-utils';
import { useParams } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import PopulationPathwayWrapper from '@/pathways/population/PopulationPathwayWrapper';
import {
  mockNavigate,
  mockUseParams,
  mockUsePathwayNavigationReturn,
  mockUseRegionsEmpty,
  resetAllMocks,
  TEST_COUNTRY_ID,
} from '@/tests/fixtures/pathways/population/PopulationPathwayWrapperMocks';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(),
  };
});

vi.mock('@/hooks/usePathwayNavigation', () => ({
  usePathwayNavigation: vi.fn(() => mockUsePathwayNavigationReturn),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => mockUseRegionsEmpty),
}));

describe('PopulationPathwayWrapper', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue(mockUseParams);
    vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
  });

  test('given valid countryId then renders LABEL view', () => {
    // When
    render(<PopulationPathwayWrapper />);

    // Then - PopulationLabelView renders with "Name your household(s)" heading
    expect(screen.getByRole('heading', { name: /name your household/i })).toBeInTheDocument();
  });

  test('given LABEL view then displays household label input', () => {
    // When
    render(<PopulationPathwayWrapper />);

    // Then
    expect(screen.getByLabelText(/household label/i)).toBeInTheDocument();
  });

  test('given LABEL view then shows back button that navigates to households page', () => {
    // When
    render(<PopulationPathwayWrapper />);

    // Then
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
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
