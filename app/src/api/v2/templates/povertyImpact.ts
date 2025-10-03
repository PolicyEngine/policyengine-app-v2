/**
 * Poverty impact template - main UK poverty rates
 */

import type { TemplateConfigGetter } from './types';

export const povertyImpactConfig: TemplateConfigGetter = (country) => {
  if (country === 'uk') {
    const povertyVariables = [
      'in_poverty_bhc',
      'in_poverty_ahc',
      'in_relative_poverty_bhc',
      'in_relative_poverty_ahc',
    ];

    return {
      variables: [
        // Mean (poverty rate as percentage)
        ...povertyVariables.map(variable => ({
          variable,
          aggregateFunction: 'mean' as const,
          entity: 'person',
        })),
        // Sum (total number of people in poverty)
        ...povertyVariables.map(variable => ({
          variable,
          aggregateFunction: 'sum' as const,
          entity: 'person',
        })),
      ],
    };
  }

  // Fallback for non-UK
  return {
    variables: [
      { variable: 'in_poverty', aggregateFunction: 'mean', entity: 'person' },
      { variable: 'in_poverty', aggregateFunction: 'sum', entity: 'person' },
    ],
  };
};
