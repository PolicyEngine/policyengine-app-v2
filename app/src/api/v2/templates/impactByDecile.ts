/**
 * Impact by income decile template - shows how reform affects different income groups
 */

import type { TemplateConfigGetter } from './types';

export const impactByDecileConfig: TemplateConfigGetter = (country) => {
  if (country === 'uk') {
    return {
      variables: Array.from({ length: 10 }, (_, i) => ({
        variable: 'hbai_household_net_income',
        aggregateFunction: 'mean' as const,
        filterVariable: 'equiv_hbai_household_net_income',
        filterQuantileGeq: i / 10,
        filterQuantileLeq: (i + 1) / 10,
      })),
    };
  }

  // Fallback for non-UK
  return {
    variables: Array.from({ length: 10 }, (_, i) => ({
      variable: 'household_net_income',
      aggregateFunction: 'mean' as const,
      filterVariable: 'household_income',
      filterQuantileGeq: i / 10,
      filterQuantileLeq: (i + 1) / 10,
    })),
  };
};
