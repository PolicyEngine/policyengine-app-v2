import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import PopulationSubPage from '@/pages/report-output/PopulationSubPage';
import { createPopulationSubPageProps } from '@/tests/fixtures/pages/report-output/PopulationSubPage';

describe('PopulationSubPage - Design 4 Router', () => {
  describe('Routing logic', () => {
    test('given household simulations then routes to HouseholdSubPage', () => {
      const props = createPopulationSubPageProps.householdDifferent();
      render(<PopulationSubPage {...props} />);

      // Should render household tables (check for household-specific content)
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
      const variableHeaders = screen.getAllByRole('columnheader', { name: /variable/i });
      expect(variableHeaders.length).toBeGreaterThan(0);
    });

    test('given geography simulations then routes to GeographySubPage', () => {
      const props = createPopulationSubPageProps.geographyDifferent();
      render(<PopulationSubPage {...props} />);

      // Should render geography table (check for geography-specific content)
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /property/i })).toBeInTheDocument();
    });

    test('given no simulations then displays error message', () => {
      const props = createPopulationSubPageProps.noSimulations();
      render(<PopulationSubPage {...props} />);

      expect(screen.getByText(/no population data available/i)).toBeInTheDocument();
    });
  });

  describe('Data extraction and passing', () => {
    test('given household simulations then extracts correct households', () => {
      const props = createPopulationSubPageProps.householdDifferent();
      render(<PopulationSubPage {...props} />);

      // Should display data from baseline household (Family of Four)
      const person1Matches = screen.getAllByText(/person1/i);
      expect(person1Matches.length).toBeGreaterThan(0);

      const person2Matches = screen.getAllByText(/person2/i);
      expect(person2Matches.length).toBeGreaterThan(0);

      expect(screen.getByText('35')).toBeInTheDocument(); // Age from baseline

      // Should display data from reform household (Single Person)
      expect(screen.getByText('28')).toBeInTheDocument(); // Age from reform
    });

    test('given geography simulations then extracts correct geographies', () => {
      const props = createPopulationSubPageProps.geographyDifferent();
      render(<PopulationSubPage {...props} />);

      // Should display regionCodes (note: Phase 6.2 will add proper name lookup)
      expect(screen.getByText('ca')).toBeInTheDocument(); // Baseline
      expect(screen.getByText('ny')).toBeInTheDocument(); // Reform
    });

    test('given missing household data then displays error in HouseholdSubPage', () => {
      const props = createPopulationSubPageProps.householdMissingData();
      render(<PopulationSubPage {...props} />);

      expect(screen.getByText(/no household data available/i)).toBeInTheDocument();
    });

    test('given missing geography data then shows error message', () => {
      const props = createPopulationSubPageProps.geographyMissingData();
      render(<PopulationSubPage {...props} />);

      // When geography data is missing, shows error message
      expect(screen.getByText(/no geography data available/i)).toBeInTheDocument();
    });
  });

  describe('Column collapsing scenarios', () => {
    test('given same household in both simulations then passes to HouseholdSubPage', () => {
      const props = createPopulationSubPageProps.householdSame();
      render(<PopulationSubPage {...props} />);

      // Should show merged column header
      const mergedHeaders = screen.getAllByRole('columnheader', {
        name: /baseline \/ reform/i,
      });
      expect(mergedHeaders.length).toBeGreaterThanOrEqual(1);
    });

    test('given same geography in both simulations then passes to GeographySubPage', () => {
      const props = createPopulationSubPageProps.geographySame();
      render(<PopulationSubPage {...props} />);

      // Should show merged column header
      const mergedHeaders = screen.getAllByRole('columnheader', {
        name: /baseline \/ reform/i,
      });
      expect(mergedHeaders.length).toBeGreaterThanOrEqual(1);
    });
  });
});
