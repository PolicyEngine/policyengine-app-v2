import type {
  ParameterMetadata,
  ParameterMetadataCollection,
} from '@/types/metadata/parameterMetadata';

/**
 * A UK-shaped slice of the metadata, with the traps the live UK model
 * (2.130) sets for search: raw-key labels ("NORTHERN IRELAND", "SINGLE"),
 * lowercase key labels ("vat"), modelling assumptions that share the
 * policy's words, a contributed reform with a rival initialism, and
 * parameters whose everyday names appear nowhere in the metadata.
 */
function node(parameter: string, label: string): ParameterMetadata {
  return { type: 'parameterNode', parameter, label } as ParameterMetadata;
}

function leaf(parameter: string, label: string, description?: string): ParameterMetadata {
  return {
    type: 'parameter',
    parameter,
    label,
    description,
    economy: true,
    household: true,
  } as ParameterMetadata;
}

export const UK_PATHS = {
  employeeNiMain: 'gov.hmrc.national_insurance.class_1.rates.employee.main',
  employerNi: 'gov.hmrc.national_insurance.class_1.rates.employer',
  niBusinessRates: 'gov.hmrc.business_rates.statistics.revenue.NORTHERN_IRELAND',
  londonBusinessRates: 'gov.hmrc.business_rates.statistics.revenue.LONDON',
  vatStandard: 'gov.hmrc.vat.standard_rate',
  vatReduced: 'gov.hmrc.vat.reduced_rate',
  vatCoverage: 'gov.simulation.microdata_vat_coverage',
  privatePension: 'gov.economic_assumptions.indices.obr.private_pension_index',
  ucDeductionsCap: 'gov.dwp.universal_credit.deductions.cap',
  ucTaper: 'gov.dwp.universal_credit.means_test.reduction_rate',
  ucChildLimit: 'gov.dwp.universal_credit.elements.child.limit.child_count',
  paReductionRate: 'gov.hmrc.income_tax.allowances.personal_allowance.reduction_rate',
  cgtBasic: 'gov.hmrc.cgt.basic_rate',
  cgtIndex: 'gov.economic_assumptions.indices.capital_gains',
  cgtElasticity: 'gov.simulation.capital_gains_responses.elasticity',
  pcSingle: 'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee.SINGLE',
  pcCouple: 'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee.COUPLE',
  pcCarer: 'gov.dwp.pension_credit.guarantee_credit.carer.addition',
  /** A two-letter key that is not a US state outside the US model. */
  waKeyed: 'gov.dft.rail.fares.WA',
  ubiCenter: 'gov.contrib.ubi_center.basic_income.amount',
  incomeTaxBasic: 'gov.hmrc.income_tax.rates.uk[0].rate',
  cgtHigher: 'gov.hmrc.cgt.higher_rate',
  taxableSources: 'gov.hmrc.income_tax.bases.taxable_income_sources',
  schoolMealsFree: 'gov.dfe.school_meals.free.income_limit',
} as const;

export function buildUkParameterCollection(): ParameterMetadataCollection {
  const p = UK_PATHS;
  const parameters: Record<string, ParameterMetadata> = {
    'gov.hmrc': node('gov.hmrc', 'HMRC'),
    'gov.hmrc.national_insurance': node('gov.hmrc.national_insurance', 'National Insurance'),
    'gov.hmrc.national_insurance.class_1': node('gov.hmrc.national_insurance.class_1', 'Class 1'),
    'gov.hmrc.national_insurance.class_1.rates': node(
      'gov.hmrc.national_insurance.class_1.rates',
      'Rates'
    ),
    'gov.hmrc.national_insurance.class_1.rates.employee': node(
      'gov.hmrc.national_insurance.class_1.rates.employee',
      'Employee'
    ),
    [p.employeeNiMain]: leaf(p.employeeNiMain, 'NI class 1 main rate'),
    [p.employerNi]: leaf(p.employerNi, 'NI employer rate'),
    'gov.hmrc.business_rates': node('gov.hmrc.business_rates', 'Business rates'),
    'gov.hmrc.business_rates.statistics': node('gov.hmrc.business_rates.statistics', 'Statistics'),
    'gov.hmrc.business_rates.statistics.revenue': node(
      'gov.hmrc.business_rates.statistics.revenue',
      'Revenue'
    ),
    [p.niBusinessRates]: leaf(p.niBusinessRates, 'NORTHERN IRELAND'),
    [p.londonBusinessRates]: leaf(p.londonBusinessRates, 'LONDON'),
    'gov.hmrc.vat': node('gov.hmrc.vat', 'vat'),
    [p.vatStandard]: leaf(p.vatStandard, 'VAT standard rate'),
    [p.vatReduced]: leaf(p.vatReduced, 'VAT reduced rate'),
    'gov.simulation': node('gov.simulation', 'Simulation'),
    [p.vatCoverage]: leaf(p.vatCoverage, 'microdata vat coverage'),
    'gov.economic_assumptions': node('gov.economic_assumptions', 'Economic assumptions'),
    'gov.economic_assumptions.indices': node('gov.economic_assumptions.indices', 'indices'),
    'gov.economic_assumptions.indices.obr': node('gov.economic_assumptions.indices.obr', 'obr'),
    [p.privatePension]: leaf(p.privatePension, 'private pension index'),
    [p.cgtIndex]: leaf(p.cgtIndex, 'capital gains'),
    'gov.simulation.capital_gains_responses': node(
      'gov.simulation.capital_gains_responses',
      'Capital gains responses'
    ),
    [p.cgtElasticity]: leaf(p.cgtElasticity, 'Capital gains elasticity'),
    'gov.hmrc.cgt': node('gov.hmrc.cgt', 'Capital Gains Tax'),
    [p.cgtBasic]: leaf(p.cgtBasic, 'Capital Gains Tax basic rate'),
    [p.cgtHigher]: leaf(p.cgtHigher, 'Capital Gains Tax higher rate'),
    'gov.hmrc.income_tax.rates': node('gov.hmrc.income_tax.rates', 'Tax rates'),
    'gov.hmrc.income_tax.rates.uk': node('gov.hmrc.income_tax.rates.uk', 'Income Tax main rates'),
    'gov.hmrc.income_tax.rates.uk[0]': node('gov.hmrc.income_tax.rates.uk[0]', 'bracket 1'),
    [p.incomeTaxBasic]: leaf(p.incomeTaxBasic, 'Basic rate'),
    'gov.hmrc.income_tax.bases': node('gov.hmrc.income_tax.bases', 'Bases'),
    [p.taxableSources]: leaf(p.taxableSources, 'Taxable income sources'),
    'gov.dfe': node('gov.dfe', 'Department for Education'),
    'gov.dfe.school_meals': node('gov.dfe.school_meals', 'School meals'),
    'gov.dfe.school_meals.free': node('gov.dfe.school_meals.free', 'Free school meals'),
    [p.schoolMealsFree]: leaf(p.schoolMealsFree, 'Free school meals income limit'),
    'gov.hmrc.income_tax': node('gov.hmrc.income_tax', 'Income Tax'),
    'gov.hmrc.income_tax.allowances': node('gov.hmrc.income_tax.allowances', 'Tax allowances'),
    'gov.hmrc.income_tax.allowances.personal_allowance': node(
      'gov.hmrc.income_tax.allowances.personal_allowance',
      'Personal allowance'
    ),
    [p.paReductionRate]: leaf(p.paReductionRate, 'Personal allowance phase-out rate'),
    'gov.dwp': node('gov.dwp', 'DWP'),
    'gov.dwp.universal_credit': node('gov.dwp.universal_credit', 'Universal Credit'),
    'gov.dwp.universal_credit.deductions': node(
      'gov.dwp.universal_credit.deductions',
      'Deductions'
    ),
    [p.ucDeductionsCap]: leaf(p.ucDeductionsCap, 'UC deductions cap'),
    'gov.dwp.universal_credit.means_test': node(
      'gov.dwp.universal_credit.means_test',
      'Means test'
    ),
    [p.ucTaper]: leaf(
      p.ucTaper,
      'Universal Credit earned income reduction rate',
      'Rate at which Universal Credit is reduced with earnings above the work allowance.'
    ),
    'gov.dwp.universal_credit.elements': node('gov.dwp.universal_credit.elements', 'Elements'),
    'gov.dwp.universal_credit.elements.child': node(
      'gov.dwp.universal_credit.elements.child',
      'Child'
    ),
    'gov.dwp.universal_credit.elements.child.limit': node(
      'gov.dwp.universal_credit.elements.child.limit',
      'limit'
    ),
    [p.ucChildLimit]: leaf(p.ucChildLimit, 'Universal Credit child element child limit'),
    'gov.dwp.pension_credit': node('gov.dwp.pension_credit', 'Pension Credit'),
    'gov.dwp.pension_credit.guarantee_credit': node(
      'gov.dwp.pension_credit.guarantee_credit',
      'Guarantee credit'
    ),
    'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee': node(
      'gov.dwp.pension_credit.guarantee_credit.minimum_guarantee',
      'Pension Credit minimum guarantee'
    ),
    [p.pcSingle]: leaf(p.pcSingle, 'SINGLE'),
    [p.pcCouple]: leaf(p.pcCouple, 'COUPLE'),
    'gov.dwp.pension_credit.guarantee_credit.carer': node(
      'gov.dwp.pension_credit.guarantee_credit.carer',
      'carer'
    ),
    [p.pcCarer]: leaf(p.pcCarer, 'Pension Credit carer addition'),
    'gov.dft': node('gov.dft', 'Department for Transport'),
    'gov.dft.rail': node('gov.dft.rail', 'Rail'),
    'gov.dft.rail.fares': node('gov.dft.rail.fares', 'Rail fares'),
    [p.waKeyed]: leaf(p.waKeyed, 'WA'),
    'gov.contrib': node('gov.contrib', 'Contributed'),
    'gov.contrib.ubi_center': node('gov.contrib.ubi_center', 'UBI Center'),
    'gov.contrib.ubi_center.basic_income': node(
      'gov.contrib.ubi_center.basic_income',
      'Basic income'
    ),
    [p.ubiCenter]: leaf(p.ubiCenter, 'Basic income amount'),
  };
  // Raw region keys outvote the one real "National Insurance" label on
  // initialism count alone — the trap that sent "NI" to Northern Ireland.
  for (const series of ['bus.boardings', 'bus.yield', 'rents']) {
    const path = `gov.dft.${series}.NORTHERN_IRELAND`;
    parameters[path] = leaf(path, 'NORTHERN IRELAND');
  }
  return parameters as unknown as ParameterMetadataCollection;
}
