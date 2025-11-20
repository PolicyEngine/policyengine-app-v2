import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import SimulationPathwayWrapper from '@/pathways/simulation/SimulationPathwayWrapper';
import {
  TEST_COUNTRY_ID,
  mockNavigate,
  mockOnComplete,
  mockUseParams,
  mockMetadata,
  mockUseCreateSimulation,
  mockUseUserPolicies,
  mockUseUserHouseholds,
  mockUseUserGeographics,
  resetAllMocks,
} from '@/tests/fixtures/pathways/simulation/SimulationPathwayWrapperMocks';

// Mock dependencies
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
    useSelector: vi.fn((selector) => {
      if (selector.toString().includes('currentLawId')) {
        return mockMetadata.currentLawId;
      }
      return mockMetadata;
    }),
  };
});

vi.mock('@/hooks/useCreateSimulation', () => ({
  useCreateSimulation: vi.fn(),
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: vi.fn(),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: vi.fn(),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: vi.fn(),
}));

vi.mock('@/hooks/usePathwayNavigation', () => ({
  usePathwayNavigation: vi.fn(() => ({
    mode: 'LABEL',
    navigateToMode: vi.fn(),
    goBack: vi.fn(),
    getBackMode: vi.fn(),
  })),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

import { useParams } from 'react-router-dom';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserGeographics } from '@/hooks/useUserGeographic';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

describe('SimulationPathwayWrapper', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();

    vi.mocked(useParams).mockReturnValue(mockUseParams);
    vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
    vi.mocked(useCreateSimulation).mockReturnValue(mockUseCreateSimulation);
    vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPolicies);
    vi.mocked(useUserHouseholds).mockReturnValue(mockUseUserHouseholds);
    vi.mocked(useUserGeographics).mockReturnValue(mockUseUserGeographics);
  });

  describe('Error handling', () => {
    test('given missing countryId param then shows error message', () => {
      // Given
      vi.mocked(useParams).mockReturnValue({});
      vi.mocked(useCurrentCountry).mockImplementation(() => {
        throw new Error('useCurrentCountry must be used within country routes (protected by CountryGuard). Got countryId: undefined');
      });

      // When/Then - Should throw error since CountryGuard would prevent this in real app
      expect(() => render(<SimulationPathwayWrapper />)).toThrow('useCurrentCountry must be used within country routes');
    });
  });

  describe('Basic rendering', () => {
    test('given valid countryId then renders without error', () => {
      // When
      const { container } = render(<SimulationPathwayWrapper />);

      // Then
      expect(container).toBeInTheDocument();
      expect(screen.queryByText(/Country ID not found/i)).not.toBeInTheDocument();
    });

    test('given wrapper renders then initializes with hooks', () => {
      // Given - Clear previous calls before this specific test
      vi.clearAllMocks();
      vi.mocked(useParams).mockReturnValue(mockUseParams);
      vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPolicies);
      vi.mocked(useUserHouseholds).mockReturnValue(mockUseUserHouseholds);
      vi.mocked(useUserGeographics).mockReturnValue(mockUseUserGeographics);

      // When
      render(<SimulationPathwayWrapper />);

      // Then
      expect(useUserPolicies).toHaveBeenCalled();
      expect(useUserHouseholds).toHaveBeenCalled();
      expect(useUserGeographics).toHaveBeenCalled();
    });
  });

  describe('Props handling', () => {
    test('given onComplete callback then accepts prop', () => {
      // When
      const { container } = render(<SimulationPathwayWrapper onComplete={mockOnComplete} />);

      // Then
      expect(container).toBeInTheDocument();
    });
  });
});
