import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import SimulationLabelView from '@/pathways/report/views/simulation/SimulationLabelView';
import {
  TEST_SIMULATION_LABEL,
  TEST_COUNTRY_ID,
  mockOnUpdateLabel,
  mockOnNext,
  mockOnBack,
  mockOnCancel,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/SimulationViewMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

import { useCurrentCountry } from '@/hooks/useCurrentCountry';

describe('SimulationLabelView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
  });

  describe('Standalone mode', () => {
    test('given standalone mode then displays create simulation title', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /create simulation/i })).toBeInTheDocument();
    });

    test('given standalone mode then displays simulation name input', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/simulation name/i)).toBeInTheDocument();
    });

    test('given standalone mode and null label then shows default My simulation', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/simulation name/i)).toHaveValue('My simulation');
    });
  });

  describe('Report mode', () => {
    test('given report mode without simulationIndex then throws error', () => {
      // Given/When/Then
      expect(() => render(
        <SimulationLabelView
          label={null}
          mode="report"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      )).toThrow('simulationIndex is required');
    });

    test('given report mode baseline then shows baseline simulation default label', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="report"
          simulationIndex={0}
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/simulation name/i)).toHaveValue('Baseline simulation');
    });

    test('given report mode reform then shows reform simulation default label', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="report"
          simulationIndex={1}
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/simulation name/i)).toHaveValue('Reform simulation');
    });

    test('given report label then incorporates into default label', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="report"
          simulationIndex={0}
          reportLabel="My Report"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/simulation name/i)).toHaveValue('My Report baseline simulation');
    });
  });

  describe('User interactions', () => {
    test('given user types label then input updates', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/simulation name/i);

      // When
      await user.clear(input);
      await user.type(input, TEST_SIMULATION_LABEL);

      // Then
      expect(input).toHaveValue(TEST_SIMULATION_LABEL);
    });

    test('given user submits then calls onUpdateLabel with value', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/simulation name/i);
      const submitButton = screen.getByRole('button', { name: /initialize simulation/i });

      // When
      await user.clear(input);
      await user.type(input, TEST_SIMULATION_LABEL);
      await user.click(submitButton);

      // Then
      expect(mockOnUpdateLabel).toHaveBeenCalledWith(TEST_SIMULATION_LABEL);
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Country-specific text', () => {
    test('given US country then shows Initialize button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('us');

      // When
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialize simulation/i })).toBeInTheDocument();
    });

    test('given UK country then shows Initialise button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('uk');

      // When
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialise simulation/i })).toBeInTheDocument();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
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
        <SimulationLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
