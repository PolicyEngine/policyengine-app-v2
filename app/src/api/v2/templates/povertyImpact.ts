/**
 * Poverty impact template - main UK poverty rates
 */

import type { TemplateConfigGetter } from './types';

export const povertyImpactConfig: TemplateConfigGetter = (country) => {
  if (country === 'uk') {
    return {
      variables: [
        { variable: 'in_poverty_bhc', aggregateFunction: 'mean' },
        { variable: 'in_poverty_ahc', aggregateFunction: 'mean' },
        { variable: 'in_relative_poverty_bhc', aggregateFunction: 'mean' },
        { variable: 'in_relative_poverty_ahc', aggregateFunction: 'mean' },
      ],
    };
  }

  // Fallback for non-UK
  return {
    variables: [
      { variable: 'in_poverty', aggregateFunction: 'mean' },
    ],
  };
};
