import type { Report } from '@/types/ingredients/Report';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import type { SimulationSetOutputPayload } from '@/types/payloads';

export const SPM_YEAR_ERROR = {
  code: 'SPM_YEAR_UNAVAILABLE',
  message: 'Year 2026 is unavailable in the selected SPM artifact. Select a supported year.',
} as const;

export const CORRECTIVE_SPM_ERRORS = [
  {
    code: 'SPM_SETTINGS_INVALID',
    message: 'The selected SPM artifact is unavailable. Update the household SPM settings.',
  },
  {
    code: 'SPM_GEOGRAPHY_REQUIRED',
    message: 'Select national thresholds or provide an explicit county FIPS.',
  },
  {
    code: 'SPM_GEOGRAPHY_UNAVAILABLE',
    message: 'County 06037 is unavailable in the selected SPM artifact.',
  },
  {
    code: 'SPM_COMPOSITION_REQUIRED',
    message: 'Provide adult composition for the household before calculating SPM.',
  },
  SPM_YEAR_ERROR,
] as const;

export const OTHER_CALCULATION_ERROR = 'The policy service is temporarily unavailable.';

export const FAILED_SPM_REPORT: Report = {
  id: '901',
  countryId: 'us',
  year: '2026',
  apiVersion: null,
  simulationIds: ['101', '102'],
  status: 'error',
  outputType: 'household',
};

export function failedSimulationMetadata(payload: SimulationSetOutputPayload): SimulationMetadata {
  return {
    id: payload.id,
    country_id: 'us',
    api_version: 'test-model-version',
    population_id: payload.id === 101 ? '201' : '202',
    population_type: 'household',
    policy_id: payload.id === 101 ? '1' : '2',
    output: payload.output,
    status: payload.status,
    error_message: payload.error_message,
  };
}
