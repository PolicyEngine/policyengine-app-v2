import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import SocietyWideOverview from '@/pages/report-output/SocietyWideOverview';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock formatBudgetaryImpact utility
vi.mock('@/utils/formatPowers', () => ({
  formatBudgetaryImpact: vi.fn((value: number) => {
    if (value === 0) return { display: '0', label: '' };
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
      return { display: (value / 1_000_000_000).toFixed(1), label: ' billion' };
    }
    if (absValue >= 1_000_000) {
      return { display: (value / 1_000_000).toFixed(1), label: ' million' };
    }
    return { display: value.toFixed(0), label: '' };
  }),
}));

describe('SocietyWideOverview', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('budgetary impact metric', () => {
    test('given positive budgetary impact then displays cost with formatted value', () => {
      // Given
      const output = createMockSocietyWideOutput({ budget: { budgetary_impact: 1_000_000 } as any });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(container.textContent).toContain('$1.0');
      expect(container.textContent).toContain('million');
    });

    test('given zero budgetary impact then shows no budget impact message', () => {
      // Given
      const output = createMockSocietyWideOutput({ budget: { budgetary_impact: 0 } as any });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Has no impact on the budget')).toBeInTheDocument();
    });

    test('given null budgetary impact then shows error message', () => {
      // Given
      const output = createMockSocietyWideOutput({ budget: { budgetary_impact: null } as any });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Error calculating budget impact')).toBeInTheDocument();
    });

    test('given NaN budgetary impact then shows error message', () => {
      // Given
      const output = createMockSocietyWideOutput({ budget: { budgetary_impact: NaN } as any });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Error calculating budget impact')).toBeInTheDocument();
    });
  });

  describe('net income impact metric', () => {
    test('given both winners and losers then shows both statistics', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0.2,
            'Gain less than 5%': 0.1,
            'Lose more than 5%': 0.05,
            'Lose less than 5%': 0.05,
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Net income')).toBeInTheDocument();
      // Check both percentages are present (30.0% for winners, 10.0% for losers)
      expect(container.textContent).toContain('30.0%');
      expect(container.textContent).toContain('10.0%');
    });

    test('given only winners then shows only raises message', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0.2,
            'Gain less than 5%': 0.1,
            'Lose more than 5%': 0,
            'Lose less than 5%': 0,
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Raises');
      expect(container.textContent).toContain('30.0%');
    });

    test('given only losers then shows only lowers message', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0,
            'Gain less than 5%': 0,
            'Lose more than 5%': 0.05,
            'Lose less than 5%': 0.05,
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Lowers');
      expect(container.textContent).toContain('10.0%');
    });

    test('given no impact then shows no impact message', () => {
      // Given
      const output = createMockSocietyWideOutput({
        intra_decile: {
          all: {
            'Gain more than 5%': 0,
            'Gain less than 5%': 0,
            'Lose more than 5%': 0,
            'Lose less than 5%': 0,
          },
        } as any,
      });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText("Does not affect anyone's net income")).toBeInTheDocument();
    });
  });

  describe('poverty impact metric', () => {
    test('given poverty decrease then shows lowers message with percentage', () => {
      // Given
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0.1, reform: 0.09 },
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Poverty')).toBeInTheDocument();
      // Check that poverty section contains "Lowers" text
      expect(container.textContent).toContain('Lowers');
      expect(container.textContent).toContain('10.0%'); // (0.1 - 0.09) / 0.1 * 100 = 10%
    });

    test('given poverty increase then shows raises message with percentage', () => {
      // Given
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0.1, reform: 0.12 },
          },
        } as any,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Raises');
      expect(container.textContent).toContain('20.0%'); // (0.12 - 0.1) / 0.1 * 100 = 20%
    });

    test('given no poverty change then shows no impact message', () => {
      // Given
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0.1, reform: 0.1 },
          },
        } as any,
      });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Has no impact on the poverty rate')).toBeInTheDocument();
    });

    test('given zero baseline poverty then shows error message', () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const output = createMockSocietyWideOutput({
        poverty: {
          poverty: {
            all: { baseline: 0, reform: 0.05 },
          },
        } as any,
      });

      // When
      render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Error calculating poverty impact')).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'SocietyWideOverview: baseline poverty rate reported as 0; API error likely'
      );
      consoleErrorSpy.mockRestore();
    });
  });

  test('given complete output then renders all three metric sections', () => {
    // Given
    const output = createMockSocietyWideOutput();

    // When
    render(<SocietyWideOverview output={output} />);

    // Then
    expect(screen.getByText('Cost')).toBeInTheDocument();
    expect(screen.getByText('Net income')).toBeInTheDocument();
    expect(screen.getByText('Poverty')).toBeInTheDocument();
  });
});
