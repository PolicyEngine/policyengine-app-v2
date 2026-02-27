import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SocietyWideOverview from '@/pages/report-output/SocietyWideOverview';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock useCurrentCountry hook
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Mock formatBudgetaryImpact utility
vi.mock('@/utils/formatPowers', () => ({
  formatBudgetaryImpact: vi.fn((value: number) => {
    if (value === 0) {
      return { display: '0', label: '' };
    }
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000_000) {
      return { display: (value / 1_000_000_000).toFixed(1), label: 'billion' };
    }
    if (absValue >= 1_000_000) {
      return { display: (value / 1_000_000).toFixed(1), label: 'million' };
    }
    return { display: value.toFixed(0), label: '' };
  }),
}));

describe('SocietyWideOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('budgetary impact section', () => {
    test('given positive budgetary impact then displays formatted value with revenue subtext', () => {
      // Given
      const output = createMockSocietyWideOutput({
        budgetaryImpact: 1_000_000,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Budgetary Impact')).toBeInTheDocument();
      expect(container.textContent).toContain('$1.0');
      expect(container.textContent).toContain('million');
      expect(container.textContent).toContain('additional government revenue');
    });

    test('given negative budgetary impact then displays spending subtext', () => {
      // Given
      const output = createMockSocietyWideOutput({
        budgetaryImpact: -1_000_000,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('additional government spending');
    });

    test('given zero budgetary impact then shows no change message', () => {
      // Given
      const output = createMockSocietyWideOutput({ budgetaryImpact: 0 });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('No change');
      expect(container.textContent).toContain('no impact on the budget');
    });
  });

  describe('poverty impact section', () => {
    test('given poverty decrease then shows percentage decrease', () => {
      // Given
      const output = createMockSocietyWideOutput({
        povertyBaseline: 0.1,
        povertyReform: 0.09,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Poverty Impact')).toBeInTheDocument();
      expect(container.textContent).toContain('10.0%');
      expect(container.textContent).toContain('decrease in poverty rate');
    });

    test('given poverty increase then shows percentage increase', () => {
      // Given
      const output = createMockSocietyWideOutput({
        povertyBaseline: 0.1,
        povertyReform: 0.12,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('20.0%');
      expect(container.textContent).toContain('increase in poverty rate');
    });

    test('given no poverty change then shows no change message', () => {
      // Given
      const output = createMockSocietyWideOutput({
        povertyBaseline: 0.1,
        povertyReform: 0.1,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('No change');
      expect(container.textContent).toContain('Poverty rate unchanged');
    });

    test('given zero baseline poverty then handles edge case', () => {
      // Given - edge case where baseline is 0
      const output = createMockSocietyWideOutput({
        povertyBaseline: 0,
        povertyReform: 0.05,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then - component should handle division by zero gracefully
      expect(container.textContent).toContain('Poverty Impact');
    });
  });

  describe('winners and losers section', () => {
    test('given both winners and losers then shows distribution', () => {
      // Given
      const output = createMockSocietyWideOutput({
        gainMore5: 0.2,
        gainLess5: 0.1,
        loseMore5: 0.05,
        loseLess5: 0.05,
        noChange: 0.6,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(screen.getByText('Winners and losers')).toBeInTheDocument();
      expect(container.textContent).toContain('Gain: 30.0%');
      expect(container.textContent).toContain('Lose: 10.0%');
      expect(container.textContent).toContain('No change: 60.0%');
    });

    test('given only winners then shows only gains', () => {
      // Given
      const output = createMockSocietyWideOutput({
        gainMore5: 0.2,
        gainLess5: 0.1,
        loseMore5: 0,
        loseLess5: 0,
        noChange: 0.7,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Gain: 30.0%');
      expect(container.textContent).toContain('Lose: 0.0%');
    });

    test('given only losers then shows only losses', () => {
      // Given
      const output = createMockSocietyWideOutput({
        gainMore5: 0,
        gainLess5: 0,
        loseMore5: 0.05,
        loseLess5: 0.05,
        noChange: 0.9,
      });

      // When
      const { container } = render(<SocietyWideOverview output={output} />);

      // Then
      expect(container.textContent).toContain('Gain: 0.0%');
      expect(container.textContent).toContain('Lose: 10.0%');
    });
  });

  test('given complete output then renders all three sections', () => {
    // Given
    const output = createMockSocietyWideOutput();

    // When
    render(<SocietyWideOverview output={output} />);

    // Then
    expect(screen.getByText('Budgetary Impact')).toBeInTheDocument();
    expect(screen.getByText('Poverty Impact')).toBeInTheDocument();
    expect(screen.getByText('Winners and losers')).toBeInTheDocument();
  });
});
