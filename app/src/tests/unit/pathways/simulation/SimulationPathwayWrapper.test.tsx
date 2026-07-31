import { render, screen } from '@test-utils';
import { useParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import { useUserGeographics } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import SimulationPathwayWrapper from '@/pathways/simulation/SimulationPathwayWrapper';
import {
  mockMetadata,
  mockNavigate,
  mockOnComplete,
  mockUseCreateSimulation,
  mockUseParams,
  mockUseUserGeographics,
  mockUseUserHouseholds,
  mockUseUserPolicies,
  resetAllMocks,
  TEST_COUNTRY_ID,
} from '@/tests/fixtures/pathways/simulation/SimulationPathwayWrapperMocks';
import { mockUSRegionRecords } from '@/tests/fixtures/utils/regionStrategiesMocks';
import { SimulationViewMode } from '@/types/pathwayModes/SimulationViewMode';
import * as simulationStateInitializer from '@/utils/pathwayState/initializeSimulationState';

const { mockUsePathwayNavigation } = vi.hoisted(() => ({
  mockUsePathwayNavigation: vi.fn(),
}));

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
  usePathwayNavigation: (...args: unknown[]) => mockUsePathwayNavigation(...args),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

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
    vi.mocked(useRegions).mockReturnValue({
      data: mockUSRegionRecords,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRegions>);
    mockUsePathwayNavigation.mockReturnValue({
      currentMode: SimulationViewMode.LABEL,
      navigateToMode: vi.fn(),
      goBack: vi.fn(),
      canGoBack: false,
      getBackMode: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error handling', () => {
    test('given missing countryId param then shows error message', () => {
      // Given
      vi.mocked(useParams).mockReturnValue({});
      vi.mocked(useCurrentCountry).mockImplementation(() => {
        throw new Error(
          'useCurrentCountry must be used within country routes (protected by CountryGuard). Got countryId: undefined'
        );
      });

      // When/Then - Should throw error since CountryGuard would prevent this in real app
      expect(() => render(<SimulationPathwayWrapper />)).toThrow(
        'useCurrentCountry must be used within country routes'
      );
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

  test('given a selected policy later errors then blocks submission with the shared error icon', () => {
    vi.spyOn(simulationStateInitializer, 'initializeSimulationState').mockReturnValue({
      id: undefined,
      label: 'Saved simulation',
      countryId: TEST_COUNTRY_ID,
      policy: {
        id: 'broken-policy',
        label: 'Broken policy',
        parameters: [],
      },
      population: {
        label: 'Nationwide',
        type: 'geography',
        household: null,
        geography: {
          id: 'us',
          geographyId: 'us',
          countryId: 'us',
          scope: 'national',
          name: 'United States',
        },
      },
    });
    vi.mocked(useUserPolicies).mockReturnValue({
      data: [
        {
          association: {
            id: 'broken-association',
            userId: 'anonymous',
            policyId: 'broken-policy',
            countryId: 'us',
            label: 'Broken policy',
          },
          policy: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Policy request failed'),
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUserPolicies>);
    mockUsePathwayNavigation.mockReturnValue({
      currentMode: SimulationViewMode.SUBMIT,
      navigateToMode: vi.fn(),
      goBack: vi.fn(),
      canGoBack: true,
      getBackMode: vi.fn(),
    });

    render(<SimulationPathwayWrapper />);

    expect(screen.getByLabelText('Error loading this policy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create simulation/i })).toBeDisabled();
    expect(mockUseCreateSimulation.createSimulation).not.toHaveBeenCalled();
  });
});
