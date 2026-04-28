import { countryIds } from '@/libs/countries';
import { Simulation } from '@/types/ingredients/Simulation';
import { ReportCreationPayload } from '@/types/payloads';
import {
  EconomyReportSpec,
  ExplicitReportSpec,
  HouseholdReportSpec,
  REPORT_SPEC_SCHEMA_VERSION,
  ReportSimulationInput,
} from '@/types/reportSpec';

interface BuildExplicitReportCreationPayloadArgs {
  countryId: (typeof countryIds)[number];
  year: string;
  simulationIds: string[];
  simulation1: Simulation | null;
  simulation2?: Simulation | null;
}

function toSimulationId(simulationId: string, fieldName: string): number {
  const parsedId = Number.parseInt(simulationId, 10);
  if (Number.isNaN(parsedId)) {
    throw new Error(`[buildExplicitReportCreationPayload] ${fieldName} must be numeric`);
  }

  return parsedId;
}

function toPolicyId(simulation: Simulation, fieldName: string): number {
  if (!simulation.policyId) {
    throw new Error(`[buildExplicitReportCreationPayload] ${fieldName} is missing policyId`);
  }

  const policyId = Number.parseInt(simulation.policyId, 10);
  if (Number.isNaN(policyId)) {
    throw new Error(
      `[buildExplicitReportCreationPayload] ${fieldName} policyId must be numeric`
    );
  }

  return policyId;
}

function toReportSimulationInput(
  simulation: Simulation,
  fieldName: string
): ReportSimulationInput {
  if (!simulation.populationId || !simulation.populationType) {
    throw new Error(
      `[buildExplicitReportCreationPayload] ${fieldName} is missing population configuration`
    );
  }

  return {
    population_type: simulation.populationType,
    population_id: simulation.populationId,
    policy_id: toPolicyId(simulation, fieldName),
  };
}

export function buildExplicitReportSpec({
  countryId,
  year,
  simulation1,
  simulation2 = null,
}: Omit<BuildExplicitReportCreationPayloadArgs, 'simulationIds'>): ExplicitReportSpec {
  if (!simulation1) {
    throw new Error('[buildExplicitReportCreationPayload] simulation1 is required');
  }

  if (!simulation1.populationType || !simulation1.populationId) {
    throw new Error(
      '[buildExplicitReportCreationPayload] simulation1 must include population data'
    );
  }

  if (simulation2 && simulation2.populationType !== simulation1.populationType) {
    throw new Error(
      '[buildExplicitReportCreationPayload] simulation population types must match'
    );
  }

  if (simulation2 && simulation2.populationId !== simulation1.populationId) {
    throw new Error(
      '[buildExplicitReportCreationPayload] comparison reports require matching population IDs'
    );
  }

  if (simulation1.populationType === 'household') {
    const reportSpec: HouseholdReportSpec = {
      country_id: countryId,
      report_kind: simulation2 ? 'household_comparison' : 'household_single',
      time_period: year,
      simulation_1: toReportSimulationInput(simulation1, 'simulation1'),
      simulation_2: simulation2 ? toReportSimulationInput(simulation2, 'simulation2') : null,
    };

    return reportSpec;
  }

  const baselinePolicyId = toPolicyId(simulation1, 'simulation1');
  const reformPolicyId = simulation2
    ? toPolicyId(simulation2, 'simulation2')
    : baselinePolicyId;

  const reportSpec: EconomyReportSpec = {
    country_id: countryId,
    report_kind: simulation2 ? 'economy_comparison' : 'economy_single',
    time_period: year,
    region: simulation1.populationId,
    baseline_policy_id: baselinePolicyId,
    reform_policy_id: reformPolicyId,
    dataset: 'default',
    target: 'general',
    options: {},
  };

  return reportSpec;
}

export function buildExplicitReportCreationPayload({
  countryId,
  year,
  simulationIds,
  simulation1,
  simulation2 = null,
}: BuildExplicitReportCreationPayloadArgs): ReportCreationPayload {
  const [simulation1Id, simulation2Id] = simulationIds;
  if (!simulation1Id) {
    throw new Error('[buildExplicitReportCreationPayload] simulationIds[0] is required');
  }

  return {
    simulation_1_id: toSimulationId(simulation1Id, 'simulationIds[0]'),
    simulation_2_id: simulation2Id ? toSimulationId(simulation2Id, 'simulationIds[1]') : null,
    year,
    report_spec: buildExplicitReportSpec({
      countryId,
      year,
      simulation1,
      simulation2,
    }),
    report_spec_schema_version: REPORT_SPEC_SCHEMA_VERSION,
  };
}
