import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicyReproducibility from '@/pages/report-output/reproduce-in-python/PolicyReproducibility';
import {
  DEFAULT_POLICY_REPRODUCIBILITY_PROPS,
  EXPECTED_CODE_SNIPPETS,
  EXPECTED_TEXT,
  MOCK_REPORT_YEAR,
  UK_POLICY_REPRODUCIBILITY_PROPS,
} from '@/tests/fixtures/pages/report-output/reproduce-in-python/reproducibilityMocks';

// Mock the useReportYear hook
vi.mock('@/hooks/useReportYear', () => ({
  useReportYear: () => MOCK_REPORT_YEAR,
}));

describe('PolicyReproducibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('given valid props then renders title and instructions', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByRole('heading', { name: EXPECTED_TEXT.TITLE })).toBeInTheDocument();
      expect(screen.getByText(/Run the code below in a/)).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_TEXT.PYTHON_LABEL)).toBeInTheDocument();
    });

    test('given valid props then renders Python notebook link', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      const link = screen.getByRole('link', { name: /Python notebook/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAttribute('target', '_blank');
    });

    test('given valid props then mentions microsimulation in instructions', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_TEXT.MICROSIMULATION_INSTRUCTION))
      ).toBeInTheDocument();
    });

    test('given valid props then renders copy button', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByRole('button', { name: /Copy code to clipboard/i })).toBeInTheDocument();
    });

    test('given valid props then does not render earning variation toggle', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      // PolicyReproducibility does not have earning variation toggle
      expect(screen.queryByText(EXPECTED_TEXT.EARNING_VARIATION_LABEL)).not.toBeInTheDocument();
    });

    test('given US country then generates US-specific code', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.US_POLICY_IMPORT))
      ).toBeInTheDocument();
    });

    test('given UK country then generates UK-specific code', () => {
      // When
      render(<PolicyReproducibility {...UK_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.UK_POLICY_IMPORT))
      ).toBeInTheDocument();
    });

    test('given reform policy then includes Reform import in code', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.REFORM_IMPORT))
      ).toBeInTheDocument();
    });

    test('given policy then includes microsimulation setup in code', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.MICROSIMULATION_CREATE))
      ).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    test('given copy button exists then user can click it', async () => {
      // Given
      const user = userEvent.setup();
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);
      const copyButton = screen.getByRole('button', { name: /Copy code to clipboard/i });

      // When/Then - button should be clickable without error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('code generation', () => {
    test('given policy then generates baseline and reform microsimulations', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByText(/baseline = Microsimulation/)).toBeInTheDocument();
      expect(screen.getByText(/reformed = Microsimulation/)).toBeInTheDocument();
    });

    test('given policy then generates income calculation code', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByText(/baseline_income = baseline.calculate/)).toBeInTheDocument();
      expect(screen.getByText(/reformed_income = reformed.calculate/)).toBeInTheDocument();
      expect(
        screen.getByText(/difference_income = reformed_income - baseline_income/)
      ).toBeInTheDocument();
    });

    test('given year context then uses correct year in calculation', () => {
      // When
      render(<PolicyReproducibility {...DEFAULT_POLICY_REPRODUCIBILITY_PROPS} />);

      // Then
      // The year from the mock (2024) should appear in the period parameter
      expect(screen.getByText(new RegExp(`period=${MOCK_REPORT_YEAR}`))).toBeInTheDocument();
    });
  });
});
