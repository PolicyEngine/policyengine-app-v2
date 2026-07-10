import { describe, expect, test } from 'vitest';
import { buildHouseholdCalculationConfigs } from '@/pages/report-output/householdCalculationConfigs';
import {
  HOUSEHOLD_CALCULATION_CONFIG_IDS,
  HOUSEHOLD_CALCULATION_YEAR,
  HOUSEHOLD_POPULATION,
  HOUSEHOLD_REPORT,
  HOUSEHOLD_SIMULATIONS,
} from '@/tests/fixtures/pages/report-output/householdCalculationConfigs';

describe('buildHouseholdCalculationConfigs', () => {
  test('given a pending household report then each simulation gets one managed calculation', () => {
    // Given
    const report = HOUSEHOLD_REPORT;
    const simulations = HOUSEHOLD_SIMULATIONS;

    // When
    const configs = buildHouseholdCalculationConfigs(report, simulations, [HOUSEHOLD_POPULATION]);

    // Then
    expect(configs).toHaveLength(2);
    expect(configs.map((config) => config.calcId)).toEqual([
      HOUSEHOLD_CALCULATION_CONFIG_IDS.BASELINE_SIMULATION,
      HOUSEHOLD_CALCULATION_CONFIG_IDS.REFORM_SIMULATION,
    ]);
    expect(configs[0]).toMatchObject({
      targetType: 'simulation',
      countryId: 'us',
      year: HOUSEHOLD_CALCULATION_YEAR,
      reportId: HOUSEHOLD_CALCULATION_CONFIG_IDS.REPORT,
      populations: { household1: HOUSEHOLD_POPULATION },
    });
  });

  test('given a report without a durable id then no calculation is started', () => {
    // Given
    const report = { ...HOUSEHOLD_REPORT, id: undefined };

    // When
    const configs = buildHouseholdCalculationConfigs(report, HOUSEHOLD_SIMULATIONS, [
      HOUSEHOLD_POPULATION,
    ]);

    // Then
    expect(configs).toEqual([]);
  });

  test('given a simulation without a durable id then it is excluded', () => {
    // Given
    const simulations = [{ ...HOUSEHOLD_SIMULATIONS[0], id: undefined }];

    // When
    const configs = buildHouseholdCalculationConfigs(HOUSEHOLD_REPORT, simulations, [
      HOUSEHOLD_POPULATION,
    ]);

    // Then
    expect(configs).toEqual([]);
  });

  test('given one persisted simulation then only the unfinished simulation is resumed', () => {
    // Given
    const simulations = [
      {
        ...HOUSEHOLD_SIMULATIONS[0],
        status: 'complete' as const,
        output: { result: { people: {} } },
      },
      HOUSEHOLD_SIMULATIONS[1],
    ];

    // When
    const configs = buildHouseholdCalculationConfigs(HOUSEHOLD_REPORT, simulations, [
      HOUSEHOLD_POPULATION,
    ]);

    // Then
    expect(configs.map((config) => config.calcId)).toEqual([
      HOUSEHOLD_CALCULATION_CONFIG_IDS.REFORM_SIMULATION,
    ]);
  });

  test('given a pending simulation with stale output then it is recalculated', () => {
    // Given
    const simulations = [
      {
        ...HOUSEHOLD_SIMULATIONS[0],
        status: 'pending' as const,
        output: { people: { adult: { income_tax: { '2026': 100 } } } },
      },
    ];

    // When
    const configs = buildHouseholdCalculationConfigs(HOUSEHOLD_REPORT, simulations, [
      HOUSEHOLD_POPULATION,
    ]);

    // Then
    expect(configs.map((config) => config.calcId)).toEqual([
      HOUSEHOLD_CALCULATION_CONFIG_IDS.BASELINE_SIMULATION,
    ]);
  });

  test('given a terminal simulation error then it is not restarted implicitly', () => {
    // Given
    const simulations = [{ ...HOUSEHOLD_SIMULATIONS[0], status: 'error' as const }];

    // When
    const configs = buildHouseholdCalculationConfigs(HOUSEHOLD_REPORT, simulations, [
      HOUSEHOLD_POPULATION,
    ]);

    // Then
    expect(configs).toEqual([]);
  });
});
