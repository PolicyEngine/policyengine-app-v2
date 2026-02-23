import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useUserGeographics } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import ReportSetupView from '@/pathways/report/views/ReportSetupView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnNavigateToSimulationSelection,
  mockOnNext,
  mockOnPrefillPopulation2,
  mockReportState,
  mockReportStateWithBothConfigured,
  mockReportStateWithConfiguredBaseline,
  mockUseUserGeographicsEmpty,
  mockUseUserHouseholdsEmpty,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/ReportViewMocks';

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: vi.fn(),
  isHouseholdMetadataWithAssociation: vi.fn(),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useUserGeographics: vi.fn(),
  isGeographicMetadataWithAssociation: vi.fn(),
}));

describe('ReportSetupView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    vi.mocked(useUserHouseholds).mockReturnValue(mockUseUserHouseholdsEmpty);
    vi.mocked(useUserGeographics).mockReturnValue(mockUseUserGeographicsEmpty);
  });

  describe('Basic rendering', () => {
    test('given component renders then displays title', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /configure report/i })).toBeInTheDocument();
    });

    test('given component renders then displays baseline simulation card', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then - Multiple "Baseline simulation" texts exist, just verify at least one
      expect(screen.getAllByText(/baseline simulation/i).length).toBeGreaterThan(0);
    });

    test('given component renders then displays comparison simulation card', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      expect(screen.getByText(/comparison simulation/i)).toBeInTheDocument();
    });
  });

  describe('Unconfigured simulations', () => {
    test('given no simulations configured then comparison card shows waiting message', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      expect(screen.getByText(/waiting for baseline/i)).toBeInTheDocument();
    });

    test('given no simulations configured then comparison card is disabled', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then - SetupConditionsVariant renders cards as <button> elements
      // The comparison card should be disabled and contain waiting text
      const buttons = screen.getAllByRole('button');
      const comparisonCard = buttons.find((btn) =>
        btn.textContent?.includes('Comparison simulation')
      );
      expect(comparisonCard).toBeDefined();
      expect(comparisonCard).toBeDisabled();
      expect(comparisonCard?.textContent).toContain('Waiting for baseline');
    });

    test('given no simulations configured then primary button is disabled', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then - The primary action button contains "Configure baseline simulation"
      // and is rendered by MultiButtonFooter with disabled state
      const buttons = screen.getAllByRole('button');
      const primaryButton = buttons.find(
        (btn) => btn.textContent?.includes('Configure baseline simulation')
      );
      expect(primaryButton).toBeDisabled();
    });
  });

  describe('Baseline configured', () => {
    test('given baseline configured with household then comparison is optional', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportStateWithConfiguredBaseline}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      expect(screen.getByText(/comparison simulation \(optional\)/i)).toBeInTheDocument();
    });

    test('given baseline configured then comparison card is enabled', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportStateWithConfiguredBaseline}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      const cards = screen.getAllByRole('button');
      const comparisonCard = cards.find((card) =>
        card.textContent?.includes('Comparison simulation')
      );
      expect(comparisonCard).not.toHaveAttribute('data-disabled', 'true');
    });

    test('given baseline configured with household then can proceed without comparison', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportStateWithConfiguredBaseline}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      const buttons = screen.getAllByRole('button');
      const reviewButton = buttons.find((btn) => btn.textContent?.includes('Review report'));
      expect(reviewButton).not.toBeDisabled();
    });
  });

  describe('Both simulations configured', () => {
    test('given both simulations configured then shows Review report button', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportStateWithBothConfigured}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /review report/i })).toBeInTheDocument();
    });

    test('given both simulations configured then Review button is enabled', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportStateWithBothConfigured}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /review report/i })).not.toBeDisabled();
    });
  });

  describe('User interactions', () => {
    test('given user selects baseline card then calls navigation with index 0', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );
      const cards = screen.getAllByRole('button');
      const baselineCard = cards.find((card) => card.textContent?.includes('Baseline simulation'));

      // When
      await user.click(baselineCard!);
      const configureButton = screen.getByRole('button', {
        name: /configure baseline simulation/i,
      });
      await user.click(configureButton);

      // Then
      expect(mockOnNavigateToSimulationSelection).toHaveBeenCalledWith(0);
    });

    test('given user selects comparison card when baseline configured then prefills population', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportSetupView
          reportState={mockReportStateWithConfiguredBaseline}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );
      const cards = screen.getAllByRole('button');
      const comparisonCard = cards.find((card) =>
        card.textContent?.includes('Comparison simulation')
      );

      // When
      await user.click(comparisonCard!);
      const configureButton = screen.getByRole('button', {
        name: /configure comparison simulation/i,
      });
      await user.click(configureButton);

      // Then
      expect(mockOnPrefillPopulation2).toHaveBeenCalled();
      expect(mockOnNavigateToSimulationSelection).toHaveBeenCalledWith(1);
    });

    test('given both configured and review clicked then calls onNext', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportSetupView
          reportState={mockReportStateWithBothConfigured}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: /review report/i }));

      // Then
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // When
      render(
        <ReportSetupView
          reportState={mockReportState}
          onNavigateToSimulationSelection={mockOnNavigateToSimulationSelection}
          onNext={mockOnNext}
          onPrefillPopulation2={mockOnPrefillPopulation2}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
