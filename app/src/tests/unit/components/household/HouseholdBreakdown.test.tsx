import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, test } from 'vitest';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import VariableArithmetic from '@/components/household/VariableArithmetic';
import { ReportYearProvider } from '@/contexts/ReportYearContext';
import metadataReducer from '@/reducers/metadataReducer';
import type { AppHouseholdInputEnvelope as Household } from '@/models/household/appTypes';
import type { MetadataState } from '@/types/metadata';

const TEST_METADATA: MetadataState = {
  loading: false,
  error: null,
  currentCountry: 'us',
  progress: 100,
  variables: {
    household_net_income: {
      entity: 'household',
      label: 'net income',
      unit: 'currency-USD',
      valueType: 'float',
      adds: [
        'household_market_income',
        'household_benefits',
        'household_refundable_tax_credits',
      ],
      subtracts: ['household_tax_before_refundable_credits'],
    } as any,
    household_market_income: {
      entity: 'household',
      label: 'market income',
      unit: 'currency-USD',
      valueType: 'float',
      adds: ['employment_income'],
    } as any,
    employment_income: {
      entity: 'household',
      label: 'employment income',
      unit: 'currency-USD',
      valueType: 'float',
    } as any,
    household_benefits: {
      entity: 'household',
      label: 'benefits',
      unit: 'currency-USD',
      valueType: 'float',
    } as any,
    household_tax_before_refundable_credits: {
      entity: 'household',
      label: 'tax before refundable credits',
      unit: 'currency-USD',
      valueType: 'float',
    } as any,
    household_refundable_tax_credits: {
      entity: 'household',
      label: 'refundable tax credits',
      unit: 'currency-USD',
      valueType: 'float',
    } as any,
  },
  parameters: {},
  entities: {
    household: {
      plural: 'households',
      label: 'Household',
      description: 'A household unit',
    } as any,
  },
  variableModules: {},
  economyOptions: {
    region: [],
    time_period: [],
    datasets: [],
  },
  currentLawId: 1,
  basicInputs: [],
  modelledPolicies: {
    core: {},
    filtered: {},
  },
  version: '1.0.0',
  parameterTree: null,
};

const TEST_HOUSEHOLD: Household = {
  id: 'household-1',
  countryId: 'us',
  householdData: {
    people: {},
    households: {
      'your household': {
        members: [],
        household_net_income: { '2026': 100 },
        household_market_income: { '2026': 0 },
        employment_income: { '2026': 0 },
        household_benefits: { '2026': 100 },
        household_tax_before_refundable_credits: { '2026': 0 },
        household_refundable_tax_credits: { '2026': 0 },
      },
    },
  },
};

function renderWithMetadata(ui: ReactNode) {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata: TEST_METADATA },
  });

  return render(
    <Provider store={store}>
      <ReportYearProvider year="2026">{ui}</ReportYearProvider>
    </Provider>
  );
}

describe('Household breakdown visibility', () => {
  test('given VariableArithmetic with default child visibility then only non-zero direct children render', () => {
    renderWithMetadata(
      <VariableArithmetic
        variableName="household_net_income"
        baseline={TEST_HOUSEHOLD}
        reform={null}
        isAdd
        defaultExpanded
      />
    );

    expect(screen.getByText(/Your benefits are/i)).toBeInTheDocument();
    expect(screen.queryByText(/Your market income is/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Your refundable tax credits are/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Your tax before refundable credits/i)).not.toBeInTheDocument();
  });

  test('given HouseholdBreakdown then all first-tier net-income branches render while zero grandchildren stay hidden', () => {
    renderWithMetadata(
      <HouseholdBreakdown baseline={TEST_HOUSEHOLD} reform={null} borderColor="#000000" />
    );

    expect(screen.getByText(/Your market income is/i)).toBeInTheDocument();
    expect(screen.getByText(/Your benefits are/i)).toBeInTheDocument();
    expect(screen.getByText(/Your refundable tax credits are/i)).toBeInTheDocument();
    expect(screen.getByText(/Your tax before refundable credits/i)).toBeInTheDocument();
    expect(screen.queryByText(/Your employment income is/i)).not.toBeInTheDocument();
  });
});
