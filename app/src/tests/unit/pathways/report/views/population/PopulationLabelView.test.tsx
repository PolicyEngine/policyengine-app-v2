import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import PopulationLabelView from '@/pathways/report/views/population/PopulationLabelView';
import {
  TEST_POPULATION_LABEL,
  TEST_COUNTRY_ID,
  mockPopulationStateEmpty,
  mockPopulationStateWithHousehold,
  mockPopulationStateWithGeography,
  mockOnUpdateLabel,
  mockOnNext,
  mockOnBack,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/PopulationViewMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

import { useCurrentCountry } from '@/hooks/useCurrentCountry';

describe('PopulationLabelView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
  });

  describe('Basic rendering', () => {
    test('given component renders then displays title', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /name your household/i })).toBeInTheDocument();
    });

    test('given component renders then displays household label input', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/household label/i)).toBeInTheDocument();
    });
  });

  describe('Default labels', () => {
    test('given household population then shows Custom Household default', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/household label/i)).toHaveValue('Custom Household');
    });

    test('given geography population then shows geography-based label', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateWithGeography}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/household label/i)).toHaveValue('National Households');
    });

    test('given existing label then shows that label', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateWithHousehold}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/household label/i)).toHaveValue('My Household');
    });
  });

  describe('Report mode validation', () => {
    test('given report mode without simulationIndex then throws error', () => {
      // Given/When/Then
      expect(() => render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="report"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      )).toThrow('simulationIndex is required');
    });

    test('given report mode with simulationIndex then renders without error', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="report"
          simulationIndex={0}
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /name your household/i })).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    test('given user types label then input updates', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/household label/i);

      // When
      await user.clear(input);
      await user.type(input, TEST_POPULATION_LABEL);

      // Then
      expect(input).toHaveValue(TEST_POPULATION_LABEL);
    });

    test('given user submits valid label then calls callbacks', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/household label/i);
      const submitButton = screen.getByRole('button', { name: /initialize household/i });

      // When
      await user.clear(input);
      await user.type(input, TEST_POPULATION_LABEL);
      await user.click(submitButton);

      // Then
      expect(mockOnUpdateLabel).toHaveBeenCalledWith(TEST_POPULATION_LABEL);
      expect(mockOnNext).toHaveBeenCalled();
    });

    test('given user submits empty label then shows error', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/household label/i);
      const submitButton = screen.getByRole('button', { name: /initialize household/i });

      // When
      await user.clear(input);
      await user.click(submitButton);

      // Then
      expect(screen.getByText(/please enter a label/i)).toBeInTheDocument();
      expect(mockOnUpdateLabel).not.toHaveBeenCalled();
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('Country-specific text', () => {
    test('given US country then shows Initialize button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('us');

      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialize household/i })).toBeInTheDocument();
    });

    test('given UK country then shows Initialise button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('uk');

      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialise household/i })).toBeInTheDocument();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given no onBack then no back button', () => {
      // When
      render(
        <PopulationLabelView
          population={mockPopulationStateEmpty}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });
  });
});
