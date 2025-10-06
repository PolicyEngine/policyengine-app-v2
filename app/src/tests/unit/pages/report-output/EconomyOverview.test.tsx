import { describe, test, expect } from 'vitest';
import { render, screen } from '@test-utils';
import EconomyOverview from '@/pages/report-output/subpages/EconomyOverview';
import {
  MOCK_ECONOMY_OUTPUT_POSITIVE_IMPACT,
  MOCK_ECONOMY_OUTPUT_ZERO_IMPACT,
  MOCK_ECONOMY_OUTPUT_ZERO_BASELINE_POVERTY,
  TEST_LABELS,
  EXPECTED_FORMATTED_VALUES,
} from '@/tests/fixtures/pages/report-output/economyOverviewMocks';

describe('EconomyOverview', () => {
  describe('Budgetary Impact', () => {
    test('given positive budgetary impact then displays formatted cost', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_POSITIVE_IMPACT} />);

      // Then
      expect(screen.getByText(TEST_LABELS.COST)).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes(EXPECTED_FORMATTED_VALUES.BUDGET_20B))).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes(EXPECTED_FORMATTED_VALUES.BILLION_LABEL))).toBeInTheDocument();
    });

    test('given zero budgetary impact then displays no impact message', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_ZERO_IMPACT} />);

      // Then
      expect(screen.getByText(TEST_LABELS.COST)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.NO_BUDGET_IMPACT)).toBeInTheDocument();
    });
  });

  describe('Poverty Impact', () => {
    test('given poverty decrease then displays negative percentage', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_POSITIVE_IMPACT} />);

      // Then
      expect(screen.getByText(TEST_LABELS.POVERTY_IMPACT)).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_FORMATTED_VALUES.POVERTY_DECREASE)).toBeInTheDocument();
    });

    test('given zero baseline poverty then displays error message', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_ZERO_BASELINE_POVERTY} />);

      // Then
      expect(screen.getByText(TEST_LABELS.POVERTY_IMPACT)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.ERROR_POVERTY)).toBeInTheDocument();
    });
  });

  describe('Net Income Impact (Winners/Losers)', () => {
    test('given winners and losers then displays percentages', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_POSITIVE_IMPACT} />);

      // Then
      expect(screen.getByText(TEST_LABELS.NET_INCOME)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.RAISES)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.LOWERS)).toBeInTheDocument();
      expect(screen.getByText(`${EXPECTED_FORMATTED_VALUES.WINNERS_40}%`)).toBeInTheDocument();
      expect(screen.getByText(`${EXPECTED_FORMATTED_VALUES.LOSERS_15}%`)).toBeInTheDocument();
    });

    test('given no winners or losers then displays no change message', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_ZERO_IMPACT} />);

      // Then
      expect(screen.getByText(TEST_LABELS.NET_INCOME)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.NO_CHANGE)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('given valid output then renders all three metrics', () => {
      // When
      render(<EconomyOverview output={MOCK_ECONOMY_OUTPUT_POSITIVE_IMPACT} />);

      // Then
      expect(screen.getByText(TEST_LABELS.COST)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.POVERTY_IMPACT)).toBeInTheDocument();
      expect(screen.getByText(TEST_LABELS.NET_INCOME)).toBeInTheDocument();
    });
  });
});
