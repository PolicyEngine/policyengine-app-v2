import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import type { HouseholdCalculationResult } from '@/api/householdCalculation';
import { Household } from '@/models/Household';
import type {
  V1HouseholdCreateEnvelope,
  V1HouseholdMetadataEnvelope,
} from '@/models/household/v1Types';
import { REPRODUCTION_CONFIGS } from '@/tests/fixtures/pages/report-output/reproduce-in-python/householdSPMReproductionMocks';
import {
  GENERIC_ENVELOPES,
  GENERIC_HOUSEHOLD_IDS,
  GENERIC_POLICIES,
  GENERIC_POLICY_IDS,
  GenericOrchestrationHTTP,
} from '@/tests/fixtures/spm/genericOrchestrationMocks';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';

export const ORIGINAL_YEAR = '2026';
export const SUPPORTED_YEAR = '2023';
export const ORIGINAL_REPORT_ID = '300';
export const ORIGINAL_SIMULATION_IDS = ['91', '92'];
export const CORRECTED_HOUSEHOLD_IDS = ['401', '402'];
export const YEAR_ERROR = {
  code: 'SPM_YEAR_UNAVAILABLE',
  message: 'The selected SPM artifact supports 2023, but the saved inputs request 2026.',
};
export const YEAR_SAVE_ERROR = {
  code: 'SPM_SETTINGS_INVALID',
  message: 'The selected SPM artifact could not be saved. Choose SPM settings again.',
};

export function yearRecoveryHouseholds(year = ORIGINAL_YEAR) {
  return GENERIC_HOUSEHOLD_IDS.map((id, index) => {
    const secondPerson = index === 0 ? 'your partner' : 'your child';
    const members = ['you', secondPerson];
    return Household.fromAppInput({
      id,
      countryId: 'us',
      year: Number(year),
      label: index === 0 ? 'Baseline family' : 'Reform family',
      spm: { ...REPRODUCTION_CONFIGS[index], county_vintage: '2020' },
      householdData: {
        people: {
          you: {
            age: { [year]: index === 0 ? 40 : 41 },
            employment_income: { [year]: index === 0 ? 41000 : 62000 },
            is_disabled: { [year]: false },
            dividend_income: { [year]: null },
          },
          [secondPerson]: {
            age: { [year]: index === 0 ? 39 : 10 },
            employment_income: { [year]: index === 0 ? 15000 : 0 },
          },
        },
        households: {
          household: {
            members,
            state_name: { [year]: 'CA' },
            rent: { [year]: index === 0 ? 12000 : 18000 },
            ...(index === 1 ? { county_fips: { [year]: '06037' } } : {}),
          },
        },
        families: { family: { members } },
        taxUnits: { 'tax unit': { members } },
        spmUnits: { 'spm unit': { members } },
        maritalUnits: { 'marital unit': { members } },
      },
    });
  });
}

export const ORIGINAL_HOUSEHOLDS = yearRecoveryHouseholds();
export const CORRECTED_HOUSEHOLD_PAYLOADS = yearRecoveryHouseholds(SUPPORTED_YEAR).map(
  (household) => household.toV1CreationPayload()
);

function json(result: unknown) {
  return new Response(JSON.stringify({ status: 'ok', result }));
}

/** HTTP boundary: calculation succeeds only for newly saved, supported-year inputs. */
export class ReportYearRecoveryHTTP extends GenericOrchestrationHTTP {
  readonly households = new Map<string, V1HouseholdMetadataEnvelope>();
  readonly householdPosts: V1HouseholdCreateEnvelope[] = [];
  readonly writes: string[] = [];
  readonly policies: PolicyMetadata[] = GENERIC_POLICIES.map((policy) => ({
    id: policy.id!,
    country_id: 'us',
    api_version: 'synthetic',
    policy_json: PolicyAdapter.toCreationPayload(policy).data,
    policy_hash: `synthetic-policy-${policy.id}`,
  }));
  readonly originalReport: ReportMetadata = {
    id: Number(ORIGINAL_REPORT_ID),
    country_id: 'us',
    simulation_1_id: ORIGINAL_SIMULATION_IDS[0],
    simulation_2_id: ORIGINAL_SIMULATION_IDS[1],
    year: ORIGINAL_YEAR,
    api_version: 'synthetic',
    status: 'error',
    output: null,
  };
  readonly originalSimulations: SimulationMetadata[] = ORIGINAL_SIMULATION_IDS.map((id, index) => ({
    id: Number(id),
    country_id: 'us',
    population_id: GENERIC_HOUSEHOLD_IDS[index],
    population_type: 'household',
    policy_id: GENERIC_POLICY_IDS[index],
    api_version: 'synthetic',
    status: 'error',
    output: null,
    error_message: `[${YEAR_ERROR.code}] ${YEAR_ERROR.message}`,
  }));
  failHouseholdPost: number | null = null;

  constructor() {
    super();
    ORIGINAL_HOUSEHOLDS.forEach((household) => {
      const payload = household.toV1CreationPayload();
      this.households.set(household.id, {
        id: household.id,
        country_id: 'us',
        label: household.label,
        api_version: 'synthetic',
        household_hash: `synthetic-original-${household.id}`,
        household_json: payload.data,
        spm: payload.spm,
      });
    });
    const orchestrationFetch = this.fetch;
    this.fetch = async (input, init) => {
      const pathname = new URL(String(input)).pathname;
      const method = init?.method ?? 'GET';
      if (method !== 'GET') {
        this.writes.push(`${method} ${pathname}`);
      }
      if (pathname === '/us/household' && method === 'POST') {
        const payload = JSON.parse(String(init?.body)) as V1HouseholdCreateEnvelope;
        const index = this.householdPosts.length;
        this.householdPosts.push(payload);
        if (this.failHouseholdPost === index) {
          return new Response(JSON.stringify({ errors: [YEAR_SAVE_ERROR] }), { status: 400 });
        }
        const id = String(401 + index);
        this.households.set(id, {
          id,
          country_id: 'us',
          label: payload.label,
          api_version: 'synthetic',
          household_hash: `synthetic-corrected-${id}`,
          household_json: payload.data,
          spm: payload.spm,
        });
        return json({ household_id: id });
      }
      const household = /^\/us\/household\/(\d+)$/.exec(pathname);
      if (household && method === 'GET') {
        return json(this.households.get(household[1]));
      }
      const policy = /^\/us\/policy\/(\d+)$/.exec(pathname);
      if (policy && method === 'GET') {
        return json(this.policies.find((candidate) => candidate.id === policy[1]));
      }
      if (pathname === `/us/report/${ORIGINAL_REPORT_ID}` && method === 'GET') {
        return json(this.originalReport);
      }
      const simulation = this.originalSimulations.find(
        (candidate) => pathname === `/us/simulation/${candidate.id}`
      );
      if (simulation && method === 'GET') {
        return json(simulation);
      }
      const calculation = /^\/us\/household\/(\d+)\/policy\/(\d+)$/.exec(pathname);
      if (calculation) {
        this.calculationRequests.push(pathname);
        const storedHousehold = this.households.get(calculation[1]);
        const index = GENERIC_POLICY_IDS.indexOf(calculation[2]);
        if (!storedHousehold || index < 0) {
          throw new Error(`Unknown stored calculation inputs: ${pathname}`);
        }
        const requestedYears = Object.keys(storedHousehold.household_json.people.you.age ?? {});
        if (requestedYears.length !== 1 || requestedYears[0] !== SUPPORTED_YEAR) {
          return new Response(JSON.stringify({ errors: [YEAR_ERROR] }), { status: 400 });
        }
        const householdData = JSON.parse(
          JSON.stringify(storedHousehold.household_json)
        ) as HouseholdCalculationResult['result'];
        const envelope: HouseholdCalculationResult = {
          ...GENERIC_ENVELOPES[index],
          result: {
            ...householdData,
            households: {
              household: {
                ...householdData.households!.household,
                household_net_income: { [SUPPORTED_YEAR]: index === 0 ? 38000 : 54000 },
              },
            },
          },
          spm_config: storedHousehold.spm,
          spm_provenance: {
            ...GENERIC_ENVELOPES[index].spm_provenance!,
            forecast_sha256: storedHousehold.spm!.forecast_content_sha256!,
            scenario: storedHousehold.spm!.scenario!,
            geography_kind: storedHousehold.spm!.geography_kind,
            years: { [SUPPORTED_YEAR]: { source: 'forecast' } },
          },
        };
        return new Response(JSON.stringify({ status: 'ok', ...envelope }));
      }
      return orchestrationFetch(input, init);
    };
  }
}
