import { describe, expect, test } from 'vitest';
import { hydrateReportBuilderState } from '@/pages/reportBuilder/utils/hydrateReportBuilderState';

describe('hydrateReportBuilderState', () => {
  test('given a user policy association then hydrates policy association id', () => {
    const result = hydrateReportBuilderState({
      userReport: {
        id: 'sur-1',
        userId: 'user-1',
        reportId: 'report-1',
        countryId: 'us',
        label: 'Report',
      },
      report: {
        id: 'report-1',
        countryId: 'us',
        year: '2026',
        apiVersion: 'v1',
        simulationIds: ['sim-1'],
        status: 'complete',
      },
      simulations: [
        {
          id: 'sim-1',
          countryId: 'us',
          policyId: 'policy-1',
          populationId: 'us',
          populationType: 'geography',
          label: null,
          isCreated: true,
        },
      ],
      policies: [
        {
          id: 'policy-1',
          countryId: 'us',
          parameters: [{ name: 'gov.test.parameter', values: [] }],
        },
      ],
      households: [],
      geographies: [
        {
          id: 'us',
          countryId: 'us',
          scope: 'national',
          geographyId: 'us',
          name: 'United States',
        },
      ],
      userSimulations: [],
      userPolicies: [
        {
          id: 'sup-1',
          userId: 'user-1',
          policyId: 'policy-1',
          countryId: 'us',
          label: 'Editable policy',
        },
      ],
      userHouseholds: [],
      currentLawId: 1,
    });

    expect(result.simulations[0].policy).toMatchObject({
      id: 'policy-1',
      associationId: 'sup-1',
      label: 'Editable policy',
    });
  });
});
