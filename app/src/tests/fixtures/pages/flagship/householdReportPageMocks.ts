/** Fixtures for v3's standalone household report page. */

/** A policy as the Public API returns it: no parameter changes unless given. */
export function policyMetadata(countryId: string, policyId: string, policyJson = {}) {
  return {
    id: policyId,
    country_id: countryId,
    api_version: '1',
    label: null,
    policy_json: policyJson,
  };
}

/** A UK reform's parameter change, which only the reform's Python block may set. */
export const REFORM_PARAMETER = 'gov.dwp.universal_credit.elements.child.amount';
export const REFORM_POLICY_JSON = { [REFORM_PARAMETER]: { '2026-01-01.2100-12-31': 3000 } };

/** The model's metadata for that parameter, which reading the reform's policy needs. */
export const REFORM_PARAMETER_METADATA = {
  [REFORM_PARAMETER]: {
    type: 'parameter',
    parameter: REFORM_PARAMETER,
    values: { '2026-01-01': 2900 },
  },
};

/** What the household validation says of a household that can run, and of one that cannot. */
export const READY_TO_RUN = { isValid: true, errors: [] };
export const NOT_READY_TO_RUN = { isValid: false, errors: [{ message: 'Choose a county' }] };

/** The years the model's metadata lists for the report. */
export const MODEL_YEARS = [2026, 2027];
/** A model year after the households' own (they are built in 2026). */
export const LATER_MODEL_YEAR = '2027';
