// Tax benefit models
export {
  API_V2_BASE_URL,
  COUNTRY_TO_MODEL_NAME,
  getModelName,
  fetchTaxBenefitModels,
  fetchModelByCountry,
  fetchModelVersion,
  fetchModelVersionId,
  type TaxBenefitModel,
  type TaxBenefitModelVersion,
  type ModelByCountryResponse,
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

// Policies (v2 Alpha CRUD)
export {
  createPolicyV2,
  fetchPolicyByIdV2,
  type PolicyV2CreateRequest,
  type PolicyV2ParameterValueCreateRequest,
  type PolicyV2Response,
  type PolicyV2ResponseParameterValue,
} from './policies';

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
export {
  createUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationsV2,
  fetchUserHouseholdAssociationByIdV2,
  updateUserHouseholdAssociationV2,
  deleteUserHouseholdAssociationV2,
  type UserHouseholdAssociationV2Response,
  type UserHouseholdAssociationV2CreateRequest,
  type UserHouseholdAssociationV2UpdateInput,
} from './userHouseholdAssociations';

// Simulations (v2 Alpha — household + economy)
export {
  createHouseholdSimulation,
  getHouseholdSimulation,
  pollHouseholdSimulation,
  createEconomySimulation,
  getEconomySimulation,
  pollEconomySimulation,
  fromHouseholdSimulationResponse,
  fromEconomySimulationResponse,
  fetchSimulationByIdV2,
  type SimulationStatus,
  type HouseholdSimulationRequest,
  type HouseholdSimulationResponse,
  type EconomySimulationRequest,
  type EconomySimulationResponse,
  type RegionInfo,
} from './simulations';

// Shared v2 API types
export type { PolicyIdInput, ReportStatus, SimulationInfo } from './types';

// Economy Analysis (v2 Alpha — baseline vs reform comparison)
export {
  createEconomyAnalysis,
  getEconomyAnalysis,
  pollEconomyAnalysis,
  createEconomyCustomAnalysis,
  getEconomyCustomAnalysis,
  fromEconomicImpactResponse,
  rerunReport,
  type EconomicImpactRequest,
  type EconomicImpactResponse,
  type EconomyCustomRequest,
  type AnalysisRegionInfo,
  type DecileImpactData,
  type ProgramStatisticsData,
  type PovertyData,
  type InequalityData,
  type BudgetSummaryData,
  type IntraDecileData,
  type CongressionalDistrictData,
  type ConstituencyData,
  type LocalAuthorityData,
} from './economyAnalysis';

// Household Analysis (v2 Alpha — baseline vs reform comparison)
export {
  createHouseholdAnalysis,
  getHouseholdAnalysis,
  pollHouseholdAnalysis,
  fromHouseholdImpactResponse,
  type HouseholdReportStatus,
  type HouseholdSimulationInfo,
  type HouseholdImpactRequest,
  type HouseholdImpactResponse,
} from './householdAnalysis';

// Analysis Options (v2 Alpha — available economy modules)
export { fetchAnalysisOptions, type ModuleOption } from './analysisOptions';

// User Policy Associations (v2 Alpha)
export {
  createUserPolicyAssociationV2,
  fetchUserPolicyAssociationsV2,
  fetchUserPolicyAssociationByIdV2,
  updateUserPolicyAssociationV2,
  deleteUserPolicyAssociationV2,
  type UserPolicyAssociationV2Response,
  type UserPolicyAssociationV2CreateRequest,
  type UserPolicyAssociationV2UpdateRequest,
} from './userPolicyAssociations';

// User Simulation Associations (v2 Alpha)
export {
  createUserSimulationAssociationV2,
  fetchUserSimulationAssociationsV2,
  fetchUserSimulationAssociationByIdV2,
  updateUserSimulationAssociationV2,
  deleteUserSimulationAssociationV2,
  type UserSimulationAssociationV2Response,
  type UserSimulationAssociationV2CreateRequest,
  type UserSimulationAssociationV2UpdateRequest,
} from './userSimulationAssociations';

// User Report Associations (v2 Alpha)
export {
  createUserReportAssociationV2,
  fetchUserReportAssociationsV2,
  fetchUserReportAssociationByIdV2,
  updateUserReportAssociationV2,
  deleteUserReportAssociationV2,
  type UserReportAssociationV2Response,
  type UserReportAssociationV2CreateRequest,
  type UserReportAssociationV2UpdateRequest,
} from './userReportAssociations';
