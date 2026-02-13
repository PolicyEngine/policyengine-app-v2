import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSetupView from '@/pathways/report/views/simulation/SimulationSetupView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnNavigateToPolicy,
  mockOnNavigateToPopulation,
  mockOnNext,
  mockSimulationStateConfigured,
  mockSimulationStateEmpty,
  mockSimulationStateWithPolicy,
  mockSimulationStateWithPopulation,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/SimulationViewMocks';

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

describe('SimulationSetupView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    test('given component renders then displays title', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /configure simulation/i })).toBeInTheDocument();
    });

    test('given empty simulation then displays add household card', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/add household\(s\)/i)).toBeInTheDocument();
    });

    test('given empty simulation then displays add policy card', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/add policy/i)).toBeInTheDocument();
    });
  });

  describe('Configured simulation', () => {
    test('given fully configured simulation then shows policy label', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateConfigured}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/current law/i)).toBeInTheDocument();
    });

    test('given fully configured simulation then shows population label', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateConfigured}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/my household/i)).toBeInTheDocument();
    });

    test('given fully configured simulation then Next button is enabled', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateConfigured}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });
  });

  describe('Partial configuration', () => {
    test('given only policy configured then primary button is disabled', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateWithPolicy}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      const buttons = screen.getAllByRole('button');
      const configureButton = buttons.find((btn) =>
        btn.textContent?.includes('Configure household')
      );
      expect(configureButton).toBeDisabled();
    });

    test('given only population configured then primary button is disabled', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateWithPopulation}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      const buttons = screen.getAllByRole('button');
      const configureButton = buttons.find((btn) =>
        btn.textContent?.includes('Configure household')
      );
      expect(configureButton).toBeDisabled();
    });
  });

  describe('Report mode simulation 2', () => {
    test('given report mode sim 2 with population then shows from baseline', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateWithPopulation}
          simulationIndex={1}
          isReportMode
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getAllByText(/from baseline/i).length).toBeGreaterThan(0);
    });

    test('given report mode sim 2 with population then shows inherited message', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateWithPopulation}
          simulationIndex={1}
          isReportMode
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByText(/inherited from baseline/i)).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    test('given user selects population card then enables configure button', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );
      const cards = screen.getAllByRole('button');
      const populationCard = cards.find((card) => card.textContent?.includes('Add household'));

      // When
      await user.click(populationCard!);

      // Then
      const configureButton = screen.getByRole('button', { name: /configure household/i });
      expect(configureButton).not.toBeDisabled();
    });

    test('given user configures population and submits then calls onNavigateToPopulation', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );
      const cards = screen.getAllByRole('button');
      const populationCard = cards.find((card) => card.textContent?.includes('Add household'));

      // When
      await user.click(populationCard!);
      await user.click(screen.getByRole('button', { name: /configure household/i }));

      // Then
      expect(mockOnNavigateToPopulation).toHaveBeenCalled();
    });

    test('given fully configured and Next clicked then calls onNext', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <SimulationSetupView
          simulation={mockSimulationStateConfigured}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Then
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // When
      render(
        <SimulationSetupView
          simulation={mockSimulationStateEmpty}
          simulationIndex={0}
          isReportMode={false}
          onNavigateToPolicy={mockOnNavigateToPolicy}
          onNavigateToPopulation={mockOnNavigateToPopulation}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
