import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, test } from 'vitest';
import HouseholdBreakdown from '@/components/household/HouseholdBreakdown';
import { ReportYearProvider } from '@/contexts/ReportYearContext';

const variable = (name: string, label: string, adds?: string[]) => ({
  name,
  label,
  entity: 'household',
  unit: 'currency-USD',
  valueType: 'float',
  definitionPeriod: 'year',
  ...(adds ? { adds } : {}),
});

const store = configureStore({
  reducer: {
    metadata: () => ({
      variables: {
        household_net_income: variable('household_net_income', 'net income', [
          'household_market_income',
        ]),
        household_market_income: variable('household_market_income', 'market income'),
      },
      parameters: {},
      entities: { household: { plural: 'households' } },
    }),
  } as any,
});

const household = {
  id: '1',
  countryId: 'us',
  householdData: {
    people: {},
    households: { 'your household': { household_market_income: { 2026: 30000 } } },
  },
} as any;

function renderTree(unchangedShowsValue?: boolean) {
  return render(
    <Provider store={store}>
      <ReportYearProvider year="2026">
        <HouseholdBreakdown
          baseline={household}
          reform={household}
          borderColor="#000"
          unchangedShowsValue={unchangedShowsValue}
        />
      </ReportYearProvider>
    </Provider>
  );
}

describe('HouseholdBreakdown unchanged lines', () => {
  test('given no option then an unchanged line shows its change, as before', () => {
    renderTree();
    expect(screen.getByText(/market income stayed the same at/)).toBeInTheDocument();
    expect(screen.queryByText('$30,000')).not.toBeInTheDocument();
  });

  test('given unchangedShowsValue then an unchanged line shows its value', () => {
    renderTree(true);
    expect(screen.getByText('$30,000')).toBeInTheDocument();
  });
});
