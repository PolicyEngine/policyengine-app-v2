/**
 * Test fixtures for parameterLabels utility functions
 */

import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * Test parameter names representing different hierarchical depths
 */
export const TEST_PARAM_NAMES = {
  SINGLE_LEVEL: 'gov',
  TWO_LEVELS: 'gov.irs',
  THREE_LEVELS: 'gov.irs.credits',
  FOUR_LEVELS: 'gov.irs.credits.eitc',
  FIVE_LEVELS: 'gov.irs.credits.eitc.max',
  SIX_LEVELS: 'gov.irs.credits.eitc.max[0].amount',
  WITH_BRACKETS: 'gov.irs.income.bracket.rates[1]',
} as const;

/**
 * Mock parameter metadata collection for testing
 * Note: Matches actual metadata structure from US_Metadata.json
 */
export const MOCK_PARAMETER_METADATA: ParameterMetadataCollection = {
  'gov.irs': {
    label: 'Internal Revenue Service (IRS)',
    type: 'parameterNode',
    parameter: 'gov.irs',
    unit: '',
  },
  'gov.irs.credits': {
    label: 'credits',
    type: 'parameterNode',
    parameter: 'gov.irs.credits',
    unit: '',
  },
  'gov.irs.credits.eitc': {
    label: 'Earned Income Tax Credit',
    type: 'parameterNode',
    parameter: 'gov.irs.credits.eitc',
    unit: '',
  },
  'gov.irs.credits.eitc.max': {
    label: 'EITC maximum amount by number of children',
    type: 'parameterNode',
    parameter: 'gov.irs.credits.eitc.max',
    unit: '',
  },
  'gov.irs.credits.eitc.max[0]': {
    label: 'bracket 1',
    type: 'parameterNode',
    parameter: 'gov.irs.credits.eitc.max[0]',
    unit: '',
  },
  'gov.irs.credits.eitc.max[0].amount': {
    label: 'amount',
    type: 'parameter',
    parameter: 'gov.irs.credits.eitc.max[0].amount',
    unit: 'currency-USD',
  },
  'gov.irs.income': {
    label: 'income',
    type: 'parameterNode',
    parameter: 'gov.irs.income',
    unit: '',
  },
  'gov.irs.income.bracket': {
    label: 'bracket',
    type: 'parameterNode',
    parameter: 'gov.irs.income.bracket',
    unit: '',
  },
  'gov.irs.income.bracket.rates': {
    label: 'Individual income tax rates',
    type: 'parameterNode',
    parameter: 'gov.irs.income.bracket.rates',
    unit: '',
  },
};

/**
 * Expected hierarchical labels after processing
 * Note: Sentence case is applied (first letter capitalized, rest lowercase)
 * Note: Paths like 'gov.irs.credits.eitc.max[0].amount' split to parts that skip intermediate 'max' level
 */
export const EXPECTED_HIERARCHICAL_LABELS = {
  SINGLE_LEVEL: [],
  TWO_LEVELS: ['Internal revenue service (irs)'],
  THREE_LEVELS: ['Internal revenue service (irs)', 'Credits'],
  FOUR_LEVELS: ['Internal revenue service (irs)', 'Credits', 'Earned income tax credit'],
  FIVE_LEVELS: [
    'Internal revenue service (irs)',
    'Credits',
    'Earned income tax credit',
    'Eitc maximum amount by number of children',
  ],
  // For SIX_LEVELS: path splits to [...'eitc', 'max[0]', 'amount'] so 'max' level is skipped
  SIX_LEVELS: ['Internal revenue service (irs)', 'Credits', 'Earned income tax credit', 'Bracket 1', 'Amount'],
  // For WITH_BRACKETS: path ends at rates[1] which has no metadata, so rates level is last
  WITH_BRACKETS: ['Internal revenue service (irs)', 'Income', 'Bracket'],
} as const;

/**
 * Expected compact label results (first + last strategy)
 */
export const EXPECTED_COMPACT_LABELS = {
  ZERO_ITEMS: {
    displayParts: [] as string[],
    hasMore: false,
  },
  ONE_ITEM: {
    displayParts: ['First'] as string[],
    hasMore: false,
  },
  TWO_ITEMS: {
    displayParts: ['First', 'Second'] as string[],
    hasMore: false,
  },
  THREE_ITEMS: {
    displayParts: ['First', 'Second', 'Third'] as string[],
    hasMore: false,
  },
  FOUR_ITEMS: {
    displayParts: ['First', '...', 'Third', 'Fourth'] as string[],
    hasMore: true,
  },
  FIVE_ITEMS: {
    displayParts: ['First', '...', 'Fourth', 'Fifth'] as string[],
    hasMore: true,
  },
  SIX_ITEMS: {
    displayParts: ['First', '...', 'Fifth', 'Sixth'] as string[],
    hasMore: true,
  },
};

/**
 * Test label arrays for compact label testing
 */
export const TEST_LABEL_ARRAYS = {
  EMPTY: [] as string[],
  ONE_ITEM: ['First'] as string[],
  TWO_ITEMS: ['First', 'Second'] as string[],
  THREE_ITEMS: ['First', 'Second', 'Third'] as string[],
  FOUR_ITEMS: ['First', 'Second', 'Third', 'Fourth'] as string[],
  FIVE_ITEMS: ['First', 'Second', 'Third', 'Fourth', 'Fifth'] as string[],
  SIX_ITEMS: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'] as string[],
};

/**
 * Expected formatted strings with arrow separators
 */
export const EXPECTED_FORMATTED_STRINGS = {
  EMPTY: '',
  ONE_ITEM: 'First',
  TWO_ITEMS: 'First → Second',
  THREE_ITEMS: 'First → Second → Third',
  FOUR_ITEMS_COMPACT: 'First → ... → Third → Fourth',
  FIVE_ITEMS_COMPACT: 'First → ... → Fourth → Fifth',
  SIX_ITEMS_COMPACT: 'First → ... → Fifth → Sixth',
} as const;

/**
 * Test strings for sentence case conversion
 */
export const SENTENCE_CASE_TESTS = {
  LOWERCASE: {
    input: 'internal revenue service',
    expected: 'Internal revenue service',
  },
  UPPERCASE: {
    input: 'INTERNAL REVENUE SERVICE',
    expected: 'Internal revenue service',
  },
  MIXED_CASE: {
    input: 'InTeRnAl ReVeNuE SeRvIcE',
    expected: 'Internal revenue service',
  },
  WITH_SPECIAL_CHARS: {
    input: 'internal revenue service (IRS)',
    expected: 'Internal revenue service (irs)',
  },
  SINGLE_CHAR: {
    input: 'a',
    expected: 'A',
  },
  EMPTY: {
    input: '',
    expected: '',
  },
} as const;
