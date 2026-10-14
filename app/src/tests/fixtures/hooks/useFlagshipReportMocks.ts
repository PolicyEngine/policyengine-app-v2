import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';

/** A report link that resolves: the API report id of a nationwide run. */
export const EXISTING_REPORT_ID = '9001';
/** A report link that names no report. */
export const MISSING_REPORT_ID = '404404';

export const BASELINE_SIMULATION_ID = '501';
export const REFORM_SIMULATION_ID = '502';

/** As fetchReportById throws on a 404. */
export const REPORT_NOT_FOUND_ERROR = new Error(
  `Failed to fetch report ${MISSING_REPORT_ID}: 404 Not Found`
);
/** As fetchReportById throws when the API is down. */
export const REPORT_UNAVAILABLE_ERROR = new Error(
  `Failed to fetch report ${EXISTING_REPORT_ID}: 503 Service Unavailable`
);
/** As fetchSimulationById throws when the API is down. */
export const SIMULATION_UNAVAILABLE_ERROR = new Error(
  `Failed to fetch simulation ${REFORM_SIMULATION_ID}: 503 Service Unavailable`
);

/** As fetchPolicyById throws when the API is down. */
export const POLICY_UNAVAILABLE_ERROR = new Error('Failed to fetch policy 98557');

export const EXISTING_REPORT_METADATA: ReportMetadata = {
  id: Number(EXISTING_REPORT_ID),
  country_id: 'us',
  year: '2026',
  api_version: 'v1',
  simulation_1_id: BASELINE_SIMULATION_ID,
  simulation_2_id: REFORM_SIMULATION_ID,
  status: 'pending',
  output: null,
};

export const nationwideSimulationMetadata = (id: string, policyId: string): SimulationMetadata => ({
  id: Number(id),
  country_id: 'us',
  api_version: 'v1',
  population_id: 'us',
  population_type: 'geography',
  policy_id: policyId,
  status: 'pending',
  output: null,
});

/** The report the hook hands on once it is in. */
export const EXISTING_REPORT: Report = {
  id: EXISTING_REPORT_ID,
  label: 'Bigger CTC',
  countryId: 'us',
  year: '2026',
  apiVersion: 'v1',
  simulationIds: [BASELINE_SIMULATION_ID, REFORM_SIMULATION_ID],
  status: 'pending',
};

const nationwideSimulation = (id: string, policyId: string): Simulation => ({
  id,
  countryId: 'us',
  apiVersion: 'v1',
  policyId,
  populationId: 'us',
  populationType: 'geography',
  label: null,
  isCreated: true,
  status: 'pending',
});

/** Its baseline and reform simulations, once they are in. */
export const EXISTING_SIMULATIONS: Simulation[] = [
  nationwideSimulation(BASELINE_SIMULATION_ID, '2'),
  nationwideSimulation(REFORM_SIMULATION_ID, '98557'),
];
