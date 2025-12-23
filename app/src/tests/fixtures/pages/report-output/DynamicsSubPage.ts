import { configureStore } from '@reduxjs/toolkit';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata';

export const MOCK_PARAMETER_METADATA: Record<string, ParameterMetadata> = {
  'gov.irs.credits.ctc.amount': {
    parameter: 'gov.irs.credits.ctc.amount',
    label: 'Child Tax Credit amount',
    unit: 'currency-USD',
    description: 'The amount of the Child Tax Credit',
    type: 'parameter',
  },
  'gov.simulation.time_period': {
    parameter: 'gov.simulation.time_period',
    label: 'Time period',
    unit: '',
    description: 'Simulation time period',
    type: 'parameter',
  },
};

export const MOCK_POLICY_BASELINE: Policy = {
  id: 'policy-1',
  countryId: 'us',
  label: 'Current Law',
  apiVersion: '1.0.0',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
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

export const MOCK_POLICY_REFORM: Policy = {
  id: 'policy-2',
  countryId: 'us',
  label: 'Reform Policy',
  apiVersion: '1.0.0',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          value: 3000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      ],
    },
  ],
};

export function createMockStore() {
  return configureStore({
    reducer: {
      metadata: (
        state = {
          parameters: MOCK_PARAMETER_METADATA,
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
}
