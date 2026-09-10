import { Household } from '@/models/Household';
import type { AppHouseholdInputData } from '@/models/household/appTypes';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import type { PolicyStateProps } from '@/types/pathwayState';
import type { SPMSelection } from '@/types/spm';

export const YEAR_COPY_SOURCE = '2026';
export const YEAR_COPY_REFORM_SOURCE = '2025';
export const YEAR_COPY_TARGET = '2023';
export const YEAR_COPY_MEMBERS = ['you', 'Sam false null'];
// Synthetic artifact identity, owned by the saved household's explicit selection.
export const YEAR_COPY_SPM: SPMSelection = {
  geography_kind: 'county',
  forecast_content_sha256: 'e'.repeat(64),
  scenario: 'baseline-null-false',
  county_vintage: '2020',
  as_of: '2026-08-15',
};

export function annualYearCopyData(year: string): AppHouseholdInputData {
  return {
    people: {
      you: {
        age: { [year]: 40 },
        employment_income: { [year]: 50000 },
        is_tax_unit_dependent: { [year]: false },
        birth_date: '1986-04-12',
      },
      'Sam false null': {
        age: { [year]: 16 },
        employment_income: { [year]: 0 },
        is_tax_unit_dependent: { [year]: true },
      },
    },
    households: {
      'home 06037': {
        members: [...YEAR_COPY_MEMBERS],
        county_fips: { [year]: '06037' },
        state_name: { [year]: 'CA' },
        rent: 12000,
      },
    },
    families: {
      'our family': { members: [...YEAR_COPY_MEMBERS], family_cash_assets: { [year]: 3500 } },
    },
    taxUnits: {
      'our tax unit': {
        members: [...YEAR_COPY_MEMBERS],
        tax_unit_itemized_deductions: { [year]: 500 },
      },
    },
    spmUnits: {
      'our SPM unit': { members: [...YEAR_COPY_MEMBERS], spm_unit_spm_threshold: { [year]: null } },
    },
    maritalUnits: {
      'your marital unit': { members: ['you'], marital_unit_income: { [year]: 50000 } },
      "Sam's marital unit": { members: ['Sam false null'], marital_unit_income: { [year]: 0 } },
    },
  };
}

export function yearCopyHousehold(
  year = YEAR_COPY_SOURCE,
  id = 'saved-source-household'
): Household {
  return Household.fromAppInput({
    id,
    countryId: 'us',
    label: 'Saved household 2026',
    year: Number(year),
    spm: YEAR_COPY_SPM,
    householdData: annualYearCopyData(year),
  });
}

export function scalarYearCopyHousehold(year: string): Household {
  return Household.fromAppInput({
    id: 'saved-scalar-household',
    countryId: 'us',
    year: Number(year),
    spm: { geography_kind: 'national' },
    householdData: {
      people: { you: { age: 40, employment_income: 50000 } },
      households: { home: { members: ['you'], county_fips: '06037' } },
    },
  });
}

export function ukYearCopyHousehold(): Household {
  return Household.fromAppInput({
    id: 'saved-uk-household',
    countryId: 'uk',
    year: Number(YEAR_COPY_SOURCE),
    householdData: {
      people: { you: { age: { [YEAR_COPY_SOURCE]: 40 } } },
      households: { home: { members: ['you'], rent: { [YEAR_COPY_SOURCE]: 12000 } } },
      benunits: {
        'benefit unit': { members: ['you'], benunit_income: { [YEAR_COPY_SOURCE]: 35000 } },
      },
    },
  });
}

export function mixedYearCopyHousehold(): Household {
  return yearCopyHousehold().setPersonVariableAtYear('you', 'employment_income', '2024', 47000);
}

export function yearCopyHouseholdWithoutYearAnchor(
  kind: 'renamed person' | 'missing age' | 'null age'
): Household {
  const householdData: AppHouseholdInputData = {
    people:
      kind === 'renamed person'
        ? { alex: { age: { [YEAR_COPY_SOURCE]: 40 } } }
        : {
            you: {
              employment_income: { [YEAR_COPY_SOURCE]: 50000 },
              ...(kind === 'null age' ? { age: null } : {}),
            },
          },
  };
  return Household.fromAppInput({
    id: `saved-${kind}`,
    countryId: 'us',
    year: Number(YEAR_COPY_SOURCE),
    spm: { geography_kind: 'national' },
    householdData,
  });
}

export const YEAR_COPY_POLICIES: PolicyStateProps[] = [
  {
    id: 'custom-baseline-policy',
    label: 'Original baseline policy',
    parameters: [
      {
        name: 'gov.irs.credits.ctc.amount.base',
        values: [
          { startDate: '2020-01-01', endDate: '2024-12-31', value: 2000 },
          { startDate: '2025-01-01', endDate: '2100-12-31', value: 2800 },
        ],
      },
    ],
  },
  {
    id: 'custom-reform-policy',
    label: 'Original reform policy',
    parameters: [
      {
        name: 'gov.irs.credits.ctc.amount.base',
        values: [{ startDate: '2026-01-01', endDate: '2027-12-31', value: 3900 }],
      },
    ],
  },
];

export function yearCopyReportState(
  households: Household[] = [
    yearCopyHousehold(),
    yearCopyHousehold(YEAR_COPY_REFORM_SOURCE, 'saved-reform-household'),
  ]
): ReportBuilderState {
  return {
    id: 'original-report',
    label: 'Original 2026 report',
    year: YEAR_COPY_SOURCE,
    simulations: households.map((household, index) => ({
      id: `saved-simulation-${index}`,
      label: index === 0 ? 'Baseline' : 'Reform',
      policy: YEAR_COPY_POLICIES[index],
      status: 'complete',
      output: { result: { people: {} }, receipt: `original-result-${index}` },
      population: { label: household.label, type: 'household', household, geography: null },
    })),
  };
}
