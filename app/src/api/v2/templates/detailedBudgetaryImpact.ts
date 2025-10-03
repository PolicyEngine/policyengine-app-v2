/**
 * Detailed budgetary impact template - breakdown by major UK programmes
 */

import type { TemplateConfigGetter } from './types';

export const detailedBudgetaryImpactConfig: TemplateConfigGetter = (country) => {
  if (country === 'uk') {
    return {
      variables: [
        // Benefits
        { variable: 'child_benefit', aggregateFunction: 'sum' },
        { variable: 'universal_credit', aggregateFunction: 'sum' },
        { variable: 'pension_credit', aggregateFunction: 'sum' },
        { variable: 'state_pension', aggregateFunction: 'sum' },
        { variable: 'working_tax_credit', aggregateFunction: 'sum' },
        { variable: 'child_tax_credit', aggregateFunction: 'sum' },
        { variable: 'housing_benefit', aggregateFunction: 'sum' },
        { variable: 'income_support', aggregateFunction: 'sum' },
        { variable: 'jsa_income', aggregateFunction: 'sum' },
        { variable: 'jsa_contrib', aggregateFunction: 'sum' },
        { variable: 'esa_income', aggregateFunction: 'sum' },
        { variable: 'esa_contrib', aggregateFunction: 'sum' },
        { variable: 'dla', aggregateFunction: 'sum' },
        { variable: 'pip', aggregateFunction: 'sum' },
        { variable: 'attendance_allowance', aggregateFunction: 'sum' },
        { variable: 'carers_allowance', aggregateFunction: 'sum' },
        { variable: 'winter_fuel_allowance', aggregateFunction: 'sum' },

        // Taxes
        { variable: 'income_tax', aggregateFunction: 'sum' },
        { variable: 'national_insurance', aggregateFunction: 'sum' },
        { variable: 'council_tax', aggregateFunction: 'sum' },
        { variable: 'vat', aggregateFunction: 'sum' },
      ],
    };
  }

  // Fallback for non-UK
  return {
    variables: [
      { variable: 'household_net_income', aggregateFunction: 'mean' },
    ],
  };
};
