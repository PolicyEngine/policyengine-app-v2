import type { Simulation, SimulationStatus } from '@/types/ingredients/Simulation';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';

type HouseholdSimulationResponseSource = {
  id: string;
  status: string;
  household_id: string | null;
  policy_id: string | null;
  household_result: Record<string, unknown> | null;
  error_message: string | null;
};

type EconomySimulationRegionSource = {
  code: string;
  dataset_id: string;
  filter_field: string | null;
  filter_value: string | null;
};

type EconomySimulationResponseSource = {
  id: string;
  status: string;
  dataset_id: string | null;
  policy_id: string | null;
  output_dataset_id: string | null;
  filter_field: string | null;
  filter_value: string | null;
  region: EconomySimulationRegionSource | null;
  error_message: string | null;
};

export function toSimulationStatus(apiStatus?: string | null): SimulationStatus | undefined {
  if (!apiStatus) {
    return undefined;
  }

  switch (apiStatus) {
    case 'ok':
    case 'complete':
    case 'completed':
      return 'complete';
    case 'pending':
    case 'execution_deferred':
    case 'running':
    case 'computing':
      return 'pending';
    case 'error':
    case 'failed':
      return 'error';
    default:
      console.warn(
        `[SimulationDomain] Unknown simulation status: "${apiStatus}", treating as pending`
      );
      return 'pending';
  }
}

export function parseSimulationOutput(output: unknown): unknown | null {
  if (output == null) {
    return null;
  }

  if (typeof output !== 'string') {
    return output;
  }

  try {
    return JSON.parse(output);
  } catch (error) {
    console.error('[SimulationDomain] Failed to parse simulation output:', error);
    return output;
  }
}

export function fromV1SimulationMetadata(metadata: SimulationMetadata): Simulation {
  if (!metadata.population_id) {
    throw new Error('Simulation metadata missing population_id');
  }

  if (!metadata.population_type) {
    throw new Error('Simulation metadata missing population_type');
  }

  const simulationType = metadata.population_type === 'household' ? 'household' : 'economy';

  return {
    id: String(metadata.id),
    countryId: metadata.country_id,
    apiVersion: metadata.api_version,
    simulationType,
    policyId: metadata.policy_id ? String(metadata.policy_id) : undefined,
    populationId: String(metadata.population_id),
    populationType: metadata.population_type,
    year: null,
    label: null,
    isCreated: true,
    output: parseSimulationOutput(metadata.output),
    status: toSimulationStatus(metadata.status),
    source: 'v1_api',
    backendStatus: metadata.status ?? null,
    regionCode: metadata.population_type === 'geography' ? String(metadata.population_id) : null,
    datasetId: null,
    outputDatasetId: null,
    filterField: null,
    filterValue: null,
    errorMessage: null,
  };
}

export function fromV2HouseholdSimulationResponse(
  response: HouseholdSimulationResponseSource
): Simulation {
  return {
    id: response.id,
    simulationType: 'household',
    policyId: response.policy_id ?? undefined,
    populationId: response.household_id ?? undefined,
    populationType: 'household',
    year: null,
    label: null,
    isCreated: true,
    output: response.household_result ?? null,
    status: toSimulationStatus(response.status),
    source: 'v2_household_api',
    backendStatus: response.status,
    regionCode: null,
    datasetId: null,
    outputDatasetId: null,
    filterField: null,
    filterValue: null,
    errorMessage: response.error_message,
  };
}

export function fromV2EconomySimulationResponse(
  response: EconomySimulationResponseSource
): Simulation {
  const regionCode = response.region?.code ?? null;
  const datasetId = response.dataset_id ?? response.region?.dataset_id ?? null;
  const filterField = response.filter_field ?? response.region?.filter_field ?? null;
  const filterValue = response.filter_value ?? response.region?.filter_value ?? null;

  return {
    id: response.id,
    simulationType: 'economy',
    policyId: response.policy_id ?? undefined,
    populationId: regionCode ?? datasetId ?? undefined,
    populationType: 'geography',
    year: null,
    label: null,
    isCreated: true,
    output: null,
    status: toSimulationStatus(response.status),
    source: 'v2_economy_api',
    backendStatus: response.status,
    regionCode,
    datasetId,
    outputDatasetId: response.output_dataset_id,
    filterField,
    filterValue,
    errorMessage: response.error_message,
  };
}
