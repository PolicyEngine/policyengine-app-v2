import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import PolicySubPage from '@/pages/report-output/PolicySubPage';
import {
  mockBaselinePolicy,
  mockCurrentLawPolicy,
  mockUserBaselinePolicy,
  mockParameterMetadata,
  createPolicySubPageProps,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/pages/report-output/PolicySubPage';

describe('PolicySubPage', () => {
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

  test('given no policies then displays no data message', () => {
    // Given
    const props = createPolicySubPageProps.empty();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
  });

  test('given undefined policies then displays no data message', () => {
    // Given
    const props = createPolicySubPageProps.undefined();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
  });

  test('given single policy then displays policy information', () => {
    // Given
    const props = createPolicySubPageProps.singlePolicy();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/policy information/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /baseline policy/i })).toBeInTheDocument();
    expect(screen.getByText(mockBaselinePolicy.id!)).toBeInTheDocument();
    expect(screen.getByText(mockBaselinePolicy.countryId!)).toBeInTheDocument();
  });

  test('given baseline only then displays single policy', () => {
    // Given
    const props = createPolicySubPageProps.baselineOnly();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/policy information/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /baseline policy/i })).toBeInTheDocument();
    expect(screen.queryByText(/select policy/i)).not.toBeInTheDocument();
  });

  test('given policy with parameters then displays parameter details', () => {
    // Given
    const props = createPolicySubPageProps.singlePolicy();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByRole('heading', { level: 3, name: /parameters/i })).toBeInTheDocument();
    expect(screen.getByText(TEST_PARAMETER_NAMES.EITC_MAX)).toBeInTheDocument();
    // Use getAllByText for text that appears multiple times (label and hierarchical labels)
    const eitcLabels = screen.getAllByText(/maximum eitc for 0 children/i);
    expect(eitcLabels.length).toBeGreaterThan(0);
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
  });

  test('given user policy association then displays user info', () => {
    // Given
    const props = createPolicySubPageProps.singlePolicy();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/user association/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockUserBaselinePolicy.userId))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockUserBaselinePolicy.label!))).toBeInTheDocument();
  });

  test('given multiple policies then displays policy selection buttons', () => {
    // Given
    const props = createPolicySubPageProps.baselineAndReform();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/select policy/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /baseline policy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reform policy/i })).toBeInTheDocument();
  });

  test('given user clicks policy button then switches displayed policy', async () => {
    // Given
    const user = userEvent.setup();
    const props = createPolicySubPageProps.baselineAndReform();
    renderWithStore(<PolicySubPage {...props} />);

    // When - initially shows baseline
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();

    // When - click reform button
    await user.click(screen.getByRole('button', { name: /reform policy/i }));

    // Then - shows reform value
    expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
  });

  test('given economy report type then includes current law in policy types', () => {
    // Given
    const props = createPolicySubPageProps.economyWithCurrentLaw();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByRole('button', { name: /current law/i })).toBeInTheDocument();
  });

  test('given household report type then excludes current law', () => {
    // Given
    const props = createPolicySubPageProps.baselineAndReform();

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.queryByRole('button', { name: /current law/i })).not.toBeInTheDocument();
  });

  test('given policy without parameters then displays no parameters message', () => {
    // Given
    const props = {
      policies: [mockCurrentLawPolicy],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/no parameters modified/i)).toBeInTheDocument();
  });

  test('given parameter with percentage unit then formats value correctly', () => {
    // Given
    const policyWithPercentage = {
      ...mockBaselinePolicy,
      parameters: [
        {
          name: TEST_PARAMETER_NAMES.TEST_RATE,
          values: [
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              value: 0.25,
            },
          ],
        },
      ],
    };

    const props = {
      policies: [policyWithPercentage],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
  });

  test('given parameter without metadata then uses parameter name as label', () => {
    // Given
    // Create store with empty parameters
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

    // When
    render(
      <Provider store={storeWithoutMetadata}>
        <PolicySubPage {...props} />
      </Provider>
    );

    // Then
    // Parameter name should appear twice: once as "Parameter: name" and once as "Label: name"
    const parameterNameElements = screen.getAllByText(new RegExp(TEST_PARAMETER_NAMES.EITC_MAX.replace(/[[\]]/g, '\\$&')));
    expect(parameterNameElements.length).toBeGreaterThan(0);
  });
});
