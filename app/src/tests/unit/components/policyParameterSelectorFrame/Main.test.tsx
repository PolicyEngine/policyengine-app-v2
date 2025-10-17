import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';
import PolicyParameterSelectorMain from '@/components/policyParameterSelectorFrame/Main';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { policySlice } from '@/reducers/policyReducer';
import { reportSlice } from '@/reducers/reportReducer';

// Mock the child components
vi.mock('@/components/policyParameterSelectorFrame/ValueSetter', () => ({
  default: () => <div data-testid="value-setter">ValueSetter</div>,
}));

vi.mock('@/components/policyParameterSelectorFrame/HistoricalValues', () => ({
  default: (props: any) => (
    <div data-testid="historical-values">
      <div data-testid="base-intervals">{JSON.stringify(props.baseValues?.getIntervals())}</div>
      <div data-testid="reform-intervals">{JSON.stringify(props.reformValues?.getIntervals())}</div>
      <div data-testid="policy-label">{props.policyLabel || 'null'}</div>
      <div data-testid="policy-id">{props.policyId || 'null'}</div>
    </div>
  ),
}));

// Sample parameter metadata
const SAMPLE_PARAM = {
  parameter: 'gov.test.parameter',
  label: 'Test Parameter',
  type: 'parameter' as const,
  unit: 'currency-USD',
  description: 'A test parameter',
  values: {
    '2020-01-01': 1000,
    '2024-01-01': 1500,
  },
  economy: true,
  household: true,
};

function createTestStore(initialState?: any) {
  const config: any = {
    reducer: {
      policy: policySlice.reducer,
      report: reportSlice.reducer,
    },
    preloadedState: initialState,
  };
  return configureStore(config);
}

function renderWithStore(component: React.ReactElement, store: any) {
  return render(<Provider store={store}>{component}</Provider>);
}

describe('PolicyParameterSelectorMain', () => {
  describe('reform value initialization', () => {
    it('given no active policy then reform values equal base values', () => {
      // Given
      const store = createTestStore({
        policy: { policies: [null, null] },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      const baseIntervals = screen.getByTestId('base-intervals').textContent;
      const reformIntervals = screen.getByTestId('reform-intervals').textContent;

      expect(baseIntervals).toBeTruthy();
      expect(reformIntervals).toBeTruthy();
      expect(baseIntervals).toBe(reformIntervals); // Reform should match base initially
    });

    it('given active policy with no parameters then reform values equal base values', () => {
      // Given
      const store = createTestStore({
        policy: {
          policies: [
            { id: '123', label: 'Test Policy', parameters: [], isCreated: true },
            null,
          ],
        },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      const baseIntervals = screen.getByTestId('base-intervals').textContent;
      const reformIntervals = screen.getByTestId('reform-intervals').textContent;

      expect(baseIntervals).toBe(reformIntervals); // Reform should still match base
    });
  });

  describe('reform value merging with user modifications', () => {
    it('given user adds value then reform merges with base values', () => {
      // Given - policy with user-defined value starting 2023
      const store = createTestStore({
        policy: {
          policies: [
            {
              id: '456',
              label: 'My Reform',
              parameters: [
                {
                  name: 'gov.test.parameter',
                  values: [
                    { startDate: '2023-01-01', endDate: '2100-12-31', value: 2000 },
                  ],
                },
              ],
              isCreated: true,
            },
            null,
          ],
        },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      const reformIntervals = JSON.parse(
        screen.getByTestId('reform-intervals').textContent || '[]'
      );

      // Should have base values (2020, 2024) plus user value (2023)
      // After merging, the 2023 value should override the 2024 base value
      expect(reformIntervals.length).toBeGreaterThan(1);

      // Check that reform contains intervals
      const hasPre2023Interval = reformIntervals.some(
        (interval: any) => interval.startDate < '2023-01-01'
      );
      const has2023Interval = reformIntervals.some(
        (interval: any) =>
          interval.startDate === '2023-01-01' && interval.value === 2000
      );

      expect(hasPre2023Interval).toBe(true); // Base value before 2023
      expect(has2023Interval).toBe(true); // User value from 2023
    });

    it('given user adds multiple values then reform merges all with base', () => {
      // Given - policy with multiple user-defined values
      const store = createTestStore({
        policy: {
          policies: [
            {
              id: '789',
              label: 'Complex Reform',
              parameters: [
                {
                  name: 'gov.test.parameter',
                  values: [
                    { startDate: '2022-01-01', endDate: '2023-12-31', value: 1800 },
                    { startDate: '2025-01-01', endDate: '2100-12-31', value: 2500 },
                  ],
                },
              ],
              isCreated: true,
            },
            null,
          ],
        },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      const reformIntervals = JSON.parse(
        screen.getByTestId('reform-intervals').textContent || '[]'
      );

      // Should have merged intervals
      expect(reformIntervals.length).toBeGreaterThan(0);

      // Verify user values are present
      const has1800Value = reformIntervals.some((i: any) => i.value === 1800);
      const has2500Value = reformIntervals.some((i: any) => i.value === 2500);

      expect(has1800Value).toBe(true);
      expect(has2500Value).toBe(true);
    });
  });

  describe('policy metadata propagation', () => {
    it('given policy with label then passes label to chart', () => {
      // Given
      const store = createTestStore({
        policy: {
          policies: [
            {
              id: '999',
              label: 'Universal Basic Income',
              parameters: [],
              isCreated: true,
            },
            null,
          ],
        },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByTestId('policy-label')).toHaveTextContent('Universal Basic Income');
    });

    it('given policy with ID then passes ID to chart', () => {
      // Given
      const store = createTestStore({
        policy: {
          policies: [
            {
              id: '12345',
              label: null,
              parameters: [],
              isCreated: true,
            },
            null,
          ],
        },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByTestId('policy-id')).toHaveTextContent('12345');
    });

    it('given no policy then passes null label and ID', () => {
      // Given
      const store = createTestStore({
        policy: { policies: [null, null] },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByTestId('policy-label')).toHaveTextContent('null');
      expect(screen.getByTestId('policy-id')).toHaveTextContent('null');
    });
  });

  describe('component rendering', () => {
    it('given component renders then displays parameter label', () => {
      // Given
      const store = createTestStore({
        policy: { policies: [null, null] },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Parameter');
    });

    it('given parameter has description then displays description', () => {
      // Given
      const store = createTestStore({
        policy: { policies: [null, null] },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByText('A test parameter')).toBeInTheDocument();
    });

    it('given component renders then includes ValueSetter', () => {
      // Given
      const store = createTestStore({
        policy: { policies: [null, null] },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByTestId('value-setter')).toBeInTheDocument();
    });

    it('given component renders then includes HistoricalValues', () => {
      // Given
      const store = createTestStore({
        policy: { policies: [null, null] },
        report: { mode: 'standalone', activeSimulationPosition: 0 },
      });

      // When
      renderWithStore(<PolicyParameterSelectorMain param={SAMPLE_PARAM} />, store);

      // Then
      expect(screen.getByTestId('historical-values')).toBeInTheDocument();
    });
  });
});
