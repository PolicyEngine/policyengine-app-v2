import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import type { CalcStartConfig } from '@/types/calculation';
import type { Household, HouseholdData } from '@/types/ingredients/Household';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';
import type {
  CalcConfigSnapshot,
  CalculatorCalcType,
  HouseholdSnapshot,
  ReportConfigSnapshot,
  SimulationSnapshot,
} from './analyticsSchemas';

type SimulationLike = Simulation | SimulationStateProps | null | undefined;

function normalizeCalcType(
  calcType: 'household' | 'societyWide' | 'society_wide' | null | undefined
): CalculatorCalcType | undefined {
  if (!calcType) {
    return undefined;
  }

  return calcType === 'societyWide' ? 'society_wide' : calcType;
}

function isSimulationState(simulation: SimulationLike): simulation is SimulationStateProps {
  return Boolean(simulation && 'policy' in simulation && 'population' in simulation);
}

function getPopulationType(
  population: PopulationStateProps | undefined
): 'household' | 'geography' | undefined {
  if (!population) {
    return undefined;
  }

  if (population.household?.id) {
    return 'household';
  }

  if (population.geography?.geographyId || population.geography?.id) {
    return 'geography';
  }

  return undefined;
}

function getPopulationLabel(population: PopulationStateProps | undefined): string | null | undefined {
  return population?.label ?? population?.household?.id ?? population?.geography?.geographyId ?? null;
}

function getPopulationId(population: PopulationStateProps | undefined): string | undefined {
  return population?.household?.id ?? population?.geography?.geographyId ?? population?.geography?.id;
}

function getVariableNames(householdData: HouseholdData): string[] {
  const variableNames = new Set<string>();

  Object.entries(householdData).forEach(([entityName, entities]) => {
    Object.values(entities).forEach((entity) => {
      if (!entity || typeof entity !== 'object') {
        return;
      }

      Object.keys(entity).forEach((key) => {
        if (entityName !== 'people' && key === 'members') {
          return;
        }
        variableNames.add(key);
      });
    });
  });

  return Array.from(variableNames).sort();
}

export function buildHouseholdSnapshot(
  household: Household | null | undefined
): HouseholdSnapshot | null {
  if (!household) {
    return null;
  }

  const householdData = household.householdData ?? { people: {} };
  const people = Object.keys(householdData.people ?? {}).sort();
  const groupCounts = Object.fromEntries(
    Object.entries(householdData)
      .filter(([entityName]) => entityName !== 'people')
      .map(([entityName, entities]) => [entityName, Object.keys(entities ?? {}).length])
  );

  return {
    household_id: household.id,
    people_count: people.length,
    people,
    group_counts: groupCounts,
    variable_names: getVariableNames(householdData),
    household_data: householdData as unknown as Record<string, unknown>,
  };
}

export function buildSimulationSnapshot(
  simulation: SimulationLike
): SimulationSnapshot | null {
  if (!simulation) {
    return null;
  }

  if (isSimulationState(simulation)) {
    return {
      simulation_id: simulation.id,
      label: simulation.label,
      policy_id: simulation.policy.id,
      population_id: getPopulationId(simulation.population),
      population_type: getPopulationType(simulation.population),
      population_label: getPopulationLabel(simulation.population),
    };
  }

  return {
    simulation_id: simulation.id,
    label: simulation.label,
    policy_id: simulation.policyId,
    population_id: simulation.populationId,
    population_type: simulation.populationType,
    population_label: null,
  };
}

export function buildReportBuilderSnapshot(
  reportState: ReportBuilderState
): ReportConfigSnapshot {
  const simulations = reportState.simulations
    .map((simulation) => buildSimulationSnapshot(simulation))
    .filter((simulation): simulation is SimulationSnapshot => simulation !== null);

  const hasGeographySimulation = simulations.some(
    (simulation) => simulation.population_type === 'geography'
  );

  return {
    label: reportState.label,
    year: reportState.year,
    simulation_count: simulations.length,
    calc_type: hasGeographySimulation ? 'society_wide' : 'household',
    simulations,
  };
}

export function buildPersistedReportSnapshot(
  report: Report,
  simulations: Array<Simulation | null | undefined> = []
): ReportConfigSnapshot {
  const simulationSnapshots = simulations
    .map((simulation) => buildSimulationSnapshot(simulation))
    .filter((simulation): simulation is SimulationSnapshot => simulation !== null);

  const calcType =
    normalizeCalcType(
      simulationSnapshots.some((simulation) => simulation.population_type === 'geography')
        ? 'society_wide'
        : report.outputType === 'economy'
          ? 'society_wide'
          : report.outputType === 'household'
            ? 'household'
            : null
    ) ?? undefined;

  return {
    report_id: report.id,
    label: report.label,
    year: report.year,
    simulation_count: report.simulationIds.length,
    simulation_ids: report.simulationIds,
    calc_type: calcType,
    simulations: simulationSnapshots,
  };
}

export function buildCalcConfigSnapshot(config: CalcStartConfig): CalcConfigSnapshot {
  const simulations = [config.simulations.simulation1, config.simulations.simulation2]
    .map((simulation) => buildSimulationSnapshot(simulation))
    .filter((simulation): simulation is SimulationSnapshot => simulation !== null);

  const households = [config.populations.household1, config.populations.household2]
    .map((household) => buildHouseholdSnapshot(household))
    .filter((household): household is HouseholdSnapshot => household !== null);

  const geographies = [config.populations.geography1, config.populations.geography2]
    .filter((geography): geography is NonNullable<typeof geography> => Boolean(geography))
    .map((geography) => ({
      geography_id: geography.geographyId,
      scope: geography.scope,
    }));

  const calcType = normalizeCalcType(
    config.simulations.simulation1.populationType === 'household' ? 'household' : 'society_wide'
  ) as CalculatorCalcType;

  return {
    calc_id: config.calcId,
    target_type: config.targetType,
    country_id: config.countryId,
    year: config.year,
    report_id: config.reportId,
    calc_type: calcType,
    simulations,
    households,
    geographies,
  };
}

export function getHouseholdMaritalStatus(
  household: Household | null | undefined
): 'single' | 'married' {
  const people = Object.keys(household?.householdData.people ?? {});
  return people.includes('your partner') ? 'married' : 'single';
}

export function getHouseholdChildCount(household: Household | null | undefined): number {
  return Object.keys(household?.householdData.people ?? {}).filter((personKey) =>
    personKey.includes('dependent')
  ).length;
}
