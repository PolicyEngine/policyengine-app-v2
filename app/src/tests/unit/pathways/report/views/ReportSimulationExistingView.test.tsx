import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import ReportSimulationExistingView from '@/pathways/report/views/ReportSimulationExistingView';
import {
  mockEnhancedUserSimulation,
  mockOnBack,
  mockOnCancel,
  mockOnNext,
  mockOnSelectSimulation,
  mockSimulationState,
  mockUseUserSimulationsEmpty,
  mockUseUserSimulationsError,
  mockUseUserSimulationsLoading,
  mockUseUserSimulationsWithData,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/ReportViewMocks';

// Mock hooks for country context and regions
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => ({
    regions: [],
    isLoading: false,
    error: null,
    rawRegions: [],
  })),
}));

vi.mock('@/hooks/useUserSimulations', () => ({
  useUserSimulations: vi.fn(),
}));

describe('ReportSimulationExistingView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    test('given loading then displays loading message', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsLoading as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/loading simulations/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    test('given error then displays error message', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsError as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load simulations/i)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    test('given no simulations then displays no simulations message', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/no simulations available/i)).toBeInTheDocument();
    });

    test('given no simulations then next button is disabled', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('With simulations', () => {
    test('given simulations available then displays simulation cards', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/my simulation/i)).toBeInTheDocument();
    });

    test('given simulations available then next button initially disabled', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('User interactions', () => {
    test('given user selects simulation then next button is enabled', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );
      const simulationCard = screen.getByText(/my simulation/i).closest('button');

      // When
      await user.click(simulationCard!);

      // Then
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });

    test('given user selects and submits then calls callbacks', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );
      const simulationCard = screen.getByText(/my simulation/i).closest('button');

      // When
      await user.click(simulationCard!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Then
      expect(mockOnSelectSimulation).toHaveBeenCalledWith(mockEnhancedUserSimulation);
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Population compatibility', () => {
    test('given incompatible population then simulation is disabled', () => {
      // Given
      const otherSim = {
        ...mockSimulationState,
        population: {
          ...mockSimulationState.population,
          household: {
            id: 'different-household-999',
            tax_benefit_model_name: 'policyengine_us' as const,
            year: 2025,
            people: [],
          },
        },
      };
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={1}
          otherSimulation={otherSim}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/incompatible/i)).toBeInTheDocument();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationExistingView
          activeSimulationIndex={0}
          otherSimulation={null}
          onSelectSimulation={mockOnSelectSimulation}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
