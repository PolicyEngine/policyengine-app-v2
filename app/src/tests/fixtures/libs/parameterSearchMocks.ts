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
