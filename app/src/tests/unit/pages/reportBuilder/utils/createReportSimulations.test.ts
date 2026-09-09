import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createHousehold } from '@/api/household';
import { Household } from '@/models/Household';
import { createReportSimulations } from '@/pages/reportBuilder/utils/createReportSimulations';
import {
  CORRECTED_REPORT_YEAR,
  CURRENT_LAW_ID,
  mockCreateSimulationFn,
  mockDraftHouseholdSimulation,
  mockLocalStorageCreateFn,
  mockSingleSimReportState,
  mockTwoSimReportState,
  setupDefaultMocks,
  TEST_LABELS,
  TEST_POLICY_IDS,
  TEST_POPULATION,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/pages/reportBuilder/useReportSubmissionMocks';

vi.mock('@/api/household', () => ({ createHousehold: vi.fn() }));

vi.mock('@/api/simulation', () => ({
  createSimulation: (...args: any[]) => mockCreateSimulationFn(...args),
}));

vi.mock('@/api/simulationAssociation', () => ({
  LocalStorageSimulationStore: vi.fn().mockImplementation(() => ({
    create: mockLocalStorageCreateFn,
  })),
}));

vi.mock('@/adapters', () => ({
  SimulationAdapter: {
    toCreationPayload: (data: any) => ({
      population_id: data.populationId,
      policy_id: data.policyId,
      population_type: data.populationType,
    }),
  },
}));

vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'anonymous',
  CURRENT_YEAR: '2026',
}));

describe('createReportSimulations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  test('creates API simulations, local associations, and domain simulations', async () => {
    const result = await createReportSimulations({
      simulationStates: mockTwoSimReportState.simulations,
      countryId: 'us',
      currentLawId: CURRENT_LAW_ID,
    });

    expect(result.simulationIds).toEqual([
      TEST_SIMULATION_IDS.SIM_NEW_1,
      TEST_SIMULATION_IDS.SIM_NEW_2,
    ]);
    expect(result.simulations).toEqual([
      expect.objectContaining({
        id: TEST_SIMULATION_IDS.SIM_NEW_1,
        policyId: CURRENT_LAW_ID.toString(),
        populationId: TEST_POPULATION.GEOGRAPHY_ID,
        populationType: 'geography',
        label: TEST_LABELS.BASELINE,
      }),
      expect.objectContaining({
        id: TEST_SIMULATION_IDS.SIM_NEW_2,
        policyId: TEST_POLICY_IDS.REFORM_POLICY,
        populationId: TEST_POPULATION.GEOGRAPHY_ID,
        populationType: 'geography',
        label: TEST_LABELS.REFORM,
      }),
    ]);
    expect(mockCreateSimulationFn).toHaveBeenCalledTimes(2);
    expect(mockLocalStorageCreateFn).toHaveBeenCalledTimes(2);
  });

  test('creates a household simulation with the household population type', async () => {
    const householdSimulation = {
      ...mockTwoSimReportState.simulations[0],
      population: {
        label: 'Test household',
        type: 'household',
        household: Household.starter('us', mockTwoSimReportState.year).withId(
          TEST_POPULATION.HOUSEHOLD_ID
        ),
        geography: null,
      },
    };

    const result = await createReportSimulations({
      simulationStates: [householdSimulation] as any,
      countryId: 'us',
      currentLawId: CURRENT_LAW_ID,
    });

    expect(mockCreateSimulationFn).toHaveBeenCalledWith(
      'us',
      expect.objectContaining({
        population_id: TEST_POPULATION.HOUSEHOLD_ID,
        population_type: 'household',
      })
    );
    expect(result.simulations[0]).toEqual(
      expect.objectContaining({
        populationId: TEST_POPULATION.HOUSEHOLD_ID,
        populationType: 'household',
      })
    );
  });

  test('validates every simulation before creating any of them', async () => {
    const incompleteSimulations = [
      mockTwoSimReportState.simulations[0],
      {
        ...mockTwoSimReportState.simulations[1],
        population: {
          ...mockTwoSimReportState.simulations[1].population,
          geography: {
            ...mockTwoSimReportState.simulations[1].population.geography!,
            geographyId: '',
          },
        },
      },
    ];

    await expect(
      createReportSimulations({
        simulationStates: incompleteSimulations as any,
        countryId: 'us',
        currentLawId: CURRENT_LAW_ID,
      })
    ).rejects.toThrow('Report has incomplete simulations');
    expect(mockCreateSimulationFn).not.toHaveBeenCalled();
    expect(mockLocalStorageCreateFn).not.toHaveBeenCalled();
  });

  test('given a draft from another country then rejects every write before preparing households', async () => {
    await expect(
      createReportSimulations({
        simulationStates: [mockDraftHouseholdSimulation('us'), mockDraftHouseholdSimulation('uk')],
        countryId: 'us',
        currentLawId: CURRENT_LAW_ID,
        reportYear: CORRECTED_REPORT_YEAR,
      })
    ).rejects.toThrow('original country');
    expect(createHousehold).not.toHaveBeenCalled();
    expect(mockCreateSimulationFn).not.toHaveBeenCalled();
    expect(mockLocalStorageCreateFn).not.toHaveBeenCalled();
  });

  test('given a draft period differs from the report year then rejects writes instead of calculating the wrong period', async () => {
    await expect(
      createReportSimulations({
        simulationStates: [mockDraftHouseholdSimulation()],
        countryId: 'us',
        currentLawId: CURRENT_LAW_ID,
        reportYear: mockSingleSimReportState.year,
      })
    ).rejects.toThrow('Household inputs do not match report year');
    expect(createHousehold).not.toHaveBeenCalled();
    expect(mockCreateSimulationFn).not.toHaveBeenCalled();
  });

  test('does not persist an association when simulation creation returns no ID', async () => {
    mockCreateSimulationFn.mockResolvedValue({ result: { simulation_id: '' } });

    await expect(
      createReportSimulations({
        simulationStates: [mockTwoSimReportState.simulations[0]],
        countryId: 'us',
        currentLawId: CURRENT_LAW_ID,
      })
    ).rejects.toThrow('Simulation creation returned no ID');
    expect(mockLocalStorageCreateFn).not.toHaveBeenCalled();
  });
});
