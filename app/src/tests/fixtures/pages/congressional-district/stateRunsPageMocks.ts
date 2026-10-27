import { createMockContextValue } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import {
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_YEAR,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';

/** A nationwide report's district context, with the state runs' policies and year. */
export const nationwideDistrictContext = () =>
  createMockContextValue({
    reformPolicyId: STATE_RUNS_REFORM_POLICY_ID,
    baselinePolicyId: STATE_RUNS_BASELINE_POLICY_ID,
    year: STATE_RUNS_YEAR,
    scope: 'nationwide',
  });

/** A California report's district context. */
export const californiaDistrictContext = () =>
  createMockContextValue({
    reformPolicyId: STATE_RUNS_REFORM_POLICY_ID,
    baselinePolicyId: STATE_RUNS_BASELINE_POLICY_ID,
    year: STATE_RUNS_YEAR,
    scope: 'state',
    isStateLevelReport: true,
    stateCode: 'ca',
  });

export const NO_DISTRICT_DATA_MESSAGE = 'No congressional district data available';
