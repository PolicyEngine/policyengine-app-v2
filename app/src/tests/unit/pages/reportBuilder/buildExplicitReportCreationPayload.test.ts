import { describe, expect, test } from 'vitest';
import { buildExplicitReportCreationPayload } from '@/pages/reportBuilder/utils/buildExplicitReportCreationPayload';
import { Simulation } from '@/types/ingredients/Simulation';

describe('buildExplicitReportCreationPayload', () => {
  test('given household single simulation then builds an explicit household report spec', () => {
    const simulation1: Simulation = {
      id: '10',
      countryId: 'us',
      policyId: '42',
      populationId: 'household-123',
      populationType: 'household',
      label: 'Baseline',
      isCreated: true,
      status: 'pending',
      output: null,
    };

    const payload = buildExplicitReportCreationPayload({
      countryId: 'us',
      year: '2026',
      simulationIds: ['10'],
      simulation1,
      simulation2: null,
    });

    expect(payload).toEqual({
      simulation_1_id: 10,
      simulation_2_id: null,
      year: '2026',
      report_spec_schema_version: 1,
      report_spec: {
        country_id: 'us',
        report_kind: 'household_single',
        time_period: '2026',
        simulation_1: {
          population_type: 'household',
          population_id: 'household-123',
          policy_id: 42,
        },
        simulation_2: null,
      },
    });
  });

  test('given economy comparison simulations then builds an explicit economy report spec', () => {
    const simulation1: Simulation = {
      id: '11',
      countryId: 'us',
      policyId: '0',
      populationId: 'us',
      populationType: 'geography',
      label: 'Baseline',
      isCreated: true,
      status: 'pending',
      output: null,
    };
    const simulation2: Simulation = {
      id: '12',
      countryId: 'us',
      policyId: '101',
      populationId: 'us',
      populationType: 'geography',
      label: 'Reform',
      isCreated: true,
      status: 'pending',
      output: null,
    };

    const payload = buildExplicitReportCreationPayload({
      countryId: 'us',
      year: '2026',
      simulationIds: ['11', '12'],
      simulation1,
      simulation2,
    });

    expect(payload).toEqual({
      simulation_1_id: 11,
      simulation_2_id: 12,
      year: '2026',
      report_spec_schema_version: 1,
      report_spec: {
        country_id: 'us',
        report_kind: 'economy_comparison',
        time_period: '2026',
        region: 'us',
        baseline_policy_id: 0,
        reform_policy_id: 101,
        dataset: 'default',
        target: 'general',
        options: {},
      },
    });
  });

  test('given mismatched comparison populations then throws', () => {
    const simulation1: Simulation = {
      id: '11',
      countryId: 'us',
      policyId: '0',
      populationId: 'us',
      populationType: 'geography',
      label: 'Baseline',
      isCreated: true,
      status: 'pending',
      output: null,
    };
    const simulation2: Simulation = {
      id: '12',
      countryId: 'us',
      policyId: '101',
      populationId: 'ca',
      populationType: 'geography',
      label: 'Reform',
      isCreated: true,
      status: 'pending',
      output: null,
    };

    expect(() =>
      buildExplicitReportCreationPayload({
        countryId: 'us',
        year: '2026',
        simulationIds: ['11', '12'],
        simulation1,
        simulation2,
      })
    ).toThrow('comparison reports require matching population IDs');
  });
});
