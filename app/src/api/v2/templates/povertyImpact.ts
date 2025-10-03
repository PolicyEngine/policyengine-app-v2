/**
 * Poverty impact template - main UK poverty rates
 */

import type { TemplateConfigGetter } from './types';

export const povertyImpactConfig: TemplateConfigGetter = (country) => {
  if (country === 'uk') {
    return {
      variables: [
        { variable: 'in_poverty_bhc', aggregateFunction: 'mean', entity: 'person' },
        { variable: 'in_poverty_ahc', aggregateFunction: 'mean', entity: 'person' },
        { variable: 'in_relative_poverty_bhc', aggregateFunction: 'mean', entity: 'person' },
        { variable: 'in_relative_poverty_ahc', aggregateFunction: 'mean', entity: 'person' },
      ],
    };
  }

  // Fallback for non-UK
  return {
    variables: [
      { variable: 'in_poverty', aggregateFunction: 'mean', entity: 'person' },
    ],
  };
};
