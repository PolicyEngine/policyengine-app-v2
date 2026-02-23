// Tax benefit models
export {
  API_V2_BASE_URL,
  COUNTRY_TO_MODEL_NAME,
  getModelName,
  fetchTaxBenefitModels,
  fetchModelVersion,
  fetchModelVersionId,
  type TaxBenefitModel,
  type TaxBenefitModelVersion,
} from './taxBenefitModels';

// Variables
export { fetchVariables } from './variables';

// Parameters
export { fetchParameters } from './parameters';

// Parameter tree (lazy loading)
export {
  fetchParameterChildren,
  fetchParametersByName,
  type ParameterChildNode,
  type ParameterChildrenResponse,
  type V2ParameterData,
} from './parameterTree';

// Parameter values (on-demand fetching)
export { fetchParameterValues, BASELINE_POLICY_ID } from './parameterValues';

// Datasets
export { fetchDatasets } from './datasets';

// Regions
export { fetchRegions, fetchRegionByCode, type V2RegionMetadata } from './regions';

// Households (v2 Alpha CRUD)
export {
  createHouseholdV2,
  fetchHouseholdByIdV2,
  listHouseholdsV2,
  deleteHouseholdV2,
  householdToV2Request,
  v2ResponseToHousehold,
  type HouseholdV2Response,
  type HouseholdV2CreateRequest,
} from './households';

// Household Calculation (v2 Alpha async jobs)
export {
  createHouseholdCalculationJobV2,
  getHouseholdCalculationJobStatusV2,
  pollHouseholdCalculationJobV2,
  calculationResultToHousehold,
  calculateHouseholdV2Alpha,
  type HouseholdJobStatus,
  type HouseholdJobResponse,
  type HouseholdJobStatusResponse,
  type HouseholdCalculationResult,
} from './householdCalculation';

// User Household Associations (v2 Alpha)
// NOTE: Other user association types (policy, simulation, report, geographic)
// are not yet available in API v2 alpha. When they are added, follow the
// pattern established here for userHouseholdAssociations.
export {
  createUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationsV2,
  fetchUserHouseholdAssociationByIdV2,
  updateUserHouseholdAssociationV2,
  deleteUserHouseholdAssociationV2,
  type UserHouseholdAssociationV2Response,
  type UserHouseholdAssociationV2CreateRequest,
  type UserHouseholdAssociationV2UpdateRequest,
} from './userHouseholdAssociations';
