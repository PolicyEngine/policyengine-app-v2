import { describe, test, expect } from 'vitest';
import { render, screen, within } from '@test-utils';
import HouseholdSubPage from '@/pages/report-output/HouseholdSubPage';
import {
  mockHouseholdFamilyOfFour,
  mockHouseholdSinglePerson,
  mockUserHousehold,
} from '@/tests/fixtures/pages/report-output/PopulationSubPage';

describe('HouseholdSubPage - Design 4 Table Format', () => {
  describe('Empty and error states', () => {
    test('given no households then displays no data message', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={undefined}
          reformHousehold={undefined}
          userHouseholds={[]}
        />
      );
      expect(screen.getByText(/no household data available/i)).toBeInTheDocument();
    });
  });

  describe('Table structure', () => {
    test('given households then displays table with proper structure', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[]}
        />
      );

      const table = screen.getAllByRole('table')[0];
      expect(table).toBeInTheDocument();

      // Should have variable column header
      expect(screen.getAllByRole('columnheader', { name: /variable/i })[0]).toBeInTheDocument();
    });

    test('given different households then displays two columns', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[]}
        />
      );

      // Should have baseline and reform headers
      const baselineHeaders = screen.getAllByRole('columnheader', { name: /baseline/i });
      expect(baselineHeaders.length).toBeGreaterThanOrEqual(1);

      const reformHeaders = screen.getAllByRole('columnheader', { name: /reform/i });
      expect(reformHeaders.length).toBeGreaterThanOrEqual(1);
    });

    test('given same households then displays single merged column', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdFamilyOfFour}
          userHouseholds={[]}
        />
      );

      // Should have merged column header
      const mergedHeaders = screen.getAllByRole('columnheader', {
        name: /baseline \/ reform/i,
      });
      expect(mergedHeaders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Household input values', () => {
    test('given household then displays person-level inputs', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[]}
        />
      );

      // Should display person identifiers and variable names
      expect(screen.getByText(/person1/i)).toBeInTheDocument();
      const ageElements = screen.getAllByText(/age/i);
      expect(ageElements.length).toBeGreaterThan(0);
      const incomeElements = screen.getAllByText(/employment income/i);
      expect(incomeElements.length).toBeGreaterThan(0);

      // Should display values
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
    });

    test('given household then displays household-level inputs', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[]}
        />
      );

      // Should display household-level variable names and values
      expect(screen.getByText(/state name/i)).toBeInTheDocument();
      expect(screen.getByText('CA')).toBeInTheDocument();
    });

    test('given same household then displays value once', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdFamilyOfFour}
          userHouseholds={[]}
        />
      );

      // Should only show each value once (not duplicated across columns)
      const ageElements = screen.getAllByText('35');
      expect(ageElements.length).toBe(1);
    });

    test('given different households then displays union of all inputs', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[]}
        />
      );

      // Should show inputs from both households
      // Family of four has person1 and person2
      const person1Matches = screen.getAllByText(/person1/i);
      expect(person1Matches.length).toBeGreaterThan(0);

      const person2Matches = screen.getAllByText(/person2/i);
      expect(person2Matches.length).toBeGreaterThan(0);

      // Should show both state values
      expect(screen.getByText('CA')).toBeInTheDocument();
      expect(screen.getByText('NY')).toBeInTheDocument();
    });
  });

  describe('User associations', () => {
    test('given user household association then does not display in table', () => {
      // Design 4 focuses on input comparison, user associations not shown in table
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[mockUserHousehold]}
        />
      );

      // User association should not be in the main table view
      expect(screen.queryByText(/user association/i)).not.toBeInTheDocument();
    });
  });

  describe('Design 4 styling', () => {
    test('given table then has proper semantic structure', () => {
      render(
        <HouseholdSubPage
          baselineHousehold={mockHouseholdFamilyOfFour}
          reformHousehold={mockHouseholdSinglePerson}
          userHouseholds={[]}
        />
      );

      const table = screen.getAllByRole('table')[0];
      expect(table).toBeInTheDocument();

      // Should have thead and tbody
      const rowgroups = within(table).getAllByRole('rowgroup');
      expect(rowgroups.length).toBeGreaterThanOrEqual(2);

      // Should have multiple rows (header + input rows)
      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });
  });
});
