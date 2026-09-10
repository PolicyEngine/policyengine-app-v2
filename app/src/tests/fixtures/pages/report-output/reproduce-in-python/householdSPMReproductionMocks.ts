import type { HouseholdCalculationResult } from '@/api/householdCalculation';
import { Household } from '@/models/Household';
import { SPM_RECEIPT } from '@/tests/fixtures/spm/spmMocks';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { SPMSelection } from '@/types/spm';

export const REPRODUCTION_YEAR = '2026';
// Synthetic artifact hashes and package versions; never published artifact pins.
export const REPRODUCTION_RUNTIME_VERSIONS = [
  {
    policyengine: '9.1.0',
    'policyengine-us': '8.1.0',
    'policyengine-core': '7.1.0',
    'spm-calculator': '6.1.0',
  },
  {
    policyengine: '9.2.0',
    'policyengine-us': '8.2.0',
    'policyengine-core': '7.2.0',
    'spm-calculator': '6.2.0',
  },
];
export const REPRODUCTION_CONFIGS: SPMSelection[] = [
  {
    geography_kind: 'national',
    forecast_content_sha256: 'c'.repeat(64),
    scenario: 'baseline-null-false',
    as_of: '2026-08-01',
  },
  {
    geography_kind: 'county',
    forecast_content_sha256: 'd'.repeat(64),
    scenario: 'county-alternative',
    as_of: '2026-09-01',
  },
];
export const REPRODUCTION_HOUSEHOLDS = ['baseline', 'reform'].map((role, index) =>
  Household.fromAppInput({
    id: `household-${role}`,
    countryId: 'us',
    year: Number(REPRODUCTION_YEAR),
    spm: index === 0 ? { geography_kind: 'national' } : { geography_kind: 'county' },
    householdData: {
      people: {
        you: {
          age: { [REPRODUCTION_YEAR]: 40 },
          employment_income: { [REPRODUCTION_YEAR]: index === 0 ? 41000 : 62000 },
        },
      },
      households: {
        household: {
          members: ['you'],
          ...(index === 1 ? { county_fips: { [REPRODUCTION_YEAR]: '06037' } } : {}),
        },
      },
    },
  })
);
export const REPRODUCTION_POLICIES: Policy[] = ['baseline', 'reform'].map((role, index) => ({
  id: `policy-${role}`,
  countryId: 'us',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base',
      values: [
        { startDate: '2026-01-01', endDate: '2100-12-31', value: index === 0 ? 2800 : 3900 },
      ],
    },
  ],
}));
export const REPRODUCTION_SIMULATIONS: Simulation[] = ['baseline', 'reform'].map((role, index) => ({
  id: `simulation-${role}`,
  countryId: 'us',
  policyId: `policy-${role}`,
  populationId: `household-${role}`,
  populationType: 'household',
  label: role,
  isCreated: true,
  status: 'complete',
  output: {
    result: { people: {} },
    spm_config: REPRODUCTION_CONFIGS[index],
    spm_provenance: {
      ...SPM_RECEIPT,
      forecast_sha256: REPRODUCTION_CONFIGS[index].forecast_content_sha256!,
      scenario: REPRODUCTION_CONFIGS[index].scenario!,
      geography_kind: REPRODUCTION_CONFIGS[index].geography_kind,
      runtime_versions: {
        'policyengine-core': REPRODUCTION_RUNTIME_VERSIONS[index]['policyengine-core'],
        'spm-calculator': REPRODUCTION_RUNTIME_VERSIONS[index]['spm-calculator'],
      },
    },
    policyengine_bundle: {
      policyengine_version: index === 0 ? '9.1.0' : '9.2.0',
      model_version: index === 0 ? '8.1.0' : '8.2.0',
    },
  },
}));
export const REPRODUCTION_REPORT: Report = {
  id: 'report-reproduction',
  countryId: 'us',
  year: REPRODUCTION_YEAR,
  apiVersion: null,
  simulationIds: REPRODUCTION_SIMULATIONS.map((simulation) => simulation.id!),
  status: 'complete',
  outputType: 'household',
  output: null,
};

export function reproductionSimulationsWithOutput(
  overrides: Partial<HouseholdCalculationResult>
): Simulation[] {
  return [
    {
      ...REPRODUCTION_SIMULATIONS[0],
      output: {
        ...(REPRODUCTION_SIMULATIONS[0].output as HouseholdCalculationResult),
        ...overrides,
      },
    },
    REPRODUCTION_SIMULATIONS[1],
  ];
}

export function reproductionSimulationsWithoutBundle(wrapperInstalled: boolean): Simulation[] {
  return REPRODUCTION_SIMULATIONS.map((simulation, index) => {
    const output = simulation.output as HouseholdCalculationResult;
    return {
      ...simulation,
      output: {
        ...output,
        policyengine_bundle: null,
        spm_provenance: {
          ...output.spm_provenance!,
          runtime_versions: {
            ...REPRODUCTION_RUNTIME_VERSIONS[index],
            policyengine: wrapperInstalled
              ? REPRODUCTION_RUNTIME_VERSIONS[index].policyengine
              : null,
          },
        },
      },
    };
  });
}

export function reproductionSimulationsWithRuntimeVersions(
  versions: Record<string, string | null>
): Simulation[] {
  const output = REPRODUCTION_SIMULATIONS[0].output as HouseholdCalculationResult;
  return reproductionSimulationsWithOutput({
    spm_provenance: {
      ...output.spm_provenance!,
      runtime_versions: { ...output.spm_provenance!.runtime_versions, ...versions },
    },
  });
}
