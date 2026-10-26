import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, test } from 'vitest';
import VariableArithmetic from '@/components/household/VariableArithmetic';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import metadataReducer from '@/reducers/metadataReducer';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';

/** A parameter whose value lists the variables benefits add: SNAP, then SNAP and SSI from 2026. */
const BENEFITS_PARTS = 'gov.household.household_benefits';
/** A parameter the catalog version does not have values for. */
const ABSENT_PARTS = 'gov.example.absent_deductions';

const BENEFITS_PARTS_VALUES = { '0000-01-01': ['snap'], '2026-01-01': ['snap', 'ssi'] };

function householdVariable(label: string, fields: Record<string, unknown> = {}) {
  return { entity: 'household', label, unit: 'currency-USD', valueType: 'float', ...fields } as any;
}

const VARIABLES: MetadataState['variables'] = {
  household_benefits: householdVariable('benefits', { adds: BENEFITS_PARTS }),
  countable_income: householdVariable('countable income', {
    adds: ['earnings'],
    subtracts: ABSENT_PARTS,
  }),
  earnings: householdVariable('earnings'),
  snap: householdVariable('SNAP'),
  ssi: householdVariable('SSI'),
};

function metadataState(fields: Partial<MetadataState>): MetadataState {
  return {
    loading: false,
    error: null,
    currentCountry: 'us',
    progress: 100,
    variables: VARIABLES,
    parameters: {},
    entities: { household: { plural: 'households', label: 'Household' } as any },
    variableModules: {},
    economyOptions: { region: [], time_period: [], datasets: [] },
    currentLawId: 2,
    basicInputs: [],
    modelledPolicies: { core: {}, filtered: {} },
    version: '6.11.1',
    parameterTree: null,
    ...fields,
  };
}

/** On the v2 routes: no parameter list, and the parts' dated values from the variables route. */
const V2_METADATA = metadataState({
  routes: 'v2',
  v2PartParameterValues: { [BENEFITS_PARTS]: BENEFITS_PARTS_VALUES, [ABSENT_PARTS]: {} },
});

/** On the v1 routes: the parts' parameter is in the whole parameter list. */
const V1_METADATA = metadataState({
  parameters: {
    [BENEFITS_PARTS]: {
      type: 'parameter',
      parameter: BENEFITS_PARTS,
      label: 'Benefits',
      values: BENEFITS_PARTS_VALUES,
    } as any,
  },
});

function household(year: string): HouseholdCalculationOutput {
  return {
    id: 'household-1',
    countryId: 'us',
    householdData: {
      people: {},
      households: {
        'your household': {
          members: [],
          household_benefits: { [year]: 300 },
          countable_income: { [year]: 1000 },
          earnings: { [year]: 1000 },
          snap: { [year]: 100 },
          ssi: { [year]: 200 },
        },
      },
    },
  } as HouseholdCalculationOutput;
}

function renderBreakdown(metadata: MetadataState, year: string, variableName: string): void {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata },
  });
  const ui: ReactNode = (
    <VariableArithmetic
      variableName={variableName}
      baseline={household(year)}
      reform={null}
      isAdd
      defaultExpanded
    />
  );
  render(
    <Provider store={store}>
      <ReportYearProvider year={year}>{ui}</ReportYearProvider>
    </Provider>
  );
}

describe('VariableArithmetic with parts named by a parameter', () => {
  test('given v2 metadata and a 2025 report then benefits add the list in force in 2025', () => {
    // When
    renderBreakdown(V2_METADATA, '2025', 'household_benefits');

    // Then
    expect(screen.getByText(/Your SNAP/)).toBeInTheDocument();
    expect(screen.queryByText(/Your SSI/)).not.toBeInTheDocument();
  });

  test('given v2 metadata and a report for the year the list changes then the new list applies', () => {
    // When
    renderBreakdown(V2_METADATA, '2026', 'household_benefits');

    // Then
    expect(screen.getByText(/Your SNAP/)).toBeInTheDocument();
    expect(screen.getByText(/Your SSI/)).toBeInTheDocument();
  });

  test('given v2 metadata and a parameter without values then nothing is subtracted', () => {
    // When
    renderBreakdown(V2_METADATA, '2026', 'countable_income');

    // Then
    expect(screen.getByText(/Your earnings/)).toBeInTheDocument();
    expect(screen.queryByText(/Your SNAP/)).not.toBeInTheDocument();
  });

  test('given v1 metadata then the parts still come from the whole parameter list', () => {
    // When
    renderBreakdown(V1_METADATA, '2025', 'household_benefits');

    // Then
    expect(screen.getByText(/Your SNAP/)).toBeInTheDocument();
    expect(screen.queryByText(/Your SSI/)).not.toBeInTheDocument();
  });
});
