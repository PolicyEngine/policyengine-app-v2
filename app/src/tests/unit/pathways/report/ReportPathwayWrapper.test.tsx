import { render, screen } from '@test-utils';
import { useParams } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useUserGeographics } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import ReportPathwayWrapper from '@/pathways/report/ReportPathwayWrapper';
import {
  mockMetadata,
  mockNavigate,
  mockOnComplete,
  mockUseCreateReport,
  mockUseParams,
  mockUseParamsInvalid,
  mockUseParamsMissing,
  mockUseUserGeographics,
  mockUseUserHouseholds,
  mockUseUserPolicies,
  mockUseUserSimulations,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/ReportPathwayWrapperMocks';

// Mock all dependencies
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

vi.mock('@/hooks/useUserSimulations', () => ({
  useUserSimulations: vi.fn(),
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

vi.mock('@/hooks/useCreateReport', () => ({
  useCreateReport: vi.fn(),
}));

vi.mock('@/hooks/usePathwayNavigation', () => ({
  usePathwayNavigation: vi.fn(() => ({
    mode: 'LABEL',
    navigateToMode: vi.fn(),
    goBack: vi.fn(),
    getBackMode: vi.fn(),
  })),
}));

describe('ReportPathwayWrapper', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useParams).mockReturnValue(mockUseParams);
    vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulations);
    vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPolicies);
    vi.mocked(useUserHouseholds).mockReturnValue(mockUseUserHouseholds);
    vi.mocked(useUserGeographics).mockReturnValue(mockUseUserGeographics);
    vi.mocked(useCreateReport).mockReturnValue(mockUseCreateReport);
  });

  describe('Error handling', () => {
    test('given missing countryId param then shows error message', () => {
      // Given
      vi.mocked(useParams).mockReturnValue(mockUseParamsMissing);

      // When
      render(<ReportPathwayWrapper />);

      // Then
      expect(screen.getByText(/Country ID not found/i)).toBeInTheDocument();
    });

    test('given invalid countryId then shows error message', () => {
      // Given
      vi.mocked(useParams).mockReturnValue(mockUseParamsInvalid);

      // When
      render(<ReportPathwayWrapper />);

      // Then
      expect(screen.getByText(/Invalid country ID/i)).toBeInTheDocument();
    });
  });

  describe('Basic rendering', () => {
    test('given valid countryId then renders without error', () => {
      // When
      const { container } = render(<ReportPathwayWrapper />);

      // Then - Should render something (not just error message)
      expect(container).toBeInTheDocument();
      expect(screen.queryByText(/Country ID not found/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Invalid country ID/i)).not.toBeInTheDocument();
    });

    test('given wrapper renders then initializes with hooks', () => {
      // When
      render(<ReportPathwayWrapper />);

      // Then - Hooks should have been called (useUserPolicies is used in child components, not wrapper)
      expect(useUserSimulations).toHaveBeenCalled();
      expect(useUserHouseholds).toHaveBeenCalled();
      expect(useUserGeographics).toHaveBeenCalled();
      expect(useCreateReport).toHaveBeenCalled();
    });
  });

  describe('Props handling', () => {
    test('given onComplete callback then accepts prop', () => {
      // When
      const { container } = render(<ReportPathwayWrapper onComplete={mockOnComplete} />);

      // Then - Component renders with callback
      expect(container).toBeInTheDocument();
    });

    test('given no onComplete callback then renders without error', () => {
      // When
      const { container } = render(<ReportPathwayWrapper />);

      // Then
      expect(container).toBeInTheDocument();
    });
  });

  describe('State initialization', () => {
    test('given wrapper renders then initializes report state with country', () => {
      // When
      render(<ReportPathwayWrapper />);

      // Then - No errors, component initialized successfully
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});
