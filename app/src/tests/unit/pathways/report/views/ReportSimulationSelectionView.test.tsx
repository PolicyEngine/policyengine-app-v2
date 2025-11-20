import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import ReportSimulationSelectionView from '@/pathways/report/views/ReportSimulationSelectionView';
import {
  TEST_COUNTRY_ID,
  TEST_CURRENT_LAW_ID,
  mockOnCreateNew,
  mockOnLoadExisting,
  mockOnSelectDefaultBaseline,
  mockOnBack,
  mockOnCancel,
  mockUseUserSimulationsEmpty,
  mockUseUserSimulationsWithData,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/ReportViewMocks';

vi.mock('@/hooks/useUserSimulations', () => ({
  useUserSimulations: vi.fn(),
}));

vi.mock('@/hooks/useCreateSimulation', () => ({
  useCreateSimulation: vi.fn(() => ({
    createSimulation: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useCreateGeographicAssociation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

import { useUserSimulations } from '@/hooks/useUserSimulations';

describe('ReportSimulationSelectionView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Baseline simulation (index 0)', () => {
    test('given baseline simulation then displays default baseline option', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
          onSelectDefaultBaseline={mockOnSelectDefaultBaseline}
        />
      );

      // Then
      expect(screen.getByText(/current law for all households nationwide/i)).toBeInTheDocument();
    });

    test('given baseline simulation then displays create new option', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );

      // Then
      expect(screen.getByText(/create new simulation/i)).toBeInTheDocument();
    });

    test('given user has simulations then displays load existing option', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );

      // Then
      expect(screen.getByText(/load existing simulation/i)).toBeInTheDocument();
    });

    test('given user has no simulations then load existing not shown', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );

      // Then
      expect(screen.queryByText(/load existing simulation/i)).not.toBeInTheDocument();
    });
  });

  describe('Comparison simulation (index 1)', () => {
    test('given comparison simulation then default baseline option not shown', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={1}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );

      // Then
      expect(screen.queryByText(/current law for all households nationwide/i)).not.toBeInTheDocument();
    });

    test('given comparison simulation then only shows standard options', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={1}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );

      // Then
      expect(screen.getByText(/create new simulation/i)).toBeInTheDocument();
      expect(screen.queryByText(/load existing simulation/i)).not.toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    test('given user clicks create new then calls onCreateNew', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );
      const cards = screen.getAllByRole('button');
      const createNewCard = cards.find(card => card.textContent?.includes('Create new simulation'));

      // When
      await user.click(createNewCard!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Then
      expect(mockOnCreateNew).toHaveBeenCalled();
    });

    test('given user clicks load existing then calls onLoadExisting', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithData as any);
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );
      const cards = screen.getAllByRole('button');
      const loadExistingCard = cards.find(card => card.textContent?.includes('Load existing simulation'));

      // When
      await user.click(loadExistingCard!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Then
      expect(mockOnLoadExisting).toHaveBeenCalled();
    });

    test('given no selection then next button is disabled', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty as any);

      // When
      render(
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
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
        <ReportSimulationSelectionView
          simulationIndex={0}
          countryId={TEST_COUNTRY_ID}
          currentLawId={TEST_CURRENT_LAW_ID}
          onCreateNew={mockOnCreateNew}
          onLoadExisting={mockOnLoadExisting}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
