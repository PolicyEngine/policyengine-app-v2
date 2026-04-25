import { PolicyAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchSimulationById } from '@/api/simulation';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import { fetchPolicyByIdV2 } from '@/api/v2/policies';
import { fetchSimulationByIdV2 } from '@/api/v2/simulations';
import { getSimulationCapabilityMode } from '@/config/simulationCapability';
import { FOREVER } from '@/constants';
import type { CountryId } from '@/libs/countries';
import { getMappedSimulationId } from '@/libs/migration/idMapping';
import {
  compareMappedSimulationRead,
  logSkippedSimulationRead,
} from '@/libs/migration/simulationMigration';
import { Household } from '@/models/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';
import { isV2EntityId } from './queryUtils';

export async function fetchHydratedSimulation(
  countryId: CountryId,
  simulationId: string
): Promise<Simulation> {
  if (isV2EntityId(simulationId)) {
    return fetchSimulationByIdV2(simulationId);
  }

  const metadata = await fetchSimulationById(countryId, simulationId);
  const simulation = SimulationAdapter.fromMetadata(metadata);

  if (getSimulationCapabilityMode('reads') !== 'v1_only' && simulation.id) {
    const mappedV2SimulationId = getMappedSimulationId(simulation.id);

    if (mappedV2SimulationId) {
      void compareMappedSimulationRead(simulation, mappedV2SimulationId);
    } else {
      logSkippedSimulationRead(simulation.id, 'Read comparison skipped: missing mapped v2 id', {
        countryId,
      });
    }
  }

  return simulation;
}

export async function fetchHydratedPolicy(countryId: CountryId, policyId: string): Promise<Policy> {
  if (isV2EntityId(policyId)) {
    const response = await fetchPolicyByIdV2(policyId);
    const parameterMap = new Map<
      string,
      {
        name: string;
        values: Array<{
          startDate: string;
          endDate: string;
          value: unknown;
        }>;
      }
    >();

    for (const parameterValue of response.parameter_values ?? []) {
      const name = parameterValue.parameter_name ?? parameterValue.parameter_id;
      const existing = parameterMap.get(name) ?? { name, values: [] };
      existing.values.push({
        startDate: parameterValue.start_date,
        endDate: parameterValue.end_date ?? FOREVER,
        value: parameterValue.value_json,
      });
      parameterMap.set(name, existing);
    }

    return {
      id: response.id,
      countryId,
      apiVersion: 'v2',
      label: response.name ?? null,
      isCreated: true,
      parameters: Array.from(parameterMap.values()),
    };
  }

  const metadata = await fetchPolicyById(countryId, policyId);
  return PolicyAdapter.fromMetadata(metadata);
}

export async function fetchHydratedHousehold(
  countryId: CountryId,
  householdId: string
): Promise<Household> {
  if (isV2EntityId(householdId)) {
    return Household.fromV2Response(await fetchHouseholdByIdV2(householdId));
  }

  const metadata = await fetchHouseholdById(countryId, householdId);
  return Household.fromV1Metadata(metadata);
}
