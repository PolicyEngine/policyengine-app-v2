import type {
  ParameterMetadata,
  ParameterMetadataCollection,
} from '@/types/metadata/parameterMetadata';

const STATE_CODES = [
  'al',
  'ak',
  'az',
  'ar',
  'ca',
  'co',
  'ct',
  'de',
  'fl',
  'ga',
  'hi',
  'id',
  'il',
  'in',
  'ia',
  'ks',
  'ky',
  'la',
  'me',
  'md',
  'ma',
  'mi',
  'mn',
  'ms',
  'mo',
  'mt',
  'ne',
  'nv',
  'nh',
  'nj',
  'nm',
  'ny',
  'nc',
  'nd',
  'oh',
  'ok',
  'or',
  'pa',
  'ri',
  'sc',
  'sd',
  'tn',
  'tx',
  'ut',
  'vt',
  'va',
  'wa',
  'wv',
  'wi',
  'wy',
  'dc',
] as const;

function node(parameter: string, label: string): ParameterMetadata {
  return { type: 'parameterNode', parameter, label };
}

function leaf(parameter: string, label: string): ParameterMetadata {
  return {
    type: 'parameter',
    parameter,
    label,
    economy: true,
    household: true,
  };
}

export function buildSearchQualityParameterCollection(): ParameterMetadataCollection {
  const parameters: ParameterMetadataCollection = {
    'gov.irs': node('gov.irs', 'IRS'),
    'gov.irs.credits': node('gov.irs.credits', 'credits'),
    'gov.irs.credits.ctc': node('gov.irs.credits.ctc', 'child tax credit'),
    'gov.irs.credits.ctc.amount': leaf('gov.irs.credits.ctc.amount', 'amount'),
    'gov.irs.credits.eitc': node('gov.irs.credits.eitc', 'earned income tax credit'),
    'gov.irs.credits.eitc.maximum': leaf('gov.irs.credits.eitc.maximum', 'maximum'),
    'gov.irs.deductions': node('gov.irs.deductions', 'deductions'),
    'gov.irs.deductions.standard': node('gov.irs.deductions.standard', 'standard deduction'),
    'gov.irs.deductions.standard.amount': leaf('gov.irs.deductions.standard.amount', 'amount'),
    'gov.irs.income_tax': node('gov.irs.income_tax', 'income tax'),
    'gov.irs.income_tax.rate': leaf('gov.irs.income_tax.rate', 'rate'),
    'gov.ssa': node('gov.ssa', 'Social Security Administration'),
    'gov.ssa.ssi': node('gov.ssa.ssi', 'SSI'),
    'gov.ssa.ssi.amount': leaf('gov.ssa.ssi.amount', 'amount'),
    'gov.usda': node('gov.usda', 'USDA'),
    'gov.usda.snap': node('gov.usda.snap', 'SNAP'),
    'gov.usda.snap.maximum_allotment': leaf('gov.usda.snap.maximum_allotment', 'maximum allotment'),
    'gov.contrib.ctc': node('gov.contrib.ctc', 'child tax credit'),
    'gov.contrib.ctc.additional_bracket': node(
      'gov.contrib.ctc.additional_bracket',
      'additional bracket'
    ),
    'gov.contrib.ctc.additional_bracket.threshold': leaf(
      'gov.contrib.ctc.additional_bracket.threshold',
      'threshold'
    ),
    'gov.contrib.states.ny': node('gov.contrib.states.ny', 'New York'),
    'gov.contrib.states.ny.wftc': node('gov.contrib.states.ny.wftc', 'Working Families Tax Credit'),
    'gov.contrib.states.ny.wftc.eitc': node(
      'gov.contrib.states.ny.wftc.eitc',
      'earned income tax credit'
    ),
    'gov.contrib.states.ny.wftc.eitc.match': leaf('gov.contrib.states.ny.wftc.eitc.match', 'match'),
  };

  for (const stateCode of STATE_CODES) {
    const statePath = `gov.states.${stateCode}`;
    const incomeTaxPath = `${statePath}.income_tax`;
    parameters[statePath] = node(statePath, stateCode.toUpperCase());
    parameters[incomeTaxPath] = node(incomeTaxPath, 'income tax');
    parameters[`${incomeTaxPath}.rate`] = leaf(`${incomeTaxPath}.rate`, 'rate');
  }

  const californiaEitcPath = 'gov.states.ca.tax.credits.earned_income';
  parameters['gov.states.ca.tax'] = node('gov.states.ca.tax', 'tax');
  parameters['gov.states.ca.tax.credits'] = node('gov.states.ca.tax.credits', 'credits');
  parameters[californiaEitcPath] = node(californiaEitcPath, 'earned income tax credit');
  parameters[`${californiaEitcPath}.match`] = leaf(`${californiaEitcPath}.match`, 'match');

  return parameters;
}

export function buildLargeParameterCollection(
  syntheticParameterCount = 12_000
): ParameterMetadataCollection {
  const parameters = buildSearchQualityParameterCollection();
  parameters['gov.synthetic'] = node('gov.synthetic', 'synthetic parameters');

  for (let index = 0; index < syntheticParameterCount; index += 1) {
    const suffix = index.toString().padStart(5, '0');
    const path = `gov.synthetic.item_${suffix}`;
    parameters[path] = leaf(path, `synthetic entry ${suffix}`);
  }

  return parameters;
}

/** States in the jurisdiction fixture, by the name their metadata node carries. */
export const JURISDICTION_STATE_NAMES = {
  ga: 'Georgia',
  id: 'Idaho',
  or: 'Oregon',
  ny: 'New York',
} as const;

/** A no-income-tax state whose node the live metadata labels only with its code. */
export const CODE_ONLY_STATE = 'fl';

export const FEDERAL_CTC_PATH = 'gov.irs.credits.ctc.amount.adult_dependent';
export const FEDERAL_TOP_RATE_PATH = 'gov.irs.income.bracket.rates.7';
export const NYC_LOCAL_RATE_PATH = 'gov.local.ny.mamdani_income_tax.rate';
export const MD_LOCAL_RATE_PATH = 'gov.local.md.flat_rate.rate';
export const NY_STATE_RATE_PATH = 'gov.states.ny.tax.income.rate';
export const CONTRIB_LOCAL_PATH = 'gov.contrib.local.nyc.stc.income_limit';

/**
 * Federal, state and local versions of the same programs, shaped like the
 * live US tree: state leaves restate the program in their own label
 * ("Oregon child tax credit amount") while federal leaves lean on their
 * breadcrumb, which is what lets fuzzy scoring alone rank state copies
 * above the federal original.
 */
export function buildJurisdictionParameterCollection(): ParameterMetadataCollection {
  const parameters: ParameterMetadataCollection = {
    'gov.irs': node('gov.irs', 'Internal Revenue Service (IRS)'),
    'gov.irs.credits': node('gov.irs.credits', 'Credits'),
    'gov.irs.credits.ctc': node('gov.irs.credits.ctc', 'Child Tax Credit'),
    'gov.irs.credits.ctc.amount': node('gov.irs.credits.ctc.amount', 'Amount'),
    [FEDERAL_CTC_PATH]: leaf(FEDERAL_CTC_PATH, 'Child tax credit for adult dependents'),
    'gov.irs.income': node('gov.irs.income', 'income'),
    'gov.irs.income.bracket': node('gov.irs.income.bracket', 'bracket'),
    'gov.irs.income.bracket.rates': node(
      'gov.irs.income.bracket.rates',
      'Individual income tax rates'
    ),
    [FEDERAL_TOP_RATE_PATH]: leaf(FEDERAL_TOP_RATE_PATH, '7'),
    'gov.states': node('gov.states', 'States'),
    'gov.local': node('gov.local', 'Local'),
    'gov.local.ny': node('gov.local.ny', 'ny'),
    'gov.local.ny.mamdani_income_tax': node(
      'gov.local.ny.mamdani_income_tax',
      'Mamdani income tax'
    ),
    [NYC_LOCAL_RATE_PATH]: leaf(NYC_LOCAL_RATE_PATH, 'NYC income tax rate'),
    'gov.local.md': node('gov.local.md', 'md'),
    'gov.local.md.flat_rate': node('gov.local.md.flat_rate', 'Flat rate'),
    [MD_LOCAL_RATE_PATH]: leaf(MD_LOCAL_RATE_PATH, 'County income tax rate'),
    'gov.contrib.local': node('gov.contrib.local', 'Local'),
    'gov.contrib.local.nyc': node('gov.contrib.local.nyc', 'nyc'),
    'gov.contrib.local.nyc.stc': node('gov.contrib.local.nyc.stc', 'School tax credit'),
    [CONTRIB_LOCAL_PATH]: leaf(CONTRIB_LOCAL_PATH, 'NYC income tax credit income limit'),
    [`gov.states.${CODE_ONLY_STATE}`]: node(`gov.states.${CODE_ONLY_STATE}`, CODE_ONLY_STATE),
  };

  for (const [code, name] of Object.entries(JURISDICTION_STATE_NAMES)) {
    const statePath = `gov.states.${code}`;
    const ctcPath = `${statePath}.tax.income.credits.ctc.amount`;
    const ratePath = `${statePath}.tax.income.rate`;
    parameters[statePath] = node(statePath, name);
    parameters[ctcPath] = leaf(ctcPath, `${name} child tax credit amount`);
    parameters[ratePath] = leaf(ratePath, `${name} income tax rate`);
  }

  return parameters;
}

/**
 * More best-matching state parameters than the re-rank candidate cap
 * (4,000), inserted ahead of the lone federal parameter so index order
 * alone would leave it outside the cap.
 */
export const CROWDED_FEDERAL_PATH = 'gov.irs.deductions.standard.amount';

export function buildCrowdedStateParameterCollection(
  perStateCount = 80
): ParameterMetadataCollection {
  const parameters: ParameterMetadataCollection = {};
  for (const code of STATE_CODES) {
    for (let index = 0; index < perStateCount; index += 1) {
      const path = `gov.states.${code}.tax.income.deductions.standard.amount_${index}`;
      parameters[path] = leaf(path, `${code} standard deduction amount ${index}`);
    }
  }
  parameters['gov.irs'] = node('gov.irs', 'Internal Revenue Service (IRS)');
  parameters['gov.irs.deductions'] = node('gov.irs.deductions', 'Deductions');
  parameters['gov.irs.deductions.standard'] = node(
    'gov.irs.deductions.standard',
    'Standard deduction'
  );
  parameters[CROWDED_FEDERAL_PATH] = leaf(CROWDED_FEDERAL_PATH, 'Standard deduction amount');
  return parameters;
}

/** The federal child tax credit's per-child amount: a bracket member labelled only "amount". */
export const CTC_BASE_AMOUNT_PATH = 'gov.irs.credits.ctc.amount.base[0].amount';

/**
 * The federal child tax credit as the live metadata lays it out. Most
 * leaves restate the program in their own label ("CTC phase-out
 * amount"); the per-child amount sits in a bracket schedule whose label
 * ("Child Tax Credit amount") the breadcrumb skips, so its own label is
 * just "amount".
 */
export function buildFederalCtcParameterCollection(): ParameterMetadataCollection {
  const ctc = 'gov.irs.credits.ctc';
  const parameters: ParameterMetadataCollection = {
    'gov.irs': node('gov.irs', 'Internal Revenue Service (IRS)'),
    'gov.irs.credits': node('gov.irs.credits', 'Credits'),
    [ctc]: node(ctc, 'Child Tax Credit'),
    [`${ctc}.amount`]: node(`${ctc}.amount`, 'amount'),
    [`${ctc}.amount.adult_dependent`]: leaf(
      `${ctc}.amount.adult_dependent`,
      'Child tax credit for adult dependents'
    ),
    [`${ctc}.adult_ssn_requirement_applies`]: leaf(
      `${ctc}.adult_ssn_requirement_applies`,
      'Child Tax Credit adult identification requirement applies'
    ),
    [`${ctc}.child_ssn_requirement_applies`]: leaf(
      `${ctc}.child_ssn_requirement_applies`,
      'Child Tax Credit child identification requirement applies'
    ),
    [`${ctc}.refundable`]: node(`${ctc}.refundable`, 'Refundability'),
    [`${ctc}.refundable.individual_max`]: leaf(
      `${ctc}.refundable.individual_max`,
      'Child tax credit refundable maximum amount'
    ),
    [`${ctc}.refundable.fully_refundable`]: leaf(
      `${ctc}.refundable.fully_refundable`,
      'Fully refundable CTC'
    ),
    [`${ctc}.refundable.phase_in`]: node(`${ctc}.refundable.phase_in`, 'Phase-in'),
    [`${ctc}.refundable.phase_in.rate`]: leaf(
      `${ctc}.refundable.phase_in.rate`,
      'CTC refundable phase-in rate'
    ),
    [`${ctc}.refundable.phase_in.threshold`]: leaf(
      `${ctc}.refundable.phase_in.threshold`,
      'CTC refundable phase-in threshold'
    ),
    [`${ctc}.phase_out`]: node(`${ctc}.phase_out`, 'Phase-out'),
    [`${ctc}.phase_out.amount`]: leaf(`${ctc}.phase_out.amount`, 'CTC phase-out amount'),
    [`${ctc}.phase_out.increment`]: leaf(
      `${ctc}.phase_out.increment`,
      'CTC phase-out increment (ARPA)'
    ),
    [`${ctc}.phase_out.threshold`]: node(`${ctc}.phase_out.threshold`, 'CTC phase-out threshold'),
    [`${ctc}.phase_out.arpa`]: node(`${ctc}.phase_out.arpa`, 'ARPA'),
    [`${ctc}.phase_out.arpa.amount`]: leaf(
      `${ctc}.phase_out.arpa.amount`,
      'CTC phase-out amount (ARPA)'
    ),
    [`${ctc}.phase_out.arpa.increment`]: leaf(
      `${ctc}.phase_out.arpa.increment`,
      'CTC phase-out increment'
    ),
    [`${ctc}.phase_out.arpa.in_effect`]: leaf(
      `${ctc}.phase_out.arpa.in_effect`,
      'CTC ARPA phase-out in effect'
    ),
  };
  for (const status of ['SINGLE', 'JOINT', 'SEPARATE', 'HEAD_OF_HOUSEHOLD', 'SURVIVING_SPOUSE']) {
    const path = `${ctc}.phase_out.threshold.${status}`;
    parameters[path] = leaf(path, status.replace(/_/g, ' '));
  }
  // The bracket schedules: their own labels name them, their members do not.
  for (const [schedule, label] of [
    ['base', 'Child Tax Credit amount'],
    ['arpa', 'Child Tax Credit ARPA amount'],
  ]) {
    const schedulePath = `${ctc}.amount.${schedule}`;
    parameters[schedulePath] = node(schedulePath, label);
    for (const index of [0, 1]) {
      const bracketPath = `${schedulePath}[${index}]`;
      parameters[bracketPath] = node(bracketPath, `bracket ${index + 1}`);
      parameters[`${bracketPath}.amount`] = leaf(`${bracketPath}.amount`, 'amount');
      parameters[`${bracketPath}.threshold`] = leaf(`${bracketPath}.threshold`, 'threshold');
    }
  }
  return parameters;
}
