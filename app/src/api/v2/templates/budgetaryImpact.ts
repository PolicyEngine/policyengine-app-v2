/**
 * Budgetary impact template - top-level government revenue, spending and balance
 */

import type { TemplateConfigGetter } from './types';

export const budgetaryImpactConfig: TemplateConfigGetter = (country) => {
  if (country === 'uk') {
    return {
      variables: [
        { variable: 'gov_tax', aggregateFunction: 'sum' },
        { variable: 'gov_spending', aggregateFunction: 'sum' },
        { variable: 'gov_balance', aggregateFunction: 'sum' },
      ],
    };
  }

  // Default fallback for other countries
  return {
    variables: [
      { variable: 'household_net_income', aggregateFunction: 'mean' },
    ],
  };
};
