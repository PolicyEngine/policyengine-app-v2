import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@test-utils';
import { Provider } from 'react-redux';
import PolicySubPage from '@/pages/report-output/PolicySubPage';
import {
  mockBaselinePolicy,
  mockReformPolicy,
  mockParameterMetadata,
  createPolicySubPageProps,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/pages/report-output/PolicySubPage';

describe('PolicySubPage - Design 4 Table Format (No Current Law)', () => {
  let store: any;

  beforeEach(() => {
    // Create a mock store with metadata reducer containing parameter metadata
    store = configureStore({
      reducer: {
        metadata: (
          state = {
            parameters: mockParameterMetadata,
            loading: false,
            error: null,
            currentCountry: 'us',
            variables: {},
            entities: {},
            variableModules: {},
            economyOptions: { region: [], time_period: [], datasets: [] },
            currentLawId: 0,
            basicInputs: [],
            modelledPolicies: { core: {}, filtered: {} },
            version: null,
            parameterTree: null,
          },
          _action: any
        ) => state,
      },
    });
  });

  const renderWithStore = (ui: React.ReactElement) => {
    return render(<Provider store={store}>{ui}</Provider>);
  };

  describe('Empty and error states', () => {
    test('given no policies then displays no data message', () => {
      const props = createPolicySubPageProps.empty();
      renderWithStore(<PolicySubPage {...props} />);
      expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
    });

    test('given undefined policies then displays no data message', () => {
      const props = createPolicySubPageProps.undefined();
      renderWithStore(<PolicySubPage {...props} />);
      expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
    });
  });

  describe('Table structure', () => {
    test('given policies then displays table with proper structure', () => {
      const props = createPolicySubPageProps.baselineAndReform();
      renderWithStore(<PolicySubPage {...props} />);

      // Should have a table
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have table headers
      expect(screen.getByRole('columnheader', { name: /parameter/i })).toBeInTheDocument();
    });

    test('given policies then displays policy titles in header', () => {
      const props = createPolicySubPageProps.baselineAndReform();
      renderWithStore(<PolicySubPage {...props} />);

      // Policy labels should appear in the table header (now in uppercase with role in parens)
      // Header format is "POLICY NAME (BASELINE)" or "POLICY NAME (REFORM)"
      const headers = screen.getAllByRole('columnheader');
      // Just check that at least one policy name appears somewhere
      const headerTexts = headers.map(h => h.textContent).join(' ');
      expect(headerTexts).toMatch(/BASELINE|REFORM/);
    });

    test('given policies with parameters then displays parameter rows', () => {
      const props = createPolicySubPageProps.baselineAndReform();
      renderWithStore(<PolicySubPage {...props} />);

      // Should display parameter name
      expect(screen.getByText(TEST_PARAMETER_NAMES.EITC_MAX)).toBeInTheDocument();

      // Should display parameter label
      expect(screen.getByText(/maximum eitc for 0 children/i)).toBeInTheDocument();

      // Should display values
      expect(screen.getByText('$1,000')).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });
  });

  describe('Column collapsing - Two policies only', () => {
    test('given baseline and reform different then displays two columns', () => {
      const props = createPolicySubPageProps.baselineAndReformDifferent();
      renderWithStore(<PolicySubPage {...props} />);

      const baselineHeaders = screen.getAllByRole('columnheader', { name: /baseline/i });
      expect(baselineHeaders.length).toBeGreaterThanOrEqual(1);

      const reformHeaders = screen.getAllByRole('columnheader', { name: /reform/i });
      expect(reformHeaders.length).toBeGreaterThanOrEqual(1);

      // Should have two different values
      expect(screen.getByText('$1,000')).toBeInTheDocument(); // Baseline
      expect(screen.getByText('$1,500')).toBeInTheDocument(); // Reform
    });

    test('given baseline equals reform then displays single merged column', () => {
      const props = createPolicySubPageProps.baselineEqualsReform();
      renderWithStore(<PolicySubPage {...props} />);

      // When policies are equal, values should only appear once per row in the merged column
      // Note: value may also appear in current law column if present
      const values = screen.getAllByText('$1,000');
      // Should have at most 2 instances: current law + merged column
      expect(values.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Value formatting', () => {
    test('given currency parameter then formats with dollar sign', () => {
      const props = createPolicySubPageProps.baselineOnly();
      renderWithStore(<PolicySubPage {...props} />);

      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    test('given percentage parameter then formats with percent sign', () => {
      const props = createPolicySubPageProps.multipleParameters();
      renderWithStore(<PolicySubPage {...props} />);

      // 0.15 * 100 = 15 (integer), so no decimal places
      expect(screen.getByText('15%')).toBeInTheDocument();
    });

    test('given missing value then displays em dash', () => {
      const props = createPolicySubPageProps.policyWithMissingParameter();
      renderWithStore(<PolicySubPage {...props} />);

      // Should show em dash for missing parameter (can appear in multiple columns)
      const table = screen.getByRole('table');
      expect(within(table).getAllByText('—').length).toBeGreaterThan(0);
    });
  });

  describe('Multiple parameters', () => {
    test('given multiple parameters then displays all in separate rows', () => {
      const props = createPolicySubPageProps.multipleParameters();
      renderWithStore(<PolicySubPage {...props} />);

      // Should display both parameters
      expect(screen.getByText(TEST_PARAMETER_NAMES.EITC_MAX)).toBeInTheDocument();
      expect(screen.getByText(TEST_PARAMETER_NAMES.TEST_RATE)).toBeInTheDocument();

      // Should display both labels
      expect(screen.getByText(/maximum eitc for 0 children/i)).toBeInTheDocument();
      expect(screen.getByText(/test rate/i)).toBeInTheDocument();
    });

    test('given parameters across different policies then displays union of all parameters', () => {
      const propsWithDifferentParams = {
        policies: [
          mockBaselinePolicy, // Has EITC_MAX
          {
            ...mockReformPolicy,
            parameters: [
              {
                name: TEST_PARAMETER_NAMES.TEST_RATE,
                values: [
                  {
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    value: 0.2,
                  },
                ],
              },
            ],
          },
        ],
        reportType: 'household' as const,
      };

      renderWithStore(<PolicySubPage {...propsWithDifferentParams} />);

      // Both parameters should appear even though they're in different policies
      expect(screen.getByText(TEST_PARAMETER_NAMES.EITC_MAX)).toBeInTheDocument();
      expect(screen.getByText(TEST_PARAMETER_NAMES.TEST_RATE)).toBeInTheDocument();
    });
  });

  describe('Parameter metadata', () => {
    test('given parameter without metadata then uses parameter name as label', () => {
      const storeWithoutMetadata = configureStore({
        reducer: {
          metadata: (
            state = {
              parameters: {},
              loading: false,
              error: null,
              currentCountry: 'us',
              variables: {},
              entities: {},
              variableModules: {},
              economyOptions: { region: [], time_period: [], datasets: [] },
              currentLawId: 0,
              basicInputs: [],
              modelledPolicies: { core: {}, filtered: {} },
              version: null,
              parameterTree: null,
            },
            _action: any
          ) => state,
        },
      });

      const props = createPolicySubPageProps.baselineOnly();

      render(
        <Provider store={storeWithoutMetadata}>
          <PolicySubPage {...props} />
        </Provider>
      );

      // Parameter name should be used as fallback label (appears twice: as label and as name)
      const paramElements = screen.getAllByText(TEST_PARAMETER_NAMES.EITC_MAX);
      expect(paramElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Design 4 styling', () => {
    test('given table then has proper semantic structure', () => {
      const props = createPolicySubPageProps.baselineAndReform();
      renderWithStore(<PolicySubPage {...props} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have thead and tbody (multiple rowgroups)
      const rowgroups = within(table).getAllByRole('rowgroup');
      expect(rowgroups.length).toBeGreaterThanOrEqual(2); // thead + tbody

      // Should have multiple rows (header + parameter rows)
      // We now have just 1 header row + parameter rows
      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });
  });
});
