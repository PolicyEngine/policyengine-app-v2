import { describe, expect, test } from 'vitest';
import {
  buildConceptAliases,
  buildConceptClusters,
  buildParameterSearchEntries,
  buildStateNames,
  createParameterSearchIndex,
  DEFAULT_SEARCH_FILTERS,
  properNodeLabel,
  searchParameters,
  searchPriorityOf,
} from '@/libs/parameterSearch';
import { ParameterMetadata, ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * A UK-shaped slice for the headline-parameter fixes: list-valued
 * parameters a reform cannot set, Scotland's unnamed Income Tax bands,
 * Stamp Duty's schedules, and the employer/employee National Insurance
 * pair that share a stem.
 */
function node(parameter: string, label: string): ParameterMetadata {
  return { type: 'parameterNode', parameter, label } as ParameterMetadata;
}

function leaf(parameter: string, label: string, value: unknown = 1): ParameterMetadata {
  return {
    type: 'parameter',
    parameter,
    label,
    economy: true,
    household: true,
    values: { '2020-01-01': value },
  } as ParameterMetadata;
}

const PATHS = {
  pcSingle: 'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee.SINGLE',
  pcCarer: 'gov.dwp.pension_credit.guarantee_credit.carer.addition',
  pcChild: 'gov.dwp.pension_credit.guarantee_credit.child.addition',
  pcEarnings: 'gov.dwp.pension_credit.guarantee_credit.earnings_sources',
  wfpCountries: 'gov.dwp.winter_fuel_payment.eligibility.countries',
  wfpHigher: 'gov.dwp.winter_fuel_payment.amount.higher',
  ukBasicThreshold: 'gov.hmrc.income_tax.rates.uk[0].threshold',
  ukBasic: 'gov.hmrc.income_tax.rates.uk[0].rate',
  ukHigher: 'gov.hmrc.income_tax.rates.uk[1].rate',
  scotHigher: 'gov.hmrc.income_tax.rates.scotland.rates[3].rate',
  scotHigherThreshold: 'gov.hmrc.income_tax.rates.scotland.rates[3].threshold',
  sdltAbolish: 'gov.hmrc.stamp_duty.abolish',
  sdltMain: 'gov.hmrc.stamp_duty.residential.purchase.main.subsequent[0].rate',
  sdltRent: 'gov.hmrc.stamp_duty.residential.rent[0].rate',
  sdltNonResidential: 'gov.hmrc.stamp_duty.non_residential.purchase[0].rate',
  niEmployer: 'gov.hmrc.national_insurance.class_1.rates.employer',
  niEmployee: 'gov.hmrc.national_insurance.class_1.rates.employee.main',
  ucSelfEmployedNi:
    'gov.dwp.universal_credit.means_test.minimum_income_floor.self_employed_national_insurance',
  treasuryRate: 'gov.treasury.levy.rate',
  unlimited: 'gov.dwp.benefit_cap.exempt_threshold',
  noValues: 'gov.dwp.benefit_cap.single',
} as const;

function buildCollection(): ParameterMetadataCollection {
  const p = PATHS;
  const parameters: Record<string, ParameterMetadata> = {
    'gov.dwp': node('gov.dwp', 'DWP'),
    'gov.dwp.pension_credit': node('gov.dwp.pension_credit', 'Pension Credit'),
    'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee': node(
      'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee',
      'Pension Credit minimum guarantee'
    ),
    [p.pcSingle]: leaf(p.pcSingle, 'SINGLE'),
    [p.pcCarer]: leaf(p.pcCarer, 'Pension Credit carer addition'),
    [p.pcChild]: leaf(p.pcChild, 'Pension Credit child addition'),
    [p.pcEarnings]: leaf(p.pcEarnings, 'Pension Credit earnings sources', ['employment_income']),
    [p.wfpCountries]: leaf(p.wfpCountries, 'Winter Fuel Payment countries', ['ENGLAND']),
    [p.wfpHigher]: leaf(p.wfpHigher, 'Winter Fuel Payment higher amount'),
    'gov.hmrc': node('gov.hmrc', 'HMRC'),
    'gov.hmrc.income_tax': node('gov.hmrc.income_tax', 'Income Tax'),
    'gov.hmrc.income_tax.rates.uk': node('gov.hmrc.income_tax.rates.uk', 'Income Tax main rates'),
    [p.ukBasicThreshold]: leaf(p.ukBasicThreshold, 'threshold'),
    [p.ukBasic]: leaf(p.ukBasic, 'Basic rate'),
    [p.ukHigher]: leaf(p.ukHigher, 'Higher rate'),
    'gov.hmrc.income_tax.rates.scotland': node(
      'gov.hmrc.income_tax.rates.scotland',
      'Scottish rates'
    ),
    'gov.hmrc.income_tax.rates.scotland.rates': node(
      'gov.hmrc.income_tax.rates.scotland.rates',
      'Scottish Income Tax rates'
    ),
    [p.scotHigher]: leaf(p.scotHigher, 'rate'),
    [p.scotHigherThreshold]: leaf(p.scotHigherThreshold, 'threshold'),
    'gov.hmrc.stamp_duty': node('gov.hmrc.stamp_duty', 'Stamp Duty'),
    [p.sdltAbolish]: leaf(p.sdltAbolish, 'Abolish SDLT', false),
    'gov.hmrc.stamp_duty.residential.purchase.main.subsequent': node(
      'gov.hmrc.stamp_duty.residential.purchase.main.subsequent',
      'Stamp Duty on non-first primary homes'
    ),
    [p.sdltMain]: leaf(p.sdltMain, 'rate'),
    'gov.hmrc.stamp_duty.residential.rent': node(
      'gov.hmrc.stamp_duty.residential.rent',
      'Stamp Duty on cumulative rent'
    ),
    [p.sdltRent]: leaf(p.sdltRent, 'rate'),
    'gov.hmrc.stamp_duty.non_residential.purchase': node(
      'gov.hmrc.stamp_duty.non_residential.purchase',
      'Stamp Duty on non-residential property'
    ),
    [p.sdltNonResidential]: leaf(p.sdltNonResidential, 'rate'),
    'gov.hmrc.national_insurance': node('gov.hmrc.national_insurance', 'National Insurance'),
    'gov.hmrc.national_insurance.class_1.rates.employee': node(
      'gov.hmrc.national_insurance.class_1.rates.employee',
      'Employee'
    ),
    [p.niEmployer]: leaf(p.niEmployer, 'NI employer rate'),
    [p.niEmployee]: leaf(p.niEmployee, 'NI class 1 main rate'),
    [p.ucSelfEmployedNi]: leaf(
      p.ucSelfEmployedNi,
      'Universal Credit minimum income floor self-employed National Insurance'
    ),
    'gov.treasury': node('gov.treasury', 'Hm treasury'),
    [p.treasuryRate]: leaf(p.treasuryRate, 'Levy rate'),
    [p.unlimited]: leaf(p.unlimited, 'Benefit cap exemption threshold', 'Infinity'),
    [p.noValues]: {
      type: 'parameter',
      parameter: p.noValues,
      label: 'Benefit cap single',
      economy: true,
      household: true,
    } as ParameterMetadata,
  };
  return parameters as ParameterMetadataCollection;
}

const parameters = buildCollection();
const entries = buildParameterSearchEntries(parameters);
const index = createParameterSearchIndex(
  entries,
  buildConceptClusters(parameters),
  buildConceptAliases(parameters),
  buildStateNames(parameters)
);
const search = (query: string, limit = 5) =>
  searchParameters(index, query, limit, DEFAULT_SEARCH_FILTERS).map((entry) => entry.path);
const paths = new Set(entries.map((entry) => entry.path));

describe('parameters a reform cannot set', () => {
  test('given a list of variable names then search leaves it out', () => {
    expect(paths.has(PATHS.pcEarnings)).toBe(false);
    expect(paths.has(PATHS.wfpCountries)).toBe(false);
  });

  test('given numbers, switches, no limit, or no values at all then search keeps them', () => {
    expect(paths.has(PATHS.pcCarer)).toBe(true);
    expect(paths.has(PATHS.sdltAbolish)).toBe(true);
    expect(paths.has(PATHS.unlimited)).toBe(true);
    expect(paths.has(PATHS.noValues)).toBe(true);
  });

  test('given "winter fuel payment" then an amount leads, not the list of countries', () => {
    expect(search('winter fuel payment')[0]).toBe(PATHS.wfpHigher);
  });
});

describe('headline parameters', () => {
  test('given "pension credit" then the minimum guarantee leads its additions', () => {
    expect(search('pension credit')[0]).toBe(PATHS.pcSingle);
  });

  test('given "stamp duty" then the tax on a home ranks above leases and non-residential', () => {
    const found = search('stamp duty', 10);

    expect(found.indexOf(PATHS.sdltMain)).toBeLessThan(found.indexOf(PATHS.sdltRent));
    expect(found.indexOf(PATHS.sdltMain)).toBeLessThan(found.indexOf(PATHS.sdltNonResidential));
  });

  test('given a path under no priority then its factor is 1', () => {
    expect(searchPriorityOf(PATHS.sdltRent)).toBe(1);
    expect(searchPriorityOf(PATHS.sdltMain)).toBeLessThan(1);
  });
});

describe('everyday names under a path', () => {
  test('given "SDLT" then Stamp Duty schedules are found, the home purchase first of them', () => {
    const found = search('SDLT', 10);

    expect(found).toContain(PATHS.sdltMain);
    expect(found.indexOf(PATHS.sdltMain)).toBeLessThan(found.indexOf(PATHS.sdltRent));
  });

  test('given "scottish higher rate" then the Scottish higher band leads', () => {
    const found = search('scottish higher rate');

    expect(found[0]).toBe(PATHS.scotHigher);
    expect(found).not.toContain(PATHS.ukHigher);
  });

  test('given "scottish higher rate threshold" then the band threshold leads', () => {
    expect(search('scottish higher rate threshold')[0]).toBe(PATHS.scotHigherThreshold);
  });
});

describe('roles that share a stem', () => {
  test('given "employer national insurance" then the employer rate leads', () => {
    expect(search('employer national insurance')[0]).toBe(PATHS.niEmployer);
  });

  test('given "employee NI rate" then the employer rate is not credited for "employee"', () => {
    expect(search('employee NI rate')[0]).toBe(PATHS.niEmployee);
  });
});

describe('breadcrumbs for proper names', () => {
  test('given a body labelled in sentence case then the breadcrumb spells its name', () => {
    const entry = entries.find((candidate) => candidate.path === PATHS.treasuryRate);

    expect(entry?.breadcrumb).toBe('HM Treasury → Levy rate');
    expect(properNodeLabel('gov.treasury', 'Hm treasury')).toBe('HM Treasury');
    expect(properNodeLabel('gov.hmrc', 'HMRC')).toBe('HMRC');
  });
});
