import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import IndividualTable from '@/components/report/IndividualTable';
import {
  BASELINE_LABEL,
  EXPECTED_AGE_VALUE,
  EXPECTED_BASELINE_INCOME_VALUE,
  EXPECTED_REFORM_INCOME_VALUE,
  MOCK_BASELINE_MEMBER,
  MOCK_EMPTY_MEMBER,
  MOCK_REFORM_MEMBER,
  NO_DATA_AVAILABLE_MESSAGE,
  REFORM_LABEL,
  TABLE_HEADER_VARIABLE,
} from '@/tests/fixtures/components/report/IndividualTable';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

describe('IndividualTable', () => {
  describe('Single simulation mode', () => {
    test('given single baseline member then shows only baseline column', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_BASELINE_MEMBER}
          reformMember={undefined}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold={false}
        />
      );

      // Then
      expect(screen.getByText(TABLE_HEADER_VARIABLE)).toBeInTheDocument();
      expect(screen.getByText(BASELINE_LABEL.toUpperCase())).toBeInTheDocument();
      expect(screen.queryByText(REFORM_LABEL.toUpperCase())).not.toBeInTheDocument();
    });

    test('given single baseline member then displays all variables', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_BASELINE_MEMBER}
          reformMember={undefined}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold={false}
        />
      );

      // Then
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Employment Income')).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_AGE_VALUE)).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_BASELINE_INCOME_VALUE)).toBeInTheDocument();
    });

    test('given empty member then shows no data message', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_EMPTY_MEMBER}
          reformMember={undefined}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold={false}
        />
      );

      // Then
      expect(screen.getByText(NO_DATA_AVAILABLE_MESSAGE)).toBeInTheDocument();
    });
  });

  describe('Comparison mode (different households)', () => {
    test('given two different members then shows both baseline and reform columns', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_BASELINE_MEMBER}
          reformMember={MOCK_REFORM_MEMBER}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold={false}
        />
      );

      // Then
      expect(screen.getByText(`${BASELINE_LABEL.toUpperCase()} (BASELINE)`)).toBeInTheDocument();
      expect(screen.getByText(`${REFORM_LABEL.toUpperCase()} (REFORM)`)).toBeInTheDocument();
    });

    test('given comparison mode then displays values from both members', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_BASELINE_MEMBER}
          reformMember={MOCK_REFORM_MEMBER}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold={false}
        />
      );

      // Then
      expect(screen.getByText(EXPECTED_BASELINE_INCOME_VALUE)).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_REFORM_INCOME_VALUE)).toBeInTheDocument();
    });
  });

  describe('Same household mode', () => {
    test('given same household then shows merged column header', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_BASELINE_MEMBER}
          reformMember={MOCK_REFORM_MEMBER}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold
        />
      );

      // Then
      expect(
        screen.getByText(`${BASELINE_LABEL.toUpperCase()} (BASELINE / REFORM)`)
      ).toBeInTheDocument();
    });

    test('given same household then shows single value column', () => {
      // Given / When
      render(
        <IndividualTable
          baselineMember={MOCK_BASELINE_MEMBER}
          reformMember={MOCK_REFORM_MEMBER}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold
        />
      );

      // Then
      const incomeValues = screen.getAllByText(EXPECTED_BASELINE_INCOME_VALUE);
      expect(incomeValues).toHaveLength(1); // Only one column shown
    });
  });

  describe('Missing values', () => {
    test('given baseline has variable missing in reform then shows em dash for missing value', () => {
      // Given
      const baselineWithExtra = {
        ...MOCK_BASELINE_MEMBER,
        variables: [
          ...MOCK_BASELINE_MEMBER.variables,
          { paramName: 'bonus', label: 'Bonus', value: 1000, unit: 'currency-USD' },
        ],
      };

      // When
      render(
        <IndividualTable
          baselineMember={baselineWithExtra}
          reformMember={MOCK_REFORM_MEMBER}
          baselineLabel={BASELINE_LABEL}
          reformLabel={REFORM_LABEL}
          isSameHousehold={false}
        />
      );

      // Then
      expect(screen.getByText('Bonus')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});
