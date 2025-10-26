import { render, screen, within } from '@test-utils';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Provider } from 'react-redux';
import DynamicsSubPage from '@/pages/report-output/DynamicsSubPage';
import {
  MOCK_POLICY_BASELINE,
  MOCK_POLICY_REFORM,
  createMockStore,
} from '@/tests/fixtures/pages/report-output/DynamicsSubPage';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

describe('DynamicsSubPage', () => {
  let store: any;

  beforeEach(() => {
    store = createMockStore();
  });

  const renderWithStore = (ui: React.ReactElement) => {
    return render(<Provider store={store}>{ui}</Provider>);
  };

  test('given no policies then shows no data message', () => {
    // Given
    const props = {
      policies: [],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<DynamicsSubPage {...props} />);

    // Then
    expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
  });

  test('given policies without dynamics parameters then shows empty state', () => {
    // Given - policies with only non-dynamics parameters
    const props = {
      policies: [MOCK_POLICY_BASELINE, MOCK_POLICY_REFORM],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<DynamicsSubPage {...props} />);

    // Then
    expect(screen.getByText('Dynamics Information')).toBeInTheDocument();
    expect(screen.getByText('No custom dynamics configuration for this report.')).toBeInTheDocument();
  });

  test('given policies with dynamics parameters then displays table', () => {
    // Given - add dynamics parameter to policy
    const policyWithDynamics = {
      ...MOCK_POLICY_BASELINE,
      parameters: [
        ...(MOCK_POLICY_BASELINE.parameters || []),
        {
          name: 'gov.simulation.time_period',
          values: [
            {
              value: '2024',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            },
          ],
        },
      ],
    };

    const props = {
      policies: [policyWithDynamics],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<DynamicsSubPage {...props} />);

    // Then
    expect(screen.getByText('Dynamics Information')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('gov.simulation.time_period')).toBeInTheDocument();
  });

  // Note: Testing UK filtering would require mocking the hook differently in each test
  // For now, we test the US case which is the default mock

  test('given policies with non-dynamics parameters then filters them out', () => {
    // Given - policy with both dynamics and non-dynamics parameters
    const policyWithMixed = {
      ...MOCK_POLICY_BASELINE,
      parameters: [
        {
          name: 'gov.simulation.time_period',
          values: [
            {
              value: '2024',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            },
          ],
        },
        {
          name: 'gov.irs.credits.ctc.amount', // Non-dynamics
          values: [
            {
              value: 2000,
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            },
          ],
        },
      ],
    };

    const props = {
      policies: [policyWithMixed],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<DynamicsSubPage {...props} />);

    // Then
    expect(screen.getByText('gov.simulation.time_period')).toBeInTheDocument();
    expect(screen.queryByText('gov.irs.credits.ctc.amount')).not.toBeInTheDocument();
  });

  test('given dynamics parameters then renders table structure', () => {
    // Given
    const policyWithDynamics = {
      ...MOCK_POLICY_BASELINE,
      parameters: [
        {
          name: 'gov.simulation.time_period',
          values: [
            {
              value: '2024',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            },
          ],
        },
      ],
    };

    const props = {
      policies: [policyWithDynamics],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    renderWithStore(<DynamicsSubPage {...props} />);

    // Then
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /parameter/i })).toBeInTheDocument();

    const rowgroups = within(table).getAllByRole('rowgroup');
    expect(rowgroups.length).toBeGreaterThanOrEqual(2); // thead + tbody
  });
});
